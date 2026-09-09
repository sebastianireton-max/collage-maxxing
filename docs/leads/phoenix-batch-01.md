# Phoenix lead batch 01 — businesses with no real website

**Scouted:** 2026-09-09 · **Area:** Phoenix metro (Phoenix, Glendale, Tempe, Mesa, Avondale)

**Method.** Google Maps place pages read directly for the `website` field on each Google
Business Profile, then **every listed URL resolved with `curl` / `openssl` / RDAP** to find out
what it actually serves. Corroborated against Facebook and Instagram, Maricopa County
food-permit inspection records, the AZ ROC licence file, and BBB. Ten leads below, ranked by
opportunity, drawn from roughly 90 businesses screened.

**The rule applied.** A website field being *present* disqualifies nobody. Only a **real,
working site** does. Six of these ten have a URL on their Google listing — and not one of those
URLs serves a site the business controls.

---

## How to read the evidence

Every lead states what the website field contained and **what resolving it showed**. Evidence
classes, strongest to weakest:

| Class | Meaning |
|---|---|
| **Resolved dead** | Their listed domain was fetched and is broken, parked, hijacked, or owned by a third party |
| **Absent + corroborated** | No website field, no own domain in any search, and a directory positively records "no website" |
| **Absent (guess-probed)** | No website field; plausible domains probed and NXDOMAIN. **Weakest** — NXDOMAIN on a *guessed* domain proves little by itself |

Trading status was confirmed via **Maricopa County food-permit inspection records** (food) or an
active BBB / Yelp / Facebook profile (trades). Owner names appear **only** where the business or
a public registry published them. **No people-search site, data broker, or residential-number
source was used anywhere in this batch.** Where that left a gap, the gap is recorded as
"no owner name found" rather than filled with a guess.

---

# 1. La Calidad Meat Market

