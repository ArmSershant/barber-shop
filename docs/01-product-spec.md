# Sapor — Product Specification

## 1. Vision & positioning

Sapor is a two-sided marketplace for the **barber market in Yerevan**. Demand side: clients who want to find a good barber and book a slot without phone calls or Instagram DMs. Supply side: barber shops and independent barbers who want a steady, manageable schedule and fewer no-shows.

The wedge is **booking convenience**. In Yerevan today, most booking happens through Instagram DMs, phone calls, or walk-ins. That is friction for clients (no visibility into availability) and chaos for barbers (manual calendar, double-bookings, no-shows). Sapor turns that into a clean, self-serve flow.

Strategic principle: **start narrow** (barbers only, Yerevan only, online discovery + booking only) and resist scope creep until there is liquidity on both sides.

## 2. Personas

- **Client (Aram, 24):** finds barbers on Instagram, books by DM, sometimes shows up to a full shop. Wants to see who's available tonight near him and book in 30 seconds.
- **Shop owner (Davit, 38):** runs a 4-chair shop. Juggles a paper book and a WhatsApp group. Wants each barber's calendar in one place and fewer no-shows.
- **Independent barber (Narek, 29):** rents a chair or works mobile. His "system" is Instagram + memory. Wants a public profile with a portfolio and a real calendar.
- **Admin (internal):** keeps the marketplace healthy — approves shops, moderates reviews, watches metrics.

## 3. Core concept that simplifies everything

A booking is always: **a customer books a *service* with a *barber* at a *time*.**

A "barber shop" is just a container that owns barbers, a location, and a brand. An "independent barber" is a barber who owns themselves. So in the data model (see `02-data-model.md`) **the bookable unit is always a barber**, and a shop is optional context. This means the scheduling engine, the booking flow, and the availability API have **one code path**, not two. This single decision removes most of the complexity implied by the original brief's separate "shop booking flow" and "individual booking flow."

## 4. Full feature breakdown

Legend: **[MVP]** ship first · **[P2]** phase 2 · **[P3]** later.

### 4.1 Accounts & auth
- Email + password registration/login for Customer, Barber, Shop. **[MVP]**
- Role-based accounts; one user can hold a customer role plus a provider role. **[MVP]**
- Email verification. **[MVP]**
- Password reset. **[MVP]**
- Google sign-in (OAuth). **[P2]**
- Phone (SMS OTP) verification. **[P2]** (deferred because SMS in Armenia costs money per message — see notifications).

### 4.2 Barber shop accounts
- Create/manage shop profile: name, logo, photos, description. **[MVP]**
- Address + map location, contact info (phone, Instagram). **[MVP]**
- Working hours (per weekday). **[MVP]**
- Add/invite barbers; manage the roster. **[MVP]**
- Per-barber schedule and per-barber working hours overrides. **[MVP]**
- Define services + prices (shop-level catalog, assignable to barbers). **[MVP]**
- View upcoming appointments (shop-wide and per barber). **[MVP]**
- Accept / reject / reschedule bookings. **[MVP]** (auto-accept is the default; see booking flow.)
- Booking notifications (email + dashboard). **[MVP]**, Telegram/push **[P2]**, SMS **[P3]**.
- Holidays / closed days, per-barber time off. **[MVP]**
- Multiple locations under one shop. **[P3]**

### 4.3 Individual barber accounts
- Personal public profile. **[MVP]**
- Portfolio image upload. **[MVP]**
- Services + prices. **[MVP]**
- Working hours. **[MVP]**
- Unavailable dates / time off. **[MVP]**
- Manage appointments (accept/reject/reschedule). **[MVP]**
- Booking notifications. **[MVP]**

### 4.4 Barber profile (public)
- Name, photo, bio, experience (years). **[MVP]**
- Services with duration + price. **[MVP]**
- Ratings & reviews. **[MVP]**
- Availability calendar (next bookable slots). **[MVP]**
- Portfolio gallery. **[MVP]**
- "Verified" badge (admin-approved). **[P2]**

