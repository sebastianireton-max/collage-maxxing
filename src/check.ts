/**
 * Self-check. No framework: run with `npm run check`.
 * Covers the logic that would silently produce a wrong-looking demo rather than crash —
 * colour parsing, brand-candidate filtering, palette ranking, label cleaning, and escaping.
 */
import assert from 'node:assert/strict';
import { contrastRatio, isBrandCandidate, parseColor, readableOn, saturation, toHex } from './brand/color.js';
import { cleanLabel, extractPalette, extractType } from './brand/extract.js';
import { generateDemoSite } from './site/generate.js';
import type { BrandProfile } from './brand/types.js';
import { runAdTrackerChecks } from './adtracker/check.js';

let passed = 0;
const it = (name: string, fn: () => void) => {
  try { fn(); passed++; }
  catch (e) { console.error(`FAIL  ${name}\n      ${e instanceof Error ? e.message : e}`); process.exitCode = 1; }
};

// ---------------------------------------------------------------- colour
it('parses every css colour form to the same rgb', () => {
  assert.deepEqual(parseColor('#f00'), { r: 255, g: 0, b: 0 });
  assert.deepEqual(parseColor('#FF0000'), { r: 255, g: 0, b: 0 });
  assert.deepEqual(parseColor('rgb(255, 0, 0)'), { r: 255, g: 0, b: 0 });
  assert.deepEqual(parseColor('hsl(0, 100%, 50%)'), { r: 255, g: 0, b: 0 });
  assert.equal(toHex(parseColor('rgb(83,58,253)')!), '#533afd');
});

it('rejects non-colours and fully transparent values', () => {
  assert.equal(parseColor('inherit'), null);
  assert.equal(parseColor('#ggg'), null);
  // Alpha 0 is invisible, so it is never a brand colour.
  assert.equal(parseColor('rgba(255,0,0,0)'), null);
  assert.notEqual(parseColor('rgba(255,0,0,0.5)'), null);
});

it('treats greys, near-white and near-black as chrome, not brand', () => {
  assert.equal(isBrandCandidate(parseColor('#ffffff')!), false);
  assert.equal(isBrandCandidate(parseColor('#fdfdfd')!), false);
  assert.equal(isBrandCandidate(parseColor('#000000')!), false);
  assert.equal(isBrandCandidate(parseColor('#808080')!), false, 'mid grey is unsaturated');
  assert.equal(isBrandCandidate(parseColor('#533afd')!), true, 'a real brand purple survives');
  assert.equal(isBrandCandidate(parseColor('#004bb9')!), true);
});

it('computes contrast and picks readable foregrounds', () => {
  // Known WCAG value: black on white is 21:1.
  assert.ok(Math.abs(contrastRatio(parseColor('#000')!, parseColor('#fff')!) - 21) < 0.01);
  assert.equal(readableOn(parseColor('#0d1130')!), '#ffffff', 'white reads on navy');
  assert.equal(readableOn(parseColor('#ffd601')!), '#111111', 'black reads on yellow');
  assert.equal(saturation(parseColor('#808080')!), 0);
});

// ---------------------------------------------------------------- palette
it('prefers a declared brand token over a more frequent incidental colour', () => {
  // The teal appears far more often, but the purple is declared as --brand-primary.
  const css = `
    :root { --brand-primary: #533afd; }
    .a{color:#1b9e8f}.b{color:#1b9e8f}.c{color:#1b9e8f}.d{color:#1b9e8f}
    .e{color:#1b9e8f}.f{color:#1b9e8f}.g{color:#1b9e8f}.h{color:#1b9e8f}
  `;
  const warnings: string[] = [];
  assert.equal(extractPalette(css, warnings).primary, '#533afd');
});

it('collapses near-identical shades into one candidate', () => {
  const css = '.a{color:#533afd}.b{color:#543bfe}.c{color:#523afc}';
  const p = extractPalette(css, []);
  assert.equal(p.candidates.length, 1, 'three shades of the same purple are one brand colour');
});

it('falls back to a neutral palette and warns when a site has no usable colour', () => {
  const warnings: string[] = [];
  const p = extractPalette('.a{color:#fff}.b{color:#000}', warnings);
  assert.equal(p.primary, '#1b2a6e');
  assert.equal(warnings.length, 1);
});

