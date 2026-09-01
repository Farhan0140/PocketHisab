import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/use-theme-color';

/** Standard screen wrapper: safe-area + theme background. Every top-level screen uses this. */
export function ScreenContainer({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const background = useThemeColor({}, 'background');
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.flex, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
