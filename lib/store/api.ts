import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type {
  CreateShopInput,
  UpdateShopInput,
  CreateBarberInput,
  UpdateBarberInput,
} from '@/lib/validation/provider';
import type { CreateServiceInput, UpdateServiceInput } from '@/lib/validation/service';

// ---- Types (mirror the API responses) ----
export type Role = 'customer' | 'barber' | 'shop_owner' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  preferredDistrictId?: number | null;
  newsletterOptIn?: boolean;
  newsletterLang?: string | null;
}

export interface MeResponse {
  user: User | null;
}
export interface AuthResponse {
  user: User;
}
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  newsletterOptIn?: boolean;
}
export interface LoginRequest {
  email: string;
  password: string;
}

export interface Shop {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  instagram?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  districtId?: number | null;
  requiresApproval?: boolean;
  status: string;
}

export interface Barber {
  id: string;
  slug: string;
  displayName: string;
  bio?: string | null;
  experienceYears?: number | null;
  photoUrl?: string | null;
  coverUrl?: string | null;
  districtId?: number | null;
  shopId?: string | null;
  requiresApproval?: boolean;
  status: string;
}

export interface ProviderMeResponse {
  shop: Shop | null;
  barber: Barber | null;
}

export interface ProviderAnalytics {
  totals: { all: number; upcoming: number; completed: number; cancelled: number; noShow: number };
  revenueAmd: number;
  last30: { bookings: number; revenueAmd: number };
  completionRate: number;
  noShowRate: number;
  repeatCustomers: number;
  byWeekday: number[];
}

export interface ShopBarberListItem {
  id: string;
  slug: string;
  displayName: string;
  photoUrl: string | null;
}

export interface BarberProfileData {
  slug: string;
  displayName: string;
  bio: string | null;
  experienceYears: number | null;
  districtId: number | null;
  photoUrl: string | null;
  coverUrl: string | null;
}

export interface GalleryImage {
  id: string;
  url: string;
}

export interface Service {
  id: string;
  type?: string | null;
  name: string;
  description?: string | null;
  durationMin: number;
  priceAmd: number;
  isActive: boolean;
}

export interface WorkingHourInterval {
  weekday: number; // 0=Mon .. 6=Sun
  startMinute: number;
  endMinute: number;
}

export interface TimeOff {
  id: string;
  startsAt: string;
  endsAt: string;
  reason?: string | null;
  status: string;
  requestedBy: string;
}
export interface Break {
  id: string;
  weekday: number | null;
  startMinute: number;
  endMinute: number;
  status: string;
  requestedBy: string;
}
export interface TimeOffRequest {
  startsAt: string;
  endsAt: string;
  reason?: string;
}
export interface BreakRequest {
  weekday: number | null;
  startMinute: number;
  endMinute: number;
}

export interface ShopDefaults {
  workingHours: WorkingHourInterval[];
  breaks: BreakRequest[];
}

export interface ServiceAssignment {
  serviceId: string;
  priceAmdOverride: number | null;
  durationMinOverride: number | null;
}

export interface District {
  id: number;
  nameEn: string;
  nameHy: string;
  slug: string;
}

export interface AvailabilityResponse {
  date: string;
  durationMin: number;
  priceAmd: number;
  slots: string[];
}
export interface CreateBookingRequest {
  serviceIds: string[];
  startsAt: string;
  note?: string;
  guest?: { name: string; phone: string; email?: string };
}
export interface CreateBookingResult {
  booking: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    totalPriceAmd: number;
    totalDurationMin: number;
  };
  manageToken: string | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface BookedService {
  type: string | null;
  name: string;
}

export interface MyBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  totalPriceAmd: number;
  services: BookedService[];
  barber: { displayName: string; slug: string };
  reviewed: boolean;
}

export interface ManagedBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  totalPriceAmd: number;
  guestName: string | null;
  services: BookedService[];
  barber: { displayName: string; slug: string };
}

export interface ProviderBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  totalPriceAmd: number;
  totalDurationMin: number;
  note: string | null;
  customerName: string;
  phone: string | null;
  barberName: string;
  services: BookedService[];
}

