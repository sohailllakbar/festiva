import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from './Text';
import { PressableScale } from './motion';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <Text variant="headlineSm" color={colors.indigo} style={styles.title}>
        {title}
      </Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text variant="label" color={colors.primary} style={styles.action}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Empty states are treated as a designed surface, not an afterthought — the
 * spec asks them to encourage the next action rather than just report absence.
 */
export function EmptyState({
  icon,
  title,
  message,
  children,
  compact,
}: {
  icon: IconName;
  title: string;
  message: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.empty, compact && styles.emptyCompact]}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name={icon} size={28} color={colors.primary} />
      </View>
      <Text variant="headlineSm" color={colors.indigo} style={styles.center}>
        {title}
      </Text>
      <Text variant="bodyMuted" style={styles.center}>
        {message}
      </Text>
      {children ? <View style={styles.emptyAction}>{children}</View> : null}
    </View>
  );
}

/** Large tappable choice used for interests and event categories. */
export function SelectableCard({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: IconName;
  selected?: boolean;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <MaterialIcons name={icon} size={30} color={selected ? colors.primary : colors.indigo} />
      <Text
        variant="label"
        color={selected ? colors.primary : colors.indigo}
        style={styles.choiceLabel}
        numberOfLines={2}
      >
        {label}
      </Text>
      {selected ? (
        <View style={styles.check}>
          <MaterialIcons name="check" size={12} color={colors.white} />
        </View>
      ) : null}
    </PressableScale>
  );
}

/** Skeleton block for loading states. */
export function Skeleton({ height = 16, width = '100%', radius = radii.sm }: {
  height?: number;
  width?: number | `${number}%`;
  radius?: number;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.skeleton, { height, width, borderRadius: radius }]} />;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { flex: 1 },
  action: { fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyCompact: { paddingVertical: spacing.xl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: { textAlign: 'center' },
  emptyAction: { marginTop: spacing.lg, alignSelf: 'stretch' },

  choice: {
    flex: 1,
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  choiceLabel: { textAlign: 'center' },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  skeleton: { backgroundColor: colors.surfaceSunken, opacity: 0.7 },
});
