import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { StatusTag } from '@/src/components/ui/StatusTag';
import { formatCurrency } from '@/src/utils/currency';
import { formatFullDate } from '@/src/utils/date';
import type { Debt } from '@/src/types/api';

export function DebtRow({ debt, currency, onPress }: { debt: Debt; currency: string; onPress: () => void }) {
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: card, borderColor: border, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.top}>
        <Text style={[styles.name, { color: text }]} numberOfLines={1}>
          {debt.person_name}
        </Text>
        <StatusTag status={debt.status} />
      </View>
      <View style={styles.bottom}>
        <Text style={[styles.remaining, { color: text }]}>
          {formatCurrency(debt.remaining_amount, currency)}{' '}
          <Text style={[styles.ofTotal, { color: textSecondary }]}>of {formatCurrency(debt.amount, currency)}</Text>
        </Text>
        {debt.due_date ? (
          <Text style={[styles.due, { color: textSecondary }]}>Due {formatFullDate(debt.due_date)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { padding: Spacing.md, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.xs },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: 16, fontWeight: '700', flex: 1 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remaining: { fontSize: 15, fontWeight: '700' },
  ofTotal: { fontSize: 12, fontWeight: '400' },
  due: { fontSize: 12 },
});
