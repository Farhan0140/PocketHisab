import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/auth/AuthProvider';
import { friendlyAuthErrorMessage } from '@/src/utils/firebaseErrors';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'primary');
  const expense = useThemeColor({}, 'expense');
  const income = useThemeColor({}, 'income');

  async function handleSend() {
    setError(null);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(friendlyAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🔑</Text>
          <Text style={[styles.title, { color: text }]}>Reset your password</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            We&apos;ll email you a link to set a new password.
          </Text>
        </View>

        {sent ? (
          <Text style={[styles.success, { color: income }]}>
            Check your inbox — a reset link is on its way to {email}.
          </Text>
        ) : (
          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
            />
            {error ? <Text style={[styles.error, { color: expense }]}>{error}</Text> : null}
            <Button label="Send reset link" onPress={handleSend} loading={isSubmitting} disabled={!email} />
          </View>
        )}

        <Text style={[styles.link, { color: primary }]} onPress={() => router.back()}>
          Back to login
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.lg },
  header: { alignItems: 'center', gap: 4 },
  logo: { fontSize: 44 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  form: { gap: Spacing.md },
  error: { fontSize: 13, textAlign: 'center' },
  success: { fontSize: 15, textAlign: 'center' },
  link: { fontWeight: '700', textAlign: 'center' },
});
