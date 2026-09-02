/**
 * Resolves a single color token against the user's current theme (mode +
 * accent — see src/theme/ThemeProvider.tsx). `props.light`/`props.dark`
 * still let an individual call override the resolved color for one specific
 * scheme, same as before.
 */

import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ColorTokens } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ColorTokens
) {
  const { colorScheme, colors } = useAppTheme();
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return colors[colorName];
  }
}
