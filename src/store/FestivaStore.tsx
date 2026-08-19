import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { countries, festivals as seedFestivals, languages } from '../data/festivals';
import { daysUntil, hoursUntil, nextOccurrence, toISO } from '../data/dates';
import {
  cancelForOccasion,
  configureNotificationHandler,
  ensureAndroidChannel,
  getPermissionGranted,
  requestPermission,
  syncAll,
} from '../notifications';
import { clearState, loadState, saveState } from './persistence';
import type {
  AppNotification,
  Festival,
  FestivalCategory,
  PersonalEvent,
  Reminder,
  ReminderPreferences,
  UserProfile,
} from '../types';

/**
 * Single source of truth.
 *
 * Favourites and reminders are stored in separate maps on purpose — the product
 * treats them as independent concepts, so a festival can be favourited without
 * a reminder and vice versa.
 *
 * Three responsibilities beyond holding state:
 *  - **Hydration.** Nothing renders against seed data until disk has been read,
 *    so the app never flashes defaults over the user's real content.
 *  - **Durability.** Every mutation is written back, debounced.
 *  - **Scheduling.** Reminders are only preferences until the OS knows about
 *    them, so any change to reminders, events or preferences re-reconciles the
 *    scheduled notifications.
 */
interface FestivaStore {
  /** False until disk has been read; screens should hold their first paint. */
  hydrated: boolean;

  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;

  /** True once onboarding finished, so relaunch goes straight to the app. */
  onboarded: boolean;
  completeOnboarding: () => void;

  festivals: Festival[];
  countries: typeof countries;
  languages: typeof languages;

  favorites: string[];
  toggleFavorite: (festivalId: string) => void;
  isFavorite: (festivalId: string) => boolean;
  /** Restores the last removed favourite, powering the undo snackbar. */
  undoRemoveFavorite: () => void;
  lastRemovedFavorite: string | null;

  reminders: Record<string, Reminder>;
  setReminder: (refId: string, reminder: Reminder) => void;
  removeReminder: (refId: string) => void;
  reminderFor: (refId: string) => Reminder | undefined;

  events: PersonalEvent[];
  addEvent: (event: Omit<PersonalEvent, 'id'>) => void;
  updateEvent: (id: string, patch: Partial<PersonalEvent>) => void;
  deleteEvent: (id: string) => void;
  eventById: (id: string) => PersonalEvent | undefined;

  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;

  preferences: ReminderPreferences;
  updatePreferences: (patch: Partial<ReminderPreferences>) => void;

  /** Whether the OS has actually granted permission — not what we'd like. */
  permissionGranted: boolean;
  askForPermission: () => Promise<boolean>;
  refreshPermission: () => Promise<void>;

  /** Wipes local state. Used by sign-out and account deletion. */
  resetEverything: () => Promise<void>;

  // derived
  festivalById: (id: string) => Festival | undefined;
  daysFor: (iso: string) => number;
  hoursFor: (iso: string) => number;
  /** Festivals matching the user's interests, soonest first. */
  personalizedFestivals: () => Festival[];
  upcomingFestivals: () => Festival[];
  /** Every festival regardless of date — the calendar needs to look backwards. */
  allFestivals: () => Festival[];
  upcomingEvents: () => (PersonalEvent & { resolvedDate: string })[];
  nextOccasion: () => Festival | undefined;
}

const Ctx = createContext<FestivaStore | null>(null);

/**
 * Collision-proof across relaunches, unlike the module-level counter this
 * replaced — that reset to its starting value every launch and would have
 * re-issued ids already held by saved events.
 */
const newId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/**
 * A new install has no name until the user gives one. Guests are greeted
 * generically rather than as whoever happened to be the developer.
 */
const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  countryCode: 'US',
  language: 'en',
  interests: ['religious', 'cultural', 'national', 'personal'],
};

