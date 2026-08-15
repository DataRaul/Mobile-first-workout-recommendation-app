import { enrichExercise } from "../src/dataset.js";
import {
  defaultWorkoutDays,
  generateProgram,
  getSplitPresets,
  maxComplexity,
  replacementOptions,
} from "../src/programme.js";

const equipment = ["body weight", "dumbbell", "barbell", "cable", "leverage machine", "smith machine"];
const groups = [
  ["chest", "pectorals"], ["back", "lats"], ["shoulders", "delts"],
  ["upper arms", "biceps"], ["upper arms", "triceps"], ["upper legs", "quads"],
  ["upper legs", "hamstrings"], ["upper legs", "glutes"], ["lower legs", "calves"],
  ["waist", "abs"], ["upper legs", "adductors"], ["upper legs", "abductors"]
];
const raw = [];
let id = 1;
for (let repeat = 0; repeat < 20; repeat++) {
  for (const [category, target] of groups) {
    raw.push({
      id: String(id++).padStart(4, "0"),
      name: `${equipment[repeat % equipment.length]} ${target} exercise ${repeat}`,
      category,
      body_part: category,
      equipment: equipment[repeat % equipment.length],
      target,
      muscle_group: target,
      secondary_muscles: [],
      instructions: { en: "Perform with control." },
      instruction_steps: { en: ["Perform with control."] },
      image: "images/test.jpg",
      gif_url: "videos/test.gif"
    });
  }
}
for (let repeat = 0; repeat < 5; repeat++) {
  for (const [category, target] of groups) {
    raw.push({
      id: String(id++).padStart(4, "0"),
      name: `body weight ${target} stretch ${repeat}`,
      category,
      body_part: category,
      equipment: "body weight",
      target,
      muscle_group: target,
      secondary_muscles: [],
      instructions: { en: "Move through a comfortable range with control." },
      instruction_steps: { en: ["Move through a comfortable range with control."] },
      image: "images/test.jpg",
      gif_url: "videos/test.gif"
    });
  }
}
const exercises = raw.map(enrichExercise);
const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
const base = {
  name: "Test", level: "pro", daysPerWeek: 4, sessionMinutes: 60,
  durationWeeks: 12, equipmentPreset: "full_gym", equipment: [], constraints: [], favorites: []
};
const state = { gym: { unavailableExerciseIds: [] } };
for (const goal of ["strength", "hypertrophy", "power", "endurance", "general", "conditioning", "mobility"]) {
  const program = generateProgram(exercises, { ...base, goal }, state, 0);
  if (program.workouts.length !== 4) throw new Error(`${goal}: expected four workouts`);
  if (program.workouts.some(workout => workout.exercises.length < 5)) throw new Error(`${goal}: too few exercises`);
}
const starterProgram = generateProgram(exercises, { ...base, level: "starter", goal: "general" }, state, 0);
if (starterProgram.workouts.some(workout => workout.exercises.length < 5)) {
  throw new Error("starter: too few exercises after the difficulty cap");
}

const completeBodyDays = (count) => Array.from({ length: count }, (_, index) => ({
  name: `Full Body ${index + 1}`,
  type: "full_body",
  emphasis: [],
  strictFocus: false,
}));

for (const days of [2, 3]) {
  const profile = {
    ...base,
    level: "intermediate",
    goal: "hypertrophy",
    daysPerWeek: days,
    sessionMinutes: 45,
    splitPreset: "custom",
    workoutDays: completeBodyDays(days),
  };
  const program = generateProgram(exercises, profile, state, 0);
  for (const group of ["chest", "back", "shoulders", "quads", "hamstrings", "core"]) {
    const coverage = program.weeklyCoverage.groups[group];
    if (!coverage) throw new Error(`${days}-day full body: missing ${group} coverage`);
    if (coverage.exerciseSlots !== days) {
      throw new Error(`${days}-day full body: expected ${days} ${group} slots, received ${coverage.exerciseSlots}`);
    }
  }
}

