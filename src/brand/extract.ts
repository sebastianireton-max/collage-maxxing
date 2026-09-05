import * as cheerio from 'cheerio';
import type { BrandColor, BrandProfile, BrandPalette, BrandType } from './types.js';
import { distance, isBrandCandidate, parseColor, shift, toHex, luminance } from './color.js';

const UA = 'Mozilla/5.0 (compatible; CollageMaxxing/0.1; +brand-profiler)';
const FETCH_TIMEOUT_MS = 15_000;
/** ponytail: cap stylesheets at 6, raise if real prospect sites split CSS further. */
const MAX_STYLESHEETS = 6;

async function get(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<string> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'text/html,text/css,*/*' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

const abs = (href: string | undefined, base: string): string | undefined => {
  if (!href) return undefined;
  try { return new URL(href, base).toString(); } catch { return undefined; }
};

/** Strips comments so commented-out colours and fonts do not pollute the counts. */
const decomment = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// ---------------------------------------------------------------- colours

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]{5,60}\)|hsla?\([^)]{5,60}\)/g;
/** Custom properties whose names imply the value is a real brand colour. */
const BRAND_TOKEN_RE = /--(?:[\w-]*)(brand|primary|secondary|accent|theme|main|highlight)(?:[\w-]*)\s*:\s*([^;}]+)/gi;

export function extractPalette(css: string, warnings: string[]): BrandPalette {
  const scored = new Map<string, BrandColor>();

  const record = (raw: string, declared: boolean, token?: string) => {
    const rgb = parseColor(raw);
    if (!rgb || !isBrandCandidate(rgb)) return;
    const hex = toHex(rgb);
    const prev = scored.get(hex);
    if (prev) {
      prev.hits += 1;
      // A declared token is better evidence than an incidental usage, so keep it.
      if (declared && !prev.declared) { prev.declared = true; prev.token = token; }
    } else {
      scored.set(hex, { hex, hits: 1, declared, token });
    }
  };

  // Declared brand tokens first: they are the site telling us its own palette.
  for (const m of css.matchAll(BRAND_TOKEN_RE)) record(m[2] ?? '', true, `--${m[1]}`);
  for (const m of css.matchAll(COLOR_RE)) record(m[0], false);

  // Collapse shades that read as the same colour, keeping the better-evidenced one.
  // Raw hit count alone picks decorative washes over the real brand colour: a pale
  // background tint repeated in a dozen rules beats a purple used deliberately.
  // So weight by evidence quality (a declared token is worth far more than an
  // incidental usage) and by luminance, since brand colours sit in the mid range
  // rather than at the pale or near-black extremes.
  const score = (c: BrandColor) => {
    const lum = luminance(parseColor(c.hex)!);
    const midness = 1 - Math.min(1, Math.abs(lum - 0.3) / 0.55);
    return c.hits * (c.declared ? 12 : 1) * (0.25 + 0.75 * midness);
  };
  const ranked = [...scored.values()].sort((a, b) => score(b) - score(a));
  const distinct: BrandColor[] = [];
  for (const c of ranked) {
    const rgb = parseColor(c.hex)!;
    if (distinct.some((d) => distance(parseColor(d.hex)!, rgb) < 40)) continue;
    distinct.push(c);
  }

  if (distinct.length === 0) {
    warnings.push('No brand colours found in CSS; fell back to a neutral palette.');
    return { primary: '#1b2a6e', secondary: '#0d1130', accent: '#4f6bd8', ink: '#101322', paper: '#ffffff', candidates: [] };
  }

  const primary = distinct[0]!.hex;
  const primaryRgb = parseColor(primary)!;
  // Secondary is the next distinct colour; accent is the most different, so the pair has tension.
  const secondary = distinct[1]?.hex ?? toHex(shift(primaryRgb, -0.45));
  const accent =
    distinct.slice(1).sort((a, b) =>
      distance(parseColor(b.hex)!, primaryRgb) - distance(parseColor(a.hex)!, primaryRgb)
    )[0]?.hex ?? toHex(shift(primaryRgb, 0.35));

  return {
    primary,
    secondary,
    accent,
    ink: luminance(primaryRgb) < 0.25 ? toHex(shift(primaryRgb, -0.25)) : '#101322',
    paper: '#ffffff',
    candidates: distinct.slice(0, 12),
  };
}

