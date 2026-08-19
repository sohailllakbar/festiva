import type { CategoryKey } from '../theme';

/**
 * Festiva domain model.
 *
 * Two deliberate separations, both from the product spec:
 *  - Favourite and Reminder are independent. You can favourite without a
 *    reminder, set a reminder without favouriting, or both.
 *  - The reminder shape is shared between festivals and personal events, so the
 *    same picker and scheduling logic serves both.
 */

export type FestivalCategory = CategoryKey;

export interface Festival {
  id: string;
  name: string;
  /** ISO date (YYYY-MM-DD) for this year's occurrence. */
  date: string;
  category: FestivalCategory;
  /** Where it's chiefly observed; 'Global' for worldwide occasions. */
  region: string;
  countryCodes: string[];
  description: string;
  image: string;
  /**
   * Some festivals follow lunar or other calendars, so the date shifts year to
   * year. Flagged so the UI can say "date varies" rather than imply precision.
   */
  dateVaries?: boolean;
}

export type EventCategory =
  | 'birthday'
  | 'anniversary'
  | 'wedding'
  | 'graduation'
  | 'family'
  | 'custom';

export interface PersonalEvent {
  id: string;
  name: string;
  category: EventCategory;
  date: string;
  recursAnnually: boolean;
  notes?: string;
  reminder?: Reminder;
}

/** Offsets the spec calls for, plus a custom escape hatch. */
export type ReminderOffset = 30 | 14 | 7 | 1 | 0 | 'custom';

export interface Reminder {
  /** Days before the occasion; 0 means on the day. */
  offset: ReminderOffset;
  /** Local time to fire, "HH:mm". */
  time: string;
  customDays?: number;
  enabled: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  /** ISO instant. Formatted at render time so "2 hours ago" stays true. */
  timestamp: string;
  read: boolean;
  source: 'festival' | 'event';
  /** Festival or PersonalEvent id, for deep-linking from the notification. */
  refId: string;
}

export interface UserProfile {
  name: string;
  email: string;
  countryCode: string;
  region?: string;
  language: string;
  interests: FestivalCategory[];
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  regions?: string[];
}

export interface ReminderPreferences {
  notificationsEnabled: boolean;
  festivalReminders: boolean;
  eventReminders: boolean;
  defaultOffset: ReminderOffset;
  defaultTime: string;
  quietHoursEnabled: boolean;
  quietFrom: string;
  quietTo: string;
}

/**
 * For async surfaces, so they render every state rather than only the happy
 * path. Currently unused: everything the app reads is local, so there is
 * nothing to be loading or offline about. It earns its place back when the
 * festival catalogue moves behind a network call.
 */
export type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'offline';
