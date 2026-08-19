import type { Country } from '../types';
import { FESTIVAL_TEMPLATES, resolveFestivals } from './festivalTemplates';

/**
 * Seed catalogue.
 *
 * `festivals` is no longer a static array of hand-typed dates — it's the
 * output of resolving `FESTIVAL_TEMPLATES` (in ./festivalTemplates.ts)
 * against today. Fixed and computed (Easter, Hijri) entries stay correct
 * forever; entries sourced from a per-year table (Hebrew, Hindu and Chinese
 * lunisolar dates) simply stop appearing once their sourced years run out,
 * rather than showing a stale guess. See festivalTemplates.ts for the
 * recurrence rules and festival descriptions.
 */
export const festivals = resolveFestivals(FESTIVAL_TEMPLATES);

/** Regional-indicator flag emoji, derived from the ISO code — never hand-typed, so it can't mismatch. */
function flag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

function country(code: string, name: string, regions?: string[]): Country {
  return { code, name, flag: flag(code), regions };
}

/**
 * Broad enough to make the country picker and `countryCodes` filtering feel
 * global rather than token — not the full ISO-3166 list, but every country
 * that appears in the festival catalogue's `countryCodes`, plus enough of
 * the rest of the world that most users find their own.
 */
export const countries: Country[] = [
  country('US', 'United States', ['Northeast', 'Midwest', 'South', 'West']),
  country('GB', 'United Kingdom', ['England', 'Scotland', 'Wales', 'Northern Ireland']),
  country('CA', 'Canada', ['Ontario', 'Quebec', 'British Columbia', 'Alberta']),
  country('AU', 'Australia', ['New South Wales', 'Victoria', 'Queensland', 'Western Australia']),
  country('IN', 'India', ['North', 'South', 'East', 'West']),
  country('PK', 'Pakistan', ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan']),
  country('DE', 'Germany'),
  country('FR', 'France'),
  country('JP', 'Japan'),
  country('BR', 'Brazil'),
  country('ZA', 'South Africa'),
  country('SG', 'Singapore'),
  country('AE', 'United Arab Emirates'),
  country('SA', 'Saudi Arabia'),
  country('MX', 'Mexico'),
  country('ID', 'Indonesia'),
  country('TR', 'Turkey'),
  country('EG', 'Egypt'),
  country('NG', 'Nigeria'),
  country('KE', 'Kenya'),
  country('PH', 'Philippines'),
  country('VN', 'Vietnam'),
  country('MY', 'Malaysia'),
  country('TH', 'Thailand'),
  country('KR', 'South Korea'),
  country('CN', 'China'),
  country('TW', 'Taiwan'),
  country('IT', 'Italy'),
  country('ES', 'Spain'),
  country('NL', 'Netherlands'),
  country('SE', 'Sweden'),
  country('NO', 'Norway'),
  country('DK', 'Denmark'),
  country('FI', 'Finland'),
  country('PL', 'Poland'),
  country('RU', 'Russia'),
  country('UA', 'Ukraine'),
  country('GR', 'Greece'),
  country('IE', 'Ireland'),
  country('NZ', 'New Zealand'),
  country('AR', 'Argentina'),
  country('CL', 'Chile'),
  country('CO', 'Colombia'),
  country('PE', 'Peru'),
  country('GT', 'Guatemala'),
  country('EC', 'Ecuador'),
  country('BD', 'Bangladesh'),
  country('LK', 'Sri Lanka'),
  country('NP', 'Nepal'),
  country('MM', 'Myanmar'),
  country('IQ', 'Iraq'),
  country('IR', 'Iran'),
  country('JO', 'Jordan'),
  country('LB', 'Lebanon'),
  country('IL', 'Israel'),
  country('MA', 'Morocco'),
  country('DZ', 'Algeria'),
  country('TN', 'Tunisia'),
  country('GH', 'Ghana'),
  country('ET', 'Ethiopia'),
  country('CH', 'Switzerland'),
  country('AT', 'Austria'),
  country('BE', 'Belgium'),
  country('PT', 'Portugal'),
  country('AZ', 'Azerbaijan'),
  country('TJ', 'Tajikistan'),
  country('UZ', 'Uzbekistan'),
  country('AF', 'Afghanistan'),
  country('RS', 'Serbia'),
  country('RO', 'Romania'),
  country('BG', 'Bulgaria'),
];

export const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'zh', label: 'Chinese', native: '中文' },
];
