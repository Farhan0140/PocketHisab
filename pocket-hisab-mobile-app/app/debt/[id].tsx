import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { StatusTag } from '@/src/components/ui/StatusTag';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { LogRepaymentModal } from '@/src/components/debts/LogRepaymentModal';
import { EditDebtModal } from '@/src/components/debts/EditDebtModal';
import { RemindersSection } from '@/src/components/debts/RemindersSection';
import { useDebt, useDeleteDebt } from '@/src/query/hooks/useDebts';
import { useAuth } from '@/src/auth/AuthProvider';
import { formatCurrency } from '@/src/utils/currency';
import { formatFullDate } from '@/src/utils/date';

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const debtId = Number(id);
  const debtQuery = useDebt(debtId);
  const debt = debtQuery.data;
  const deleteDebt = useDeleteDebt();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'BDT';

  const [isRepayVisible, setRepayVisible] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);

  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const income = useThemeColor({}, 'income');

  // isError means the server genuinely returned 404 (or another failure) —
  // ONLY that means "not found". A query with no data yet is either still
  // loading, or PAUSED because the device is offline and this debt was
  // never fetched on it before (see useDebt's initialData) — neither of
  // those means the debt doesn't exist, so they get their own messaging
  // instead of a false "not found".
  if (debtQuery.isError) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: 'Debt' }} />
        <EmptyState icon="🔍" title="Debt not found" />
      </ScreenContainer>
    );
  }

  if (!debt && debtQuery.fetchStatus === 'paused') {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: 'Debt' }} />
        <EmptyState
          icon="📡"
          title="Waiting to reconnect"
          subtitle="This debt hasn't loaded on this device yet — it'll appear as soon as you're back online."
        />
      </ScreenContainer>
    );
  }

  if (!debt) {
    return (
      <ScreenContainer style={styles.centered}>
        <Stack.Screen options={{ title: 'Debt' }} />
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  function handleDelete() {
    Alert.alert('Delete debt', `Remove ${debt!.person_name}'s debt and all its history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        // Not awaited — see AddSpendSheet's handleConfirm for why.
        onPress: () => {
          deleteDebt.mutate(debt!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: debt.person_name, headerBackTitle: 'Debts' }} />

      <FlatList
        data={debt.repayments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <Text style={[styles.personName, { color: text }]}>{debt.person_name}</Text>
                <StatusTag status={debt.status} />
              </View>
              <Text style={[styles.remaining, { color: text }]}>{formatCurrency(debt.remaining_amount, currency)}</Text>
              <Text style={[styles.ofTotal, { color: textSecondary }]}>
                of {formatCurrency(debt.amount, currency)} borrowed
              </Text>
              {debt.due_date ? (
                <Text style={[styles.due, { color: textSecondary }]}>Due {formatFullDate(debt.due_date)}</Text>
              ) : null}
              {debt.note ? <Text style={[styles.note, { color: textSecondary }]}>{debt.note}</Text> : null}
            </Card>

            {debt.status !== 'paid' ? (
              <Button label="Log Repayment" variant="income" onPress={() => setRepayVisible(true)} />
            ) : null}

            <View style={styles.actionsRow}>
              <Button label="Edit" variant="secondary" onPress={() => setEditVisible(true)} style={styles.actionButton} />
              <Button label="Delete" variant="expense" onPress={handleDelete} style={styles.actionButton} />
            </View>

            <RemindersSection debtId={debt.id} personName={debt.person_name} />

            <Text style={[styles.sectionTitle, { color: textSecondary }]}>Repayment History</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.repaymentRow}>
            <View>
              <Text style={[styles.repaymentAmount, { color: income }]}>{formatCurrency(item.amount, currency)}</Text>
              {item.note ? <Text style={[styles.repaymentNote, { color: textSecondary }]}>{item.note}</Text> : null}
            </View>
            <Text style={[styles.repaymentDate, { color: textSecondary }]}>{formatFullDate(item.repaid_date)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.empty, { color: textSecondary }]}>No repayments logged yet.</Text>}
      />

      <LogRepaymentModal visible={isRepayVisible} onClose={() => setRepayVisible(false)} debt={debt} currency={currency} />
      <EditDebtModal visible={isEditVisible} onClose={() => setEditVisible(false)} debt={debt} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.lg },
  headerSection: { gap: Spacing.md, marginBottom: Spacing.md },
  summaryCard: { gap: 4 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personName: { fontSize: 18, fontWeight: '800' },
  remaining: { fontSize: 30, fontWeight: '800', marginTop: 4 },
  ofTotal: { fontSize: 13 },
  due: { fontSize: 13, marginTop: 4 },
  note: { fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  repaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  repaymentAmount: { fontSize: 15, fontWeight: '700' },
  repaymentNote: { fontSize: 12 },
  repaymentDate: { fontSize: 12 },
  empty: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.md },
});
