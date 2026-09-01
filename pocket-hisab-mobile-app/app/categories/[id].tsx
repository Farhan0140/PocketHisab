import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { TransactionRow } from '@/src/components/transactions/TransactionRow';
import { CategoryFormModal } from '@/src/components/transactions/CategoryFormModal';
import { useCategories, useDeleteCategory } from '@/src/query/hooks/useCategories';
import { useTransactions } from '@/src/query/hooks/useTransactions';
import { useAuth } from '@/src/auth/AuthProvider';
import { formatCurrency } from '@/src/utils/currency';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = Number(id);
  const [isEditVisible, setEditVisible] = useState(false);

  const { data: categories = [] } = useCategories();
  const category = categories.find((c) => c.id === categoryId);
  const deleteCategory = useDeleteCategory();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'BDT';

  const { data } = useTransactions({ category_id: categoryId, limit: 50 });
  const transactions = data?.data ?? [];
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const expense = useThemeColor({}, 'expense');
  const primaryMuted = useThemeColor({}, 'primaryMuted');

  if (!category) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: 'Category' }} />
        <EmptyState icon="🔍" title="Category not found" />
      </ScreenContainer>
    );
  }

  function handleDelete() {
    Alert.alert('Delete category', `Remove "${category!.name}"? Past transactions keep showing it.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        // Not awaited — see AddSpendSheet's handleConfirm for why: awaiting
        // would leave this screen stuck if offline. Navigate back right
        // away; the delete completes now (online) or on reconnect.
        onPress: () => {
          deleteCategory.mutate(category!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: category.name, headerBackTitle: 'Categories' }} />

      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: category.color ? `${category.color}22` : primaryMuted }]}>
              <Text style={styles.icon}>{category.icon || '📦'}</Text>
            </View>
            <Text style={[styles.name, { color: text }]}>{category.name}</Text>

            <Card style={styles.statCard}>
              <Text style={[styles.statLabel, { color: textSecondary }]}>Total spent</Text>
              <Text style={[styles.statValue, { color: expense }]}>{formatCurrency(totalSpent, currency)}</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>{transactions.length} transactions</Text>
            </Card>

            {!category.is_default ? (
              <View style={styles.actions}>
                <Button label="Edit" variant="secondary" onPress={() => setEditVisible(true)} style={styles.actionButton} />
                <Button label="Delete" variant="expense" onPress={handleDelete} style={styles.actionButton} />
              </View>
            ) : (
              <Text style={[styles.defaultNote, { color: textSecondary }]}>
                Default categories can&apos;t be edited or deleted.
              </Text>
            )}

            <Text style={[styles.sectionTitle, { color: textSecondary }]}>History</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionRow
            type={item.type}
            amount={item.amount}
            note={item.note}
            categoryName={category.name}
            categoryIcon={category.icon}
            categoryColor={category.color}
            createdAt={item.created_at}
            currency={currency}
          />
        )}
        ListEmptyComponent={<EmptyState icon="🧾" title="No transactions in this category yet" />}
      />

      <CategoryFormModal visible={isEditVisible} onClose={() => setEditVisible(false)} editingCategory={category} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.lg },
  header: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 30 },
  name: { fontSize: 20, fontWeight: '800' },
  statCard: { alignItems: 'center', gap: 2, width: '100%' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  actionButton: { flex: 1 },
  defaultNote: { fontSize: 12, fontStyle: 'italic' },
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },
});
