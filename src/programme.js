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
    slots: ["quads", "hamstrings", "glutes", "calves", "adductors", "abductors"],
  },
  custom: {
    label: "Selected muscles only",
    slots: [],
  },
};

export const MUSCLE_FOCUS_OPTIONS = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
  { value: "legs", label: "Legs" },
  { value: "quads", label: "Quads" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Calves" },
  { value: "core", label: "Core" },
];

export const TRAINING_ROLE_LABELS = {
  chest_incline_press: "Incline chest press",
  chest_horizontal_press: "Horizontal chest press",
  chest_decline_press: "Decline / lower chest press",
  chest_adduction: "Chest fly / adduction",
  chest_general: "General chest",
  shoulder_press: "Shoulder press",
  shoulder_lateral_raise: "Lateral deltoid",
  shoulder_rear_delt: "Rear deltoid / scapular",
  shoulder_front_raise: "Front deltoid",
  shoulder_rotation: "Shoulder control",
  shoulder_general: "General shoulders",
  back_horizontal_pull: "Horizontal row",
  back_vertical_pull: "Vertical pull",
  back_upper_rear: "Upper back / rear pull",
  back_lat_isolation: "Straight-arm lat work",
  back_traps: "Upper traps",
  back_general: "General back",
  biceps_supinated: "Supinated biceps curl",
  biceps_neutral: "Neutral-grip curl",
  biceps_pronated: "Pronated curl / forearm",
  biceps_lengthened: "Lengthened-position biceps",
  biceps_shortened: "Shortened-position biceps",
  biceps_general: "General biceps",
  triceps_pushdown: "Triceps pushdown",
  triceps_overhead: "Overhead triceps",
  triceps_press: "Pressing triceps",
  triceps_general: "General triceps",
  forearms_grip: "Forearm / grip",
  forearms_wrist: "Wrist flexion / extension",
  legs_knee_dominant: "Knee-dominant legs",
  legs_knee_extension: "Quadriceps isolation",
  legs_hip_dominant: "Hip-dominant legs",
  legs_knee_flexion: "Hamstring curl",
  legs_glute_isolation: "Glute isolation",
  legs_calves: "Calves",
  legs_adductors: "Adductors",
  legs_abductors: "Abductors",
  core_anti_extension: "Anti-extension core",
  core_lateral: "Lateral core",
  core_rotation: "Rotational / anti-rotation core",
  core_hip_raise: "Leg / knee raise",
  core_flexion: "Trunk flexion",
  core_general: "General core",
  chest_mobility: "Chest mobility",
  shoulder_mobility: "Shoulder mobility",
  back_mobility: "Back mobility",
  biceps_mobility: "Biceps mobility",
  triceps_mobility: "Triceps mobility",
  forearms_mobility: "Forearm mobility",
  core_mobility: "Core mobility",
  legs_mobility: "Lower-body mobility",
};

const GROUP_ROLE_PLANS = {
  chest: [
    "chest_incline_press",
    "chest_horizontal_press",
    "chest_adduction",
    "chest_decline_press",
  ],
  shoulders: [
    "shoulder_press",
    "shoulder_lateral_raise",
    "shoulder_rear_delt",
    "shoulder_front_raise",
  ],
  back: [
    "back_horizontal_pull",
    "back_vertical_pull",
    "back_upper_rear",
    "back_lat_isolation",
  ],
  arms: [
    "biceps_lengthened",
    "triceps_pushdown",
    "biceps_neutral",
    "triceps_overhead",
    "biceps_shortened",
    "triceps_press",
    "forearms_grip",
  ],
  biceps: ["biceps_lengthened", "biceps_neutral", "biceps_shortened", "biceps_supinated", "biceps_pronated"],
  triceps: ["triceps_pushdown", "triceps_overhead", "triceps_press"],
  forearms: ["forearms_grip", "biceps_pronated"],
  legs: [
    "legs_knee_dominant",
    "legs_hip_dominant",
    "legs_knee_flexion",
    "legs_calves",
    "legs_glute_isolation",
    "legs_adductors",
    "legs_abductors",
  ],
  quads: ["legs_knee_dominant", "legs_knee_extension"],
  hamstrings: ["legs_knee_flexion", "legs_hip_dominant"],
  glutes: ["legs_hip_dominant", "legs_glute_isolation", "legs_abductors"],
  calves: ["legs_calves"],
  adductors: ["legs_adductors"],
  abductors: ["legs_abductors"],
  core: [
    "core_anti_extension",
    "core_lateral",
    "core_rotation",
    "core_hip_raise",
    "core_flexion",
  ],
};

const ROLE_FAMILIES = [
  ["chest_incline_press", "chest_horizontal_press", "chest_decline_press"],
  ["shoulder_lateral_raise", "shoulder_rear_delt", "shoulder_front_raise"],
  ["back_horizontal_pull", "back_upper_rear"],
  ["back_vertical_pull", "back_lat_isolation"],
  ["biceps_supinated", "biceps_neutral", "biceps_pronated", "biceps_lengthened", "biceps_shortened", "forearms_grip", "forearms_wrist"],
  ["triceps_pushdown", "triceps_overhead", "triceps_press", "triceps_general"],
  ["legs_knee_dominant", "legs_knee_extension"],
  ["legs_hip_dominant", "legs_knee_flexion", "legs_glute_isolation"],
  ["legs_adductors", "legs_abductors"],
  ["core_anti_extension", "core_lateral", "core_rotation"],
  ["core_hip_raise", "core_flexion"],
];

const GROUP_DOMAINS = {
  chest: "upper",
  back: "upper",
  shoulders: "upper",
  arms: "upper",
  biceps: "upper",
  triceps: "upper",
  forearms: "upper",
  legs: "lower",
  quads: "lower",
  hamstrings: "lower",
  glutes: "lower",
  calves: "lower",
  adductors: "lower",
  abductors: "lower",
  core: "neutral",
};

const COMPANION_GROUP_PRIORITIES = {
  chest: ["shoulders", "arms", "core", "back"],
  shoulders: ["chest", "arms", "back", "core"],
  back: ["arms", "shoulders", "chest", "core"],
  arms: ["back", "shoulders", "chest", "core"],
  biceps: ["back", "arms", "forearms", "core"],
  triceps: ["chest", "shoulders", "arms", "core"],
  forearms: ["arms", "back", "core"],
  legs: [],
  quads: ["glutes", "hamstrings", "calves", "legs"],
  hamstrings: ["glutes", "quads", "calves", "legs"],
  glutes: ["hamstrings", "quads", "abductors", "calves", "legs"],
  calves: ["quads", "hamstrings", "glutes", "legs"],
  adductors: ["glutes", "quads", "hamstrings", "legs"],
  abductors: ["glutes", "quads", "hamstrings", "legs"],
  core: ["back", "chest", "shoulders", "arms", "legs"],
};

