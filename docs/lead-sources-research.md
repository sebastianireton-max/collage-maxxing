# Lead sources: finding local businesses with no website

Research date: 2026-09-09. Operator location assumed **Phoenix, Arizona** (America/Phoenix
timezone + Phoenix postal address). Nothing in this research contradicts that; Phoenix has no
DST, so an America/Phoenix tz is a strong signal and not a generic US default.

Every claim below is labelled **VERIFIED** (with source URL) or **UNCERTAIN**. Nothing here is
legal advice.

---

## 1. Google Places API (New)

### 1.1 The website field

**VERIFIED** — the field is `websiteUri` (Places API New; the legacy v1 name was `website`).
https://developers.google.com/maps/documentation/places/web-service/data-fields

**VERIFIED** — when a place has no website, the field is **absent from the JSON entirely**, not
null and not empty string. Google's field-mask docs state: *"When a response message is parsed,
and a field in the response message contains its default value, the field may be omitted from
the response even if you specified it in the response field mask."* Places API (New) is a
proto3-backed API, so unset string fields are dropped.
https://developers.google.com/maps/documentation/places/web-service/choose-fields

**Architectural consequence:** detection is `!('websiteUri' in place)`. Do not test for `=== ''`
or `=== null`. Also note the corollary — a missing field is **indistinguishable from a field
Google simply doesn't have**, so "no `websiteUri`" means "Google has no website on record",
which is a weaker claim than "this business has no website". That is fine for lead-gen (it is
the same thing from a customer-acquisition standpoint) but must not be presented to the
prospect as fact.

### 1.2 Is `websiteUri` available in Search, or Details-only? — **Search too. This is the big one.**

**VERIFIED** — `websiteUri` **can** be requested in the field mask of both **Nearby Search (New)**
and **Text Search (New)**. It is not Place Details-only.
- Nearby Search: `places.websiteUri` is listed under the **Nearby Search Enterprise SKU**.
  https://developers.google.com/maps/documentation/places/web-service/nearby-search
- Text Search: same field, same Enterprise tier.
  https://developers.google.com/maps/documentation/places/web-service/text-search

**VERIFIED** — the Enterprise tier for a single search request also carries everything else the
outreach and site-build need: `nationalPhoneNumber`, `internationalPhoneNumber`, `rating`,
`userRatingCount`, `priceLevel`, `regularOpeningHours`. `displayName` is Pro; `formattedAddress`,
`photos`, `id`, `location`, `types` are Essentials. Requesting a mixed mask bills at the
**highest tier requested**, so one Enterprise-tier search returns the whole record.
https://developers.google.com/maps/documentation/places/web-service/data-fields

**No second billed call is needed per candidate.** This roughly halves the naive cost model.

### 1.3 Pricing (US list, per 1,000 requests)

**VERIFIED** — https://developers.google.com/maps/billing-and-pricing/pricing

| SKU | $/1k | Free calls/mo |
|---|---|---|
| Nearby Search Pro | $32 | 5,000 |
| **Nearby Search Enterprise** | **$35** | **1,000** |
| Nearby Search Enterprise + Atmosphere | $40 | 1,000 |
| Text Search Pro | $32 | 5,000 |
| **Text Search Enterprise** | **$35** | **1,000** |
| Text Search Enterprise + Atmosphere | $40 | 1,000 |
| Place Details Essentials | $5 | 10,000 |
| Place Details Pro | $17 | 5,000 |
| Place Details Enterprise | $20 | 1,000 |
| Place Details Enterprise + Atmosphere | $25 | 1,000 |
| Place Photos | $7 | 1,000 |

Note the free tiers are **per-SKU monthly**, and the old flat $200/month credit ended
2025-02-28 (VERIFIED, same page).

### 1.4 Enumeration cost — the real number

**VERIFIED** — Nearby Search (New) returns a maximum of **20 results per request** (`maxResultCount`
1–20) and has **no pagination**; the circle radius caps at **50,000 m**; up to 50 `includedTypes`.
https://developers.google.com/maps/documentation/places/web-service/nearby-search

**VERIFIED** — Text Search (New) **does** paginate: `pageSize` ≤ 20, `nextPageToken`, **60 results
maximum across all pages**.
https://developers.google.com/maps/documentation/places/web-service/text-search

