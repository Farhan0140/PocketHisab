import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { useCreateCategory, useUpdateCategory } from '@/src/query/hooks/useCategories';
import type { Category } from '@/src/types/api';

const ICON_OPTIONS = ['📦', '🎁', '🐾', '✈️', '🏋️', '🎮', '📱', '🧴', '🚗', '🎓'];
const COLOR_OPTIONS = ['#0F766E', '#DC2626', '#D97706', '#16A34A', '#7C3AED', '#EC4899', '#0EA5E9'];

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  /** Present to edit an existing custom category instead of creating a new one. */
  editingCategory?: Category | null;
  onCreated?: (categoryId: number) => void;
  onUpdated?: () => void;
}

/** Create-or-edit modal for a custom category — used by both the Add/Spend category picker and the Categories management screen. */
export function CategoryFormModal({ visible, onClose, editingCategory, onCreated, onUpdated }: CategoryFormModalProps) {
  const isEditing = Boolean(editingCategory);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');

  // Re-sync the form fields whenever a different category is opened for editing.
  useEffect(() => {
    if (visible) {
      setName(editingCategory?.name ?? '');
      setIcon(editingCategory?.icon || ICON_OPTIONS[0]);
      setColor(editingCategory?.color || COLOR_OPTIONS[0]);
    }
  }, [visible, editingCategory]);

  async function handleSubmit() {
    if (isEditing && editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, input: { name: name.trim(), icon, color } });
      onUpdated?.();
    } else {
      const result = await createCategory.mutateAsync({ name: name.trim(), icon, color });
      onCreated?.(result.data.id);
    }
    onClose();
  }

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <View style={[styles.sheet, { backgroundColor: background }]}>
          <Text style={[styles.title, { color: text }]}>{isEditing ? 'Edit category' : 'New category'}</Text>

          <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Pet Care" />

          <Text style={[styles.label, { color: text }]}>Icon</Text>
          <View style={styles.optionsRow}>
            {ICON_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setIcon(option)}
                style={[styles.iconOption, { backgroundColor: card, borderColor: icon === option ? color : 'transparent' }]}
              >
                <Text style={styles.iconOptionText}>{option}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: text }]}>Color</Text>
          <View style={styles.optionsRow}>
            {COLOR_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setColor(option)}
                style={[
                  styles.colorOption,
                  { backgroundColor: option, borderColor: color === option ? text : 'transparent' },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.actionButton} />
            <Button
              label={isEditing ? 'Save' : 'Create'}
              onPress={handleSubmit}
              disabled={!name.trim()}
              loading={isPending}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.sm },
  title: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.xs },
  label: { fontSize: 13, fontWeight: '600', marginTop: Spacing.xs },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  iconOptionText: { fontSize: 20 },
  colorOption: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionButton: { flex: 1 },
});
