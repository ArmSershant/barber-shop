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
  districtId?: number | null;
  status: string;
}

export interface Barber {
  id: string;
  slug: string;
  displayName: string;
  bio?: string | null;
  experienceYears?: number | null;
  photoUrl?: string | null;
  districtId?: number | null;
  shopId?: string | null;
  status: string;
}

export interface ProviderMeResponse {
  shop: Shop | null;
  barber: Barber | null;
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
  photoUrl: string | null;
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
    'Availability',
    'Notifications',
    'ProviderBookings',
    'MyBookings',
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
    cancelBooking: builder.mutation<{ ok: boolean }, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/bookings/${id}/cancel`, method: 'POST', body: { reason } }),
      invalidatesTags: ['ProviderBookings', 'MyBookings', 'Availability'],
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
  useGetShopDefaultsQuery,
  useSetShopDefaultsMutation,
  useApplyShopDefaultsMutation,
  useGetAvailabilityQuery,
  useCreateBookingMutation,
  useGetNotificationsQuery,
  useReadAllNotificationsMutation,
  useGetProviderBookingsQuery,
  useCancelBookingMutation,
  useGetMyBookingsQuery,
  useCompleteBookingMutation,
  useNoShowBookingMutation,
} = api;
