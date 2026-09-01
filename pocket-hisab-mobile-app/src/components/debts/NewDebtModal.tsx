import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';
import { TextField } from '@/src/components/ui/TextField';
import { DateField } from '@/src/components/ui/DateField';
import { Button } from '@/src/components/ui/Button';
import { useCreateDebt } from '@/src/query/hooks/useDebts';
import { useCreateReminder } from '@/src/query/hooks/useReminders';
import { ApiError } from '@/src/api/client';

export function NewDebtModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [remindAt, setRemindAt] = useState<Date | null>(null);

  const createDebt = useCreateDebt();
  const createReminder = useCreateReminder();

  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const canSubmit = personName.trim().length > 0 && Number(amount) > 0;

  function reset() {
    setPersonName('');
    setAmount('');
    setNote('');
    setDueDate(null);
    setReminderEnabled(false);
    setRemindAt(null);
  }

  // Deliberately NOT awaited (see AddSpendSheet's handleConfirm): a mutation
  // fired while offline stays paused until reconnect, so awaiting it here
  // would leave this modal open with no feedback — exactly what looked like
  // "Debts don't work offline". The reminder's debt_id dependency is still
  // respected correctly: it's created inside createDebt's onSuccess, which
  // only fires once the debt actually exists (immediately if online, or
  // after reconnect if it was queued) — never with a made-up id.
  function handleSubmit() {
    if (!canSubmit) return;
    const capturedPersonName = personName.trim();
    const capturedReminderEnabled = reminderEnabled;
    const capturedRemindAt = remindAt;

    createDebt.mutate(
      {
        person_name: capturedPersonName,
        amount: Number(amount),
        note: note.trim() || null,
        due_date: dueDate ? dueDate.toISOString().slice(0, 10) : null,
      },
      {
        onSuccess: ({ data: debt }) => {
          if (capturedReminderEnabled && capturedRemindAt) {
            createReminder.mutate(
              {
                debt_id: debt.id,
                remind_at: capturedRemindAt.toISOString(),
                message: `Pay ${capturedPersonName} back`,
              },
              {
                onError: (error) =>
                  Alert.alert(
                    'Debt saved, but the reminder failed',
                    error instanceof ApiError ? error.message : 'Please add it again from the debt.'
                  ),
              }
            );
          }
        },
        onError: (error) =>
          Alert.alert('Could not create this debt', error instanceof ApiError ? error.message : 'Please try again.'),
      }
    );

    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: text }]}>New Debt</Text>

          <TextField label="Person" value={personName} onChangeText={setPersonName} placeholder="Who do you owe?" />
          <TextField
            label="Amount"
            value={amount}
            onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="What's it for?" />

          <DateField label="Due date (optional)" value={dueDate} onChange={setDueDate} mode="date" />

          <View style={styles.reminderRow}>
            <Text style={[styles.reminderLabel, { color: text }]}>Set a reminder</Text>
            <Switch value={reminderEnabled} onValueChange={setReminderEnabled} disabled={!dueDate} />
          </View>
          {!dueDate ? (
            <Text style={[styles.hint, { color: textSecondary }]}>Set a due date first to enable reminders.</Text>
          ) : null}

          {reminderEnabled && dueDate ? (
            <DateField label="Remind me at" value={remindAt} onChange={setRemindAt} mode="time" />
          ) : null}

          <Button
            label="Create Debt"
            onPress={handleSubmit}
            disabled={!canSubmit || (reminderEnabled && !remindAt)}
            style={styles.submitButton}
          />
          <Button label="Cancel" variant="ghost" onPress={onClose} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.xl },
  title: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.sm },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderLabel: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12, marginTop: -Spacing.sm },
  submitButton: { marginTop: Spacing.sm },
});
