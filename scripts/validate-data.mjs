import { EQUIPMENT, EXERCISES, LEVEL_ORDER } from "../src/data.js";

const errors = [];
const equipmentIds = new Set(EQUIPMENT.map(item => item.id));
const exerciseIds = new Set();

for (const exercise of EXERCISES) {
  if (!exercise.id) errors.push("Exercise without id");
  if (exerciseIds.has(exercise.id)) errors.push(`Duplicate exercise id: ${exercise.id}`);
  exerciseIds.add(exercise.id);

  if (!equipmentIds.has(exercise.equipmentId)) {
    errors.push(`${exercise.id}: unknown equipmentId ${exercise.equipmentId}`);
  }
  if (!LEVEL_ORDER[exercise.level]) {
    errors.push(`${exercise.id}: unknown level ${exercise.level}`);
  }
  if (!Array.isArray(exercise.notRecommendedFor)) {
    errors.push(`${exercise.id}: notRecommendedFor must be an array`);
  }
  if (!Array.isArray(exercise.substitutions)) {
    errors.push(`${exercise.id}: substitutions must be an array`);
  }
}

for (const exercise of EXERCISES) {
  for (const substitution of exercise.substitutions) {
    if (!exerciseIds.has(substitution)) {
      errors.push(`${exercise.id}: unknown substitution ${substitution}`);
    }
  }
}

if (errors.length) {
  console.error(`Dataset validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${EXERCISES.length} exercises and ${EQUIPMENT.length} equipment items.`);
