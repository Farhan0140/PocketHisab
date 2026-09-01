import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SegmentedControl } from '@/src/components/ui/SegmentedControl';
import { TextField } from '@/src/components/ui/TextField';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { TransactionRow } from '@/src/components/transactions/TransactionRow';
import { useTransactions } from '@/src/query/hooks/useTransactions';
import { useAuth } from '@/src/auth/AuthProvider';
import { getPeriodRange, formatDateGroupLabel } from '@/src/utils/date';
import type { Transaction } from '@/src/types/api';

type Period = 'day' | 'month' | 'year';

export default function HistoryScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const [search, setSearch] = useState('');
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'BDT';

  const { start_date, end_date } = useMemo(() => getPeriodRange(period), [period]);

  const { data, isLoading } = useTransactions({
    start_date,
    end_date,
    search: search.trim() || undefined,
    limit: 100,
  });

  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const background = useThemeColor({}, 'background');

  const sections = useMemo(() => {
    const rows = data?.data ?? [];
    const groups = new Map<string, Transaction[]>();
    for (const row of rows) {
      const list = groups.get(row.transaction_date) ?? [];
      list.push(row);
      groups.set(row.transaction_date, list);
    }
    return Array.from(groups.entries()).map(([date, transactions]) => ({
      title: formatDateGroupLabel(date),
      data: transactions,
    }));
  }, [data]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: text }]}>History</Text>
        <SegmentedControl
          value={period}
          onChange={setPeriod}
          options={[
            { label: 'Day', value: 'day' },
            { label: 'Month', value: 'month' },
            { label: 'Year', value: 'year' },
          ]}
        />
        <TextField placeholder="Search notes…" value={search} onChangeText={setSearch} autoCapitalize="none" />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, sections.length === 0 && styles.listContentEmpty]}
        style={{ backgroundColor: background }}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: textSecondary, backgroundColor: background }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            type={item.type}
            amount={item.amount}
            note={item.note}
            categoryName={item.category_name ?? null}
            categoryIcon={item.category_icon ?? null}
            categoryColor={item.category_color ?? null}
            createdAt={item.created_at}
            currency={currency}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon="📭" title="No transactions in this period" subtitle="Try a different range or search." />
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800' },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  listContentEmpty: { flexGrow: 1 },
  sectionHeader: { fontSize: 13, fontWeight: '700', paddingVertical: Spacing.xs },
});
