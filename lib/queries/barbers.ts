import { cache } from 'react';
import { prisma } from '@/lib/db';
import { activePromoPercent } from '@/lib/pricing';

export interface BarberCardData {
  id: string;
  slug: string;
  displayName: string;
  photoUrl: string | null;
  coverUrl: string | null;
  experienceYears: number | null;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  minPrice: number | null;
  /** Active promo discount % (provider's, in its window); 0 if none. */
  discountPercent: number;
  shop: { slug: string; name: string } | null;
  district: { id: number; nameEn: string; nameHy: string; slug: string } | null;
}

export type BarberSort = 'top' | 'new' | 'price';

/** Shared Prisma selection for barber discovery cards (list + favorites). */
export const barberCardSelect = {
  id: true,
  slug: true,
  displayName: true,
  photoUrl: true,
  coverUrl: true,
  experienceYears: true,
  ratingAvg: true,
  ratingCount: true,
  isVerified: true,
  isFeatured: true,
  promoPercent: true,
  promoStartsAt: true,
  promoEndsAt: true,
  shop: {
    select: { slug: true, name: true, promoPercent: true, promoStartsAt: true, promoEndsAt: true },
  },
  district: { select: { id: true, nameEn: true, nameHy: true, slug: true } },
  // For the "from X ֏" minimum price: own catalog for independents, assigned
  // shop services (with per-barber overrides) for shop barbers.
  ownedServices: { where: { isActive: true }, select: { priceAmd: true } },
  barberServices: {
    where: { service: { isActive: true } },
    select: { priceAmdOverride: true, service: { select: { priceAmd: true } } },
  },
} as const;

type PromoFields = { promoPercent: number; promoStartsAt: Date | null; promoEndsAt: Date | null };
type BarberCardRow = {
  ratingAvg: unknown;
  shop: ({ slug: string; name: string } & PromoFields) | null;
  ownedServices: { priceAmd: number }[];
  barberServices: { priceAmdOverride: number | null; service: { priceAmd: number } }[];
} & PromoFields &
  Omit<BarberCardData, 'ratingAvg' | 'minPrice' | 'shop' | 'discountPercent'>;

/** Maps a raw barber row (selected via barberCardSelect) into a discovery card. */
export function mapBarberCard(b: BarberCardRow): BarberCardData {
  const prices = b.shop
    ? b.barberServices.map((bs) => bs.priceAmdOverride ?? bs.service.priceAmd)
    : b.ownedServices.map((s) => s.priceAmd);
  const {
    ownedServices: _o,
    barberServices: _bs,
    promoPercent,
    promoStartsAt,
    promoEndsAt,
    shop,
    ...rest
  } = b;

  // Effective promo: the shop's (shop barbers) or the barber's own.
  const promo: PromoFields = shop ?? { promoPercent, promoStartsAt, promoEndsAt };

  return {
    ...rest,
    shop: shop ? { slug: shop.slug, name: shop.name } : null,
    ratingAvg: Number(b.ratingAvg),
    minPrice: prices.length ? Math.min(...prices) : null,
    discountPercent: activePromoPercent(promo.promoPercent, promo.promoStartsAt, promo.promoEndsAt, Date.now()),
  };
}

/** Public list of barbers for discovery. Hides suspended/deleted. */
export async function listBarbers(
  params: {
    q?: string;
    district?: string;
    preferredDistrictId?: number;
    sort?: BarberSort;
    minRating?: number;
    openNow?: boolean;
    includeTest?: boolean;
  } = {},
): Promise<BarberCardData[]> {
  const q = params.q?.trim();
  const district = params.district?.trim();
  const orderBy =
    params.sort === 'new'
      ? [{ isFeatured: 'desc' as const }, { createdAt: 'desc' as const }]
      : [{ isFeatured: 'desc' as const }, { ratingAvg: 'desc' as const }, { createdAt: 'desc' as const }];
  const barbers = await prisma.barber.findMany({
    where: {
      deletedAt: null,
      status: { not: 'suspended' },
      // Hide internal/test barbers from public discovery; admins see all.
      ...(params.includeTest ? {} : { isTest: false }),
      ...(params.minRating ? { ratingAvg: { gte: params.minRating } } : {}),
      // Only list barbers whose responsible account has a verified email:
      // the independent barber's own user, or their shop's owner.
      OR: [{ user: { emailVerified: true } }, { shop: { owner: { emailVerified: true } } }],
      ...(q ? { displayName: { contains: q, mode: 'insensitive' } } : {}),
      ...(district ? { district: { slug: district } } : {}),
    },
    orderBy,
    take: 60,
    select: barberCardSelect,
  });
  let mapped = barbers.map(mapBarberCard);

  // "Open now": keep barbers whose working hours cover the current Yerevan time.
  if (params.openNow) {
    mapped = await filterOpenNow(mapped);
  }

  // Price sort is on a derived value (min service price), so sort in memory.
  if (params.sort === 'price') {
    mapped.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
  }

  // Customer's home district first (stable sort keeps rating order within).
  const pref = params.preferredDistrictId;
  if (pref && !district) {
    mapped.sort((a, b) => Number(b.district?.id === pref) - Number(a.district?.id === pref));
  }
  return mapped;
}

