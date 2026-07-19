# Workout Recommender

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

## Supported programme goals

- Strength
- Hypertrophy
- Power and athleticism
- Muscular endurance
- General fitness
- Conditioning
- Mobility and recovery

## Programme flow

Before acceptance, the user may review or regenerate a complete programme. After **Accept programme**, it becomes a persistent 8–16-week routine. The normal home action then becomes **Start workout** or **Resume workout**, rather than generating a new random session.

## Substitution behaviour

- **Replace for today** changes only the active session.
- **Replace in routine** updates future instances of that workout template.
- **Not available at this gym** records the exercise/machine variant as unavailable and permanently replaces it.

## Storage

Profiles, programmes, sessions, gym observations and history are stored in browser `localStorage`. The Profile screen supports JSON export/import.

The 1,324-exercise JSON and media are loaded from the source repository and can be cached by the service worker. They are not duplicated in this repository.

## Validation

```bash
npm run validate
```

## Medical disclaimer

This app is a planning and tracking aid, not medical advice. Automated safety flags are conservative text-based heuristics. They do not establish that an exercise is safe for a specific person. Stop if symptoms increase and follow guidance from a qualified clinician or physiotherapist.

## Licence and use

This project is intended for personal, educational and non-commercial use. See `NOTICE.md` and retain the source dataset/media attribution.
