import { fromEaster } from './easter';
import { hijriDateInGregorianYear } from './hijri';

/**
 * How a festival's date is derived for a given Gregorian year.
 *
 *  - `fixed` — same month/day every year. Rolls forward automatically; never
 *    goes stale.
 *  - `nthWeekday` — "4th Thursday of November" style civic holidays. Pure
 *    date arithmetic, so equally permanent.
 *  - `easter` / `orthodoxEaster` — an offset from the relevant Easter Sunday.
 *    Computed, so it never goes stale either.
 *  - `hijri` — a Hijri month/day resolved into the Gregorian year via the
 *    tabular calendar. Computed forever, but inherently a day or two off the
 *    real moon-sighting announcement — always paired with `dateVaries`.
 *  - `table` — a hand-sourced Gregorian date per year, for calendars (Hebrew,
 *    Hindu lunisolar, Chinese lunisolar) whose real computation needs more
 *    than this app can safely hand-roll and verify. Resolves only for the
 *    years present; once a year is missing it's absent from the catalogue
 *    instead of showing a stale guess, which is the honest failure mode.
 */
export type Recurrence =
  | { kind: 'fixed'; month: number; day: number }
  | { kind: 'nthWeekday'; month: number; weekday: number; n: number }
  | { kind: 'easter'; offsetDays: number }
  | { kind: 'orthodoxEaster'; offsetDays: number }
  | { kind: 'hijri'; month: number; day: number }
  | { kind: 'table'; dates: Record<number, string> };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function iso(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** The Nth (or, with n = -1, last) weekday of a month. weekday: 0 = Sunday. */
function nthWeekdayOf(year: number, month: number, weekday: number, n: number): number {
  if (n > 0) {
    const first = new Date(year, month - 1, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return 1 + offset + (n - 1) * 7;
  }
  const last = new Date(year, month, 0); // day 0 of next month = last day of this one
  const offset = (last.getDay() - weekday + 7) % 7;
  return last.getDate() - offset;
}

/**
 * The date this recurrence falls on within `year`, or null if this
 * recurrence has nothing to say about that year (only possible for `table`).
 */
export function resolveForYear(recurrence: Recurrence, year: number): string | null {
  switch (recurrence.kind) {
    case 'fixed':
      return iso(year, recurrence.month, recurrence.day);

    case 'nthWeekday':
      return iso(year, recurrence.month, nthWeekdayOf(year, recurrence.month, recurrence.weekday, recurrence.n));

    case 'easter': {
      const { month, day } = fromEaster(year, recurrence.offsetDays, false);
      return iso(year, month, day);
    }

    case 'orthodoxEaster': {
      const { month, day } = fromEaster(year, recurrence.offsetDays, true);
      return iso(year, month, day);
    }

    case 'hijri': {
      const md = hijriDateInGregorianYear(year, recurrence.month, recurrence.day);
      return md ? iso(year, md.month, md.day) : null;
    }

    case 'table':
      return recurrence.dates[year] ?? null;
  }
}

/** Whether this recurrence kind is inherently approximate. */
export function isInherentlyApproximate(recurrence: Recurrence): boolean {
  return recurrence.kind === 'hijri' || recurrence.kind === 'table';
}
