const normalize = (value) => String(value || "").trim().toLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function hasPhrase(text, phrases) {
  return phrases.some((phrase) => {
    const normalizedPhrase = normalize(phrase);
    const escaped = escapeRegExp(normalizedPhrase).replace(/ /g, "[ -]");
    const plural = /[a-z0-9]$/.test(normalizedPhrase) ? "(?:s|es)?" : "";
    return new RegExp(`(?:^|[^a-z0-9])${escaped}${plural}(?:$|[^a-z0-9])`, "i").test(text);
  });
}

function exerciseText(exercise) {
  return normalize(`${exercise.name} ${exercise.instructions?.en || ""}`);
}

function actionName(exercise) {
  return normalize(String(exercise.name || "").replace(/\([^)]*\)/g, " "));
}

function isMobility(exercise, existing = {}) {
  const name = normalize(exercise.name);
  if (hasPhrase(name, [
    "planche", "front lever", "back lever", "l-sit", "v-sit", "side plank",
    "maltese", "flag", "skin the cat",
  ])) return false;
  return existing.exerciseType === "mobility" || existing.movement === "mobility" ||
    hasPhrase(name, ["stretch", "mobility", "pose", "foam roll"]);
}

function isAssistedOrScaled(name, equipment) {
  return equipment === "assisted" || hasPhrase(name, [
    "assisted", "self assisted", "wall push-up", "wall push up", "kneeling push-up",
    "kneeling push up", "on knees", "incline push-up", "incline push up", "modified push-up",
    "modified push up", "push-up (wall)", "push up (wall)",
  ]);
}

function score(label, level, reasons) {
  return { label, level, reasons };
}

function techniqueAssessment(exercise, existing = {}) {
  const name = normalize(exercise.name);
  const equipment = normalize(exercise.equipment);
  const mechanics = existing.mechanics || {};

  if (isMobility(exercise, existing)) {
    const level = mechanics.stability === "high" || mechanics.unilateral ? 2 : 1;
    return score("technique", level, [level === 2 ? "mobility_balance_control" : "supported_or_simple_mobility"]);
  }

  const expert = [
    "muscle-up", "muscle up", "front lever", "back lever", "human flag",
    "one arm pull-up", "one-arm pull-up", "one arm chin-up", "one-arm chin-up",
    "one arm push-up", "one-arm push-up", "single arm push-up", "single-arm push-up",
    "raise single arm push-up", "handstand push-up", "handstand push up", "full planche",
    "straddle planche", "v-sit", "impossible dips", "superman push-up", "superman push up",
    "stalder press", "full maltese", "straddle maltese", "human flag",
    "clean and jerk", "clean & jerk",
  ];
  if (
    hasPhrase(name, expert) ||
    (equipment === "body weight" && hasPhrase(name, ["iron cross", "flag"])) ||
    /(?:^|\s)(?:barbell |dumbbell |kettlebell )?snatch(?:\s|$)/.test(name)
  ) {
    return score("technique", 4, ["expert_skill_pattern"]);
  }

  const advanced = [
    "planche", "handstand", "pistol squat", "dragon flag", "l-sit", "archer push-up",
    "archer push up", "clap push-up", "clap push up", "plyometric push-up",
    "plyometric push up", "depth jump", "turkish get-up", "turkish get up", "sots press",
    "overhead squat", "wall walk", "typewriter pull-up", "typewriter pull up", "nordic curl",
    "nordic hamstring", "korean dips", "pike push-up", "pike push up", "ring dips",
    "one arm dip", "skin the cat", "single leg squat", "plyo push-up", "plyo push up",
  ];
  if (hasPhrase(name, advanced)) return score("technique", 3, ["advanced_control_pattern"]);

  if (hasPhrase(name, ["box jump", "broad jump", "tuck jump", "jump lunge", "jump squat", "sprint"])) {
    return score("technique", 3, ["explosive_landing_or_speed"]);
  }

  const compound = [
    "squat", "deadlift", "good morning", "bench press", "overhead press", "military press",
    "push press", "thruster", "clean", "jerk", "swing", "windmill", "bent-over row",
    "bent over row", "renegade row",
  ];
  const control = [
    "single leg", "single-leg", "one leg", "one-leg", "single arm", "single-arm",
    "one arm", "one-arm", "unilateral", "contralateral", "cross body", "cross-body",
    "stability ball", "swiss ball", "bosu", "suspension", "trx", "inverted row",
    "bear crawl", "crab walk", "walking lunge", "side plank", "plank row", "suspended",
  ];
  if (
    hasPhrase(name, control) ||
    (["barbell", "dumbbell", "ez barbell", "kettlebell", "olympic barbell", "trap bar", "weighted"].includes(equipment) && hasPhrase(name, compound)) ||
    mechanics.setupComplexity === "high"
  ) {
    return score("technique", 2, ["compound_or_control_setup"]);
  }

  if (hasPhrase(name, ["press", "burpee", "jump", "throw", "catch"])) {
    return score("technique", 2, ["multi_joint_or_dynamic_sequence"]);
  }

  return score("technique", 1, ["simple_repeatable_pattern"]);
}