// ---------------------------------------------------------------- type

const GENERIC_FONTS = new Set([
  'inherit', 'initial', 'unset', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', '-apple-system', 'blinkmacsystemfont', 'ui-sans-serif', 'ui-serif', 'ui-monospace',
  'segoe ui', 'roboto', 'helvetica neue', 'helvetica', 'arial', 'apple color emoji',
  'segoe ui emoji', 'segoe ui symbol', 'noto color emoji', 'sans', 'emoji',
]);

export function extractType(css: string, googleFonts: string[]): BrandType {
  const counts = new Map<string, number>();
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    // Only the first family in a stack is a choice; the rest are fallbacks.
    const first = m[1]!.split(',')[0]!.trim().replace(/^["']|["']$/g, '');
    const key = first.toLowerCase();
    if (!first || GENERIC_FONTS.has(key) || key.startsWith('var(')) continue;
    counts.set(first, (counts.get(first) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
  // Google Fonts links are an explicit choice, so they outrank frequency counts.
  const ordered = [...googleFonts, ...ranked.filter((f) => !googleFonts.includes(f))];
  return {
    heading: ordered[0] ?? 'Inter',
    body: ordered[1] ?? ordered[0] ?? 'Inter',
    googleFonts,
  };
}

// ---------------------------------------------------------------- contact

const SOCIAL_HOSTS: Record<string, string> = {
  'facebook.com': 'facebook', 'instagram.com': 'instagram', 'x.com': 'x', 'twitter.com': 'x',
  'linkedin.com': 'linkedin', 'youtube.com': 'youtube', 'tiktok.com': 'tiktok', 'yelp.com': 'yelp',
};

const NAV_NOISE = /^(home|about|about us|contact|contact us|blog|news|login|log in|sign in|sign up|cart|shop|menu|search|faq|privacy|terms|careers)$/i;

/** Material/icon-font ligature names that render as glyphs but scrape as words. */
const ICON_LIGATURES = /\b(local_phone|person_outline|arrow_forward|arrow_back|expand_more|expand_less|chevron_right|chevron_left|menu_open|shopping_cart|keyboard_arrow_\w+|search|close)\b/gi;

/**
 * Nav text scrapes dirty: icon fonts leak ligature names, and a label duplicated for
 * mobile and desktop concatenates into "Sign inSign in". Strip both.
 */
export function cleanLabel(raw: string): string {
  let t = raw.replace(ICON_LIGATURES, ' ').replace(/\s+/g, ' ').trim();
  // Collapse an exactly-doubled label back to one copy.
  const half = t.length / 2;
  if (t.length % 2 === 0 && t.slice(0, half) === t.slice(half)) t = t.slice(0, half);
  // Drop a trailing phone number glued onto a nav label.
  t = t.replace(/[\s(]*\+?\d[\d\s().-]{7,}$/, '').trim();
  return t;
}

// ---------------------------------------------------------------- main

export async function extractBrand(inputUrl: string): Promise<BrandProfile> {
  const warnings: string[] = [];
  const url = /^https?:\/\//i.test(inputUrl) ? inputUrl : `https://${inputUrl}`;
  const html = await get(url);
  const $ = cheerio.load(html);

  const meta = (sel: string) => $(sel).attr('content')?.trim() || undefined;

  // --- stylesheets -------------------------------------------------
  let css = $('style').map((_, el) => $(el).text()).get().join('\n');
  css += '\n' + $('[style]').map((_, el) => $(el).attr('style') ?? '').get().join(';\n');

  const sheets = $('link[rel~="stylesheet"]')
    .map((_, el) => abs($(el).attr('href'), url))
    .get()
    .filter((h): h is string => Boolean(h))
    .slice(0, MAX_STYLESHEETS);

  const fetched = await Promise.allSettled(sheets.map((h) => get(h, 8000)));
  fetched.forEach((r, i) => {
    if (r.status === 'fulfilled') css += '\n' + r.value;
    else warnings.push(`Stylesheet failed: ${sheets[i]}`);
  });
  css = decomment(css);
  if (css.trim().length < 200) warnings.push('Very little CSS recovered, so palette confidence is low.');

  // --- google fonts ------------------------------------------------
  const googleFonts = [
    ...new Set(
      $('link[href*="fonts.googleapis.com"]')
        .map((_, el) => $(el).attr('href') ?? '')
        .get()
        .flatMap((href) =>
          [...href.matchAll(/family=([^&:;]+)/g)].map((m) => decodeURIComponent(m[1]!).replace(/\+/g, ' ').trim())
        )
        .filter(Boolean)
    ),
  ];

  // --- identity ----------------------------------------------------
  const rawName =
    meta('meta[property="og:site_name"]') ||
    $('title').first().text().trim() ||
    new URL(url).hostname.replace(/^www\./, '');
  // Titles are usually "Brand | Tagline", so the first segment is the name.
  const segments = rawName.split(/\s[|–—-]\s/);
  const name = segments[0]!.trim() || rawName;
  const tagline = segments.length > 1 ? segments.slice(1).join(' - ').trim() : $('h1').first().text().trim();

  const logoUrl =
    abs($('img[class*="logo" i], img[id*="logo" i], img[alt*="logo" i], header img').first().attr('src'), url) ||
    abs($('img[src*="logo" i]').first().attr('src'), url);

  // --- contact -----------------------------------------------------
  const socials: Record<string, string> = {};
  $('a[href]').each((_, el) => {
    const href = abs($(el).attr('href'), url);
    if (!href) return;
    try {
      const host = new URL(href).hostname.replace(/^www\./, '');
      const key = SOCIAL_HOSTS[host];
      if (key && !socials[key]) socials[key] = href;
    } catch { /* unparseable href, skip */ }
  });

  const text = $('body').text().replace(/\s+/g, ' ');
  // A tel: link is unambiguous. The text fallback must look like a real phone number:
  // grouped digits with separators, not a bare run. A loose \d{8,} pattern matches dates,
  // order numbers and prices, which is how "2026-02-20" got read as a phone number.
  const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?!\d)/;
  const phone =
    $('a[href^="tel:"]').first().attr('href')?.replace('tel:', '').trim() ||
    PHONE_RE.exec(text)?.[0]?.trim();
  const email = $('a[href^="mailto:"]').first().attr('href')?.replace('mailto:', '').split('?')[0]?.trim();
  const address = $('address').first().text().replace(/\s+/g, ' ').trim() || undefined;

  // --- services from nav -------------------------------------------
  const services = [
    ...new Set(
      $('nav a, header a')
        .map((_, el) => cleanLabel($(el).text()))
        .get()
        .filter((t) => t.length > 2 && t.length < 40 && !NAV_NOISE.test(t))
    ),
  ].slice(0, 8);

  // --- voice -------------------------------------------------------
  const voiceSample = [
    ...new Set(
      $('h1, h2, h3, p')
        .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
        .get()
        .filter((t) => t.length > 40 && t.length < 300)
    ),
  ].slice(0, 8);

  if (!logoUrl) warnings.push('No logo image found, so the demo will use a wordmark.');
  if (services.length === 0) warnings.push('No usable nav items, so demo sections will be generic.');

  return {
    url,
    fetchedAt: new Date().toISOString(),
    identity: {
      name,
      tagline: tagline || meta('meta[name="description"]')?.slice(0, 120) || '',
      description: meta('meta[name="description"]') || meta('meta[property="og:description"]') || '',
      logoUrl,
      faviconUrl: abs($('link[rel~="icon"], link[rel="shortcut icon"]').first().attr('href'), url),
      ogImageUrl: abs(meta('meta[property="og:image"]'), url),
    },
    palette: extractPalette(css, warnings),
    type: extractType(css, googleFonts),
    contact: { phone, email, address, socials },
    services,
    voiceSample,
    warnings,
  };
}
