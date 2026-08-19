# Festiva — project notes

Global festival & personal occasion reminder app. **Discover what matters.
Remember what matters. Never miss an important occasion.**

## Stack (do not bump without reading the constraint)

- **Expo SDK 54** · React Native 0.81.5 · React 19.1.0 · TypeScript
- **expo-router** (file-based; entry point is `expo-router/entry`)
- Inter via `@expo-google-fonts/inter` — the root layout holds first paint until
  the font is ready, since Inter is the sole typeface

### ⚠️ SDK 54 is pinned on purpose

The Expo Go build on the test iPhone reports **Supported SDK 54**. Newer SDKs
fail with "Project is incompatible with this version of Expo Go". This project
was cloned from the FamilyCare app specifically to inherit its known-good
dependency tree.

**Pin native modules explicitly, including transitive ones.** Expo Go ships
fixed native binaries; a JS/native version mismatch kills the app at startup
with `Exception in HostFunction` before any screen renders.
`react-native-worklets` must stay at **0.5.1** (npm will hoist 0.8.x as a
transitive dep of Reanimated 4 if given the chance) and `react-native-svg` at
**15.12.1**. Because `expo install --check` only validates what's listed in
`package.json`, both are explicit dependencies.

If the tree gets conflicted: `rm -rf node_modules package-lock.json && npm install`.
Avoid `--legacy-peer-deps` — it has silently pruned transitive native modules.

### Dev server: use LAN mode

If Expo Go reports "Could not connect to the server" and the URL reads
`exp://127.0.0.1:8081`, the CLI started in localhost mode and the phone is
trying to reach itself. Restart with:

```
npx expo start --lan
```

The QR should encode the PC's LAN address (e.g. `exp://192.168.100.62:8081`).

## State, storage and reminders

The store hydrates from `AsyncStorage` before anything renders. `hydrated` is
false until disk has been read, and `app/index.tsx` waits on it — routing early
would push a returning user back through onboarding they already finished.

- **Writes are debounced** (400ms) so dragging a time picker doesn't thrash disk.
- **The stored blob is versioned.** On a version mismatch `loadState` returns
  null rather than guessing; booting a corrupt store is worse than losing local
  state. See `src/store/persistence.ts`.
- **Ids must survive a relaunch.** `newId()` is time + random. The old
  module-level counter reset every launch and would have re-issued ids already
  held by saved events.

### Reminders are only real once the OS knows

`src/notifications/` owns this, split in two on purpose:

- `schedule.ts` is **pure** — offsets, quiet hours, fire times. No
  `expo-notifications` import, so it can be tested under plain node. Run
  `npm run test:schedule` after touching it.
- `index.ts` talks to the platform.

Three rules that are easy to break:

1. **Identifiers are deterministic** (`festiva:<refId>`), so cancelling or
   replacing never needs a lookup table that could drift from the store.
2. **Reconcile, don't patch.** `syncAll` cancels everything and rebuilds from
   current state. It runs on hydrate and after any change to reminders, events
   or preferences — which is also what rolls an annual occasion forward once its
   notification has fired. Runs are **serialized**; overlapping calls could
   otherwise interleave a cancel from the later run with a schedule from the
   earlier one and silently leave a reminder unarmed.
3. **The OS is the authority, not `preferences`.** `permissionGranted` comes
   from `getPermissionsAsync()`. The Reminders master switch reflects *both*, so
   the app can never claim reminders are on while iOS is blocking them.

An unsatisfiable lead time (a 1-week reminder on an occasion 3 days away) falls
back to the morning of the occasion rather than scheduling nothing — the intent
was to be reminded; only the lead time was impossible.

## The festival catalogue never goes stale

`src/data/festivals.ts` no longer holds hand-typed dates. It resolves
`FESTIVAL_TEMPLATES` (`src/data/festivalTemplates.ts`) against today, once at
import — a *template* is a recurrence rule, not a date, so this stays correct
without a yearly edit. Four rule kinds, in `src/data/calendars/recurrence.ts`:

