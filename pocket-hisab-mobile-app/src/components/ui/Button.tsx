import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'income' | 'expense' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style, icon }: ButtonProps) {
  const primary = useThemeColor({}, 'primary');
  const income = useThemeColor({}, 'income');
  const expense = useThemeColor({}, 'expense');
  const border = useThemeColor({}, 'border');
  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');

  const backgrounds: Record<Variant, string> = {
    primary,
    income,
    expense,
    secondary: card,
    ghost: 'transparent',
  };
  const textColors: Record<Variant, string> = {
    primary: '#FFFFFF',
    income: '#FFFFFF',
    expense: '#FFFFFF',
    secondary: text,
    ghost: primary,
  };

  const isOutlined = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgrounds[variant],
          borderColor: isOutlined ? border : 'transparent',
          borderWidth: isOutlined ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: textColors[variant] }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