// ---- Admin ----
export interface AdminStats {
  users: number;
  shops: number;
  barbers: number;
  bookings: number;
  reviews: number;
}
export interface AdminShop {
  slug: string;
  name: string;
  status: string;
  isVerified: boolean;
  isFeatured: boolean;
  isTest: boolean;
  ownerEmail: string;
  logoUrl: string | null;
  districtEn: string | null;
  districtHy: string | null;
}
export interface AdminBarber {
  slug: string;
  displayName: string;
  status: string;
  isVerified: boolean;
  isFeatured: boolean;
  isTest: boolean;
  shopName: string | null;
  photoUrl: string | null;
  districtEn: string | null;
  districtHy: string | null;
}
export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  barberSlug: string;
  barberName: string;
  customerName: string;
}
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roles: Role[];
}
export interface AdminOverview {
  stats: AdminStats;
  shops: AdminShop[];
  barbers: AdminBarber[];
  reviews: AdminReview[];
  users: AdminUser[];
}

// All requests are same-origin to /api; `credentials: 'include'` sends the
// httpOnly auth cookies.
const rawBaseQuery = fetchBaseQuery({ baseUrl: '/api', credentials: 'include' });

// Dedupe concurrent refreshes: if several requests 401 at once, only one
// /auth/refresh runs and the rest await it.
let refreshInFlight: ReturnType<typeof rawBaseQuery> | null = null;

