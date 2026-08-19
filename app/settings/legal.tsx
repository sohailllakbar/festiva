import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Card, Text, haptics } from '../../src/components';
import { Logo } from '../../src/components/Logo';
import { SettingsScreen, SettingsSection } from '../../src/components/SettingsScreen';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

/**
 * Plain-language summaries above the formal text. People deserve to understand
 * what happens to their data without reading a contract.
 */
const DOCS = [
  {
    id: 'privacy',
    icon: 'privacy-tip' as const,
    title: 'Privacy Policy',
    summary: 'What we store, and what we never do with it.',
    points: [
      'Your personal occasions — birthdays, anniversaries, notes — are private to your account. We do not share them, sell them, or use them for advertising.',
      'We store your name, email, country, language and interests so the app can show you relevant festivals.',
      'Reminders are scheduled on your device. We do not need to read your calendar or contacts.',
      'You can delete your account at any time from Settings, which removes your data permanently.',
    ],
  },
  {
    id: 'terms',
    icon: 'gavel' as const,
    title: 'Terms & Conditions',
    summary: 'The agreement between you and Festiva.',
    points: [
      'Festiva is provided for personal, non-commercial use.',
      'Festival dates are compiled from public sources and provided in good faith. Dates for lunar and regional calendars can vary — please verify anything time-critical.',
      'You are responsible for the content of your own personal occasions.',
      'We may update these terms; material changes will be surfaced in the app.',
    ],
  },
];

export default function Legal() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <SettingsScreen title="About & Legal">
      {/* About */}
      <Card large style={styles.aboutCard}>
        <View style={styles.logoRing}>
          <Logo size={38} />
        </View>
        <Text variant="headlineMd" color={colors.primary} style={styles.wordmark}>
          Festiva
        </Text>
        <Text variant="bodyMuted" style={styles.tagline}>
          Discover what matters. Remember what matters. Never miss an important occasion.
        </Text>
        <Text variant="labelSm" style={styles.version}>
          Version 1.0.0
        </Text>
      </Card>

      <SettingsSection title="DOCUMENTS">
        <View style={styles.docs}>
          {DOCS.map((doc) => {
            const expanded = open === doc.id;
            return (
              <Animated.View key={doc.id} layout={LinearTransition.springify().damping(18)}>
                <Card large padded={false}>
                  <Pressable
                    onPress={() => {
                      haptics.tap();
                      setOpen(expanded ? null : doc.id);
                    }}
                    style={styles.docHead}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                  >
                    <MaterialIcons name={doc.icon} size={22} color={colors.primary} />
                    <View style={styles.docText}>
                      <Text variant="body" color={colors.indigo} style={styles.docTitle}>
                        {doc.title}
                      </Text>
                      <Text variant="labelSm">{doc.summary}</Text>
                    </View>
                    <MaterialIcons
                      name={expanded ? 'expand-less' : 'expand-more'}
                      size={22}
                      color={colors.textTertiary}
                    />
                  </Pressable>

                  {expanded ? (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.docBody}>
                      {doc.points.map((point, i) => (
                        <View key={i} style={styles.point}>
                          <View style={styles.bullet} />
                          <Text variant="bodyMuted" style={styles.pointText}>
                            {point}
                          </Text>
                        </View>
                      ))}
                    </Animated.View>
                  ) : null}
                </Card>
              </Animated.View>
            );
          })}
        </View>
      </SettingsSection>

      <View style={styles.footer}>
        <MaterialIcons name="favorite" size={14} color={colors.primary} />
        <Text variant="labelSm" style={styles.footerText}>
          Made for people who don't want to forget the moments that matter.
        </Text>
      </View>
    </SettingsScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  aboutCard: { alignItems: 'center', gap: spacing.xs },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  wordmark: { letterSpacing: -0.4 },
  tagline: { textAlign: 'center', lineHeight: 24, marginTop: spacing.xs },
  version: { marginTop: spacing.sm },

  docs: { gap: spacing.md },
  docHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  docText: { flex: 1, gap: 2 },
  docTitle: { fontWeight: '600' },
  docBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  point: { flexDirection: 'row', gap: spacing.md },
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginTop: 9 },
  pointText: { flex: 1, lineHeight: 24 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: spacing.xl },
  footerText: { textAlign: 'center', lineHeight: 18 },
});
