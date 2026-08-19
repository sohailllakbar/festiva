import { ImageBackground, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { Card } from './Card';
import { CategoryPill } from './CategoryPill';
import { PressableScale, haptics } from './motion';
import { radii, shadows, spacing, useCategoryColor, useTheme, useThemedStyles, type Palette } from '../theme';
import type { Festival } from '../types';
import { formatFestivalDate } from '../data/dates';

/**
 * Hero variant — the "what's next" card at the top of Home.
 * Imagery carries the emotion; the gradient scrim keeps type legible over any
 * photograph, which matters for a global catalogue we don't art-direct.
 */
export function FestivalHeroCard({
  festival,
  daysUntil,
  hoursUntil,
  onPress,
  onShare,
}: {
  festival: Festival;
  daysUntil: number;
  hoursUntil?: number;
  onPress?: () => void;
  onShare?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const categoryColor = useCategoryColor();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={festival.name} scaleTo={0.985}>
      {/* Category tint sits under the photo, so a slow or failed image still
          reads as a designed card rather than an empty box. */}
      <View style={[styles.hero, shadows.lift, { backgroundColor: categoryColor[festival.category] }]}>
        <ImageBackground source={{ uri: festival.image }} style={styles.heroImage} resizeMode="cover">
          <LinearGradient
            colors={['rgba(30,27,75,0.15)', 'rgba(30,27,75,0.55)', 'rgba(30,27,75,0.88)']}
            locations={[0, 0.45, 1]}
            style={styles.scrim}
          >
            <View style={styles.heroTop}>
              <CategoryPill category={festival.category} tone="overlay" />
              {onShare ? (
                <PressableScale
                  onPress={() => {
                    haptics.tap();
                    onShare();
                  }}
                  accessibilityLabel={`Share ${festival.name}`}
                  style={styles.shareChip}
                >
                  <MaterialIcons name="ios-share" size={18} color={colors.white} />
                </PressableScale>
              ) : null}
            </View>

            <View style={styles.heroBody}>
              <Text variant="headlineLg" color={colors.white} numberOfLines={2} style={styles.heroTitle}>
                {festival.name}
              </Text>
              <View style={styles.heroDate}>
                <MaterialIcons name="event" size={15} color="rgba(255,255,255,0.85)" />
                <Text variant="body" color="rgba(255,255,255,0.9)">
                  {formatFestivalDate(festival.date)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    </PressableScale>
  );
}

/**
 * Compact variant for horizontal rails and grids. Shows the countdown as a
 * short phrase rather than boxes so many can sit side by side.
 */
export function FestivalCard({
  festival,
  daysUntil,
  isFavorite,
  hasReminder,
  onPress,
  onToggleFavorite,
  width = 240,
}: {
  festival: Festival;
  daysUntil: number;
  isFavorite?: boolean;
  hasReminder?: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  /** Fixed width for horizontal rails; pass '100%' to fill a vertical list. */
  width?: number | '100%';
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const categoryColor = useCategoryColor();
  return (
    <Card onPress={onPress} padded={false} large style={[styles.compact, { width }]}>
      <ImageBackground
        source={{ uri: festival.image }}
        style={[styles.compactImage, { backgroundColor: categoryColor[festival.category] }]}
        resizeMode="cover"
      >
        <View style={styles.compactTop}>
          <CategoryPill category={festival.category} tone="overlay" />
          {onToggleFavorite ? (
            <PressableScale
              onPress={() => {
                haptics.tap();
                onToggleFavorite();
              }}
              accessibilityLabel={
                isFavorite ? `Remove ${festival.name} from favourites` : `Save ${festival.name} to favourites`
              }
              style={styles.favChip}
            >
              <MaterialIcons
                name={isFavorite ? 'favorite' : 'favorite-border'}
                size={17}
                color={isFavorite ? colors.primary : colors.white}
              />
            </PressableScale>
          ) : null}
        </View>
      </ImageBackground>

      <View style={styles.compactBody}>
        <View style={styles.compactTitleRow}>
          <Text variant="headlineSm" color={colors.indigo} numberOfLines={2} style={styles.compactTitle}>
            {festival.name}
          </Text>
          <Text variant="label" color={colors.primary} style={styles.compactDays}>
            {daysUntil === 0 ? 'Today' : `${daysUntil} days`}
          </Text>
        </View>

        <View style={styles.compactMeta}>
          <MaterialIcons name="event" size={13} color={colors.textTertiary} />
          <Text variant="labelSm">{formatFestivalDate(festival.date)}</Text>
          {hasReminder ? (
            <>
              <MaterialIcons name="notifications-active" size={13} color={colors.success} />
              <Text variant="labelSm" color={colors.success}>
                Reminder on
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  hero: { borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.indigo },
  heroImage: { width: '100%', minHeight: 260 },
  scrim: { flex: 1, minHeight: 260, padding: spacing.lg, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  shareChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { gap: spacing.xs },
  heroTitle: { letterSpacing: -0.5 },
  heroDate: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  compact: { overflow: 'hidden' },
  compactImage: { width: '100%', height: 130, justifyContent: 'flex-start' },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  favChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBody: { padding: spacing.lg, gap: spacing.sm },
  compactTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  compactTitle: { flex: 1 },
  compactDays: { textAlign: 'right' },
  compactMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
});
