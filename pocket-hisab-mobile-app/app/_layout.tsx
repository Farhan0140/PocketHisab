import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import 'react-native-reanimated';

import { QueryProvider } from '@/src/query/QueryProvider';
import { AuthProvider } from '@/src/auth/AuthProvider';
import { AppThemeProvider, useAppTheme } from '@/src/theme/ThemeProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    // QueryProvider wraps AuthProvider because AuthProvider's profile fetch
    // uses useQuery — see src/auth/AuthProvider.tsx. AppThemeProvider must
    // be a separate component boundary from whatever reads useAppTheme()
    // (RootLayoutContent below), since a provider's own component can't
    // consume the context it provides.
    <QueryProvider>
      <AuthProvider>
        <AppThemeProvider>
          <RootLayoutContent />
        </AppThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

function RootLayoutContent() {
  const { colorScheme } = useAppTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          {/* Explicit (not "auto") so a pinned Light/Dark preference always
              matches the status bar icon color, even when it differs from
              the OS's own current scheme. */}
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
