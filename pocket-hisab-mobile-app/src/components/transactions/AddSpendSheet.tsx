/**
 * The bottom-sheet modal behind both "+ Add Money" and "− Spend Money" (see
 * design doc §4.3) — same sheet, `type` just changes which mode it opens in.
 * Exposes an imperative `present(type)`/`dismiss()` API via ref so the Home
 * screen's two buttons can trigger it without lifting sheet state up.
 */

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { NumericKeypad } from './NumericKeypad';
import { CategoryPicker } from './CategoryPicker';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/auth/AuthProvider';
import { useBalance } from '@/src/query/hooks/useBalance';
import { useCreateTransaction } from '@/src/query/hooks/useTransactions';
import { formatCurrency } from '@/src/utils/currency';
import { ApiError } from '@/src/api/client';
import type { TransactionType } from '@/src/types/api';

export interface AddSpendSheetHandle {
  present: (type: TransactionType) => void;
  dismiss: () => void;
}

export const AddSpendSheet = forwardRef<AddSpendSheetHandle>(function AddSpendSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const { profile } = useAuth();
  const { data: balance = 0 } = useBalance();
  const createTransaction = useCreateTransaction();

  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const income = useThemeColor({}, 'income');
  const expense = useThemeColor({}, 'expense');

  const currency = profile?.currency ?? 'BDT';
  const numericAmount = Number(amount) || 0;
  const isExpense = type === 'expense';
  const accent = isExpense ? expense : income;
  const newBalance = isExpense ? balance - numericAmount : balance + numericAmount;
  const canSubmit = numericAmount > 0 && (!isExpense || categoryId !== null);

  useImperativeHandle(ref, () => ({
    present: (nextType) => {
      setType(nextType);
      setAmount('');
      setNote('');
      setCategoryId(null);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const snapPoints = useMemo(() => ['92%'], []);

  function handleConfirm() {
    if (!canSubmit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Deliberately NOT awaited: the onMutate optimistic update (see
    // useCreateTransaction) already applied the balance/activity change
    // synchronously, so the sheet can close immediately. With React Query's
    // default networkMode ('online'), a mutation fired while offline stays
    // PAUSED until connectivity returns — awaiting it here would leave the
    // sheet open indefinitely and the Confirm button stuck spinning, which
    // is exactly what looked like "Add/Spend Money doesn't work offline".
    // It resolves/fails on its own once the request actually goes out; a
    // genuine (non-offline) failure is reported via the Alert below.
    createTransaction.mutate(
      {
        type,
        amount: numericAmount,
        category_id: isExpense ? categoryId : null,
        note: note.trim() || null,
      },
      {
        onError: (error) => {
          const message = error instanceof ApiError ? error.message : 'Please try again.';
          Alert.alert('Could not save this transaction', message);
        },
      }
    );
    sheetRef.current?.dismiss();
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: background }}
      handleIndicatorStyle={{ backgroundColor: border }}
      enableDynamicSizing={false}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.header, { color: accent }]}>{isExpense ? 'Spend Money' : 'Add Money'}</Text>

        <View style={styles.amountRow}>
          <Text style={[styles.currencyPrefix, { color: text }]}>{currency}</Text>
          <Text style={[styles.amountText, { color: text }]}>{amount || '0'}</Text>
        </View>

        {isExpense ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: textSecondary }]}>Category</Text>
            <CategoryPicker selectedId={categoryId} onSelect={setCategoryId} />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textSecondary }]}>Note (optional)</Text>
          <BottomSheetTextInput
            value={note}
            onChangeText={setNote}
            placeholder="What's this for?"
            placeholderTextColor={textSecondary}
            style={[styles.noteInput, { backgroundColor: card, borderColor: border, color: text }]}
          />
        </View>

        <NumericKeypad value={amount} onChange={setAmount} />

        <Button
          label={
            numericAmount > 0
              ? `New balance: ${formatCurrency(newBalance, currency)} → Confirm`
              : 'Enter an amount'
          }
          variant={isExpense ? 'expense' : 'income'}
          disabled={!canSubmit}
          onPress={handleConfirm}
          style={styles.confirmButton}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  header: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6 },
  currencyPrefix: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  amountText: { fontSize: 48, fontWeight: '800' },
  section: { gap: Spacing.xs },
  sectionLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  noteInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  confirmButton: { marginTop: Spacing.sm },
});
