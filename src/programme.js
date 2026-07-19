import { EQUIPMENT_PRESETS, GOALS } from "./config.js";

export const WORKOUT_TYPES = {
  full_body: {
    label: "Full Body",
    slots: ["quads", "chest", "back", "hamstrings", "shoulders", "core"],
  },
  upper: {
    label: "Upper Body",
    slots: ["chest", "back", "shoulders", "biceps", "triceps", "forearms"],
  },
  lower: {
    label: "Lower Body",
    slots: ["quads", "hamstrings", "glutes", "calves", "core", "adductors"],
  },
  push: {
    label: "Push",
    slots: ["chest", "shoulders", "triceps", "chest", "shoulders", "core"],
  },
  pull: {
    label: "Pull",
    slots: ["back", "back", "biceps", "shoulders", "forearms", "core"],
  },
  legs: {
    label: "Legs",
    slots: ["quads", "hamstrings", "glutes", "calves", "adductors", "core"],
  },
  custom: {
    label: "Custom focus",
    slots: [],
  },
};

export const MUSCLE_FOCUS_OPTIONS = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
  { value: "quads", label: "Quads" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Calves" },
  { value: "core", label: "Core" },
];

const PRESET_SPLITS = {
  2: [
    {
      id: "full_body_rotation",
      label: "Full Body A / Full Body B",
      days: [
        { name: "Full Body A", type: "full_body", emphasis: ["chest", "back"] },
        { name: "Full Body B", type: "full_body", emphasis: ["legs", "shoulders"] },
      ],
    },
    {
      id: "upper_lower",
      label: "Upper / Lower",
      days: [
        { name: "Upper Body", type: "upper", emphasis: ["chest", "back"] },
        { name: "Lower Body", type: "lower", emphasis: ["quads", "glutes"] },
      ],
    },
  ],
  3: [
    {
      id: "full_body_rotation",
      label: "Full Body rotation",
      days: [
        { name: "Full Body A", type: "full_body", emphasis: ["chest", "shoulders"] },
        { name: "Full Body B", type: "full_body", emphasis: ["back", "arms"] },
        { name: "Full Body C", type: "full_body", emphasis: ["quads", "glutes"] },
      ],
    },
    {
      id: "full_upper_lower",
      label: "Full Body / Upper / Lower",
      days: [
        { name: "Full Body", type: "full_body", emphasis: ["chest", "back"] },
        { name: "Upper Body", type: "upper", emphasis: ["shoulders", "arms"] },
        { name: "Lower Body", type: "lower", emphasis: ["quads", "glutes"] },
      ],
    },
    {
      id: "push_pull_legs",
      label: "Push / Pull / Legs",
      days: [
        { name: "Push", type: "push", emphasis: ["chest", "shoulders"] },
        { name: "Pull", type: "pull", emphasis: ["back", "arms"] },
        { name: "Legs", type: "legs", emphasis: ["quads", "glutes"] },
      ],
    },
    {
      id: "focused_three_day",
      label: "Chest & Shoulders / Arms & Back / Legs",
      days: [
        { name: "Chest & Shoulders", type: "custom", emphasis: ["chest", "shoulders"] },
        { name: "Arms & Back", type: "custom", emphasis: ["arms", "back"] },
        { name: "Legs", type: "custom", emphasis: ["quads", "hamstrings", "glutes"] },
      ],
    },
  ],
  4: [
    {
      id: "upper_lower",
      label: "Upper / Lower rotation",
      days: [
        { name: "Upper A", type: "upper", emphasis: ["chest", "back"] },
        { name: "Lower A", type: "lower", emphasis: ["quads", "hamstrings"] },
        { name: "Upper B", type: "upper", emphasis: ["shoulders", "arms"] },
        { name: "Lower B", type: "lower", emphasis: ["glutes", "calves"] },
      ],
    },
    {
      id: "full_upper_lower_full",
      label: "Full / Upper / Lower / Full",
      days: [
        { name: "Full Body A", type: "full_body", emphasis: ["chest", "back"] },
        { name: "Upper Body", type: "upper", emphasis: ["shoulders", "arms"] },
        { name: "Lower Body", type: "lower", emphasis: ["quads", "glutes"] },
        { name: "Full Body B", type: "full_body", emphasis: ["hamstrings", "core"] },
      ],
    },
  ],
  5: [
    {
      id: "push_pull_legs_upper_lower",
      label: "Push / Pull / Legs / Upper / Lower",
      days: [
        { name: "Push", type: "push", emphasis: ["chest", "shoulders"] },
        { name: "Pull", type: "pull", emphasis: ["back", "arms"] },
        { name: "Legs", type: "legs", emphasis: ["quads", "glutes"] },
        { name: "Upper", type: "upper", emphasis: ["chest", "back"] },
        { name: "Lower", type: "lower", emphasis: ["hamstrings", "calves"] },
      ],
    },
  ],
  6: [
    {
      id: "push_pull_legs_twice",
      label: "Push / Pull / Legs twice",
      days: [
        { name: "Push A", type: "push", emphasis: ["chest"] },
        { name: "Pull A", type: "pull", emphasis: ["back"] },
        { name: "Legs A", type: "legs", emphasis: ["quads"] },
        { name: "Push B", type: "push", emphasis: ["shoulders", "triceps"] },
        { name: "Pull B", type: "pull", emphasis: ["arms", "back"] },
        { name: "Legs B", type: "legs", emphasis: ["glutes", "hamstrings"] },
      ],
    },
  ],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export function getSplitPresets(daysPerWeek) {
  const days = Math.min(6, Math.max(2, Number(daysPerWeek) || 3));
  return clone(PRESET_SPLITS[days] || PRESET_SPLITS[3]);
}

export function defaultWorkoutDays(daysPerWeek, presetId = null) {
  const presets = getSplitPresets(daysPerWeek);
  const preset = presets.find((item) => item.id === presetId) || presets[0];
  return clone(preset.days);
}

export function workoutDaysForProfile(profile) {
  const expectedDays = Math.min(6, Math.max(2, Number(profile.daysPerWeek) || 3));
  const saved = Array.isArray(profile.workoutDays) ? profile.workoutDays : [];

  if (saved.length !== expectedDays) {
    return defaultWorkoutDays(expectedDays, profile.splitPreset);
  }

  return saved.map((day, index) => {
    const type = WORKOUT_TYPES[day.type] ? day.type : "full_body";
    const emphasis = [...new Set((day.emphasis || []).filter((value) =>
      MUSCLE_FOCUS_OPTIONS.some((option) => option.value === value),
    ))].slice(0, 3);

    return {
      name: String(day.name || `${WORKOUT_TYPES[type].label} ${index + 1}`).trim(),
      type,
      emphasis,
    };
  });
}

function slotsForWorkoutDay(day) {
  const type = WORKOUT_TYPES[day.type] ? day.type : "full_body";
  const emphasis = [...new Set(day.emphasis || [])].filter(Boolean).slice(0, 3);

  if (type === "custom") {
    if (!emphasis.length) {
      throw new Error(`Custom workout “${day.name}” needs at least one priority muscle group.`);
    }

    const customSlots = [];
    while (customSlots.length < 10) {
      customSlots.push(emphasis[customSlots.length % emphasis.length]);
    }
    return customSlots;
  }

  const base = [...WORKOUT_TYPES[type].slots];
  if (!emphasis.length) return base;

  const nonPriority = base.filter((slot) => !emphasis.includes(slot));
  const sequence = [];
  const push = (value) => {
    if (value) sequence.push(value);
  };

  push(emphasis[0]);
  push(nonPriority[0]);
  push(emphasis[1] || emphasis[0]);
  push(nonPriority[1]);
  push(nonPriority[2]);
  push(emphasis[0]);
  push(emphasis[2] || emphasis[1]);

  for (const slot of nonPriority.slice(3)) push(slot);
  while (sequence.length < 10) push(emphasis[sequence.length % emphasis.length]);

  return sequence;
}

function splitLabel(profile, workoutDays) {
  const presets = getSplitPresets(profile.daysPerWeek);
  const preset = presets.find((item) => item.id === profile.splitPreset);
  if (profile.splitPreset && profile.splitPreset !== "custom" && preset) return preset.label;
  return workoutDays.map((day) => day.name).join(" / ");
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function maxComplexity(level) {
  return ({ starter: 1, intermediate: 2, advanced: 3, pro: 4 })[level] || 1;
}

export function allowedEquipment(profile) {
  if (profile.equipmentPreset === "custom") return new Set(profile.equipment || []);
  return new Set(
    EQUIPMENT_PRESETS[profile.equipmentPreset]?.equipment ||
      EQUIPMENT_PRESETS.full_gym.equipment,
  );
}

export function eligibleForProfile(exercise, profile, state) {
  const allowed = allowedEquipment(profile);
  if (!allowed.has(exercise.equipment)) return false;
  if ((state.gym?.unavailableExerciseIds || []).includes(exercise.id)) return false;
  if (exercise.app.complexity > maxComplexity(profile.level)) return false;
  if ((profile.constraints || []).some((constraint) => exercise.app.safetyFlags.includes(constraint))) {
    return false;
  }
  if (profile.goal === "mobility") return exercise.app.goalTags.includes("mobility");
  if (profile.goal === "conditioning") {
    return exercise.app.goalTags.includes("conditioning") || exercise.app.goalTags.includes("general");
  }
  return !exercise.app.goalTags.includes("mobility");
}

function groupMatches(exercise, slot) {
  if (slot === "arms") return ["biceps", "triceps", "forearms", "arms"].includes(exercise.app.group);
  if (slot === "legs") {
    return ["quads", "hamstrings", "glutes", "calves", "adductors", "abductors", "legs"].includes(
      exercise.app.group,
    );
  }
  return exercise.app.group === slot;
}

function goalScore(exercise, goal) {
  let score = exercise.app.goalTags.includes(goal) ? 6 : 0;
  if (
    ["strength", "hypertrophy", "general"].includes(goal) &&
    ["squat", "hinge", "horizontal_push", "vertical_push", "horizontal_pull", "vertical_pull"].includes(
      exercise.app.movement,
    )
  ) {
    score += 3;
  }
  if (goal === "power" && exercise.app.goalTags.includes("power")) score += 8;
  if (goal === "conditioning" && ["cardio", "squat", "horizontal_push", "horizontal_pull"].includes(exercise.app.movement)) {
    score += 3;
  }
  if (goal === "endurance" && ["body weight", "band", "cable", "leverage machine"].includes(exercise.equipment)) {
    score += 2;
  }
  return score;
}

function chooseExercise(pool, slot, used, profile, random) {
  const slotCandidates = pool.filter(
    (exercise) => groupMatches(exercise, slot) && !used.has(exercise.id),
  );
  const fallback = pool.filter((exercise) => !used.has(exercise.id));
  const candidates = slotCandidates.length ? slotCandidates : fallback;
  const targetComplexity = maxComplexity(profile.level);
  const matchingDifficulty = candidates.filter(
    (exercise) => exercise.app.complexity === targetComplexity,
  );
  const difficultyMatchedPool = matchingDifficulty.length ? matchingDifficulty : candidates;

  const ranked = difficultyMatchedPool
    .map((exercise) => ({
      exercise,
      score:
        goalScore(exercise, profile.goal) +
        ((profile.favorites || []).includes(exercise.id) ? 4 : 0) +
        random() * 1.5,
    }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.exercise || null;
}

function prescription(profile, exercise, index) {
  const config = GOALS[profile.goal] || GOALS.general;
  let sets = config.sets;
  let reps = config.reps;
  let restSeconds = config.rest;

  if (
    profile.goal === "strength" &&
    !["squat", "hinge", "horizontal_push", "vertical_push", "horizontal_pull", "vertical_pull"].includes(
      exercise.app.movement,
    )
  ) {
    sets = 3;
    reps = "6–10";
    restSeconds = 90;
  }
  if (profile.goal === "power" && !exercise.app.goalTags.includes("power")) {
    sets = 3;
    reps = "6–10";
    restSeconds = 90;
  }
  if (profile.goal === "mobility") {
    sets = 2;
    reps = "30–60 sec";
    restSeconds = 20;
  }

  return { exerciseId: exercise.id, sets, reps, restSeconds, order: index + 1 };
}

function progression(goal) {
  const common = "Record every set. Keep technique stable and stop a set when form changes or pain appears.";
  const rules = {
    strength: "When every work set reaches the top of the range with 2 repetitions in reserve, add a small amount of weight next time.",
    hypertrophy: "Use double progression: add repetitions inside the range, then add weight after all sets reach the top of the range.",
    power: "Increase load only while movement speed and technique remain sharp. Do not grind repetitions.",
    endurance: "First increase completed repetitions or work time, then reduce rest slightly or add a small load.",
    general: "Add repetitions first, then add a small amount of resistance while keeping 2–3 repetitions in reserve.",
    conditioning: "Progress by adding a round, extending work intervals, or reducing rest—but change only one variable at a time.",
    mobility: "Progress range and control gradually; never force a painful end range.",
  };
  return `${rules[goal]} ${common}`;
}

export function generateProgram(exercises, profile, state, variation = 0) {
  const pool = exercises.filter((exercise) => eligibleForProfile(exercise, profile, state));
  if (pool.length < 20) {
    throw new Error(
      "The current equipment and safety filters leave too few exercises. Adjust the profile before building a programme.",
    );
  }

  const workoutDays = workoutDaysForProfile(profile);
  const split = workoutDays.map((day) => ({
    name: day.name,
    type: day.type,
    emphasis: day.emphasis,
    slots: slotsForWorkoutDay(day),
  }));
  const random = rng(hashString(JSON.stringify(profile) + variation));
  const usedAcross = new Set();
  const targetCount =
    profile.sessionMinutes <= 30 ? 5 : profile.sessionMinutes <= 45 ? 6 : profile.sessionMinutes <= 60 ? 7 : 8;

  const workouts = split.map((template, workoutIndex) => {
    const used = new Set();
    const slots = [...template.slots];
    while (slots.length < targetCount) slots.push(slots[slots.length % template.slots.length]);

    const chosen = [];
    for (const slot of slots.slice(0, targetCount)) {
      let exercise = chooseExercise(pool, slot, used, profile, random);
      if (!exercise) continue;
      if (usedAcross.has(exercise.id) && pool.length > targetCount * split.length) {
        const unusedPool = pool.filter((candidate) => !usedAcross.has(candidate.id));
        const alternative = chooseExercise(unusedPool, slot, used, profile, random);
        const targetComplexity = maxComplexity(profile.level);
        if (alternative && alternative.app.complexity === targetComplexity) {
          exercise = alternative;
        }
      }
      used.add(exercise.id);
      usedAcross.add(exercise.id);
      chosen.push(exercise);
    }

    return {
      id: `workout-${workoutIndex + 1}`,
      name: template.name,
      type: template.type,
      emphasis: template.emphasis,
      exercises: chosen.map((exercise, index) => prescription(profile, exercise, index)),
    };
  });

  const config = GOALS[profile.goal] || GOALS.general;
  const durationWeeks = Number(profile.durationWeeks || config.weeks);
  return {
    id: `program-${Date.now()}-${variation}`,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variation,
    title: `${durationWeeks}-week ${config.label} programme`,
    goal: profile.goal,
    durationWeeks,
    daysPerWeek: Number(profile.daysPerWeek),
    sessionMinutes: Number(profile.sessionMinutes),
    splitName: splitLabel(profile, workoutDays),
    workoutDays,
    progression: progression(profile.goal),
    reviewWeeks: [4, 8, durationWeeks].filter(
      (value, index, values) => value <= durationWeeks && values.indexOf(value) === index,
    ),
    workouts,
  };
}

export function acceptProgram(program) {
  return {
    ...program,
    status: "active",
    acceptedAt: new Date().toISOString(),
    startDate: new Date().toISOString().slice(0, 10),
    completedSessions: 0,
    nextWorkoutIndex: 0,
  };
}

export function currentWeek(program) {
  return Math.min(
    program.durationWeeks,
    Math.floor((program.completedSessions || 0) / program.daysPerWeek) + 1,
  );
}

export function nextWorkout(program) {
  return program.workouts[(program.nextWorkoutIndex || 0) % program.workouts.length];
}

export function replacementOptions(
  exercises,
  currentId,
  existingIds,
  profile,
  state,
  goal,
  limit = 30,
  difficulty = "profile",
) {
  const current = exercises.find((exercise) => exercise.id === currentId);
  if (!current) return [];

  const profileDifficulty = maxComplexity(profile.level);
  const requestedDifficulty =
    difficulty === "all" ? "all" : difficulty === "profile" ? profileDifficulty : Number(difficulty);
  const allowed = allowedEquipment(profile);

  return exercises
    .filter((exercise) => {
      if (exercise.id === currentId || existingIds.includes(exercise.id)) return false;
      if (!allowed.has(exercise.equipment)) return false;
      if ((state.gym?.unavailableExerciseIds || []).includes(exercise.id)) return false;
      if ((profile.constraints || []).some((constraint) => exercise.app.safetyFlags.includes(constraint))) {
        return false;
      }
      if (profile.goal === "mobility" && !exercise.app.goalTags.includes("mobility")) return false;
      if (
        profile.goal === "conditioning" &&
        !exercise.app.goalTags.includes("conditioning") &&
        !exercise.app.goalTags.includes("general")
      ) {
        return false;
      }
      if (
        !["mobility", "conditioning"].includes(profile.goal) &&
        exercise.app.goalTags.includes("mobility")
      ) {
        return false;
      }
      return requestedDifficulty === "all" || exercise.app.complexity === requestedDifficulty;
    })
    .filter(
      (exercise) =>
        exercise.app.group === current.app.group ||
        exercise.app.movement === current.app.movement,
    )
    .map((exercise) => {
      const sameGroup = exercise.app.group === current.app.group;
      const sameMovement = exercise.app.movement === current.app.movement;
      const sameEquipment = exercise.equipment === current.equipment;
      const complexityDistance = Math.abs(
        exercise.app.complexity - current.app.complexity,
      );
      return {
        exercise,
        score:
          (sameGroup ? 7 : 0) +
          (sameMovement ? 5 : 0) +
          (sameEquipment ? 1.5 : 0) +
          goalScore(exercise, goal) -
          complexityDistance * 0.75,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.exercise.name.localeCompare(b.exercise.name),
    )
    .slice(0, limit)
    .map((item) => item.exercise);
}

export function findReplacement(
  exercises,
  currentId,
  existingIds,
  profile,
  state,
  goal,
) {
  return (
    replacementOptions(
      exercises,
      currentId,
      existingIds,
      profile,
      state,
      goal,
      1,
    )[0] || null
  );
}
