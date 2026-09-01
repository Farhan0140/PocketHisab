/**
 * Small connectivity/sync dot for the Home header (see design doc §8.1).
 * Deliberately driven directly off state React Query already tracks
 * (useIsFetching/useIsMutating) plus NetInfo — no separate "sync state"
 * store needed, since the query cache + mutation cache ARE the sync state.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';

export function SyncIndicator({ light = false }: { light?: boolean }) {
  const netInfo = useNetInfo();
  const isFetching = useIsFetching() > 0;
  const isMutating = useIsMutating() > 0;
  const queryClient = useQueryClient();
  const [justSyncedFlash, setJustSyncedFlash] = useState(false);

  const textSecondary = useThemeColor({}, 'textSecondary');
  const income = useThemeColor({}, 'income');
  const warning = useThemeColor({}, 'warning');
  const muted = useThemeColor({}, 'textMuted');

  const isOffline = netInfo.isConnected === false;
  const isSyncing = isFetching || isMutating;

  // On a colored gradient background (e.g. the Home balance card), the dot
  // stays semantic but the text switches to a translucent white for contrast.
  const labelColor = light ? '#FFFFFFCC' : textSecondary;

  let color = light ? '#FFFFFF' : income;
  let label = 'Synced';
  if (isOffline) {
    color = light ? '#FFFFFF99' : muted;
    label = 'Offline';
  } else if (isSyncing) {
    color = light ? '#FFFFFF' : warning;
    label = 'Syncing…';
  }

  return (
    <Pressable
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`Sync status: ${label}`}
      onPress={() => {
        if (!isOffline) {
          queryClient.invalidateQueries();
          setJustSyncedFlash(true);
          setTimeout(() => setJustSyncedFlash(false), 1200);
        }
      }}
    >
      <View style={[styles.dot, { backgroundColor: color, opacity: justSyncedFlash ? 1 : 0.9 }]} />
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '600' },
});
