import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { formatCurrency } from '@/src/utils/currency';
import { formatFullDate } from '@/src/utils/date';
import type { Debt } from '@/src/types/api';

export function UpcomingDebtsWidget({ debts, currency }: { debts: Debt[]; currency: string }) {
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const warning = useThemeColor({}, 'warning');

  if (debts.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {debts.map((debt) => (
        <Pressable
          key={debt.id}
          onPress={() => router.push({ pathname: '/debt/[id]', params: { id: String(debt.id) } })}
          style={[styles.card, { backgroundColor: card, borderColor: border }]}
        >
          <Text style={[styles.dueLabel, { color: warning }]}>Due {debt.due_date ? formatFullDate(debt.due_date) : ''}</Text>
          <Text style={[styles.name, { color: text }]} numberOfLines={1}>
            {debt.person_name}
          </Text>
          <Text style={[styles.amount, { color: text }]}>{formatCurrency(debt.remaining_amount, currency)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  card: {
    width: 150,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  dueLabel: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '700' },
  amount: { fontSize: 15, fontWeight: '800' },
});