function strengthAssessment(exercise, existing = {}) {
  const name = normalize(exercise.name);
  const action = actionName(exercise);
  const equipment = normalize(exercise.equipment);
  const text = exerciseText(exercise);
  const weightedCalisthenic = equipment === "weighted" &&
    hasPhrase(action, ["pull-up", "pull up", "chin-up", "chin up", "dip", "muscle-up", "muscle up"]);
  const weightedExpertCalisthenic = equipment === "weighted" &&
    hasPhrase(action, ["pull-up", "pull up", "chin-up", "chin up", "muscle-up", "muscle up", "one hand pull-up", "one hand pull up", "straight bar dip"]);

  if (isMobility(exercise, existing)) return score("relativeStrength", 1, ["mobility_not_strength_limited"]);
  if (equipment !== "body weight" && !weightedCalisthenic && !hasPhrase(name, ["weighted pull-up", "weighted pull up", "weighted chin-up", "weighted chin up", "weighted dip"])) {
    return score("relativeStrength", 1, ["externally_loadable_or_scalable"]);
  }
  if (isAssistedOrScaled(name, equipment)) return score("relativeStrength", 1, ["assisted_or_scaled_variant"]);

  const expert = [
    "muscle-up", "muscle up", "front lever", "back lever", "human flag", "iron cross",
    "one arm pull-up", "one-arm pull-up", "one arm chin-up", "one-arm chin-up",
    "one arm push-up", "one-arm push-up", "single arm push-up", "single-arm push-up",
    "raise single arm push-up", "full planche", "straddle planche", "v-sit", "impossible dips",
    "superman push-up", "superman push up", "stalder press", "full maltese", "straddle maltese",
    "human flag", "weighted pull-up", "weighted pull up",
    "weighted chin-up", "weighted chin up", "weighted dip",
  ];
  if (hasPhrase(action, expert) || (equipment === "body weight" && hasPhrase(action, ["flag"]))) {
    return score("relativeStrength", 4, ["elite_relative_strength"]);
  }
  if (weightedExpertCalisthenic) return score("relativeStrength", 4, ["loaded_calisthenic_strength"]);
  if (weightedCalisthenic) return score("relativeStrength", 3, ["advanced_loaded_bodyweight_support"]);

  const high = [
    "pull-up", "pull up", "chin-up", "chin up", "chest dip", "parallel bar dip",
    "straight bar dip", "korean dips", "handstand", "pistol squat", "dragon flag", "l-sit",
    "nordic curl", "nordic hamstring", "toes to bar", "hanging leg raise", "hanging knee raise",
    "archer push-up", "archer push up", "clap push-up", "clap push up", "plyometric push-up",
    "plyometric push up", "decline push-up", "decline push up", "pike push-up", "pike push up",
    "diamond push-up", "diamond push up", "deep push-up", "deep push up", "suspended push-up",
    "suspended push up", "gorilla chin", "ring dips", "one arm dip", "skin the cat",
    "single leg squat", "plyo push-up", "plyo push up", "vertical leg raise",
  ];
  if (hasPhrase(action, high)) return score("relativeStrength", 3, ["high_bodyweight_fraction_or_hanging_pull"]);
  if (equipment === "body weight" && hasPhrase(action, ["hanging"]) && hasPhrase(action, ["raise", "pike", "crunch"])) {
    return score("relativeStrength", 3, ["hanging_bodyweight_raise"]);
  }
  if (equipment === "body weight" && hasPhrase(action, ["hanging", "gorilla chin"])) {
    return score("relativeStrength", 2, ["full_body_hanging_support"]);
  }

  const moderate = [
    "push-up", "push up", "bench dip", "triceps dip", "inverted row", "bodyweight row",
    "plank", "burpee", "mountain climber", "bear crawl", "crab walk", "wall walk",
    "body saw", "ab wheel", "rollerout", "rollout", "sissy squat",
  ];
  if (
    hasPhrase(action, moderate) ||
    hasPhrase(text, ["support your body weight", "supporting your body weight", "lift your body", "pull your body"])
  ) {
    return score("relativeStrength", 2, ["meaningful_bodyweight_support"]);
  }

  return score("relativeStrength", 1, ["low_or_scalable_relative_strength"]);
}

