import assert from "node:assert/strict";

import {
  defaultWorkoutDays,
  eligibleForProfile,
  generateProgram,
  maxComplexity,
  replacementOptions,
} from "../src/programme.js";
import {
  allowsStageComplexity,
  exerciseRecommendationPrior,
  trainingStage,
} from "../src/recommendation-priors.js";

const state = { gym: { unavailableExerciseIds: [] } };
let nextId = 1;

function fixture({
  name,
  equipment,
  group,
  movement,
  roles,
  complexity = 1,
  type = "accessory",
  stability = "low",
  loadability = "high",
  supported = true,
  defaultAvoid = false,
}) {
  return {
    id: `fitness-${String(nextId++).padStart(4, "0")}`,
    name,
    equipment,
    app: {
      group,
      movement,
      trainingRoles: roles,
      goalTags: ["general", "hypertrophy", "strength", "endurance"],
      complexity,
      exerciseType: type,
      mechanics: {
        stability,
        loadability,
        supported,
        impact: "low",
        fatigueCost: type === "main_lift" ? "moderate" : "low",
      },
      programming: {
        defaultAvoid,
        orderPriority: type === "main_lift" ? 1 : type === "compound_accessory" ? 2 : 3,
      },
      quality: { confidence: "high", reviewStatus: "reviewed" },
      setCredits: { [group]: 1 },
      compatibility: {},
      safetyFlags: [],
      cautionFlags: [],
    },
  };
}

const canonical = [
  ["Leverage machine incline chest press", "leverage machine", "chest", "horizontal_push", ["chest_incline_press"], 1, "compound_accessory"],
  ["Leverage machine chest press", "leverage machine", "chest", "horizontal_push", ["chest_horizontal_press"], 1, "compound_accessory"],
  ["Cable chest fly", "cable", "chest", "isolation", ["chest_adduction"], 1, "isolation"],
  ["Smith machine decline chest press", "smith machine", "chest", "horizontal_push", ["chest_decline_press"], 1, "compound_accessory"],
  ["Barbell bench press", "barbell", "chest", "horizontal_push", ["chest_horizontal_press"], 2, "main_lift", "moderate", "high", false],
  ["Seated cable row", "cable", "back", "horizontal_pull", ["back_horizontal_pull"], 1, "compound_accessory"],
  ["Lat pulldown", "leverage machine", "back", "vertical_pull", ["back_vertical_pull"], 1, "compound_accessory"],
  ["Cable face pull", "cable", "back", "horizontal_pull", ["back_upper_rear"], 1, "accessory"],
  ["Straight arm cable pulldown", "cable", "back", "vertical_pull", ["back_lat_isolation"], 1, "isolation"],
  ["Leverage machine shoulder press", "leverage machine", "shoulders", "vertical_push", ["shoulder_press"], 1, "compound_accessory"],
  ["Cable lateral raise", "cable", "shoulders", "isolation", ["shoulder_lateral_raise"], 1, "isolation"],
  ["Reverse pec deck", "leverage machine", "shoulders", "horizontal_pull", ["shoulder_rear_delt"], 1, "isolation"],
  ["Cable front raise", "cable", "shoulders", "isolation", ["shoulder_front_raise"], 1, "isolation"],
  ["Cable biceps curl", "cable", "biceps", "elbow_flexion", ["biceps_lengthened", "biceps_supinated"], 1, "isolation"],
  ["Cable hammer curl", "cable", "biceps", "elbow_flexion", ["biceps_neutral"], 1, "isolation"],
  ["Cable preacher biceps curl", "cable", "biceps", "elbow_flexion", ["biceps_shortened"], 1, "isolation"],
  ["Cable reverse biceps curl", "cable", "forearms", "elbow_flexion", ["biceps_pronated", "forearms_grip"], 1, "isolation"],
  ["Cable triceps pushdown", "cable", "triceps", "elbow_extension", ["triceps_pushdown"], 1, "isolation"],
  ["Cable overhead triceps extension", "cable", "triceps", "elbow_extension", ["triceps_overhead"], 1, "isolation"],
  ["Smith close grip press", "smith machine", "triceps", "horizontal_push", ["triceps_press"], 1, "compound_accessory"],
  ["Leg press", "sled machine", "quads", "knee_dominant", ["legs_knee_dominant"], 1, "compound_accessory"],
  ["Hack squat", "sled machine", "quads", "knee_dominant", ["legs_knee_dominant"], 2, "compound_accessory"],
  ["Leg extension", "leverage machine", "quads", "knee_extension", ["legs_knee_extension"], 1, "isolation"],
  ["Seated leg curl", "leverage machine", "hamstrings", "knee_flexion", ["legs_knee_flexion"], 1, "isolation"],
  ["Romanian deadlift", "barbell", "hamstrings", "hip_hinge", ["legs_hip_dominant"], 2, "main_lift", "moderate", "high", false],
  ["Hip thrust", "smith machine", "glutes", "hip_hinge", ["legs_hip_dominant", "legs_glute_isolation"], 1, "compound_accessory"],
  ["Cable glute kickback", "cable", "glutes", "isolation", ["legs_glute_isolation"], 1, "isolation"],
  ["Seated hip adduction", "leverage machine", "adductors", "hip_adduction", ["legs_adductors"], 1, "isolation"],
  ["Seated hip abduction", "leverage machine", "abductors", "hip_abduction", ["legs_abductors"], 1, "isolation"],
  ["Standing calf raise", "leverage machine", "calves", "plantar_flexion", ["legs_calves"], 1, "isolation"],
  ["Cable plank", "cable", "core", "anti_extension", ["core_anti_extension"], 1, "accessory"],
  ["Pallof cable press", "cable", "core", "trunk_rotation", ["core_rotation"], 1, "accessory"],
  ["Cable crunch", "cable", "core", "trunk_flexion", ["core_flexion"], 1, "isolation"],
  ["Captain chair knee raise", "assisted", "core", "hip_flexion_core", ["core_hip_raise"], 2, "accessory"],
];

