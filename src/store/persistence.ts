import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppNotification,
  PersonalEvent,
  Reminder,
  ReminderPreferences,
  UserProfile,
} from '../types';

/**
 * Disk format for the store.
 *
 * Versioned from the start: the shape will change, and a stored blob written by
 * an older build must never crash a newer one. On a version mismatch we discard
 * rather than guess — losing local state is bad, but booting into a corrupt
 * store is worse, and this is the layer a real sync backend will eventually
 * replace.
 */

const KEY = 'festiva:state:v1';
const VERSION = 1;

export interface PersistedState {
  version: number;
  profile: UserProfile;
  favorites: string[];
  reminders: Record<string, Reminder>;
  events: PersonalEvent[];
  notifications: AppNotification[];
  preferences: ReminderPreferences;
  /** Whether onboarding has been completed, so relaunch skips it. */
  onboarded: boolean;
}

export async function loadState(): Promise<Partial<PersistedState> | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (parsed?.version !== VERSION) return null;
    return parsed;
  } catch {
    // A malformed blob is treated as "no saved state" rather than a crash.
    return null;
  }
}

export async function saveState(state: Omit<PersistedState, 'version'>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...state, version: VERSION }));
  } catch {
    // Storage failures must never take the app down mid-interaction. The next
    // write will usually succeed; if it doesn't, the user loses local state,
    // which is the same position they were in before persistence existed.
  }
}

export async function clearState(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}

// ---------- theme ----------

const THEME_KEY = 'festiva:theme:v1';

export async function loadThemeMode(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export async function saveThemeMode(mode: string): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
}
