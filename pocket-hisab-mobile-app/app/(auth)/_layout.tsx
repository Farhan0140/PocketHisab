import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/auth/AuthProvider';

/** If a session already exists, skip straight past the auth screens into the app. */
export default function AuthLayout() {
  const { firebaseUser, isAuthLoading } = useAuth();

  if (!isAuthLoading && firebaseUser) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