- **Category:** Butcher shop / carnicería — premium cuts (A5 Wagyu, Australian Wagyu, tomahawk prime, lobster, scallops)
- **Address:** 4344 W Indian School Rd, Unit 25, Phoenix, AZ 85031
- **Phone:** (602) 715-2567
- **Best contact route:** Instagram DM — [@lacalidadmeatmarket](https://www.instagram.com/lacalidadmeatmarket/) is where they actually live (25K followers). Phone as backup.
- **Owner:** no owner name found. *(A first name circulated via a TikTok video; not a registry, licence, or published interview, so not used.)*

**Evidence of no-website status — Absent (guess-probed) + corroborated.**
No website field on the Google Business Profile (read 2026-09-09), and no own domain in any
search result. Probed, all NXDOMAIN: `lacalidadmeatmarket.com`, `.net`, `.shop`,
`lacalidad.com`, `lacalidadmeat.com`, `lacalidadaz.com`. Both `lacalidadmeatmarket.square.site`
and `lacalidad.square.site` return **404**. The only `.com` resolving for their name is
`sagemenu.com/phoenix/la-calidad-meat-market-phoenix/` — a third-party menu aggregator.

**Web presence they DO have:** [Instagram](https://www.instagram.com/lacalidadmeatmarket/) —
**25K followers, 673 posts** (verified first-hand 2026-09-09 via og:description: *"25K Followers,
539 Following, 673 Posts — La Calidad Meat Market ®️"*) ·
[TikTok](https://www.tiktok.com/@lacalidadmeatmarket) ·
[Threads](https://www.threads.com/@lacalidadmeatmarket) ·
[Yelp](https://www.yelp.com/biz/la-calidad-meat-market-phoenix) ·
[Phoenix New Times listing](https://www.phoenixnewtimes.com/location/la-calidad-meat-market-22719176/) ·
Google **4.8 / 100 reviews**

**Still trading:** Maricopa County permit `FD-23-02511` (Meat Market), 9 inspections, most recent
**2026-06-12 Grade A, 0 priority violations** —
[record](https://envapp.maricopa.gov/Permit/PermitResults/FD-23-02511). Single location: a
county-wide permit search for "CALIDAD" returns exactly one record.

**What they'd gain most.** They won
[Phoenix New Times Best Carnicería 2025](https://www.phoenixnewtimes.com/best-of-phoenix/2025/la-vida/best-carniceria-22726240/)
and sell genuinely high-ticket product to a 25,000-person audience **with nowhere to send them**.
Every Wagyu post converts to a drive-over or to nothing. Pre-order and holiday-box e-commerce is
the clearest revenue unlock in this batch. They already use ®️ in their profile name — they think
like a brand and have no property to put it on.

**Confidence: HIGH.** Address, trading status, and single-location status all confirmed against
county records. The no-website finding rests on absence rather than a resolved dead URL, which is
why it is not stated as certainty.

---

# 2. La Villa DF Mexican Food

- **Category:** Mexican restaurant — Mexico City style (tortas, tacos al pastor)
- **Address:** 8032 N 27th Ave, Phoenix, AZ 85051
- **Phone:** (602) 841-0569
- **Best contact route:** Phone, or Facebook DM — [facebook.com/lavilladf](https://www.facebook.com/lavilladf/)
- **Owner:** no owner name found

**Evidence of no-website status — Resolved dead. The strongest evidence in this batch.**
Their Google listing gives `orderlavilladfphx.com`. All three domains tied to them were resolved
on 2026-09-09:

```
orderlavilladfphx.com       HTTP 301 -> https, then the TLS handshake DIES.
                            openssl: "tlsv1 alert internal error ... SSL alert number 80"
                            No certificate is ever presented. Unreachable in any browser.

lavilladfphx.com            301 -> https://w69slots.org/   (200, 996 KB)
                            <title>W69 พื้นที่แฮงเอาต์ออนไลน์ ...</title>
                            A THAI ONLINE GAMBLING SITE — still indexed under their old
                            title, "La Villa DF – Authentic Mexican Cuisine".

lavilladfmexicanfoodaz.com  HTTPS broken ("wrong version number" — the server serves
                            non-TLS data on :443). HTTP serves a generic template titled
                            "FromTheRestaurant | Find Restaurants Near You". Not theirs.
```

The handshake failures were reproduced with `openssl s_client` independently of `curl`, to rule
out a client-side TLS quirk. They are server-side.

**Web presence they DO have:** [Facebook](https://www.facebook.com/lavilladf/) — **2,011 likes,
1,242 check-ins**, bio "cuidad de Mexico" (verified first-hand 2026-09-09) ·
[Instagram @lavilladf](https://www.instagram.com/lavilladf/) ·
[TikTok @lavilladf](https://www.tiktok.com/@lavilladf) ·
[Grubhub ordering page](https://www.grubhub.com/restaurant/tortas-y-tacos-la-villa-df-8032-n-27th-ave-phoenix/3115244) ·
Google **4.2 / 617 reviews**

**What they'd gain most.** Damage control first, a menu second. A customer who Googles them can
land on a foreign casino page carrying their restaurant's name. That is an active reputational
leak with a deadline on it, and it makes the outreach a warning rather than a pitch. 617 reviews
says the demand already exists; only the front door is missing. Established 2016 — they started
by selling food out of their house.

**Confidence: HIGH.** Three independent domain failures, reproduced with two different TLS
clients.

---

# 3. Unos Tacos y Birria

- **Category:** Taquería / birria — **three locations**, independently owned (not a franchise)
- **Address:** 7502 W Thomas Rd, Ste 1, Phoenix, AZ 85033 (original) · 1859 S Stapley Dr, Ste 106, Mesa, AZ 85204 · a third at 103rd Ave & McDowell Rd, Avondale
- **Phone:** Phoenix (602) 281-6840 · Mesa (480) 256-1314
- **Best contact route:** Phone (Phoenix), or Instagram/Facebook DM
- **Owner:** no owner name found

**Evidence of no-website status — Resolved dead.** They had a real site and let it lapse:

```
unostacosaz.com  ->  301  ->  https://www.unostacosaz.com/   HTTP 404
                     <title>Squarespace - Website Expired</title>
```

Verified first-hand 2026-09-09. The similarly-named `unostacos.com` resolves but is an unrelated
registrar lander (`window.location.href="/lander"`), not theirs.

**Web presence they DO have:** [Facebook](https://www.facebook.com/unostacosaz/) — **8,576 likes,
45 talking about, 4,188 check-ins**, tagline *"Real Tacos. Real Good 🌮🔥"* (verified first-hand
2026-09-09) · [Instagram @unostacosaz](https://instagram.com/UNOSTACOSAZ) ·
[TikTok @unostacosaz](https://tiktok.com/@unostacosaz) ·
**[linktr.ee/unostacosaz](https://linktr.ee/unostacosaz)** — a live Linktree now doing the job of
the site. *(Caveat: most outbound URLs on that Linktree page are Linktree's own affiliate ad
inventory, not the business's links.)* Mesa expansion permitted, per
[WhatNow Phoenix](https://whatnowphoenix.com/permit-in-the-works-for-unos-tacos-y-birrias-mesa-location/).

**What they'd gain most.** The largest deal on this list: three locations, one brand, 8.5K
followers, and a link-in-bio standing in for a website. They already paid for a site once, so the
premise needs no selling — the opener is "you already decided this mattered." A locations page,
per-site hours, catering enquiries, and a jobs page (their Linktree carries a job application
link) all have somewhere to live.

**Confidence: HIGH.** Expired-Squarespace title and 404 confirmed first-hand; follower counts
independently re-fetched.

---

# 4. AATCO

- **Category:** Auto upholstery / convertible-top specialist — family-owned since 1966
- **Address:** 10037 N Cave Creek Rd, Phoenix, AZ 85020
- **Phone:** (602) 870-3592
- **Best contact route:** Phone, or Facebook DM — [facebook.com/aatco.upholstery](https://www.facebook.com/aatco.upholstery/), which is actively posting
- **Owner:** no owner name found. *(ZoomInfo and RocketReach were the only sources offering names — deliberately not used.)*

**Evidence of no-website status — Resolved dead / hijacked.** No website field on the Google
listing, but search engines still index `aatcophx.com` under their old page titles ("Phoenix
Convertible Tops, Auto Upholstery Repair Scottsdale"). Resolved first-hand 2026-09-09:

```
aatcophx.com  ->  200, 63 KB
  <html lang="zh-CN">
  <title>开云·官方网站登陆入口-开云(中国)"</title>
  <meta name="keywords" content="开云·官方网站登陆入口,开云(中国)">
```

Their lapsed domain has been re-registered by a **Chinese gambling-spam operator** (开云 /
"Kaiyun"). The old real pages are gone — `aatcophx.com/Contact_Us.html` returns **404**. No
replacement domain exists: `aatcoupholstery.com` and `aatcoaz.com` are both NXDOMAIN.

**Web presence they DO have:** [Facebook](https://www.facebook.com/aatco.upholstery/) — active,
posting video and photo work; [one post](https://www.facebook.com/aatco.upholstery/posts/-phoenix-convertible-top-specialist-auto-upholstery-seat-repairs-classic-car-int/122216784956503283/)
carries the phone and **no website link** ·
[Yelp](https://www.yelp.com/biz/aatco-phoenix) (147 photos, updated July 2026) ·
[Atly](https://www.atly.com/location/AATCO) · Google **4.7 / 38 reviews**

**What they'd gain most.** Same urgency as La Villa DF: sixty years of reputation, and the domain
carrying their name now serves a gambling site to anyone searching for them. A classic-car and
convertible-top shop sells on portfolio — a gallery of restorations is the single
highest-converting asset they could own, and today there is nowhere to put one.
**Practical note:** check whether `aatcophx.com` is recoverable before promising it; a fresh
domain may be needed.

**Confidence: HIGH.** Hijack confirmed first-hand (Chinese-language markup and title quoted
above). Not ROC-licensed — but auto upholstery is not an ROC-licensed trade, so that is expected,
not a red flag.

---

# 5. Carniceria Michoacan

- **Category:** Mexican grocery / carnicería with deli taco counter and bakery
- **Address:** 3549 W Thomas Rd #104, Phoenix, AZ 85019
- **Phone:** (602) 272-1612
- **Best contact route:** Phone, or in person — the counter is where decisions get made. No social accounts exist to DM.
- **Owner:** no owner name found

**Evidence of no-website status — Resolved dead (third-party). Notable: the "vanity" domain on
their Google listing is not theirs.** Their listed website is `carniceriamichoacan.shop`:

```
carniceriamichoacan.shop  ->  301  ->  https://carniceria-michoacan.mappway.com/   200
```

The destination is an **auto-generated scraper listing**. Its own JSON-LD gives it away — the
breadcrumb is `Home (mappway.com) → Carniceria Michoacan`, with
`"datePublished":"2026-07-19"`. The page body carries the line **"Is this your business? Claim
this listing →"** — MappWay itself states the business has not claimed it. Reviews are lifted
from Google (951 there vs 958 on Google) and the prose is AI-written filler.

RDAP registration data shows the vanity domain belongs to the scraper, not the butcher:

```
mappway.com               registered 2026-03-27, Namecheap, NS *.ns.cloudflare.com
carniceriamichoacan.shop  registered 2026-05-18, Namecheap, NS *.ns.cloudflare.com
                          last changed 2026-07-22 — matches the listing's dateModified
```

Same registrar, same DNS provider, dates in lockstep. **MappWay buys the matching domain and
301s it at its own subdomain**, which is exactly why it appears in Google's website field and
looks, at a glance, like the business's own site.

Their name is carved up across **five** such shells, none of which they own: `mappway.com` ·
`menu-world.com` · `localoria.com` · `restaurants-us.com` · `zmenu.com` — plus
[Postmates](https://postmates.com/store/carniceria-michoacan-3549-wthomas-rd/KO3lMydaWSeGyI0J_wS8xQ),
Yelp, Superpages, MerchantCircle, Apple Maps and Snapchat.

**Web presence they DO have:** none of their own. **No Facebook or Instagram account was found in
any search.** Google: **4.3 / 958 reviews.**

**Still trading:** four current Maricopa County permits at that address — `FD-09413` (Eating &
Drinking), `FD-09414` (Retail Food), `FD-09415` (Meat Market), `FD-13921` (Bakery). The four
permits confirm the market + butcher + deli + bakery operation.

**What they'd gain most.** 958 reviews, and *five separate companies* are monetising their search
results while they own none of it — one of which registered a domain in their name. The pitch
writes itself: "type your own name into Google; every result belongs to someone else." A real
site plus a claimed profile takes it back. They also have the largest review count here with the
absolute thinnest owned presence — literally zero.

**Confidence: HIGH.** Redirect chain, MappWay schema, publication dates and RDAP registration
records all verified; trading status confirmed against county permits.

---

# 6. Mariscos Mi Lindo Guaymas (Van Buren)

- **Category:** Seafood restaurant / pescadería — **3 locations** (Van Buren, W Indian School, Mesa)
- **Address:** 3037 W Van Buren St, Phoenix, AZ 85009 *(county permit reads 3041 W Van Buren — an adjacent unit in the same strip)*
- **Phone:** (602) 278-0296 — from their own Facebook structured contact data
- **Best contact route:** Instagram DM — [@milindoguaymas31](https://www.instagram.com/milindoguaymas31/), 5,053 followers, is their liveliest channel
- **Owner:** no owner name found

**Evidence of no-website status — Resolved dead.** `milindoguaymas.com` resolves (200, 40 KB) but
is **not a working site**. Verified first-hand 2026-09-09 — the rendered page ends with the
literal line:

> *"This is a free demo result from the Wayback Machine Downloader. Click here to download the full version."*

It is a scraper's static dump of a **dead, never-finished Odoo storefront**: lorem ipsum still in
the body, and promotional blocks reading *"Get Best Burger"* and *"Get Big Pizzas"* — on a seafood
restaurant's domain. Internal links 404 (`/contactus` → 404). Grepping the source for
`Van Buren`, `Phoenix`, or any phone number returns **zero hits**. `mariscosmilindoguaymas.com` is
NXDOMAIN.

**Web presence they DO have:** [Facebook](https://www.facebook.com/pescaderiamilindoguaymas/) —
1,519 likes, 147 check-ins, address in the bio, **no website link** ·
[Instagram — 5,053 followers](https://www.instagram.com/milindoguaymas31/) ·
[Postmates](https://postmates.com/store/mariscos-mi-lindo-guaymas/GQ3kUR4RXBKzH5KM5NPHWA) ·
Snapchat place · Google **4.3 / 207 reviews**

**Still trading:** permits `FD-71161` / `FD-71384`. Inspection 2026-07-14 Grade B with 1 priority
violation, **cleared on re-inspection 2026-07-17** —
[record](https://envapp.maricopa.gov/Permit/PermitResults/FD-71161).

**What they'd gain most.** Three locations with one dead domain between them. **Handle with care:
they have already been sold a website once and it was abandoned half-built** — expect scar tissue,
and lead with what went wrong last time rather than what's possible. The upside is real: 5,053
Instagram followers and a maintained Postmates page prove they will keep a channel alive when it
works.

**Confidence: HIGH** on no-website. **Medium** on who to pitch — this is a three-location family
group, so the decision-maker may not be at the Van Buren counter.

---

# 7. Carniceria El Camino 1

- **Category:** Mexican grocery / carnicería with a food counter (gorditas and menudo at weekends)
- **Address:** 3205 W McDowell Rd, Phoenix, AZ 85009
- **Phone:** **(602) 278-8016** — the number on their own Facebook, Yelp and YellowPages. Google Maps lists **(480) 531-2970**, also confirmed on [Yandex Maps](https://yandex.com/maps/org/carniceria_el_camino_1/181681201748/). **Try the 602 first.**
- **Best contact route:** Phone (602 number), or in person
- **Owner:** no owner name found

**Evidence of no-website status — Absent + corroborated.** No website field on the Google listing.
Searches on the name and on both phone numbers return only directories — Yelp, YellowPages,
Superpages, Waze, Apple Maps, Nextdoor, Manta. `carniceriaelcamino.com` is NXDOMAIN. Their
[Facebook page](https://www.facebook.com/CarniceriaElCamino/) carries **no website field**, and its
single outbound link is to a **Phoenix New Times 2005 award page** for Best Carnicería.

**Web presence they DO have:** [Facebook — 22 likes](https://www.facebook.com/CarniceriaElCamino/),
effectively dormant · [Yelp](https://www.yelp.com/biz/carniceria-el-camino-phoenix) ·
Google **4.4 / 407 reviews**

**Still trading:** three active county permits at that address — `FD-01329` (Eating & Drinking),
`FD-01419` (Retail Food), `FD-01422` (Meat Market). Most recent inspection **2026-07-22 Grade A,
0 priority violations**; 2026-04-27 and 2026-01-07 also Grade A —
[record](https://envapp.maricopa.gov/Permit/PermitResults/FD-01422).

**What they'd gain most.** The starkest reputation-to-presence gap in the batch: **407 Google
reviews, and a 22-like Facebook page is their entire internet.** Around 35 years trading and a
2005 New Times award, all invisible online. Weekend gorditas and menudo give a standing reason
for an hours-and-specials page people would genuinely check.
**Bonus:** Taqueria El Camino next door at 3211 W McDowell (permit `FD-03185`) is likely the same
family — potentially two properties from one conversation.

**Confidence: HIGH** on trading status and no-website. **Medium** on which phone number is live.

---

# 8. Paradise Valley Barber Shop

- **Category:** Barber shop — trading since 1975 (per Yelp copy)
- **Address:** 10855 N Tatum Blvd #130, Phoenix, AZ 85028
- **Phone:** (480) 948-0774 — published on their own Facebook page
- **Best contact route:** Phone. Their Facebook is dormant (28 followers, no posts), so a DM will likely go unread.
- **Owner:** no owner name found. *(A Yelp review names "barbers George and Eddy Z." — that is a review, not a registry, so it is not reported as ownership. The AZ Barbering & Cosmetology Board licence lookup now requires a portal account.)*

**Evidence of no-website status — Resolved dead, three different ways.** This is the most
thoroughly broken web presence in the batch:

```
1. Google listing's website:
   barberboard.az.gov/paradise-valley-barber-shop
     -> redirects to bcb.az.gov/paradise-valley-barber-shop
     -> HTTP 404, "Page not found | Barbering and Cosmetology Board"

2. The website on their OWN Facebook page:
   pvallergy.com  ->  200, but only 114 bytes:
   <!DOCTYPE html><html><head><script>window.onload=function(){
   window.location.href="/lander"}</script></head></html>
   A parked-domain lander. (An allergy-clinic domain, presumably mis-entered
   years ago and since expired.)

3. The obvious domain for their name:
   paradisevalleybarbershop.com  ->  301  ->  arizonamensgrooming.com  (200, 117 KB)
   OWNED BY A COMPETITOR — Arizona Men's Grooming, 10810 N Tatum Blvd Ste 118,
   623-227-8426. Two buildings north of them.
```

*Methodological note:* `curl` returned a misleading **403** on `bcb.az.gov` — that body is a
Cloudflare bot challenge (`Just a moment...`, `window._cf_chl_opt`), not the page's real status.
Loaded in a real browser it is a clean **404**. The conclusion is unchanged; the evidence is now
correct.

**Web presence they DO have:** [Facebook](https://www.facebook.com/people/Paradise-Valley-Barber-Shop/100069156824998/) —
28 followers, **"No posts available"**, dormant · a
[Fresha page](https://www.fresha.com/lvp/paradise-valley-barber-shop-north-tatum-boulevard-phoenix-QvVxE3)
that states verbatim *"The business is not currently affiliated with or partnered with Fresha"* ·
Yelp (39 reviews, updated June 2026) · Nextdoor · Google **4.6 / 106 reviews**

**What they'd gain most.** Fifty years in business and **a competitor two buildings away owns the
domain that carries their name** — anyone searching "Paradise Valley Barber Shop" and guessing the
URL lands on a rival. That is the most urgent, most concrete pitch on this list, and it is not
even the only breakage: their state-directory listing 404s and their own Facebook points at a
parked allergy domain. Even a one-page site with hours, barbers and a phone number would recapture
traffic currently being handed to a competitor.

**Confidence: HIGH.** All three failures verified, with the 403-vs-404 correction resolved in a
real browser. Trading confirmed via current Fresha hours and a June 2026 Yelp update.

---

# 9. Stash House AZ

- **Category:** Nail salon / beauty collective — independent nail, wax, hair and lash artists renting chairs (est. 2014)
- **Address:** 517 W Thomas Rd, Phoenix, AZ 85013
- **Phone:** (602) 266-8168 — published on their own Square booking page
- **Email:** stashhouseaz@gmail.com — published by the business
- **Best contact route:** Phone or email (both self-published); Instagram DM as backup
- **Owner:** no owner name found

**Evidence of no-website status — Resolved dead (parked).** They own the obvious domain and never
built on it. Verified first-hand 2026-09-09:

```
stashhouseaz.com  ->  200, but only 114 bytes:
<!DOCTYPE html><html><head><script>window.onload=function(){
window.location.href="/lander"}</script></head></html>
```

A registrar parking stub; `/lander` itself returns `Access Denied`. Their
[Linktree](https://linktr.ee/StashHouseAz) carries **18 links and not one own-domain link** —
every one points to Instagram, GlossGenius, Square or Booksy. Their Square booking page has no
website field.

**Web presence they DO have:** [linktr.ee/StashHouseAz](https://linktr.ee/StashHouseAz) (18 artist
booking links) ·
[Square booking page](https://square.site/book/B8RTQJP1BAB4T/stash-house-az-phoenix-az) with live
2026 pricing, which also confirms active trading ·
[Instagram](https://www.instagram.com/stashhouseaz) ·
[Facebook](https://www.facebook.com/StashHouseAz/) ·
[TikTok](https://www.tiktok.com/@stashhouseaz) · also listed on Booksy and Fresha

**What they'd gain most.** A multi-artist salon is the worst possible fit for a link-in-bio: 18
links is a menu with no structure, and a client who wants "a nail artist who does chrome" has to
open them one at a time. A real site with artist profiles, specialisms and portfolios routes each
client to the right chair — and gives the collective a brand its individual artists currently
carry instead. **They already bought the domain**, which removes the hardest objection before it
is raised.

**Confidence: HIGH.** Parked-domain signature confirmed first-hand; address, phone and pricing all
self-published by the business.

---

# 10. Pescaderia El Waco

- **Category:** Seafood market / pescadería (shrimp, lobster, ceviche, octopus, campechana, prepared oysters)
- **Address:** 2201 N 83rd Ave, Ste 105, Phoenix, AZ 85035
- **Phone:** (623) 247-9096 — **but see the pain signal below**
- **Email:** **pescaderiawaco1@gmail.com** — published on their own Facebook About block
- **Best contact route:** **Email or Facebook DM, not the phone.**
- **Owner:** no owner name found

**Evidence of no-website status — Absent + corroborated.** No website field on the Google listing.
Searches return an unusually long tail of scraper directories and nothing they own: Atly,
CitySquares, ezlocal, DexKnows, wanderboat, Roadtrippers, Yahoo Local, Yelp.

**Web presence they DO have:** [Facebook — 632 followers](https://www.facebook.com/pescaderiaelwaco/),
with address and email in the About block (read first-hand 2026-09-09) ·
[Instagram @elwacopescaderia](https://www.instagram.com/elwacopescaderia/) ·
Google **4.7 / 67 reviews**

**⚠ Pain signal — use this in the outreach.** On their own Facebook page, a customer commented
*"No funciona el número de teléfono"* — the phone number doesn't work. The business replied:
*"hay un problema en la plaza y no eatan areilandolo"* — there's a problem at the plaza and it
isn't being fixed. That exchange is 14 weeks old and still standing. **A business whose phone is
broken and whose only remaining contact channel is a Facebook comment thread is losing orders
right now**, and they already know it. Lead with that, not with design.

**What they'd gain most.** A working contact channel they control, independent of a landlord's
phone line: order form, WhatsApp link, live hours. Fresh seafood is a "what's in today" business,
which is exactly what a simple updatable page does well. They rank #1 for *fresh seafood in
Phoenix* on a third-party directory while owning none of their own search results.

**Confidence: HIGH** on no-website and on the pain signal, both read first-hand. **Medium** on
phone reachability — by their own account, it may not work.

---

# Runners-up

Qualified and verified, but ranked below the top ten — smaller audiences, thinner contact detail,
or lower ticket value.

| Business | Category / Location | The gap | Why it ranked lower |
|---|---|---|---|
| **Panaderia y Pastelería Acapulco** | Bakery, 2340 W Thomas Rd | Google "website" is a Facebook **personal profile** (not even a Page), About tab completely empty | Only 16 reviews / 550 FB followers. **The one lead with a registry-sourced owner name — see below** |
| **VN Barbershop** | Barber, 4803 N 27th Ave | No site; Facebook is an auto-generated **"Unofficial Page" with 0 followers**; no Instagram at all | 97 reviews but low ticket. Zero owned presence of any kind — nothing to build from |
| **Trim Fit Upholstery Co** | Auto upholstery, 85009 | No site; **BBB's "Website" field points at their Facebook page** | 56 years trading, 4.8/40. Owner **David Spiegel, President** per [BBB principal listing](https://www.bbb.org/us/az/phoenix/profile/auto-upholstery/trim-fit-upholstery-co-1126-2072) — a directory, not a state registry |
| **Tire in the Corner (Llantera El Ricon)** | Tire shop, 6824 N 27th Ave | No site, and **no phone on Google**. Phone recovered: **(602) 242-9302**, corroborated by BBB, YellowPages and loc8nearme | 30 years trading. **Caveat:** a similarly named shop at 1915 W Osborn Rd *does* have a site (`llanteriaelrincon.com`) — confirm on the call they aren't the same ownership |
| **Pescaderia Mariscos De Guaymas** | Seafood market, 85035 | No site; 488 FB likes | Google's phone (602) 253-6988 conflicts with Facebook's (480) 453-2684 |
| **Panadería y Pastelería La Mejor** | Bakery, 5819 S 16th St | No site; 20+ years, PNT Best Panadería 2018 | Follower scale not confirmed |
| **Baja Roots** | Food truck, downtown | `bajarootsaz.com` → **404** | **No phone published anywhere** — Instagram DM only. Owner **Emilene Carillo** per [PNT profile](https://www.phoenixnewtimes.com/food-drink/with-baja-roots-emilene-carillo-brings-tijuana-style-eats-to-phoenix-19079743/). PNT Best Mexican Food Truck 2024 **and** 2025 |
| **Sew Used** | Thrift/vintage, Culdesac Tempe | `sewused.com` **parked** (114-byte lander); their Square site still shows placeholder `(555) 555-5555` | Two published addresses after expanding — confirm which is current. Owners Justin Gonzalez and Juju Smith, per Tempe News |
| **Santiago's Barbershop** | Barber, 2901 W Thomas Rd | Google "website" is a bare Square Appointments booking widget — one page, empty `<title>`, no About/Gallery/Contact | **Phone conflict:** their own Square page and Facebook both say **(602) 339-7452**, not Google's (602) 314-6913 |
| **SinSonNay** | Birria y mariscos, 2822 W Van Buren | No site; 2,216 FB likes, 2,792 check-ins | All domain variants NXDOMAIN (guess-probe class) |
| **Whimsical Pastries** | Custom cakes, Avondale | No site; **~15K Instagram**; Square inquiry form only | No phone or street address published anywhere |
| **Panaderia La Obregonense** | Bakery, 3446 W Camelback | No site; **2.4K FB followers**, posting daily | Opened June 2026 — very new |
| **Panaderia El Guero** | Bakery, 2535 E Bell Rd | No site; 1,555 FB likes | Thinner corroboration |
| **Fer's Auto Upholstery** | Glendale, 85303 | No site; Yahoo Local records **"Website: not provided"** | No confirmable Facebook or Instagram — no brand assets to build from |
| **Desert Garden Lawn Care** | Landscaping | Listed domain `desertgardenlawns.com` is a **parked domain** — its own HTML says so | Only 13 reviews |

**The one registry-sourced owner name in this batch.** Panaderia y Pastelería Acapulco trades as
**Acapulco Panaderia Y Postres, LLC** (entity 23429549, Active, formed 2022-09-28, principal
address 2340 W Thomas Rd), member and statutory agent **Jacqueline Camara Baltazar**. Source:
[bizprofile.net](https://www.bizprofile.net/az/phoenix/acapulco-panaderia-y-postres), which states
its own provenance verbatim — *"extracted from the Arizona Business Center
(https://arizonabusinesscenter.azcc.gov/businesssearch) as of 9/2/2026"*. That is a mirror of the
state corporate registry, not a people-search site. Note they trade under **five** name variants
across county permits, Google, Facebook, Instagram and the LLC filing, with no canonical brand
anywhere — itself a reason to want a site.

---

# Disqualified — and why it matters

The judgement cuts both ways. These were checked and dropped:

- **Goodman's Landscape Maintenance** (178 reviews) — *nearly shipped as a lead.* The apex
  `https://goodmanslandscape.com` serves a certificate that expired 2026-03-03. But the `www`
  host, which is what their listing actually points to, returns **200 and a working 162 KB site**
  with a proper title. Only the bare-domain cert is stale. **Not a lead.**
- **Salon Jalisco** (74 reviews) — `salonjaliscoevents.com` returns just 1,562 bytes, which looks
  like a placeholder. It is a real React SPA that renders client-side, with a proper title and
  meta description. **Not a lead.**
- **Carniceria Los Pinos** (219 reviews) — **UNCERTAIN, excluded.** `carnicerialospinos.com`
  resolves to an unfinished Weebly shell still carrying Square's factory defaults
  (`"phone":"(555) 555-5555"`, `"street":"Market Street"`, San Francisco). Arguably a lead — but
  it is registered under "Carnicería Los Pinos LLC" and the family runs about three carnicerías,
  so "you have no website" would be met with "we started one." Pitch the group, not this store.
- **Paradise Green Landscaping** — excluded; see the competitor note below.
- **Elite Barber Shop, Glendale** (3,424 FB likes) — looked like the best barbershop lead until
  Yelp returned "CLOSED — Updated January 2026". Instagram hours suggest otherwise; unresolvable
  from public sources, so it fails the "skip permanently closed" rule.
- **Around 30 others** dropped for having real, working sites — including Los Taquitos, Hola
  Cabrito, Panaderia La Central, Carniceria Mi Casita, Peoria Cafe, Mamma Toledo's, K-Cakes,
  Laz Barbershop, Deluxe Salon and Blue Plate Co.

---

# ⚠ Competitive intelligence — worth reading

While verifying **Paradise Green Landscaping LLC**, a live page turned up ranking for their name.
It is not theirs. It is a **spec site already built by a competitor running this exact play**:

```
https://plumesites.com/site/paradise-green-landscaping-llc-dn5acpq   200, 51 KB
  <title>Paradise Green Landscaping LLC | Phoenix, AZ Landscaping Services</title>
  ...carrying the business's real phone, 602-421-1175

https://plumesites.com/
  <title>Plumesites — Websites that win more jobs for local trades</title>
  <meta name="description" content="We already built you a website — take a look, free.
  Beautiful, trust-building websites for landscapers and home-service pros.
  See it before you pay.">
```

That is this project's own pitch, near-verbatim, already in market on Phoenix trades. Their page
cites *"5-star rating on Google (based on 23 reviews)"* against 25 as of 2026-09-09 — so it was
scraped recently and is being kept current. Two implications: **the Phoenix landscaping vertical
is already being worked**, which is part of why this batch skews toward food retail and auto
trades; and Paradise Green has probably already had this call.

---

# Notes on sources and limits

- **Google Maps** place pages were read directly for the `website`, `phone` and `address` fields on
  2026-09-09. Nothing was cached or retained beyond what appears above.
- **Maricopa County food-permit records**
  ([search](https://envapp.maricopa.gov/EnvironmentalHealth/FoodInspections)) are the best
  "is it still open" proof available for food businesses — permit number, inspection dates and
  letter grades. Used for leads 1, 5, 6, 7.
- **AZ ROC** publishes daily active-licence CSVs at
  [roc.az.gov/posting-list](https://roc.az.gov/posting-list) (the 2026-09-08 file holds 57,994
  records) — far more usable than the search UI. **None of the landscapers screened held an active
  ROC licence**, which matters commercially: unlicensed contractors may only take jobs under
  $1,000, capping deal size. That is part of why landscaping is under-represented here.
- **The Arizona Corporation Commission is no longer publicly searchable.** `ecorp.azcc.gov` now
  redirects to a login, its API returns `401 Authentication Failed`, and the replacement public
  search is CAPTCHA-gated. **No login, paywall or CAPTCHA was bypassed.** That is the single
  reason most leads read "no owner name found" — the registry that would legitimately supply those
  names is closed. No people-search site or data broker was used as a substitute.
- **Facebook** is login-walled to normal fetching; page identity and follower counts were read via
  public `og:` metadata, which exposes name, city, likes and check-ins but never address or phone.
  Where an address or phone is attributed to Facebook above, the business had published it in its
  own About block or post text.
- **Instagram** serves a login wall to non-browser clients, so link-in-bio fields could not be
  read. That is the one place a website URL could still be hiding for leads 1 and 6 — the domain
  probes make it unlikely, but not impossible.
- **`curl` returned misleading 403s** on `bcb.az.gov`, `ecorp.azcc.gov`, `mappway.com` and Yelp —
  these were Cloudflare bot challenges, not real statuses. Anywhere a 403 changed a conclusion, it
  was re-checked in a real browser.
- **`docs/lead-sources-research.md` does not exist in this repo**, so the licence-and-retention
  rules the scout contract points at could not be applied. Nothing here was bulk-stored: this file
  records observations with their source URLs and the date observed, which is the conservative
  reading. **That document should be written before any of this goes into a database.**

---

*Every field above traces to a URL fetched or a page read on 2026-09-09. Where something could not
be determined, it says so. Nothing here was inferred or invented.*
