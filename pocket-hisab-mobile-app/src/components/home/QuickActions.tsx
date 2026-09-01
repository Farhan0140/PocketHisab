import { StyleSheet, View } from 'react-native';
import { Button } from '@/src/components/ui/Button';
import { Spacing } from '@/constants/theme';
import type { TransactionType } from '@/src/types/api';

export function QuickActions({ onPress }: { onPress: (type: TransactionType) => void }) {
  return (
    <View style={styles.row}>
      <Button label="+ Add Money" variant="income" onPress={() => onPress('income')} style={styles.button} />
      <Button label="− Spend Money" variant="expense" onPress={() => onPress('expense')} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  button: { flex: 1 },
});
