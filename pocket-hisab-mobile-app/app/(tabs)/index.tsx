import { useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { BalanceCard } from '@/src/components/home/BalanceCard';
import { QuickActions } from '@/src/components/home/QuickActions';
import { PeriodStats } from '@/src/components/home/PeriodStats';
import { TransactionRow } from '@/src/components/transactions/TransactionRow';
import { AddSpendSheet, type AddSpendSheetHandle } from '@/src/components/transactions/AddSpendSheet';
import { useAuth } from '@/src/auth/AuthProvider';
import { useBalance } from '@/src/query/hooks/useBalance';
import { useDashboardSummary, useRecentActivity } from '@/src/query/hooks/useDashboard';

export default function HomeScreen() {
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'BDT';

  const balanceQuery = useBalance();
  const summaryQuery = useDashboardSummary();
  const activityQuery = useRecentActivity(6);
  const queryClient = useQueryClient();

  const sheetRef = useRef<AddSpendSheetHandle>(null);

  const text = useThemeColor({}, 'text');
  const primary = useThemeColor({}, 'primary');

  const isRefreshing = balanceQuery.isRefetching || summaryQuery.isRefetching || activityQuery.isRefetching;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => queryClient.invalidateQueries()}
            tintColor={primary}
          />
        }
      >
        <BalanceCard balance={balanceQuery.data} currency={currency} isLoading={balanceQuery.isLoading} />

        <QuickActions onPress={(type) => sheetRef.current?.present(type)} />

        <PeriodStats summary={summaryQuery.data} currency={currency} />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: text }]}>Recent Activity</Text>
          <Text style={[styles.sectionLink, { color: primary }]} onPress={() => router.push('/(tabs)/history')}>
            See all
          </Text>
        </View>

        <Card style={styles.activityCard}>
          {activityQuery.data && activityQuery.data.length > 0 ? (
            activityQuery.data.map((item, index) => (
              <View key={item.id} style={index > 0 ? styles.rowDivider : undefined}>
                <TransactionRow
                  type={item.type}
                  amount={item.amount}
                  note={item.note}
                  categoryName={item.category_name}
                  categoryIcon={item.category_icon}
                  categoryColor={item.category_color}
                  createdAt={item.created_at}
                  currency={currency}
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon="🧾"
              title="No transactions yet"
              subtitle="Tap Add Money or Spend Money to log your first one."
            />
          )}
        </Card>
      </ScrollView>

      <AddSpendSheet ref={sheetRef} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionLink: { fontSize: 14, fontWeight: '700' },
  activityCard: { gap: Spacing.xs },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.15)' },
});