function mechanicalAssessment(exercise, existing = {}) {
  const mechanics = existing.mechanics || {};
  if (!Object.keys(mechanics).length) return score("mechanicalDemand", 1, ["mechanics_unavailable"]);

  let points = 0;
  const reasons = [];
  const add = (condition, value, reason) => {
    if (condition) {
      points += value;
      reasons.push(reason);
    }
  };

  add(mechanics.stability === "high", 2, "high_stability");
  add(mechanics.stability === "moderate", 1, "moderate_stability");
  add(mechanics.axialLoad === "high", 2, "high_axial_load");
  add(mechanics.axialLoad === "moderate", 1, "moderate_axial_load");
  add(mechanics.impact === "high", 2, "high_impact");
  add(mechanics.gripDemand === "high", 1, "high_grip_demand");
  const highJointDemand = [
    mechanics.shoulderDemand,
    mechanics.elbowDemand,
    mechanics.kneeDemand,
    mechanics.spinalDemand,
  ].includes("high");
  add(highJointDemand, 1, "high_joint_or_spinal_demand");
  add(mechanics.rangeDemand === "high", 1, "high_range_demand");
  add(mechanics.fatigueCost === "high", 2, "high_fatigue_cost");
  add(mechanics.setupComplexity === "high", 2, "high_setup_complexity");
  add(mechanics.setupComplexity === "moderate", 1, "moderate_setup_complexity");
  add(mechanics.posture === "hanging", 2, "hanging_posture");
  add(mechanics.unilateral, 1, "unilateral_demand");
  add(mechanics.overhead, 1, "overhead_position");
  if (mechanics.supported) points = Math.max(0, points - 1);

  let level = points >= 12 ? 4 : points >= 8 ? 3 : points >= 3 ? 2 : 1;
  if (mechanics.stability === "high") level = Math.max(level, 2);
  if (isMobility(exercise, existing)) level = Math.min(level, 2);
  return { label: "mechanicalDemand", level, points, reasons: reasons.length ? reasons : ["low_mechanical_demand"] };
}

export function assessDifficulty(exercise, existing = {}) {
  const technique = techniqueAssessment(exercise, existing);
  const relativeStrength = strengthAssessment(exercise, existing);
  const mechanicalDemand = mechanicalAssessment(exercise, existing);
  const angles = [technique.level, relativeStrength.level, mechanicalDemand.level];
  let level = Math.max(...angles);

  if (isMobility(exercise, existing)) level = Math.min(level, 2);

  const explicitExpert = technique.level === 4 || relativeStrength.level === 4;
  if (level === 4 && !explicitExpert && angles.filter((value) => value === 4).length < 2) level = 3;

  const reviewReasons = [];
  if (mechanicalDemand.level >= 3 && technique.level === 1 && relativeStrength.level === 1 && !isMobility(exercise, existing)) {
    reviewReasons.push("mechanical_demand_without_named_skill_anchor");
  }
  if (hasPhrase(normalize(exercise.name), ["full maltese"])) {
    reviewReasons.push("source_name_instruction_conflict");
  }
  return {
    level,
    technique,
    relativeStrength,
    mechanicalDemand,
    reviewReasons,
  };
}

