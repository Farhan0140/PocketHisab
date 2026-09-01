import { useState } from 'react';
import { StyleSheet } from 'react-native';
// Using gesture-handler's ScrollView (not react-native's) is required here:
// this picker is used inside @gorhom/bottom-sheet, whose drag-to-close gesture
// is itself built on react-native-gesture-handler. A plain RN ScrollView's pan
// responder doesn't negotiate with that gesture system, so its horizontal
// scroll silently loses to the sheet's own vertical pan handler and never
// scrolls. Gesture-handler's ScrollView participates correctly and works
// identically outside a bottom sheet too, so it's safe to use everywhere.
import { ScrollView } from 'react-native-gesture-handler';
import { Chip } from '@/src/components/ui/Chip';
import { CategoryFormModal } from './CategoryFormModal';
import { useCategories } from '@/src/query/hooks/useCategories';
import { Spacing } from '@/constants/theme';

export function CategoryPicker({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const { data: categories = [] } = useCategories();
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            icon={category.icon ?? undefined}
            selected={selectedId === category.id}
            onPress={() => onSelect(category.id)}
          />
        ))}
        <Chip label="Add" icon="+" onPress={() => setAddModalVisible(true)} />
      </ScrollView>

      <CategoryFormModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onCreated={onSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
});
