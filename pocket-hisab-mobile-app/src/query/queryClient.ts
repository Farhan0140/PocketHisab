/**
 * The single QueryClient for the whole app, plus the wiring that makes it
 * behave "offline-first":
 *
 *   - `persister` snapshots the query cache to AsyncStorage, so on a cold
 *     start the last-known data renders IMMEDIATELY (synchronously from
 *     disk) before any network request has even started — this is what
 *     satisfies "local data is the source of truth for what the UI shows".
 *   - `onlineManager` is wired to NetInfo instead of TanStack Query's
 *     browser-only default (navigator.onLine, which doesn't exist on native)
 *     — without this, React Query on React Native would never correctly
 *     detect "offline" and would keep retrying doomed requests instead of
 *     pausing them.
 *   - `mutationCache` + `networkMode: 'offlineFirst'` (set per-mutation, see
 *     src/query/hooks/*) means a mutation fired while offline is PAUSED
 *     (not dropped, not errored) and automatically resumes the moment
 *     `onlineManager` flips back to online — this is the "queue writes
 *     while offline, auto-sync on reconnect" behavior from the design doc,
 *     with no custom outbox table required.
 */

import { QueryClient, onlineManager, focusManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute — avoids refetching on every screen focus
      gcTime: 1000 * 60 * 60 * 24, // keep cached data for 24h so it survives a cold start
      retry: 2,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'pockethisab-query-cache',
});

// --- Connectivity: drive React Query's online/offline state from NetInfo ---
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
});

// --- App foreground/background: refetch stale queries when the app returns
// to the foreground, matching web's default window-focus behavior (which
// doesn't exist on native without this).
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}
AppState.addEventListener('change', onAppStateChange);
