import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

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
  tagTypes: ['Me'],
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
  }),
});

export const { useMeQuery, useRegisterMutation, useLoginMutation, useLogoutMutation } = api;
