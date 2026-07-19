import {
  CONSTRAINT_LABELS,
  EQUIPMENT,
  EXERCISES,
  LEVEL_ORDER,
  MUSCLE_LABELS,
} from "./data.js";

const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT.map(item => [item.id, item]));

const SESSION_TARGETS = {
  30: ["quads", "chest", "back", "hamstrings", "shoulders"],
  45: ["quads", "chest", "back", "hamstrings", "shoulders", "biceps", "triceps"],
  60: ["quads", "chest", "back", "hamstrings", "glutes", "shoulders", "rear_shoulders", "biceps", "triceps"],
  75: ["quads", "chest", "back", "hamstrings", "glutes", "shoulders", "rear_shoulders", "biceps", "triceps", "calves", "core"],
};

function isUnavailable(exercise, gym, profile) {
  if (!profile.kraftwerkMode) return false;
  return gym.observations?.[exercise.equipmentId]?.status === "unavailable";
}

function violatesConstraint(exercise, constraints) {
  return exercise.notRecommendedFor.some(item => constraints.includes(item));
}

function scoreExercise(exercise, profile, gym, history, selectedGroups) {
  let score = 0;

  if (profile.equipmentMode === "machine_preferred") score += 4;
  if (gym.observations?.[exercise.equipmentId]?.status === "available") score += 3;
  if (!history.recentExerciseIds?.includes(exercise.id)) score += 3;
  if (profile.favorites?.includes(exercise.id)) score += 5;
  if (!selectedGroups.includes(exercise.muscleGroup)) score += 2;
  if (exercise.level === profile.level) score += 1;

  score += Math.random() * 0.75;
  return score;
}

export function eligibleExercises(profile, gym, history, excludedIds = []) {
  const level = LEVEL_ORDER[profile.level] ?? 1;
  const constraints = profile.constraints ?? [];

  return EXERCISES.filter(exercise => {
    if (LEVEL_ORDER[exercise.level] > level) return false;
    if (excludedIds.includes(exercise.id)) return false;
    if (violatesConstraint(exercise, constraints)) return false;
    if (isUnavailable(exercise, gym, profile)) return false;
    return true;
  });
}

export function generateWorkout(profile, gym, history) {
  const targetMinutes = Number(profile.sessionMinutes) || 45;
  const targetGroups = SESSION_TARGETS[targetMinutes] ?? SESSION_TARGETS[45];
  const pool = eligibleExercises(profile, gym, history);
  const exercises = [];
  const warnings = [];

  for (const muscleGroup of targetGroups) {
    const groupPool = pool
      .filter(item => item.muscleGroup === muscleGroup && !exercises.some(chosen => chosen.id === item.id))
      .sort((a, b) =>
        scoreExercise(b, profile, gym, history, exercises.map(item => item.muscleGroup)) -
        scoreExercise(a, profile, gym, history, exercises.map(item => item.muscleGroup))
      );

    if (groupPool[0]) exercises.push(groupPool[0]);

    const currentMinutes = exercises.reduce((sum, item) => sum + item.minutes, 0);
    if (currentMinutes >= targetMinutes - 4) break;
  }

  if (exercises.length < 4) {
    warnings.push("Your active constraints and unavailable equipment leave very few eligible exercises.");
  }

  if (profile.constraints?.length) {
    warnings.push("Pain filters are active. Use only a pain-free range and stop if symptoms increase.");
  }

  return {
    generatedAt: new Date().toISOString(),
    targetMinutes,
    estimatedMinutes: exercises.reduce((sum, item) => sum + item.minutes, 0),
    exercises: exercises.map(item => ({ ...item, completed: false })),
    warnings,
  };
}

export function findReplacement(currentExercise, currentWorkout, profile, gym, history) {
  const excludedIds = currentWorkout.exercises.map(item => item.id);
  const pool = eligibleExercises(profile, gym, history, excludedIds)
    .filter(item =>
      item.muscleGroup === currentExercise.muscleGroup ||
      currentExercise.substitutions.includes(item.id)
    )
    .sort((a, b) => {
      const aDirect = currentExercise.substitutions.includes(a.id) ? 3 : 0;
      const bDirect = currentExercise.substitutions.includes(b.id) ? 3 : 0;
      return (bDirect + scoreExercise(b, profile, gym, history, [])) -
        (aDirect + scoreExercise(a, profile, gym, history, []));
    });

  return pool[0] ?? null;
}

export function equipmentFor(exercise) {
  return EQUIPMENT_BY_ID[exercise.equipmentId] ?? {
    name: exercise.equipmentId,
    area: "Unknown",
    type: "machine",
  };
}

export function workoutFilterLabels(profile) {
  const labels = [
    "Hypertrophy",
    profile.level[0].toUpperCase() + profile.level.slice(1),
    `${profile.sessionMinutes} min`,
    profile.equipmentMode === "machine_only" ? "Machines only" : "Machines preferred",
  ];

  if (profile.kraftwerkMode) labels.push("Kraftwerk");
  for (const constraint of profile.constraints ?? []) {
    if (CONSTRAINT_LABELS[constraint]) labels.push(CONSTRAINT_LABELS[constraint]);
  }

  return labels;
}

export function muscleLabel(id) {
  return MUSCLE_LABELS[id] ?? id;
}
