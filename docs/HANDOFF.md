# barber-shop.am — Heritage Redesign · Developer Handoff

A complete visual redesign of the barber-shop.am marketplace ("Bone & Tobacco" boutique-heritage
direction), in **light and dark mode**, covering every screen. This document is the spec; the
`*.dc.html` files in this project are the pixel reference (open them to read exact inline styles).

> Stack reminder: Next.js App Router + TypeScript + **Mantine** + SCSS. The redesign is a
> re-skin — **no routing, data, or API changes**. You're swapping the theme, fonts, header,
> and component styling; all existing pages/components keep their structure.

---

## 1. Design tokens

### Fonts
- **Display / headings:** `Cormorant Garamond` (600/700, plus italic for section labels & accents)
- **Body / UI:** `Archivo` (400/500/600/700)
- **Mono (placeholder labels only):** system `ui-monospace`

Add via `next/font/google` in `app/layout.tsx` (preferred) exposing CSS vars
`--font-display` and `--font-body`, or Google Fonts `<link>`. The current `theme.ts` already
wires `var(--font-display)` for headings — keep that, point it at Cormorant Garamond, and set
`fontFamily` to Archivo.

### Color palette (CSS custom properties)

**Light mode**
```
--bg:     #efe6d4   /* page background (warm bone) */
--surf:   #fbf6ea   /* card / header surface */
--surf2:  #f3ead7   /* recessed surface, placeholders */
--ink:    #352a1f   /* primary text + primary button (espresso) */
--dim:    #8a7558   /* secondary text */
--gold:   #a8812f   /* accent: borders, stars, featured */
--gold2:  #8a6a26   /* accent text on light */
--ox:     #7c3328   /* oxblood: destructive + final "Book" CTA */
--line:   #dac9a9   /* hairline borders + offset-shadow color */
```

**Dark mode**
```
--bg:     #181410   --surf:  #221c15   --surf2: #2a2218
--ink:    #efe4d0   --dim:   #a3937a
--gold:   #cda24e   --gold2: #e0bd72   --ox:    #c0533f
--line:   #39301f
```