/**
 * On a 401, transparently try to refresh the session once, then retry the
 * original request. Skips auth endpoints themselves (a failed login shouldn't
 * trigger a refresh).
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const url = typeof args === 'string' ? args : args.url;
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !url.startsWith('/auth/')) {
    if (!refreshInFlight) {
      refreshInFlight = rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);
    }
    const refresh = await refreshInFlight;
    refreshInFlight = null;

    if (!refresh.error) {
      result = await rawBaseQuery(args, api, extraOptions); // retry once
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Me',
    'ProviderMe',
    'Services',
    'WorkingHours',
    'TimeOff',
    'Breaks',
    'Barber',
    'ShopBarbers',
    'ShopDefaults',
    'Assignments',
    'Availability',
    'Notifications',
    'ProviderBookings',
    'MyBookings',
    'ManagedBooking',
    'AdminOverview',
    'Portfolio',
    'ShopPhotos',
    'Favorites',
  ],
  endpoints: (builder) => ({
    me: builder.query<MeResponse, void>({
      query: () => '/me',
      providesTags: ['Me'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    logout: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Me'],
    }),

    providerMe: builder.query<ProviderMeResponse, void>({
      query: () => '/provider/me',
      providesTags: ['ProviderMe'],
    }),
    createShop: builder.mutation<{ shop: Shop }, CreateShopInput>({
      query: (body) => ({ url: '/shops', method: 'POST', body }),
      invalidatesTags: ['ProviderMe'],
    }),
    updateShop: builder.mutation<{ shop: Shop }, { slug: string; data: UpdateShopInput }>({
      query: ({ slug, data }) => ({ url: `/shops/${slug}`, method: 'PATCH', body: data }),
      invalidatesTags: ['ProviderMe'],
    }),
    createBarber: builder.mutation<{ barber: Barber }, CreateBarberInput>({
      query: (body) => ({ url: '/barbers', method: 'POST', body }),
      invalidatesTags: ['ProviderMe'],
    }),
    updateBarber: builder.mutation<{ barber: Barber }, { slug: string; data: UpdateBarberInput }>({
      query: ({ slug, data }) => ({ url: `/barbers/${slug}`, method: 'PATCH', body: data }),
      invalidatesTags: (_r, _e, arg) => ['ProviderMe', 'ShopBarbers', { type: 'Barber', id: arg.slug }],
    }),
    getBarber: builder.query<{ barber: BarberProfileData }, string>({
      query: (slug) => `/barbers/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'Barber', id: slug }],
    }),
    getShopBarbers: builder.query<{ barbers: ShopBarberListItem[] }, string>({
      query: (shopSlug) => `/shops/${shopSlug}/barbers`,
      providesTags: ['ShopBarbers'],
    }),
    addShopBarber: builder.mutation<{ barber: Barber }, { slug: string; data: CreateBarberInput }>({
      query: ({ slug, data }) => ({ url: `/shops/${slug}/barbers`, method: 'POST', body: data }),
      invalidatesTags: ['ShopBarbers'],
    }),

    providerServices: builder.query<{ services: Service[] }, void>({
      query: () => '/provider/services',
      providesTags: ['Services'],
    }),
    createService: builder.mutation<{ service: Service }, CreateServiceInput>({
      query: (body) => ({ url: '/provider/services', method: 'POST', body }),
      invalidatesTags: ['Services'],
    }),
    updateService: builder.mutation<{ service: Service }, { id: string; data: UpdateServiceInput }>({
      query: ({ id, data }) => ({ url: `/provider/services/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Services'],
    }),
    deleteService: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/provider/services/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Services'],
    }),

    getWorkingHours: builder.query<{ intervals: WorkingHourInterval[] }, string>({
      query: (slug) => `/barbers/${slug}/working-hours`,
      providesTags: ['WorkingHours'],
    }),
    setWorkingHours: builder.mutation<{ ok: boolean }, { slug: string; intervals: WorkingHourInterval[] }>({
      query: ({ slug, intervals }) => ({
        url: `/barbers/${slug}/working-hours`,
        method: 'PUT',
        body: { intervals },
      }),
      invalidatesTags: ['WorkingHours'],
    }),

    getTimeOff: builder.query<{ timeOff: TimeOff[] }, string>({
      query: (slug) => `/barbers/${slug}/time-off`,
      providesTags: ['TimeOff'],
    }),
    createTimeOff: builder.mutation<{ timeOff: TimeOff }, { slug: string; data: TimeOffRequest }>({
      query: ({ slug, data }) => ({ url: `/barbers/${slug}/time-off`, method: 'POST', body: data }),
      invalidatesTags: ['TimeOff'],
    }),
    deleteTimeOff: builder.mutation<{ ok: boolean }, { slug: string; id: string }>({
      query: ({ slug, id }) => ({ url: `/barbers/${slug}/time-off/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TimeOff'],
    }),

    getBreaks: builder.query<{ breaks: Break[] }, string>({
      query: (slug) => `/barbers/${slug}/breaks`,
      providesTags: ['Breaks'],
    }),
    createBreak: builder.mutation<{ break: Break }, { slug: string; data: BreakRequest }>({
      query: ({ slug, data }) => ({ url: `/barbers/${slug}/breaks`, method: 'POST', body: data }),
      invalidatesTags: ['Breaks'],
    }),
    deleteBreak: builder.mutation<{ ok: boolean }, { slug: string; id: string }>({
      query: ({ slug, id }) => ({ url: `/barbers/${slug}/breaks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Breaks'],
    }),

    getDistricts: builder.query<{ districts: District[] }, void>({
      query: () => '/districts',
    }),
    updateMe: builder.mutation<
      { ok: boolean },
      {
        fullName?: string;
        phone?: string | null;
        avatarUrl?: string | null;
        preferredDistrictId?: number | null;
        newsletterOptIn?: boolean;
        newsletterLang?: 'hy' | 'en' | 'ru' | null;
      }
    >({
      query: (body) => ({ url: '/me', method: 'PATCH', body }),
      invalidatesTags: ['Me'],
    }),
    changePassword: builder.mutation<
      { ok: boolean },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({ url: '/me/password', method: 'POST', body }),
    }),
    verifyEmail: builder.mutation<{ ok: boolean }, { token: string }>({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    resendVerification: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/resend-verification', method: 'POST' }),
    }),
    forgotPassword: builder.mutation<{ ok: boolean }, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<{ ok: boolean }, { token: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    getBarberAssignments: builder.query<{ assignments: ServiceAssignment[] }, string>({
      query: (slug) => `/barbers/${slug}/services`,
      providesTags: ['Assignments'],
    }),
    setBarberAssignments: builder.mutation<
      { ok: boolean },
      { slug: string; assignments: ServiceAssignment[] }
    >({
      query: ({ slug, assignments }) => ({
        url: `/barbers/${slug}/services`,
        method: 'PUT',
        body: { assignments },
      }),
      invalidatesTags: ['Assignments'],
    }),
    getShopDefaults: builder.query<ShopDefaults, string>({
      query: (shopSlug) => `/shops/${shopSlug}/defaults`,
      providesTags: ['ShopDefaults'],
    }),
    setShopDefaults: builder.mutation<{ ok: boolean }, { slug: string } & ShopDefaults>({
      query: ({ slug, workingHours, breaks }) => ({
        url: `/shops/${slug}/defaults`,
        method: 'PUT',
        body: { workingHours, breaks },
      }),
      invalidatesTags: ['ShopDefaults'],
    }),
    applyShopDefaults: builder.mutation<{ ok: boolean; barbers: number }, string>({
      query: (shopSlug) => ({ url: `/shops/${shopSlug}/apply-defaults`, method: 'POST' }),
      invalidatesTags: ['WorkingHours', 'Breaks'],
    }),

    getAvailability: builder.query<
      AvailabilityResponse,
      { slug: string; date: string; serviceIds: string[] }
    >({
      query: ({ slug, date, serviceIds }) =>
        `/barbers/${slug}/availability?date=${date}&serviceIds=${serviceIds.join(',')}`,
      providesTags: ['Availability'],
    }),
    createBooking: builder.mutation<CreateBookingResult, { slug: string } & CreateBookingRequest>({
      query: ({ slug, ...body }) => ({ url: `/barbers/${slug}/bookings`, method: 'POST', body }),
      invalidatesTags: ['Availability'],
    }),

    getNotifications: builder.query<{ notifications: NotificationItem[]; unread: number }, void>({
      query: () => '/notifications',
      providesTags: ['Notifications'],
    }),
    readAllNotifications: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
    getProviderBookings: builder.query<{ bookings: ProviderBooking[] }, void>({
      query: () => '/provider/bookings',
      providesTags: ['ProviderBookings'],
    }),
    getProviderAnalytics: builder.query<ProviderAnalytics, void>({
      query: () => '/provider/analytics',
      providesTags: ['ProviderBookings'],
    }),
    cancelBooking: builder.mutation<{ ok: boolean }, { id: string; reason?: string; token?: string }>({
      query: ({ id, reason, token }) => ({
        url: `/bookings/${id}/cancel`,
        method: 'POST',
        body: { reason, token },
      }),
      invalidatesTags: ['ProviderBookings', 'MyBookings', 'ManagedBooking', 'Availability'],
    }),
    getManagedBooking: builder.query<{ booking: ManagedBooking }, string>({
      query: (token) => `/bookings/manage?token=${encodeURIComponent(token)}`,
      providesTags: ['ManagedBooking'],
    }),
    getMyBookings: builder.query<{ bookings: MyBooking[] }, void>({
      query: () => '/me/bookings',
      providesTags: ['MyBookings'],
    }),
    completeBooking: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/bookings/${id}/complete`, method: 'POST' }),
      invalidatesTags: ['ProviderBookings'],
    }),
    noShowBooking: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/bookings/${id}/no-show`, method: 'POST' }),
      invalidatesTags: ['ProviderBookings'],
    }),
    acceptBooking: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/bookings/${id}/accept`, method: 'POST' }),
      invalidatesTags: ['ProviderBookings'],
    }),
    createReview: builder.mutation<{ ok: boolean }, { id: string; rating: number; comment?: string }>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/review`, method: 'POST', body }),
      invalidatesTags: ['MyBookings'],
    }),

    getAdminOverview: builder.query<AdminOverview, void>({
      query: () => '/admin/overview',
      providesTags: ['AdminOverview'],
    }),
    setShopStatus: builder.mutation<{ ok: boolean }, { slug: string; status: string }>({
      query: ({ slug, status }) => ({ url: `/admin/shops/${slug}/status`, method: 'POST', body: { status } }),
      invalidatesTags: ['AdminOverview'],
    }),
    setBarberStatus: builder.mutation<{ ok: boolean }, { slug: string; status: string }>({
      query: ({ slug, status }) => ({ url: `/admin/barbers/${slug}/status`, method: 'POST', body: { status } }),
      invalidatesTags: ['AdminOverview'],
    }),
    setUserStatus: builder.mutation<{ ok: boolean }, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/admin/users/${id}/status`, method: 'POST', body: { status } }),
      invalidatesTags: ['AdminOverview'],
    }),
    deleteUser: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminOverview'],
    }),
    setReviewVisibility: builder.mutation<{ ok: boolean }, { id: string; hidden: boolean }>({
      query: ({ id, hidden }) => ({ url: `/admin/reviews/${id}/visibility`, method: 'POST', body: { hidden } }),
      invalidatesTags: ['AdminOverview'],
    }),
    setBarberFlags: builder.mutation<
      { ok: boolean },
      { slug: string; isVerified?: boolean; isFeatured?: boolean; isTest?: boolean }
    >({
      query: ({ slug, ...body }) => ({ url: `/admin/barbers/${slug}/flags`, method: 'POST', body }),
      invalidatesTags: ['AdminOverview'],
    }),
    setShopFlags: builder.mutation<
      { ok: boolean },
      { slug: string; isVerified?: boolean; isFeatured?: boolean; isTest?: boolean }
    >({
      query: ({ slug, ...body }) => ({ url: `/admin/shops/${slug}/flags`, method: 'POST', body }),
      invalidatesTags: ['AdminOverview'],
    }),

    getBarberPortfolio: builder.query<{ images: GalleryImage[] }, string>({
      query: (slug) => `/barbers/${slug}/portfolio`,
      providesTags: ['Portfolio'],
    }),
    addBarberPortfolio: builder.mutation<{ image: GalleryImage }, { slug: string; url: string }>({
      query: ({ slug, url }) => ({ url: `/barbers/${slug}/portfolio`, method: 'POST', body: { url } }),
      invalidatesTags: ['Portfolio'],
    }),
    deleteBarberPortfolio: builder.mutation<{ ok: boolean }, { slug: string; id: string }>({
      query: ({ slug, id }) => ({ url: `/barbers/${slug}/portfolio/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Portfolio'],
    }),

    getFavoriteSlugs: builder.query<{ slugs: string[] }, void>({
      query: () => '/me/favorites',
      providesTags: ['Favorites'],
    }),
    addFavorite: builder.mutation<{ favorited: boolean }, { slug: string }>({
      query: ({ slug }) => ({ url: `/barbers/${slug}/favorite`, method: 'POST' }),
      invalidatesTags: ['Favorites'],
    }),
    removeFavorite: builder.mutation<{ favorited: boolean }, { slug: string }>({
      query: ({ slug }) => ({ url: `/barbers/${slug}/favorite`, method: 'DELETE' }),
      invalidatesTags: ['Favorites'],
    }),

    getShopPhotos: builder.query<{ photos: GalleryImage[] }, string>({
      query: (slug) => `/shops/${slug}/photos`,
      providesTags: ['ShopPhotos'],
    }),
    addShopPhoto: builder.mutation<{ photo: GalleryImage }, { slug: string; url: string }>({
      query: ({ slug, url }) => ({ url: `/shops/${slug}/photos`, method: 'POST', body: { url } }),
      invalidatesTags: ['ShopPhotos'],
    }),
    deleteShopPhoto: builder.mutation<{ ok: boolean }, { slug: string; id: string }>({
      query: ({ slug, id }) => ({ url: `/shops/${slug}/photos/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ShopPhotos'],
    }),
  }),
});

export const {
  useMeQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useProviderMeQuery,
  useCreateShopMutation,
  useUpdateShopMutation,
  useCreateBarberMutation,
  useUpdateBarberMutation,
  useGetBarberQuery,
  useGetShopBarbersQuery,
  useAddShopBarberMutation,
  useProviderServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetWorkingHoursQuery,
  useSetWorkingHoursMutation,
  useGetTimeOffQuery,
  useCreateTimeOffMutation,
  useDeleteTimeOffMutation,
  useGetBreaksQuery,
  useCreateBreakMutation,
  useDeleteBreakMutation,
  useGetDistrictsQuery,
  useUpdateMeMutation,
  useGetBarberAssignmentsQuery,
  useSetBarberAssignmentsMutation,
  useGetShopDefaultsQuery,
  useSetShopDefaultsMutation,
  useApplyShopDefaultsMutation,
  useGetAvailabilityQuery,
  useCreateBookingMutation,
  useGetNotificationsQuery,
  useReadAllNotificationsMutation,
  useGetProviderBookingsQuery,
  useGetProviderAnalyticsQuery,
  useCancelBookingMutation,
  useGetMyBookingsQuery,
  useCompleteBookingMutation,
  useAcceptBookingMutation,
  useNoShowBookingMutation,
  useCreateReviewMutation,
  useGetManagedBookingQuery,
  useGetAdminOverviewQuery,
  useSetShopStatusMutation,
  useSetBarberStatusMutation,
  useSetUserStatusMutation,
  useDeleteUserMutation,
  useSetReviewVisibilityMutation,
  useSetBarberFlagsMutation,
  useSetShopFlagsMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetBarberPortfolioQuery,
  useAddBarberPortfolioMutation,
  useDeleteBarberPortfolioMutation,
  useGetShopPhotosQuery,
  useAddShopPhotoMutation,
  useDeleteShopPhotoMutation,
  useGetFavoriteSlugsQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = api;
