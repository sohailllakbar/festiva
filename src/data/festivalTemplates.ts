import { isInherentlyApproximate, resolveForYear, type Recurrence } from './calendars/recurrence';
import { daysUntil } from './dates';
import type { Festival, FestivalCategory } from '../types';

/**
 * A festival's *rule*, not its date — the date is only known once resolved
 * against a specific year. This is what fixes the catalogue's original sin:
 * a static array of `date: string` goes stale the day after it's written,
 * and empties out entirely once every entry is in the past. A template never
 * expires; `resolveFestivals` below re-derives this year's (or next year's)
 * occurrence every time the app starts.
 */
export interface FestivalTemplate {
  id: string;
  name: string;
  category: FestivalCategory;
  region: string;
  countryCodes: string[];
  description: string;
  image: string;
  recurrence: Recurrence;
  /** Overrides the inferred value — set explicitly where the reason isn't the recurrence kind. */
  dateVaries?: boolean;
}

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

// Reused across templates rather than guessing at new Unsplash ids that might
// not exist — every id below was already verified working in the original
// catalogue. The card's category-tinted gradient covers any mismatch.
const PHOTO = {
  lanterns: IMG('photo-1564769662533-4f00a87b4056'), // warm lantern light — Islamic occasions
  pumpkins: IMG('photo-1509557965875-b88c97052f0e'), // Halloween / autumn
  diyas: IMG('photo-1605021154524-d5a2f65a0d5e'), // Diwali / festivals of light
  harvest: IMG('photo-1574672280600-4accfa5b6f98'), // Thanksgiving / harvest
  christmas: IMG('photo-1512389142860-9c449e58a543'),
  fireworks: IMG('photo-1467810563316-b5476525c0f9'), // New Year / civic celebration
  redLanterns: IMG('photo-1548013146-72479768bada'), // Lunar New Year
  colorPowder: IMG('photo-1583211892604-45c9a05ec2a7'), // Holi
  gathering: IMG('photo-1522543558187-768b6df7c25c'), // international observance / solidarity
  midsummer: IMG('photo-1533050487297-09b450131914'), // seasonal / outdoor
} as const;

