import { useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Button } from '@/src/components/ui/Button';
import { CategoryFormModal } from '@/src/components/transactions/CategoryFormModal';
import { useCategories, useDeleteCategory } from '@/src/query/hooks/useCategories';
import type { Category } from '@/src/types/api';

export default function CategoriesScreen() {
  const { data: categories = [] } = useCategories();
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const deleteCategory = useDeleteCategory();

  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const primaryMuted = useThemeColor({}, 'primaryMuted');
  const expense = useThemeColor({}, 'expense');

  function handleDelete(category: Category) {
    Alert.alert(
      'Delete category',
      `Remove "${category.name}"? This only removes the category — its past transactions stay in your history, still labeled "${category.name}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCategory.mutate(category.id) },
      ]
    );
  }

  const sections = useMemo(
    () => [
      { title: 'Your Categories', data: categories.filter((c) => !c.is_default) },
      { title: 'Default Categories', data: categories.filter((c) => c.is_default) },
    ],
    [categories]
  );

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: 'Categories', headerBackTitle: 'Back' }} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) =>
          section.data.length > 0 ? (
            <Text style={[styles.sectionTitle, { color: textSecondary }]}>{section.title}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/categories/[id]', params: { id: String(item.id) } })}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: card, borderColor: border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.color ? `${item.color}22` : primaryMuted }]}>
              <Text style={styles.icon}>{item.icon || '📦'}</Text>
            </View>
            <Text style={[styles.name, { color: text }]}>{item.name}</Text>
            {item.is_default ? (
              <Text style={[styles.badge, { color: textSecondary }]}>Default</Text>
            ) : (
              <Pressable
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  handleDelete(item);
                }}
                style={styles.deleteButton}
              >
                <Text style={[styles.deleteIcon, { color: expense }]}>🗑</Text>
              </Pressable>
            )}
          </Pressable>
        )}
        ListFooterComponent={
          <Button
            label="+ New Category"
            variant="secondary"
            onPress={() => setAddModalVisible(true)}
            style={styles.addButton}
          />
        }
      />

      <CategoryFormModal visible={isAddModalVisible} onClose={() => setAddModalVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.lg, gap: Spacing.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginTop: Spacing.md, marginBottom: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xs,
  },
  iconWrap: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 16 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  badge: { fontSize: 12, fontWeight: '600' },
  deleteButton: { padding: Spacing.xs },
  deleteIcon: { fontSize: 16 },
  addButton: { marginTop: Spacing.md },
});
