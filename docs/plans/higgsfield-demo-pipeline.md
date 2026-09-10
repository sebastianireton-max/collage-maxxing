# Higgsfield demo pipeline — concept sites for Phoenix businesses with no website

Supersedes the Lovable plan, which was deleted. Numbers below are **measured**,
not estimated: they come from the `transactions` ledger after building lead 1
end to end.

Governing documents, in precedence order:

1. `.claude/agents/site-smith.md` — the honesty contract.
2. `website-builder-flow` skill and `references/website-flow.md` — the build
   flow. It states that **no other skill overrides it for design**, so the G
   Brain design library is deliberately not used here. G Brain is used for
   business facts and for recording findings.
3. This document — how the two combine for unaffiliated concept demos.

---

## 1. The shape of a build

`type: "website"` always. Never `"app"`: an app means Sign in with Higgsfield
and runtime generation, which is exactly wrong for a standalone client demo.
`type: "website"` gives an independent brand with no Quanta, no q- tokens, and
no Higgsfield mention in page content.

The phased pipeline runs in full for every new build: intake, concept brief,
boards, asset system, build to boards, motion, cover plus metadata, mechanical
gate, deploy.

```
create_website(type="website", template="scroll-scrub"|omit, category="other",
               subdomain="<business>-concept")
  -> website_repo_access -> clone -> build -> commit -> push
  -> bun run typecheck  (the one pre-deploy local check)
  -> deploy_website
```

**Never `publish_website`.** These are unaffiliated concepts for businesses that
did not ask for them, so they must not appear on the Higgsfield community feed.
Deploy only. The intake question about publishing is answered no, permanently,
for every client demo.

**Never `use_unlim`** unless the owner explicitly asks. On this account
`unlim.available` is false, so the flag would be rejected anyway.

`category` must be a real slug from `list_website_categories`. For these,
`other`. Since the demos are never listed, the category is metadata only.

Subdomain: `<business>-concept`, lowercase, DNS safe, over 4 characters. The
`-concept` suffix matters. `lacalidad.higgsfield.app` reads as the shop's own
site; `lacalidad-concept.higgsfield.app` cannot.

---

## 2. What a demo actually costs

Measured on lead 1, La Calidad Meat Market, animated path.

| Call | Config | Credits |
|---|---|---|
| `generate_image` gpt_image_2 | establishing still, 2k, 16:9 | 6.50 |
| `generate_video` kling3_0 | 15s, `pro`, sound off, 16:9 | 26.25 |
| `generate_image` gpt_image_2 | cover scene, `count: 2` | 13.00 |
| `remove_background` | cover cutout | 1.00 |
| **Total, one animated demo** | | **46.75** |

Everything else in the flow is free: `create_website`, repo access, deploy,
local ffmpeg encoding, and `compose_cover.py` in the sandbox.

### Two costly gotchas, both now confirmed

- **`get_cost: true` quotes the per-image price, not the call price.** A
  `count: 2` image preflights at 6.5 and bills 13. Multiply by `count` yourself.
- **Model choice dominates everything else.** The same 15 second film:

  | Model and config | Credits |
  |---|---|
  | `seedance_2_5` 15s 1080p | 135.00 |
  | `seedance_2_5` 15s 720p | 97.50 |
  | `kling3_0` 15s `4k` | 90.00 |
  | **`kling3_0` 15s `pro`** | **26.25** |

  kling at `pro` is 5x cheaper than seedance and was more than good enough for a
  full-bleed scrubbed background. Preflighting is free and it saved 108 credits
  on one build. Always preflight.

### Free technique worth keeping

The scroll-scrub engine renders one chapter per scene entry, so a single-shot
film would carry only one chapter. Instead of paying for `multi-leg` (one
generation per leg), generate **one** continuous take and cut it into N
consecutive segments with local ffmpeg at keyframe boundaries. Seams are frame
exact by construction, because every segment is a slice of the same unbroken
render, and each segment carries its own chapter. Zero extra credits.

---

## 3. Animated or non-animated for the remaining nine

The intake question is mandatory on every `type: "website"` build and it is the
owner's call, not mine. The recommendation below is what I would answer.

**Budget arithmetic.** After lead 1 the balance is 253.80.

| Plan for the remaining nine | Credits | Fits? |
|---|---|---|
| 9 animated at 46.75 | 420.75 | **No.** Short by ~167 |
| 1 animated + 8 static at ~27 | 262.75 | No, just over |
| 9 static at ~27 (2 cover candidates) | 243.00 | Yes, ~11 spare |
| 9 static at ~20.5 (1 cover candidate) | 184.50 | Yes, comfortable |

**Recommendation: non-animated for all nine, on the lean recipe.** Not on taste,
which the flow correctly refuses as a reason, but on three concrete grounds:

1. **Budget.** Animated for nine does not fit and would strand demos 6 through
   10 half-built, which is the exact failure the owner named.
2. **Honesty.** The film has to depict something. For a business whose photos we
   have no licence to publish, a cinematic film is either abstract or it is an
   invented depiction of their premises. Lead 1 threaded this by filming a
   generic studio cut rather than the shop, and labelling it. That works once;
   it is not obviously repeatable for a barber shop or a nail salon without
   drifting into inventing the place.
