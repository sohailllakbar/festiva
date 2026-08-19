import { useMemo, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  Button,
  Card,
  CategoryPill,
  EmptyState,
  FestivalCard,
  IconButton,
  SectionHeader,
  Text,
  enterAt,
  haptics,
} from '../../src/components';
import { ReminderSheet, describeReminder } from '../../src/components/ReminderSheet';
import { formatFullDate } from '../../src/data/dates';
import { shareFestival } from '../../src/data/share';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme, useCategoryColor } from '../../src/theme';

/**
 * Answers the five questions the spec sets out, in order:
 * WHAT → WHEN → WHERE → HOW LONG → HOW DO I REMEMBER IT.
 */
export default function FestivalDetails() {
  const { colors } = useTheme();
  const categoryColor = useCategoryColor();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const festiva = useFestiva();
  const [sheetOpen, setSheetOpen] = useState(false);

  const festival = festiva.festivalById(id);

  const related = useMemo(() => {
    if (!festival) return [];
    return festiva
      .upcomingFestivals()
      .filter((f) => f.id !== festival.id && f.category === festival.category)
      .slice(0, 4);
  }, [festival, festiva]);

  if (!festival) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} size={22} />
        <EmptyState icon="search-off" title="Festival not found" message="It may have been removed.">
          <Button label="Go back" variant="secondary" onPress={() => router.back()} />
        </EmptyState>
      </View>
    );
  }

  const days = festiva.daysFor(festival.date);
  const favorite = festiva.isFavorite(festival.id);
  const reminder = festiva.reminderFor(festival.id);
  const reminderLabel = describeReminder(reminder);

  const countdownText =
    days === 0 ? 'Today!' : days === 1 ? '1 day to go' : days > 0 ? `${days} days to go` : 'Already passed';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          <ImageBackground
            source={{ uri: festival.image }}
            style={[styles.heroImage, { backgroundColor: categoryColor[festival.category] }]}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(30,27,75,0.55)', 'rgba(30,27,75,0.25)', 'rgba(30,27,75,0.92)']}
              locations={[0, 0.4, 1]}
              style={[styles.scrim, { paddingTop: insets.top + spacing.sm }]}
            >
              <View style={styles.navRow}>
                <IconButton
                  icon="arrow-back"
                  label="Back"
                  color={colors.white}
                  size={22}
                  onPress={() => router.back()}
                />
                <IconButton
                  icon="ios-share"
                  label={`Share ${festival.name}`}
                  color={colors.white}
                  size={20}
                  onPress={() => void shareFestival(festival.name, festival.date)}
                />
              </View>

              <View style={styles.heroBody}>
                <CategoryPill category={festival.category} tone="overlay" />
                <Text variant="display" color={colors.white} style={styles.heroTitle}>
                  {festival.name}
                </Text>
                <Text variant="bodyLg" color="rgba(255,255,255,0.9)">
                  {formatFullDate(festival.date)}
                </Text>

                <View style={styles.countdownBar}>
                  <MaterialIcons name="schedule" size={18} color={colors.white} />
                  <View style={styles.countdownText}>
                    <Text variant="labelSm" color="rgba(255,255,255,0.75)">
                      COUNTDOWN
                    </Text>
                    <Text variant="headlineSm" color={colors.white}>
                      {countdownText}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.content}>
          {/* Favourite and reminder are independent — two separate controls. */}
          <View style={styles.actions}>
            <Button
              label={reminder ? 'Reminder set' : 'Set Reminder'}
              icon={reminder ? 'notifications-active' : 'notifications-none'}
              hero
              style={styles.reminderButton}
              onPress={() => setSheetOpen(true)}
            />
            <IconButton
              icon={favorite ? 'favorite' : 'favorite-border'}
              label={favorite ? 'Remove from favourites' : 'Save to favourites'}
              color={favorite ? colors.primary : colors.indigo}
              size={24}
              chip
              onPress={() => {
                haptics.tap();
                festiva.toggleFavorite(festival.id);
              }}
            />
          </View>

          {reminderLabel ? (
            <Animated.View entering={FadeIn.duration(240)} style={styles.reminderNote}>
              <MaterialIcons name="check-circle" size={16} color={colors.success} />
              <Text variant="label" color={colors.success} style={styles.reminderNoteText}>
                We'll remind you {reminderLabel.toLowerCase()}
              </Text>
            </Animated.View>
          ) : null}

          {/* About */}
          <Card large style={styles.aboutCard}>
            <Text variant="headlineSm" color={colors.indigo}>
              About this festival
            </Text>
            <Text variant="body" color={colors.textSecondary} style={styles.aboutBody}>
              {festival.description}
            </Text>
          </Card>

          {/* At-a-glance facts */}
          <View style={styles.factGrid}>
            <Fact icon="event" label="DATE" value={formatFullDate(festival.date).split(', ').slice(1).join(', ')} />
            <Fact
              icon="autorenew"
              label="FREQUENCY"
              value={festival.dateVaries ? 'Annual · date varies' : 'Annual'}
            />
            <Fact icon="category" label="CATEGORY" value={festival.category} capitalize />
            <Fact icon="public" label="OBSERVED" value={festival.region} />
          </View>

          {festival.dateVaries ? (
            <Card style={styles.varyNote}>
              <MaterialIcons name="info-outline" size={18} color={colors.info} />
              <Text variant="bodyMuted" style={styles.varyText}>
                This festival follows a lunar calendar, so the date shifts each year. We update it
                automatically.
              </Text>
            </Card>
          ) : null}

          {/* Where it's observed */}
          <Card large style={styles.countriesCard}>
            <Text variant="headlineSm" color={colors.indigo} style={styles.countriesTitle}>
              Celebrated in
            </Text>
            {festival.countryCodes[0] === 'GLOBAL' ? (
              <View style={styles.countryRow}>
                <Text style={styles.flag}>🌍</Text>
                <Text variant="body" color={colors.indigo}>
                  Observed around the world
                </Text>
              </View>
            ) : (
              festival.countryCodes.slice(0, 6).map((code) => {
                const country = festiva.countries.find((c) => c.code === code);
                return (
                  <View key={code} style={styles.countryRow}>
                    <Text style={styles.flag}>{country?.flag ?? '🏳️'}</Text>
                    <Text variant="body" color={colors.indigo}>
                      {country?.name ?? code}
                    </Text>
                  </View>
                );
              })
            )}
          </Card>

          {/* Related */}
          {related.length > 0 ? (
            <View style={styles.related}>
              <SectionHeader title="You may also like" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                {related.map((f, i) => (
                  <Animated.View key={f.id} entering={enterAt(i)}>
                    <FestivalCard
                      festival={f}
                      daysUntil={festiva.daysFor(f.date)}
                      isFavorite={festiva.isFavorite(f.id)}
                      hasReminder={!!festiva.reminderFor(f.id)}
                      onPress={() => router.push(`/festival/${f.id}`)}
                      onToggleFavorite={() => festiva.toggleFavorite(f.id)}
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ReminderSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        refId={festival.id}
        occasionName={festival.name}
      />
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
  capitalize,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.fact}>
      <MaterialIcons name={icon} size={18} color={colors.textTertiary} />
      <Text variant="labelSm" style={styles.factLabel}>
        {label}
      </Text>
      <Text variant="body" color={colors.indigo} style={[styles.factValue, capitalize && styles.capitalize]}>
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heroWrap: { overflow: 'hidden' },
  heroImage: { width: '100%', minHeight: 380 },
  scrim: { flex: 1, minHeight: 380, paddingHorizontal: spacing.md, paddingBottom: spacing.xl, justifyContent: 'space-between' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBody: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  heroTitle: { letterSpacing: -1 },
  countdownBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  countdownText: { flex: 1 },

  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, gap: spacing.lg },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderButton: { flex: 1 },
  reminderNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -spacing.sm },
  reminderNoteText: { flex: 1 },

  aboutCard: { gap: spacing.md },
  aboutBody: { lineHeight: 26 },

  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  fact: {
    width: '47.5%',
    flexGrow: 1,
    gap: 4,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  factLabel: { fontWeight: '700', marginTop: 2 },
  factValue: { fontWeight: '600' },
  capitalize: { textTransform: 'capitalize' },

  varyNote: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.infoLight, borderColor: `${colors.info}44` },
  varyText: { flex: 1, lineHeight: 22 },

  countriesCard: { gap: spacing.md },
  countriesTitle: { marginBottom: spacing.xs },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flag: { fontSize: 24 },

  related: { marginTop: spacing.sm },
  rail: { gap: spacing.md, paddingRight: spacing.screenX },
});
