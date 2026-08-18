# Workout Recommender

Link to app: https://dataraul.github.io/Mobile-first-workout-recommendation-app/

A personal, non-commercial mobile-first workout programme recommender and tracker.

This version replaces the original one-off hypertrophy generator with a complete product flow:

1. onboarding;
2. multi-week programme recommendation;
3. programme review and acceptance;
4. persistent routine;
5. guided daily workouts;
6. set, weight, repetition and RIR tracking;
7. temporary and permanent exercise substitutions;
8. progression and workout history;
9. a searchable library containing all 1,324 source exercises.

## Live deployment

Deploy this static site using **Settings → Pages → Deploy from a branch → main → /(root)**.

## Exercise dataset

The app loads the complete dataset at runtime from:

`https://github.com/hasaneyldrm/exercises-dataset`

The source dataset remains unchanged. `src/dataset.js` creates an application-side enrichment layer for:

- normalized muscle groups;
- movement patterns;
- estimated complexity;
- programme-goal suitability;
- conservative pain and movement flags.

This means all 1,324 exercises remain visible in **Exercises**, while the programme engine selects only exercises compatible with the active profile.

The enrichment is heuristic and is not medical advice.

### Reproducible enrichment audit

Enrichment version 3.1 evaluates every source exercise from three separate angles:

1. technical skill and coordination;
2. relative-strength accessibility, including how much bodyweight must be supported or moved;
3. mechanical demand from stability, impact, loading, range, fatigue and setup.

The app-facing difficulty is the most demanding of those three angles. Mobility work is capped at level 2, and level 4 requires an explicit expert skill/strength pattern or agreement from two assessment angles. This makes the experience-level filter conservative without treating every dumbbell, cable, unilateral or kneeling exercise as advanced.

The previous version is frozen at `data/enrichment-baselines/exercise-enrichment-v3.0.json`. The complete before/after counts, transitions, changed record IDs and muscle-group matrix are stored in `data/enrichment-audit.json`.

To reproduce the enrichment from an already downloaded upstream dataset:

```bash
npm run enrichment:rerun -- --source /path/to/exercises.json
npm run enrichment:check -- --source /path/to/exercises.json
```

Without `--source`, the generator reads the attributed upstream JSON URL. It validates that all 1,324 IDs are present and records the exact input, baseline and output SHA-256 hashes in the metadata.

## Supported programme goals

- Strength
- Hypertrophy
- Power and athleticism
- Muscular endurance
- General fitness
- Conditioning
- Mobility and recovery

### In-app guidance

Profile creation explains the selected goal at the point of choice, including its outcome, usual repetition or timed range, rest and programme length. **Compare all goals** opens the complete seven-goal comparison without discarding unsaved profile choices.

The reusable **Guide & help** dialog has two sections:

- **How it works** follows the user from profile creation through recommendation review, acceptance, workout logging and the next-programme comparison;
- **Training goals** explains when each goal is appropriate and how it changes prescriptions.

The Guide remains available from Profile but does not add another primary navigation item. The bottom navigation stays limited to Today, Routine, Progress, Exercises and Profile.

## Programme flow

Before acceptance, the user may review or regenerate a complete programme. After **Accept programme**, it becomes a persistent 8–16-week routine. The normal home action then becomes **Start workout** or **Resume workout**, rather than generating a new random session.

### Weekly muscle coverage

The recommender plans muscle slots across the complete week before choosing exercises. This prevents a short workout from repeatedly dropping the final muscle in a day template and makes the trade-off between training days, session length and direct muscle work visible.

- complete-body plans target two to three direct exercise slots per planned muscle when weekly capacity allows;
- 30-minute and otherwise capacity-limited schedules display the reduced direct-coverage range explicitly;
- every workout displays its recommended muscle groups and exercise count per group;
- a weekly coverage summary reports direct exercise slots, unique exercises, days trained and direct sets;
- the existing effective-set summary separately counts primary, strong-secondary and stabilising work;
- the selected experience level is a hard maximum: the automatic generator and default substitutions may use simpler exercises but never a harder level;
- if equipment, goal and safety filters exhaust safe distinct candidates, the programme shows the shortfall instead of weakening the filters.

Preset mobility programmes use a full-body mobility rotation instead of forcing strength-oriented Push/Pull/Legs or limb-isolation slots onto a catalogue that does not contain equivalent mobility work for every muscle. Explicit custom muscle structures remain strict.

Repetition prescriptions are prefilled from the selected objective while weight remains blank. Hypertrophy uses 6–10 repetitions for main or compound lifts and 10–15 for accessory or isolation work. Strength and power retain lower main-movement ranges with 6–10-repetition accessory fallbacks; endurance, general fitness, conditioning and mobility retain their goal-specific repetition or timed ranges.

### Programme follow-up

