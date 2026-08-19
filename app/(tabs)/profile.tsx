import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { Card, Text, enterAt } from '../../src/components';
import { Logo } from '../../src/components/Logo';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface Row {
  icon: IconName;
  label: string;
  detail?: string;
  href?: string;
  danger?: boolean;
}

/**
 * Settings hub. Grouped into plain-language sections rather than a flat list,
 * so it reads like a considered product surface, not an admin panel.
 */
export default function Profile() {
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const festiva = useFestiva();
  const { profile } = festiva;

  // The row used to always read "System" regardless of what was actually set.
  const appearanceLabel = mode === 'system' ? 'Match device' : mode === 'dark' ? 'Dark' : 'Light';

  const country = festiva.countries.find((c) => c.code === profile.countryCode);
  const language = festiva.languages.find((l) => l.code === profile.language);

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: 'YOUR EXPERIENCE',
      rows: [
        {
          icon: 'public',
          label: 'Country & region',
          detail: `${country?.flag ?? ''} ${country?.name ?? 'Not set'}${profile.region ? ` · ${profile.region}` : ''}`,
          href: '/settings/personalization',
        },
        {
          icon: 'interests',
          label: 'Festival interests',
          detail: `${profile.interests.length} selected`,
          href: '/settings/personalization',
        },
        {
          icon: 'language',
          label: 'Language',
          detail: language?.native ?? 'English',
          href: '/settings/personalization',
        },
        { icon: 'palette', label: 'Appearance', detail: appearanceLabel, href: '/settings/appearance' },
      ],
    },
    {
      title: 'REMINDERS',
      rows: [
        {
          icon: 'notifications-active',
          label: 'Reminder preferences',
          detail: festiva.preferences.notificationsEnabled ? 'On' : 'Off',
          href: '/settings/reminders',
        },
        {
          icon: 'favorite-border',
          label: 'Your favourites',
          detail: `${festiva.favorites.length} saved`,
          href: '/favorites',
        },
      ],
    },
    {
      title: 'ACCOUNT',
      rows: [
        { icon: 'person-outline', label: 'Edit profile', href: '/settings/account' },
        { icon: 'lock-outline', label: 'Change password', href: '/settings/account' },
      ],
    },
    {
      title: 'SUPPORT',
      rows: [
        { icon: 'help-outline', label: 'Help & FAQ', href: '/settings/help' },
        { icon: 'mail-outline', label: 'Contact support', href: '/settings/help' },
        { icon: 'star-outline', label: 'Send feedback', href: '/settings/help' },
      ],
    },
    {
      title: 'LEGAL',
      rows: [
        { icon: 'privacy-tip', label: 'Privacy Policy', href: '/settings/legal' },
        { icon: 'gavel', label: 'Terms & Conditions', href: '/settings/legal' },
        { icon: 'info-outline', label: 'About Festiva', href: '/settings/legal' },
      ],
    },
    {
      title: '',
      rows: [
        { icon: 'logout', label: 'Sign out', href: '/settings/account' },
        { icon: 'delete-forever', label: 'Delete account', href: '/settings/delete-account', danger: true },
      ],
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <Card large style={styles.identityCard} onPress={() => router.push('/settings/account')}>
          <View style={styles.avatar}>
            <Logo size={32} />
          </View>
          <View style={styles.identityText}>
            <Text variant="headlineSm" color={colors.indigo} numberOfLines={1}>
              {profile.name || 'Guest'}
            </Text>
            <Text variant="bodyMuted" numberOfLines={1}>
              {profile.email || 'Sign in to sync your occasions'}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
        </Card>

        {/* At-a-glance stats */}
        <View style={styles.stats}>
          <Stat value={festiva.favorites.length} label="Favourites" />
          <Stat value={festiva.events.length} label="Occasions" />
          <Stat value={Object.keys(festiva.reminders).length} label="Reminders" />
        </View>

        {groups.map((group, gi) => (
          <Animated.View key={group.title || `group-${gi}`} entering={enterAt(gi)} style={styles.group}>
            {group.title ? (
              <Text variant="labelSm" style={styles.groupTitle}>
                {group.title}
              </Text>
            ) : null}

            <Card large padded={false}>
              {group.rows.map((row, i) => (
                <SettingRow
                  key={row.label}
                  row={row}
                  isLast={i === group.rows.length - 1}
                  onPress={() => row.href && router.push(row.href as never)}
                />
              ))}
            </Card>
          </Animated.View>
        ))}

        <Text variant="labelSm" style={styles.version}>
          Festiva · Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.stat}>
      <Text variant="headlineMd" color={colors.primary} style={styles.statValue}>
        {value}
      </Text>
      <Text variant="labelSm">{label}</Text>
    </View>
  );
}

function SettingRow({ row, isLast, onPress }: { row: Row; isLast: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} padded={false} borderless style={styles.rowCard}>
      <View style={[styles.row, !isLast && styles.rowDivider]}>
        <MaterialIcons
          name={row.icon}
          size={22}
          color={row.danger ? colors.danger : colors.primary}
        />
        <Text
          variant="body"
          color={row.danger ? colors.danger : colors.indigo}
          style={styles.rowLabel}
        >
          {row.label}
        </Text>
        {row.detail ? (
          <Text variant="labelSm" numberOfLines={1} style={styles.rowDetail}>
            {row.detail}
          </Text>
        ) : null}
        <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.screenX, gap: spacing.xl },

  identityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1, gap: 2 },

  stats: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontVariant: ['tabular-nums'] },

  group: { gap: spacing.sm },
  groupTitle: { fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: spacing.xs },
  rowCard: { borderRadius: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 58,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { flex: 1 },
  rowDetail: { maxWidth: 140, textAlign: 'right' },

  version: { textAlign: 'center', marginTop: spacing.sm },
});
