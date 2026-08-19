import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button, IconButton } from './Button';
import { StepProgress } from './StepProgress';
import { Text } from './Text';
import { spacing, useTheme, useThemedStyles, type Palette } from '../theme';

/** Total steps in the personalization flow — drives every step indicator. */
export const ONBOARDING_STEPS = 7;

/**
 * Shared frame for the personalization flow: back control, stepped progress,
 * a title block, scrollable body, and a pinned primary action so Continue is
 * always reachable without scrolling.
 */
export function OnboardingScreen({
  step,
  title,
  subtitle,
  children,
  primaryLabel = 'Continue',
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  onSkip,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  primaryLabel?: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onSkip?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} size={22} />
        <StepProgress step={step} total={ONBOARDING_STEPS} />
        <View style={styles.skipSlot}>
          {onSkip ? (
            <Button label="Skip" variant="tertiary" block={false} onPress={onSkip} />
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleBlock}>
          <Text variant="headlineLg" color={colors.indigo} style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodyMuted" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {children}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label={primaryLabel} hero disabled={primaryDisabled} onPress={onPrimary} />
        {secondaryLabel ? (
          <Button label={secondaryLabel} variant="tertiary" onPress={onSecondary} />
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  skipSlot: { minWidth: 44, alignItems: 'flex-end' },
  content: { paddingHorizontal: spacing.screenX, paddingBottom: spacing.xxxl },
  titleBlock: { gap: spacing.sm, marginBottom: spacing.xl },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  footer: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
