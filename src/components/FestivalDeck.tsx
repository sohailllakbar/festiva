import { ImageBackground, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Text } from './Text';
import { useCategoryColor, useTheme, useThemedStyles, radii, spacing, type Palette } from '../theme';
import { formatFestivalDate } from '../data/dates';
import type { Festival } from '../types';

/**
 * A fanned deck of the next few real festivals.
 *
 * The welcome screen's job is to make the product obvious in one glance —
 * "global occasions, counted down" lands faster as three actual cards than as a
 * sentence describing them. Cards are angled so the stack reads as a deck
 * rather than a list, and the rearmost two are dimmed so the eye lands on the
 * front one.
 */
export function FestivalDeck({
  festivals,
  daysFor,
}: {
  festivals: Festival[];
  daysFor: (iso: string) => number;
}) {
  const styles = useThemedStyles(makeStyles);
  const categoryColor = useCategoryColor();
  const { colors } = useTheme();

  // Back to front, so the first festival ends up on top.
  const deck = festivals.slice(0, 3).reverse();

  // Rear cards sit further back, rotated more, and slightly smaller.
  const layout = [
    { rotate: '-7deg', translateX: -20, translateY: 14, scale: 0.9, opacity: 0.55 },
    { rotate: '4deg', translateX: 16, translateY: 7, scale: 0.95, opacity: 0.8 },
    { rotate: '-1.5deg', translateX: 0, translateY: 0, scale: 1, opacity: 1 },
  ];

  return (
    <View style={styles.stage} accessibilityRole="image" accessibilityLabel="A preview of upcoming festivals">
      {deck.map((festival, i) => {
        const pos = layout[layout.length - deck.length + i] ?? layout[2];
        const days = daysFor(festival.date);
        const isFront = i === deck.length - 1;

        return (
          <Animated.View
            key={festival.id}
            entering={FadeIn.delay(240 + i * 110).duration(520)}
            style={[
              styles.card,
              {
                opacity: pos.opacity,
                transform: [
                  { translateX: pos.translateX },
                  { translateY: pos.translateY },
                  { rotate: pos.rotate },
                  { scale: pos.scale },
                ],
              },
            ]}
          >
            <ImageBackground
              source={{ uri: festival.image }}
              // Category tint underneath, so a slow or failed image still reads
              // as a designed card rather than a grey box.
              style={[styles.image, { backgroundColor: categoryColor[festival.category] }]}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(20,14,10,0.05)', 'rgba(20,14,10,0.55)', 'rgba(20,14,10,0.9)']}
                locations={[0, 0.5, 1]}
                style={styles.scrim}
              >
                {isFront ? (
                  <View style={styles.copy}>
                    <Text variant="headlineSm" color="#FFFFFF" numberOfLines={1} style={styles.name}>
                      {festival.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <MaterialIcons name="event" size={13} color="rgba(255,255,255,0.8)" />
                      <Text variant="labelSm" color="rgba(255,255,255,0.85)">
                        {formatFestivalDate(festival.date)}
                      </Text>
                      <View style={styles.dot} />
                      <Text variant="labelSm" color={colors.primary} style={styles.days}>
                        {days === 0 ? 'Today' : `${days} days`}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </LinearGradient>
            </ImageBackground>
          </Animated.View>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    stage: { height: 216, alignItems: 'center', justifyContent: 'center' },
    card: {
      position: 'absolute',
      width: 250,
      height: 186,
      borderRadius: radii.lg,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: colors.surface,
      // Ambient lift — large blur, low opacity, tinted so it never reads grey.
      shadowColor: '#1E1B4B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.16,
      shadowRadius: 22,
      elevation: 8,
    },
    image: { flex: 1 },
    scrim: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg },
    copy: { gap: 4 },
    name: { letterSpacing: -0.2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)' },
    days: { fontWeight: '700' },
  });
