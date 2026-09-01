import { StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const text = useThemeColor({}, 'text');
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.xs },
  icon: { fontSize: 40, marginBottom: Spacing.xs },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 14, textAlign: 'center' },
});
