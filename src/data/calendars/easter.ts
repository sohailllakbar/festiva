/**
 * Easter and its dependent feasts.
 *
 * Easter is the anchor date for a cluster of Christian observances (Ash
 * Wednesday, Palm Sunday, Good Friday, Easter Monday) that move together every
 * year — computing it means the whole cluster never needs a manual date update
 * again.
 *
 * Two algorithms, because Western and Eastern Christianity compute it from
 * different calendars:
 *  - **Western/Gregorian** — the anonymous Gregorian algorithm as formalised
 *    by Meeus, Jones and Butcher. Verified against published dates for
 *    2026–2030 in easter.test.ts.
 *  - **Orthodox** — computed on the Julian calendar, then shifted by 13 days
 *    to land on the Gregorian date being displayed. The 13-day offset holds
 *    for the 1900–2099 window this app cares about; it widens by a day at
 *    the 2100 Julian leap-year skip.
 */

export interface MonthDay {
  month: number; // 1-12
  day: number;
}

/** Western Easter Sunday, in the Gregorian calendar. */
export function gregorianEaster(year: number): MonthDay {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/** Orthodox Easter (Pascha) Sunday, expressed as a Gregorian calendar date. */
export function orthodoxEaster(year: number): MonthDay {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const julianMonth = Math.floor((d + e + 114) / 31);
  const julianDay = ((d + e + 114) % 31) + 1;

  // Julian -> Gregorian civil date, valid 1900-2099.
  const julian = new Date(Date.UTC(year, julianMonth - 1, julianDay));
  julian.setUTCDate(julian.getUTCDate() + 13);
  return { month: julian.getUTCMonth() + 1, day: julian.getUTCDate() };
}

/** Offsets used for the feasts that hang off Western Easter Sunday. */
export const EASTER_OFFSETS = {
  ashWednesday: -46,
  palmSunday: -7,
  goodFriday: -2,
  easterSunday: 0,
  easterMonday: 1,
} as const;

/** Applies a day offset to an Easter date and returns the resulting month/day. */
export function fromEaster(year: number, offsetDays: number, orthodox = false): MonthDay {
  const base = orthodox ? orthodoxEaster(year) : gregorianEaster(year);
  const d = new Date(Date.UTC(year, base.month - 1, base.day));
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}