After the final planned session, the completed programme becomes the single previous-programme snapshot and the recommender creates the next draft from the current profile. The review screen compares both programmes by workout and training slot, showing retained, replaced, added, removed and prescription-adjusted exercises.

Only exact retained exercises carry their last completed weight, repetitions and RIR into their first occurrence in the new programme. Replacement exercises show the previous performance for context but start with blank set values. When the new programme later finishes, it replaces the older snapshot, so programme chaining does not require a server or separate database.

## Substitution behaviour

- **Replace for today** changes only the active session.
- **Replace in routine** updates future instances of that workout template.
- **Not available at this gym** records the exercise/machine variant as unavailable and permanently replaces it.

## Storage

Profiles, programmes, sessions, gym observations and history are stored in browser `localStorage` on the current phone or computer. During profile creation, the user can keep the live profile in that browser only or also create a portable JSON backup. Compatible desktop browsers open a Save dialog; mobile and other browsers use their normal Downloads location. The Profile screen always identifies the live storage location and supports JSON export/import.

There is no account or cloud sync. Clearing the browser's site data removes the local copy unless a JSON backup was created.

The 1,324-exercise JSON and media are loaded from the source repository and can be cached by the service worker. They are not duplicated in this repository.

## Validation

```bash
npm run validate
```

The default suite includes a deterministic 4,480-combination fixture matrix. The same matrix can be run against a downloaded copy of the attributed 1,324-exercise source:

```bash
npm run test:matrix -- --source /path/to/exercises.json
```

## Medical disclaimer

This app is a planning and tracking aid, not medical advice. Automated safety flags are conservative text-based heuristics. They do not establish that an exercise is safe for a specific person. Stop if symptoms increase and follow guidance from a qualified clinician or physiotherapist.

## Licence and use

This project is intended for personal, educational and non-commercial use. See `NOTICE.md` and retain the source dataset/media attribution.

## V2.1 usability flow

- Draft programme recommendations are saved automatically in browser storage.
- **Continue later** returns to a Today landing screen rather than losing the recommendation.
- **Today**, **Routine**, **Profile**, and the header brand can recover a saved draft when no programme has been accepted.
- Every recommended exercise displays an explicit app-derived complexity level from 1/4 to 4/4.
- The selected experience level acts as a hard maximum complexity filter.
- Programme review, routine editing, and active workouts offer a direct substitute picker.
- Substitute choices are filtered by muscle or movement similarity, goal, equipment, pain constraints, and complexity cap.

## Rest timer and live-set UX (3.9.0)

The rest timer is an optional workout aid, not a progression gate. Profile and first-time setup now expose **Use rest timer**, an optional persistent default rest override, and **Keep screen awake during workout**. Leaving the override blank preserves the programme's goal-based rest prescription. A user override changes execution timing only; the programme recommendation stays separate.

Active timer state is stored inside the active workout session with status, start timestamp, absolute deadline, configured duration and programme recommendation. Visible `setInterval()` callbacks only repaint the countdown. Elapsed-time truth comes from `Date.now()` versus the persisted deadline, and `visibilitychange`, window focus and `pageshow` reconcile the state after suspension or reload. A timer that expires while the app is suspended is immediately completed when execution resumes.

Mobile browsers and installed PWAs may suspend JavaScript while the phone is locked. The app therefore does **not** claim continuous background JavaScript or guaranteed background sound/vibration. The timer preserves correct wall-clock elapsed time across suspension. Vibration is best-effort when completion is observed while JavaScript can run. The optional Screen Wake Lock request can keep the display awake during an active workout on supported browsers and gracefully does nothing elsewhere.

During a workout the existing set-entry card is now before exercise media, technique, previous performance and notes. Exercise name, set context, prescription, weight, reps, RIR and the complete-set action are therefore the first training controls. The current incomplete set is highlighted, decimal loads remain supported, and a completed set prefills the next blank set's load without changing completed history.

Timer controls support Start, Pause/Resume, Reset, Skip, +15 seconds, -15 seconds and direct duration editing. Completing a working set starts the configured timer only when the preference is enabled, and timer completion is never required to continue.

### Manual phone acceptance

1. **No timer:** disable **Use rest timer**, start a workout, complete several sets and confirm no timer interrupts set logging.
2. **40 seconds:** enable the timer, set the default override to 40 seconds, complete a set and confirm the timer starts from 40 while the programme rest target remains visible separately.
3. **Screen off:** start a 90-second timer, wait roughly 20 seconds, lock/background the phone, return later and confirm remaining time is derived from the original deadline.
4. **Deadline passes off-screen:** start a short timer, keep the phone locked beyond the deadline, reopen and confirm it is immediately complete rather than resuming an old visible count.
5. **Active-set clarity:** on a normal phone viewport confirm exercise name, current set, prescription, weight, reps, RIR and Complete are visible before media, technique and history dominate the screen.
