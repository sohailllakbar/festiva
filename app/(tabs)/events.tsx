import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import {
  Button,
  Card,
  EmptyState,
  EventCard,
  Fab,
  FilterChips,
  IconButton,
  Text,
  enterAt,
  haptics,
} from '../../src/components';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';
import type { EventCategory } from '../../src/types';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'birthday', label: 'Birthdays' },
  { value: 'anniversary', label: 'Anniversaries' },
  { value: 'wedding', label: 'Weddings' },
  { value: 'family', label: 'Family' },
  { value: 'custom', label: 'Other' },
] as const;

type Filter = (typeof FILTERS)[number]['value'];

/**
 * Personal occasions. These are private account data, so the tone stays warm
 * and the surface never looks like a records table.
 */
export default function Events() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const festiva = useFestiva();
  const [filter, setFilter] = useState<Filter>('all');

  const events = useMemo(() => {
    const list = festiva.upcomingEvents();
    if (filter === 'all') return list;
    return list.filter((e) => e.category === (filter as EventCategory));
  }, [festiva, filter]);

  const hasAny = festiva.events.length > 0;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text variant="headlineLg" color={colors.indigo}>
              Your Events
            </Text>
            <View style={styles.privateRow}>
              <MaterialIcons name="lock" size={12} color={colors.textTertiary} />
              <Text variant="labelSm">Private to your account</Text>
            </View>
          </View>
        </View>

        {hasAny ? (
          <View style={styles.chipRow}>
            <FilterChips
              segments={FILTERS}
              value={filter}
              onChange={(f) => {
                haptics.select();
                setFilter(f);
              }}
            />
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {!hasAny ? (
          <EmptyState
            icon="cake"
            title="Nothing saved yet"
            message="Add the birthdays, anniversaries and moments you never want to forget. We'll count down and remind you."
          >
            <Button label="Add your first event" icon="add" onPress={() => router.push('/event/new')} />
          </EmptyState>
        ) : events.length === 0 ? (
          <EmptyState
            icon="filter-alt-off"
            title="Nothing in this category"
            message="You have events saved, just none of this kind."
            compact
          >
            <Button label="Show all events" variant="secondary" onPress={() => setFilter('all')} />
          </EmptyState>
        ) : (
          <>
            {/* Next up gets a slightly louder treatment */}
            {filter === 'all' && events[0] ? (
              <Card large style={styles.nextCard}>
                <View style={styles.nextHead}>
                  <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
                  <Text variant="labelSm" color={colors.primary} style={styles.nextLabel}>
                    NEXT UP
                  </Text>
                </View>
                <Text variant="headlineMd" color={colors.indigo}>
                  {events[0].name}
                </Text>
                <Text variant="bodyMuted">
                  {festiva.daysFor(events[0].resolvedDate) === 0
                    ? 'Today — don’t forget!'
                    : `In ${festiva.daysFor(events[0].resolvedDate)} days`}
                </Text>
                <Button
                  label="Open"
                  variant="secondary"
                  onPress={() => router.push(`/event/${events[0].id}`)}
                  style={styles.nextAction}
                />
              </Card>
            ) : null}

            <View style={styles.list}>
              {events.map((event, i) => (
                <Animated.View
                  key={event.id}
                  entering={enterAt(Math.min(i, 8))}
                  exiting={FadeOut.duration(180)}
                  layout={LinearTransition.springify().damping(18)}
                >
                  <EventCard
                    event={event}
                    daysUntil={festiva.daysFor(event.resolvedDate)}
                    onPress={() => router.push(`/event/${event.id}`)}
                    onReminder={() => router.push(`/event/${event.id}`)}
                  />
                </Animated.View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Fab label="Add a personal event" onPress={() => router.push('/event/new')} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.lg,
  },
  titleRow: { paddingHorizontal: spacing.screenX },
  titleBlock: { gap: 2 },
  privateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipRow: {},
  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl },
  nextCard: { gap: spacing.xs, marginBottom: spacing.xl, borderColor: colors.primary },
  nextHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nextLabel: { fontWeight: '700', letterSpacing: 0.8 },
  nextAction: { marginTop: spacing.md },
  list: { gap: spacing.md },
});
