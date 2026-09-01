import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SegmentedControl } from '@/src/components/ui/SegmentedControl';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Fab } from '@/src/components/ui/Fab';
import { DebtRow } from '@/src/components/debts/DebtRow';
import { UpcomingDebtsWidget } from '@/src/components/debts/UpcomingDebtsWidget';
import { NewDebtModal } from '@/src/components/debts/NewDebtModal';
import { useDebts, useUpcomingDebts } from '@/src/query/hooks/useDebts';
import { useAuth } from '@/src/auth/AuthProvider';
import type { DebtStatus } from '@/src/types/api';

type StatusFilter = DebtStatus | 'all';

export default function DebtsScreen() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [isNewModalVisible, setNewModalVisible] = useState(false);
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'BDT';

  // Fetched ONCE regardless of which tab is selected — filtering by status
  // happens locally below, against the effective `status` field the
  // backend already computed on each debt. Previously each tab
  // (?status=pending / ?status=overdue / ?status=paid) was a SEPARATE
  // server query with its own cache entry; switching to a tab that had
  // never been individually fetched while online showed nothing at all
  // once offline, since that specific query had no cached data to fall
  // back on. A single query that's always cached, filtered in memory,
  // makes every tab work offline the moment the debts list has loaded once.
  const debtsQuery = useDebts({ limit: 100 });
  const upcomingQuery = useUpcomingDebts(14);
  const debts = useMemo(() => {
    const allDebts = debtsQuery.data?.data ?? [];
    return status === 'all' ? allDebts : allDebts.filter((debt) => debt.status === status);
  }, [debtsQuery.data, status]);
  const upcoming = upcomingQuery.data ?? [];

  const queryClient = useQueryClient();
  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: text }]}>Debts</Text>
      </View>

      <FlatList
        data={debts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={debtsQuery.isRefetching || upcomingQuery.isRefetching}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['debts'] })}
            tintColor={primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <UpcomingDebtsWidget debts={upcoming} currency={currency} />
            <SegmentedControl
              value={status}
              onChange={setStatus}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Overdue', value: 'overdue' },
                { label: 'Paid', value: 'paid' },
              ]}
            />
          </View>
        }
        renderItem={({ item }) => (
          <DebtRow
            debt={item}
            currency={currency}
            onPress={() => router.push({ pathname: '/debt/[id]', params: { id: String(item.id) } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState icon="🤝" title="No debts here" subtitle="Tap the + button to add one." />
        }
      />

      <Fab onPress={() => setNewModalVisible(true)} />
      <NewDebtModal visible={isNewModalVisible} onClose={() => setNewModalVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800' },
  list: { padding: Spacing.lg, paddingTop: 0, flexGrow: 1 },
  listHeader: { gap: Spacing.md, marginBottom: Spacing.md },
});
