/**
 * Ad sources.
 *
 * The important fact this file exists to handle: the Meta Ad Library API only
 * returns commercial ads (`ad_type=ALL`) when `ad_reached_countries` names EU
 * member states or the UK. Point it at the US and it answers with political and
 * social-issue ads only — an empty-looking result that reads as "this competitor
 * isn't advertising" when in fact the endpoint simply cannot see their ads.
 *
 * So every source carries a `coverage` string that the UI must show, and the
 * Meta source warns explicitly when it is queried outside its coverage.
 */
import type { Ad, AdSource, AdSourceQuery, Competitor } from './types.js';

/** EU member states plus the UK — where the Ad Library exposes commercial ads. */
const COMMERCIAL_AD_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'GB',
]);

export interface MetaAdLibraryOptions {
  accessToken: string;
  apiVersion?: string;
  /** Injected for testing. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export class MetaAdLibrarySource implements AdSource {
  readonly name = 'meta-ad-library';
  readonly coverage =
    'Meta Ad Library API. Commercial ads are only returned for audiences in the EU or UK; ' +
    'for every other country this endpoint returns political and social-issue ads only. ' +
    'Free tier is limited to roughly 200 calls per hour.';

  private readonly token: string;
  private readonly version: string;
  /**
   * Held unresolved on purpose. Binding `?? fetch` at construction captures
   * whatever fetch existed then, so a source built at module load ignores any
   * later replacement — which silently turns a test into a real call to Meta.
   */
  private readonly fetchImpl?: typeof fetch;

  constructor(opts: MetaAdLibraryOptions) {
    this.token = opts.accessToken;
    this.version = opts.apiVersion ?? 'v21.0';
    this.fetchImpl = opts.fetchImpl;
  }

  private get doFetch(): typeof fetch {
    return this.fetchImpl ?? globalThis.fetch;
  }

  /** True when this query can actually see commercial ads. */
  static coversCommercialAds(countries: string[] | undefined): boolean {
    return (countries ?? []).some((c) => COMMERCIAL_AD_COUNTRIES.has(c.toUpperCase()));
  }

  async fetchAds(query: AdSourceQuery): Promise<Ad[]> {
    const countries = query.countries?.length ? query.countries : ['GB'];
    const params = new URLSearchParams({
      access_token: this.token,
      ad_reached_countries: JSON.stringify(countries.map((c) => c.toUpperCase())),
      ad_type: 'ALL',
      ad_active_status: query.activeOnly === false ? 'ALL' : 'ACTIVE',
      limit: String(Math.min(query.limit ?? 25, 100)),
      fields: [
        'id', 'ad_creation_time', 'ad_delivery_start_time', 'ad_delivery_stop_time',
        'ad_creative_bodies', 'ad_creative_link_titles', 'ad_creative_link_captions',
        'ad_creative_link_descriptions', 'ad_snapshot_url', 'page_id', 'page_name',
        'publisher_platforms',
      ].join(','),
    });
    if (query.competitor.pageId) params.set('search_page_ids', JSON.stringify([query.competitor.pageId]));
    else params.set('search_terms', query.competitor.name);

    const res = await this.doFetch(`https://graph.facebook.com/${this.version}/ads_archive?${params}`);
    const text = await res.text();
    if (!res.ok) throw new Error(`Meta Ad Library ${res.status}: ${text.slice(0, 300)}`);

    const parsed = JSON.parse(text);
    return (parsed?.data ?? []).map((row: any) => toAd(row, query.competitor));
  }
}

function toAd(row: any, competitor: Competitor): Ad {
  const body = Array.isArray(row.ad_creative_bodies) ? row.ad_creative_bodies[0] : undefined;
  const headline = Array.isArray(row.ad_creative_link_titles) ? row.ad_creative_link_titles[0] : undefined;
  return {
    id: String(row.id),
    source: 'meta-ad-library',
    competitorId: competitor.id,
    permalink: row.ad_snapshot_url,
    creative: {
      // The archive gives copy and a snapshot page, not a direct media file.
      // Whether it is video is only knowable from the snapshot, so do not guess.
      kind: 'text',
      bodyText: body,
      headline,
      callToAction: Array.isArray(row.ad_creative_link_captions) ? row.ad_creative_link_captions[0] : undefined,
    },
    firstSeen: row.ad_delivery_start_time,
    lastSeen: row.ad_delivery_stop_time,
    active: !row.ad_delivery_stop_time,
    platforms: row.publisher_platforms,
    raw: row,
  };
}

// ---------------------------------------------------------------- manual

/**
 * Ads a human collected by hand — pasted Ad Library permalinks, a CSV export, or
 * a third-party tool's output.
 *
 * This is not a fallback, it is the source that works everywhere. A US business
 * cannot get commercial ads out of the Meta API at all, so without this the
 * tracker would be unusable for most tenants on day one.
 */
export class ManualAdSource implements AdSource {
  readonly name = 'manual';
  readonly coverage =
    'Ads entered by hand or imported from a file. Works for any country and any platform, ' +
    'because nothing is fetched from an ad platform API.';

  constructor(private readonly ads: Ad[] = []) {}

  async fetchAds(query: AdSourceQuery): Promise<Ad[]> {
    const mine = this.ads.filter((a) => a.competitorId === query.competitor.id);
    const filtered = query.activeOnly === false ? mine : mine.filter((a) => a.active !== false);
    return filtered.slice(0, query.limit ?? filtered.length);
  }
}

/**
 * Parses pasted Ad Library / TikTok / LinkedIn ad URLs into stub Ad records.
 * Deliberately records only what the URL proves — an id and a permalink. The
 * creative is filled in by whoever opens it, rather than guessed here.
 */
export function adsFromUrls(urls: string[], competitor: Competitor): Ad[] {
  const out: Ad[] = [];
  for (const raw of urls) {
    const url = raw.trim();
    if (!url) continue;
    let parsed: URL;
    try { parsed = new URL(url); } catch { continue; }

    const host = parsed.hostname.replace(/^www\./, '');
    const id =
      parsed.searchParams.get('id') ||
      parsed.pathname.split('/').filter(Boolean).pop() ||
      url;

    out.push({
      id,
      source: host.includes('tiktok') ? 'tiktok' : host.includes('linkedin') ? 'linkedin' : 'meta-ad-library',
      competitorId: competitor.id,
      permalink: url,
      creative: { kind: 'text' },
      active: true,
    });
  }
  // The same ad pasted twice is one ad.
  return [...new Map(out.map((a) => [`${a.source}:${a.id}`, a])).values()];
}
