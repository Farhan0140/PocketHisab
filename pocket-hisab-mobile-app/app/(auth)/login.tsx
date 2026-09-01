import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/src/auth/AuthProvider';
import { friendlyAuthErrorMessage } from '@/src/utils/firebaseErrors';
import { TextField } from '@/src/components/ui/TextField';
import { Button } from '@/src/components/ui/Button';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'primary');
  const expense = useThemeColor({}, 'expense');

  async function handleLogin() {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      // AuthProvider's onAuthStateChanged listener + (auth)/_layout's
      // Redirect handle navigating into the app automatically.
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
          <Text style={styles.logo}>💰</Text>
          <Text style={[styles.title, { color: text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>Log in to PocketHisab</Text>
        </View>

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
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Text style={[styles.forgot, { color: primary }]}>Forgot password?</Text>
          </Link>

          {error ? <Text style={[styles.error, { color: expense }]}>{error}</Text> : null}

          <Button
            label="Log in"
            onPress={handleLogin}
            loading={isSubmitting}
            disabled={!email || !password}
          />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: textSecondary }}>Don&apos;t have an account? </Text>
          <Text style={[styles.link, { color: primary }]} onPress={() => router.push('/(auth)/register')}>
            Sign up
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.lg },
  header: { alignItems: 'center', gap: 4 },
  logo: { fontSize: 44 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 15 },
  form: { gap: Spacing.md },
  forgot: { alignSelf: 'flex-end', fontSize: 13, fontWeight: '600' },
  error: { fontSize: 13, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingTop: Spacing.md },
  link: { fontWeight: '700' },
});