### 4.5 Customer features
- Search barbers/shops by name. **[MVP]**
- Filters: location/district, rating, price range, service, next availability. **[MVP]** (service + district + rating first; "available time" filter is the most expensive to compute — see scheduling).
- View profiles. **[MVP]**
- Select barber → pick service(s) → see slots → book. **[MVP]**
- Cancel appointment (within a cancellation window). **[MVP]**
- Leave rating + review after a completed appointment. **[MVP]**
- Booking confirmation + reminders (email). **[MVP]**
- Favorites / saved barbers. **[P2]**
- Rebook ("book again") from history. **[P2]**
- Map view of nearby barbers. **[P2]**

### 4.6 Admin panel
- Manage users / providers (view, suspend, reactivate). **[MVP]**
- Approve new shops/barbers (light moderation). **[MVP]**
- Moderate/remove reviews. **[MVP]**
- Platform metrics dashboard (signups, bookings, GMV, active providers). **[MVP, basic]**
- Manage subscriptions/plans. **[P2]** (only once monetization turns on).
- Feature/unfeature providers. **[P2]**

## 5. MVP scope (the line in the sand)

**Goal of the MVP:** prove that clients will book barbers online and barbers will keep their calendar in Sapor. Nothing else matters yet.

MVP = the **[MVP]** items above, plus:

- Web only (responsive — works great on mobile browsers). **No native app.**
- Yerevan only; districts as a fixed list (no live geo/routing).
- Email-based notifications only (free tier), with dashboard notifications.
- **Auto-accept bookings by default** (instant confirmation) with an optional "request mode" toggle per provider. This avoids the cold-start problem where customers book and wait.
- Manual/no payments — payment happens in person. Sapor only handles booking. (This keeps you out of payment regulation and integration cost on day one.)
- Free for providers during MVP (monetization is Phase 2 — you need supply first).

**Explicitly NOT in MVP:** native apps, online payments, SMS, loyalty/referral, AI recommendations, subscriptions/billing, multi-location, multi-city, multi-language toggle (ship Armenian + English copy but no runtime i18n switcher if time-constrained).

A realistic solo/2-person build of this MVP is on the order of **8–12 weeks**.

## 6. Production roadmap

| Phase | Theme | Highlights |
|-------|-------|-----------|
| **0 — MVP** | Booking works | Auth, profiles, services, availability engine, booking + cancel, reviews, email notifications, basic admin. Web responsive. Free for providers. |
| **1 — Retention & polish** | Make it sticky | Reminders that cut no-shows, rebook, favorites, Telegram bot notifications (free), Google sign-in, provider analytics (basic), map view. |
| **2 — Monetization** | Revenue on | Subscription plans for providers, featured listings, billing + admin subscription mgmt, "verified" badges. |
| **3 — Payments & growth** | Reduce friction & no-shows | Online prepay / deposits (Idram, Telcell, ArCa/local cards, or Stripe if available), SMS reminders, loyalty points, referral program. |
| **4 — Scale & intelligence** | Beyond Yerevan | Native mobile apps (React Native / Expo, reusing types), multi-city, multi-language, AI-powered barber recommendations, waitlists, dynamic pricing for off-peak. |

## 7. User flows

### 7.1 Customer booking (no forced registration; single path for shop barbers and independents)
1. Browse/search → filter by district / service / rating. **No login required to browse.**
2. Open a **barber** profile (reached directly or via a shop profile).
3. Pick one or more **services** → system sums duration + price.
4. System shows **available slots** for the next N days (computed: working hours − existing bookings − blocked time − buffers, snapped to a slot granularity that fits the chosen duration).
5. Pick date + time → confirm. **No account needed:** a guest enters name + phone (+ optional email). Logged-in users skip this. (Phone OTP verification deferred to the SMS phase.)
6. Booking created → **auto-confirmed** (or "requested" if provider uses request mode).
7. Confirmation (email if provided) + a **manage-booking link** for guests; reminder before the appointment.
8. **After** confirming, suggest creating an account (pre-filled from name/phone) to track and rebook — suggested, never required.

### 7.2 Provider handling a booking
1. New booking appears in dashboard + email/Telegram.
2. If request mode: accept / reject / propose new time. If auto mode: already confirmed; can still cancel/reschedule with a reason.
3. Mark as completed / no-show after the slot (drives review eligibility + stats).

