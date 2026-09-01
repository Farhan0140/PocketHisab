import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { AddEntryModal } from '@/src/components/savings/AddEntryModal';
import { PotFormModal } from '@/src/components/savings/PotFormModal';
import { useDeleteSavingsPot, useSavingsPot } from '@/src/query/hooks/useSavingsPots';
import { useAuth } from '@/src/auth/AuthProvider';
import { formatCurrency, formatSignedCurrency } from '@/src/utils/currency';
import { formatFullDate } from '@/src/utils/date';

export default function SavingsPotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const potId = Number(id);
  const { data: pot, isLoading } = useSavingsPot(potId);
  const deletePot = useDeleteSavingsPot();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'BDT';

  const [isEntryVisible, setEntryVisible] = useState(false);
  const [isEditVisible, setEditVisible] = useState(false);

  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const income = useThemeColor({}, 'income');
  const expense = useThemeColor({}, 'expense');
  const primary = useThemeColor({}, 'primary');

  if (isLoading || !pot) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: 'Savings Pot' }} />
        {!isLoading ? <EmptyState icon="🔍" title="Pot not found" /> : null}
      </ScreenContainer>
    );
  }

  function handleDelete() {
    Alert.alert('Delete pot', `Remove "${pot!.title}" and its entire history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePot.mutateAsync(pot!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: pot.title, headerBackTitle: 'Savings' }} />

      <FlatList
        data={pot.history}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Card style={styles.summaryCard}>
              <Text style={styles.icon}>{pot.icon || '🏦'}</Text>
              <Text style={[styles.title, { color: text }]}>{pot.title}</Text>
              <Text style={[styles.amount, { color: primary }]}>{formatCurrency(pot.current_amount, currency)}</Text>
            </Card>

            <Button label="Add Deposit / Withdrawal" onPress={() => setEntryVisible(true)} />

            <View style={styles.actionsRow}>
              <Button label="Edit" variant="secondary" onPress={() => setEditVisible(true)} style={styles.actionButton} />
              <Button label="Delete" variant="expense" onPress={handleDelete} style={styles.actionButton} />
            </View>

            <Text style={[styles.sectionTitle, { color: textSecondary }]}>History</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <View>
              <Text style={[styles.entryAmount, { color: item.type === 'deposit' ? income : expense }]}>
                {formatSignedCurrency(item.amount, item.type === 'deposit' ? 'income' : 'expense', currency)}
              </Text>
              {item.note ? <Text style={[styles.entryNote, { color: textSecondary }]}>{item.note}</Text> : null}
            </View>
            <Text style={[styles.entryDate, { color: textSecondary }]}>{formatFullDate(item.entry_date)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.empty, { color: textSecondary }]}>No entries yet.</Text>}
      />

      <AddEntryModal visible={isEntryVisible} onClose={() => setEntryVisible(false)} pot={pot} currency={currency} />
      <PotFormModal visible={isEditVisible} onClose={() => setEditVisible(false)} editingPot={pot} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.lg },
  headerSection: { gap: Spacing.md, marginBottom: Spacing.md },
  summaryCard: { alignItems: 'center', gap: 4 },
  icon: { fontSize: 36 },
  title: { fontSize: 18, fontWeight: '800' },
  amount: { fontSize: 30, fontWeight: '800' },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  entryAmount: { fontSize: 15, fontWeight: '700' },
  entryNote: { fontSize: 12 },
  entryDate: { fontSize: 12 },
  empty: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.md },
});
