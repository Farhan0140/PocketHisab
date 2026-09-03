import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Fab } from '@/src/components/ui/Fab';
import { SavingsPotCard } from '@/src/components/savings/SavingsPotCard';
import { PotFormModal } from '@/src/components/savings/PotFormModal';
import { useSavingsPots } from '@/src/query/hooks/useSavingsPots';
import { useAuth } from '@/src/auth/AuthProvider';
import { formatCurrency } from '@/src/utils/currency';

export default function SavingsScreen() {
  const [isNewModalVisible, setNewModalVisible] = useState(false);
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'BDT';

  const potsQuery = useSavingsPots();
  const pots = potsQuery.data?.data ?? [];
  const totalSaved = (potsQuery.data?.meta as { total_saved?: number } | null)?.total_saved ?? 0;

  const queryClient = useQueryClient();
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'primary');

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: text }]}>Savings</Text>
      </View>

      <FlatList
        data={pots}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        refreshControl={
          <RefreshControl
            refreshing={potsQuery.isRefetching}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['savings-pots'] })}
            tintColor={primary}
          />
        }
        ListHeaderComponent={
          <Card style={styles.totalCard}>
            <Text style={[styles.totalLabel, { color: textSecondary }]}>Total Savings</Text>
            <Text style={[styles.totalValue, { color: primary }]}>{formatCurrency(totalSaved, currency)}</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <SavingsPotCard
            pot={item}
            currency={currency}
            onPress={() => router.push({ pathname: '/savings-pot/[id]', params: { id: String(item.id) } })}
          />
        )}
        ListEmptyComponent={
          <EmptyState icon="🏦" title="No savings pots yet" subtitle="Tap the + button to create one." />
        }
      />

      <Fab onPress={() => setNewModalVisible(true)} />
      <PotFormModal visible={isNewModalVisible} onClose={() => setNewModalVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800' },
  list: { padding: Spacing.lg, paddingTop: 0, flexGrow: 1 },
  columnWrapper: { gap: Spacing.sm },
  rowSeparator: { height: Spacing.sm },
  totalCard: { alignItems: 'center', gap: 2, marginBottom: Spacing.md },
  totalLabel: { fontSize: 13, fontWeight: '600' },
  totalValue: { fontSize: 28, fontWeight: '800' },
});
