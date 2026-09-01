import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { TextField } from '@/src/components/ui/TextField';
import { DateField } from '@/src/components/ui/DateField';
import { Button } from '@/src/components/ui/Button';
import { useUpdateDebt } from '@/src/query/hooks/useDebts';
import type { Debt } from '@/src/types/api';

export function EditDebtModal({ visible, onClose, debt }: { visible: boolean; onClose: () => void; debt: Debt }) {
  const [personName, setPersonName] = useState(debt.person_name);
  const [note, setNote] = useState(debt.note ?? '');
  const [dueDate, setDueDate] = useState<Date | null>(debt.due_date ? new Date(`${debt.due_date}T00:00:00`) : null);
  const updateDebt = useUpdateDebt();

  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  useEffect(() => {
    if (visible) {
      setPersonName(debt.person_name);
      setNote(debt.note ?? '');
      setDueDate(debt.due_date ? new Date(`${debt.due_date}T00:00:00`) : null);
    }
  }, [visible, debt]);

  async function handleSave() {
    await updateDebt.mutateAsync({
      id: debt.id,
      input: {
        person_name: personName.trim(),
        note: note.trim() || null,
        due_date: dueDate ? dueDate.toISOString().slice(0, 10) : null,
      },
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: background }]}>
          <Text style={[styles.title, { color: text }]}>Edit debt</Text>

          <TextField label="Person" value={personName} onChangeText={setPersonName} />
          <TextField label="Note" value={note} onChangeText={setNote} />
          <DateField label="Due date" value={dueDate} onChange={setDueDate} mode="date" />

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.actionButton} />
            <Button
              label="Save"
              onPress={handleSave}
              disabled={!personName.trim()}
              loading={updateDebt.isPending}
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
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionButton: { flex: 1 },
});
