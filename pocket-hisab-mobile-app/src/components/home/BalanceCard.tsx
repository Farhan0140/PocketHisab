import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { formatCurrency } from '@/src/utils/currency';
import { SyncIndicator } from '@/src/components/ui/SyncIndicator';

export function BalanceCard({
  balance,
  currency,
  isLoading,
}: {
  balance: number | undefined;
  currency: string;
  isLoading: boolean;
}) {
  const primary = useThemeColor({}, 'primary');
  const primaryMuted = useThemeColor({}, 'primaryMuted');

  return (
    <LinearGradient
      colors={[primary, primaryMuted]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1.2 }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>Total Balance</Text>
        <SyncIndicator light />
      </View>
      <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
        {isLoading ? '···' : formatCurrency(balance ?? 0, currency)}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#FFFFFFCC', fontSize: 14, fontWeight: '700' },
  amount: { color: '#FFFFFF', fontSize: 40, fontWeight: '800' },
});