const exercises = [];
for (let copy = 0; copy < 4; copy += 1) {
  for (const [name, equipment, group, movement, roles, complexity, type, stability, loadability, supported] of canonical) {
    exercises.push(fixture({
      name: `${name} ${String.fromCharCode(65 + copy)}`,
      equipment,
      group,
      movement,
      roles,
      complexity,
      type,
      stability: stability || "low",
      loadability: loadability || "high",
      supported: supported ?? true,
    }));
  }
}

const highSkillDecoys = [
  ["Full planche", "core", "anti_extension", ["core_anti_extension"]],
  ["Strict muscle-up", "back", "vertical_pull", ["back_vertical_pull"]],
  ["Handstand push-up", "shoulders", "vertical_push", ["shoulder_press"]],
  ["Pistol squat", "quads", "knee_dominant", ["legs_knee_dominant"]],
  ["Dragon flag", "core", "anti_extension", ["core_anti_extension"]],
];
for (const [name, group, movement, roles] of highSkillDecoys) {
  exercises.push(fixture({
    name,
    equipment: "body weight",
    group,
    movement,
    roles,
    complexity: 4,
    type: "main_lift",
    stability: "high",
    loadability: "low",
    supported: false,
  }));
}

const avoided = fixture({
  name: "Novel unstable chest press drill",
  equipment: "cable",
  group: "chest",
  movement: "horizontal_push",
  roles: ["chest_horizontal_press"],
  complexity: 1,
  type: "accessory",
  defaultAvoid: true,
});
exercises.push(avoided);

const starter = {
  name: "Starter calibration",
  level: "starter",
  trainingMonths: 1,
  goal: "general",
  daysPerWeek: 3,
  sessionMinutes: 45,
  durationWeeks: 12,
  equipmentPreset: "full_gym",
  equipment: [],
  constraints: [],
  favorites: [],
};

const bench = exercises.find((exercise) => exercise.name.startsWith("Barbell bench press"));
assert.ok(bench, "bridge fixture should exist");
assert.equal(maxComplexity("starter"), 1);
assert.equal(allowsStageComplexity(bench, starter, 1), true, "common complexity-2 bench should be a bounded starter bridge");
assert.equal(eligibleForProfile(bench, starter, state, 1), true, "runtime eligibility should consume the stage-aware bridge");

const planche = exercises.find((exercise) => exercise.name === "Full planche");
assert.equal(eligibleForProfile(planche, starter, state, 1), false, "high-skill complexity must stay outside Starter eligibility");
assert.ok(
  exerciseRecommendationPrior(exercises[0], starter).score > exerciseRecommendationPrior(planche, starter).score,
  "common stable exercise should retain a stronger novice prior than high-skill novelty",
);

const defaultStarter = generateProgram(exercises, starter, state, 0);
assert.equal(defaultStarter.trainingStage, "orientation");
assert.ok(defaultStarter.workoutDays[0].name.startsWith("Full Body"), "orientation default should remain full-body led");
assert.ok(defaultStarter.recommendedSplitIds.includes("full_body_rotation"));

const establishedDefault = generateProgram(
  exercises,
  { ...starter, level: "pro", trainingMonths: 24 },
  state,
  0,
);
assert.equal(establishedDefault.trainingStage, "established");
assert.equal(establishedDefault.workoutDays[1].type, "upper", "later-stage 3-day default may prefer Full/Upper/Lower");
assert.ok(establishedDefault.recommendedSplitIds.includes("push_pull_legs"), "PPL should be available as an option, not a compulsory promotion");

const explicitPpl = generateProgram(
  exercises,
  {
    ...starter,
    splitPreset: "push_pull_legs",
    workoutDays: defaultWorkoutDays(3, "push_pull_legs"),
  },
  state,
  0,
);
assert.equal(explicitPpl.workoutDays[0].type, "push", "explicit user split must not be overwritten by the stage prior");

