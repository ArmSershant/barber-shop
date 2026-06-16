# Barber-Shop.am — Design, UX & Growth Playbook

A research-backed set of suggestions for making the platform more beautiful and more
"saleable." Tailored to what we already have: a trilingual (hy/en/ru) two-sided
booking **marketplace** for Yerevan (shops + independent barbers; guests can book
without an account).

> Sources referenced: Webflow "Made in Webflow / Barbershop" gallery (Brohouse, Beard X
> by BRIX, Fadeboss, The Gentlemen's Lounge, Barbershop Jordaan, Franklin, Enzo's,
> Pro Barbers) for *single-shop landing aesthetics*; and the category leaders
> **Squire, Fresha, Booksy, StyleSeat, Treatwell** for *marketplace & booking UX*.
> Web search wasn't available in this session, so treat the competitor notes as
> expert summary rather than a fresh audit.

---

## 0. The core insight

We are **two products in one** and each has a different "sale":

1. **Customer side** — the sale is *"book this barber now."* Optimise for speed,
   trust, and great photos.
2. **Provider side** — the sale is *"list your shop here / it's worth it."* Optimise
   for a credible landing page + an obvious, low-friction signup and a profile that
   makes them look good.

Most barbershop sites you'll find (the Webflow gallery) are **single-shop landing
pages** — gorgeous, but they only solve #1 for one business. The booking platforms
(Squire/Fresha/Booksy) solve the marketplace problem but often look generic. **Our
edge is to make the marketplace feel as crafted as a boutique single-shop site.**

---

## 1. Visual identity & mood

The barber category has a very recognisable aesthetic. The best sites lean into one of
two directions — pick one deliberately:

- **Heritage / masculine / vintage** (most common): dark charcoal + warm metallics
  (brass/gold/amber), barber-pole red accents, serif or condensed display type, grain
  textures, sepia photography. See *Brohouse, The Gentlemen's Lounge, Fadeboss*.
- **Clean / modern / premium** (what reads as "expensive software"): lots of
  whitespace, one confident accent, big type, crisp photography. See *Barbershop
  Jordaan, Squire*.

**Recommendation for us:** keep the **clean/modern** base we just built (it scales to a
marketplace and to 3 languages), but inject **one or two heritage cues** so it reads
"barber," not "generic SaaS":

- Add a **warm secondary accent** (amber/brass `#C8962B`-ish) alongside the teal, used
  sparingly for highlights, ratings stars, "featured" badges.
- Pick a **display font for headings only** (e.g. a condensed/strong face like
  *Bebas Neue*, *Archivo*, *Anton*, or a refined serif like *Fraunces*) while keeping
  the clean system font for body. One font swap changes the whole personality.
- Use **real photography** as the single biggest upgrade (see §7). Empty avatars with a
  letter is the #1 thing making it look like a prototype.

---

## 2. Homepage (marketplace landing)

The homepage's only job: get a visitor to **search/browse** or **sign up as a
provider**. Structure that converts:

1. **Hero with a search bar, not just buttons.** The single highest-impact change.
   Fresha/Booksy lead with *"Service or business"* + *"Location/District"* + a Search
   button. Let visitors type "fade" or pick a district and go straight to results.
2. **Trust strip** under the hero: "X barbers · Y shops · Z districts in Yerevan" +
   tiny logos/avatars. Numbers = credibility.
3. **Popular / top-rated barbers** carousel pulled live (we already sort by rating &
   district — surface it on the home page).
4. **Browse by district** — clickable chips (Kentron, Arabkir, Nor Nork…). Great for
   local SEO and for the "near me" instinct.
5. **How it works** — 3 steps (search → pick a time → book, no account needed). We have
   the feature cards; reframe them as a numbered flow.
6. **For barbers** band (we have it) — make it a proper section with a benefit list +
   "free to join."
7. **Social proof** — a few real reviews/testimonials.
8. **Footer** with districts, languages, links — good for SEO and trust.

## 3. The profile pages are the money pages

A barber/shop profile is where the booking decision happens. Treat each one like a
**mini landing page** (this is exactly what Squire does per-shop). Priorities:

- **Hero with a cover photo / gallery**, not just an avatar. Photos of the shop and of
  actual haircuts sell more than anything.
- **Sticky "Book" CTA** (sticky on mobile especially) so it's always one tap away.
- **At-a-glance bar:** rating ★, review count, district, "open now / closes 20:00",
  price range (from ֏X).
- **Services as a clear menu** with duration + price (we have this) — add a per-service
  "Book" button so people can book the exact service.
- **Portfolio gallery** (we already have a `portfolioImages` model — surface it!). A
  grid of past cuts is the strongest conversion driver for barbers.
- **Reviews with substance** — show rating distribution, let customers see recent
  comments. (We have reviews; add an average + count header and maybe photos.)
- **Map embed** for shops (address → little map). Boosts trust + local SEO.
- **"Meet the barbers"** on a shop page (we have the roster) with each one's rating.

## 4. Booking flow (conversion)

This is where marketplaces win or lose. Principles from Fresha/Squire/Booksy:

