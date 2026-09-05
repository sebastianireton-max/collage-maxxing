# collage-maxxing

Prospect → brand identity → personalised demo site.

Built as the risk-reversal engine for cold outreach. The highest-converting line in a
cold email is *"we already built you an example — mind taking a look?"*, and the only
reason that line does not scale is that someone has to build the example. This does.

## What it does

Point it at a prospect's website. It reads their real brand off the live page — palette,
typography, logo, contact details, navigation, and their own words — then renders a
personalised concept site in that brand, ready to link from an email.

```bash
npm install
npm run brand -- stripe.com                 # print the extracted brand profile
npm run demo  -- aspendental.com            # write out/aspendental-com.html
npm run check                               # 14 assertions, no framework
```

Demo options:

```bash
npm run demo -- example.com \
  --sender "Optimized Aminos" \
  --cta "https://cal.com/your-link" \
  --offer "reimagined"
```

## How the extraction works

**Palette.** Raw colour frequency picks the wrong colour: a pale background wash repeated
across a dozen rules beats the brand colour used deliberately. So candidates are scored by
evidence quality — a value declared in a CSS custom property named `--brand`/`--primary`
is worth ~12× an incidental usage — and weighted toward mid-luminance, since brand colours
rarely sit at the pale or near-black extremes. Greys and near-white/near-black are dropped
as page chrome before scoring. Near-identical shades collapse into one candidate.

**Type.** Only the first family in a `font-family` stack is a choice; the rest are
fallbacks, so generics are filtered out. An explicit Google Fonts `<link>` outranks
frequency counting, because it is the site stating its choice.

**Everything else.** Identity from `og:site_name`/`<title>` split on the usual
`Brand | Tagline` separator, logo from header/`logo`-classed images, contact from `tel:`
and `mailto:` links with a strict phone pattern (a loose one matches dates and order
numbers), sections from de-noised nav labels, and voice from real sentences on the page.

Nothing throws on a bad prospect site. Problems accumulate in `profile.warnings` and the
run continues, because a pipeline that dies on one broken site is useless at volume.

## What the generator will not do

The demo carries the prospect's palette and type into CSS variables and uses their own
words. It invents nothing — no testimonials, no statistics, no claims about their business.
A single fabricated number sinks the credibility the demo exists to build. Where the nav
gave nothing usable, sections fall back to neutral labels rather than inventing services.

Every page is labelled as an unaffiliated concept preview in a sticky banner and the
footer, and carries `noindex, nofollow`.

## Known ceilings

- **Static HTML only.** No JS rendering, so sites that build their nav client-side yield
  few sections. Aspen Dental returns one usable nav item for this reason.
- **Monochrome brands mislead it.** Linear declares a decorative cream as a theme token,
  so that wins over their actual black-and-white identity. `palette.candidates` is exposed
  ranked, specifically so a human can override the pick.
- **Stylesheets capped at 6** per site (`MAX_STYLESHEETS`). Raise it if real prospects
  split CSS further.
- `?static=1` on a generated page renders every section immediately, bypassing the
  scroll reveal. Screenshot and thumbnail capture does not scroll, so observer-driven
  reveals would otherwise photograph as a blank page.

## Layout

```
src/brand/color.ts      colour parsing, WCAG contrast, brand-candidate filtering
src/brand/extract.ts    URL -> BrandProfile
src/brand/types.ts      the BrandProfile shape
src/site/generate.ts    BrandProfile -> personalised demo HTML
src/cli.ts              brand / demo commands
src/check.ts            npm run check
```

Verified end to end against `stripe.com`, `aspendental.com` and `linear.app`.
