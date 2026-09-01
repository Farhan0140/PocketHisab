import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { formatSignedCurrency } from '@/src/utils/currency';
import { formatTime } from '@/src/utils/date';
import type { TransactionType } from '@/src/types/api';

interface TransactionRowProps {
  type: TransactionType;
  amount: string;
  note: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  createdAt: string;
  currency: string;
  onPress?: () => void;
}

export function TransactionRow({
  type,
  amount,
  note,
  categoryName,
  categoryIcon,
  categoryColor,
  createdAt,
  currency,
  onPress,
}: TransactionRowProps) {
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const income = useThemeColor({}, 'income');
  const expense = useThemeColor({}, 'expense');
  const primaryMuted = useThemeColor({}, 'primaryMuted');

  const amountColor = type === 'income' ? income : expense;
  const title = note?.trim() || categoryName || (type === 'income' ? 'Income' : 'Expense');
  const subtitle = note?.trim() && categoryName ? categoryName : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1, borderLeftColor: categoryColor || 'transparent' }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: categoryColor ? `${categoryColor}22` : primaryMuted }]}>
        <Text style={styles.icon}>{categoryIcon || (type === 'income' ? '💵' : '🧾')}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={[styles.title, { color: text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>{formatSignedCurrency(amount, type, currency)}</Text>
        <Text style={[styles.time, { color: textMuted }]}>{formatTime(createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  middle: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12 },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
  time: { fontSize: 11 },
});
