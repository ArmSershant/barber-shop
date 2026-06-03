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

export interface Service {
  id: string;
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
  tagTypes: ['Me', 'ProviderMe', 'Services', 'WorkingHours'],
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
      invalidatesTags: ['ProviderMe'],
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
  useProviderServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetWorkingHoursQuery,
  useSetWorkingHoursMutation,
} = api;
