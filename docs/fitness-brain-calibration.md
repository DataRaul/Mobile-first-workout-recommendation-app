# Fitness Brain recommendation calibration

This repository consumes reusable training reasoning from `DataRaul/knowledge-core/domains/fitness_strength_conditioning` while remaining authoritative for runtime exercise data, user state, compatibility filters, scoring, programmes and tests.

## Core change in reasoning

Do not treat intrinsic exercise difficulty as recommendation quality.

The app should eventually rank in this order:
1. deterministic compatibility and explicit safety exclusions;
2. requested muscle/training-role fit;
3. goal fit;
4. stage appropriateness and recommendation utility;
5. weekly volume/programming fit;
6. user favorites/preferences and bounded variety.

The new `src/recommendation-priors.js` module supplies an additive stage/utility prior for this integration. It deliberately does **not** replace `src/enrichment-rules.js` intrinsic difficulty.

## Stage model

Training months, when available, are a weak prior:
- <2 months: orientation / novice;
- 2–<6 months: early trained;
- 6–<12 months: developing;
- 12+ months: established.

When training months are unavailable, the existing profile experience level is used only as a fallback stage proxy.

These are product routing bands, not biological thresholds. Promotion must not occur solely because time elapsed.

## Recommendation behavior

- Prefer common, stable, teachable and loadable exercises for beginners when several candidates satisfy the same role.
- Allow a carefully bounded bridge to a common complexity-2 exercise even when the old starter ceiling is 1; this addresses the difference between intrinsic difficulty and novice appropriateness.
- Prefer adding reps/load/quality within productive exercises before novelty.
- Do not automatically replace simple machine, cable or isolation exercises for advanced users.
- PPL and higher-frequency splits may become options as needs/schedule evolve but are not mandatory progression milestones.
- Keep several evidence-equivalent alternatives and a small variety/tie-break mechanism; do not turn the Brain into one deterministic universal programme.

## Safety boundary

Pain/injury/rehabilitation remains outside autonomous diagnosis/treatment. Existing deterministic compatibility logic must remain, and material symptoms or clinician restrictions require appropriate human authority.

## Integration sequence

1. Land/approve Fitness Brain P0 in Knowledge Core after concurrency reconciliation.
2. Wire `exerciseRecommendationPrior()` into `chooseExerciseForGroup()` as an additive score/reason source.
3. Replace the strict starter complexity gate with `allowsStageComplexity()` only for bounded starter-bridge candidates.
4. Apply the same stage/utility prior to replacement ranking.
5. Surface recommendation reason codes in programme explanations.
6. Use `splitStagePrior()` to mark recommended presets without hiding other valid presets.
7. Add end-to-end regression tests using the real enriched exercise fixture/matrix.

This staged integration is intentional: the standalone module can be reviewed and tested without colliding with concurrent edits to `programme.js` or `app.js`.
