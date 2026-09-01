import { Pressable, StyleSheet, Text } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { formatCurrency } from '@/src/utils/currency';
import type { SavingsPot } from '@/src/types/api';

export function SavingsPotCard({ pot, currency, onPress }: { pot: SavingsPot; currency: string; onPress: () => void }) {
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primaryMuted = useThemeColor({}, 'primaryMuted');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: card, borderColor: border, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.iconWrap, { backgroundColor: primaryMuted }]}>{pot.icon || '🏦'}</Text>
      <Text style={[styles.title, { color: text }]} numberOfLines={1}>
        {pot.title}
      </Text>
      <Text style={[styles.amount, { color: textSecondary }]}>{formatCurrency(pot.current_amount, currency)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
    minHeight: 110,
  },
  iconWrap: {
    fontSize: 22,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
  },
  title: { fontSize: 15, fontWeight: '700' },
  amount: { fontSize: 14, fontWeight: '600' },
});
