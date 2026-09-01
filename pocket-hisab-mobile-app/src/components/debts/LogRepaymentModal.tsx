import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { useAddRepayment } from '@/src/query/hooks/useDebts';
import { formatCurrency } from '@/src/utils/currency';
import { ApiError } from '@/src/api/client';
import type { Debt } from '@/src/types/api';

export function LogRepaymentModal({
  visible,
  onClose,
  debt,
  currency,
}: {
  visible: boolean;
  onClose: () => void;
  debt: Debt;
  currency: string;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const addRepayment = useAddRepayment();

  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const remaining = Number(debt.remaining_amount);
  const numericAmount = Number(amount) || 0;
  const canSubmit = numericAmount > 0 && numericAmount <= remaining;

  // Not awaited — see AddSpendSheet's handleConfirm for why.
  function handleSubmit() {
    addRepayment.mutate(
      { id: debt.id, input: { amount: numericAmount, note: note.trim() || null } },
      {
        onError: (error) =>
          Alert.alert('Could not log repayment', error instanceof ApiError ? error.message : 'Please try again.'),
      }
    );
    setAmount('');
    setNote('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: background }]}>
          <Text style={[styles.title, { color: text }]}>Log a repayment</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Remaining: {formatCurrency(debt.remaining_amount, currency)}
          </Text>

          <TextField
            label="Amount"
            value={amount}
            onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          {numericAmount > remaining ? (
            <Text style={styles.error}>Can&apos;t exceed the remaining balance.</Text>
          ) : null}

          <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Paid via bKash" />

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.actionButton} />
            <Button
              label="Log repayment"
              onPress={handleSubmit}
              disabled={!canSubmit}
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
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginBottom: Spacing.xs },
  error: { fontSize: 12, color: '#DC2626' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionButton: { flex: 1 },
});