const VOLUME_TARGETS = {
  hypertrophy: {
    starter: { min: 6, target: 8, max: 12 },
    intermediate: { min: 8, target: 10, max: 16 },
    advanced: { min: 10, target: 12, max: 18 },
    pro: { min: 10, target: 14, max: 20 },
  },
  strength: {
    starter: { min: 4, target: 6, max: 10 },
    intermediate: { min: 6, target: 8, max: 12 },
    advanced: { min: 8, target: 10, max: 14 },
    pro: { min: 8, target: 12, max: 16 },
  },
  general: {
    starter: { min: 4, target: 6, max: 10 },
    intermediate: { min: 6, target: 8, max: 12 },
    advanced: { min: 6, target: 10, max: 14 },
    pro: { min: 8, target: 10, max: 16 },
  },
  endurance: {
    starter: { min: 6, target: 8, max: 12 },
    intermediate: { min: 8, target: 10, max: 16 },
    advanced: { min: 10, target: 12, max: 18 },
    pro: { min: 10, target: 14, max: 20 },
  },
  power: {
    starter: { min: 4, target: 6, max: 8 },
    intermediate: { min: 4, target: 6, max: 10 },
    advanced: { min: 6, target: 8, max: 12 },
    pro: { min: 6, target: 8, max: 12 },
  },
  conditioning: {
    starter: { min: 4, target: 6, max: 10 },
    intermediate: { min: 6, target: 8, max: 12 },
    advanced: { min: 6, target: 10, max: 14 },
    pro: { min: 8, target: 10, max: 16 },
  },
  mobility: {
    starter: { min: 2, target: 4, max: 8 },
    intermediate: { min: 2, target: 4, max: 8 },
    advanced: { min: 2, target: 4, max: 8 },
    pro: { min: 2, target: 4, max: 8 },
  },
};

const HARD_COMPATIBILITY_STATUSES = new Set(["default_exclude", "needs_review"]);
const MOBILITY_GROUP_SLOTS = [
  "chest",
  "back",
  "shoulders",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
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
      strictFocus: Boolean(day.strictFocus || type === "custom"),
    };
  });
}

