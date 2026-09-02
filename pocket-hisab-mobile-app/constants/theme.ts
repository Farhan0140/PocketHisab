/**
 * PocketHisab's color system. Two independent choices compose the final
 * palette:
 *   1. Scheme — light or dark (see src/theme/ThemeProvider.tsx for how the
 *      user's Day/Night/System preference resolves to one of these).
 *   2. Accent — which color theme (Teal, Lemon Green, Ocean Blue, ...)
 *      drives buttons, links, the selected tab, the balance card gradient,
 *      etc. See ACCENT_THEMES below.
 *
 * `income`/`expense`/`warning` are DELIBERATELY the same across every
 * accent theme and both schemes — see the design note in the original
 * palette: green always means money in, red always means money out,
 * regardless of which accent color the user picked. Only the neutral
 * surface tokens (background/card/border/text) flip between light and dark;
 * only the accent tokens (primary/primaryMuted/tint) flip between themes.
 */

import { Platform } from 'react-native';

export type AccentThemeId = 'teal' | 'lemonGreen' | 'oceanBlue' | 'sunsetOrange' | 'berryPink';

const NEUTRAL = {
  light: {
    text: '#11181C',
    textSecondary: '#5B6572',
    textMuted: '#8A93A0',
    background: '#F7F8FA',
    card: '#FFFFFF',
    border: '#E5E8EC',
    icon: '#687076',
    tabIconDefault: '#687076',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#A7B0BA',
    textMuted: '#727A85',
    background: '#0B0F10',
    card: '#161B1D',
    border: '#242B2E',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
  },
};

// Fixed across every accent theme and scheme — see file header.
const SEMANTIC = {
  income: '#16A34A', // green-600
  expense: '#DC2626', // red-600
  warning: '#D97706', // amber-600
  light: { incomeMuted: '#E7F7EC', expenseMuted: '#FDEAEA', warningMuted: '#FDF3E3' },
  dark: { incomeMuted: '#12301D', expenseMuted: '#341414', warningMuted: '#332208' },
};

interface AccentDefinition {
  label: string;
  /** The dot shown in the theme picker — always the light-mode primary, so swatches read consistently regardless of the app's current mode. */
  swatch: string;
  light: { primary: string; primaryMuted: string };
  dark: { primary: string; primaryMuted: string };
}

export const ACCENT_THEMES: Record<AccentThemeId, AccentDefinition> = {
  teal: {
    label: 'Teal',
    swatch: '#0F766E',
    light: { primary: '#0F766E', primaryMuted: '#E4F3F1' },
    dark: { primary: '#2DD4BF', primaryMuted: '#12302C' },
  },
  lemonGreen: {
    label: 'Lemon Green',
    swatch: '#65A30D',
    light: { primary: '#65A30D', primaryMuted: '#ECFCCB' },
    dark: { primary: '#A3E635', primaryMuted: '#253C0A' },
  },
  oceanBlue: {
    label: 'Ocean Blue',
    swatch: '#0369A1',
    light: { primary: '#0369A1', primaryMuted: '#E0F2FE' },
    dark: { primary: '#38BDF8', primaryMuted: '#0C2A3B' },
  },
  sunsetOrange: {
    label: 'Sunset Orange',
    swatch: '#C2410C',
    light: { primary: '#C2410C', primaryMuted: '#FFEDD5' },
    dark: { primary: '#FB923C', primaryMuted: '#3B1D0A' },
  },
  berryPink: {
    label: 'Berry Pink',
    swatch: '#A21CAF',
    light: { primary: '#A21CAF', primaryMuted: '#FAE8FF' },
    dark: { primary: '#E879F9', primaryMuted: '#3B0B40' },
  },
};

export const DEFAULT_ACCENT_THEME: AccentThemeId = 'teal';

/** Builds the full color token set for one (accent, scheme) combination. */
export function buildColors(accent: AccentThemeId, scheme: 'light' | 'dark') {
  const accentDef = ACCENT_THEMES[accent][scheme];
  return {
    ...NEUTRAL[scheme],
    tint: accentDef.primary,
    primary: accentDef.primary,
    primaryMuted: accentDef.primaryMuted,
    tabIconSelected: accentDef.primary,
    income: SEMANTIC.income,
    incomeMuted: SEMANTIC[scheme].incomeMuted,
    expense: SEMANTIC.expense,
    expenseMuted: SEMANTIC[scheme].expenseMuted,
    warning: SEMANTIC.warning,
    warningMuted: SEMANTIC[scheme].warningMuted,
    danger: SEMANTIC.expense,
  };
}

/** Static default palette (Teal) — used for type inference and as a safe fallback before the theme preference has loaded. */
export const Colors = {
  light: buildColors(DEFAULT_ACCENT_THEME, 'light'),
  dark: buildColors(DEFAULT_ACCENT_THEME, 'dark'),
};

export type ColorTokens = typeof Colors.light;

// Debt status -> semantic color key (see Colors above). Kept in one place so
// every screen that renders a debt status tag agrees on what each status
// means visually.
export const DebtStatusColor: Record<'pending' | 'partially_paid' | 'paid' | 'overdue', 'primary' | 'warning' | 'income' | 'expense'> = {
  pending: 'primary',
  partially_paid: 'warning',
  paid: 'income',
  overdue: 'expense',
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
