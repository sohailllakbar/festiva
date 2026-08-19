import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Button, Card, EmptyState, Text, haptics } from '../../src/components';
import { SettingsScreen, SettingsSection } from '../../src/components/SettingsScreen';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

const FAQS = [
  {
    q: 'Why is a festival date different from what I expected?',
    a: 'Some festivals follow lunar or regional calendars, so the date shifts each year and can vary between countries. Those are marked "date varies" on the festival page, and we update them automatically.',
  },
  {
    q: "What's the difference between a favourite and a reminder?",
    a: "They're separate on purpose. Favouriting saves a festival to your collection. A reminder is a notification before it happens. You can do either, or both — a favourite won't notify you unless you set a reminder.",
  },
  {
    q: "I'm not receiving notifications.",
    a: 'Check three things: reminders are on in Festiva (Settings › Reminders), notifications are allowed for Festiva in iOS Settings, and the occasion actually has a reminder set. Quiet hours can also delay a reminder until morning.',
  },
  {
    q: 'Can other people see my personal events?',
    a: "No. Birthdays, anniversaries and anything you add yourself are private to your account. They're never shared and never appear to anyone else.",
  },
  {
    q: 'Can I use Festiva in another language?',
    a: 'Yes — set your language in Settings › Personalization. Festival names appear in your chosen language where a translation exists.',
  },
  {
    q: 'How do I stop an annual event from repeating?',
    a: 'Open the occasion, tap Edit, and turn off "Repeats every year". It will stay in your list for this year only.',
  },
];

/** Searchable FAQ with accordion answers, plus a way to reach a human. */
export default function Help() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <SettingsScreen title="Help & FAQ">
      <View style={styles.search}>
        <MaterialIcons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search help"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="none"
          accessibilityLabel="Search help articles"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
            <MaterialIcons name="close" size={18} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      {results.length === 0 ? (
        <EmptyState
          icon="search-off"
          title="No answers found"
          message={`Nothing matches "${query}". Try different words, or contact us below.`}
          compact
        />
      ) : (
        <SettingsSection title="COMMON QUESTIONS">
          <View style={styles.faqs}>
            {results.map((faq, i) => {
              const open = openIndex === i;
              return (
                <Animated.View key={faq.q} layout={LinearTransition.springify().damping(18)}>
                  <Card large padded={false}>
                    <Pressable
                      onPress={() => {
                        haptics.tap();
                        setOpenIndex(open ? null : i);
                      }}
                      style={styles.faqHead}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                    >
                      <Text variant="body" color={colors.indigo} style={styles.faqQ}>
                        {faq.q}
                      </Text>
                      <MaterialIcons
                        name={open ? 'expand-less' : 'expand-more'}
                        size={22}
                        color={colors.textTertiary}
                      />
                    </Pressable>

                    {open ? (
                      <Animated.View entering={FadeIn.duration(200)} style={styles.faqBody}>
                        <Text variant="bodyMuted" style={styles.faqA}>
                          {faq.a}
                        </Text>
                      </Animated.View>
                    ) : null}
                  </Card>
                </Animated.View>
              );
            })}
          </View>
        </SettingsSection>
      )}

      <SettingsSection title="STILL STUCK?">
        <Card large style={styles.contactCard}>
          <MaterialIcons name="support-agent" size={26} color={colors.primary} />
          <Text variant="headlineSm" color={colors.indigo} style={styles.contactTitle}>
            Talk to a person
          </Text>
          <Text variant="bodyMuted" style={styles.contactBody}>
            We usually reply within a day.
          </Text>
          <View style={styles.contactActions}>
            <Button
              label="Email support"
              icon="mail-outline"
              onPress={() => Linking.openURL('mailto:support@festiva.app').catch(() => {})}
            />
            <Button label="Send feedback" variant="secondary" icon="star-outline" />
          </View>
        </Card>
      </SettingsSection>
    </SettingsScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.indigo },

  faqs: { gap: spacing.md },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  faqQ: { flex: 1, fontWeight: '600' },
  faqBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  faqA: { lineHeight: 24 },

  contactCard: { alignItems: 'center', gap: spacing.xs },
  contactTitle: { textAlign: 'center', marginTop: spacing.sm },
  contactBody: { textAlign: 'center' },
  contactActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
});
