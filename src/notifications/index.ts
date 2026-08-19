import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { nextOccurrence } from '../data/dates';
import { computeFireDate, notificationBody } from './schedule';
import type { PersonalEvent, Reminder, ReminderPreferences } from '../types';

/**
 * Reminder scheduling.
 *
 * Everything Festiva promises lives here: a reminder in the store is only a
 * preference until this module turns it into a real OS-level notification.
 *
 * Two rules shape the design:
 *  - **Identifiers are deterministic.** A reminder for occasion `f1` always
 *    schedules under the id `festiva:f1`, so cancelling or replacing it never
 *    needs a lookup table that could drift out of sync with the store.
 *  - **Reconcile, don't patch.** Rather than tracking incremental changes,
 *    `syncAll` cancels everything and re-schedules from current state. It runs
 *    on launch and after any change, which is also what rolls an annual
 *    occasion forward once its notification has fired.
 */

const PREFIX = 'festiva:';
const idFor = (refId: string) => `${PREFIX}${refId}`;

/** Foreground behaviour — a reminder should still surface if the app is open. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Android needs an explicit channel or notifications arrive silently with no
 * heads-up display. Harmless no-op on iOS.
 */
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Occasion reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F97316',
  });
}

export async function getPermissionGranted(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

/**
 * Asks the OS, once. If the user already denied, iOS will not show the sheet
 * again — the caller is expected to route them to Settings instead.
 */
export async function requestPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;

  const { granted } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });
  return granted;
}

/** True when the OS will not show the permission sheet again. */
export async function permissionIsBlocked(): Promise<boolean> {
  const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  return !granted && !canAskAgain;
}

// ---------- scheduling ----------

interface Occasion {
  refId: string;
  title: string;
  body: string;
  /** The occurrence being counted down to, already rolled forward if annual. */
  dateISO: string;
  reminder: Reminder;
  source: 'festival' | 'event';
}

async function scheduleOne(occasion: Occasion, prefs: ReminderPreferences): Promise<boolean> {
  const fireAt = computeFireDate(occasion.dateISO, occasion.reminder, prefs);
  if (!fireAt) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: idFor(occasion.refId),
    content: {
      title: occasion.title,
      body: occasion.body,
      sound: true,
      // Carried through so tapping the notification can deep-link to the thing
      // it's about.
      data: { refId: occasion.refId, source: occasion.source },
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
  return true;
}

export async function cancelForOccasion(refId: string) {
  await Notifications.cancelScheduledNotificationAsync(idFor(refId)).catch(() => {});
}

/** Clears only what Festiva scheduled, leaving anything else on the device alone. */
async function cancelAllOurs() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}

export interface SyncInput {
  prefs: ReminderPreferences;
  /** Festival reminders, keyed by festival id. */
  festivalReminders: { id: string; name: string; dateISO: string; reminder: Reminder }[];
  events: PersonalEvent[];
}

/**
 * Reconciles every scheduled notification against current state.
 *
 * Cheap enough to call on any change, and calling it on launch is what rolls
 * annual occasions forward after their notification has already fired.
 * Returns how many are now pending, which the UI uses to tell the truth about
 * whether reminders are actually armed.
 *
 * Runs are serialized. Each one clears the slate before rebuilding it, so two
 * overlapping calls could otherwise interleave a cancel from the later run with
 * the schedule from the earlier one — silently leaving a reminder unarmed,
 * which is the single failure this app cannot afford.
 */
let syncChain: Promise<number> = Promise.resolve(0);

export function syncAll(input: SyncInput): Promise<number> {
  syncChain = syncChain.then(
    () => runSync(input),
    () => runSync(input),
  );
  return syncChain;
}

async function runSync({ prefs, festivalReminders, events }: SyncInput): Promise<number> {
  await cancelAllOurs();

  if (!prefs.notificationsEnabled) return 0;
  if (!(await getPermissionGranted())) return 0;

  let scheduled = 0;

  if (prefs.festivalReminders) {
    for (const f of festivalReminders) {
      if (!f.reminder.enabled) continue;
      const ok = await scheduleOne(
        {
          refId: f.id,
          title: f.name,
          body: notificationBody(f.name, f.dateISO),
          dateISO: f.dateISO,
          reminder: f.reminder,
          source: 'festival',
        },
        prefs,
      );
      if (ok) scheduled++;
    }
  }

  if (prefs.eventReminders) {
    for (const e of events) {
      if (!e.reminder?.enabled) continue;
      const dateISO = nextOccurrence(e.date, e.recursAnnually);
      const ok = await scheduleOne(
        {
          refId: e.id,
          title: e.name,
          body: notificationBody(e.name, dateISO),
          dateISO,
          reminder: e.reminder,
          source: 'event',
        },
        prefs,
      );
      if (ok) scheduled++;
    }
  }

  return scheduled;
}

/** Diagnostic used by Settings to show what's actually armed on the device. */
export async function pendingCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((n) => n.identifier.startsWith(PREFIX)).length;
}

export { computeFireDate, notificationBody } from './schedule';