- **As few steps as possible**, progress shown: Service → Date/Time → Details →
  Confirm. (We're close.)
- **Show the running summary** (service, price, duration, total) persistently during
  booking.
- **Guest booking front-and-centre** (we have it) — "Book as guest, no account" removes
  the #1 drop-off. Offer optional account creation *after* booking.
- **Time slots as tappable chips**, grouped Morning/Afternoon/Evening, with the next
  available highlighted. Grey out taken ones (we compute availability already).
- **Confirmation that feels real**: success screen + email (done) + "add to calendar"
  (.ics) link + the manage link.
- **Reminders** (we have the cron) — also offer SMS later (huge for no-show reduction
  in this market).
- **Micro-reassurance** near the button: "Free cancellation up to X hours," "You won't
  be charged now."

## 5. Monetisation & "saleable" levers

We already plan a **per-booking commission** to providers (free for clients). Ways to
strengthen the business model and the *perceived* value:

- **Featured / promoted listings** — providers pay to appear at the top of a district's
  results or the homepage carousel. Classic marketplace revenue, easy to add (a
  `featured`/`rank` field + a badge).
- **Subscription tiers for providers** — Free (basic listing) vs Pro (portfolio
  gallery, more photos, analytics, priority support, "Verified" badge). Mirrors
  Squire/Booksy.
- **No-show protection** — optional deposit/card-on-file at booking (later, once
  payments land). Big selling point to barbers.
- **Reviews & ratings = retention flywheel** — prompt every completed booking for a
  review (we send a notification; make the ask prominent).
- **Rebooking nudges** — "It's been 4 weeks since your last cut with X — book again."
  Email/notification. Very high ROI for barbershops specifically (regular cadence).
- **Gift cards / packages** (later) — "5 cuts for the price of 4." Strong in this
  vertical.
- **Provider analytics dashboard** — bookings, revenue, repeat-rate, busiest hours.
  Makes the commission feel worth it and increases stickiness.

## 6. Trust, credibility & local nuance

- **"Verified" badge** for approved providers (we have admin approval — show it).
- **Real reviews only** (tie to completed bookings — we already do this).
- **Phone + Instagram** prominent (Armenian customers heavily use Instagram/phone —
  link both; we have the fields).
- **Bilingual content gracefully** — service names already translated; make sure
  district names, hours, and empty states all read naturally in hy/ru.
- **WhatsApp/Telegram contact** option for shops (common in the region).
- **Clear cancellation policy** text per shop.

## 7. Photography & content (biggest visual upgrade)

This is the single most important thing separating "prototype" from "real product":

- **Photo uploads** (logo, barber portrait, barber + shop cover, portfolio + shop gallery):
  ✅ **done** via Vercel Blob, with cleanup of replaced/deleted files.
- Provide **tasteful fallbacks**: a branded gradient + initial (we have initials) is
  fine as a placeholder, but cover images change everything.
- Consider **seeding demo shops with stock barber photos** so the marketplace never
  looks empty at launch (a cold marketplace is the hardest sell).

## 8. Motion & polish (we've started this)

- Page transitions + staggered reveals: done. Keep them subtle.
- Add **skeleton loaders** for lists/profiles instead of a bare spinner (feels faster,
  more premium — Mantine has `Skeleton`).
- **Hover/focus states** everywhere (cards lift — done; add to buttons/links).
- **Sticky, condensing header** on scroll.
- Respect reduced-motion: done.

## 9. SEO & performance (we've started this)

- Metadata, OG, sitemap, robots, JSON-LD: ✅ done.
- **Per-district landing pages** ("Barbers in Kentron"): ✅ done + homepage district chips.
- **OG images**: ✅ dynamic site-level OG/Twitter image; profiles also expose their photo as the OG image.
- **Image optimisation** via `next/image`: still open — uploads render via Mantine `Image`/`<img>`; switching to `next/image` (with the Blob domain allow-listed) would add resizing.
- Keep Core Web Vitals green (Speed Insights added).

---

## 10. Prioritised next steps (for our stack, highest ROI first)

Status as of 2026-06 — almost the entire list shipped.

| # | Change | Why | Effort | Status |
|---|--------|-----|--------|--------|
| 1 | **Photo uploads** (cover, portrait, portfolio) | Biggest "real product" upgrade | M | ✅ Done |
| 2 | **Hero search bar** on home (service + district) | Marketplace conversion starts here | S | ✅ Done |
| 3 | **Profile = landing page** (cover, sticky Book, at-a-glance bar, portfolio grid) | This is where bookings happen | M | ✅ Done |
| 4 | **Per-district landing pages** + homepage district chips | Local SEO + intent | S | ✅ Done |
| 5 | **Display font + warm accent** | Instantly reads "barber," not generic | S | ✅ Done |
| 6 | **Skeleton loaders + per-service Book buttons** | Perceived speed + fewer taps | S | ✅ Done |
| 7 | **Featured listings + Verified badge** | First real monetisation lever | M | ✅ Done (billing pending) |
| 8 | **Rebooking & review nudges** | Retention flywheel unique to this vertical | M | ✅ Done |
| 9 | **Provider analytics** | Justifies commission; stickiness | M | ✅ Done |
| 10 | **Seed demo content** before launch | Avoid cold-marketplace problem | S | ⏭️ Skipped (onboard real barbers instead) |

Also shipped beyond this list: favorites, email verification + password reset, .ics
calendar attachment, dynamic OG image, blob cleanup, gated SMS, customer account page.

**Only major item remaining: online payments / commission (Phase 3)** — the featured/
verified data model + ranking already exist; only the billing/charging layer is missing.

S = small, M = medium.
