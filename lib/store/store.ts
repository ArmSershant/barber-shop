import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';

// A factory (not a singleton) so each client gets its own store and we never
// share state across requests on the server.
export function makeStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    // RTK Query's middleware enables caching, invalidation, polling, etc.
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