### 7.3 Shop onboarding
1. Owner signs up → creates shop → adds address, hours, logo/photos.
2. Adds services (catalog) + prices.
3. Invites barbers (by email) or creates "managed" barber profiles the shop controls.
4. Assigns services + working hours per barber.
5. Shop goes live after admin approval.

### 7.4 Review
1. After a **completed** appointment, customer is prompted to rate (1–5) + comment.
2. One review per appointment. Provider rating = aggregate. Admin can hide abusive reviews.

## 8. Wireframe descriptions (text)

- **Home / Discovery:** top search bar (barber/shop + district), filter chips (Service, Rating 4+, Price, Available today). Below: grid of barber cards (photo, name, shop or "Independent", rating, starting price, "next slot: today 18:30"). Sticky "Book" CTA on each card.
- **Barber profile:** hero (photo, name, bio, experience, rating, verified badge). Tabs: *Services* (list with duration/price + select), *Portfolio* (gallery grid), *Reviews* (list + aggregate), *Book* (calendar). Right rail (desktop) / bottom sheet (mobile): selected services summary + "Choose a time."
- **Shop profile:** hero (logo, name, photos carousel, address + map, hours). Section: *Our barbers* (cards → each links to barber booking). Reviews aggregate across the shop.
- **Slot picker:** horizontal date strip (next 14 days), grid of time chips for the selected day, greyed-out when unavailable. Shows total duration + price. Confirm button.
- **Customer dashboard:** Upcoming (cards with cancel/reschedule), Past (with "Book again" + "Leave review"), Favorites.
- **Provider dashboard:** Today's agenda (timeline view), calendar (week view per barber), pending requests, services editor, working-hours editor, time-off editor, profile editor, notifications.
- **Admin:** tables for users/providers/reviews with search + actions (suspend, approve, hide), metrics cards up top (signups, bookings 7/30d, GMV, active providers).

## 9. Monetization — comparison

| Model | How it works | Pros | Cons | Fit for Yerevan MVP |
|-------|--------------|------|------|---------------------|
| **Provider subscription** (monthly) | Tiered plans (Free / Pro). Pro unlocks more photos, analytics, priority placement. | Predictable MRR; simple; no payment rails to clients needed. | Providers resist paying before seeing value; needs supply liquidity first. | **Best first revenue (Phase 2).** Start with a single low-price Pro tier. |
| **Featured listings** | Pay to appear top of search / homepage for a district/period. | High willingness to pay from competitive shops; easy to build (a flag + ranking boost). | Only valuable once there's client traffic. | **Strong Phase 2** alongside subscriptions. |
| **Commission per booking** | % fee per completed booking. | Aligned with value; scales with volume. | Requires payments to be on-platform to enforce; providers can route off-platform if booking is free. Hard without online payments. | **Phase 3**, after online payments/deposits exist. |
| **Premium analytics** | Paid dashboard: utilization, repeat-rate, revenue trends, peak hours. | Cheap to build on existing data; sticky. | Niche; bundle into Pro rather than sell alone. | Bundle into **Pro subscription**. |
| **Client-side fees / deposits** | Small booking fee or refundable deposit to cut no-shows. | Directly attacks the no-show problem; new revenue line. | Adds friction to client booking; needs payments. | **Phase 3.** Position deposit as anti-no-show, not a fee. |

**Recommended sequence:** Free for everyone in MVP → **subscription + featured listings** in Phase 2 → **commission/deposits via online payments** in Phase 3. Keep a generous free tier permanently so supply never churns out.

## 10. Key product risks

- **Cold start / liquidity.** Solve supply first: onboard 20–40 real barbers in a few districts by hand before any client marketing. Auto-accept + reminders make the first bookings feel magical.
- **No-shows.** The retention killer. Reminders (Phase 1) then deposits (Phase 3).
- **Off-platform leakage.** Once a client finds a barber, they may book direct next time. Counter with rebook convenience, reminders, and loyalty (Phase 3) — not by hiding contact info aggressively (that annoys both sides early on).
- **Calendar trust.** If the calendar ever double-books or shows wrong availability, providers abandon it instantly. The scheduling engine must be correct under concurrency (see architecture doc).
