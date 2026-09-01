import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const expense = useThemeColor({}, 'expense');

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: textSecondary }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={textMuted}
        style={[
          styles.input,
          { backgroundColor: card, borderColor: error ? expense : border, color: text },
          style,
        ]}
        {...inputProps}
      />
      {error ? <Text style={[styles.error, { color: expense }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { fontSize: 12 },
});
