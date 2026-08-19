import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { LinearTransition } from 'react-native-reanimated';

import {
  Button,
  Card,
  EmptyState,
  IconBubble,
  IconButton,
  Text,
  enterAt,
  haptics,
} from '../src/components';
import { formatRelativeTime } from '../src/data/dates';
import { useFestiva } from '../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../src/theme';
import type { AppNotification } from '../src/types';

/**
 * The reminder inbox. Kept calm rather than inbox-like: unread is a soft tint
 * plus a dot, not a shouty badge, and every row opens the thing it's about.
 *
 * Entries are written by the notification listener in the store when a reminder
 * actually fires, so there is nothing to fetch and no loading or error state to
 * model — pull-to-refresh re-checks the OS permission, which is the only thing
 * here that can change behind the app's back.
 */
export default function Notifications() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const festiva = useFestiva();
  const [refreshing, setRefreshing] = useState(false);

  const grouped = useMemo(() => {
    const unread = festiva.notifications.filter((n) => !n.read);
    const read = festiva.notifications.filter((n) => n.read);
    return { unread, read };
  }, [festiva.notifications]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await festiva.refreshPermission();
    setRefreshing(false);
  }, [festiva]);

  const open = (n: AppNotification) => {
    festiva.markNotificationRead(n.id);
    router.push(n.source === 'festival' ? `/festival/${n.refId}` : `/event/${n.refId}`);
  };

  const isEmpty = festiva.notifications.length === 0;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} size={22} />
        <Text variant="headlineSm" color={colors.indigo} style={styles.title}>
          Reminders
        </Text>
        <IconButton
          icon="settings"
          label="Reminder preferences"
          size={20}
          onPress={() => router.push('/settings/reminders')}
        />
      </View>

      {/* Permission banner sits above everything — without it nothing else works */}
      {!festiva.permissionGranted || !festiva.preferences.notificationsEnabled ? (
        <View style={styles.permissionBanner}>
          <MaterialIcons name="notifications-off" size={20} color={colors.warning} />
          <View style={styles.permissionText}>
            <Text variant="label" color={colors.warning} style={styles.permissionTitle}>
              Notifications are turned off
            </Text>
            <Text variant="labelSm">
              {!festiva.permissionGranted
                ? "iOS is blocking reminders. Allow notifications for Festiva to switch them back on."
                : "Reminders are switched off in Festiva, so nothing will be sent."}
            </Text>
          </View>
          <Button
            label="Fix"
            variant="tertiary"
            block={false}
            onPress={() => {
              if (!festiva.permissionGranted) Linking.openSettings().catch(() => {});
              else router.push('/settings/reminders');
            }}
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
          />
        }
      >
        {isEmpty ? (
          <EmptyState
            icon="notifications-none"
            title="No reminders yet"
            message="When an occasion you've saved is coming up, we'll let you know here."
          >
            <Button label="Explore festivals" onPress={() => router.replace('/(tabs)/discover')} />
          </EmptyState>
        ) : (
          <>
            {grouped.unread.length > 0 ? (
              <View style={styles.group}>
                <View style={styles.groupHead}>
                  <Text variant="labelSm" style={styles.groupLabel}>
                    NEW
                  </Text>
                  <Pressable
                    onPress={() => {
                      haptics.tap();
                      festiva.markAllRead();
                    }}
                    hitSlop={10}
                    accessibilityRole="button"
                  >
                    <Text variant="label" color={colors.primary} style={styles.markAll}>
                      Mark all read
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.list}>
                  {grouped.unread.map((n, i) => (
                    <Animated.View
                      key={n.id}
                      entering={enterAt(i)}
                      layout={LinearTransition.springify().damping(18)}
                    >
                      <NotificationRow notification={n} onPress={() => open(n)} />
                    </Animated.View>
                  ))}
                </View>
              </View>
            ) : null}

            {grouped.read.length > 0 ? (
              <View style={styles.group}>
                <Text variant="labelSm" style={styles.groupLabel}>
                  EARLIER
                </Text>
                <View style={styles.list}>
                  {grouped.read.map((n, i) => (
                    <Animated.View
                      key={n.id}
                      entering={enterAt(i)}
                      layout={LinearTransition.springify().damping(18)}
                    >
                      <NotificationRow notification={n} onPress={() => open(n)} />
                    </Animated.View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const unread = !notification.read;
  const isFestival = notification.source === 'festival';

  return (
    <Card onPress={onPress} style={[styles.row, unread && styles.rowUnread]}>
      <View style={styles.rowInner}>
        <IconBubble
          icon={isFestival ? 'celebration' : 'cake'}
          size={44}
          color={isFestival ? colors.primary : colors.info}
          background={isFestival ? colors.primaryLight : colors.infoLight}
        />

        <View style={styles.rowBody}>
          <Text variant="body" color={colors.indigo} style={styles.rowTitle} numberOfLines={2}>
            {notification.title}
          </Text>
          <Text variant="bodyMuted" numberOfLines={2} style={styles.rowText}>
            {notification.body}
          </Text>
          <Text variant="labelSm">{formatRelativeTime(notification.timestamp)}</Text>
        </View>

        {unread ? <View style={styles.unreadDot} /> : null}
      </View>
    </Card>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, textAlign: 'center' },

  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.screenX,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: `${colors.warning}55`,
  },
  permissionText: { flex: 1, gap: 2 },
  permissionTitle: { fontWeight: '700' },

  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl },
  group: { marginBottom: spacing.section, gap: spacing.md },
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupLabel: { fontWeight: '700', letterSpacing: 0.6 },
  markAll: { fontWeight: '600' },
  list: { gap: spacing.md },

  row: {},
  rowUnread: { backgroundColor: colors.surfaceAlt, borderColor: `${colors.primary}44` },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { fontWeight: '600' },
  rowText: { lineHeight: 22 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },

});