const DEFAULT_PREFS: ReminderPreferences = {
  notificationsEnabled: true,
  festivalReminders: true,
  eventReminders: true,
  defaultOffset: 7,
  defaultTime: '09:00',
  quietHoursEnabled: false,
  quietFrom: '22:00',
  quietTo: '07:00',
};

export function FestivaProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [onboarded, setOnboarded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastRemovedFavorite, setLastRemovedFavorite] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Record<string, Reminder>>({});
  const [events, setEvents] = useState<PersonalEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<ReminderPreferences>(DEFAULT_PREFS);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // ---------- hydration ----------

  useEffect(() => {
    let cancelled = false;

    (async () => {
      configureNotificationHandler();
      await ensureAndroidChannel();

      const [saved, granted] = await Promise.all([loadState(), getPermissionGranted()]);
      if (cancelled) return;

      if (saved) {
        if (saved.profile) setProfile({ ...DEFAULT_PROFILE, ...saved.profile });
        if (saved.favorites) setFavorites(saved.favorites);
        if (saved.reminders) setReminders(saved.reminders);
        if (saved.events) setEvents(saved.events);
        if (saved.notifications) setNotifications(saved.notifications);
        if (saved.preferences) setPreferences({ ...DEFAULT_PREFS, ...saved.preferences });
        setOnboarded(!!saved.onboarded);
      }

      setPermissionGranted(granted);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- durability ----------

  // Debounced so a burst of changes (typing, dragging a time picker) writes
  // once rather than on every keystroke.
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated) return;

    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      void saveState({ profile, favorites, reminders, events, notifications, preferences, onboarded });
    }, 400);

    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [hydrated, profile, favorites, reminders, events, notifications, preferences, onboarded]);

  // ---------- scheduling ----------

  // Reconcile whenever anything that affects a fire time changes. Running on
  // hydrate is also what rolls annual occasions forward after they've fired.
  useEffect(() => {
    if (!hydrated) return;

    void syncAll({
      prefs: preferences,
      festivalReminders: Object.entries(reminders)
        .map(([id, reminder]) => {
          const festival = seedFestivals.find((f) => f.id === id);
          return festival ? { id, name: festival.name, dateISO: festival.date, reminder } : null;
        })
        .filter((f): f is NonNullable<typeof f> => !!f),
      events,
    });
  }, [hydrated, reminders, events, preferences, permissionGranted]);

  // A reminder that fires while the app is installed belongs in the inbox,
  // whether or not the app was open at the time.
  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      setNotifications((prev) => [
        {
          id: newId('n'),
          title: title ?? 'Reminder',
          body: body ?? '',
          timestamp: new Date().toISOString(),
          read: false,
          source: (data?.source as 'festival' | 'event') ?? 'festival',
          refId: (data?.refId as string) ?? '',
        },
        ...prev,
      ]);
    });

    return () => received.remove();
  }, []);

  // ---------- mutations ----------

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  const completeOnboarding = useCallback(() => setOnboarded(true), []);

  const toggleFavorite = useCallback((festivalId: string) => {
    setFavorites((prev) => {
      if (prev.includes(festivalId)) {
        setLastRemovedFavorite(festivalId);
        return prev.filter((f) => f !== festivalId);
      }
      setLastRemovedFavorite(null);
      return [...prev, festivalId];
    });
  }, []);

  const undoRemoveFavorite = useCallback(() => {
    setLastRemovedFavorite((removed) => {
      if (removed) setFavorites((prev) => (prev.includes(removed) ? prev : [...prev, removed]));
      return null;
    });
  }, []);

  const setReminder = useCallback((refId: string, reminder: Reminder) => {
    setReminders((prev) => ({ ...prev, [refId]: reminder }));
  }, []);

  const removeReminder = useCallback((refId: string) => {
    setReminders((prev) => {
      const next = { ...prev };
      delete next[refId];
      return next;
    });
    void cancelForOccasion(refId);
  }, []);

  const addEvent = useCallback((event: Omit<PersonalEvent, 'id'>) => {
    setEvents((prev) => [...prev, { ...event, id: newId('e') }]);
  }, []);

  const updateEvent = useCallback((id: string, patch: Partial<PersonalEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    void cancelForOccasion(id);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const updatePreferences = useCallback((patch: Partial<ReminderPreferences>) => {
    setPreferences((p) => ({ ...p, ...patch }));
  }, []);

  const askForPermission = useCallback(async () => {
    const granted = await requestPermission();
    setPermissionGranted(granted);
    // Asking and being refused is itself an answer — reflect it rather than
    // leaving the in-app switch claiming reminders are on.
    setPreferences((p) => ({ ...p, notificationsEnabled: granted ? p.notificationsEnabled : false }));
    return granted;
  }, []);

  const refreshPermission = useCallback(async () => {
    setPermissionGranted(await getPermissionGranted());
  }, []);

  const resetEverything = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    await clearState();
    setProfile(DEFAULT_PROFILE);
    setFavorites([]);
    setReminders({});
    setEvents([]);
    setNotifications([]);
    setPreferences(DEFAULT_PREFS);
    setOnboarded(false);
  }, []);

  // ---------- derived ----------

  const value = useMemo<FestivaStore>(() => {
    const sortedFestivals = [...seedFestivals].sort(
      (a, b) => daysUntil(a.date) - daysUntil(b.date),
    );
    const future = sortedFestivals.filter((f) => daysUntil(f.date) >= 0);

    /**
     * Interests narrow the catalogue, but never to nothing — a user whose
     * chosen categories have no upcoming entries should still see the app
     * working rather than an empty shell.
     */
    const personalized = () => {
      const matching = future.filter((f) =>
        profile.interests.includes(f.category as FestivalCategory),
      );
      return matching.length > 0 ? matching : future;
    };

    return {
      hydrated,

      profile,
      updateProfile,
      onboarded,
      completeOnboarding,

      festivals: seedFestivals,
      countries,
      languages,

      favorites,
      toggleFavorite,
      isFavorite: (id) => favorites.includes(id),
      undoRemoveFavorite,
      lastRemovedFavorite,

      reminders,
      setReminder,
      removeReminder,
      reminderFor: (refId) => reminders[refId],

      events,
      addEvent,
      updateEvent,
      deleteEvent,
      eventById: (id) => events.find((e) => e.id === id),

      notifications,
      markNotificationRead,
      markAllRead,
      unreadCount: notifications.filter((n) => !n.read).length,

      preferences,
      updatePreferences,

      permissionGranted,
      askForPermission,
      refreshPermission,
      resetEverything,

      festivalById: (id) => seedFestivals.find((f) => f.id === id),
      daysFor: (iso) => daysUntil(iso),
      hoursFor: (iso) => hoursUntil(iso),

      personalizedFestivals: personalized,
      upcomingFestivals: () => future,
      allFestivals: () => sortedFestivals,
      upcomingEvents: () =>
        events
          .map((e) => ({ ...e, resolvedDate: nextOccurrence(e.date, e.recursAnnually) }))
          .sort((a, b) => daysUntil(a.resolvedDate) - daysUntil(b.resolvedDate)),
      nextOccasion: () => personalized()[0] ?? future[0],
    };
  }, [
    hydrated,
    profile,
    onboarded,
    favorites,
    lastRemovedFavorite,
    reminders,
    events,
    notifications,
    preferences,
    permissionGranted,
    updateProfile,
    completeOnboarding,
    toggleFavorite,
    undoRemoveFavorite,
    setReminder,
    removeReminder,
    addEvent,
    updateEvent,
    deleteEvent,
    markNotificationRead,
    markAllRead,
    updatePreferences,
    askForPermission,
    refreshPermission,
    resetEverything,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFestiva(): FestivaStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFestiva must be used inside <FestivaProvider>');
  return ctx;
}

export { toISO };
