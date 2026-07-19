import { EQUIPMENT_PRESETS, GOALS } from "./config.js";

const SPLITS = {
  2: [
    {
      name: "Full Body A",
      slots: ["quads", "chest", "back", "hamstrings", "shoulders", "core"],
    },
    {
      name: "Full Body B",
      slots: ["glutes", "back", "chest", "quads", "arms", "core"],
    },
  ],
  3: [
    {
      name: "Full Body A",
      slots: ["quads", "chest", "back", "hamstrings", "shoulders", "core"],
    },
    {
      name: "Full Body B",
      slots: ["glutes", "back", "chest", "quads", "biceps", "triceps"],
    },
    {
      name: "Full Body C",
      slots: ["hamstrings", "shoulders", "back", "chest", "calves", "core"],
    },
  ],
  4: [
    {
      name: "Upper A",
      slots: ["chest", "back", "shoulders", "biceps", "triceps", "core"],
    },
    {
      name: "Lower A",
      slots: ["quads", "hamstrings", "glutes", "calves", "core", "adductors"],
    },
    {
      name: "Upper B",
      slots: ["back", "chest", "shoulders", "triceps", "biceps", "forearms"],
    },
    {
      name: "Lower B",
      slots: ["glutes", "quads", "hamstrings", "calves", "core", "abductors"],
    },
  ],
  5: [
    {
      name: "Push",
      slots: ["chest", "shoulders", "triceps", "chest", "shoulders", "core"],
    },
    {
      name: "Pull",
      slots: ["back", "back", "biceps", "shoulders", "forearms", "core"],
    },
    {
      name: "Legs",
      slots: ["quads", "hamstrings", "glutes", "calves", "adductors", "core"],
    },
    {
      name: "Upper",
      slots: ["chest", "back", "shoulders", "biceps", "triceps", "core"],
    },
    {
      name: "Lower",
      slots: ["glutes", "quads", "hamstrings", "calves", "abductors", "core"],
    },
  ],
  6: [
    {
      name: "Push A",
      slots: ["chest", "shoulders", "triceps", "chest", "shoulders", "core"],
    },
    {
      name: "Pull A",
      slots: ["back", "back", "biceps", "shoulders", "forearms", "core"],
    },
    {
      name: "Legs A",
      slots: ["quads", "hamstrings", "glutes", "calves", "adductors", "core"],
    },
    {
      name: "Push B",
      slots: ["shoulders", "chest", "triceps", "chest", "shoulders", "core"],
    },
    {
      name: "Pull B",
      slots: ["back", "biceps", "back", "shoulders", "forearms", "core"],
    },
    {
      name: "Legs B",
      slots: ["glutes", "quads", "hamstrings", "calves", "abductors", "core"],
    },
  ],
};

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
    value =
      (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function maxComplexity(level) {
  return {
    starter: 1,
    intermediate: 2,
    advanced: 3,
    pro: 4,
  }[level] || 1;
}

export function allowedEquipment(profile) {
  if (profile.equipmentPreset === "custom") {
    return new Set(profile.equipment || []);
  }

  return new Set(
    EQUIPMENT_PRESETS[profile.equipmentPreset]?.equipment ||
      EQUIPMENT_PRESETS.full_gym.equipment,
  );
}

export function eligibleForProfile(exercise, profile, state) {
  const allowed = allowedEquipment(profile);

  if (!allowed.has(exercise.equipment)) {
    return false;
  }

  if (
    (state.gym?.unavailableExerciseIds || []).includes(exercise.id)
  ) {
    return false;
  }

  if (exercise.app.complexity > maxComplexity(profile.level)) {
    return false;
  }

  if (
    (profile.constraints || []).some((constraint) =>
      exercise.app.safetyFlags.includes(constraint),
    )
  ) {
    return false;
  }

  if (profile.goal === "mobility") {
    return exercise.app.goalTags.includes("mobility");
  }

  if (profile.goal === "conditioning") {
    return (
      exercise.app.goalTags.includes("conditioning") ||
      exercise.app.goalTags.includes("general")
    );
  }

  return !exercise.app.goalTags.includes("mobility");
}

function groupMatches(exercise, slot) {
  if (slot === "arms") {
    return ["biceps", "triceps", "forearms", "arms"].includes(
      exercise.app.group,
    );
  }

  if (slot === "legs") {
    return [
      "quads",
      "hamstrings",
      "glutes",
      "calves",
      "adductors",
      "abductors",
      "legs",
    ].includes(exercise.app.group);
  }

  return exercise.app.group === slot;
}

function goalScore(exercise, goal) {
  let score = exercise.app.goalTags.includes(goal) ? 6 : 0;

  if (
    ["strength", "hypertrophy", "general"].includes(goal) &&
    [
      "squat",
      "hinge",
      "horizontal_push",
      "vertical_push",
      "horizontal_pull",
      "vertical_pull",
    ].includes(exercise.app.movement)
  ) {
    score += 3;
  }

  if (
    goal === "power" &&
    exercise.app.goalTags.includes("power")
  ) {
    score += 8;
  }

  if (
    goal === "conditioning" &&
    [
      "cardio",
      "squat",
      "horizontal_push",
      "horizontal_pull",
    ].includes(exercise.app.movement)
  ) {
    score += 3;
  }

  if (
    goal === "endurance" &&
    [
      "body weight",
      "band",
      "cable",
      "leverage machine",
    ].includes(exercise.equipment)
  ) {
    score += 2;
  }

  return score;
}

function chooseExercise(
  pool,
  slot,
  used,
  profile,
  random,
) {
  const candidates = pool.filter(
    (exercise) =>
      groupMatches(exercise, slot) &&
      !used.has(exercise.id),
  );

  const fallback = pool.filter(
    (exercise) => !used.has(exercise.id),
  );

  const ranked = (
    candidates.length ? candidates : fallback
  )
    .map((exercise) => ({
      exercise,
      score:
        goalScore(exercise, profile.goal) +
        ((profile.favorites || []).includes(exercise.id)
          ? 4
          : 0) +
        random() * 1.5,
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.exercise || null;
}

function prescription(
  profile,
  exercise,
  index,
) {
  const config =
    GOALS[profile.goal] || GOALS.general;

  let sets = config.sets;
  let reps = config.reps;
  let restSeconds = config.rest;

  if (
    profile.goal === "strength" &&
    ![
      "squat",
      "hinge",
      "horizontal_push",
      "vertical_push",
      "horizontal_pull",
      "vertical_pull",
    ].includes(exercise.app.movement)
  ) {
    sets = 3;
    reps = "6–10";
    restSeconds = 90;
  }

  if (
    profile.goal === "power" &&
    !exercise.app.goalTags.includes("power")
  ) {
    sets = 3;
    reps = "6–10";
    restSeconds = 90;
  }

  if (profile.goal === "mobility") {
    sets = 2;
    reps = "30–60 sec";
    restSeconds = 20;
  }

  return {
    exerciseId: exercise.id,
    sets,
    reps,
    restSeconds,
    order: index + 1,
  };
}

function progression(goal) {
  const common =
    "Record every set. Keep technique stable and stop a set when form changes or pain appears.";

  const rules = {
    strength:
      "When every work set reaches the top of the range with 2 repetitions in reserve, add a small amount of weight next time.",
    hypertrophy:
      "Use double progression: add repetitions inside the range, then add weight after all sets reach the top of the range.",
    power:
      "Increase load only while movement speed and technique remain sharp. Do not grind repetitions.",
    endurance:
      "First increase completed repetitions or work time, then reduce rest slightly or add a small load.",
    general:
      "Add repetitions first, then add a small amount of resistance while keeping 2–3 repetitions in reserve.",
    conditioning:
      "Progress by adding a round, extending work intervals, or reducing rest—but change only one variable at a time.",
    mobility:
      "Progress range and control gradually; never force a painful end range.",
  };

  return `${rules[goal]} ${common}`;
}

export function generateProgram(
  exercises,
  profile,
  state,
  variation = 0,
) {
  const pool = exercises.filter((exercise) =>
    eligibleForProfile(exercise, profile, state),
  );

  if (pool.length < 20) {
    throw new Error(
      "The current equipment and safety filters leave too few exercises. Adjust the profile before building a programme.",
    );
  }

  const split =
    SPLITS[
      Math.min(
        6,
        Math.max(
          2,
          Number(profile.daysPerWeek) || 3,
        ),
      )
    ];

  const random = rng(
    hashString(JSON.stringify(profile) + variation),
  );

  const usedAcross = new Set();

  const targetCount =
    profile.sessionMinutes <= 30
      ? 5
      : profile.sessionMinutes <= 45
        ? 6
        : profile.sessionMinutes <= 60
          ? 7
          : 8;

  const workouts = split.map(
    (template, workoutIndex) => {
      const used = new Set();
      const slots = [...template.slots];

      while (slots.length < targetCount) {
        slots.push(
          slots[
            slots.length % template.slots.length
          ],
        );
      }

      const chosen = [];

      for (
        const slot of slots.slice(0, targetCount)
      ) {
        let exercise = chooseExercise(
          pool,
          slot,
          used,
          profile,
          random,
        );

        if (!exercise) {
          continue;
        }

        if (
          usedAcross.has(exercise.id) &&
          pool.length >
            targetCount * split.length
        ) {
          const unusedPool = pool.filter(
            (candidate) =>
              !usedAcross.has(candidate.id),
          );

          exercise =
            chooseExercise(
              unusedPool,
              slot,
              used,
              profile,
              random,
            ) || exercise;
        }

        used.add(exercise.id);
        usedAcross.add(exercise.id);
        chosen.push(exercise);
      }

      return {
        id: `workout-${workoutIndex + 1}`,
        name: template.name,
        exercises: chosen.map(
          (exercise, index) =>
            prescription(
              profile,
              exercise,
              index,
            ),
        ),
      };
    },
  );

  const config =
    GOALS[profile.goal] || GOALS.general;

  const durationWeeks = Number(
    profile.durationWeeks || config.weeks,
  );

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
    sessionMinutes: Number(
      profile.sessionMinutes,
    ),
    splitName:
      Number(profile.daysPerWeek) === 4
        ? "Upper / Lower"
        : Number(profile.daysPerWeek) >= 5
          ? "Multi-day split"
          : "Full-body rotation",
    progression: progression(profile.goal),
    reviewWeeks: [
      4,
      8,
      durationWeeks,
    ].filter(
      (value, index, values) =>
        value <= durationWeeks &&
        values.indexOf(value) === index,
    ),
    workouts,
  };
}

export function acceptProgram(program) {
  return {
    ...program,
    status: "active",
    acceptedAt: new Date().toISOString(),
    startDate: new Date()
      .toISOString()
      .slice(0, 10),
    completedSessions: 0,
    nextWorkoutIndex: 0,
  };
}

export function currentWeek(program) {
  return Math.min(
    program.durationWeeks,
    Math.floor(
      (program.completedSessions || 0) /
        program.daysPerWeek,
    ) + 1,
  );
}

export function nextWorkout(program) {
  return program.workouts[
    (program.nextWorkoutIndex || 0) %
      program.workouts.length
  ];
}

export function replacementOptions(
  exercises,
  currentId,
  existingIds,
  profile,
  state,
  goal,
  limit = 30,
) {
  const current = exercises.find(
    (exercise) => exercise.id === currentId,
  );

  if (!current) {
    return [];
  }

  return exercises
    .filter(
      (exercise) =>
        exercise.id !== currentId &&
        !existingIds.includes(exercise.id) &&
        eligibleForProfile(
          exercise,
          profile,
          state,
        ),
    )
    .filter(
      (exercise) =>
        exercise.app.group ===
          current.app.group ||
        exercise.app.movement ===
          current.app.movement,
    )
    .map((exercise) => {
      const sameGroup =
        exercise.app.group ===
        current.app.group;

      const sameMovement =
        exercise.app.movement ===
        current.app.movement;

      const sameEquipment =
        exercise.equipment ===
        current.equipment;

      const complexityDistance = Math.abs(
        exercise.app.complexity -
          current.app.complexity,
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
        a.exercise.name.localeCompare(
          b.exercise.name,
        ),
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
