import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  BottomSheet,
  Button,
  Card,
  Countdown,
  EmptyState,
  IconBubble,
  IconButton,
  Text,
  haptics,
} from '../../src/components';
import { describeReminder } from '../../src/components/ReminderSheet';
import { formatFullDate, formatTime, nextOccurrence } from '../../src/data/dates';
import { EVENT_META, useEventColor } from '../../src/data/eventMeta';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

export default function EventDetails() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const festiva = useFestiva();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const eventColor = useEventColor();

  const event = festiva.eventById(id);

  if (!event) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} size={22} />
        <EmptyState icon="search-off" title="Occasion not found" message="It may have been deleted.">
          <Button label="Go back" variant="secondary" onPress={() => router.back()} />
        </EmptyState>
      </View>
    );
  }

  const meta = EVENT_META[event.category];
  const tint = eventColor(event.category);
  const resolved = nextOccurrence(event.date, event.recursAnnually);
  const days = festiva.daysFor(resolved);
  const reminderLabel = describeReminder(event.reminder);

  const remove = () => {
    haptics.warn();
    festiva.deleteEvent(event.id);
    setConfirmOpen(false);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.nav, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} size={22} />
        <View style={styles.navSpacer} />
        <IconButton
          icon="edit"
          label="Edit occasion"
          color={colors.primary}
          size={20}
          onPress={() => router.push(`/event/new?id=${event.id}`)}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.hero}>
          <IconBubble icon={meta.icon} size={72} color={tint} background={`${tint}1A`} />
          <Text variant="headlineLg" color={colors.indigo} style={styles.name}>
            {event.name}
          </Text>
          <Text variant="bodyLg" color={colors.textSecondary}>
            {formatFullDate(resolved)}
          </Text>
        </Animated.View>

        {/* Countdown */}
        <View style={styles.countdownWrap}>
          {days === 0 ? (
            <Card large style={styles.todayCard}>
              <MaterialIcons name="celebration" size={26} color={colors.primary} />
              <Text variant="headlineSm" color={colors.primary}>
                It's today!
              </Text>
            </Card>
          ) : (
            <Countdown days={days} tone="light" />
          )}
        </View>

        {/* Facts */}
        <Card large style={styles.factsCard}>
          <Fact icon={meta.icon} label="Category" value={meta.label} />
          <Divider />
          <Fact
            icon="autorenew"
            label="Repeats"
            value={event.recursAnnually ? 'Every year' : 'One time only'}
          />
          <Divider />
          <Fact
            icon={reminderLabel ? 'notifications-active' : 'notifications-off'}
            label="Reminder"
            value={
              reminderLabel && event.reminder
                ? `${reminderLabel} at ${formatTime(event.reminder.time)}`
                : 'No reminder set'
            }
            tint={reminderLabel ? colors.success : undefined}
          />
        </Card>

        {event.notes ? (
          <Card large style={styles.notesCard}>
            <View style={styles.notesHead}>
              <MaterialIcons name="sticky-note-2" size={18} color={colors.textTertiary} />
              <Text variant="labelSm" style={styles.notesLabel}>
                YOUR NOTE
              </Text>
            </View>
            <Text variant="body" color={colors.textSecondary} style={styles.notesBody}>
              {event.notes}
            </Text>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Edit occasion"
            variant="secondary"
            icon="edit"
            onPress={() => router.push(`/event/new?id=${event.id}`)}
          />
          <Button
            label="Delete occasion"
            variant="tertiary"
            icon="delete-outline"
            labelColor={colors.danger}
            onPress={() => setConfirmOpen(true)}
          />
        </View>

        <View style={styles.privacyNote}>
          <MaterialIcons name="lock" size={14} color={colors.textTertiary} />
          <Text variant="labelSm" style={styles.privacyText}>
            Private to your account.
          </Text>
        </View>
      </ScrollView>

      {/* Deletion is permanent, so it asks first. */}
      <BottomSheet visible={confirmOpen} title="Delete this occasion?" onClose={() => setConfirmOpen(false)}>
        <Text variant="bodyMuted" style={styles.confirmBody}>
          "{event.name}" and its reminder will be removed. This can't be undone.
        </Text>
        <View style={styles.confirmActions}>
          <Button label="Delete" variant="destructive" hero onPress={remove} />
          <Button label="Keep it" variant="tertiary" onPress={() => setConfirmOpen(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  tint?: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.factRow}>
      <MaterialIcons name={icon} size={20} color={tint ?? colors.textTertiary} />
      <Text variant="bodyMuted" style={styles.factLabel}>
        {label}
      </Text>
      <Text variant="body" color={tint ?? colors.indigo} style={styles.factValue}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.divider} />;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  navSpacer: { flex: 1 },
  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.lg, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm },
  name: { textAlign: 'center', marginTop: spacing.sm },
  countdownWrap: { alignItems: 'center' },
  todayCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.primary },

  factsCard: { gap: 0 },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  factLabel: { flex: 1 },
  factValue: { fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  notesCard: { gap: spacing.sm },
  notesHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notesLabel: { fontWeight: '700' },
  notesBody: { lineHeight: 26 },

  actions: { gap: spacing.xs },
  privacyNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  privacyText: {},

  confirmBody: { marginBottom: spacing.xl, lineHeight: 24 },
  confirmActions: { gap: spacing.xs },
});