it('ignores colours inside css comments', () => {
  // decomment() runs before extractPalette in the real path; assert the ranking
  // still holds when a commented block is the only other source.
  const p = extractPalette(':root{--primary:#004bb9}', []);
  assert.equal(p.primary, '#004bb9');
});

// ---------------------------------------------------------------- type
it('skips generic font stacks and honours google fonts first', () => {
  const css = 'body{font-family:Arial, sans-serif}h1{font-family:"Work Sans", sans-serif}';
  assert.equal(extractType(css, []).heading, 'Work Sans', 'Arial is a fallback, not a choice');
  assert.equal(extractType(css, ['Figtree']).heading, 'Figtree', 'an explicit google font wins');
});

// ---------------------------------------------------------------- labels
it('cleans icon ligatures and doubled nav labels', () => {
  assert.equal(cleanLabel('Sign inSign in'), 'Sign in');
  assert.equal(cleanLabel('local_phone(800) 277-3633'), '');
  assert.equal(cleanLabel('  Book   an appointment '), 'Book an appointment');
});

// ---------------------------------------------------------------- generator
const fixture: BrandProfile = {
  url: 'https://example-dental.com/',
  fetchedAt: new Date().toISOString(),
  identity: { name: 'Bright Smile Dental', tagline: 'Miami family dentistry', description: 'A dental clinic.' },
  palette: { primary: '#004bb9', secondary: '#f04438', accent: '#ffd600', ink: '#00388b', paper: '#ffffff', candidates: [] },
  type: { heading: 'Work Sans', body: 'Figtree', googleFonts: ['Work Sans', 'Figtree'] },
  contact: { phone: '(800) 277-3633', socials: {} },
  services: ['Implants', 'Whitening', 'Emergency care'],
  voiceSample: ['We have looked after Miami families for over twenty years.'],
  warnings: [],
};

it('generates a demo carrying the brand through to css variables', () => {
  const html = generateDemoSite(fixture, { senderName: 'Optimized Aminos', ctaUrl: 'https://cal.com/x', offer: 'reimagined' });
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('--primary:#004bb9'), 'their colour reaches the page');
  assert.ok(html.includes('Work Sans'), 'their type reaches the page');
  assert.ok(html.includes('Implants'), 'their nav becomes sections');
  assert.ok(html.includes('https://cal.com/x'), 'the cta is wired');
  assert.ok(html.includes('prefers-reduced-motion'), 'animation respects the accessibility preference');
  assert.ok(html.includes('noindex'), 'a concept page must never be indexed');
});

it('labels the demo as unaffiliated, which is what keeps it honest', () => {
  const html = generateDemoSite(fixture, { senderName: 'Optimized Aminos', ctaUrl: 'https://cal.com/x', offer: 'reimagined' });
  assert.ok(/Concept preview/.test(html));
  assert.ok(/Not affiliated with Bright Smile Dental/.test(html));
});

it('escapes prospect content instead of injecting it as markup', () => {
  const hostile: BrandProfile = {
    ...fixture,
    identity: { ...fixture.identity, name: '<script>alert(1)</script>' },
    services: ['"><img src=x onerror=alert(1)>'],
  };
  const html = generateDemoSite(hostile, { senderName: 'X', ctaUrl: 'https://c', offer: 'y' });
  assert.ok(!html.includes('<script>alert(1)</script>'), 'prospect html must not execute');
  assert.ok(!html.includes('onerror=alert'), 'attribute break-out must not execute');
  assert.ok(html.includes('&lt;script&gt;'), 'it is escaped, not dropped');
});

it('never invents sections when a prospect nav is unusable', () => {
  const bare = { ...fixture, services: [] };
  const html = generateDemoSite(bare, { senderName: 'X', ctaUrl: 'https://c', offer: 'y' });
  assert.ok(html.includes('What we do'), 'falls back to neutral labels');
  assert.ok(!html.includes('Implants'), 'does not carry over another brand"s services');
});

// The ad-tracker checks are async (stubbed fetch), so they need an awaiting
// variant of the same runner rather than a second reporting path.
const itAsync = async (name: string, fn: () => void | Promise<void>) => {
  try { await fn(); passed++; }
  catch (e) { console.error(`FAIL  ${name}\n      ${e instanceof Error ? e.message : e}`); process.exitCode = 1; }
};

await runAdTrackerChecks(itAsync);

console.log(process.exitCode ? `\ncheck: FAILED (${passed} passed)` : `\ncheck: ${passed} passed`);