3. **Mobile.** These customers are on phones. A static page with one strong hero
   image loads faster than 4 MB of scrubbed video on a weak connection.

The non-animated path still clears the craft floor: bespoke assets, a real type
and colour system, motivated micro-motion, and a Tier-1 technique named from
`references/wow-catalog.md`. It is not permission to ship a flat page.

**If the owner tops up credits,** the split I would spend it on is animated for
the three leads whose story is visual and high ticket (Unos Tacos y Birria,
Mariscos Mi Lindo Guaymas, AATCO's restoration portfolio), static for the rest.

---

## 4. How the honesty requirements survive the template

The template fights several of these by default. Each one needs a deliberate
override, and all of them were applied on lead 1.

| Requirement | What the template does | The override |
|---|---|---|
| `noindex, nofollow` | `__root.tsx` ships **no robots meta at all** | Add `{ name: "robots", content: "noindex, nofollow" }` to `buildHead`. SSR puts it in the served HTML, so it is real |
| Not crawlable | `robots.txt` ships `Allow: /` plus a sitemap | Rewrite to `User-agent: *` / `Disallow: /`, no sitemap line |
| No sitemap | `sitemap.xml.ts` serves a live sitemap | Return 404. A sitemap invites crawlers to a noindex page |
| No entity pollution | `references/seo.md` recommends `LocalBusiness` schema for local businesses | **Ship none.** Publishing `LocalBusiness` or `Organization` schema for a business on a domain it does not own fragments its real entity and its NAP consistency. This is an active harm, not a missed optimisation |
| Business is the only brand | `author: "Higgsfield"`, `twitter:site: "@Higgsfield"`, Quanta tokens on `<body>`, Quanta 404 and error components | Replace author, drop the handle, drop the q- classes, rewrite 404 and error in the site's own brand |
| No Higgsfield on the cover | `compose_cover.py` draws the Higgsfield wordmark and an `( Available now at higgsfield.ai )` pill | `--wordmark ""` disables the wordmark; `--cta "..."` replaces the pill with the concept disclaimer |
| Concept labelling | nothing | A banner as the first element in the document and a repeat in the footer, both server rendered |
| Invent nothing | nothing | Only lead-file evidenced facts. Where a fact is missing, the page says so out loud rather than leaving a suspicious gap |

**One thing that cannot be removed.** Platform CI builds every deploy with
`HF_DESIGN_INSPECTOR=1`, so the live site always carries the Higgsfield design
inspector bridge. It is a runtime script, not visible branding and not
generation, so it does not breach the no-mention-in-page-content rule. It is
recorded here because it is a fact about the shipped artifact, not a choice.

### The SEO audit conflict

`references/seo.md` ships a 10 item audit as a deploy gate, and parts of it
(keyword alignment, GEO, entity SEO) exist to make a page findable, which is the
opposite of the requirement here. Resolution: keep every accessibility and
quality item (heading hierarchy, alt text, link text, keyboard navigation,
fragment integrity, form labels, mobile readability), and record keyword
alignment and social discoverability as **not applicable to a noindex concept**
in the deploy summary rather than silently skipping them.

---

## 5. Per demo checklist

1. Read the lead's evidence block. Six of the ten have a URL that resolves to
   something not theirs: expired Squarespace, hijacked domain, scraper shell,
   parked lander, competitor-owned. That evidence **is** the pitch and should
   shape the copy.
2. Build a facts inventory from the lead file only. Name, address, phone,
   category, socials, and anything with a citation. No hours unless published.
   No ratings, reviews, staff, prices, or founding dates.
3. Write `app/design-brief.md` before any code. Palette must dodge the five
   banned families **and** the previous build's family, which is the flow's own
   anti-convergence rule and does the "two businesses must not look alike" job
   for free. Log each build's palette and type so the next one differs.
4. Generate the minimum kit. Preflight every call.
5. Build, then run the mechanical gate greps, then `bun run typecheck`.
6. Cover and `app-meta.json` are build steps, not publish steps. A build handed
   over with an empty `og_title` is incomplete.
7. `deploy_website`. Then curl the live HTML and confirm `noindex` and the
   banner are actually in the served markup.
8. Hand back the URL plus what it was built from, so outreach can say something
   specific and true.

---

## 6. Open items

- **Concurrent spend on this account.** The ledger shows 207.5 credits spent
  between 00:58 and 01:10 on 2026-09-10 that this build did not make: one image,
  one `seedance_2_5` at 135, ten more images, one background removal. Budgeting
  for the remaining nine cannot assume exclusive use of the balance. Worth
  confirming who is spending before committing to a plan.
- `docs/lead-sources-research.md` still does not exist. The lead file flags this
  itself. It should be written before any of this goes into a database.
- Photo licensing remains unresolved in general. Lead 1 sidestepped it by using
  only generated concept art and labelling it. That needs a real answer before a
  demo ever shows a photograph of a real business.
