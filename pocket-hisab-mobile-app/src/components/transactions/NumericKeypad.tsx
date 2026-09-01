import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius } from '@/constants/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'] as const;

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

/** Calculator-style amount entry — see design doc §4.3. */
export function NumericKeypad({ value, onChange, maxLength = 12 }: NumericKeypadProps) {
  const text = useThemeColor({}, 'text');
  const card = useThemeColor({}, 'card');

  function handlePress(key: (typeof KEYS)[number]) {
    Haptics.selectionAsync().catch(() => {});

    if (key === 'backspace') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '.' && value.includes('.')) return; // only one decimal point
    if (value.length >= maxLength) return;
    // Prevent a leading "00" from ever forming (but allow "0." for cents-first entry).
    if (value === '0' && key !== '.') {
      onChange(key);
      return;
    }
    onChange(value + key);
  }

  function handleLongPressBackspace() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    onChange('');
  }

  return (
    <View style={styles.grid}>
      {KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => handlePress(key)}
          onLongPress={key === 'backspace' ? handleLongPressBackspace : undefined}
          style={({ pressed }) => [styles.key, { backgroundColor: pressed ? card : 'transparent' }]}
        >
          {key === 'backspace' ? (
            <Text style={[styles.keyText, { color: text }]}>⌫</Text>
          ) : (
            <Text style={[styles.keyText, { color: text }]}>{key}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  key: {
    width: '33.33%',
    aspectRatio: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  keyText: { fontSize: 26, fontWeight: '600' },
});
