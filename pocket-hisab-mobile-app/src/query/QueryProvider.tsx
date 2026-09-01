/**
 * Wraps the app in PersistQueryClientProvider (instead of plain
 * QueryClientProvider) so the cache is restored from AsyncStorage on boot
 * and re-persisted after every change. `onSuccess` fires once restoration
 * finishes — that's the right moment to resume any mutations that were
 * paused mid-flight when the app was last closed while offline.
 */

import type { ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from './queryClient';

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24 }}
      onSuccess={() => {
        queryClient.resumePausedMutations();
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
