import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { IconButton } from './Button';
import { Card } from './Card';
import { Text } from './Text';
import { radii, spacing, useTheme, useThemedStyles, type Palette } from '../theme';

/**
 * Shared chrome for every auth screen so the module reads as one continuous
 * experience: back control, centred white card, title/subtitle, and a slot for
 * a form-level error banner.
 */
export function AuthScreen({
  title,
  subtitle,
  error,
  children,
  footer,
  showBack = true,
}: {
  title: string;
  subtitle?: string;
  /** Form-level failure (bad credentials, network) — field errors live inline. */
  error?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBack?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.nav, { paddingTop: insets.top + spacing.sm }]}>
        {showBack ? (
          <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} size={22} />
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card large style={styles.card}>
          <View style={styles.header}>
            <Text variant="headlineLg" color={colors.indigo} style={styles.title}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="bodyMuted" style={styles.subtitle}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          {error ? (
            <Animated.View entering={FadeIn.duration(220)} style={styles.error}>
              <MaterialIcons name="error-outline" size={18} color={colors.danger} />
              <Text variant="label" color={colors.danger} style={styles.errorText}>
                {error}
              </Text>
            </Animated.View>
          ) : null}

          <View style={styles.form}>{children}</View>
        </Card>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  nav: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, minHeight: 52 },
  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.sm, flexGrow: 1, justifyContent: 'center' },
  card: { padding: spacing.xxl, gap: spacing.xl },
  header: { gap: spacing.sm },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  errorText: { flex: 1 },
  form: { gap: spacing.lg },
  footer: { marginTop: spacing.xl, alignItems: 'center' },
});
