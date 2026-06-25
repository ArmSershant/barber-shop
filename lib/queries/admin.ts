import { prisma } from '@/lib/db';

export async function getAdminOverview() {
  const [users, shops, barbers, bookings, reviews] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count({ where: { deletedAt: null } }),
    prisma.barber.count({ where: { deletedAt: null } }),
    prisma.booking.count(),
    prisma.review.count(),
  ]);

  const [shopList, barberList, reviewList, userList] = await Promise.all([
    prisma.shop.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        slug: true,
        name: true,
        status: true,
        isVerified: true,
        isFeatured: true,
        logoUrl: true,
        owner: { select: { email: true } },
        district: { select: { nameEn: true, nameHy: true } },
      },
    }),
    prisma.barber.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        slug: true,
        displayName: true,
        status: true,
        isVerified: true,
        isFeatured: true,
        photoUrl: true,
        shop: { select: { name: true } },
        district: { select: { nameEn: true, nameHy: true } },
      },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        isHidden: true,
        barber: { select: { slug: true, displayName: true } },
        customer: { select: { fullName: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        roles: { select: { role: true } },
      },
    }),
  ]);

  return {
    stats: { users, shops, barbers, bookings, reviews },
    shops: shopList.map((s) => ({
      slug: s.slug,
      name: s.name,
      status: s.status,
      isVerified: s.isVerified,
      isFeatured: s.isFeatured,
      ownerEmail: s.owner.email,
      logoUrl: s.logoUrl,
      districtEn: s.district?.nameEn ?? null,
      districtHy: s.district?.nameHy ?? null,
    })),
    barbers: barberList.map((b) => ({
      slug: b.slug,
      displayName: b.displayName,
      status: b.status,
      isVerified: b.isVerified,
      isFeatured: b.isFeatured,
      shopName: b.shop?.name ?? null,
      photoUrl: b.photoUrl,
      districtEn: b.district?.nameEn ?? null,
      districtHy: b.district?.nameHy ?? null,
    })),
    reviews: reviewList.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isHidden: r.isHidden,
      barberSlug: r.barber.slug,
      barberName: r.barber.displayName,
      customerName: r.customer?.fullName ?? '',
    })),
    users: userList.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      status: u.status,
      roles: u.roles.map((x) => x.role),
    })),
  };
}

/** Recompute a barber's denormalized rating from visible reviews. */
export async function recomputeBarberRating(barberId: string) {
  const agg = await prisma.review.aggregate({
    where: { barberId, isHidden: false },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.barber.update({
    where: { id: barberId },
    data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count },
  });
}