const shortProfile = {
  ...base,
  level: "intermediate",
  goal: "general",
  daysPerWeek: 2,
  sessionMinutes: 30,
  splitPreset: "custom",
  workoutDays: completeBodyDays(2),
};
const shortProgram = generateProgram(exercises, shortProfile, state, 0);
if (!shortProgram.weeklyCoverage.capacityLimited) {
  throw new Error("30-minute two-day full body should report schedule-limited direct coverage");
}
if (Object.values(shortProgram.weeklyCoverage.groups).some((coverage) => coverage.exerciseSlots < 1)) {
  throw new Error("weekly planner should rotate short-session omissions across the week");
}

const mobilityProfile = {
  ...base,
  level: "starter",
  goal: "mobility",
  daysPerWeek: 3,
  sessionMinutes: 45,
  splitPreset: "push_pull_legs",
  workoutDays: defaultWorkoutDays(3, "push_pull_legs"),
};
const mobilityProgram = generateProgram(exercises, mobilityProfile, state, 0);
if (mobilityProgram.splitName !== "Full-body mobility rotation") {
  throw new Error("preset mobility programmes should use a goal-aware full-body rotation");
}
if (!mobilityProgram.structureNote || mobilityProgram.workouts.some((workout) => workout.type !== "full_body")) {
  throw new Error("mobility structure adaptation should be explicit in the programme");
}

const hypertrophyProgram = generateProgram(
  exercises,
  { ...base, goal: "hypertrophy" },
  state,
  0,
);
for (const item of hypertrophyProgram.workouts.flatMap((workout) => workout.exercises)) {
  const type = exerciseById.get(item.exerciseId)?.app.exerciseType;
  const expected = ["main_lift", "compound_accessory"].includes(type) ? "6–10" : "10–15";
  if (item.reps !== expected) {
    throw new Error(`hypertrophy ${type}: expected ${expected}, received ${item.reps}`);
  }
}

const starterItem = starterProgram.workouts[0].exercises[0];
const starterReplacements = replacementOptions(
  exercises,
  starterItem.exerciseId,
  starterProgram.workouts[0].exercises.map((item) => item.exerciseId),
  { ...base, level: "starter", goal: "general" },
  state,
  "general",
  30,
  "profile",
  starterItem.targetGroup,
  starterItem.targetRole,
  starterProgram.workouts[0].allowedGroups,
  starterItem.requestedGroup,
);
if (starterReplacements.some((exercise) => exercise.app.complexity > 1)) {
  throw new Error("profile-default substitutions must respect the hard difficulty ceiling");
}

const goals = ["strength", "hypertrophy", "power", "endurance", "general", "conditioning", "mobility"];
const levels = ["starter", "intermediate", "advanced", "pro"];
const sessionLengths = [30, 45, 60, 75];
const equipmentPresets = ["full_gym", "machines", "home_dumbbells", "bodyweight"];
let matrixCases = 0;

for (const level of levels) {
  for (const goal of goals) {
    for (let days = 2; days <= 6; days += 1) {
      for (const preset of getSplitPresets(days)) {
        for (const equipmentPreset of equipmentPresets) {
          for (const sessionMinutes of sessionLengths) {
            const profile = {
              ...base,
              level,
              goal,
              daysPerWeek: days,
              sessionMinutes,
              equipmentPreset,
              splitPreset: preset.id,
              workoutDays: defaultWorkoutDays(days, preset.id),
            };
            const program = generateProgram(exercises, profile, state, matrixCases % 3);
            const expectedExercises = sessionMinutes <= 30 ? 5 : sessionMinutes <= 45 ? 6 : sessionMinutes <= 60 ? 7 : 8;
            if (program.workouts.length !== days) {
              throw new Error(`matrix ${matrixCases}: expected ${days} workouts`);
            }
            if (program.workouts.some((workout) => workout.exercises.length !== expectedExercises)) {
              throw new Error(`matrix ${matrixCases}: session capacity was not respected`);
            }
            for (const item of program.workouts.flatMap((workout) => workout.exercises)) {
              const complexity = exerciseById.get(item.exerciseId)?.app.complexity;
              if (complexity > maxComplexity(level)) {
                throw new Error(`matrix ${matrixCases}: ${complexity}/4 exceeded ${level}`);
              }
            }
            matrixCases += 1;
          }
        }
      }
    }
  }
}

if (matrixCases !== 4480) throw new Error(`expected 4,480 matrix cases, received ${matrixCases}`);
console.log(`Programme engine and ${matrixCases.toLocaleString()} recommendation combinations passed.`);
