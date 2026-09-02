/**
 * The app's theme context: the user's Day/Night/System mode preference and
 * their chosen accent color theme (Teal, Lemon Green, ...), both persisted
 * to AsyncStorage so they survive an app restart. Every themed component
 * reads colors through `useThemeColor` (hooks/use-theme-color.ts), which
 * pulls from this context — so switching either preference here re-themes
 * the whole app instantly, with nothing else to wire up.
 *
 * "System" mode follows the OS light/dark setting live (via React Native's
 * own useColorScheme); "Light"/"Dark" pin the app to one scheme regardless
 * of the OS setting.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCENT_THEMES, buildColors, DEFAULT_ACCENT_THEME, type AccentThemeId, type ColorTokens } from '@/constants/theme';

export type ColorSchemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEYS = {
  colorSchemePreference: 'pockethisab:color-scheme-preference',
  accentTheme: 'pockethisab:accent-theme',
};

interface AppThemeContextValue {
  /** The RESOLVED scheme actually in effect right now — what every component should render with. */
  colorScheme: 'light' | 'dark';
  colorSchemePreference: ColorSchemePreference;
  setColorSchemePreference: (preference: ColorSchemePreference) => void;
  accentTheme: AccentThemeId;
  setAccentTheme: (accent: AccentThemeId) => void;
  colors: ColorTokens;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [colorSchemePreference, setColorSchemePreferenceState] = useState<ColorSchemePreference>('system');
  const [accentTheme, setAccentThemeState] = useState<AccentThemeId>(DEFAULT_ACCENT_THEME);

  // Load any saved preference once on mount. Until this resolves, the app
  // renders with the defaults above (system scheme, Teal) — a harmless,
  // brief flash rather than blocking the first frame on an AsyncStorage
  // read.
  useEffect(() => {
    (async () => {
      try {
        const [savedScheme, savedAccent] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.colorSchemePreference),
          AsyncStorage.getItem(STORAGE_KEYS.accentTheme),
        ]);
        if (savedScheme === 'light' || savedScheme === 'dark' || savedScheme === 'system') {
          setColorSchemePreferenceState(savedScheme);
        }
        if (savedAccent && savedAccent in ACCENT_THEMES) {
          setAccentThemeState(savedAccent as AccentThemeId);
        }
      } catch {
        // Corrupt or inaccessible storage — keep the in-memory defaults.
      }
    })();
  }, []);

  const setColorSchemePreference = (preference: ColorSchemePreference) => {
    setColorSchemePreferenceState(preference);
    AsyncStorage.setItem(STORAGE_KEYS.colorSchemePreference, preference).catch(() => {});
  };

  const setAccentTheme = (accent: AccentThemeId) => {
    setAccentThemeState(accent);
    AsyncStorage.setItem(STORAGE_KEYS.accentTheme, accent).catch(() => {});
  };

  const colorScheme: 'light' | 'dark' =
    colorSchemePreference === 'system' ? (systemColorScheme ?? 'light') : colorSchemePreference;

  const colors = useMemo(() => buildColors(accentTheme, colorScheme), [accentTheme, colorScheme]);

  const value: AppThemeContextValue = {
    colorScheme,
    colorSchemePreference,
    setColorSchemePreference,
    accentTheme,
    setAccentTheme,
    colors,
  };

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within an AppThemeProvider');
  return ctx;
}
