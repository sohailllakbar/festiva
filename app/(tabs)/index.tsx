import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  Card,
  Countdown,
  EventCard,
  Fab,
  FestivalCard,
  FestivalHeroCard,
  IconButton,
  SectionHeader,
  Text,
  enterAt,
} from '../../src/components';
import { Logo } from '../../src/components/Logo';
import { greetingForHour } from '../../src/data/dates';
import { shareFestival } from '../../src/data/share';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

/**
 * Home answers one question within seconds: "what's coming up that I should
 * remember?" Everything is ordered by urgency — the single next occasion gets
 * the hero, then today, then personal events, then the wider rail.
 */
export default function Home() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const festiva = useFestiva();
  const { profile, unreadCount } = festiva;

  // Personalized, not the raw catalogue — this is what onboarding promised
  // when it asked which kinds of occasion matter to them.
  const upcomingFestivals = useMemo(() => festiva.personalizedFestivals(), [festiva]);
  const upcomingEvents = useMemo(() => festiva.upcomingEvents(), [festiva]);

  // Prefer a saved festival for the hero — it's what they told us they care about.
  const hero = useMemo(() => {
    const saved = upcomingFestivals.find((f) => festiva.isFavorite(f.id));
    return saved ?? upcomingFestivals[0];
  }, [upcomingFestivals, festiva]);

  const todayItems = useMemo(() => {
    const festivalsToday = upcomingFestivals.filter((f) => festiva.daysFor(f.date) === 0);
    const eventsToday = upcomingEvents.filter((e) => festiva.daysFor(e.resolvedDate) === 0);
    return { festivalsToday, eventsToday };
  }, [upcomingFestivals, upcomingEvents, festiva]);

  const hasToday = todayItems.festivalsToday.length > 0 || todayItems.eventsToday.length > 0;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.avatar}>
          <Logo size={26} />
        </View>

        <View style={styles.greeting}>
          <Text variant="labelSm">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text variant="headlineSm" color={colors.indigo} numberOfLines={1}>
            {/* Guests never gave us a name, so don't invent one for them. */}
            {profile.name ? `${greetingForHour()}, ${profile.name}` : greetingForHour()}
          </Text>
        </View>

        <View>
          <IconButton
            icon="notifications-none"
            label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            chip
            onPress={() => router.push('/notifications')}
          />
          {unreadCount > 0 ? (
            <View style={styles.badge} pointerEvents="none">
              <Text variant="labelSm" color={colors.white} style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* The next thing to remember */}
        {hero ? (
          <Animated.View entering={enterAt(0)}>
            <FestivalHeroCard
              festival={hero}
              daysUntil={festiva.daysFor(hero.date)}
              onPress={() => router.push(`/festival/${hero.id}`)}
              onShare={() => void shareFestival(hero.name, hero.date)}
            />

            <View style={styles.heroFooter}>
              <Countdown
                days={festiva.daysFor(hero.date)}
                hours={festiva.hoursFor(hero.date)}
                tone="light"
              />
              <Pressable
                onPress={() => router.push(`/festival/${hero.id}`)}
                style={styles.detailsButton}
                accessibilityRole="button"
                accessibilityLabel={`View details for ${hero.name}`}
              >
                <Text variant="button" color={colors.white}>
                  View Details
                </Text>
                <MaterialIcons name="arrow-forward" size={18} color={colors.white} />
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* Today */}
        <View style={styles.section}>
          <SectionHeader title="Today" />
          {hasToday ? (
            <View style={styles.stack}>
              {todayItems.festivalsToday.map((f) => (
                <FestivalCard
                  key={f.id}
                  festival={f}
                  daysUntil={0}
                  isFavorite={festiva.isFavorite(f.id)}
                  hasReminder={!!festiva.reminderFor(f.id)}
                  width="100%"
                  onPress={() => router.push(`/festival/${f.id}`)}
                  onToggleFavorite={() => festiva.toggleFavorite(f.id)}
                />
              ))}
              {todayItems.eventsToday.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  daysUntil={0}
                  onPress={() => router.push(`/event/${e.id}`)}
                />
              ))}
            </View>
          ) : (
            <Card style={styles.quietCard}>
              <View style={styles.quietIcon}>
                <MaterialIcons name="local-cafe" size={22} color={colors.indigo} />
              </View>
              <Text variant="headlineSm" color={colors.indigo} style={styles.quietTitle}>
                Nothing special today
              </Text>
              <Text variant="bodyMuted" style={styles.quietBody}>
                Take a moment to relax and enjoy the quiet.
              </Text>
            </Card>
          )}
        </View>

        {/* Personal events */}
        <View style={styles.section}>
          <SectionHeader
            title="Your Events"
            actionLabel="View All"
            onAction={() => router.push('/(tabs)/events')}
          />
          {upcomingEvents.length === 0 ? (
            <Card style={styles.emptyInline}>
              <MaterialIcons name="cake" size={20} color={colors.textTertiary} />
              <Text variant="bodyMuted" style={styles.emptyInlineText}>
                Add a birthday or anniversary and we'll remind you.
              </Text>
            </Card>
          ) : (
            <View style={styles.stack}>
              {upcomingEvents.slice(0, 3).map((event, i) => (
                <Animated.View key={event.id} entering={enterAt(i + 1)}>
                  <EventCard
                    event={event}
                    daysUntil={festiva.daysFor(event.resolvedDate)}
                    onPress={() => router.push(`/event/${event.id}`)}
                    onReminder={() => router.push(`/event/${event.id}`)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        {/* Wider catalogue */}
        <View style={styles.section}>
          <SectionHeader
            title="Upcoming Festivals"
            actionLabel="Explore"
            onAction={() => router.push('/(tabs)/discover')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            {upcomingFestivals.slice(0, 6).map((festival, i) => (
              <Animated.View key={festival.id} entering={FadeIn.delay(i * 60).duration(300)}>
                <FestivalCard
                  festival={festival}
                  daysUntil={festiva.daysFor(festival.date)}
                  isFavorite={festiva.isFavorite(festival.id)}
                  hasReminder={!!festiva.reminderFor(festival.id)}
                  onPress={() => router.push(`/festival/${festival.id}`)}
                  onToggleFavorite={() => festiva.toggleFavorite(festival.id)}
                />
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <Fab label="Add a personal event" onPress={() => router.push('/event/new')} />
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
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { flex: 1, gap: 1 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { fontSize: 10, lineHeight: 14 },

  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl },

  heroFooter: {
    marginTop: -spacing.xl,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
  },

  section: { marginTop: spacing.section },
  stack: { gap: spacing.md },
  rail: { gap: spacing.md, paddingRight: spacing.screenX },

  quietCard: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
  quietIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quietTitle: { textAlign: 'center' },
  quietBody: { textAlign: 'center' },

  emptyInline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emptyInlineText: { flex: 1 },
});
