import {
  gregorianToHijri,
  gregorianToJDN,
  hijriDateInGregorianYear,
  hijriToGregorian,
  jdnToGregorian,
} from './hijri';

let failed = 0;
function check(name: string, pass: boolean, detail = '') {
  if (pass) {
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ---------- self-consistency: every conversion must round-trip exactly ----------

const sampleDates: [number, number, number][] = [
  [2020, 1, 1], [2024, 2, 29], [2026, 8, 19], [2027, 12, 31],
  [2000, 6, 15], [2050, 3, 10], [1990, 11, 23], [2099, 12, 31],
];

for (const [y, m, d] of sampleDates) {
  const jdn = gregorianToJDN(y, m, d);
  const back = jdnToGregorian(jdn);
  check(
    `Gregorian round-trip ${y}-${m}-${d}`,
    back.year === y && back.month === m && back.day === d,
    `got ${back.year}-${back.month}-${back.day}`,
  );

  const hijri = gregorianToHijri(y, m, d);
  const backViaHijri = hijriToGregorian(hijri.year, hijri.month, hijri.day);
  check(
    `Hijri round-trip via ${y}-${m}-${d}`,
    backViaHijri.year === y && backViaHijri.month === m && backViaHijri.day === d,
    `got ${backViaHijri.year}-${backViaHijri.month}-${backViaHijri.day}`,
  );
}

// ---------- cross-check against real-world sourced dates ----------
// Tabular (civil) dates can legitimately land a day either side of the
// moon-sighting date these references report — that gap is the whole reason
// the app flags these festivals `dateVaries`. A match within 2 days confirms
// the algorithm, not a coincidence of one lucky case.

function daysBetween(a: { month: number; day: number }, month: number, day: number, year: number): number {
  const jdnA = gregorianToJDN(year, a.month, a.day);
  const jdnB = gregorianToJDN(year, month, day);
  return Math.abs(jdnA - jdnB);
}

const eidAlFitr: [number, number, number][] = [
  // [gregorianYear, referenceMonth, referenceDay] for 1 Shawwal
  [2026, 3, 20],
  [2027, 3, 10],
  [2028, 2, 27],
  [2029, 2, 15],
];
for (const [year, refMonth, refDay] of eidAlFitr) {
  const computed = hijriDateInGregorianYear(year, 10, 1);
  check(
    `Eid al-Fitr ${year} within 2 days of sighted date`,
    !!computed && daysBetween(computed, refMonth, refDay, year) <= 2,
    computed ? `computed ${year}-${computed.month}-${computed.day} vs reference ${year}-${refMonth}-${refDay}` : 'no result',
  );
}

const eidAlAdha: [number, number, number][] = [
  [2026, 5, 27],
  [2027, 5, 16],
  [2028, 5, 5],
];
for (const [year, refMonth, refDay] of eidAlAdha) {
  const computed = hijriDateInGregorianYear(year, 12, 10);
  check(
    `Eid al-Adha ${year} within 2 days of sighted date`,
    !!computed && daysBetween(computed, refMonth, refDay, year) <= 2,
    computed ? `computed ${year}-${computed.month}-${computed.day} vs reference ${year}-${refMonth}-${refDay}` : 'no result',
  );
}

const islamicNewYear: [number, number, number][] = [
  [2026, 6, 16],
  [2027, 6, 6],
];
for (const [year, refMonth, refDay] of islamicNewYear) {
  const computed = hijriDateInGregorianYear(year, 1, 1);
  check(
    `Islamic New Year ${year} within 2 days of reference`,
    !!computed && daysBetween(computed, refMonth, refDay, year) <= 2,
    computed ? `computed ${year}-${computed.month}-${computed.day} vs reference ${year}-${refMonth}-${refDay}` : 'no result',
  );
}

if (failed > 0) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall passed');
