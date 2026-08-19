import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from './motion';
import { radii, spacing, useThemedStyles, type Palette } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** 16px radius for large containers; 8px is the component default. */
  large?: boolean;
  /** Drops the hairline border for cards sitting on a tinted surface. */
  borderless?: boolean;
}

/**
 * Depth here is a tonal shift plus a hairline border — pure white against the
 * warm tinted background — rather than a shadow. Shadows are reserved for
 * genuinely floating elements.
 */
export function Card({ children, onPress, style, padded = true, large, borderless }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  const content = (
    <View
      style={[
        styles.card,
        { borderRadius: large ? radii.lg : radii.sm },
        !borderless && styles.bordered,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return <PressableScale onPress={onPress}>{content}</PressableScale>;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  card: { backgroundColor: colors.surface, overflow: 'hidden' },
  bordered: { borderWidth: 1, borderColor: colors.border },
  padded: { padding: spacing.lg },
});
