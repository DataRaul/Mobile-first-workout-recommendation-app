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
const labelFlag = process.argv.indexOf("--label");
const label = labelFlag >= 0 ? process.argv[labelFlag + 1] : "diagnostic";

if (!sourcePath || !fs.existsSync(sourcePath)) {
  console.error("Usage: node scripts/diagnose-planner-coverage.mjs --source /path/to/exercises.json [--label name]");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const overlay = JSON.parse(fs.readFileSync("data/exercise-enrichment.json", "utf8"));
const overrides = JSON.parse(fs.readFileSync("data/exercise-overrides.json", "utf8"));
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

const bump = (object, key, amount = 1) => {
  object[key] = (object[key] || 0) + amount;
};

let cases = 0;
let below = 0;
let belowWithCapacity = 0;
let companionAway = 0;
let companionAwayWithCapacity = 0;
let scarcity = 0;
let scarcityWithCapacity = 0;
let avoidable = 0;
let avoidableWithCapacity = 0;
const byGroup = {};
const byEquipment = {};
const byGoal = {};
const bySplit = {};
const examples = [];

for (const level of levels) {
  for (const goal of goals) {
    for (let days = 2; days <= 6; days += 1) {
      for (const preset of getSplitPresets(days)) {
        for (const equipmentPreset of equipmentPresets) {
          for (const sessionMinutes of sessionLengths) {
            const profile = {
              name: "Coverage diagnostic",
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
            const eligible = exercises.filter((exercise) =>
              eligibleForProfile(exercise, profile, state, maxComplexity(level)),
            );

            for (const [group, coverage] of Object.entries(program.weeklyCoverage.groups)) {
              if (coverage.status !== "below") continue;
              below += 1;
              bump(byGroup, group);
              bump(byEquipment, equipmentPreset);
              bump(byGoal, goal);
              bump(bySplit, preset.id);
              if (!program.weeklyCoverage.capacityLimited) belowWithCapacity += 1;

              const exactEligible = eligible.filter((exercise) => exercise.app.group === group);
              const perWorkoutRequested = program.workouts.map((workout) =>
                workout.exercises.filter((item) => item.requestedGroup === group).length,
              );
              const maxRequestedSameWorkout = Math.max(0, ...perWorkoutRequested);
              const companionItems = program.workouts.flatMap((workout) =>
                workout.exercises
                  .filter((item) => item.requestedGroup === group && item.groupMatch === "companion")
                  .map((item) => ({
                    workout: workout.name,
                    targetGroup: item.targetGroup,
                    actualGroup: exerciseById.get(item.exerciseId)?.app.group || null,
                  })),
              );
              if (companionItems.length) {
                companionAway += 1;
                if (!program.weeklyCoverage.capacityLimited) companionAwayWithCapacity += 1;
              }

              // If a workout asks for more distinct direct exercises for this muscle than the
              // eligible catalogue contains, the planner cannot satisfy that day without either
              // duplicating an exercise inside one workout or using a companion group.
              const hardScarcity = exactEligible.length < maxRequestedSameWorkout;
              if (hardScarcity) {
                scarcity += 1;
                if (!program.weeklyCoverage.capacityLimited) scarcityWithCapacity += 1;
              } else {
                avoidable += 1;
                if (!program.weeklyCoverage.capacityLimited) avoidableWithCapacity += 1;
              }

              if (examples.length < 30) {
                examples.push({
                  case: cases,
                  level,
                  goal,
                  days,
                  split: preset.id,
                  equipmentPreset,
                  sessionMinutes,
                  capacityLimited: program.weeklyCoverage.capacityLimited,
                  group,
                  slots: coverage.exerciseSlots,
                  planned: coverage.plannedExerciseSlots,
                  min: coverage.min,
                  exactEligible: exactEligible.length,
                  maxRequestedSameWorkout,
                  companionItems,
                  classification: hardScarcity ? "hard_daily_catalogue_scarcity" : "avoidable_allocation_or_variety",
                });
              }
            }
            cases += 1;
          }
        }
      }
    }
  }
}

console.log(JSON.stringify({
  label,
  cases,
  below,
  belowWithCapacity,
  companionAway,
  companionAwayWithCapacity,
  scarcity,
  scarcityWithCapacity,
  avoidable,
  avoidableWithCapacity,
  byGroup,
  byEquipment,
  byGoal,
  bySplit,
  examples,
}, null, 2));
