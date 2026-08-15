import assert from "node:assert/strict";
import fs from "node:fs";

import { enrichExercise } from "../src/dataset.js";
import {
  defaultWorkoutDays,
  eligibleForProfile,
  generateProgram,
  getSplitPresets,
  maxComplexity,
} from "../src/programme.js";

const sourceFlag = process.argv.indexOf("--source");
const sourcePath = sourceFlag >= 0 ? process.argv[sourceFlag + 1] : null;

if (!sourcePath || !fs.existsSync(sourcePath)) {
  console.error("Usage: node scripts/test-recommendation-matrix.mjs --source /path/to/exercises.json");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const overlay = JSON.parse(fs.readFileSync("data/exercise-enrichment.json", "utf8"));
const overrides = JSON.parse(fs.readFileSync("data/exercise-overrides.json", "utf8"));
assert.equal(raw.length, 1324, "the real recommendation matrix requires all 1,324 exercises");

const exercises = raw.map((exercise) =>
  enrichExercise(
    exercise,
    overlay[String(exercise.id)] || null,
    overrides[String(exercise.id)] || null,
  ),
);
const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
const state = { gym: { unavailableExerciseIds: [] } };
const goals = ["strength", "hypertrophy", "power", "endurance", "general", "conditioning", "mobility"];
const levels = ["starter", "intermediate", "advanced", "pro"];
const sessionLengths = [30, 45, 60, 75];
const equipmentPresets = ["full_gym", "machines", "home_dumbbells", "bodyweight"];

let cases = 0;
let workouts = 0;
let exerciseSlots = 0;
let scheduleLimitedCases = 0;
let belowCoverageGroups = 0;
let belowCoverageWithCapacity = 0;
let catalogueLimitedBelowCoverage = 0;
let catalogueLimitedBelowWithCapacity = 0;
let avoidableBelowCoverage = 0;
let avoidableBelowWithCapacity = 0;
const belowWithCapacityExamples = [];
const catalogueLimitedExamples = [];
const avoidableBelowExamples = [];
let underfilledWorkouts = 0;
let minimumWorkoutExercises = Number.POSITIVE_INFINITY;
const underfilledExamples = [];
const belowCoverageBySplit = {};
let zeroCoverageGroups = 0;
const zeroCoverageByGoal = {};
const zeroCoverageByEquipment = {};
const zeroCoverageExamples = [];

for (const level of levels) {
  for (const goal of goals) {
    for (let days = 2; days <= 6; days += 1) {
      for (const preset of getSplitPresets(days)) {
        for (const equipmentPreset of equipmentPresets) {
          for (const sessionMinutes of sessionLengths) {
            const profile = {
              name: "Matrix",
              level,
              goal,
              daysPerWeek: days,
              sessionMinutes,
              durationWeeks: 12,
              equipmentPreset,
              equipment: [],
              constraints: [],
              favorites: [],
              splitPreset: preset.id,
              workoutDays: defaultWorkoutDays(days, preset.id),
            };
            const program = generateProgram(exercises, profile, state, cases % 3);
            const expectedExercises = sessionMinutes <= 30 ? 5 : sessionMinutes <= 45 ? 6 : sessionMinutes <= 60 ? 7 : 8;
            const eligibleExercises = exercises.filter((exercise) =>
              eligibleForProfile(exercise, profile, state, maxComplexity(level)),
            );

            assert.equal(program.workouts.length, days, `case ${cases}: workout-day count`);
            for (const workout of program.workouts) {
              minimumWorkoutExercises = Math.min(minimumWorkoutExercises, workout.exercises.length);
              assert.ok(workout.exercises.length >= 3, `case ${cases}: unusably short workout`);
              if (workout.exercises.length < expectedExercises) {
                assert.equal(
                  workout.availabilityShortfall,
                  expectedExercises - workout.exercises.length,
                  `case ${cases}: availability shortfall`,
                );
                underfilledWorkouts += 1;
                if (underfilledExamples.length < 10) {
                  underfilledExamples.push({
                    case: cases,
                    level,
                    goal,
                    days,
                    split: preset.id,
                    equipmentPreset,
                    sessionMinutes,
                    workout: workout.name,
                    exercises: workout.exercises.length,
                    requested: expectedExercises,
                  });
                }
              }
            }

            for (const item of program.workouts.flatMap((workout) => workout.exercises)) {
              const exercise = exerciseById.get(item.exerciseId);
              assert.ok(exercise, `case ${cases}: selected exercise exists`);
              assert.ok(
                exercise.app.complexity <= maxComplexity(level),
                `case ${cases}: ${exercise.name} exceeded the ${level} difficulty ceiling`,
              );
            }

            const coverageEntries = Object.entries(program.weeklyCoverage.groups);
            const coverage = coverageEntries.map(([, values]) => values);
            assert.equal(
              program.weeklyCoverage.availabilityShortfall,
              program.workouts.reduce((total, workout) => total + workout.availabilityShortfall, 0),
              `case ${cases}: weekly availability shortfall`,
            );
            if (program.weeklyCoverage.capacityLimited) scheduleLimitedCases += 1;
            const belowEntries = coverageEntries.filter(([, group]) => group.status === "below");
            const below = belowEntries.length;
            belowCoverageGroups += below;
            if (!program.weeklyCoverage.capacityLimited) {
              belowCoverageWithCapacity += below;
              if (below && belowWithCapacityExamples.length < 10) {
                belowWithCapacityExamples.push({
                  case: cases,
                  level,
                  goal,
                  days,
                  split: preset.id,
                  equipmentPreset,
                  sessionMinutes,
                  groups: belowEntries.map(([group, values]) => ({
                    group,
                    slots: values.exerciseSlots,
                    min: values.min,
                  })),
                });
              }
            }

            for (const [group, values] of belowEntries) {
              const exactEligible = eligibleExercises.filter(
                (exercise) => exercise.app.group === group,
              ).length;
              const maxRequestedSameWorkout = Math.max(
                0,
                ...program.workouts.map(
                  (workout) =>
                    workout.exercises.filter((item) => item.requestedGroup === group).length,
                ),
              );
              const catalogueLimited = exactEligible < maxRequestedSameWorkout;
              const diagnostic = {
                case: cases,
                level,
                goal,
                days,
                split: preset.id,
                equipmentPreset,
                sessionMinutes,
                group,
                slots: values.exerciseSlots,
                min: values.min,
                planned: values.plannedExerciseSlots,
                exactEligible,
                maxRequestedSameWorkout,
              };

              if (catalogueLimited) {
                catalogueLimitedBelowCoverage += 1;
                if (!program.weeklyCoverage.capacityLimited) catalogueLimitedBelowWithCapacity += 1;
                if (catalogueLimitedExamples.length < 10) catalogueLimitedExamples.push(diagnostic);
              } else {
                avoidableBelowCoverage += 1;
                if (!program.weeklyCoverage.capacityLimited) avoidableBelowWithCapacity += 1;
                if (avoidableBelowExamples.length < 10) avoidableBelowExamples.push(diagnostic);
              }
            }

            belowCoverageBySplit[preset.id] = (belowCoverageBySplit[preset.id] || 0) + below;
            const zeroGroups = coverageEntries
              .filter(([, group]) => group.exerciseSlots === 0)
              .map(([group]) => group);
            zeroCoverageGroups += zeroGroups.length;
            zeroCoverageByGoal[goal] = (zeroCoverageByGoal[goal] || 0) + zeroGroups.length;
            zeroCoverageByEquipment[equipmentPreset] =
              (zeroCoverageByEquipment[equipmentPreset] || 0) + zeroGroups.length;
            if (zeroGroups.length && zeroCoverageExamples.length < 10) {
              zeroCoverageExamples.push({
                case: cases,
                level,
                goal,
                days,
                split: preset.id,
                equipmentPreset,
                sessionMinutes,
                groups: zeroGroups,
              });
            }
            workouts += program.workouts.length;
            exerciseSlots += program.weeklyCoverage.totalExerciseSlots;
            cases += 1;
          }
        }
      }
    }
  }
}

assert.equal(cases, 4480);
assert.equal(zeroCoverageGroups, 0, "every planned muscle must receive direct coverage or a surfaced companion");
assert.equal(underfilledWorkouts, 0, "preset combinations must fill their requested workout capacity");
assert.ok(minimumWorkoutExercises >= 5, "preset workouts must retain at least five exercises");
assert.equal(
  avoidableBelowCoverage,
  0,
  "no planned muscle may fall below its direct-coverage minimum merely to increase exercise variety",
);
console.log(JSON.stringify({
  cases,
  workouts,
  exerciseSlots,
  scheduleLimitedCases,
  belowCoverageGroups,
  belowCoverageWithCapacity,
  catalogueLimitedBelowCoverage,
  catalogueLimitedBelowWithCapacity,
  avoidableBelowCoverage,
  avoidableBelowWithCapacity,
  belowWithCapacityExamples,
  catalogueLimitedExamples,
  avoidableBelowExamples,
  belowCoverageBySplit,
  zeroCoverageGroups,
  zeroCoverageByGoal,
  zeroCoverageByEquipment,
  zeroCoverageExamples,
  underfilledWorkouts,
  minimumWorkoutExercises,
  underfilledExamples,
}, null, 2));
console.log("Real 1,324-exercise recommendation matrix passed.");