### Mantine mapping (`lib/theme.ts`)
Replace the teal `brand` ramp with this heritage system. Suggested tuples (index 6 = primary):
- **`gold`** ramp already exists — rebalance toward `#a8812f` mid; keep as the accent color.
- Add an **`espresso`** ramp built around `--ink` (#352a1f) and set `primaryColor: 'espresso'`,
  `primaryShade: { light: 6, dark: 4 }` so default buttons render espresso in light / bone-on-dark.
- Add an **`ox`** ramp around `#7c3328` for `color="ox"` destructive buttons & the booking CTA.
- `defaultRadius`: drop to `'xs'` (≈2px) — the heritage look uses near-square corners, not pills.
- Light body background `--bg` = `#efe6d4` (update the `:root[data-mantine-color-scheme='light']`
  override in `globals.scss`); dark body `--bg` = `#181410`.

### Shape & elevation
- **Corners:** 2px (cards, inputs, buttons). Avatars/portraits stay circular; shop logos 8px.
- **Borders:** 1px hairline `--line` everywhere instead of heavy shadows.
- **Signature shadow (light only):** hard offset block `box-shadow: 6px 6px 0 var(--line)` on
  hero search, the booking widget, and auth cards. In dark mode drop it (use the gold border).
- **Section dividers:** italic Cormorant label + a 1px `--line` rule filling remaining width
  (`<span>Services</span><hr-like flex line>`). Used on every profile/list section header.

---

## 2. The barber-pole logo (replaces the wordmark)

The brand mark is an **animated barber pole**, used alone (the "barber-shop.am" wordmark is
removed from all headers; keep it only in the footer as the domain/legal anchor).

- Warm **tricolor** stripes: oxblood · cream/bone · gold (NOT the US red/white/blue).
- **Seamless infinite loop** — the trick: tile = exactly one stripe period, travel = one period.

```css
.pole {
  width: 13px; height: 32px; border-radius: 7px;       /* header size; 16×40 on auth/centered */
  border: 1px solid var(--gold);
  background: repeating-linear-gradient(135deg,
    var(--ox) 0 5px, var(--stripe) 5px 10px, var(--gold) 10px 15px);
  background-size: 21.2132px 21.2132px;                 /* = 15px ÷ cos45° (one full period) */
  animation: pole 1.4s linear infinite;
}
@keyframes pole {                                        /* travels exactly one period → no seam */
  from { background-position: 0 0; }
  to   { background-position: -10.6066px -10.6066px; }   /* = 15px ÷ √2 on each axis */
}
/* --stripe = #fff7ea (light) / #efe4d0 (dark). In dark add box-shadow:0 0 10px rgba(205,162,78,.4) */
```
Respect `prefers-reduced-motion` (the existing globals already disable animations there).
The pole is the home link (`<Link href="/">`).

---

## 3. Header / nav — brand left, right side adapts by role

`components/SiteHeader.tsx`. Left = pole (home link). Right side switches on auth state:

- **Guest:** Barbers · Shops · For barbers · `HY · EN · RU` · Log in · **Sign up** (espresso button)
- **Signed-in customer:** Barbers · Shops · Saved · ♡ · 🔔(unread dot) · avatar + *"Hi, {name}"*
  (name in italic Cormorant)
- **Provider / owner:** Dashboard · Bookings · 🔔 · shop-logo avatar + shop name + "Owner" tag
- **Admin:** dark (`--ink`) header bar, gold pole, "Admin" wordmark, admin email right.

Mobile: pole left, hamburger right; nav collapses to the existing drawer.

---

## 4. Reusable component patterns (Mantine equivalents)

| Pattern | Spec |
|---|---|
| **Barber card** | `--surf` card, 1px border (gold + `5px 5px 0 --line` shadow if featured), cover strip → avatar overlapping `-30px` → name (Cormorant 700) + ✦ verified → shop·district → footer row: ★rating · "from N ֏". Featured gets gold "★ Featured" tag top-left. |
| **Shop card** | horizontal: square photo left, logo+name+district, footer ★rating · "N barbers" · View. |
| **At-a-glance bar** | 4 equal cells, hairline dividers: Rating ★ / District / Status (● Open · closes HH:MM, green) / From N ֏. Labels uppercase Archivo 10px, values Cormorant 21px. |
| **Booking widget** | bordered panel, header bar (espresso light / gold dark) "Book an appointment"; checkbox service rows; date strip (4 day cells, selected = filled); time chips (selected = filled); total row (Cormorant) + **oxblood** Book button; "No account needed · free cancellation". |
| **Service row** | Cormorant name + "~N min" / price (Cormorant 600) + Book button (espresso light / gold-outline dark). |
| **Status pills** | uppercase 9–10px, 1px border in semantic color: Confirmed/Open = green `#3f7a47`, Pending = gold, Suspended/Cancelled/destructive = oxblood. |
| **Stat card** | uppercase label + Cormorant 700 number. Used on dashboard, analytics, admin. |
| **Section header** | italic Cormorant label + flex hairline rule. |
| **Inputs** | `--bg` fill, 1px `--line` border, uppercase 10px label above. Active/primary field border = `--ink`. |

---

## 5. Screen → file → route map

| Screen | Reference file (frame) | Route / component |
|---|---|---|
| Home | `barber-shop.am Redesign` (light+dark) | `app/page.tsx`, `HeroSearch`, `DistrictChips` |
| Barber profile + booking | `barber-shop.am Redesign` (light+dark) | `app/barbers/[slug]/page.tsx`, `BookingWidget`, `PortfolioGrid`, `StickyBookBar` |
| Barbers listing | `barber-shop.am Discovery` | `app/barbers/page.tsx`, `BarberCard`, `BarberSearch`, `DistrictFilter` |
| Shops listing | `barber-shop.am Discovery` | `app/shops/page.tsx`, `ShopCard`, `ShopSearch` |
| Shop profile | `barber-shop.am Discovery` | `app/shops/[slug]/page.tsx` |
| District landing | `barber-shop.am Discovery` | `app/barbers/district/[district]`, `app/shops/district/[district]` |
| Booking confirmed | `barber-shop.am Booking & Account` | confirmed state inside `BookingWidget` |
| Manage booking (guest) | `barber-shop.am Booking & Account` | `app/manage/page.tsx` |
| My bookings | `barber-shop.am Booking & Account` | `app/bookings/page.tsx` |
| Account | `barber-shop.am Booking & Account` | `app/account/page.tsx`, `ColorSchemeToggle` |
| Favorites | `barber-shop.am Booking & Account` | `app/favorites/page.tsx`, `FavoriteButton` |
| Auth (login/register/forgot/reset/verify) | `barber-shop.am Auth` | `app/(auth)/*`, `auth.module.scss` |
| Provider dashboard | `barber-shop.am Provider` | `app/dashboard/page.tsx` |
| Provider bookings | `barber-shop.am Provider` | `app/dashboard/bookings/page.tsx` |
| Profile editor | `barber-shop.am Provider` | `app/dashboard/barbers/[slug]`, `components/dashboard/*` |
| Provider analytics | `barber-shop.am Provider` | `AnalyticsSection` |
| Admin panel | `barber-shop.am Admin` | `app/admin/page.tsx` |

**States & edge cases:** `barber-shop.am States` covers — empty states (no bookings / saved /
search results / services), loading skeletons (listing + profile, shimmer), error states
(404, expired reset link, failed verification), modals (leave-a-review, add/edit service),
notifications bell dropdown, owner onboarding (create-shop vs create-barber choice + both forms),
and confirm dialogs (cancel booking, delete service). Modal/dialog backdrop = `rgba(30,22,14,.55)`;
modal card = `--bg` with gold (or oxblood for destructive) border + `8px 8px 0 rgba(0,0,0,.25)`
hard shadow. Skeleton shimmer: `linear-gradient(90deg,--surf2 25%,--line 37%,--surf2 63%)` at
`background-size:400% 100%` animated `shimmer 1.4s ease infinite` (`100% 0`→`-100% 0`).

**Dark mode:** `barber-shop.am Dark` renders the dark-token version of the listing, shop profile,
my-bookings, account, favorites, provider dashboard, admin, auth, and the key states/modals — use
it to confirm the dark palette mapping. Every other screen is the same layout with the dark tokens
from §1 swapped in (the booking CTA stays oxblood; primary buttons become gold-on-espresso; the pole
gains `box-shadow:0 0 10px rgba(205,162,78,.4)`; modal backdrop deepens to `rgba(0,0,0,.6)`).

**Mobile:** `barber-shop.am Mobile` shows the 390px layouts — home, listing, shop profile, booking
confirmed, my bookings, account, favorites, login, provider dashboard, plus mobile states (empty,
404, review **bottom-sheet**, notifications full-screen, cancel bottom-sheet, onboarding). Mobile
conventions: 5-tab bottom nav (Home/Search/Saved/Bookings/Account) on customer pages; sticky bottom
"Book" bar on profiles; modals become bottom-sheets with a drag handle; multi-column grids collapse
to 1–2 columns; filter chips scroll horizontally.

Reference-only (not for production): `barber-shop.am Explorations` (logo/header/pole studies).

---

## 6. Suggested implementation order
1. **Fonts + `theme.ts` + `globals.scss`** (palette, radius, body bg, dark tokens). Biggest visual
   shift for the least code — most screens improve immediately because they use Mantine tokens.
2. **`SiteHeader`** — pole component + role-adaptive right side + footer.
3. **Shared components** — `BarberCard`, `ShopCard`, `BookingWidget`, status pills, stat card,
   section header. These propagate across many screens.
4. **Page-by-page** polish in the map order (Home → profiles → discovery → account → provider → admin).
5. Verify light **and** dark via the existing `ColorSchemeToggle`.

Keep all i18n keys (`messages/en|hy|ru.json`) — copy is unchanged. Real photography replaces the
striped placeholders (cover, portrait, portfolio, shop gallery) — the upload pipeline already exists.
