import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from './Text';
import { Card } from './Card';
import { IconButton } from './Button';
import { relativeDays } from './Countdown';
import { nextOccurrence, parseISODate } from '../data/dates';
import { radii, spacing, useTheme, useThemedStyles, type Palette } from '../theme';
import type { PersonalEvent } from '../types';
import { EVENT_META } from '../data/eventMeta';

/**
 * Personal events are private and emotional, so this card stays warm and plain:
 * a calendar chip, the name, and how soon it is. No admin-style metadata.
 */
export function EventCard({
  event,
  daysUntil,
  onPress,
  onReminder,
}: {
  event: PersonalEvent;
  daysUntil: number;
  onPress?: () => void;
  onReminder?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const meta = EVENT_META[event.category];
  // Parsed via the local-midnight helper, not `new Date(iso)` — the latter
  // reads a bare date as UTC, so anyone west of Greenwich saw the day before.
  // Shows the next occurrence so the chip agrees with the countdown beside it.
  const date = parseISODate(nextOccurrence(event.date, event.recursAnnually));

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.dateChip}>
          <Text variant="labelSm" color={colors.primary} style={styles.month}>
            {date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
          </Text>
          <Text variant="headlineSm" color={colors.indigo} style={styles.day}>
            {date.getDate()}
          </Text>
        </View>

        <View style={styles.body}>
          <Text variant="body" color={colors.indigo} numberOfLines={1} style={styles.name}>
            {event.name}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="labelSm">{relativeDays(daysUntil)}</Text>
            {event.recursAnnually ? (
              <>
                <Text variant="labelSm">·</Text>
                <MaterialIcons name="autorenew" size={12} color={colors.textTertiary} />
                <Text variant="labelSm">Every year</Text>
              </>
            ) : null}
          </View>
        </View>

        <IconButton
          icon={event.reminder ? 'notifications-active' : meta.icon}
          label={event.reminder ? `Reminder set for ${event.name}` : `Set a reminder for ${event.name}`}
          color={event.reminder ? colors.success : colors.info}
          size={18}
          chip
          onPress={onReminder}
        />
      </View>
    </Card>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateChip: {
    width: 54,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  month: { letterSpacing: 0.6 },
  day: { marginTop: -2 },
  body: { flex: 1, gap: 2 },
  name: { fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
});