/** Keep only barbers open at the current Asia/Yerevan time (per working hours). */
async function filterOpenNow(cards: BarberCardData[]): Promise<BarberCardData[]> {
  if (cards.length === 0) return cards;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Yerevan',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  const dayIndex: Record<string, number> = {
    Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
  };
  const weekday = dayIndex[parts.weekday as string];
  const nowMin = (Number(parts.hour) % 24) * 60 + Number(parts.minute);

  const hours = await prisma.workingHours.findMany({
    where: { barberId: { in: cards.map((c) => c.id) }, weekday },
    select: { barberId: true, startMinute: true, endMinute: true },
  });
  const openIds = new Set(
    hours.filter((h) => nowMin >= h.startMinute && nowMin < h.endMinute).map((h) => h.barberId),
  );
  return cards.filter((c) => openIds.has(c.id));
}

/** Full public profile for a barber, or null if not found/deleted. */
// Wrapped in React cache so generateMetadata + the page share one query per request.
export const getBarberProfile = cache(async (slug: string) => {
  const barber = await prisma.barber.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      userId: true, // for "is this my own profile" checks — strip before public API output
      displayName: true,
      bio: true,
      photoUrl: true,
      coverUrl: true,
      experienceYears: true,
      isVerified: true,
      isTest: true,
      districtId: true,
      ratingAvg: true,
      ratingCount: true,
      deletedAt: true,
      loyaltyEnabled: true,
      loyaltyPointsPer100: true,
      loyaltyAmdPerPoint: true,
      loyaltyMaxRedeemPct: true,
      waitlistEnabled: true,
      shop: {
        select: {
          slug: true,
          name: true,
          ownerUserId: true,
          loyaltyEnabled: true,
          loyaltyPointsPer100: true,
          loyaltyAmdPerPoint: true,
          loyaltyMaxRedeemPct: true,
          waitlistEnabled: true,
        },
      },
      district: { select: { nameEn: true, nameHy: true, slug: true } },
      ownedServices: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, type: true, name: true, description: true, durationMin: true, priceAmd: true },
      },
      // Shop barbers offer the services assigned to them from the shop catalog.
      barberServices: {
        where: { service: { isActive: true } },
        select: {
          priceAmdOverride: true,
          durationMinOverride: true,
          service: {
            select: { id: true, type: true, name: true, description: true, durationMin: true, priceAmd: true },
          },
        },
      },
      workingHours: {
        orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
        select: { weekday: true, startMinute: true, endMinute: true },
      },
      portfolioImages: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true } },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          rating: true,
          comment: true,
          photoUrl: true,
          reply: true,
          repliedAt: true,
          createdAt: true,
          customer: { select: { fullName: true } },
        },
      },
    },
  });
  if (!barber || barber.deletedAt) return null;

  // Bookable services: assigned ones for shop barbers (with per-barber price
  // and duration overrides applied), own catalog otherwise.
  const services = barber.shop
    ? barber.barberServices.map((bs) => ({
        ...bs.service,
        priceAmd: bs.priceAmdOverride ?? bs.service.priceAmd,
        durationMin: bs.durationMinOverride ?? bs.service.durationMin,
      }))
    : barber.ownedServices;
  const { barberServices: _bs, ownedServices: _os, ...rest } = barber;

  // Loyalty program the customer interacts with here: the shop (shop barbers)
  // or the independent barber. `earnRate` is 0 when loyalty is off.
  const usingShop = Boolean(barber.shop);
  const src = usingShop ? barber.shop! : barber;
  const loyalty = {
    enabled: src.loyaltyEnabled,
    earnRate: src.loyaltyEnabled ? src.loyaltyPointsPer100 : 0,
    amdPerPoint: src.loyaltyAmdPerPoint,
    maxRedeemPct: src.loyaltyMaxRedeemPct,
    scopeKind: usingShop ? ('shop' as const) : ('barber' as const),
    scopeSlug: usingShop ? barber.shop!.slug : barber.slug,
  };

  const waitlistEnabled = usingShop ? barber.shop!.waitlistEnabled : barber.waitlistEnabled;

  return { ...rest, services, ratingAvg: Number(barber.ratingAvg), loyalty, waitlistEnabled };
});

export type BarberProfile = NonNullable<Awaited<ReturnType<typeof getBarberProfile>>>;
