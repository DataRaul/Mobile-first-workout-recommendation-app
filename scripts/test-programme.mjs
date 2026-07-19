import { enrichExercise } from "../src/dataset.js";
import { generateProgram } from "../src/programme.js";

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
const exercises = raw.map(enrichExercise);
const base = {
  name: "Test", level: "pro", daysPerWeek: 4, sessionMinutes: 60,
  durationWeeks: 12, equipmentPreset: "full_gym", equipment: [], constraints: [], favorites: []
};
const state = { gym: { unavailableExerciseIds: [] } };
for (const goal of ["strength", "hypertrophy", "power", "endurance", "general", "conditioning"]) {
  const program = generateProgram(exercises, { ...base, goal }, state, 0);
  if (program.workouts.length !== 4) throw new Error(`${goal}: expected four workouts`);
  if (program.workouts.some(workout => workout.exercises.length < 5)) throw new Error(`${goal}: too few exercises`);
}
console.log("Programme engine smoke tests passed.");
