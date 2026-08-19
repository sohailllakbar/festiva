/**
 * Tabular Islamic (Hijri) calendar.
 *
 * This is the "civil" or "Kuwaiti" tabular calendar — a fixed 30-year
 * arithmetic cycle with 11 leap years, the same rule used by ICU's
 * `islamic-civil` calendar and most software Hijri converters. It is not the
 * calendar a mosque uses to announce Ramadan or Eid, which follows local
 * moon-sighting and can land a day either side of the tabular date. That gap
 * is exactly what the app's existing `dateVaries` flag exists to communicate
 * — this gives a defensible default that never needs a yearly update, with
 * the UI already honest about the day being approximate.
 *
 * Everything routes through the Julian Day Number, which is what makes
 * Gregorian <-> Hijri conversion a matter of composing two well-known,
 * independently-testable conversions rather than one entangled algorithm.
 */

export interface MonthDay {
  month: number;
  day: number;
}

const ISLAMIC_EPOCH_JDN = 1948440; // JDN of 1 Muharram, 1 AH (civil/tabular)

// ---------- Gregorian <-> Julian Day Number ----------

export function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

// ---------- Hijri <-> Julian Day Number ----------

export function hijriToJDN(year: number, month: number, day: number): number {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    ISLAMIC_EPOCH_JDN -
    1
  );
}

export function jdnToHijri(jdn: number): { year: number; month: number; day: number } {
  const year = Math.floor((30 * (jdn - ISLAMIC_EPOCH_JDN) + 10646) / 10631);
  let month = Math.min(12, Math.ceil((jdn - (29 + hijriToJDN(year, 1, 1))) / 29.5) + 1);
  if (month < 1) month = 1;
  const day = jdn - hijriToJDN(year, month, 1) + 1;
  return { year, month, day };
}

// ---------- public conversions ----------

export function gregorianToHijri(year: number, month: number, day: number) {
  return jdnToHijri(gregorianToJDN(year, month, day));
}

export function hijriToGregorian(year: number, month: number, day: number) {
  return jdnToGregorian(hijriToJDN(year, month, day));
}

/**
 * The Gregorian date on which a given Hijri month/day falls, for whichever
 * Hijri year makes it land within the target Gregorian year — used to resolve
 * "1 Shawwal" or "10 Dhu al-Hijjah" into this year's actual date without the
 * caller needing to know or track the current Hijri year themselves.
 */
export function hijriDateInGregorianYear(
  gregorianYear: number,
  hijriMonth: number,
  hijriDay: number,
): MonthDay | null {
  // The Hijri year is ~11 days shorter than the Gregorian year, so at most two
  // Hijri years can produce a date inside one Gregorian year — check both
  // ends of the range that maps onto it.
  const approxHijriYear = Math.floor((gregorianYear - 622) * 1.030684);

  for (const y of [approxHijriYear - 1, approxHijriYear, approxHijriYear + 1, approxHijriYear + 2]) {
    const g = hijriToGregorian(y, hijriMonth, hijriDay);
    if (g.year === gregorianYear) return { month: g.month, day: g.day };
  }
  return null;
}
