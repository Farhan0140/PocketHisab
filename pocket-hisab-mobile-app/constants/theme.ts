/**
 * PocketHisab's color system. Banking-app aesthetic: a confident deep-teal
 * primary (trust/money association), plus a fixed income/expense pair used
 * everywhere money direction is shown (balance deltas, transaction rows,
 * charts) so users learn "green = money in, red = money out" once and it
 * never contradicts itself across screens.
 *
 * `income`/`expense`/the debt-status colors are intentionally the SAME value
 * in light and dark mode — green always reads as green. Only neutral surface
 * colors (background/card/border/text) flip between the two palettes.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0F766E'; // teal-700
const tintColorDark = '#2DD4BF'; // teal-400

// Fixed across themes — see file header.
const income = '#16A34A'; // green-600
const expense = '#DC2626'; // red-600
const warning = '#D97706'; // amber-600 (partially_paid / upcoming)

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#5B6572',
    textMuted: '#8A93A0',
    background: '#F7F8FA',
    card: '#FFFFFF',
    border: '#E5E8EC',
    tint: tintColorLight,
    primary: tintColorLight,
    primaryMuted: '#E4F3F1',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    income,
    incomeMuted: '#E7F7EC',
    expense,
    expenseMuted: '#FDEAEA',
    warning,
    warningMuted: '#FDF3E3',
    danger: expense,
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#A7B0BA',
    textMuted: '#727A85',
    background: '#0B0F10',
    card: '#161B1D',
    border: '#242B2E',
    tint: tintColorDark,
    primary: tintColorDark,
    primaryMuted: '#12302C',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    income,
    incomeMuted: '#12301D',
    expense,
    expenseMuted: '#341414',
    warning,
    warningMuted: '#332208',
    danger: expense,
  },
} as const;

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