export function correctMovement(exercise, existingMovement) {
  const name = actionName(exercise);

  if (hasPhrase(name, ["stretch", "mobility", "pose", "foam roll"])) return "mobility";
  if (hasPhrase(name, ["run", "running", "cycling", "jump rope", "burpee", "mountain climber", "jumping jack", "sprint", "quick feet", "fast feet"])) return "cardio";
  if (hasPhrase(name, ["reverse fly", "reverse flye", "revers fly", "rear fly", "rear delt fly"])) return "horizontal_pull";
  if (hasPhrase(name, ["planche push-up", "planche push up"])) return "horizontal_push";
  if (hasPhrase(name, ["handstand push-up", "handstand push up"])) return "vertical_push";
  if (hasPhrase(name, ["push-up", "push up"])) return "horizontal_push";
  if (hasPhrase(name, ["side plank"]) && hasPhrase(name, ["adduction", "abduction", "fly"])) return existingMovement;
  if (hasPhrase(name, ["planche", "side plank", "maltese", "flag"])) return "anti_extension";
  if (hasPhrase(name, ["front lever", "back lever", "skin the cat"])) return "vertical_pull";
  if (hasPhrase(name, ["l-sit", "v-sit"])) return "hip_flexion_core";
  if (hasPhrase(name, ["stalder press"])) return "vertical_push";
  if (hasPhrase(name, ["pulldown", "pull-down"]) && hasPhrase(name, ["curl"]) && existingMovement === "elbow_flexion") return existingMovement;
  if (hasPhrase(name, ["press"]) && hasPhrase(name, ["curl"]) && existingMovement === "elbow_flexion") return existingMovement;
  if (hasPhrase(name, ["pull-up", "pull up", "pull-ups", "pull ups", "chin-up", "chin up", "chin-ups", "chin ups", "pulldown", "pull-down"])) return "vertical_pull";
  if (hasPhrase(name, ["handstand", "handstand push-up", "handstand push up", "dip", "dips", "shoulder press", "military press", "overhead press", "push press"])) return "vertical_push";
  if ((/\brows?\b|\browing\b/.test(name)) && hasPhrase(name, ["squat", "lunge"])) return existingMovement;
  if (/\brows?\b|\browing\b/.test(name)) return "horizontal_pull";
  if (hasPhrase(name, ["deadlift", "good morning", "hip hinge", "pull-through", "pull through", "hip thrust", "glute bridge", "glute drive"])) return "hip_hinge";
  if (["elbow_flexion", "elbow_extension"].includes(existingMovement) &&
      hasPhrase(name, ["curl", "triceps extension"]) &&
      hasPhrase(name, ["squat", "lunge", "step-up", "step up"])) return existingMovement;
  if (existingMovement === "cardio" && hasPhrase(name, ["jump", "walking", "high knees"])) return existingMovement;
  if (hasPhrase(name, ["squat", "lunge", "leg press", "step-up", "step up" ])) return "knee_dominant";
  if (hasPhrase(name, ["bench press", "chest press", "push-up", "push up", "fly", "flye", "crossover", "cross-over"])) return "horizontal_push";

  return existingMovement;
}

export function correctedGroup(exercise, existingGroup, movement) {
  const name = normalize(exercise.name);
  if (hasPhrase(name, ["modified push up to lower arms"])) return "triceps";
  if (hasPhrase(name, ["handstand", "handstand push-up", "handstand push up", "stalder press"])) return "shoulders";
  if (movement === "cardio" && normalize(exercise.target) === "cardiovascular system") return "cardio";
  return existingGroup;
}

export function correctTrainingRoles(exercise, existingRoles, group, movement) {
  const name = normalize(exercise.name);
  if (hasPhrase(name, ["modified push up to lower arms"])) return ["triceps_press"];
  if (hasPhrase(name, ["quick feet", "fast feet"])) return [];
  if (group === "shoulders" && hasPhrase(name, ["handstand", "handstand push-up", "handstand push up", "stalder press"])) {
    return ["shoulder_press"];
  }
  const roles = new Set((existingRoles || []).filter((role) => movement === "mobility" || !role.endsWith("_mobility")));

  if (group === "core" && movement === "anti_extension") roles.add("core_anti_extension");
  if (group === "core" && movement === "hip_flexion_core") roles.add("core_hip_raise");

  if (group === "shoulders" && movement === "vertical_push") roles.add("shoulder_press");
  if (group === "back" && movement === "vertical_pull") {
    roles.delete("back_horizontal_pull");
    roles.add("back_vertical_pull");
  }
  if (group === "chest" && hasPhrase(name, ["dip", "dips"])) roles.add("chest_decline_press");
  if (group === "triceps" && hasPhrase(name, ["dip", "dips", "close grip", "close-grip"])) roles.add("triceps_press");
  return [...roles];
}

