import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';
import { useAuth } from '@/src/auth/AuthProvider';
import { useUpdateProfile } from '@/src/query/hooks/useProfile';

export default function SettingsScreen() {
  const { profile, firebaseUser, signOut } = useAuth();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(profile?.name ?? '');
  const [currency, setCurrency] = useState(profile?.currency ?? 'BDT');

  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  async function handleSave() {
    try {
      await updateProfile.mutateAsync({
        name: name.trim() || undefined,
        currency: currency.trim() || undefined,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Something went wrong', 'Could not save your changes. Please try again.');
    }
  }

  function handleSignOut() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: text }]}>Settings</Text>

        <Card style={styles.card}>
          <Text style={[styles.email, { color: textSecondary }]}>{firebaseUser?.email}</Text>

          <TextField label="Name" value={name} onChangeText={setName} placeholder="Your name" />
          <TextField
            label="Currency"
            value={currency}
            onChangeText={(value) => setCurrency(value.toUpperCase())}
            placeholder="BDT"
            maxLength={3}
            autoCapitalize="characters"
          />

          <Button label="Save changes" onPress={handleSave} loading={updateProfile.isPending} />
        </Card>

        <Card style={styles.menuCard}>
          <Pressable
            style={styles.menuRow}
            // '/categories' (the categories/index.tsx list screen's real
            // route) isn't in expo-router's generated typed-routes union for
            // this nested-folder index file — a known generator gap, not an
            // invalid route. '/categories/index' looked like the "typed"
            // alternative but is actually WRONG: since categories/[id].tsx
            // also exists, that literal path matches the dynamic route with
            // id="index" instead, producing "Category not found" on entry.
            onPress={() => router.push('/categories' as Href)}
          >
            <Text style={[styles.menuIcon]}>🏷️</Text>
            <Text style={[styles.menuLabel, { color: text }]}>Manage Categories</Text>
            <Text style={[styles.menuChevron, { color: textSecondary }]}>›</Text>
          </Pressable>
        </Card>

        <View style={styles.section}>
          <Button label="Log out" variant="secondary" onPress={handleSignOut} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  title: { fontSize: 24, fontWeight: '800' },
  card: { gap: Spacing.md },
  email: { fontSize: 14 },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  menuChevron: { fontSize: 20 },
  section: { marginTop: Spacing.md },
});