const selectedNames = (program) => program.workouts.flatMap((workout) => workout.exercises).map((item) =>
  exercises.find((exercise) => exercise.id === item.exerciseId)?.name || "",
);
assert.ok(
  !selectedNames(defaultStarter).some((name) => highSkillDecoys.some(([pattern]) => name.includes(pattern))),
  "orientation programme must not select high-skill decoys",
);
assert.ok(!selectedNames(defaultStarter).includes(avoided.name), "default-avoid novelty should not win a normal recommendation slot");
for (const item of defaultStarter.workouts.flatMap((workout) => workout.exercises)) {
  assert.equal(item.recommendationStage, "orientation");
  assert.ok(Array.isArray(item.recommendationReasons), "programme prescriptions should retain recommendation reason codes");
}

const currentChest = exercises.find((exercise) => exercise.name.startsWith("Smith machine decline chest press"));
const starterReplacementOptions = replacementOptions(
  exercises,
  currentChest.id,
  [],
  starter,
  state,
  starter.goal,
  50,
  "profile",
  "chest",
  "chest_horizontal_press",
  ["chest", "shoulders", "back", "core"],
  "chest",
);
assert.ok(starterReplacementOptions.length > 0);
assert.ok(
  starterReplacementOptions.every((exercise) => allowsStageComplexity(exercise, starter, 1)),
  "profile replacements must respect the stage-aware gate",
);
assert.ok(
  starterReplacementOptions[0]._replacement.recommendationStage === "orientation" &&
    Array.isArray(starterReplacementOptions[0]._replacement.recommendationReasons),
  "replacement ranking should expose the same Fitness prior metadata",
);

const levels = [
  ["starter", 1],
  ["intermediate", 4],
  ["advanced", 8],
  ["pro", 24],
];
const goals = ["general", "hypertrophy", "strength"];
const dayOptions = [2, 3, 4, 5];
const sessionLengths = [30, 45, 60];
const equipmentPresets = ["full_gym", "machines"];
let cases = 0;
let slots = 0;
let bridgeSelections = 0;
let stableSimpleEstablishedSelections = 0;
const fingerprints = new Set();

for (const [level, trainingMonths] of levels) {
  for (const goal of goals) {
    for (const daysPerWeek of dayOptions) {
      for (const sessionMinutes of sessionLengths) {
        for (const equipmentPreset of equipmentPresets) {
          for (let variation = 0; variation < 5; variation += 1) {
            const profile = {
              name: "Fitness calibration matrix",
              level,
              trainingMonths,
              goal,
              daysPerWeek,
              sessionMinutes,
              durationWeeks: 12,
              equipmentPreset,
              equipment: [],
              constraints: [],
              favorites: [],
            };
            const program = generateProgram(exercises, profile, state, variation);
            assert.equal(program.workouts.length, daysPerWeek, `case ${cases}: expected workout-day count`);
            assert.equal(program.trainingStage, trainingStage(profile), `case ${cases}: stage metadata`);
            assert.ok(program.recommendedSplitIds.length > 0, `case ${cases}: split priors should be retained`);

            const ids = [];
            for (const item of program.workouts.flatMap((workout) => workout.exercises)) {
              const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
              assert.ok(exercise, `case ${cases}: selected exercise exists`);
              assert.ok(
                allowsStageComplexity(exercise, profile, maxComplexity(level)),
                `case ${cases}: ${exercise.name} violated the stage-aware complexity gate`,
              );
              assert.equal(item.recommendationStage, trainingStage(profile), `case ${cases}: item stage metadata`);
              assert.ok(Array.isArray(item.recommendationReasons), `case ${cases}: item reasons metadata`);
              assert.ok(!exercise.app.programming.defaultAvoid, `case ${cases}: default-avoid exercise selected`);
              if (trainingStage(profile) === "orientation") {
                assert.ok(
                  !highSkillDecoys.some(([pattern]) => exercise.name.includes(pattern)),
                  `case ${cases}: novice selected ${exercise.name}`,
                );
              }
              const prior = exerciseRecommendationPrior(exercise, profile);
              if (prior.starterBridge) bridgeSelections += 1;
              if (
                trainingStage(profile) === "established" &&
                exercise.app.complexity <= 2 &&
                (prior.commonDefault || prior.stableSetup)
              ) {
                stableSimpleEstablishedSelections += 1;
              }
              ids.push(item.exerciseId);
              slots += 1;
            }
            fingerprints.add(`${level}:${goal}:${daysPerWeek}:${sessionMinutes}:${equipmentPreset}:${ids.join(",")}`);
            cases += 1;
          }
        }
      }
    }
  }
}

assert.equal(cases, 1440, `expected 1,440 Fitness calibration programmes, received ${cases}`);
assert.ok(slots > 30000, `expected broad exercise-slot coverage, received ${slots}`);
assert.ok(stableSimpleEstablishedSelections > 0, "established programmes should continue to use simple productive exercises");
assert.ok(fingerprints.size > 288, "seeded variation should preserve more than one programme fingerprint across the matrix");

console.log(
  `Fitness recommendation calibration: ${cases.toLocaleString()} programmes, ${slots.toLocaleString()} exercise slots, ${bridgeSelections.toLocaleString()} bounded starter-bridge selections, ${fingerprints.size.toLocaleString()} distinct fingerprints passed.`,
);
