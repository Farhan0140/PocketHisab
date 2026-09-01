import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { useCreateSavingsPot, useUpdateSavingsPot } from '@/src/query/hooks/useSavingsPots';
import type { SavingsPot } from '@/src/types/api';

const ICON_OPTIONS = ['🏦', '🏠', '🚨', '✈️', '🎓', '💍', '🚗', '🎁', '💻', '🏥'];

export function PotFormModal({
  visible,
  onClose,
  editingPot,
}: {
  visible: boolean;
  onClose: () => void;
  editingPot?: SavingsPot | null;
}) {
  const isEditing = Boolean(editingPot);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const createPot = useCreateSavingsPot();
  const updatePot = useUpdateSavingsPot();

  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');
  const primary = useThemeColor({}, 'primary');

  useEffect(() => {
    if (visible) {
      setTitle(editingPot?.title ?? '');
      setIcon(editingPot?.icon || ICON_OPTIONS[0]);
    }
  }, [visible, editingPot]);

  async function handleSubmit() {
    if (isEditing && editingPot) {
      await updatePot.mutateAsync({ id: editingPot.id, input: { title: title.trim(), icon } });
    } else {
      await createPot.mutateAsync({ title: title.trim(), icon });
    }
    onClose();
  }

  const isPending = createPot.isPending || updatePot.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: background }]}>
          <Text style={[styles.title, { color: text }]}>{isEditing ? 'Edit pot' : 'New savings pot'}</Text>

          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Emergency Fund" />

          <Text style={[styles.label, { color: text }]}>Icon</Text>
          <View style={styles.optionsRow}>
            {ICON_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setIcon(option)}
                style={[styles.iconOption, { backgroundColor: card, borderColor: icon === option ? primary : 'transparent' }]}
              >
                <Text style={styles.iconOptionText}>{option}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.actionButton} />
            <Button
              label={isEditing ? 'Save' : 'Create'}
              onPress={handleSubmit}
              disabled={!title.trim()}
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
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
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
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionButton: { flex: 1 },
});
