import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  Button,
  Card,
  DateTimeField,
  IconButton,
  Text,
  ToggleRow,
  haptics,
} from '../../src/components';
import { formatTime } from '../../src/data/dates';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';
import type { ReminderOffset } from '../../src/types';

const OFFSETS: { value: ReminderOffset; label: string }[] = [
  { value: 30, label: '30 days' },
  { value: 14, label: '2 weeks' },
  { value: 7, label: '1 week' },
  { value: 1, label: '1 day' },
  { value: 0, label: 'Same day' },
];

/**
 * Reminder preferences. Everything here sets *defaults* — individual occasions
 * can always override, which the copy makes explicit so nothing feels locked.
 */
export default function ReminderPreferences() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { preferences, updatePreferences, permissionGranted, askForPermission, refreshPermission } =
    useFestiva();

  // The OS can revoke permission while the app is backgrounded, so re-check on
  // entry rather than trusting what we last stored.
  useEffect(() => {
    void refreshPermission();
  }, [refreshPermission]);

  const [quietFrom, setQuietFrom] = useState(() => toDate(preferences.quietFrom));
  const [quietTo, setQuietTo] = useState(() => toDate(preferences.quietTo));
  const [defaultTime, setDefaultTime] = useState(() => toDate(preferences.defaultTime));

  // Both have to be true for anything to be delivered, so the switch reflects
  // both rather than letting the app claim reminders are on while iOS blocks them.
  const master = preferences.notificationsEnabled && permissionGranted;

  const setMaster = async (on: boolean) => {
    if (!on) {
      updatePreferences({ notificationsEnabled: false });
      return;
    }
    if (!permissionGranted && !(await askForPermission())) {
      // iOS refused and won't ask again — Settings is the only route back.
      Linking.openSettings().catch(() => {});
      return;
    }
    updatePreferences({ notificationsEnabled: true });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} size={22} />
        <Text variant="headlineSm" color={colors.indigo} style={styles.navTitle}>
          Reminders
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Card large>
          <ToggleRow
            label="Allow reminders"
            description="The master switch. Turning this off silences everything."
            icon="notifications-active"
            value={master}
            onChange={(v) => void setMaster(v)}
          />
        </Card>

        {!master ? (
          <Animated.View entering={FadeIn.duration(240)}>
            <Card style={styles.offCard}>
              <MaterialIcons name="info-outline" size={20} color={colors.warning} />
              <View style={styles.offText}>
                <Text variant="bodyMuted" style={styles.offBody}>
                  {!permissionGranted
                    ? 'iOS is blocking notifications for Festiva, so reminders can’t be delivered. Allow them in Settings to switch reminders back on.'
                    : 'With reminders off, Festiva still tracks your occasions and countdowns — you just won’t be notified.'}
                </Text>
                <Pressable onPress={() => Linking.openSettings().catch(() => {})} hitSlop={8}>
                  <Text variant="label" color={colors.primary} style={styles.offLink}>
                    Open iOS Settings
                  </Text>
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        ) : (
          <>
            <Section title="WHAT TO REMIND ME ABOUT">
              <Card large>
                <ToggleRow
                  label="Festivals & holidays"
                  description="Occasions you've saved to favourites."
                  icon="celebration"
                  value={preferences.festivalReminders}
                  onChange={(v) => updatePreferences({ festivalReminders: v })}
                />
                <View style={styles.divider} />
                <ToggleRow
                  label="Personal occasions"
                  description="Birthdays, anniversaries and your own events."
                  icon="cake"
                  value={preferences.eventReminders}
                  onChange={(v) => updatePreferences({ eventReminders: v })}
                />
              </Card>
            </Section>

            <Section title="DEFAULT TIMING">
              <Text variant="bodyMuted" style={styles.sectionHint}>
                Applied to new occasions. You can set a different reminder on any single one.
              </Text>
              <View style={styles.offsets}>
                {OFFSETS.map((option) => {
                  const active = option.value === preferences.defaultOffset;
                  return (
                    <Pressable
                      key={String(option.value)}
                      onPress={() => {
                        haptics.select();
                        updatePreferences({ defaultOffset: option.value });
                      }}
                      style={[styles.offset, active && styles.offsetActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        variant="label"
                        color={active ? colors.white : colors.indigo}
                        style={styles.offsetLabel}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.field}>
                <DateTimeField
                  label="Notify me at"
                  value={defaultTime}
                  mode="time"
                  onChange={(d) => {
                    setDefaultTime(d);
                    updatePreferences({ defaultTime: fromDate(d) });
                  }}
                />
              </View>
            </Section>

            <Section title="QUIET HOURS">
              <Card large>
                <ToggleRow
                  label="Don't disturb me overnight"
                  description={
                    preferences.quietHoursEnabled
                      ? `Reminders held between ${formatTime(preferences.quietFrom)} and ${formatTime(preferences.quietTo)}.`
                      : 'Reminders can arrive at any hour.'
                  }
                  icon="bedtime"
                  value={preferences.quietHoursEnabled}
                  onChange={(v) => updatePreferences({ quietHoursEnabled: v })}
                />

                {preferences.quietHoursEnabled ? (
                  <Animated.View entering={FadeIn.duration(220)}>
                    <View style={styles.divider} />
                    <View style={styles.quietRow}>
                      <View style={styles.quietField}>
                        <DateTimeField
                          label="From"
                          value={quietFrom}
                          mode="time"
                          onChange={(d) => {
                            setQuietFrom(d);
                            updatePreferences({ quietFrom: fromDate(d) });
                          }}
                        />
                      </View>
                      <View style={styles.quietField}>
                        <DateTimeField
                          label="Until"
                          value={quietTo}
                          mode="time"
                          onChange={(d) => {
                            setQuietTo(d);
                            updatePreferences({ quietTo: fromDate(d) });
                          }}
                        />
                      </View>
                    </View>
                    <Text variant="labelSm" style={styles.quietNote}>
                      Anything due during quiet hours arrives right after they end.
                    </Text>
                  </Animated.View>
                ) : null}
              </Card>
            </Section>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Text variant="labelSm" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function toDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function fromDate(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
  navTitle: { flex: 1, textAlign: 'center' },
  navSpacer: { width: 44 },
  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, gap: spacing.xl },

  offCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.warningLight, borderColor: `${colors.warning}55` },
  offText: { flex: 1, gap: spacing.sm },
  offBody: { lineHeight: 22 },
  offLink: { fontWeight: '700' },

  section: { gap: spacing.sm },
  sectionTitle: { fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: spacing.xs },
  sectionHint: { marginBottom: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },

  offsets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  offset: {
    paddingHorizontal: spacing.lg,
    height: 42,
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  offsetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  offsetLabel: { fontWeight: '600' },
  field: { marginTop: spacing.lg },

  quietRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  quietField: { flex: 1 },
  quietNote: { marginTop: spacing.md, lineHeight: 17 },
});
