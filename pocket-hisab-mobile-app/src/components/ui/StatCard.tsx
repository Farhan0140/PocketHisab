import { StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { formatCurrency } from '@/src/utils/currency';

export function StatCard({
  label,
  amount,
  currency,
  tone = 'neutral',
}: {
  label: string;
  amount: number;
  currency: string;
  tone?: 'income' | 'expense' | 'neutral';
}) {
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const income = useThemeColor({}, 'income');
  const expense = useThemeColor({}, 'expense');
  const text = useThemeColor({}, 'text');

  const amountColor = tone === 'income' ? income : tone === 'expense' ? expense : text;

  return (
    <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
      <Text style={[styles.label, { color: textSecondary }]}>{label}</Text>
      <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(amount, currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minWidth: 120,
    gap: 2,
  },
  label: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 16, fontWeight: '800' },
});
