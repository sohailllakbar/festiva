import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card, Text, haptics } from '../../src/components';
import { OnboardingScreen } from '../../src/components/OnboardingScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

type PermissionState = 'undetermined' | 'granted' | 'denied';

const BENEFITS = [
  { icon: 'notifications-active' as const, text: 'A nudge before every occasion you care about' },
  { icon: 'cake' as const, text: 'Never miss a birthday or anniversary again' },
  { icon: 'do-not-disturb-on' as const, text: 'Quiet hours respected — nothing at 3am' },
];

/**
 * Reminders are the product's core value, so the ask is framed around what the
 * user gets. If the OS denies it, the screen switches to recovery instructions
 * rather than dead-ending.
 */
export default function NotificationPermissions() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { updatePreferences, askForPermission } = useFestiva();
  const [state, setState] = useState<PermissionState>('undetermined');
  const [asking, setAsking] = useState(false);

  /**
   * Asks iOS for real. A refusal is recorded as a refusal rather than left
   * showing an in-app switch that claims reminders are on — the OS is the
   * authority here, not our preferences object.
   */
  const request = async () => {
    setAsking(true);
    const granted = await askForPermission();
    setAsking(false);

    if (!granted) {
      setState('denied');
      updatePreferences({ notificationsEnabled: false });
      return;
    }

    haptics.confirm();
    setState('granted');
    updatePreferences({ notificationsEnabled: true });
    setTimeout(() => router.replace('/onboarding/complete'), 600);
  };

  const decline = () => {
    setState('denied');
    updatePreferences({ notificationsEnabled: false });
  };

  return (
    <OnboardingScreen
      step={7}
      title="Can we send you reminders?"
      subtitle="This is how Festiva actually helps — without notifications it's just a list of dates."
      onPrimary={state === 'denied' ? () => router.replace('/onboarding/complete') : () => void request()}
      primaryLabel={
        state === 'denied' ? 'Continue without reminders' : asking ? 'Asking…' : 'Turn on reminders'
      }
      primaryDisabled={asking}
      secondaryLabel={state === 'denied' ? undefined : 'Not now'}
      onSecondary={decline}
    >
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="notifications" size={40} color={colors.primary} />
        </View>
      </View>

      <Card style={styles.benefits}>
        {BENEFITS.map((benefit, i) => (
          <View key={benefit.text} style={[styles.benefitRow, i > 0 && styles.benefitSpaced]}>
            <MaterialIcons name={benefit.icon} size={20} color={colors.primary} />
            <Text variant="body" color={colors.indigo} style={styles.benefitText}>
              {benefit.text}
            </Text>
          </View>
        ))}
      </Card>

      {state === 'denied' && (
        <Animated.View entering={FadeIn.duration(280)}>
          <Card style={styles.deniedCard}>
            <View style={styles.deniedHead}>
              <MaterialIcons name="notifications-off" size={20} color={colors.warning} />
              <Text variant="label" color={colors.warning} style={styles.deniedTitle}>
                Reminders are off
              </Text>
            </View>
            <Text variant="bodyMuted" style={styles.deniedBody}>
              You can still browse festivals and save occasions — you just won't be reminded. To turn
              reminders on later, open Settings › Notifications › Festiva and allow notifications.
            </Text>
            <Text
              variant="label"
              color={colors.primary}
              style={styles.deniedLink}
              onPress={() => Linking.openSettings().catch(() => {})}
            >
              Open Settings
            </Text>
          </Card>
        </Animated.View>
      )}
    </OnboardingScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  iconWrap: { alignItems: 'center', marginBottom: spacing.xl },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefits: { gap: 0 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitSpaced: { marginTop: spacing.lg },
  benefitText: { flex: 1 },
  deniedCard: { marginTop: spacing.lg, gap: spacing.sm, backgroundColor: colors.warningLight, borderColor: `${colors.warning}55` },
  deniedHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deniedTitle: { fontWeight: '700' },
  deniedBody: { lineHeight: 22 },
  deniedLink: { fontWeight: '700', marginTop: spacing.xs },
});
