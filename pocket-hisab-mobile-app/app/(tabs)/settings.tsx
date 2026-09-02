import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ACCENT_THEMES, Radius, Spacing, type AccentThemeId } from '@/constants/theme';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';
import { SegmentedControl } from '@/src/components/ui/SegmentedControl';
import { useAuth } from '@/src/auth/AuthProvider';
import { useUpdateProfile } from '@/src/query/hooks/useProfile';
import { useAppTheme, type ColorSchemePreference } from '@/src/theme/ThemeProvider';

export default function SettingsScreen() {
  const { profile, firebaseUser, signOut } = useAuth();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(profile?.name ?? '');
  const [currency, setCurrency] = useState(profile?.currency ?? 'BDT');

  const { colorSchemePreference, setColorSchemePreference, accentTheme, setAccentTheme } = useAppTheme();

  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Not awaited — see AddSpendSheet's handleConfirm for why: with the
  // default networkMode, mutate() stays PAUSED while offline rather than
  // resolving or rejecting, so awaiting it here left "Save changes" stuck
  // spinning forever with no feedback. onSuccess/onError still fire
  // correctly whenever the write actually completes (now, or on reconnect).
  function handleSave() {
    updateProfile.mutate(
      {
        name: name.trim() || undefined,
        currency: currency.trim() || undefined,
      },
      {
        onSuccess: () => Alert.alert('Saved', 'Your profile has been updated.'),
        onError: () => Alert.alert('Something went wrong', 'Could not save your changes. Please try again.'),
      }
    );
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

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: text }]}>Appearance</Text>

          <View style={styles.appearanceRow}>
            <Text style={[styles.appearanceLabel, { color: textSecondary }]}>Mode</Text>
            <SegmentedControl<ColorSchemePreference>
              value={colorSchemePreference}
              onChange={setColorSchemePreference}
              options={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
                { label: 'System', value: 'system' },
              ]}
            />
          </View>

          <View style={styles.appearanceRow}>
            <Text style={[styles.appearanceLabel, { color: textSecondary }]}>Color theme</Text>
            <View style={styles.swatchRow}>
              {(Object.entries(ACCENT_THEMES) as [AccentThemeId, (typeof ACCENT_THEMES)[AccentThemeId]][]).map(
                ([id, theme]) => {
                  const selected = accentTheme === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setAccentTheme(id)}
                      accessibilityLabel={theme.label}
                      style={styles.swatchWrap}
                    >
                      <View
                        style={[
                          styles.swatch,
                          { backgroundColor: theme.swatch },
                          selected && [styles.swatchSelected, { borderColor: text }],
                        ]}
                      >
                        {selected ? <Text style={styles.swatchCheck}>✓</Text> : null}
                      </View>
                      <Text style={[styles.swatchLabel, { color: textSecondary }]} numberOfLines={1}>
                        {theme.label}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>
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
  cardTitle: { fontSize: 16, fontWeight: '700' },
  email: { fontSize: 14 },
  appearanceRow: { gap: Spacing.sm },
  appearanceLabel: { fontSize: 13, fontWeight: '600' },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  swatchWrap: { alignItems: 'center', gap: 4, width: 64 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderWidth: 3 },
  swatchCheck: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  swatchLabel: { fontSize: 11, textAlign: 'center' },
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
