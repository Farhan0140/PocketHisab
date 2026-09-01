import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { DateField } from '@/src/components/ui/DateField';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { useCreateReminder, useDeleteReminder, useReminders } from '@/src/query/hooks/useReminders';
import { ApiError } from '@/src/api/client';

export function RemindersSection({ debtId, personName }: { debtId: number; personName: string }) {
  const { data: allReminders = [] } = useReminders();
  const reminders = useMemo(() => allReminders.filter((r) => r.debt_id === debtId), [allReminders, debtId]);

  const [isAddVisible, setAddVisible] = useState(false);
  const [remindAt, setRemindAt] = useState<Date | null>(null);
  const [message, setMessage] = useState(`Pay ${personName} back`);

  const createReminder = useCreateReminder();
  const deleteReminder = useDeleteReminder();

  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const background = useThemeColor({}, 'background');
  const expense = useThemeColor({}, 'expense');

  // Not awaited — see AddSpendSheet's handleConfirm for why.
  function handleAdd() {
    if (!remindAt) return;
    createReminder.mutate(
      { debt_id: debtId, remind_at: remindAt.toISOString(), message: message.trim() },
      {
        onError: (error) =>
          Alert.alert('Could not add this reminder', error instanceof ApiError ? error.message : 'Please try again.'),
      }
    );
    setRemindAt(null);
    setAddVisible(false);
  }

  function handleDelete(id: number) {
    Alert.alert('Cancel reminder?', undefined, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteReminder.mutate(id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: textSecondary }]}>Reminders</Text>
        <Text style={[styles.addLink, { color: text }]} onPress={() => setAddVisible(true)}>
          + Add
        </Text>
      </View>

      {reminders.length === 0 ? (
        <Text style={[styles.empty, { color: textSecondary }]}>No reminders set.</Text>
      ) : (
        reminders.map((reminder) => (
          <View key={reminder.id} style={[styles.row, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.rowText}>
              <Text style={[styles.message, { color: text }]}>{reminder.message}</Text>
              <Text style={[styles.time, { color: textSecondary }]}>
                {new Date(reminder.remind_at).toLocaleString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Pressable onPress={() => handleDelete(reminder.id)}>
              <Text style={[styles.remove, { color: expense }]}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}

      <Modal visible={isAddVisible} animationType="slide" transparent onRequestClose={() => setAddVisible(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: background }]}>
            <Text style={[styles.title, { color: text }]}>New reminder</Text>
            <DateField label="Date" value={remindAt} onChange={setRemindAt} mode="date" minimumDate={new Date()} />
            <DateField label="Time" value={remindAt} onChange={setRemindAt} mode="time" />
            <TextField label="Message" value={message} onChangeText={setMessage} />
            <View style={styles.actions}>
              <Button label="Cancel" variant="secondary" onPress={() => setAddVisible(false)} style={styles.actionButton} />
              <Button
                label="Add"
                onPress={handleAdd}
                disabled={!remindAt || !message.trim()}
                loading={createReminder.isPending}
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs, width: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  addLink: { fontSize: 13, fontWeight: '700' },
  empty: { fontSize: 13, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: { gap: 2 },
  message: { fontSize: 14, fontWeight: '600' },
  time: { fontSize: 12 },
  remove: { fontSize: 12, fontWeight: '700' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.sm },
  title: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.xs },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionButton: { flex: 1 },
});
