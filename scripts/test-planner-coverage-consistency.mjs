import { enrichExercise } from "../src/dataset.js";
import { generateProgram } from "../src/programme.js";

const equipment = ["body weight", "dumbbell", "barbell", "cable", "leverage machine", "smith machine"];
const groups = [
  ["chest", "pectorals"],
  ["back", "lats"],
  ["shoulders", "delts"],
  ["upper arms", "biceps"],
  ["upper arms", "triceps"],
  ["upper legs", "quads"],
  ["upper legs", "hamstrings"],
  ["upper legs", "glutes"],
  ["lower legs", "calves"],
  ["waist", "abs"],
  ["upper legs", "adductors"],
  ["upper legs", "abductors"],
];

const raw = [];
let id = 1;
for (let repeat = 0; repeat < 20; repeat += 1) {
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
      gif_url: "videos/test.gif",
    });
  }
}

const allExercises = raw.map(enrichExercise);
const directShoulders = allExercises.filter((exercise) => exercise.app.group === "shoulders");
if (!directShoulders.length) throw new Error("fixture requires a direct shoulder exercise");

// Model a sparse but valid catalogue: there is one safe, eligible direct shoulder
// exercise, plus many safe companion exercises. Across different workouts the
// planner should repeat that direct exercise instead of replacing it with another
// muscle solely for novelty.
const onlyShoulderId = directShoulders[0].id;
const sparseExercises = allExercises.filter(
  (exercise) => exercise.app.group !== "shoulders" || exercise.id === onlyShoulderId,
);

const profile = {
  name: "Coverage consistency",
  level: "intermediate",
  goal: "general",
  daysPerWeek: 2,
  sessionMinutes: 45,
  durationWeeks: 12,
  equipmentPreset: "full_gym",
  equipment: [],
  constraints: [],
  favorites: [],
  splitPreset: "custom",
  workoutDays: [
    { name: "Full Body A", type: "full_body", emphasis: [], strictFocus: false },
    { name: "Full Body B", type: "full_body", emphasis: [], strictFocus: false },
  ],
};
const state = { gym: { unavailableExerciseIds: [] } };
const program = generateProgram(sparseExercises, profile, state, 0);
const shoulderCoverage = program.weeklyCoverage.groups.shoulders;

if (!shoulderCoverage || shoulderCoverage.plannedExerciseSlots < 2) {
  throw new Error("fixture must plan direct shoulder work in both weekly workouts");
}
if (shoulderCoverage.exerciseSlots < 2) {
  throw new Error(
    `planner downgraded direct shoulder coverage for variety: ${shoulderCoverage.exerciseSlots}/${shoulderCoverage.plannedExerciseSlots}`,
  );
}

const shoulderItems = program.workouts.flatMap((workout) =>
  workout.exercises.filter((item) => item.requestedGroup === "shoulders"),
);
if (shoulderItems.length < 2) throw new Error("expected at least two requested shoulder slots");
if (shoulderItems.some((item) => item.groupMatch !== "exact")) {
  throw new Error("a safe exact muscle repeat must outrank a companion replacement across workouts");
}
if (new Set(shoulderItems.map((item) => item.exerciseId)).size !== 1) {
  throw new Error("sparse catalogue fixture should reuse its single direct shoulder exercise across workouts");
}

console.log("Planner coverage consistency regression passed.");