- `fixed` / `nthWeekday` — pure date arithmetic (`nthWeekday` covers "4th
  Thursday of November" civic holidays). Correct forever.
- `easter` / `orthodoxEaster` — `src/data/calendars/easter.ts`, the
  Meeus/Jones/Butcher algorithm. Correct forever. Verified in
  `easter.test.ts` against five independently-sourced Easter dates and three
  Orthodox ones — don't touch this file without re-running `npm run
  test:easter`.
- `hijri` — `src/data/calendars/hijri.ts`, the tabular ("civil"/Kuwaiti)
  Islamic calendar via Julian Day Number. Correct forever, but **inherently
  approximate** — it can land a day either side of the real moon-sighting
  announcement, which is exactly what the existing `dateVaries` flag exists
  to communicate. `resolveFestivals` sets `dateVaries` automatically for
  every `hijri` template; don't override it to `false`.
- `table` — a hand-sourced Gregorian date per year, for calendars (Hebrew,
  Hindu lunisolar, Chinese lunisolar) this app doesn't compute from first
  principles. **When a template's years run out it silently stops appearing**
  — that's deliberate (an honest gap beats a stale guess) but it means these
  need refreshing periodically. Search a couple of authoritative sources
  before extending a table; don't hand-guess a lunisolar date.

Adding a festival almost always means adding one entry to
`FESTIVAL_TEMPLATES`, not touching the resolver. `countryCodes[0] ===
'GLOBAL'` is the sentinel for "everywhere" — several places in the UI check
for it directly (festival detail's "Celebrated in" card, Discover's country
filter).

## Design system

Source of truth is `festiva_modern/DESIGN.md` from the Stitch export; tokens
live in `src/theme/` and no screen should hardcode a hex or font size.

- **Festiva Orange `#F97316`** is reserved for CTAs, progress and interactive
  state — never decoration.
- **Deep Indigo `#1E1B4B`** anchors typography, headers and navigation.
- Warm tinted ground `#FFF8F6`, pure-white cards, hairline `#E2E8F0` borders.
- Depth is tonal + hairline borders. Shadows only on genuinely floating
  elements, and always ambient (large blur, low opacity, indigo-tinted).
- "Round Eight": 8px core components, 16px large containers, full-round pills.

### Theming — never import `colors` statically into a screen

`StyleSheet.create` runs once at import time, so a stylesheet that bakes in a
colour is frozen to whichever theme loaded first. That is the bug that made the
first dark-mode attempt do nothing.

The rule: stylesheets that use colour are **factories**, resolved through a hook.

```tsx
import { spacing, useTheme, useThemedStyles, type Palette } from '../theme';

function Thing() {
  const styles = useThemedStyles(makeStyles);   // stylesheet colours
  const { colors } = useTheme();                // colours used in JSX
  ...
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: { backgroundColor: colors.surface },
});
```

Every component now resolves colour through `useTheme()` / `useCategoryColor()`;
there are **no static `colors` imports left in `src/components/`**, and
`eventMeta.ts` stores a colour *role* rather than a hex for the same reason.
Keep it that way — a hex read at module scope freezes to whichever theme loaded
first.

`app.json` must keep `"userInterfaceStyle": "automatic"`. Setting it to `"light"`
tells iOS to force the app light, so `useColorScheme()` always returns `light`
and the "Match device" option silently does nothing — with no error to explain
why.

Related gotchas, all of which bit during the migration:
- Default parameters can't call hooks. `color = colors.primary` in a signature
  is frozen — resolve it in the body (`const tint = color ?? colors.primary`).
- Arrow components at module scope (`const Divider = () => …`) can't hold a
  hook; make them `function` declarations.
- Typography carries no colour. `Text` maps each variant to a palette role via
  `variantColorRole`, so text follows the theme automatically.
- `lightPalette` must not be `as const` — literal types would stop `darkPalette`
  from satisfying `Palette`.
- The scheme is resolved in `ThemeProvider`; `mode` is what the user picked
  (`system`/`light`/`dark`), `scheme` is what that resolves to right now.

## Layout

```
app/
  (auth)/        Module 1 — welcome, create-account, sign-in, verify, recover, reset
  onboarding/    Module 2 — country, region, language, interests, festivals, reminders, permissions, complete
  (tabs)/        Home · Calendar · Discover · Events · Profile
  festival/[id]  Module 5 — details & reminders
  event/         Module 7 — personal events
  favorites      Module 6
  notifications  Module 8
src/theme/       colors, typography, spacing/radii/shadows
src/notifications/  schedule.ts (pure, tested) + index.ts (platform)
src/components/  primitives + domain cards + ReminderSheet
src/store/       FestivaStore — single source of truth, + persistence.ts
src/data/        festival templates + resolver, countries, date maths
src/data/calendars/  Easter, tabular Hijri, and the recurrence resolver
src/types/       domain model
```

## Product rules that shape the code

- **Favourites and reminders are independent.** Separate maps in the store. You
  can favourite without a reminder, set a reminder without favouriting, or both.
- **One reminder system**, shared by festivals and personal events
  (`ReminderSheet`). Don't fork it.
- **Personal events are private.** They surface on shared views (like Calendar)
  as "Private event" without exposing details.
- **Global from the start.** No assumed country; dates format via locale;
  festivals that follow lunar calendars carry `dateVaries` and say so rather
  than implying false precision.
- **Design every state**, not just the happy path: loading, empty, error,
  offline, permission-denied, confirmation.
- Countdowns are computed at local midnight (`src/data/dates.ts`) so "days
  until" never drifts by one across timezones.
