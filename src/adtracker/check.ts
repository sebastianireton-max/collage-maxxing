/**
 * Ad tracker checks. Run via `npm run check` (src/check.ts calls this).
 *
 * The provider adapters are the risky part: each one is a different request
 * envelope and a different response path, and getting either wrong fails only
 * at runtime against a real key. So they are exercised against a stubbed fetch
 * that asserts the outgoing shape and returns each provider's real response
 * format.
 */
import assert from 'node:assert/strict';
import {
  AnthropicProvider,
  GoogleProvider,
  OpenAICompatibleProvider,
  ProviderError,
  createProvider,
} from './providers.js';
import { MetaAdLibrarySource, ManualAdSource, adsFromUrls } from './sources.js';
import { RewriteRejected, parseJsonObject, rewriteAd, validateRewrite } from './rewrite.js';
import type { Ad, Competitor, ModelProvider, Rewrite, TenantBrand } from './types.js';

type Check = (name: string, fn: () => void | Promise<void>) => Promise<void>;

/** Swaps global fetch for one call, capturing what was sent. */
async function withFetch<T>(
  handler: (url: string, init: RequestInit) => { status?: number; body: unknown },
  fn: () => Promise<T>,
): Promise<{ result: T; calls: { url: string; init: RequestInit }[] }> {
  const calls: { url: string; init: RequestInit }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: any, init: any) => {
    const url = typeof input === 'string' ? input : input.url;
    calls.push({ url, init });
    const { status = 200, body } = handler(url, init);
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  try {
    return { result: await fn(), calls };
  } finally {
    globalThis.fetch = original;
  }
}

const competitor: Competitor = { id: 'c1', name: 'Adam Hayley - Online Trainer Education', pageId: '123' };

const brand: TenantBrand = {
  businessName: 'Optimized Aminos',
  offer: 'research peptides for laboratory use',
  audience: 'clinics and research buyers',
  forbiddenClaims: ['cures', 'safe for human consumption'],
  requiredDisclaimer: 'Research use only. Not for human or animal consumption.',
};

const ad: Ad = {
  id: 'ad1',
  source: 'manual',
  competitorId: 'c1',
  creative: { kind: 'video', bodyText: 'Lose 20lb in 30 days, guaranteed.' },
  active: true,
};

/** A provider that returns whatever script we hand it. */
function fakeProvider(scripts: string[]): ModelProvider {
  let i = 0;
  return {
    name: 'fake',
    model: 'fake-1',
    async complete() {
      return scripts[Math.min(i++, scripts.length - 1)]!;
    },
  };
}

