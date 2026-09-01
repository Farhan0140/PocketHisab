import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius } from '@/constants/theme';

/** Floating "+" action button, bottom-right — used on Debts and Savings tabs. */
export function Fab({ onPress }: { onPress: () => void }) {
  const primary = useThemeColor({}, 'primary');

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.fab, { backgroundColor: primary, opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  plus: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: -2 },
});
