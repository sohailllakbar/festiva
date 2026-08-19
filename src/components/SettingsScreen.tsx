import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { IconButton } from './Button';
import { Text } from './Text';
import { spacing, useThemedStyles, type Palette, useTheme } from '../theme';

/** Shared chrome for settings sub-screens: back, centred title, scrolling body. */
export function SettingsScreen({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} size={22} />
        <Text variant="headlineSm" color={colors.indigo} style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View>
      ) : null}
    </View>
  );
}

export function SettingsSection({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      {title ? (
        <Text variant="labelSm" style={styles.sectionTitle}>
          {title}
        </Text>
      ) : null}
      {children}
      {hint ? (
        <Text variant="labelSm" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, textAlign: 'center' },
  spacer: { width: 44 },
  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, gap: spacing.xl },
  footer: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  section: { gap: spacing.sm },
  sectionTitle: { fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: spacing.xs },
  hint: { paddingHorizontal: spacing.xs, lineHeight: 17 },
});