export const FESTIVAL_TEMPLATES: FestivalTemplate[] = [
  // ---------------- Christian: Easter cycle (computed forever) ----------------
  {
    id: 'ash-wednesday',
    name: 'Ash Wednesday',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['GLOBAL'],
    description: 'Opens Lent, the 40-day period of reflection and fasting leading up to Easter, marked with an ash cross on the forehead.',
    image: PHOTO.christmas,
    recurrence: { kind: 'easter', offsetDays: -46 },
  },
  {
    id: 'palm-sunday',
    name: 'Palm Sunday',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['GLOBAL'],
    description: "Commemorates Jesus's entry into Jerusalem, marked with the blessing and procession of palm branches.",
    image: PHOTO.christmas,
    recurrence: { kind: 'easter', offsetDays: -7 },
  },
  {
    id: 'good-friday',
    name: 'Good Friday',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['GLOBAL'],
    description: 'A solemn day of mourning marking the crucifixion, observed with fasting and reflection ahead of Easter Sunday.',
    image: PHOTO.christmas,
    recurrence: { kind: 'easter', offsetDays: -2 },
  },
  {
    id: 'easter-sunday',
    name: 'Easter Sunday',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['GLOBAL'],
    description: "Celebrates the resurrection of Jesus Christ — the central feast of the Christian calendar, marked with services, family meals and egg traditions.",
    image: PHOTO.christmas,
    recurrence: { kind: 'easter', offsetDays: 0 },
  },
  {
    id: 'easter-monday',
    name: 'Easter Monday',
    category: 'religious',
    region: 'Europe, the Americas & Oceania',
    countryCodes: ['GB', 'CA', 'AU', 'DE', 'FR', 'BR'],
    description: 'A public holiday in many countries extending the Easter celebration by a day.',
    image: PHOTO.christmas,
    recurrence: { kind: 'easter', offsetDays: 1 },
  },
  {
    id: 'orthodox-good-friday',
    name: 'Orthodox Good Friday',
    category: 'religious',
    region: 'Eastern Orthodox Christianity',
    countryCodes: ['GR', 'RU', 'RS', 'RO', 'BG', 'UA'],
    description: 'The Orthodox observance of the crucifixion, dated by the Julian calendar and usually later than the Western date.',
    image: PHOTO.christmas,
    recurrence: { kind: 'orthodoxEaster', offsetDays: -2 },
    dateVaries: true,
  },
  {
    id: 'orthodox-easter',
    name: 'Orthodox Easter (Pascha)',
    category: 'religious',
    region: 'Eastern Orthodox Christianity',
    countryCodes: ['GR', 'RU', 'RS', 'RO', 'BG', 'UA'],
    description: 'The Feast of Feasts in Eastern Orthodox Christianity, dated by the Julian calendar so it often falls weeks after Western Easter.',
    image: PHOTO.christmas,
    recurrence: { kind: 'orthodoxEaster', offsetDays: 0 },
    dateVaries: true,
  },

  // ---------------- Christian: fixed ----------------
  {
    id: 'epiphany',
    name: 'Epiphany',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['GLOBAL'],
    description: 'Marks the visit of the Magi to the infant Jesus, and traditionally closes the twelve days of Christmas.',
    image: PHOTO.christmas,
    recurrence: { kind: 'fixed', month: 1, day: 6 },
  },
  {
    id: 'orthodox-christmas',
    name: 'Orthodox Christmas',
    category: 'religious',
    region: 'Eastern Orthodox Christianity',
    countryCodes: ['RU', 'RS', 'UA', 'ET', 'EG'],
    description: 'Christmas as observed by churches using the Julian calendar, celebrated thirteen days after the Western date.',
    image: PHOTO.christmas,
    recurrence: { kind: 'fixed', month: 1, day: 7 },
  },
  {
    id: 'christmas',
    name: 'Christmas',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'BR', 'PH'],
    description: 'Celebrates the birth of Jesus Christ. Marked around the world with gift-giving, decorated trees, carols and family gatherings.',
    image: PHOTO.christmas,
    recurrence: { kind: 'fixed', month: 12, day: 25 },
  },
  {
    id: 'all-saints-day',
    name: "All Saints' Day",
    category: 'religious',
    region: 'Europe & Latin America',
    countryCodes: ['FR', 'ES', 'IT', 'PL', 'MX', 'PH'],
    description: 'Honours all saints and, in many countries, is spent visiting and tending family graves.',
    image: PHOTO.pumpkins,
    recurrence: { kind: 'fixed', month: 11, day: 1 },
  },

  // ---------------- Islamic (tabular Hijri, computed forever) ----------------
  {
    id: 'islamic-new-year',
    name: 'Islamic New Year',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['PK', 'SA', 'AE', 'ID', 'TR', 'EG', 'GB', 'US'],
    description: 'Marks the start of the Hijri calendar year, commemorating the migration of the Prophet Muhammad from Mecca to Medina.',
    image: PHOTO.lanterns,
    recurrence: { kind: 'hijri', month: 1, day: 1 },
  },
  {
    id: 'ashura',
    name: 'Ashura',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['PK', 'SA', 'AE', 'IR', 'IQ', 'TR'],
    description: 'The tenth day of Muharram, observed with fasting by many Sunni Muslims and mourning by Shia Muslims marking the martyrdom of Husayn.',
    image: PHOTO.lanterns,
    recurrence: { kind: 'hijri', month: 1, day: 10 },
  },
  {
    id: 'mawlid',
    name: "Mawlid al-Nabi (Prophet's Birthday)",
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['PK', 'SA', 'AE', 'ID', 'TR', 'EG'],
    description: "Commemorates the birth of the Prophet Muhammad, marked with recitations, processions and charitable giving.",
    image: PHOTO.lanterns,
    recurrence: { kind: 'hijri', month: 3, day: 12 },
  },
  {
    id: 'ramadan-start',
    name: 'Start of Ramadan',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['PK', 'SA', 'AE', 'ID', 'TR', 'EG', 'GB', 'US'],
    description: 'The beginning of the month of dawn-to-sunset fasting, prayer and reflection observed by Muslims worldwide.',
    image: PHOTO.lanterns,
    recurrence: { kind: 'hijri', month: 9, day: 1 },
  },
  {
    id: 'eid-al-fitr',
    name: 'Eid-ul-Fitr',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['PK', 'SA', 'AE', 'ID', 'TR', 'EG', 'GB', 'US'],
    description: 'Marks the end of Ramadan, the month of fasting. Families gather for morning prayers, share meals, exchange gifts and give to those in need.',
    image: PHOTO.lanterns,
    recurrence: { kind: 'hijri', month: 10, day: 1 },
  },
  {
    id: 'eid-al-adha',
    name: 'Eid-ul-Adha',
    category: 'religious',
    region: 'Observed worldwide',
    countryCodes: ['PK', 'SA', 'AE', 'ID', 'TR', 'EG', 'GB', 'US'],
    description: 'The Festival of Sacrifice, marking the end of the Hajj pilgrimage and commemorating the Prophet Ibrahim’s devotion.',
    image: PHOTO.lanterns,
    recurrence: { kind: 'hijri', month: 12, day: 10 },
  },

  // ---------------- Jewish (sourced table, refresh periodically) ----------------
  {
    id: 'rosh-hashanah',
    name: 'Rosh Hashanah',
    category: 'religious',
    region: 'Jewish communities worldwide',
    countryCodes: ['IL', 'US', 'GB', 'FR', 'CA', 'AU'],
    description: 'The Jewish New Year, ushering in the Ten Days of Repentance with the sounding of the shofar.',
    image: PHOTO.gathering,
    recurrence: {
      kind: 'table',
      dates: { 2026: '2026-09-11', 2027: '2027-10-01', 2028: '2028-09-20', 2029: '2029-09-10', 2030: '2030-09-28' },
    },
  },
  {
    id: 'yom-kippur',
    name: 'Yom Kippur',
    category: 'religious',
    region: 'Jewish communities worldwide',
    countryCodes: ['IL', 'US', 'GB', 'FR', 'CA', 'AU'],
    description: 'The Day of Atonement — the holiest day in Judaism, observed with a full day of fasting, prayer and reflection.',
    image: PHOTO.gathering,
    recurrence: {
      kind: 'table',
      dates: { 2026: '2026-09-20', 2027: '2027-10-10', 2028: '2028-09-29', 2029: '2029-09-18', 2030: '2030-10-07' },
    },
  },
  {
    id: 'hanukkah',
    name: 'Hanukkah',
    category: 'religious',
    region: 'Jewish communities worldwide',
    countryCodes: ['IL', 'US', 'GB', 'FR', 'CA', 'AU'],
    description: 'The eight-day Festival of Lights commemorating the rededication of the Second Temple, marked by lighting the menorah each night.',
    image: PHOTO.diyas,
    recurrence: {
      kind: 'table',
      dates: { 2026: '2026-12-04', 2027: '2027-12-24', 2029: '2029-12-01' },
    },
  },
  {
    id: 'passover',
    name: 'Passover',
    category: 'religious',
    region: 'Jewish communities worldwide',
    countryCodes: ['IL', 'US', 'GB', 'FR', 'CA', 'AU'],
    description: 'Commemorates the Exodus from slavery in Egypt, marked by the Seder meal and a week of unleavened bread.',
    image: PHOTO.gathering,
    recurrence: {
      kind: 'table',
      dates: { 2026: '2026-04-01', 2027: '2027-04-21', 2028: '2028-04-10', 2030: '2030-04-17' },
    },
  },

  // ---------------- Hindu / Buddhist (sourced table) ----------------
  {
    id: 'diwali',
    name: 'Diwali',
    category: 'religious',
    region: 'India, Nepal & diaspora',
    countryCodes: ['IN', 'NP', 'LK', 'SG', 'GB', 'US', 'CA'],
    description: 'The festival of lights. Homes are lit with diyas and rangoli, families exchange sweets, and the celebration marks the triumph of light over darkness.',
    image: PHOTO.diyas,
    recurrence: {
      kind: 'table',
      dates: { 2026: '2026-11-08', 2027: '2027-10-29', 2028: '2028-10-17' },
    },
  },
  {
    id: 'holi',
    name: 'Holi',
    category: 'cultural',
    region: 'India, Nepal & diaspora',
    countryCodes: ['IN', 'NP', 'GB', 'US'],
    description: 'The festival of colours welcomes spring. Streets fill with coloured powder, music and dancing as people celebrate together.',
    image: PHOTO.colorPowder,
    recurrence: {
      kind: 'table',
      dates: {
        2026: '2026-03-04', 2027: '2027-03-22', 2028: '2028-03-11', 2029: '2029-03-01', 2030: '2030-03-20',
      },
    },
  },
  {
    id: 'vesak',
    name: 'Vesak (Buddha Purnima)',
    category: 'religious',
    region: 'South & Southeast Asia',
    countryCodes: ['IN', 'LK', 'TH', 'MM', 'SG'],
    description: "Commemorates the birth, enlightenment and passing of the Buddha, observed on the full moon of the fourth lunar month.",
    image: PHOTO.diyas,
    recurrence: {
      kind: 'table',
      dates: { 2026: '2026-05-01', 2027: '2027-05-20', 2028: '2028-05-08' },
    },
  },

  // ---------------- Chinese lunisolar (sourced table) ----------------
  {
    id: 'lunar-new-year',
    name: 'Lunar New Year',
    category: 'cultural',
    region: 'East & Southeast Asia',
    countryCodes: ['CN', 'SG', 'MY', 'VN', 'KR', 'TW'],
    description: 'The most important holiday across much of Asia. Families reunite, homes are cleaned for good fortune, and red envelopes are exchanged.',
    image: PHOTO.redLanterns,
    recurrence: {
      kind: 'table',
      dates: {
        2026: '2026-02-17', 2027: '2027-02-06', 2028: '2028-01-26', 2029: '2029-02-13', 2030: '2030-02-03',
      },
    },
  },

  // ---------------- Sikh ----------------
  {
    id: 'vaisakhi',
    name: 'Vaisakhi',
    category: 'religious',
    region: 'Punjab & Sikh diaspora',
    countryCodes: ['IN', 'GB', 'CA', 'US'],
    description: 'Marks the Sikh new year and the founding of the Khalsa, celebrated with processions, music and the reading of the Guru Granth Sahib.',
    image: PHOTO.harvest,
    recurrence: { kind: 'fixed', month: 4, day: 14 },
    dateVaries: true,
  },

  // ---------------- Seasonal / international observances (fixed) ----------------
  {
    id: 'new-year',
    name: 'New Year’s Day',
    category: 'international',
    region: 'Global',
    countryCodes: ['GLOBAL'],
    description: 'The first day of the Gregorian year, welcomed with fireworks, resolutions and gatherings across nearly every country.',
    image: PHOTO.fireworks,
    recurrence: { kind: 'fixed', month: 1, day: 1 },
  },
  {
    id: 'nowruz',
    name: 'Nowruz',
    category: 'cultural',
    region: 'Iran, Central Asia & the Caucasus',
    countryCodes: ['IR', 'AF', 'TR', 'AZ', 'TJ', 'UZ'],
    description: 'The Persian New Year, celebrated at the spring equinox with the Haft-Seen table, house-cleaning and family gatherings.',
    image: PHOTO.midsummer,
    recurrence: { kind: 'fixed', month: 3, day: 20 },
    dateVaries: true,
  },
  {
    id: 'international-womens-day',
    name: "International Women's Day",
    category: 'international',
    region: 'Global',
    countryCodes: ['GLOBAL'],
    description: 'A global day recognising the achievements of women and calling for equality worldwide.',
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 3, day: 8 },
  },
  {
    id: 'earth-day',
    name: 'Earth Day',
    category: 'international',
    region: 'Global',
    countryCodes: ['GLOBAL'],
    description: 'A global day of environmental action, marked by community clean-ups, tree planting and climate advocacy.',
    image: PHOTO.midsummer,
    recurrence: { kind: 'fixed', month: 4, day: 22 },
  },
  {
    id: 'labour-day-intl',
    name: 'International Workers’ Day',
    category: 'international',
    region: 'Observed in over 160 countries',
    countryCodes: ['GLOBAL'],
    description: 'Honours labour movements and workers’ rights, marked with parades and public holidays across most of the world.',
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 5, day: 1 },
  },
  {
    id: 'world-environment-day',
    name: 'World Environment Day',
    category: 'international',
    region: 'Global',
    countryCodes: ['GLOBAL'],
    description: 'The United Nations’ flagship day for environmental awareness and action, hosted by a different country each year.',
    image: PHOTO.midsummer,
    recurrence: { kind: 'fixed', month: 6, day: 5 },
  },
  {
    id: 'midsummer',
    name: 'Midsummer',
    category: 'seasonal',
    region: 'Nordic countries',
    countryCodes: ['SE', 'FI', 'NO', 'DK'],
    description: 'Marks the longest day of the year with flower crowns, maypole dancing and long evenings outdoors.',
    image: PHOTO.midsummer,
    recurrence: { kind: 'fixed', month: 6, day: 24 },
    dateVaries: true,
  },
  {
    id: 'international-day-of-peace',
    name: 'International Day of Peace',
    category: 'international',
    region: 'Global',
    countryCodes: ['GLOBAL'],
    description: 'A United Nations day devoted to strengthening the ideals of peace, marked by a moment of silence at noon local time.',
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 9, day: 21 },
  },
  {
    id: 'halloween',
    name: 'Halloween',
    category: 'cultural',
    region: 'North America & Europe',
    countryCodes: ['US', 'CA', 'GB', 'IE', 'AU'],
    description: 'An evening of costumes, carved pumpkins and trick-or-treating, rooted in the ancient festival of Samhain.',
    image: PHOTO.pumpkins,
    recurrence: { kind: 'fixed', month: 10, day: 31 },
  },
  {
    id: 'day-of-the-dead',
    name: 'Día de los Muertos',
    category: 'cultural',
    region: 'Mexico & Latin America',
    countryCodes: ['MX', 'US', 'GT', 'EC'],
    description: 'A joyful remembrance of loved ones who have died, marked with marigolds, ofrendas and sugar skulls.',
    image: PHOTO.pumpkins,
    recurrence: { kind: 'fixed', month: 11, day: 1 },
  },
  {
    id: 'human-rights-day',
    name: 'Human Rights Day',
    category: 'international',
    region: 'Global',
    countryCodes: ['GLOBAL'],
    description: 'Marks the anniversary of the UN’s Universal Declaration of Human Rights in 1948.',
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 12, day: 10 },
  },

  // ---------------- National holidays (fixed & nth-weekday civic dates) ----------------
  {
    id: 'us-mlk-day',
    name: 'Martin Luther King Jr. Day',
    category: 'national',
    region: 'United States',
    countryCodes: ['US'],
    description: 'Honours the civil rights leader’s life and legacy, observed the third Monday of January.',
    image: PHOTO.gathering,
    recurrence: { kind: 'nthWeekday', month: 1, weekday: 1, n: 3 },
  },
  {
    id: 'india-republic-day',
    name: 'Republic Day',
    category: 'national',
    region: 'India',
    countryCodes: ['IN'],
    description: "Marks the day India's constitution came into force in 1950, celebrated with a major parade in New Delhi.",
    image: PHOTO.harvest,
    recurrence: { kind: 'fixed', month: 1, day: 26 },
  },
  {
    id: 'australia-day',
    name: 'Australia Day',
    category: 'national',
    region: 'Australia',
    countryCodes: ['AU'],
    description: "Australia's official national day, marked with community events, though its date remains debated by many.",
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 1, day: 26 },
  },
  {
    id: 'pakistan-day',
    name: 'Pakistan Day',
    category: 'national',
    region: 'Pakistan',
    countryCodes: ['PK'],
    description: "Commemorates the 1940 Lahore Resolution, marked with a military parade in Islamabad.",
    image: PHOTO.harvest,
    recurrence: { kind: 'fixed', month: 3, day: 23 },
  },
  {
    id: 'japan-showa-day',
    name: 'Shōwa Day',
    category: 'national',
    region: 'Japan',
    countryCodes: ['JP'],
    description: 'Opens Japan’s "Golden Week" holidays, reflecting on the Shōwa era.',
    image: PHOTO.midsummer,
    recurrence: { kind: 'fixed', month: 4, day: 29 },
  },
  {
    id: 'freedom-day-za',
    name: 'Freedom Day',
    category: 'national',
    region: 'South Africa',
    countryCodes: ['ZA'],
    description: "Commemorates South Africa's first democratic election in 1994.",
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 4, day: 27 },
  },
  {
    id: 'japan-constitution-day',
    name: 'Constitution Memorial Day',
    category: 'national',
    region: 'Japan',
    countryCodes: ['JP'],
    description: "Commemorates the 1947 constitution, part of Japan's Golden Week holidays.",
    image: PHOTO.midsummer,
    recurrence: { kind: 'fixed', month: 5, day: 3 },
  },
  {
    id: 'us-mothers-day',
    name: "Mother's Day",
    category: 'cultural',
    region: 'United States & many countries',
    countryCodes: ['US', 'CA', 'AU', 'DE'],
    description: 'A day honouring mothers and motherhood, observed on the second Sunday of May in most of the Americas.',
    image: PHOTO.gathering,
    recurrence: { kind: 'nthWeekday', month: 5, weekday: 0, n: 2 },
  },
  {
    id: 'canada-day',
    name: 'Canada Day',
    category: 'national',
    region: 'Canada',
    countryCodes: ['CA'],
    description: "Marks the 1867 confederation that created Canada, celebrated nationwide with fireworks and festivals.",
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 7, day: 1 },
  },
  {
    id: 'us-independence-day',
    name: 'Independence Day',
    category: 'national',
    region: 'United States',
    countryCodes: ['US'],
    description: "Commemorates the 1776 Declaration of Independence, marked with fireworks and cookouts nationwide.",
    image: PHOTO.fireworks,
    recurrence: { kind: 'fixed', month: 7, day: 4 },
  },
  {
    id: 'bastille-day',
    name: 'Bastille Day',
    category: 'national',
    region: 'France',
    countryCodes: ['FR'],
    description: "France's national day, commemorating the 1789 storming of the Bastille, marked with a military parade in Paris.",
    image: PHOTO.fireworks,
    recurrence: { kind: 'fixed', month: 7, day: 14 },
  },
  {
    id: 'japan-mountain-day',
    name: 'Mountain Day',
    category: 'national',
    region: 'Japan',
    countryCodes: ['JP'],
    description: 'A public holiday dedicated to appreciating Japan’s mountains.',
    image: PHOTO.midsummer,
    recurrence: { kind: 'fixed', month: 8, day: 11 },
  },
  {
    id: 'indonesia-independence-day',
    name: 'Indonesian Independence Day',
    category: 'national',
    region: 'Indonesia',
    countryCodes: ['ID'],
    description: "Commemorates Indonesia's 1945 proclamation of independence, marked nationwide with flag ceremonies.",
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 8, day: 17 },
  },
  {
    id: 'pakistan-independence-day',
    name: 'Independence Day',
    category: 'national',
    region: 'Pakistan',
    countryCodes: ['PK'],
    description: "Marks Pakistan's independence in 1947, celebrated with flag-hoisting ceremonies and fireworks.",
    image: PHOTO.fireworks,
    recurrence: { kind: 'fixed', month: 8, day: 14 },
  },
  {
    id: 'india-independence-day',
    name: 'Independence Day',
    category: 'national',
    region: 'India',
    countryCodes: ['IN'],
    description: "Marks India's independence from British rule in 1947, marked by the Prime Minister's address at the Red Fort.",
    image: PHOTO.fireworks,
    recurrence: { kind: 'fixed', month: 8, day: 15 },
  },
  {
    id: 'brazil-independence-day',
    name: 'Independence Day',
    category: 'national',
    region: 'Brazil',
    countryCodes: ['BR'],
    description: "Commemorates Brazil's declaration of independence from Portugal in 1822.",
    image: PHOTO.fireworks,
    recurrence: { kind: 'fixed', month: 9, day: 7 },
  },
  {
    id: 'us-labor-day',
    name: 'Labor Day',
    category: 'national',
    region: 'United States',
    countryCodes: ['US'],
    description: "Honours the American labour movement, observed the first Monday of September and marking summer's unofficial end.",
    image: PHOTO.gathering,
    recurrence: { kind: 'nthWeekday', month: 9, weekday: 1, n: 1 },
  },
  {
    id: 'mexico-independence-day',
    name: 'Día de la Independencia',
    category: 'national',
    region: 'Mexico',
    countryCodes: ['MX'],
    description: "Commemorates Mexico's 1810 call to independence, marked with El Grito at midnight on September 15.",
    image: PHOTO.fireworks,
    recurrence: { kind: 'fixed', month: 9, day: 16 },
  },
  {
    id: 'japan-respect-for-aged',
    name: 'Respect for the Aged Day',
    category: 'national',
    region: 'Japan',
    countryCodes: ['JP'],
    description: 'A national holiday honouring elderly citizens, observed the third Monday of September.',
    image: PHOTO.gathering,
    recurrence: { kind: 'nthWeekday', month: 9, weekday: 1, n: 3 },
  },
  {
    id: 'german-unity-day',
    name: 'German Unity Day',
    category: 'national',
    region: 'Germany',
    countryCodes: ['DE'],
    description: 'Commemorates German reunification in 1990.',
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 10, day: 3 },
  },
  {
    id: 'canada-thanksgiving',
    name: 'Thanksgiving',
    category: 'national',
    region: 'Canada',
    countryCodes: ['CA'],
    description: "A harvest holiday of family gatherings and giving thanks, observed the second Monday of October.",
    image: PHOTO.harvest,
    recurrence: { kind: 'nthWeekday', month: 10, weekday: 1, n: 2 },
  },
  {
    id: 'india-gandhi-jayanti',
    name: 'Gandhi Jayanti',
    category: 'national',
    region: 'India',
    countryCodes: ['IN'],
    description: "Commemorates the birthday of Mahatma Gandhi, marked with prayer meetings and tributes.",
    image: PHOTO.gathering,
    recurrence: { kind: 'fixed', month: 10, day: 2 },
  },
  {
    id: 'us-thanksgiving',
    name: 'Thanksgiving',
    category: 'national',
    region: 'United States',
    countryCodes: ['US'],
    description: "A day for gathering with family over a shared meal and reflecting on the year's harvest and good fortune.",
    image: PHOTO.harvest,
    recurrence: { kind: 'nthWeekday', month: 11, weekday: 4, n: 4 },
  },
  {
    id: 'uae-national-day',
    name: 'UAE National Day',
    category: 'national',
    region: 'United Arab Emirates',
    countryCodes: ['AE'],
    description: "Marks the 1971 union of the seven emirates, celebrated with fireworks and citywide decorations.",
    image: PHOTO.fireworks,
    recurrence: { kind: 'fixed', month: 12, day: 2 },
  },
];

// ---------------- resolution ----------------

/**
 * Turns every template into this year's (or, if that's already passed, next
 * year's) concrete `Festival`. Runs once at import — effectively app start —
 * which is enough to keep every fixed and computed entry perpetually correct;
 * a `table` entry simply stops appearing once its sourced years run out,
 * which is the honest failure mode rather than showing a stale guess.
 */
export function resolveFestivals(templates: FestivalTemplate[], from: Date = new Date()): Festival[] {
  const year = from.getFullYear();
  const resolved: Festival[] = [];

  for (const t of templates) {
    for (const y of [year, year + 1]) {
      const date = resolveForYear(t.recurrence, y);
      if (!date) continue;
      if (daysUntil(date, from) < 0) continue;

      resolved.push({
        id: t.id,
        name: t.name,
        date,
        category: t.category,
        region: t.region,
        countryCodes: t.countryCodes,
        description: t.description,
        image: t.image,
        dateVaries: t.dateVaries ?? isInherentlyApproximate(t.recurrence),
      });
      break;
    }
  }

  return resolved;
}
