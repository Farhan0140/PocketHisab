import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';

/** The "passbook" rounded-card-with-soft-shadow surface used throughout the app. */
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const background = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  return <View style={[styles.card, { backgroundColor: background, borderColor: border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
});
