import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { typography, useTheme, variantColorRole, type TypographyVariant } from '../theme';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
}

/**
 * Picks a step off the type scale by name, and resolves its colour from the
 * active palette so text follows the theme without every caller passing one.
 * An explicit `color` still wins.
 */
export function Text({ variant = 'body', color, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const resolved = color ?? colors[variantColorRole[variant]];

  return <RNText style={[typography[variant], { color: resolved }, style]} {...rest} />;
}
