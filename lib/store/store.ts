import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';

// A factory (not a singleton) so each client gets its own store and we never
// share state across requests on the server.
export function makeStore() {
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    // RTK Query's middleware enables caching, invalidation, polling, etc.
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });

  // Enables refetchOnFocus / refetchOnReconnect for queries that opt in.
  setupListeners(store.dispatch);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