**Consequence:** you cannot "download Phoenix". You must run a **grid × category sweep** — small
radii (so the 20-result cap doesn't truncate dense areas) across each business type you care
about. Phoenix metro is ~1,500 km²; a 500 m-radius grid is ~2,000 cells, × ~30 target categories
= ~60,000 Nearby Search Enterprise calls ≈ **$2,100 per full sweep** at list price. Text Search
at 60/page-set is more efficient per call for long-tail categories. Budget accordingly, and
sweep incrementally (one category at a time) rather than all at once.

### 1.5 **THE CRITICAL QUESTION — caching and persistent storage**

Short answer: **building a persistent CRM of Google-sourced business records is PROHIBITED.**
You may store `place_id` indefinitely and essentially nothing else.

**VERIFIED — Maps Service Specific Terms, Places API caching clause, quoted verbatim:**

> ***Caching*.** Customer can temporarily cache latitude (lat) and longitude (lng) values from
> the Places API for up to 30 consecutive calendar days, after which Customer must delete the
> cached latitude and longitude values. Customer can cache Places API Place ID (place_id)
> values, in accordance with the Places API Policies.

https://cloud.google.com/maps-platform/terms/maps-service-terms

⚠️ **Section numbering has moved.** This is **§14.3** in the current live Service Specific Terms
and was **§5.4** in the 2024-04-22 snapshot
(https://cloud.google.com/maps-platform/terms/maps-service-terms/index-20240422). Cite by
heading ("Places API — Caching"), not by number. The 30-day/place_id substance is identical
across both.

Read that clause precisely: the **only** things the Places section affirmatively permits you to
retain are **lat/lng for 30 days** and **place_id indefinitely**. Business name, address, phone,
category, hours, rating are **not** in the permitted list. The historic folk understanding —
"you can cache anything for 30 days" — is a misreading; it was never that broad for Places, and
what the Places caching clause grants is narrower than the §3.2.3(b) general allowance people
quote.

**VERIFIED — Maps Platform ToS §3.2.3(a) "No Scraping", quoted verbatim:**

> **No Scraping.** Customer will not export, extract, or otherwise scrape Google Maps Content for
> use outside the Services. For example, Customer will not: (i) pre-fetch, index, store, reshare,
> or rehost Google Maps Content outside the services; (ii) bulk download Google Maps tiles,
> Street View images, geocodes, directions, distance matrix results, roads information, places
> information, elevation values, and time zone details; (iii) **copy and save business names,
> addresses, or user reviews**…

**VERIFIED — §3.2.3(b) "No Caching":** *"Customer will not cache Google Maps Content except as
expressly permitted under the Maps Service Specific Terms."*

**VERIFIED — §3.2.3(d)** separately prohibits building a *"listings or directory service"*.

https://cloud.google.com/maps-platform/terms

Clause (a)(iii) is the one that matters most here: **saving business names and addresses is
named, by Google, as an example of prohibited scraping** — and it makes no difference whether
you obtained them by crawling or through the paid API, because the restriction is on the
Content, not the transport.

**VERIFIED — Places API Policies** restate it: *"You must not pre-fetch, cache, or store Places
API content beyond the allowed exceptions, although the `place_id` is exempt from caching
restrictions… you can therefore store place ID values indefinitely."*
https://developers.google.com/maps/documentation/places/web-service/policies

There is a *general* limited-caching allowance in the main ToS (cache only to improve performance
against network latency/intermittent connectivity, secure, <30 consecutive days, not
redistributed, not aggregated or manipulated, attribution unmodified, usage still accurately
counted). A lead CRM fails almost every prong of that test: it is not a latency cache, it *is*
aggregation, and it persists beyond the pipeline. **Do not rely on it.**

**Verdict: PROHIBITED**, not permitted-with-limits. The compliant architecture is:
store `place_id` + your own derived flags (`had_website: false`, `swept_at`, `contacted_at`,
`outcome`) and **re-fetch the human-readable fields on demand**. Anything richer is a ToS breach.
This is a contract/termination risk (API key revoked, account terminated), not a criminal one —
but the whole business dies with the key.

### 1.6 Restriction on soliciting the businesses

**VERIFIED (wording read via search index; page is JS-rendered)** — the Google Maps Platform
Acceptable Use Policy prohibits using the Services to *"generate, distribute, publish or
facilitate unsolicited mass email, promotions, advertisements, or other solicitations (spam)"*,
prohibits displaying business listings Content *"in any implementation that has the primary
purpose of making available business, residential address, or telephone directory listings"*,
and prohibits use *"in a manner that gives access to mass downloads or bulk feeds of any
Content."* https://cloud.google.com/maps-platform/terms/aup

All three prongs point at this exact product. A grid sweep is arguably a bulk feed; an internal
lead list is arguably a business directory; mass outbound is arguably spam. **UNCERTAIN** how
aggressively Google enforces against low-volume internal use — but the terms are not ambiguous
about the intent.

### 1.7 Outreach law (separate from Google's terms)

- **VERIFIED** — most B2B telemarketing is exempt from the National Do Not Call Registry under
  the FTC Telemarketing Sales Rule; the exception is calls selling nondurable office or cleaning
  supplies. https://www.ftc.gov/business-guidance/resources/qa-telemarketers-sellers-about-dnc-provisions-tsr-0
- **UNCERTAIN but important** — a large share of SMB "phone numbers" on Google are the owner's
  **mobile**, and mobiles are treated as residential under the TCPA. The B2B exemption does not
  protect autodialled or prerecorded calls to a cell. Manual dialling is materially safer than
  any dialler.
- **UNCERTAIN** — Arizona requires telephonic sellers to register with the Secretary of State
  (A.R.S. §§ 44-1271 to 44-1278) and to keep an internal no-call list. There is a limited
  exemption at § 44-1273 for a solicitor who does **not** complete the sale on the call and
  completes it *"at a later face-to-face meeting"* — which plausibly fits a "book a meeting to
  show you the demo site" motion. https://www.azleg.gov/ars/44/01273.htm ·
  https://azsos.gov/sites/default/files/2023-11/bsd_ts_overview_20190107_fontes.pdf
  **Confirm with an Arizona attorney before dialling at volume.**

---

## 2. Alternatives

### 2.1 OpenStreetMap / Overpass — free and CRM-safe, but can't answer the question

- **VERIFIED** — the tags are `website` and `contact:website`. `website` is present on ~4.74M
  objects globally. https://taginfo.openstreetmap.org/keys/website
- **Fatal flaw (inference, high confidence):** OSM is volunteer-tagged. **Absence of a `website`
  tag does not mean the business has no website** — it usually means nobody tagged it. US
  commercial POI coverage is thin and inconsistent. You would generate a lead list that is
  mostly false positives, and every false positive is a wasted, credibility-destroying pitch.
- **VERIFIED** — public Overpass limits: stay under ~10,000 requests/day and 1 GB/day; 180 s
  timeout, 512 MiB memory, HTTP 429 on breach; heavy users must self-host.
  https://dev.overpass-api.de/overpass-doc/en/preface/commons.html
  For metro-scale work use a **Geofabrik Arizona extract**, not Overpass.
- **ODbL — better than feared. VERIFIED:** share-alike triggers only on **Public Use**. ODbL
  §4.5(c): *"Use of a Derivative Database internally within an organisation is not to the public
  and therefore does not fall under the requirements of Section 4.4."*
  https://opendatacommons.org/licenses/odbl/1-0/
  **A private lead CRM built from OSM does NOT have to be opened.**
- **VERIFIED** — a generated demo website is a **Produced Work**, not a database: *"If the
  published result of your project is intended for the extraction of the original data, then it
  is a database and not a Produced Work."*
  https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline
  Produced Works need attribution, not share-alike.
- **VERIFIED** — a Phoenix-metro pull is "substantial" (the insubstantial threshold is <100
  features or an area ≤1,000 inhabitants, and *"we regard repeated small extractions as one big
  extraction"*).
  https://osmfoundation.org/wiki/Licence/Community_Guidelines/Substantial_-_Guideline
- Attribution required wherever publicly displayed: **"© OpenStreetMap contributors"** + ODbL
  notice. https://www.openstreetmap.org/copyright
- **Cost:** free. **Verdict:** the only legally clean source — and the one that can't reliably
  tell you who lacks a website. Excellent as an *enrichment/cross-check* layer, useless as the
  primary signal.

### 2.2 Yelp Fusion — has the field, contractually forbids the use

- **VERIFIED** — a business website URL is exposed, but only on the **Enhanced and Premium**
  plans, not Base. (Top-level `url` is the yelp.com page, not the business site.)
  https://docs.developer.yelp.com/docs/plans
- **VERIFIED — disqualifying.** Yelp API Terms: you may not *"cache, record, pre-fetch, or
  otherwise store any portion of the Yelp Content for a period longer than twenty-four (24)
  hours from receipt"*, and may not *"modify the Yelp Content, or use it to update or create
  your own database of business listing information, unless such modification is for
  non-commercial analysis."*
  https://terms.yelp.com/developers/api_terms/20250113_en_us/
  Business IDs may be stored indefinitely; everything else is a 24-hour cache.
- **UNCERTAIN pricing** (confirm in-account): Base ~$229/mo, Enhanced ~$299/mo, Premium ~$643/mo,
  plus per-1k overage. https://business.yelp.com/data/resources/pricing/
- **Verdict: rule out.** Stricter than Google (24h vs place_id-only, but explicitly bans building
  a listing database) and it costs money.

### 2.3 Foursquare Places — explicitly bans this exact use case

- **VERIFIED** — `website` is in the place-details schema alongside `tel`, `email`, `link`, `menu`.
  https://docs.foursquare.com/fsq-developers-places/reference/place-details
- **VERIFIED — the killer clause.** Foursquare API License Agreement: *"You shall not… Use Places
  Data to contact businesses included in Places Data as prospective customers."*
  https://foursquare.com/legal/terms/apilicenseagreement/
  "Powered by Foursquare" attribution is mandatory; no bulk third-party sharing.
- **UNCERTAIN pricing:** self-serve PAYG; ~500 free Pro calls/month from 2026-06-01, then ~$15/1k
  (Foursquare's own pages conflict — one still advertises 10,000 free).
  https://docs.foursquare.com/developer/reference/upcoming-changes
- **Verdict: rule out.** It names your business model and prohibits it.

### 2.4 Commercial B2B providers

| Provider | "No website" filter | Coverage | Licence for lead-gen | Cost | Verdict |
|---|---|---|---|---|---|
| **Outscraper** (GMB reseller) | **Yes — native.** Field `site`, operator **"is blank"** (VERIFIED: https://outscraper.com/google-maps-scrape-businesses-without-websites/ , https://outscraper.com/google-maps-data-scraper-filters/) | 100M+ business records | They assert public-data scraping is lawful; **Google's ToS still bar the underlying activity and the risk transfers to you as buyer**. No primary Outscraper ToS clause located — **UNCERTAIN** | ~$3/1,000 records, no monthly fee (**UNCERTAIN**, confirm current rate) | Only source that directly answers the question. Legally the dirtiest. |
| **Bright Data** Google Maps dataset | No advertised per-record filter — filter post-download | ~298.8M records | Bulk purchase sold with resale/storage rights (**UNCERTAIN**) | ~$250/100k ≈ $0.0025/record (**UNCERTAIN**) https://brightdata.com/products/datasets/google-maps | Cheapest per record; same provenance problem |
| **SerpApi** | No | Google Maps as a search type on the general credit meter | Cache expires 1 hour | ~$0.01–0.025/search (**UNCERTAIN**) https://serpapi.com/pricing | Poor economics for list-building |
| **Data Axle Genie / Salesgenie** | Has a `website` field; **no verified "is blank" filter** — **UNCERTAIN** | 19.5M US business records | Licensed data, clean for lead-gen | ~$99–$349/mo, **12-month contract** (**UNCERTAIN**) https://www.g2.com/products/salesgenie-by-data-axle/pricing | The clean-licence option if the filter exists — worth one sales call to verify |
| **Apollo.io / Clay** | Structurally wrong tool | Company records are **domain-keyed** — a business with no website largely doesn't exist in them. Weak on non-tech local SMBs (**UNCERTAIN**, blog-level sources) | — | — | **Rule out on first principles** |
| BBB / Localogy | No self-serve product found | — | — | — | UNVERIFIED |

### 2.5 Google Business Profile pages / Maps scraping — the honest position

- **VERIFIED** — Maps Platform ToS §3.2.3(a) names *"copy and save business names, addresses, or
  user reviews"* as prohibited scraping, and §3.2.3(d) bars building a *"listings or directory
  service"*. https://cloud.google.com/maps-platform/terms
- **VERIFIED — consumer Google Maps terms**, which govern maps.google.com and public Business
  Profile pages, Prohibited Conduct: you may not *"mass download or create bulk feeds of the
  content (or let anyone else do so)"*, may not *"copy the content"*, and may not build a
  *"business listings database"* substitute. https://www.google.com/help/terms_maps/
- **VERIFIED** — *hiQ Labs v. LinkedIn*, 31 F.4th 1180 (9th Cir. 2022): *"the concept of 'without
  authorization' does not apply to public websites."* Arizona is in the **Ninth Circuit**, so this
  is the governing circuit law for the operator.
  https://cdn.ca9.uscourts.gov/datastore/opinions/2022/04/18/17-16783.pdf
- **VERIFIED and decisive — the same opinion says so itself:**
  > Entities that view themselves as victims of data scraping are not without resort, even if the
  > CFAA does not apply: state law trespass to chattels claims may still be available. And other
  > causes of action, such as copyright infringement, misappropriation, unjust enrichment,
  > conversion, **breach of contract**, or breach of privacy, may also lie.
- **VERIFIED — hiQ still lost.** Nov 2022, N.D. Cal. held hiQ **breached** LinkedIn's user
  agreement by scraping; 2022-12-07 stipulated judgment of **$500,000 plus a permanent injunction**
  requiring destruction of the scraped data.
  https://www.privacyworld.blog/2022/12/linkedins-data-scraping-battle-with-hiq-labs-ends-with-proposed-judgment/
- **VERIFIED** — *Van Buren v. United States*, 593 U.S. 374 (2021) narrowed "exceeds authorized
  access" to a *"gates-up-or-down inquiry"*; the CFAA does not reach improper-purpose misuse of
  data you could otherwise access. It says nothing about contract either.
  https://www.law.cornell.edu/supremecourt/text/19-783
- **The correct reading:** "not a federal crime" ≠ "allowed". CFAA exposure is genuinely low in
  the 9th Circuit — and that is the *only* thing hiQ settles. **Breach-of-contract, trespass to
  chattels, and copyright (the photos are individual contributors' copyrighted works) are all
  untouched**, and hiQ is the case where the scraper paid $500k on the contract claim. Google's
  remedy of first resort — terminating the API key and blocking the IPs — requires no lawsuit at
  all. Buying scraped data from a reseller moves the scraping act but does **not** cleanse the
  data: you are still receiving and using content the supplier obtained in breach, and you are
  the one displaying it.

---

## 3. Detection quality — the leads you actually want

The whole thesis of this business is that a missing `websiteUri` is not the only signal, and
often not the best one. A business with a Facebook page and nothing else is a *better* lead than
one with no web presence at all: they have already demonstrated they want to be found online,
and they have photos and hours you can lift.

**Does `websiteUri` contain Facebook/Linktree/DoorDash URLs? Policy says no; practice says
sometimes. UNCERTAIN — and this nuance matters.**

- **VERIFIED** — the field is documented as *"The authoritative website for this place, e.g. a
  business' homepage."*
  https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places
- **VERIFIED** — Google Business Profile policy explicitly bars social URLs: *"Do not provide
  phone numbers or URLs that redirect or 'refer' users to landing pages or phone numbers other
  than those of the actual business, including pages created on social media sites."*
  https://support.google.com/business/answer/3038177 — and the business-links policy states
  *"Local business links cannot be: Social media sites, Messaging links, App store links, Link
  shorteners."* https://support.google.com/business/answer/13769188
- **UNCERTAIN** — enforcement is **reactive**, not validating. Google strips such URLs when it
  detects them, but owners set them constantly and they persist until caught. Only SEO-practitioner
  reports were found, no authoritative developer source. **Treat the `websiteUri` host as a signal,
  never as proof**, and expect `SOCIAL_ONLY` to be a smaller bucket than intuition suggests.

**VERIFIED — the `business.site` cohort, and a correction to the obvious assumption.** Google shut
down *Google Business Profile Websites* (auto-generated `business.site` / `negocio.site` sites):
*"Domains that end with business.site and negocio.site will be removed from the website field on
your Business Profile in March"* — sites off **2024-03-01**, redirecting to the Profile until
**2024-06-10**, then 404.
https://searchengineland.com/google-shutting-down-websites-business-profiles-436393

The correction: because Google **removed those URLs from the website field**, this cohort now
shows up as `NONE` (absent `websiteUri`), *not* as a detectable `FREE_SUBDOMAIN`. You cannot
enumerate them by host match. It remains a large, real cohort of businesses that had a web
presence in early 2024 and lost it — you just can't isolate them from the API. Aside from that
opt-in product, there is no evidence Google ever auto-populated `websiteUri` (**UNCERTAIN** — no
explicit denial found).

**Practical classifier** — do not store the URL long-term (see §1.5); classify at fetch time and
store only the resulting enum:

| Class | Signal | Lead quality |
|---|---|---|
| `NONE` | `websiteUri` absent | Good — but verify, Google may just lack the data |
| `SOCIAL_ONLY` | host ∈ {facebook.com, instagram.com, linktr.ee, m.me, tiktok.com} | **Best** — proven intent, no site |
| `AGGREGATOR` | host ∈ {doordash, ubereats, grubhub, toasttab, square.site, clover.com, yelp.com, opentable} | **Best** — paying a middleman already |
| `FREE_SUBDOMAIN` | host matches `*.wixsite.com`, `*.weebly.com`, `*.godaddysites.com`, `*.square.site` (**not** `business.site` — removed by Google, see above) | Very good — upgrade pitch |
| `DEAD` | own domain but DNS fails / HTTP ≥ 400 / parked-page fingerprint | Very good |
| `REAL` | own domain, resolves, 200 | Disqualify |

The `DEAD` and parked-domain checks require actually fetching the URL — that is your own HTTP
request to the business's own server, entirely outside Google's terms, and is the cheapest
high-signal enrichment available. **Do this.** It is also the only way to catch the largest
category of all: businesses whose site technically exists and is terrible.

**Which sources can distinguish these?** Google Places and Outscraper/Bright Data (same
provenance) expose the raw URL, so all six classes are computable. Foursquare exposes `website`
plus separate `link`/`menu` fields, which is actually *richer* — but you cannot use it. Yelp
Enhanced exposes the URL. OSM's `website` tag is unreliable in both directions. Only Google/
Outscraper give you both the URL **and** the ratings/photos/hours needed for the next step.

---

## 4. Signals to build a site from

Available from a single Places Enterprise-tier search response (**VERIFIED**, §1.2):
`displayName`, `formattedAddress`, `location`, `types`/`primaryTypeDisplayName`,
`nationalPhoneNumber`, `regularOpeningHours`, `priceLevel`, `rating`, `userRatingCount`,
`photos[]` (photo resource names). `reviews` requires the Enterprise + Atmosphere tier.

That is enough to auto-generate a credible one-page site: name, category, hero photo, address +
map, hours table, click-to-call, social proof from the rating.

### Photos — attribution is mandatory, and this is the sharpest legal edge in the build

**VERIFIED — how it works.** `GET https://places.googleapis.com/v1/{photos[].name}/media?key=…&maxWidthPx=…`
returns an HTTP redirect to the image bytes (`skipHttpRedirect=true` returns JSON instead); size
1–4800 px. Each `photos[]` entry carries an `authorAttributions` array with `displayName`, `uri`
and `photoUri`. Note also: *"You cannot cache a photo name. Also, the name can expire."* — so the
photo reference itself is not a stable identifier you can persist.
https://developers.google.com/maps/documentation/places/web-service/place-photos

**VERIFIED — the attribution requirement, quoted verbatim.** Place Photos docs:

> If the returned `photo` element includes a value in the `authorAttributions` field, you must
> include the additional attribution in your application **wherever you display the image**.

Places API Policies (https://developers.google.com/maps/documentation/places/web-service/policies):

> **You must always credit the author when displaying photos or reviews.** Each photo and review
> includes an author attribution (author's avatar image, name, and profile link).

> …if space is limited (such as in a gallery or for thumbnails), the author attribution can be
> omitted, provided that the user is able to access a larger version of the image that includes
> the full author attribution.

> For each photo and review, end-users must always have access to view the individual source
> photo or review on Google Maps using the provided `googleMapsUri`.

> When displaying Places API data without a Google Map, you must include the Google logo,
> adhering to the provided style guidelines and attribution requirements.

> When Google provides third-party attribution, only including "Google Maps" or the Google logo
> is not proper attribution.

Logo spec: ≥16 dp / ≤19 dp, or the text **Google Maps** with `translate="no"`, Roboto 400,
12–16 sp. Attribution should be the Google Maps logo where possible; the text "Google Maps" is
acceptable only where space is limited.

**VERIFIED — Maps Service Specific Terms, Places API section (§14 current numbering; §5 in the
2024-04-22 snapshot), quoted verbatim:**

> **14.1 *Use without a Google Map*.** Customer may use Google Maps Content from the Places API in
> Customer Applications without a corresponding Google Map.
> **14.2 *No use with a non-Google map*.** Customer must not use Google Maps Content from the
> Places API in conjunction with a non-Google map.
> **14.3 *Caching*.** Customer may temporarily cache latitude and longitude values from the Places
> API for up to 30 consecutive calendar days…

https://cloud.google.com/maps-platform/terms/maps-service-terms

§14.1 is the specific override of the general ToS §3.2.3(e) "No Use With Non-Google Maps", which
otherwise prohibits *"(i) display or use Places content on a non-Google Map."* Without §14.1 the
whole product would be barred.

**What this means for a generated site:**

1. You **may** put Places content (including photos) on a site that has no Google Map on it —
   §14.1 is explicit. This was the main open question and the answer is favourable.
2. You **must** show the Google logo wherever that content appears, **and** the per-photo author
   attribution (avatar/name/profile link), **and** a working `googleMapsUri` link so the visitor
   can reach the source photo/review on Google Maps. Google's own logo is not sufficient on its
   own where third-party attribution is provided — you need both.
3. If you put a map on the page, it **must be a Google map** — §14.2 forbids pairing Places
   content with Mapbox/Leaflet/OSM tiles. The cheap default (free Leaflet + OSM tiles + Places
   data) is a breach. Budget for the Maps JavaScript API or ship no map at all.
4. You **must not** download and re-host the photo bytes on your own CDN. The photo is Maps
   Content and the caching carve-outs cover only `place_id` and lat/lng. Serve it live from
   Google's photo endpoint at $7/1,000 requests — a **recurring per-pageview cost** on every
   delivered site, not a one-off build cost. The photo `name` also expires and cannot be cached,
   so each render needs a fresh Place Details call first: **two billed calls per pageview.**
   This alone makes Places photos unviable on a production site.
5. The photos are copyright of the individual Google contributor who took them, licensed through
   Google. They are **not** the business's photos, and the business does not acquire rights to
   them by buying a site from you. This is the most likely place for this product to generate a
   real complaint.

**The pragmatic answer:** use Places photos for the **pitch/demo** (short-lived, low traffic,
attributed) and replace them with the client's own photos on the **delivered** site. That
sidesteps the recurring photo cost, the re-hosting prohibition, the Google-map-only constraint
and the third-party-copyright problem in one move — and asking the client for photos is a normal
part of onboarding anyway.

---

## RECOMMENDATION

**Build against Google Places API (New), Text Search + Nearby Search at the Enterprise field-mask
tier, with a place_id-only persistence layer.**

Why: it is the only source that (a) has reliable US SMB coverage, (b) exposes the website URL so
all six lead classes in §3 are computable, (c) carries the phone/hours/rating/photos needed to
generate the site, and (d) can be used without buying scraped data from a reseller. `websiteUri`
being available in the *search* field mask (§1.2) removes the per-candidate second call that
would otherwise have doubled the cost — that finding is what makes the economics work at ~$35/1k
places rather than ~$55/1k.

**Architect it as:** grid × category sweep → for each result, classify `websiteUri` in memory →
persist **only** `{place_id, class, swept_at, geo_cell, category}` plus your own CRM columns →
re-fetch name/address/phone from Place Details at the moment of outreach or site generation.
Enrich with your own HTTP HEAD/GET against the candidate URL to find `DEAD` and parked domains —
that request is yours, not Google's, and it is the highest-signal, zero-cost enrichment you have.
Use OSM/Geofabrik as a free cross-check layer, never as the primary signal.

**The single biggest risk is legal, not technical: Google's terms prohibit the persistent lead
database this business needs, and the Acceptable Use Policy separately prohibits using Maps
content for bulk solicitation and for directory-listing products.** The place_id-only
architecture is a genuine mitigation for the caching clause — but it does not cure the AUP
problem, and there is no configuration of Google Places that makes "sweep a metro, build a
prospect list, cold-call them" clearly compliant. The whole business rests on a single API key
that Google can revoke unilaterally, without litigation, at any time.

**Mitigate by:** keeping sweeps low-volume and category-at-a-time rather than metro-wide;
never reselling or publishing the list; treating the CRM as a pipeline of place_ids rather than
a directory; and — the real hedge — **getting a Data Axle or equivalent licensed-data quote
early** (§2.4). If Data Axle can filter on a blank website field, it is dramatically more
expensive per record and dramatically safer, and it is the source you want to already be
migrating toward before the key gets pulled. Have counsel review §1.5, §1.6 and the Arizona
telephonic-seller registration question (§1.7) before scaling outreach.