export function correctExerciseType(exercise, existingType, movement) {
  const name = normalize(exercise.name);
  if (movement === "mobility") return "mobility";
  if (movement === "cardio") return "conditioning";
  if (hasPhrase(name, [
    "muscle-up", "muscle up", "planche", "front lever", "back lever", "human flag",
    "handstand push-up", "handstand push up", "pistol squat", "single leg squat", "stalder press",
    "l-sit", "v-sit", "maltese", "flag", "skin the cat", "ring dips", "single arm push-up",
    "single-arm push-up", "one arm dip", "plyo push-up", "plyo push up",
  ])) return "main_lift";
  if (hasPhrase(name, ["handstand", "side plank"])) return "compound_accessory";
  return existingType;
}

export function correctMechanics(exercise, existingMechanics) {
  const name = normalize(exercise.name);
  const equipment = normalize(exercise.equipment);
  const mechanics = { ...(existingMechanics || {}) };
  const skill = hasPhrase(name, [
    "muscle-up", "muscle up", "planche", "front lever", "back lever", "human flag",
    "handstand", "l-sit", "v-sit", "stalder press", "impossible dips", "superman push-up",
    "superman push up", "maltese", "flag", "skin the cat", "ring dips", "single arm push-up",
    "single-arm push-up", "one arm dip",
  ]);

  if (skill) {
    mechanics.stability = "high";
    mechanics.shoulderDemand = "high";
    mechanics.elbowDemand = "high";
    mechanics.rangeDemand = "high";
    mechanics.loadability = "low";
    mechanics.fatigueCost = "high";
    mechanics.supported = false;
  }
  if (hasPhrase(name, [
    "front lever", "back lever", "muscle-up", "muscle up", "human flag", "flag",
    "skin the cat", "maltese", "ring dips",
  ])) {
    mechanics.gripDemand = "high";
    mechanics.posture = "hanging";
  }
  if (hasPhrase(name, ["planche", "superman push-up", "superman push up"])) mechanics.posture = "prone";
  if (hasPhrase(name, ["l-sit", "v-sit"])) mechanics.posture = "seated";
  if (hasPhrase(name, ["handstand", "stalder press"])) {
    mechanics.overhead = true;
    mechanics.posture = "standing";
  }
  if (hasPhrase(name, ["side plank"])) {
    mechanics.stability = "high";
    mechanics.shoulderDemand = mechanics.shoulderDemand === "low" ? "moderate" : mechanics.shoulderDemand;
    mechanics.fatigueCost = mechanics.fatigueCost === "low" ? "moderate" : mechanics.fatigueCost;
  }
  if (hasPhrase(name, ["burpee", "mountain climber", "sprint"])) mechanics.fatigueCost = "high";
  if (equipment !== "body weight" && hasPhrase(name, ["pulldown", "pull-down"])) {
    mechanics.stability = mechanics.stability === "high" ? "moderate" : mechanics.stability;
    mechanics.posture = hasPhrase(name, ["seated"])
      ? "seated"
      : hasPhrase(name, ["kneeling"])
        ? "kneeling"
        : "standing";
    mechanics.setupComplexity = mechanics.setupComplexity === "low" ? "moderate" : mechanics.setupComplexity;
  }
  return mechanics;
}

export function correctGoalTags(existingTags, movement) {
  const tags = new Set(existingTags || []);
  if (["knee_dominant", "hip_hinge", "horizontal_push", "vertical_push", "horizontal_pull", "vertical_pull"].includes(movement)) {
    tags.add("strength");
  }
  if (movement === "cardio") {
    for (const tag of ["strength", "hypertrophy", "power", "mobility"]) tags.delete(tag);
    for (const tag of ["conditioning", "endurance", "general"]) tags.add(tag);
  }
  if (movement === "mobility") tags.add("mobility");
  return [...tags];
}