function slotsForWorkoutDay(day) {
  const type = WORKOUT_TYPES[day.type] ? day.type : "full_body";
  const emphasis = [...new Set(day.emphasis || [])].filter(Boolean).slice(0, 3);

  if (type === "custom" || day.strictFocus) {
    if (!emphasis.length) {
      throw new Error(`Workout “${day.name}” needs at least one selected muscle group.`);
    }

    const strictSlots = [];
    while (strictSlots.length < 10) {
      strictSlots.push(emphasis[strictSlots.length % emphasis.length]);
    }
    return strictSlots;
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

function countValues(values) {
  return values.reduce((counts, value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
    return counts;
  }, new Map());
}

function planWeeklyGroupSlots(split, targetCount) {
  const weeklyCounts = new Map();
  const planned = split.map(() => []);

  // Fill the same position across every day before moving to the next one. A
  // short workout can therefore omit a different low-priority slot on each
  // day instead of repeatedly dropping the final muscle in the template.
  for (let position = 0; position < targetCount; position += 1) {
    split.forEach((template, workoutIndex) => {
      const sequence = template.groupSlots || [];
      const candidates = [...new Set(sequence)];
      if (!candidates.length) return;

      const dailyCounts = countValues(planned[workoutIndex]);
      const unseenToday = candidates.filter((group) => !dailyCounts.has(group));
      const candidatePool = unseenToday.length ? unseenToday : candidates;
      const sequenceFrequency = countValues(sequence);

      const chosenGroup = [...candidatePool].sort((left, right) => {
        const score = (group) =>
          (weeklyCounts.get(group) || 0) * 12 +
          (dailyCounts.get(group) || 0) * 18 +
          sequence.indexOf(group) * 0.5 -
          (sequenceFrequency.get(group) || 1) * 6;
        return score(left) - score(right) || left.localeCompare(right);
      })[0];

      planned[workoutIndex].push(chosenGroup);
      weeklyCounts.set(chosenGroup, (weeklyCounts.get(chosenGroup) || 0) + 1);
    });
  }

  return planned;
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

function compatibilityStatus(exercise, constraint) {
  const explicit = exercise.app.compatibility?.[constraint]?.status;
  if (explicit) return explicit;
  return (exercise.app.safetyFlags || []).includes(constraint)
    ? "default_exclude"
    : "normal";
}

function activeConstraintNotes(exercise, profile) {
  return (profile.constraints || [])
    .map((constraint) => {
      const assessment = exercise.app.compatibility?.[constraint];
      if (!assessment || assessment.status === "normal") return null;
      return {
        constraint,
        status: assessment.status,
        reason: assessment.reason,
        modification: assessment.modification,
        confidence: assessment.confidence,
      };
    })
    .filter(Boolean);
}

function cautionPenalty(exercise, profile) {
  return activeConstraintNotes(exercise, profile)
    .reduce((sum, note) => sum + (note.status === "caution" ? 3 : 8), 0);
}

export function eligibleForProfile(
  exercise,
  profile,
  state,
  complexityCeiling = maxComplexity(profile.level),
) {
  const allowed = allowedEquipment(profile);
  if (!allowed.has(exercise.equipment)) return false;
  if ((state.gym?.unavailableExerciseIds || []).includes(exercise.id)) return false;
  if (exercise.app.complexity > complexityCeiling) return false;
  if (
    (profile.constraints || []).some((constraint) =>
      HARD_COMPATIBILITY_STATUSES.has(compatibilityStatus(exercise, constraint)),
    )
  ) {
    return false;
  }
  if (exercise.app.quality?.reviewStatus === "needs_review") return false;
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

function targetRoleFor(group, occurrenceIndex) {
  const roles = GROUP_ROLE_PLANS[group] || [];
  return roles.length ? roles[occurrenceIndex % roles.length] : null;
}

function addTrainingRoles(groupSlots) {
  const occurrences = new Map();
  return groupSlots.map((group) => {
    const occurrenceIndex = occurrences.get(group) || 0;
    occurrences.set(group, occurrenceIndex + 1);
    return {
      group,
      role: targetRoleFor(group, occurrenceIndex),
      occurrenceIndex,
    };
  });
}

function compatibleCompanionGroup(sourceGroup, candidateGroup) {
  if (!sourceGroup || !candidateGroup || sourceGroup === candidateGroup) return false;
  const sourceDomain = GROUP_DOMAINS[sourceGroup];
  const candidateDomain = GROUP_DOMAINS[candidateGroup];
  if (!sourceDomain || !candidateDomain) return false;
  if (sourceDomain === "neutral" || candidateDomain === "neutral") return true;
  return sourceDomain === candidateDomain;
}

function companionGroupsFor(sourceGroup, allowedGroups = []) {
  const allowed = [...new Set(allowedGroups)].filter(
    (group) => compatibleCompanionGroup(sourceGroup, group),
  );
  const preferred = (COMPANION_GROUP_PRIORITIES[sourceGroup] || []).filter(
    (group) => allowed.includes(group),
  );
  return [
    ...preferred,
    ...allowed.filter((group) => !preferred.includes(group)),
  ];
}

function relatedRoles(targetRole) {
  if (!targetRole) return [];
  return (
    ROLE_FAMILIES.find((family) => family.includes(targetRole))?.filter(
      (role) => role !== targetRole,
    ) || []
  );
}

function roleTier(exercise, targetRole) {
  if (!targetRole) return 2;
  const roles = exercise.app.trainingRoles || [];
  if (roles.includes(targetRole)) return 0;
  if (relatedRoles(targetRole).some((role) => roles.includes(role))) return 1;
  return 2;
}

const ROLE_MOVEMENTS = {
  chest_incline_press: ["horizontal_push"],
  chest_horizontal_press: ["horizontal_push"],
  chest_decline_press: ["horizontal_push"],
  chest_adduction: ["horizontal_push", "isolation"],
  shoulder_press: ["vertical_push"],
  shoulder_lateral_raise: ["shoulder_raise", "raise", "isolation"],
  shoulder_rear_delt: ["horizontal_pull", "horizontal_push", "shoulder_raise", "isolation"],
  shoulder_front_raise: ["shoulder_raise", "raise", "isolation"],
  shoulder_rotation: ["isolation"],
  back_horizontal_pull: ["horizontal_pull"],
  back_vertical_pull: ["vertical_pull"],
  back_upper_rear: ["horizontal_pull", "isolation"],
  back_lat_isolation: ["vertical_pull", "isolation"],
  biceps_supinated: ["elbow_flexion"],
  biceps_neutral: ["elbow_flexion"],
  biceps_pronated: ["elbow_flexion"],
  biceps_lengthened: ["elbow_flexion"],
  biceps_shortened: ["elbow_flexion"],
  forearms_grip: ["elbow_flexion", "isolation"],
  forearms_wrist: ["elbow_flexion", "isolation"],
  triceps_pushdown: ["elbow_extension"],
  triceps_overhead: ["elbow_extension"],
  triceps_press: ["horizontal_push", "vertical_push"],
  triceps_general: ["elbow_extension", "horizontal_push", "vertical_push"],
  legs_knee_dominant: ["knee_dominant"],
  legs_knee_extension: ["knee_extension", "isolation"],
  legs_hip_dominant: ["hip_hinge"],
  legs_knee_flexion: ["knee_flexion"],
  legs_glute_isolation: ["hip_hinge", "hip_abduction", "isolation"],
  legs_calves: ["plantar_flexion"],
  legs_adductors: ["hip_adduction", "isolation"],
  legs_abductors: ["hip_abduction", "isolation"],
  core_anti_extension: ["anti_extension"],
  core_lateral: ["lateral_flexion", "anti_extension"],
  core_rotation: ["trunk_rotation"],
  core_hip_raise: ["hip_flexion_core"],
  core_flexion: ["trunk_flexion"],
};

export function movementRoleFit(exercise, targetRole) {
  if (!targetRole) return 1;
  if (targetRole.endsWith("_mobility")) {
    return exercise.app.movement === "mobility" ? 0 : 2;
  }

  const allowed = ROLE_MOVEMENTS[targetRole];
  if (allowed) return allowed.includes(exercise.app.movement) ? 0 : 2;
  if (["cardio", "mobility"].includes(exercise.app.movement)) return 2;
  return 1;
}

function generationComplexityOrder(profile) {
  const target = maxComplexity(profile.level);
  const order = [target];

  // Simpler technical exercises remain valid for experienced users, especially
  // stable machine work. Exhaust lower levels before considering a harder move.
  for (let complexity = target - 1; complexity >= 1; complexity -= 1) {
    order.push(complexity);
  }

  // Never move a Starter profile upward automatically. Intermediate and
  // Advanced profiles may use only one level above when coverage is otherwise missing.
  if (target > 1 && target < 4) order.push(target + 1);

  return [...new Set(order)];
}

function volumeTarget(profile, group) {
  const goal = VOLUME_TARGETS[profile.goal] || VOLUME_TARGETS.general;
  return goal[profile.level] || goal.starter;
}

function contributionCredit(exercise, group) {
  const credits = exercise.app.setCredits || {};
  if (Number.isFinite(Number(credits[group]))) return Number(credits[group]);
  if (group === "arms" && ["biceps", "triceps", "forearms"].includes(exercise.app.group)) return 1;
  if (group === "legs" && ["quads", "hamstrings", "glutes", "calves", "adductors", "abductors"].includes(exercise.app.group)) return 1;
  return groupMatches(exercise, group) ? 1 : 0;
}

function volumeEntry(tracker, group) {
  if (!tracker[group]) tracker[group] = { direct: 0, effective: 0 };
  return tracker[group];
}

function volumeSelectionScore(exercise, sets, tracker, selectedGroups, profile) {
  let score = 0;
  for (const group of selectedGroups) {
    const credit = contributionCredit(exercise, group);
    if (!credit) continue;
    const current = volumeEntry(tracker, group);
    const target = volumeTarget(profile, group);
    const projected = current.effective + sets * credit;
    if (current.effective < target.min) score += 5 * credit;
    else if (current.effective < target.target) score += 2.5 * credit;
    if (projected > target.max) score -= 7 * (projected - target.max) * credit;
    const isDirect = groupMatches(exercise, group);
    if (isDirect && current.direct < Math.max(2, target.min * 0.5)) score += 2;
  }
  return score;
}

function addExerciseVolume(tracker, exercise, sets, selectedGroups) {
  for (const group of selectedGroups) {
    const credit = contributionCredit(exercise, group);
    if (!credit) continue;
    const entry = volumeEntry(tracker, group);
    entry.effective += sets * credit;
    if (groupMatches(exercise, group)) entry.direct += sets;
  }
}

function calculateWeeklyVolume(workouts, exerciseMap, selectedGroups, profile) {
  const tracker = {};
  for (const workout of workouts) {
    for (const item of workout.exercises) {
      const exercise = exerciseMap.get(item.exerciseId);
      if (!exercise) continue;
      addExerciseVolume(tracker, exercise, Number(item.sets) || 0, selectedGroups);
    }
  }

  const summary = {};
  for (const group of selectedGroups) {
    const values = tracker[group] || { direct: 0, effective: 0 };
    const target = volumeTarget(profile, group);
    const effective = Math.round(values.effective * 10) / 10;
    const direct = Math.round(values.direct * 10) / 10;
    summary[group] = {
      direct,
      effective,
      ...target,
      status:
        effective < target.min
          ? "below"
          : effective > target.max
            ? "above"
            : "within",
    };
  }
  return summary;
}

function calculateWeeklyCoverage(workouts, exerciseMap, selectedGroups) {
  const plannedCounts = new Map();
  for (const workout of workouts) {
    for (const item of workout.exercises || []) {
      const exercise = exerciseMap.get(item.exerciseId);
      const requestedGroup = item.requestedGroup || item.targetGroup || exercise?.app.group;
      const plannedGroup = ["arms", "legs"].includes(requestedGroup)
        ? exercise?.app.group || requestedGroup
        : requestedGroup;
      if (plannedGroup) {
        plannedCounts.set(plannedGroup, (plannedCounts.get(plannedGroup) || 0) + 1);
      }
    }
  }
  const actualGroups = workouts.flatMap((workout) =>
    (workout.exercises || []).map((item) => {
      const exercise = exerciseMap.get(item.exerciseId);
      return exercise?.app.group || item.targetGroup || item.requestedGroup;
    }),
  );
  const exactPlannedGroups = [
    ...[...selectedGroups].filter((group) => !["arms", "legs"].includes(group)),
    ...plannedCounts.keys(),
  ];
  const groups = [...new Set([...exactPlannedGroups, ...actualGroups])].filter(Boolean);
  const totalExerciseSlots = workouts.reduce(
    (total, workout) => total + (workout.exercises || []).length,
    0,
  );
  const requestedExerciseSlots = workouts.reduce(
    (total, workout) =>
      total + (Number(workout.requestedExerciseCount) || (workout.exercises || []).length),
    0,
  );
  const averageSlots = groups.length ? totalExerciseSlots / groups.length : 0;
  const minimumPerGroup = averageSlots >= 2 ? 2 : 1;
  const maximumPerGroup = averageSlots >= 3 ? 3 : 2;
  const summary = {};

  for (const group of groups) {
    const exerciseIds = new Set();
    const workoutIds = new Set();
    let exerciseSlots = 0;
    let directSets = 0;

    for (const workout of workouts) {
      for (const item of workout.exercises || []) {
        const exercise = exerciseMap.get(item.exerciseId);
        if (!exercise || exercise.app.group !== group) continue;
        exerciseSlots += 1;
        directSets += Number(item.sets) || 0;
        exerciseIds.add(item.exerciseId);
        workoutIds.add(workout.id);
      }
    }

    const plannedExerciseSlots = plannedCounts.get(group) || 0;
    const groupMinimum = plannedExerciseSlots >= 2 ? 2 : 1;
    const groupMaximum =
      plannedExerciseSlots >= 3 ? Math.max(3, plannedExerciseSlots) : 2;

    summary[group] = {
      exerciseSlots,
      uniqueExercises: exerciseIds.size,
      sessions: workoutIds.size,
      directSets,
      plannedExerciseSlots,
      min: groupMinimum,
      max: groupMaximum,
      status:
        exerciseSlots < groupMinimum
          ? "below"
          : exerciseSlots > groupMaximum
            ? "above"
            : "within",
    };
  }

  for (const workout of workouts) {
    const perGroup = new Map();
    for (const item of workout.exercises || []) {
      const exercise = exerciseMap.get(item.exerciseId);
      const group = exercise?.app.group || item.targetGroup || item.requestedGroup;
      if (!group) continue;
      perGroup.set(group, (perGroup.get(group) || 0) + 1);
    }
    workout.muscleCoverage = [...perGroup].map(([group, exercises]) => ({
      group,
      exercises,
    }));
  }

  return {
    totalExerciseSlots,
    requestedExerciseSlots,
    availabilityShortfall: Math.max(0, requestedExerciseSlots - totalExerciseSlots),
    minimumPerGroup,
    maximumPerGroup,
    groups: summary,
    capacityLimited: minimumPerGroup < 2,
  };
}

function rebalanceProgrammeSets(workouts, exerciseMap, selectedGroups, profile) {
  const minimumSets = 2;
  const maximumSets = 4;

  for (let iteration = 0; iteration < 30; iteration += 1) {
    const summary = calculateWeeklyVolume(workouts, exerciseMap, selectedGroups, profile);
    const below = [...selectedGroups]
      .filter((group) => summary[group]?.effective < summary[group]?.min)
      .sort((a, b) => (summary[a]?.effective || 0) - (summary[b]?.effective || 0));

    if (!below.length) break;
    let changed = false;

    for (const group of below) {
      const candidates = workouts
        .flatMap((workout) => workout.exercises)
        .map((item) => ({ item, exercise: exerciseMap.get(item.exerciseId) }))
        .filter(({ item, exercise }) =>
          exercise &&
          groupMatches(exercise, group) &&
          Number(item.sets) < maximumSets,
        )
        .sort((a, b) =>
          (a.exercise.app.programming?.orderPriority || 3) -
          (b.exercise.app.programming?.orderPriority || 3),
        );

      if (candidates.length) {
        candidates[0].item.sets = Number(candidates[0].item.sets) + 1;
        changed = true;
      }
    }

    if (!changed) break;
  }

  for (let iteration = 0; iteration < 30; iteration += 1) {
    const summary = calculateWeeklyVolume(workouts, exerciseMap, selectedGroups, profile);
    const above = [...selectedGroups].filter(
      (group) => summary[group]?.effective > summary[group]?.max,
    );
    if (!above.length) break;
    let changed = false;

    for (const group of above) {
      const candidates = workouts
        .flatMap((workout) => workout.exercises)
        .map((item) => ({ item, exercise: exerciseMap.get(item.exerciseId) }))
        .filter(({ item, exercise }) =>
          exercise &&
          contributionCredit(exercise, group) > 0 &&
          Number(item.sets) > minimumSets,
        )
        .sort((a, b) =>
          (b.exercise.app.programming?.orderPriority || 3) -
          (a.exercise.app.programming?.orderPriority || 3),
        );

      if (candidates.length) {
        candidates[0].item.sets = Number(candidates[0].item.sets) - 1;
        changed = true;
      }
    }

    if (!changed) break;
  }
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

function programmingFitScore(exercise, profile) {
  const mechanics = exercise.app.mechanics || {};
  const type = exercise.app.exerciseType || "accessory";
  const tags = exercise.app.goalTags || [];
  let score = 0;

  if (exercise.app.programming?.defaultAvoid) score -= 20;

  if (profile.goal === "hypertrophy") {
    if (["main_lift", "compound_accessory", "accessory", "isolation"].includes(type)) score += 3;
    if (mechanics.loadability === "high") score += 2;
    if (mechanics.stability === "low") score += 1;
    if (mechanics.stability === "high" && exercise.app.complexity >= 3) score -= 4;
    if (type === "conditioning" || mechanics.impact === "high") score -= 10;
    if (tags.includes("power") && mechanics.impact === "high") score -= 5;
  }

  if (profile.goal === "strength") {
    if (["main_lift", "compound_accessory"].includes(type)) score += 6;
    if (type === "isolation") score -= 1;
    if (mechanics.loadability === "high") score += 2;
  }

  if (profile.goal === "general") {
    if (mechanics.impact === "high") score -= 5;
    if (mechanics.stability === "high" && exercise.app.complexity > 2) score -= 2;
    if (["main_lift", "compound_accessory", "accessory"].includes(type)) score += 2;
  }

  if (profile.goal === "power") {
    score += tags.includes("power") ? 10 : -3;
  }

  if (profile.goal === "endurance") {
    if (["conditioning", "accessory", "isolation"].includes(type)) score += 3;
    if (mechanics.fatigueCost === "high") score -= 2;
  }

  if (profile.goal === "conditioning") {
    score += tags.includes("conditioning") ? 8 : 0;
  }

  if (profile.goal === "mobility") {
    score += tags.includes("mobility") ? 8 : -8;
  }

  return score;
}

function roleSpecificFitScore(exercise, targetRole) {
  if (!targetRole) return 0;
  const movement = exercise.app.movement;
  if (targetRole.startsWith("biceps_")) {
    if (movement === "elbow_flexion") return 6;
    if (movement === "vertical_pull") return -4;
  }
  if (targetRole.startsWith("triceps_")) {
    if (movement === "elbow_extension") return 6;
    if (movement === "horizontal_push") return -2;
  }
  if (targetRole === "shoulder_lateral_raise") {
    if ((exercise.app.trainingRoles || []).includes("shoulder_lateral_raise")) return 4;
  }
  return 0;
}

function chooseExerciseForGroup(
  pool,
  targetGroup,
  targetRole,
  used,
  profile,
  random,
  volumeTracker,
  selectedProgrammeGroups,
) {
  const groupCandidates = pool.filter(
    (exercise) => groupMatches(exercise, targetGroup) && !used.has(exercise.id),
  );
  if (!groupCandidates.length) return null;

  const targetComplexity = maxComplexity(profile.level);
  const baseSets = Number((GOALS[profile.goal] || GOALS.general).sets);
  const candidatesWithTier = groupCandidates.map((exercise) => {
    const tier = roleTier(exercise, targetRole);
    const movementFit = movementRoleFit(exercise, targetRole);
    return {
      exercise,
      tier,
      movementFit,
      semanticRank: movementFit * 3 + tier,
    };
  });
  const bestSemanticRank = Math.min(...candidatesWithTier.map((item) => item.semanticRank));

  const ranked = candidatesWithTier
    .filter((item) => item.semanticRank === bestSemanticRank)
    .map(({ exercise, tier }) => {
      const roleScore = tier === 0 ? 18 : tier === 1 ? 8 : 0;
      const complexityDistance = Math.abs(exercise.app.complexity - targetComplexity);
      return {
        exercise,
        tier,
        score:
          roleScore +
          roleSpecificFitScore(exercise, targetRole) +
          goalScore(exercise, profile.goal) +
          programmingFitScore(exercise, profile) +
          volumeSelectionScore(
            exercise,
            baseSets,
            volumeTracker,
            selectedProgrammeGroups,
            profile,
          ) +
          (exercise.app.quality?.confidence === "high" ? 1.5 : 0) -
          cautionPenalty(exercise, profile) -
          complexityDistance * 0.75 +
          ((profile.favorites || []).includes(exercise.id) ? 4 : 0) +
          random() * 0.5,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) return null;

  const resolvedRole =
    best.tier === 2
      ? (best.exercise.app.trainingRoles || []).find((role) =>
          (GROUP_ROLE_PLANS[targetGroup] || []).includes(role),
        ) || null
      : targetRole;

  return {
    exercise: best.exercise,
    targetGroup,
    requestedRole: targetRole,
    targetRole: resolvedRole,
    roleMatch: best.tier === 0 ? "exact" : best.tier === 1 ? "related" : resolvedRole ? "alternative" : "group",
    difficultyDelta: best.exercise.app.complexity - targetComplexity,
  };
}

function chooseExercise(
  pool,
  slot,
  allowedGroups,
  used,
  profile,
  random,
  selectedGroupOccurrences,
  volumeTracker,
  selectedProgrammeGroups,
) {
  const groupOrder = [
    slot.group,
    ...companionGroupsFor(slot.group, allowedGroups),
  ];

  for (const targetGroup of groupOrder) {
    const targetRole =
      targetGroup === slot.group
        ? slot.role
        : targetRoleFor(
            targetGroup,
            selectedGroupOccurrences.get(targetGroup) || 0,
          );
    const selection = chooseExerciseForGroup(
      pool,
      targetGroup,
      targetRole,
      used,
      profile,
      random,
      volumeTracker,
      selectedProgrammeGroups,
    );
    if (!selection) continue;

    return {
      ...selection,
      requestedGroup: slot.group,
      groupMatch: targetGroup === slot.group ? "exact" : "companion",
    };
  }

  return null;
}

function selectionQuality(selection) {
  const groupPenalty = selection.groupMatch === "exact" ? 0 : 10;
  const rolePenalty = selection.roleMatch === "exact" ? 0 : selection.roleMatch === "related" ? 2 : 4;
  return groupPenalty + rolePenalty + Math.abs(selection.difficultyDelta || 0);
}

function prescription(profile, selection, index, slot) {
  const exercise = selection.exercise;
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
  if (profile.goal === "hypertrophy") {
    const type = exercise.app.exerciseType || "accessory";
    reps = ["main_lift", "compound_accessory"].includes(type) ? "6–10" : "10–15";
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

  return {
    exerciseId: exercise.id,
    requestedGroup: selection.requestedGroup || slot.group,
    targetGroup: selection.targetGroup || slot.group,
    targetRole: selection.targetRole,
    requestedRole: selection.requestedRole || slot.role,
    groupMatch: selection.groupMatch || "exact",
    roleMatch: selection.roleMatch,
    difficultyDelta: selection.difficultyDelta,
    constraintNotes: activeConstraintNotes(exercise, profile),
    setCredits: exercise.app.setCredits || { [exercise.app.group]: 1 },
    qualityConfidence: exercise.app.quality?.confidence || "unknown",
    sets,
    reps,
    restSeconds,
    order: index + 1,
  };
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
  const profileComplexity = maxComplexity(profile.level);
  const pool = exercises.filter((exercise) =>
    eligibleForProfile(exercise, profile, state, profileComplexity),
  );
  if (pool.length < 20) {
    throw new Error(
      "The current equipment and safety filters leave too few exercises. Adjust the profile before building a programme.",
    );
  }

  const requestedWorkoutDays = workoutDaysForProfile(profile);
  const mobilityPresetAdapted =
    profile.goal === "mobility" && profile.splitPreset !== "custom";
  const workoutDays = mobilityPresetAdapted
    ? requestedWorkoutDays.map((day, index) => ({
        ...day,
        name: `Full-body mobility ${String.fromCharCode(65 + index)}`,
        type: "full_body",
        emphasis: [],
        strictFocus: false,
        goalAdapted: true,
      }))
    : requestedWorkoutDays;
  const split = workoutDays.map((day) => {
    const groupSlots = day.goalAdapted
      ? [...MOBILITY_GROUP_SLOTS]
      : slotsForWorkoutDay(day);
    return {
      name: day.name,
      type: day.type,
      emphasis: day.emphasis,
      strictFocus: day.strictFocus,
      groupSlots,
      allowedGroups: [...new Set(groupSlots)],
    };
  });
  const targetCount =
    profile.sessionMinutes <= 30 ? 5 : profile.sessionMinutes <= 45 ? 6 : profile.sessionMinutes <= 60 ? 7 : 8;
  const plannedGroupSlots = planWeeklyGroupSlots(split, targetCount);
  split.forEach((template, index) => {
    template.plannedGroupSlots = plannedGroupSlots[index];
  });

  const random = rng(hashString(JSON.stringify(profile) + variation));
  const usedAcross = new Set();
  const selectedProgrammeGroups = new Set(
    plannedGroupSlots.flat(),
  );
  const volumeTracker = {};

  const workouts = split.map((template, workoutIndex) => {
    const used = new Set();
    const selectedGroupOccurrences = new Map();
    const groupSlots = [...template.plannedGroupSlots];
    const slotAttempts = Math.max(18, targetCount * 4);
    while (groupSlots.length < slotAttempts) {
      groupSlots.push(
        groupSlots[groupSlots.length % template.plannedGroupSlots.length],
      );
    }
    const slots = addTrainingRoles(groupSlots);

    const chosen = [];
    for (const slot of slots) {
      if (chosen.length >= targetCount) break;
      let selection = chooseExercise(
        pool,
        slot,
        template.allowedGroups,
        used,
        profile,
        random,
        selectedGroupOccurrences,
        volumeTracker,
        selectedProgrammeGroups,
      );
      if (!selection) continue;

      if (
        usedAcross.has(selection.exercise.id) &&
        pool.length > targetCount * split.length
      ) {
        const unusedPool = pool.filter(
          (candidate) => !usedAcross.has(candidate.id),
        );
        const alternative = chooseExercise(
          unusedPool,
          slot,
          template.allowedGroups,
          used,
          profile,
          random,
          selectedGroupOccurrences,
          volumeTracker,
          selectedProgrammeGroups,
        );
        if (alternative) {
          // With 1,324 records available, prefer weekly variety over repeating
          // the same exercise in another workout.
          selection = alternative;
        }
      }

      used.add(selection.exercise.id);
      usedAcross.add(selection.exercise.id);
      selectedGroupOccurrences.set(
        selection.targetGroup,
        (selectedGroupOccurrences.get(selection.targetGroup) || 0) + 1,
      );
      addExerciseVolume(
        volumeTracker,
        selection.exercise,
        Number((GOALS[profile.goal] || GOALS.general).sets),
        selectedProgrammeGroups,
      );
      chosen.push({ selection, slot });
    }

    return {
      id: `workout-${workoutIndex + 1}`,
      name: template.name,
      type: template.type,
      emphasis: template.emphasis,
      strictFocus: template.strictFocus,
      allowedGroups: template.allowedGroups,
      requestedExerciseCount: targetCount,
      availabilityShortfall: Math.max(0, targetCount - chosen.length),
      exercises: chosen.map(({ selection, slot }, index) =>
        prescription(profile, selection, index, slot),
      ),
    };
  });

  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  rebalanceProgrammeSets(
    workouts,
    exerciseMap,
    selectedProgrammeGroups,
    profile,
  );
  const weeklyVolume = calculateWeeklyVolume(
    workouts,
    exerciseMap,
    selectedProgrammeGroups,
    profile,
  );
  const weeklyCoverage = calculateWeeklyCoverage(
    workouts,
    exerciseMap,
    selectedProgrammeGroups,
  );

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
    splitName: mobilityPresetAdapted
      ? "Full-body mobility rotation"
      : splitLabel(profile, workoutDays),
    structureNote: mobilityPresetAdapted
      ? "The selected resistance-training preset was adapted to a full-body mobility rotation because push, pull and limb-isolation splits do not map reliably to the available mobility catalogue. Choose a custom structure to require specific mobility muscles."
      : "",
    workoutDays,
    progression: progression(profile.goal),
    weeklyVolume,
    weeklyCoverage,
    coverageMethod: "Exercise slots are balanced across the full week. Complete-body plans target two to three direct exercise slots per planned muscle when the selected days and session length provide enough capacity.",
    volumeMethod: "Primary sets count 1.0; strong secondary work counts 0.5; stabilising work counts 0.25.",
    enrichmentVersion: "3.1.0",
    plannerVersion: "3.3.0",
    reviewWeeks: [4, 8, durationWeeks].filter(
      (value, index, values) => value <= durationWeeks && values.indexOf(value) === index,
    ),
    workouts,
  };
}

export function refreshProgramVolume(program, exercises, profile) {
  if (!program) return {};
  const selectedGroups = new Set(
    Object.keys(program.weeklyVolume || {}).length
      ? Object.keys(program.weeklyVolume)
      : (program.workouts || []).flatMap(
          (workout) => workout.allowedGroups || workout.emphasis || [],
        ),
  );
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  program.weeklyVolume = calculateWeeklyVolume(
    program.workouts || [],
    exerciseMap,
    selectedGroups,
    profile,
  );
  program.weeklyCoverage = calculateWeeklyCoverage(
    program.workouts || [],
    exerciseMap,
    selectedGroups,
  );
  return program.weeklyVolume;
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

function completedSets(item) {
  return (item?.setsLog || [])
    .filter((set) => set.done)
    .map((set, index) => ({
      set: index + 1,
      weight: String(set.weight ?? ""),
      reps: String(set.reps ?? ""),
      rir: String(set.rir ?? ""),
    }));
}

export function summarizeProgramPerformance(program, history = []) {
  if (!program) return {};

  const performance = {};
  const sessions = history
    .filter((session) => session.programId === program.id && session.completedAt)
    .sort((a, b) => String(a.completedAt).localeCompare(String(b.completedAt)));

  for (const session of sessions) {
    for (const item of session.exercises || []) {
      const sets = completedSets(item);
      if (!sets.length) continue;
      performance[item.exerciseId] = {
        exerciseId: item.exerciseId,
        workoutId: session.workoutId,
        workoutName: session.workoutName,
        completedAt: session.completedAt,
        prescribedSets: Number(item.sets) || sets.length,
        prescribedReps: item.reps || "",
        sets,
      };
    }
  }

  return performance;
}

export function completedProgramSnapshot(program, history = [], completedAt = new Date().toISOString()) {
  if (!program) return null;
  return {
    ...clone(program),
    status: "completed",
    completedAt,
    performanceByExercise: summarizeProgramPerformance(program, history),
  };
}

function sameTrainingSlot(previousItem, nextItem) {
  if (
    previousItem.targetRole &&
    nextItem.targetRole &&
    previousItem.targetRole === nextItem.targetRole
  ) {
    return true;
  }
  const previousGroup = previousItem.requestedGroup || previousItem.targetGroup;
  const nextGroup = nextItem.requestedGroup || nextItem.targetGroup;
  return Boolean(previousGroup && nextGroup && previousGroup === nextGroup);
}

function prescriptionChanges(previousItem, nextItem) {
  const changes = [];
  if (Number(previousItem.sets) !== Number(nextItem.sets)) {
    changes.push({ field: "sets", before: previousItem.sets, after: nextItem.sets });
  }
  if (String(previousItem.reps) !== String(nextItem.reps)) {
    changes.push({ field: "reps", before: previousItem.reps, after: nextItem.reps });
  }
  if (Number(previousItem.restSeconds) !== Number(nextItem.restSeconds)) {
    changes.push({
      field: "rest",
      before: previousItem.restSeconds,
      after: nextItem.restSeconds,
    });
  }
  return changes;
}

function repetitionBounds(value) {
  const values = String(value || "").match(/\d+/g)?.map(Number) || [];
  return {
    min: values[0] || 1,
    max: values[values.length - 1] || values[0] || 999,
  };
}

export function continuationSuggestion(previousProgram, nextItem) {
  const performance = previousProgram?.performanceByExercise?.[nextItem?.exerciseId];
  if (!performance?.sets?.length) {
    return { type: "steady", reason: "No completed sets were available to justify an automatic adjustment." };
  }

  const review = previousProgram?.review || {};
  const bounds = repetitionBounds(nextItem.reps);
  const completed = performance.sets.filter((set) => Number(set.reps) > 0);
  const weighted = completed.some((set) => Number(set.weight) > 0);
  const allAtTop = completed.length > 0 && completed.every((set) => Number(set.reps) >= bounds.max);
  const reserveSupportsProgression = completed.every(
    (set) => String(set.rir || "").trim() && Number(set.rir) >= 2,
  );
  const needsReduction =
    review.outcome === "too_hard" ||
    review.recovery === "poor" ||
    review.symptoms === "yes";
  const requestedProgress = review.outcome === "too_easy" && review.recovery === "good";
  const earnedProgress = allAtTop && reserveSupportsProgression;

  if (needsReduction) {
    return {
      type: "reduced",
      weightMultiplier: 0.9,
      repDelta: weighted ? 0 : -1,
      minReps: bounds.min,
      reason: review.symptoms === "yes"
        ? "New or worsening symptoms were reported; start conservatively and use a pain-free substitute when needed."
        : "The completed block was reported as too hard or poorly recovered, so the starting load is reduced by 10%.",
    };
  }

  if ((requestedProgress || earnedProgress) && weighted && allAtTop) {
    return {
      type: "progressed_load",
      weightMultiplier: 1.025,
      resetRepsTo: bounds.min,
      reason: requestedProgress
        ? "The block felt easier than expected with good recovery and the top of the repetition range was achieved."
        : "Every recorded set reached the top of the range with sufficient repetitions in reserve.",
    };
  }

  if (requestedProgress || earnedProgress) {
    return {
      type: "progressed_reps",
      repDelta: 1,
      maxReps: allAtTop && !weighted ? bounds.max + 1 : bounds.max,
      reason: requestedProgress
        ? "The block felt easier than expected with good recovery, so repetitions progress before load."
        : "Recorded performance supports a small repetition increase while load stays stable.",
    };
  }

  return {
    type: "steady",
    reason: "The last recorded values are retained until the repetition range and recovery support progression.",
  };
}

export function comparePrograms(previousProgram, nextProgram) {
  const summary = {
    retained: 0,
    progressed: 0,
    reduced: 0,
    replaced: 0,
    added: 0,
    removed: 0,
    adjusted: 0,
  };
  const retainedExerciseIds = new Set();
  const workouts = [];
  const previousWorkouts = previousProgram?.workouts || [];
  const nextWorkouts = nextProgram?.workouts || [];
  const workoutCount = Math.max(previousWorkouts.length, nextWorkouts.length);

  for (let workoutIndex = 0; workoutIndex < workoutCount; workoutIndex += 1) {
    const previousWorkout = previousWorkouts[workoutIndex] || null;
    const nextWorkoutItem = nextWorkouts[workoutIndex] || null;
    const previousItems = previousWorkout?.exercises || [];
    const nextItems = nextWorkoutItem?.exercises || [];
    const usedPrevious = new Set();
    const entries = [];

    for (const nextItem of nextItems) {
      let previousIndex = previousItems.findIndex(
        (item, index) => !usedPrevious.has(index) && item.exerciseId === nextItem.exerciseId,
      );
      let status = "retained";

      if (previousIndex < 0) {
        previousIndex = previousItems.findIndex(
          (item, index) => !usedPrevious.has(index) && sameTrainingSlot(item, nextItem),
        );
        status = previousIndex >= 0 ? "replaced" : "added";
      }

      const previousItem = previousIndex >= 0 ? previousItems[previousIndex] : null;
      if (previousIndex >= 0) usedPrevious.add(previousIndex);
      const changes = previousItem ? prescriptionChanges(previousItem, nextItem) : [];
      summary[status] += 1;
      if (status === "retained") retainedExerciseIds.add(nextItem.exerciseId);
      if (status === "retained" && nextItem.continuation?.type?.startsWith("progressed")) {
        summary.progressed += 1;
      }
      if (status === "retained" && nextItem.continuation?.type === "reduced") {
        summary.reduced += 1;
      }
      if (changes.length) summary.adjusted += 1;

      entries.push({
        status,
        previousItem,
        nextItem,
        changes,
        performance: previousItem
          ? previousProgram?.performanceByExercise?.[previousItem.exerciseId] || null
          : null,
      });
    }

    previousItems.forEach((previousItem, index) => {
      if (usedPrevious.has(index)) return;
      summary.removed += 1;
      entries.push({
        status: "removed",
        previousItem,
        nextItem: null,
        changes: [],
        performance:
          previousProgram?.performanceByExercise?.[previousItem.exerciseId] || null,
      });
    });

    workouts.push({
      previousWorkout,
      nextWorkout: nextWorkoutItem,
      entries,
    });
  }

  return {
    previousProgramId: previousProgram?.id || null,
    nextProgramId: nextProgram?.id || null,
    summary,
    retainedExerciseIds: [...retainedExerciseIds],
    workouts,
  };
}

export function summarizeProgramChanges(previousProgram, nextProgram) {
  const comparison = comparePrograms(previousProgram, nextProgram);
  const { retained, replaced, added, removed, adjusted } = comparison.summary;
  return {
    fromProgramId: comparison.previousProgramId,
    toProgramId: comparison.nextProgramId,
    retained,
    replaced,
    added,
    removed,
    adjusted,
    changedExerciseSlots: replaced + added + removed,
  };
}

export function linkProgramContinuation(nextProgram, previousProgram) {
  if (!nextProgram || !previousProgram) return nextProgram;
  const comparison = comparePrograms(previousProgram, nextProgram);
  const retained = new Set(comparison.retainedExerciseIds);
  return {
    ...nextProgram,
    predecessorProgramId: previousProgram.id,
    carryForwardExerciseIds: comparison.retainedExerciseIds,
    continuationReview: previousProgram.review || null,
    workouts: (nextProgram.workouts || []).map((workout) => ({
      ...workout,
      exercises: (workout.exercises || []).map((item) => ({
        ...item,
        continuation: retained.has(item.exerciseId)
          ? continuationSuggestion(previousProgram, item)
          : null,
      })),
    })),
  };
}

export function carriedForwardSets(program, previousProgram, item) {
  const retained = new Set(program?.carryForwardExerciseIds || []);
  const performance = previousProgram?.performanceByExercise?.[item.exerciseId];
  if (
    !performance ||
    program?.predecessorProgramId !== previousProgram?.id ||
    !retained.has(item.exerciseId)
  ) {
    return null;
  }

  return Array.from({ length: Number(item.sets) || 0 }, (_, index) => {
    const previousSet = performance.sets?.[index];
    const suggestion = item.continuation || { type: "steady" };
    const previousWeight = Number(previousSet?.weight);
    const adjustedWeight =
      previousSet?.weight && suggestion.weightMultiplier && Number.isFinite(previousWeight)
        ? String(Math.round(previousWeight * suggestion.weightMultiplier * 2) / 2)
        : previousSet?.weight || "";
    const previousReps = Number(previousSet?.reps);
    const adjustedReps = suggestion.resetRepsTo
      ? String(suggestion.resetRepsTo)
      : suggestion.repDelta && Number.isFinite(previousReps)
        ? String(
            Math.max(
              suggestion.minReps || 1,
              Math.min(suggestion.maxReps || 999, previousReps + suggestion.repDelta),
            ),
          )
        : previousSet?.reps || "";
    return {
      set: index + 1,
      weight: adjustedWeight,
      reps: adjustedReps,
      rir: previousSet?.rir || "",
      done: false,
    };
  });
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
  targetGroup = null,
  targetRole = null,
  allowedGroups = [],
  requestedGroup = null,
) {
  const current = exercises.find((exercise) => exercise.id === currentId);
  if (!current) return [];

  const profileDifficulty = maxComplexity(profile.level);
  const requestedDifficulty = Number(difficulty);
  const allowed = allowedEquipment(profile);
  const replacementTarget = targetGroup || current.app.group;
  const originalRequestedGroup = requestedGroup || replacementTarget;
  const groupOrder = [
    replacementTarget,
    ...companionGroupsFor(replacementTarget, allowedGroups),
  ];

  return exercises
    .filter((exercise) => {
      if (exercise.id === currentId || existingIds.includes(exercise.id)) return false;
      if (!allowed.has(exercise.equipment)) return false;
      if ((state.gym?.unavailableExerciseIds || []).includes(exercise.id)) return false;
      if (
        (profile.constraints || []).some((constraint) =>
          HARD_COMPATIBILITY_STATUSES.has(compatibilityStatus(exercise, constraint)),
        )
      ) {
        return false;
      }
      if (exercise.app.quality?.reviewStatus === "needs_review") return false;
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
      if (difficulty === "profile" && exercise.app.complexity > profileDifficulty) {
        return false;
      }
      if (
        !["all", "profile"].includes(difficulty) &&
        exercise.app.complexity !== requestedDifficulty
      ) {
        return false;
      }
      return groupOrder.some((group) => groupMatches(exercise, group));
    })
    .map((exercise) => {
      const matchedGroup = groupOrder.find((group) => groupMatches(exercise, group));
      const groupIndex = groupOrder.indexOf(matchedGroup);
      const resolvedRole =
        matchedGroup === replacementTarget
          ? targetRole
          : (GROUP_ROLE_PLANS[matchedGroup] || []).find((role) =>
              (exercise.app.trainingRoles || []).includes(role),
            ) || targetRoleFor(matchedGroup, 0);
      const targetRoleTier = roleTier(exercise, resolvedRole);
      const sameGroup = exercise.app.group === current.app.group;
      const sameMovement = exercise.app.movement === current.app.movement;
      const sameEquipment = exercise.equipment === current.equipment;
      const complexityDistance = Math.abs(
        exercise.app.complexity - current.app.complexity,
      );
      return {
        exercise: {
          ...exercise,
          _replacement: {
            requestedGroup: originalRequestedGroup,
            targetGroup: matchedGroup,
            targetRole: resolvedRole,
            groupMatch: matchedGroup === originalRequestedGroup ? "exact" : "companion",
            roleMatch: targetRoleTier === 0 ? "exact" : targetRoleTier === 1 ? "related" : "group",
          },
        },
        score:
          (groupIndex === 0 ? 30 : Math.max(4, 20 - groupIndex * 4)) +
          (targetRoleTier === 0 ? 14 : targetRoleTier === 1 ? 7 : 0) +
          (sameGroup ? 7 : 0) +
          (sameMovement ? 3 : 0) +
          (sameEquipment ? 1.5 : 0) +
          goalScore(exercise, goal) -
          cautionPenalty(exercise, profile) +
          (exercise.app.quality?.confidence === "high" ? 1.5 : 0) -
          complexityDistance * 0.75,
      };
    })
    .sort((a, b) => {
      const matchTier = (item) =>
        item.exercise._replacement.groupMatch === "exact"
          ? item.exercise._replacement.roleMatch === "exact"
            ? 0
            : 1
          : 2;
      return (
        matchTier(a) - matchTier(b) ||
        b.score - a.score ||
        a.exercise.name.localeCompare(b.exercise.name)
      );
    })
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
  targetGroup = null,
  targetRole = null,
  allowedGroups = [],
  requestedGroup = null,
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
      "profile",
      targetGroup,
      targetRole,
      allowedGroups,
      requestedGroup,
    )[0] || null
  );
}
