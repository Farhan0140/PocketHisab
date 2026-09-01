import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { Chip } from '@/src/components/ui/Chip';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { useAddSavingsEntry } from '@/src/query/hooks/useSavingsPots';
import { formatCurrency } from '@/src/utils/currency';
import { ApiError } from '@/src/api/client';
import type { SavingsEntryType, SavingsPot } from '@/src/types/api';

export function AddEntryModal({
  visible,
  onClose,
  pot,
  currency,
}: {
  visible: boolean;
  onClose: () => void;
  pot: SavingsPot;
  currency: string;
}) {
  const [type, setType] = useState<SavingsEntryType>('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const addEntry = useAddSavingsEntry();

  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const currentAmount = Number(pot.current_amount);
  const numericAmount = Number(amount) || 0;
  const isWithdrawal = type === 'withdrawal';
  const canSubmit = numericAmount > 0 && (!isWithdrawal || numericAmount <= currentAmount);

  // Not awaited — see AddSpendSheet's handleConfirm for why.
  function handleSubmit() {
    addEntry.mutate(
      { id: pot.id, input: { type, amount: numericAmount, note: note.trim() || null } },
      {
        onError: (error) =>
          Alert.alert('Could not save this entry', error instanceof ApiError ? error.message : 'Please try again.'),
      }
    );
    setAmount('');
    setNote('');
    setType('deposit');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: background }]}>
          <Text style={[styles.title, { color: text }]}>Add to {pot.title}</Text>

          <View style={styles.typeRow}>
            <Chip label="Deposit" selected={type === 'deposit'} onPress={() => setType('deposit')} />
            <Chip label="Withdrawal" selected={type === 'withdrawal'} onPress={() => setType('withdrawal')} />
          </View>

          <TextField
            label="Amount"
            value={amount}
            onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          {isWithdrawal ? (
            <Text style={[styles.hint, { color: textSecondary }]}>
              Available: {formatCurrency(pot.current_amount, currency)}
            </Text>
          ) : null}
          {isWithdrawal && numericAmount > currentAmount ? (
            <Text style={styles.error}>Can&apos;t exceed the pot&apos;s current balance.</Text>
          ) : null}

          <TextField label="Note (optional)" value={note} onChangeText={setNote} />

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.actionButton} />
            <Button
              label="Save"
              variant={isWithdrawal ? 'expense' : 'income'}
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
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  hint: { fontSize: 12 },
  error: { fontSize: 12, color: '#DC2626' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionButton: { flex: 1 },
});
