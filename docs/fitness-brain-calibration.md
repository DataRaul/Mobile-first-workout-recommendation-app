# Fitness Brain recommendation calibration

This repository consumes reusable training reasoning from `DataRaul/knowledge-core/domains/fitness_strength_conditioning` while remaining authoritative for runtime exercise data, user state, compatibility filters, scoring, programmes and tests.

The Fitness Brain is a development/calibration dependency, **not a live runtime dependency**. The browser app does not call Knowledge Core or an LLM when building a programme. Fitness reasoning is distilled into local, deterministic-enough ranking priors that remain testable and offline-capable.

## Core change in reasoning

Do not treat intrinsic exercise difficulty as recommendation quality.

Runtime ranking now keeps this order of concerns:
1. deterministic compatibility and explicit safety exclusions;
2. requested muscle/training-role fit;
3. goal fit;
4. stage appropriateness and recommendation utility;
5. weekly volume/programming fit;
6. user favorites/preferences and bounded seeded variety.

`src/recommendation-priors.js` supplies an additive stage/utility prior. It deliberately does **not** replace `src/enrichment-rules.js` intrinsic difficulty.

## Stage model

Training months, when available, are a weak prior:
- <2 months: orientation / novice;
- 2–<6 months: early trained;
- 6–<12 months: developing;
- 12+ months: established.

When training months are unavailable, the existing profile experience level is used only as a fallback stage proxy. The current app does not add a new `trainingMonths` onboarding/profile field in this change; doing so is a separate UX/product decision.

These are product routing bands, not biological thresholds. Promotion must not occur solely because time elapsed.

## Integrated recommendation behavior

- Common, stable, teachable and loadable exercises receive a positive novice prior when several candidates satisfy the same role.
- A bounded complexity-2 Starter bridge is allowed only for explicit canonical/loadable exercise families and only when the specific variant remains appropriate. Stable setup by itself is not enough, and a broad familiar name fragment by itself is not enough.
- Unstable variants such as exercise-ball or balance-device versions do not receive the Starter bridge merely because their base movement is common.
- High-skill novelty is penalized as a default recommendation; being an established trainee does not create a requirement to use technically harder exercises.
- Simple machine, cable and isolation exercises remain valid for established trainees when they fit the goal and slot.
- Explicit user-selected splits remain authoritative. Stage priors influence the default split only when a valid explicit structure is absent.
- PPL and higher-frequency splits remain options rather than automatic progression milestones.
- Programme items and replacement candidates retain recommendation stage, score and reason metadata so the UI can explain the choice without recomputing the Brain.
- Existing deterministic equipment, compatibility, quality and safety filters remain authoritative.

## Safety boundary

Pain/injury/rehabilitation remains outside autonomous diagnosis/treatment. Existing deterministic compatibility logic remains in force, and material symptoms or clinician restrictions require appropriate human authority.

## Implemented integration points

The calibration branch now:
1. wires `exerciseRecommendationPrior()` into `chooseExerciseForGroup()` as an additive score/reason source;
2. uses `allowsStageComplexity()` for the bounded profile difficulty gate;
3. applies the same stage/utility prior to replacement ranking;
4. persists recommendation reason/stage metadata in programme prescriptions and replacement metadata;
5. uses `splitStagePrior()` to choose a stage-appropriate default split without hiding or replacing explicit valid presets;
6. preserves seeded variation among sufficiently similar candidates;
7. validates the resulting behavior with self-contained and real-catalogue matrices;
8. semantically audits real-catalogue selections for novice high-skill defaults, unstable novice defaults, bounded Starter bridges, `defaultAvoid` wins and retention of simple productive work for established users.

## Calibration evidence

Latest validated branch coverage includes:
- 1,440 curated realistic programmes across four experience stages, three resistance-training goals, 2–5 training days, 30/45/60-minute sessions, two gym-equipment environments and five seeded variations;
- 30,240 curated exercise slots;
- the existing 4,480-case synthetic programme matrix;
- the pinned real 1,324-exercise catalogue matrix: 4,480 profile/preset cases, 15,680 workouts and 101,920 exercise slots;
- zero unusably short real-catalogue workouts;
- zero real-catalogue planned muscles with zero direct coverage;
- zero avoidable below-coverage cases;
- zero Starter high-skill selections;
- zero Starter unstable-setup selections;
- zero `defaultAvoid` exercises winning automatic programme slots;
- 4,258 bounded Starter-bridge selections on the real matrix, with examples concentrated in canonical families such as supported/cable/dumbbell shoulder presses and incline/bench presses;
- 22,896 real-matrix selections of simple/productive complexity-1/2 exercises for established users, confirming that advanced status does not force novelty or technical escalation.

The real-catalogue matrix still reports 40 below-target coverage cases, all classified as catalogue-limited rather than avoidable. They are concentrated in the Starter + bodyweight + `focused_three_day` shoulder combination, where only one exact eligible shoulder exercise exists for templates requesting repeated direct shoulder slots. This is an exercise-catalogue/product limitation, not evidence that the Fitness Brain needs a new programming rule.

## Failures found and corrected

### 1. Unstable familiar-name false bridge

The first real-catalogue validation exposed a false Starter bridge for `dumbbell incline press on exercise ball`. The movement name matched the broad `incline press` common-default prior, while the actual variant added unstable setup demand.

Correction:
- explicit unstable-setup detection;
- unstable variants cannot receive the bounded Starter bridge;
- unstable setup receives an orientation-stage recommendation penalty;
- regression locked in `scripts/test-recommendation-priors.mjs`.

### 2. Stable-only / broad-name bridge was too permissive

After the first fix, semantic inspection showed that the bridge still admitted examples such as `reverse plank with leg lift` and `dumbbell Arnold press`. Neither was a safety failure, but they demonstrated that merely being stable—or sharing a broad familiar name fragment—was too weak a reason to override the old Starter complexity ceiling.

Correction:
- a separate, narrower `STARTER_BRIDGE_PATTERNS` vocabulary now defines canonical bridge families;
- complexity-2 bridging requires membership in that family **and** progressive loadability;
- high-skill, unstable and `defaultAvoid` variants still fail closed;
- explicit regressions lock out stable novelty and broad-name false positives while retaining appropriate bridges such as bench press and supported shoulder press.

Both failures were app-calibration defects, not Fitness Brain knowledge gaps. The Brain already separates exercise-name familiarity, setup/stability cost, intrinsic difficulty and recommendation utility; the implementation had failed to preserve those distinctions tightly enough.

## Knowledge Core dependency / merge boundary

The downstream implementation can be validated independently because the app has no live Knowledge Core dependency. Final merge sequencing should still respect the repository relationship:

1. reconcile and land the Fitness / Strength & Conditioning P0 Brain in Knowledge Core without overwriting concurrent Sales/Trading/shared-governance work;
2. re-read this app's current `main` and open PRs;
3. merge this calibrated app branch only when the authoritative Fitness Brain state and current app state still agree.

No new Fitness Brain object is currently warranted by the calibration results above.
