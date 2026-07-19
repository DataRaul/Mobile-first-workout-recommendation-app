import { enrichExercise } from "../src/dataset.js";
import { generateProgram, maxComplexity, replacementOptions } from "../src/programme.js";

const equipment = ["body weight", "dumbbell", "barbell", "cable", "leverage machine", "smith machine"];
const groups = [
  ["chest", "pectorals"], ["back", "lats"], ["shoulders", "delts"],
  ["upper arms", "biceps"], ["upper arms", "triceps"], ["upper legs", "quads"],
  ["upper legs", "hamstrings"], ["upper legs", "glutes"], ["lower legs", "calves"],
  ["waist", "abs"], ["upper legs", "adductors"], ["upper legs", "abductors"],
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

const exercises = raw.map(enrichExercise);
const base = {
  name: "Test",
  level: "pro",
  daysPerWeek: 4,
  sessionMinutes: 60,
  durationWeeks: 12,
  equipmentPreset: "full_gym",
  equipment: [],
  constraints: [],
  favorites: [],
};
const state = { gym: { unavailableExerciseIds: [] } };

for (const goal of ["strength", "hypertrophy", "power", "endurance", "general", "conditioning"]) {
  const program = generateProgram(exercises, { ...base, goal }, state, 0);
  if (program.workouts.length !== 4) throw new Error(`${goal}: expected four workouts`);
  if (program.workouts.some((workout) => workout.exercises.length < 5)) {
    throw new Error(`${goal}: too few exercises`);
  }
}

for (const level of ["starter", "intermediate", "advanced", "pro"]) {
  const profile = { ...base, level, goal: "hypertrophy" };
  const program = generateProgram(exercises, profile, state, 1);
  const selected = program.workouts.flatMap((workout) => workout.exercises);
  for (const item of selected) {
    const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
    if (exercise.app.complexity > maxComplexity(level)) {
      throw new Error(`${level}: selected exercise above complexity cap`);
    }
  }
}

const replacementProfile = { ...base, level: "intermediate", goal: "hypertrophy" };
const replacementProgram = generateProgram(exercises, replacementProfile, state, 2);
const workout = replacementProgram.workouts[0];
const options = replacementOptions(
  exercises,
  workout.exercises[0].exerciseId,
  workout.exercises.map((item) => item.exerciseId),
  replacementProfile,
  state,
  replacementProfile.goal,
  10,
);
if (!options.length) throw new Error("Expected at least one direct replacement option");
if (options.some((exercise) => exercise.app.complexity > maxComplexity(replacementProfile.level))) {
  throw new Error("Replacement list exceeded profile complexity cap");
}

console.log("Programme engine and replacement-list tests passed.");
