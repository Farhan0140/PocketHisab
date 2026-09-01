import { ScrollView, StyleSheet } from 'react-native';
import { StatCard } from '@/src/components/ui/StatCard';
import { Spacing } from '@/constants/theme';
import type { DashboardSummary } from '@/src/types/api';

export function PeriodStats({ summary, currency }: { summary: DashboardSummary | undefined; currency: string }) {
  const periods: { label: string; net: number }[] = [
    { label: 'Today', net: summary?.today.net_total ?? 0 },
    { label: 'This Month', net: summary?.this_month.net_total ?? 0 },
    { label: 'This Year', net: summary?.this_year.net_total ?? 0 },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {periods.map((period) => (
        <StatCard
          key={period.label}
          label={period.label}
          amount={period.net}
          currency={currency}
          tone={period.net > 0 ? 'income' : period.net < 0 ? 'expense' : 'neutral'}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
});
