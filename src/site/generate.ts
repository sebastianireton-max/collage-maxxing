import type { BrandProfile } from '../brand/types.js';
import { parseColor, readableOn, shift, toHex } from '../brand/color.js';

export interface DemoOptions {
  /** Who built this demo and is sending the email. Shown in the demo banner. */
  senderName: string;
  /** Where the "book a call" button points. */
  ctaUrl: string;
  /** The offer being pitched, in the prospect's language. */
  offer: string;
}

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Google Fonts stylesheet for whatever families we detected, so the demo matches their type. */
function fontLink(families: string[]): string {
  if (families.length === 0) return '';
  const q = families
    .slice(0, 2)
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700;800`)
    .join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q}&display=swap">`;
}

/**
 * Builds a personalised single-page demo from an extracted brand profile.
 *
 * Everything on the page comes from the prospect's own site. Nothing is invented:
 * no testimonials, no statistics, no claims about their business. The demo proves
 * "we understood your brand", which is what earns the reply, and a fabricated
 * number would sink that on the first read.
 */
export function generateDemoSite(profile: BrandProfile, opts: DemoOptions): string {
  const { identity, palette, type, contact, services, voiceSample } = profile;

  const primaryRgb = parseColor(palette.primary)!;
  const onPrimary = readableOn(primaryRgb);
  const primaryDeep = toHex(shift(primaryRgb, -0.35));
  const primarySoft = toHex(shift(primaryRgb, 0.86));

  const headingFont = `'${type.heading}', 'Inter', system-ui, -apple-system, sans-serif`;
  const bodyFont = `'${type.body}', 'Inter', system-ui, -apple-system, sans-serif`;

  const name = esc(identity.name);
  const tagline = esc(identity.tagline || identity.description.slice(0, 110) || `${identity.name}`);

  // Their nav labels become the section cards. If the nav gave us nothing usable,
  // fall back to a neutral three rather than inventing services they do not offer.
  const cards = (services.length >= 3 ? services : ['What we do', 'Why us', 'Get in touch']).slice(0, 6);

  const proofLine = voiceSample[0] ? esc(voiceSample[0]) : '';

  const logoMark = identity.logoUrl
    ? `<img src="${esc(identity.logoUrl)}" alt="${name}" class="logo-img">`
    : `<span class="logo-mark">${esc(identity.name.slice(0, 2).toUpperCase())}</span>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${name} — concept</title>
${fontLink(type.googleFonts.length ? type.googleFonts : [type.heading, type.body])}
<style>
  :root{
    --primary:${palette.primary};
    --primary-deep:${primaryDeep};
    --primary-soft:${primarySoft};
    --secondary:${palette.secondary};
    --accent:${palette.accent};
    --ink:${palette.ink};
    --on-primary:${onPrimary};
    --paper:${palette.paper};
    --muted:color-mix(in srgb, var(--ink) 58%, white);
    --line:color-mix(in srgb, var(--ink) 12%, white);
    --radius:18px;
    --shell:min(1180px, 92vw);
  }
  *,*::before,*::after{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    margin:0;background:var(--paper);color:var(--ink);
    font-family:${bodyFont};font-size:17px;line-height:1.65;
    -webkit-font-smoothing:antialiased;overflow-x:hidden;
  }
  h1,h2,h3{font-family:${headingFont};line-height:1.08;letter-spacing:-0.03em;margin:0;font-weight:800}
  h1{font-size:clamp(2.6rem,6.4vw,4.9rem)}
  h2{font-size:clamp(1.9rem,3.6vw,2.9rem)}
  p{margin:0}
  a{color:inherit}
  .shell{width:var(--shell);margin-inline:auto}

  /* ---------- demo banner: this is a concept, say so plainly ---------- */
  .demo-bar{
    position:sticky;top:0;z-index:60;background:var(--ink);color:#fff;
    font-size:.82rem;letter-spacing:.01em;padding:.6rem 0;
  }
  .demo-bar .shell{display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap}
  .demo-bar strong{font-weight:600}
  .demo-bar a{color:#fff;text-decoration:underline;text-underline-offset:3px}

  /* ---------- nav ---------- */
  nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);
      background:color-mix(in srgb, var(--paper) 82%, transparent);
      border-bottom:1px solid var(--line)}
  nav .shell{display:flex;align-items:center;justify-content:space-between;padding:.9rem 0;gap:1rem}
  .brand{display:flex;align-items:center;gap:.7rem;font-weight:700;font-family:${headingFont};font-size:1.12rem}
  .logo-img{height:34px;width:auto;max-width:170px;object-fit:contain;display:block}
  .logo-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;
    background:var(--primary);color:var(--on-primary);font-size:.95rem;font-weight:800;letter-spacing:.02em}
  .nav-links{display:flex;gap:1.6rem;font-size:.94rem;color:var(--muted)}
  .nav-links a{text-decoration:none;transition:color .2s}
  .nav-links a:hover{color:var(--primary)}
  @media(max-width:820px){.nav-links{display:none}}

  .btn{
    display:inline-flex;align-items:center;gap:.5rem;border:0;cursor:pointer;
    padding:.85rem 1.5rem;border-radius:999px;font:inherit;font-weight:600;font-size:.96rem;
    background:var(--primary);color:var(--on-primary);text-decoration:none;
    transition:transform .22s cubic-bezier(.2,.8,.3,1), box-shadow .22s;
    box-shadow:0 10px 28px -12px color-mix(in srgb, var(--primary) 75%, transparent);
  }
  .btn:hover{transform:translateY(-2px);box-shadow:0 18px 40px -14px color-mix(in srgb, var(--primary) 85%, transparent)}
  .btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line);box-shadow:none}
  .btn.ghost:hover{border-color:var(--primary);color:var(--primary)}

  /* ---------- hero ---------- */
  .hero{position:relative;padding:clamp(4rem,11vh,7.5rem) 0 clamp(3.5rem,9vh,6rem);overflow:hidden}
  .hero::before{
    content:'';position:absolute;inset:-45% -20% auto -20%;height:135%;z-index:-1;
    background:
      radial-gradient(46% 52% at 18% 22%, color-mix(in srgb,var(--primary) 30%, transparent) 0%, transparent 62%),
      radial-gradient(40% 46% at 82% 12%, color-mix(in srgb,var(--accent) 26%, transparent) 0%, transparent 60%),
      radial-gradient(52% 48% at 62% 78%, color-mix(in srgb,var(--secondary) 20%, transparent) 0%, transparent 66%);
    filter:blur(28px);animation:drift 22s ease-in-out infinite alternate;
  }
  @keyframes drift{
    0%{transform:translate3d(0,0,0) scale(1)}
    50%{transform:translate3d(-2.5%,2%,0) scale(1.06)}
    100%{transform:translate3d(2.5%,-2%,0) scale(1.02)}
  }
  .eyebrow{
    display:inline-flex;align-items:center;gap:.55rem;font-size:.78rem;font-weight:600;
    text-transform:uppercase;letter-spacing:.14em;color:var(--primary);
    background:var(--primary-soft);padding:.45rem 1rem;border-radius:999px;margin-bottom:1.5rem;
  }
  .dot{width:7px;height:7px;border-radius:50%;background:var(--primary);animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.8)}}
  .hero p.lede{font-size:clamp(1.05rem,1.9vw,1.3rem);color:var(--muted);max-width:60ch;margin-top:1.5rem}
  .hero-actions{display:flex;gap:.9rem;margin-top:2.4rem;flex-wrap:wrap}
  .grad{background:linear-gradient(115deg,var(--primary) 0%,var(--accent) 58%,var(--secondary) 100%);
        -webkit-background-clip:text;background-clip:text;color:transparent}

  /* ---------- sections ---------- */
  section{padding:clamp(3.5rem,9vh,6.5rem) 0}
  .section-head{max-width:64ch;margin-bottom:3rem}
  .section-head p{color:var(--muted);margin-top:1rem;font-size:1.05rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(275px,1fr));gap:1.4rem}
  .card{
    padding:2rem 1.8rem;border-radius:var(--radius);border:1px solid var(--line);
    background:var(--paper);position:relative;overflow:hidden;
    transition:transform .3s cubic-bezier(.2,.8,.3,1), box-shadow .3s, border-color .3s;
  }
  .card::after{
    content:'';position:absolute;inset:0 0 auto 0;height:3px;
    background:linear-gradient(90deg,var(--primary),var(--accent));
    transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.2,.8,.3,1);
  }
  .card:hover{transform:translateY(-6px);box-shadow:0 22px 50px -28px color-mix(in srgb,var(--ink) 55%, transparent);border-color:transparent}
  .card:hover::after{transform:scaleX(1)}
  .card .num{font-family:${headingFont};font-size:.8rem;font-weight:700;color:var(--primary);letter-spacing:.1em}
  .card h3{font-size:1.28rem;margin:.7rem 0 .6rem}
  .card p{color:var(--muted);font-size:.97rem}

  .quote{
    border-left:3px solid var(--primary);padding:.4rem 0 .4rem 1.6rem;
    font-family:${headingFont};font-size:clamp(1.25rem,2.4vw,1.75rem);
    font-weight:600;letter-spacing:-.02em;line-height:1.4;max-width:56ch;
  }

  .cta{background:var(--ink);color:#fff;border-radius:26px;padding:clamp(2.6rem,6vw,4.2rem);
       position:relative;overflow:hidden}
  .cta::before{content:'';position:absolute;inset:auto -10% -60% 40%;height:120%;
    background:radial-gradient(circle at center, color-mix(in srgb,var(--primary) 42%, transparent), transparent 66%);filter:blur(10px)}
  .cta h2,.cta p{position:relative}
  .cta p{color:rgba(255,255,255,.76);margin-top:1rem;max-width:52ch}
  .cta .btn{margin-top:2rem;position:relative;background:#fff;color:var(--ink);box-shadow:none}
  .cta .btn:hover{transform:translateY(-2px)}

  footer{border-top:1px solid var(--line);padding:2.6rem 0;color:var(--muted);font-size:.9rem}
  footer .shell{display:flex;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}
  .contact-row{display:flex;gap:1.4rem;flex-wrap:wrap}
  .contact-row a{text-decoration:none}
  .contact-row a:hover{color:var(--primary)}

  /* ---------- scroll reveal ----------
     Progressive enhancement: content is visible by default and only starts hidden
     once the script has confirmed it can reveal it again. Hiding first and relying
     on JS to undo it leaves the whole page blank whenever the script fails. */
  .js-reveal .reveal{opacity:0;transform:translateY(26px);
          transition:opacity .75s cubic-bezier(.2,.8,.3,1), transform .75s cubic-bezier(.2,.8,.3,1)}
  .js-reveal .reveal.in{opacity:1;transform:none}
  @media(prefers-reduced-motion:reduce){
    *{animation:none!important;transition:none!important}
    .js-reveal .reveal{opacity:1;transform:none}
    html{scroll-behavior:auto}
  }
</style>
</head>
<body>

<div class="demo-bar">
  <div class="shell">
    <span><strong>Concept preview</strong> — an unofficial design study for ${name}, built by ${esc(opts.senderName)}. Not affiliated with ${name}.</span>
    <a href="${esc(opts.ctaUrl)}">Book a call &rarr;</a>
  </div>
</div>

<nav>
  <div class="shell">
    <div class="brand">${logoMark}<span>${name}</span></div>
    <div class="nav-links">
      ${cards.map((c) => `<a href="#s-${esc(c).replace(/\W+/g, '-').toLowerCase()}">${esc(c)}</a>`).join('\n      ')}
    </div>
    <a class="btn" href="${esc(opts.ctaUrl)}">Book a call</a>
  </div>
</nav>

<header class="hero">
  <div class="shell">
    <span class="eyebrow reveal"><span class="dot"></span>Concept for ${name}</span>
    <h1 class="reveal">${tagline ? tagline : name}<br><span class="grad">${esc(opts.offer)}</span></h1>
    <p class="lede reveal">${esc(identity.description || `A design study for ${identity.name}, built from your own brand — your colours, your type, your words.`)}</p>
    <div class="hero-actions reveal">
      <a class="btn" href="${esc(opts.ctaUrl)}">Book a 15-minute call</a>
      <a class="btn ghost" href="${esc(profile.url)}" rel="noopener">View current site</a>
    </div>
  </div>
</header>

<section>
  <div class="shell">
    <div class="section-head reveal">
      <h2>Built around what you already do</h2>
      <p>Every section below was pulled from ${name}&rsquo;s own site — nothing here was invented.</p>
    </div>
    <div class="grid">
      ${cards
        .map(
          (c, i) => `<article class="card reveal" id="s-${esc(c).replace(/\W+/g, '-').toLowerCase()}" style="transition-delay:${i * 70}ms">
        <div class="num">${String(i + 1).padStart(2, '0')}</div>
        <h3>${esc(c)}</h3>
        <p>Carried over from your current navigation, restyled in your palette and type.</p>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>

${
  proofLine
    ? `<section style="background:var(--primary-soft)">
  <div class="shell">
    <blockquote class="quote reveal">&ldquo;${proofLine}&rdquo;</blockquote>
    <p class="reveal" style="color:var(--muted);margin-top:1.2rem;font-size:.92rem">Your words, from your current site.</p>
  </div>
</section>`
    : ''
}

<section>
  <div class="shell">
    <div class="cta reveal">
      <h2>Want this built properly?</h2>
      <p>This concept took one pass. The real thing takes a short conversation about what ${name} actually needs.</p>
      <a class="btn" href="${esc(opts.ctaUrl)}">Book a 15-minute call</a>
    </div>
  </div>
</section>

<footer>
  <div class="shell">
    <span>Concept preview for ${name} &middot; built by ${esc(opts.senderName)}</span>
    <div class="contact-row">
      ${contact.phone ? `<a href="tel:${esc(contact.phone)}">${esc(contact.phone)}</a>` : ''}
      ${contact.email ? `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>` : ''}
      <a href="${esc(profile.url)}" rel="noopener">${esc(new URL(profile.url).hostname)}</a>
    </div>
  </div>
</footer>

<script>
  // Reveal on scroll. IntersectionObserver is native everywhere we care about,
  // so this needs no library and costs nothing.
  (function () {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) return; // leave content visible
    // ?static=1 renders every section immediately. Screenshot and thumbnail capture
    // does not scroll, so observer-driven reveals would photograph as a blank page.
    if (/[?&]static/.test(location.search)) return;
    document.documentElement.classList.add('js-reveal'); // only now is it safe to hide
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
    // Anything still hidden after load (print, instant scroll to anchor, observer
    // never firing) gets shown rather than left blank.
    window.addEventListener('load', function () {
      setTimeout(function () {
        document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight) el.classList.add('in');
        });
      }, 400);
    });
  })();
</script>
</body>
</html>`;
}
