import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
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

  const { data } = useDebts(status === 'all' ? {} : { status });
  const { data: upcoming = [] } = useUpcomingDebts(14);
  const debts = data?.data ?? [];

  const text = useThemeColor({}, 'text');

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: text }]}>Debts</Text>
      </View>

      <FlatList
        data={debts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
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