export function expectedCompatibilityFlags(exercise, group = "") {
  const text = actionName(exercise);
  const expected = [];
  if (hasPhrase(text, ["deadlift", "good morning", "back extension", "hyperextension", "bent over", "bent-over", "sit-up", "sit up", "superman"])) expected.push("back_pain");
  if (hasPhrase(text, ["squat", "lunge", "leg extension", "jump", "running", "sprint", "step-up", "step up", "pistol", "mountain climber", "burpee"])) expected.push("knee_pain");
  const elbowCompound = hasPhrase(text, ["dip", "dips", "pull-up", "pull up", "chin-up", "chin up", "push-up", "push up", "hanging"]);
  const armIsolation = ["arms", "biceps", "triceps", "forearms"].includes(group) &&
    hasPhrase(text, ["curl", "skullcrusher", "skull crusher", "triceps extension"]);
  if (elbowCompound || armIsolation) expected.push("elbow_pain");
  if (hasPhrase(text, ["overhead", "shoulder press", "military press", "upright row", "behind neck", "dip", "dips", "fly", "pullover", "handstand", "push-up", "push up", "hanging"])) expected.push("shoulder_pain");
  if (hasPhrase(text, ["dip", "dips", "bench dip", "pullover", "shoulder extension"])) expected.push("avoid_shoulder_extension");
  return [...new Set(expected)];
}

export function reconcileExpectedCompatibility(exercise, group, compatibility) {
  const result = { ...(compatibility || {}) };
  const added = [];
  for (const condition of expectedCompatibilityFlags(exercise, group)) {
    if (result[condition]?.status && result[condition].status !== "normal") continue;
    const shoulderExtension = condition === "avoid_shoulder_extension";
    result[condition] = {
      status: shoulderExtension ? "default_exclude" : "caution",
      reason: shoulderExtension
        ? "The named movement requires loaded shoulder extension."
        : "The named movement places meaningful demand on this area.",
      modification: shoulderExtension
        ? "Choose a variation that keeps the upper arm closer to the torso."
        : "Use a lower-load or assisted variation in a symptom-free range.",
      confidence: "medium",
    };
    added.push(condition);
  }
  return { compatibility: result, added };
}

export function compatibilityFromMechanics(mechanics, existingCompatibility = {}) {
  const result = { ...existingCompatibility };
  const entry = (status, reason, modification, confidence = "high") => ({ status, reason, modification, confidence });

  if (mechanics.axialLoad === "high") {
    result.back_pain = entry("default_exclude", "High axial or spinal loading demand.", "Prefer a supported movement with lower spinal loading.");
  } else if (
    mechanics.spinalDemand === "high" || mechanics.spinalFlexion || mechanics.spinalExtension || mechanics.spinalRotation
  ) {
    result.back_pain = entry("caution", "Meaningful spinal loading or range demand.", "Use a controlled, symptom-free range and reduce resistance.", "medium");
  }

  if (mechanics.impact === "high" || mechanics.kneeDemand === "high") {
    result.knee_pain = entry("default_exclude", "High-impact or high knee-loading demand.", "Choose a lower-impact, supported alternative with a shorter pain-free range.");
  } else if (mechanics.kneeDemand === "moderate") {
    result.knee_pain = entry("caution", "Moderate knee-loading demand.", "Use a comfortable range and reduce resistance if symptoms increase.", "medium");
  }

  if (mechanics.elbowDemand === "high") {
    result.elbow_pain = entry("caution", "High elbow loading or full-body support through the arms.", "Use assistance or a lower-load alternative and stop if symptoms increase.");
  } else if (mechanics.elbowDemand === "moderate") {
    result.elbow_pain = entry("caution", "The elbow contributes substantially to the movement.", "Use a comfortable grip and symptom-free range.", "medium");
  }

  if (mechanics.shoulderDemand === "high" && (mechanics.overhead || mechanics.shoulderExtension || mechanics.stability === "high")) {
    result.shoulder_pain = entry("default_exclude", "High shoulder demand in an overhead, extended, or unstable position.", "Prefer a supported movement below shoulder height with lower loading.");
  } else if (["high", "moderate"].includes(mechanics.shoulderDemand)) {
    result.shoulder_pain = entry("caution", "Meaningful shoulder loading or range demand.", "Reduce resistance and use a comfortable symptom-free range.", "medium");
  }

  if (mechanics.shoulderExtension) {
    result.avoid_shoulder_extension = entry("default_exclude", "The movement requires loaded shoulder extension.", "Choose a press or pull that keeps the upper arm closer to the torso.");
  }

  return result;
}

export function normalizeRuleText(value) {
  return normalize(value);
}
