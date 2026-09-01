import { StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DebtStatusColor, Radius } from '@/constants/theme';
import type { DebtStatus } from '@/src/types/api';

const LABELS: Record<DebtStatus, string> = {
  pending: 'Pending',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue',
};

/** Colored status pill. Always trusts the `status` field the backend already computed. */
export function StatusTag({ status }: { status: DebtStatus }) {
  const key = DebtStatusColor[status];
  const color = useThemeColor({}, key);
  const muted = useThemeColor({}, `${key}Muted` as 'primaryMuted' | 'warningMuted' | 'incomeMuted' | 'expenseMuted');

  return (
    <View style={[styles.tag, { backgroundColor: muted }]}>
      <Text style={[styles.text, { color }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});