export async function runAdTrackerChecks(it: Check): Promise<void> {
  // ------------------------------------------------------------ providers
  await it('openai-compatible sends chat/completions and reads choices[0]', async () => {
    const p = new OpenAICompatibleProvider({ apiKey: 'k', model: 'gpt-x', label: 'groq', baseUrl: 'https://api.groq.com/openai/v1' });
    const { result, calls } = await withFetch(
      () => ({ body: { choices: [{ message: { content: 'hello' } }] } }),
      () => p.complete({ messages: [{ role: 'user', content: 'hi' }] }),
    );
    assert.equal(result, 'hello');
    assert.ok(calls[0]!.url.endsWith('/chat/completions'));
    const sent = JSON.parse(String(calls[0]!.init.body));
    assert.equal(sent.model, 'gpt-x');
    assert.equal((calls[0]!.init.headers as any).authorization, 'Bearer k');
  });

  await it('anthropic hoists system out of messages and joins text blocks', async () => {
    const p = new AnthropicProvider({ apiKey: 'k', model: 'claude-x' });
    const { result, calls } = await withFetch(
      () => ({ body: { content: [{ type: 'text', text: 'a' }, { type: 'thinking' }, { type: 'text', text: 'b' }] } }),
      () => p.complete({ messages: [{ role: 'system', content: 'S' }, { role: 'user', content: 'u' }] }),
    );
    assert.equal(result, 'ab', 'text blocks join, non-text blocks are skipped');
    const sent = JSON.parse(String(calls[0]!.init.body));
    assert.equal(sent.system, 'S', 'system is a field, not a message');
    assert.equal(sent.messages.length, 1, 'system must not be left in messages');
    assert.equal((calls[0]!.init.headers as any)['anthropic-version'], '2023-06-01');
  });

  await it('google maps assistant to model and uses systemInstruction', async () => {
    const p = new GoogleProvider({ apiKey: 'k', model: 'gemini-x' });
    const { result, calls } = await withFetch(
      () => ({ body: { candidates: [{ content: { parts: [{ text: 'g' }] } }] } }),
      () => p.complete({ messages: [{ role: 'system', content: 'S' }, { role: 'assistant', content: 'prior' }] }),
    );
    assert.equal(result, 'g');
    const sent = JSON.parse(String(calls[0]!.init.body));
    assert.equal(sent.systemInstruction.parts[0].text, 'S');
    assert.equal(sent.contents[0].role, 'model', 'assistant is called "model" here');
  });

  await it('surfaces the provider error text rather than a generic failure', async () => {
    const p = new OpenAICompatibleProvider({ apiKey: 'k', model: 'm' });
    await assert.rejects(
      () => withFetch(() => ({ status: 429, body: { error: 'insufficient_quota' } }), () => p.complete({ messages: [] })),
      (e: unknown) => e instanceof ProviderError && /insufficient_quota/.test(e.message),
    );
  });

  await it('createProvider routes known providers and local runtimes', () => {
    assert.equal(createProvider({ provider: 'anthropic', model: 'm', apiKey: 'k' }).name, 'anthropic');
    assert.equal(createProvider({ provider: 'gemini', model: 'm', apiKey: 'k' }).name, 'google');
    assert.equal(createProvider({ provider: 'groq', model: 'm', apiKey: 'k' }).name, 'groq');
    // A local runtime needs no key — requiring one would block Ollama entirely.
    assert.equal(createProvider({ provider: 'ollama', model: 'llama3' }).name, 'ollama');
    assert.throws(() => createProvider({ provider: 'openai', model: 'm' }), /needs an apiKey/);
  });

  await it('an unknown provider works when given a baseUrl, and errors without one', () => {
    const p = createProvider({ provider: 'brand-new-llm', model: 'm', apiKey: 'k', baseUrl: 'https://x/v1' });
    assert.equal(p.name, 'brand-new-llm');
    assert.throws(() => createProvider({ provider: 'brand-new-llm', model: 'm', apiKey: 'k' }), /Unknown provider/);
  });

  // ------------------------------------------------------------ sources
  await it('knows where the Meta Ad Library can actually see commercial ads', () => {
    assert.equal(MetaAdLibrarySource.coversCommercialAds(['GB']), true);
    assert.equal(MetaAdLibrarySource.coversCommercialAds(['de']), true, 'case insensitive');
    assert.equal(MetaAdLibrarySource.coversCommercialAds(['US']), false, 'the whole reason manual import exists');
    assert.equal(MetaAdLibrarySource.coversCommercialAds(undefined), false);
  });

  await it('meta source queries by page id and maps the archive shape', async () => {
    const src = new MetaAdLibrarySource({ accessToken: 't' });
    const { result, calls } = await withFetch(
      () => ({
        body: {
          data: [{
            id: '99', ad_creative_bodies: ['body'], ad_creative_link_titles: ['title'],
            ad_delivery_start_time: '2026-01-01', ad_snapshot_url: 'https://fb/99',
            publisher_platforms: ['facebook'],
          }],
        },
      }),
      () => src.fetchAds({ competitor, countries: ['GB'] }),
    );
    assert.equal(result.length, 1);
    assert.equal(result[0]!.id, '99');
    assert.equal(result[0]!.creative.bodyText, 'body');
    assert.equal(result[0]!.active, true, 'no stop time means still delivering');
    assert.ok(calls[0]!.url.includes('search_page_ids'));
    assert.ok(!calls[0]!.url.includes('search_terms'), 'page id is precise, do not also keyword-search');
  });

  await it('every source states its coverage, so empty never reads as "no ads"', () => {
    assert.match(new MetaAdLibrarySource({ accessToken: 't' }).coverage, /EU or UK/);
    assert.match(new ManualAdSource().coverage, /any country/);
  });

  await it('parses pasted ad urls, dedupes, and records only what the url proves', () => {
    const ads = adsFromUrls(
      [
        'https://www.facebook.com/ads/library/?id=555',
        'https://www.facebook.com/ads/library/?id=555',
        'https://library.tiktok.com/ads/detail/?item_id=777',
        'not a url',
        '',
      ],
      competitor,
    );
    assert.equal(ads.length, 2, 'duplicate pasted twice is one ad; junk is dropped');
    assert.equal(ads[0]!.id, '555');
    assert.equal(ads[1]!.source, 'tiktok');
    // The bug this guards: "last path segment" yields the literal word "detail"
    // for every TikTok ad, so behind a unique key they all overwrite one row.
    assert.equal(ads[1]!.id, '777', 'the tiktok id is item_id, not the route word');
    assert.notEqual(ads[1]!.id, 'detail');
    assert.equal(ads[0]!.creative.kind, 'text', 'media kind is unknown from a url, so do not claim video');
  });


  await it('never mistakes a route word for an ad id', () => {
    const one = adsFromUrls(['https://library.tiktok.com/ads/detail/?item_id=1'], competitor);
    const two = adsFromUrls(['https://library.tiktok.com/ads/detail/?item_id=2'], competitor);
    assert.notEqual(one[0]!.id, two[0]!.id, 'two different ads must not share an id');
    // With no id parameter at all, fall back to the full url rather than a word
    // every ad on the platform would share.
    const bare = adsFromUrls(['https://library.tiktok.com/ads/detail/'], competitor);
    assert.ok(bare[0]!.id.includes('library.tiktok.com'));
  });

  await it('manual source only returns the asked-for competitor', async () => {
    const src = new ManualAdSource([ad, { ...ad, id: 'other', competitorId: 'c2' }]);
    const got = await src.fetchAds({ competitor });
    assert.equal(got.length, 1);
    assert.equal(got[0]!.id, 'ad1');
  });

  // ------------------------------------------------------------ rewrite
  await it('extracts json from a fenced or chatty response', () => {
    assert.deepEqual(parseJsonObject('```json\n{"a":1}\n```'), { a: 1 });
    assert.deepEqual(parseJsonObject('Sure! {"a":2} hope that helps'), { a: 2 });
    assert.throws(() => parseJsonObject('no json here'), /No JSON object/);
  });

  await it('validates forbidden claims and required disclaimers', () => {
    const base: Rewrite = { adId: 'a', angleObserved: 'x', hook: 'h', script: '', rationale: 'r', provider: 'p', model: 'm' };
    const ok = { ...base, script: `Great stuff. ${brand.requiredDisclaimer}` };
    assert.deepEqual(validateRewrite(ok, brand), []);

    const missing = { ...base, script: 'Great stuff.' };
    assert.match(validateRewrite(missing, brand)[0]!, /missing the required disclaimer/);

    const forbidden = { ...base, script: `It CURES everything. ${brand.requiredDisclaimer}` };
    assert.match(validateRewrite(forbidden, brand)[0]!, /forbidden claim/, 'match is case-insensitive');
  });

  await it('retries once when the model breaks a rule, then accepts the fixed draft', async () => {
    const bad = JSON.stringify({ angleObserved: 'a', hook: 'h', script: 'this cures everything', rationale: 'r' });
    const good = JSON.stringify({
      angleObserved: 'a', hook: 'h',
      script: `A compliant script. ${brand.requiredDisclaimer}`, rationale: 'r',
    });
    const rewrite = await rewriteAd({ ad, brand, provider: fakeProvider([bad, good]) });
    assert.ok(rewrite.script.includes(brand.requiredDisclaimer!));
    assert.equal(rewrite.provider, 'fake');
  });

  await it('throws rather than return a draft that still breaks a legal limit', async () => {
    const bad = JSON.stringify({ angleObserved: 'a', hook: 'h', script: 'it cures everything', rationale: 'r' });
    await assert.rejects(
      () => rewriteAd({ ad, brand, provider: fakeProvider([bad, bad]) }),
      (e: unknown) => e instanceof RewriteRejected && e.reasons.length > 0,
    );
  });
}
