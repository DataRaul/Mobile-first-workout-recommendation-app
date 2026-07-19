import { DATASET_URL, MEDIA_BASE_URL } from "./config.js";

const normalize = (value) => String(value || "").trim().toLowerCase();
const hasAny = (text, terms) => terms.some((term) => text.includes(term));

function muscleGroup(exercise) {
  const target = normalize(exercise.target);
  const category = normalize(exercise.category || exercise.body_part);
  const muscle = normalize(exercise.muscle_group);
  const all = `${target} ${category} ${muscle}`;

  if (hasAny(all, ["pector", "chest"])) return "chest";
  if (hasAny(all, ["lat", "back", "rhomboid", "trap", "spine", "teres major"])) return "back";
  if (hasAny(all, ["deltoid", "delt", "shoulder"])) return "shoulders";
  if (hasAny(all, ["biceps"])) return "biceps";
  if (hasAny(all, ["triceps"])) return "triceps";
  if (hasAny(all, ["forearm", "wrist", "brachioradialis"])) return "forearms";
  if (hasAny(all, ["quad"])) return "quads";
  if (hasAny(all, ["hamstring"])) return "hamstrings";
  if (hasAny(all, ["glute"])) return "glutes";
  if (hasAny(all, ["calf", "gastrocnemius", "soleus"])) return "calves";
  if (hasAny(all, ["adductor"])) return "adductors";
  if (hasAny(all, ["abductor"])) return "abductors";
  if (hasAny(all, ["abs", "oblique", "waist", "core"])) return "core";
  if (category === "cardio") return "cardio";
  if (category === "neck") return "neck";
  if (category === "upper legs") return "legs";
  if (category === "lower legs") return "calves";
  if (category === "upper arms") return "arms";

  return category || target || "other";
}

function movement(exercise) {
  const text = normalize(`${exercise.name} ${exercise.target} ${exercise.category}`);

  if (hasAny(text, ["stretch", "mobility", "rotation", "circle", "roll", "pose", "flexibility"])) {
    return "mobility";
  }

  if (hasAny(text, ["run", "walk", "bike", "cycling", "jump rope", "burpee", "mountain climber", "jack"])) {
    return "cardio";
  }

  if (hasAny(text, ["squat", "leg press", "lunge", "step-up", "step up"])) return "squat";
  if (hasAny(text, ["deadlift", "good morning", "hip hinge", "pull-through", "glute drive", "hip thrust"])) {
    return "hinge";
  }

  if (hasAny(text, ["bench press", "chest press", "push-up", "push up", "fly"])) {
    return "horizontal_push";
  }

  if (hasAny(text, ["shoulder press", "military press", "overhead press", "handstand push"])) {
    return "vertical_push";
  }

  if (hasAny(text, ["row"])) return "horizontal_pull";
  if (hasAny(text, ["pulldown", "pull-up", "pull up", "chin-up", "chin up"])) {
    return "vertical_pull";
  }

  if (hasAny(text, ["curl"])) {
    return muscleGroup(exercise) === "hamstrings" ? "knee_flexion" : "elbow_flexion";
  }

  if (hasAny(text, ["extension"])) {
    return muscleGroup(exercise) === "quads" ? "knee_extension" : "extension";
  }

  if (hasAny(text, ["raise"])) return "raise";

  return "isolation";
}

function complexity(exercise, move) {
  const name = normalize(exercise.name);
  const equipment = normalize(exercise.equipment);
  const text = `${name} ${equipment}`;

  const expertSkillTerms = [
    "muscle-up",
    "muscle up",
    "planche",
    "front lever",
    "back lever",
    "human flag",
    "iron cross",
    "one arm pull-up",
    "one-arm pull-up",
    "one arm push-up",
    "one-arm push-up",
    "handstand push-up",
    "handstand push up",
    "pistol squat",
    "dragon flag",
    "l-sit",
    "v-sit",
    "snatch",
    "clean and jerk",
    "clean & jerk",
    "olympic",
    "depth jump",
  ];

  if (hasAny(text, expertSkillTerms)) return 4;

  let level = 1;

  const intermediateEquipment = [
    "cable",
    "smith machine",
    "dumbbell",
    "barbell",
    "ez barbell",
    "kettlebell",
    "weighted",
    "band",
    "medicine ball",
    "rope",
  ];

  if (intermediateEquipment.includes(equipment)) {
    level = 2;
  }

  const compoundMovements = [
    "squat",
    "hinge",
    "horizontal_push",
    "vertical_push",
    "horizontal_pull",
    "vertical_pull",
  ];

  if (equipment === "body weight" && compoundMovements.includes(move)) {
    level = Math.max(level, 2);
  }

  if (
    equipment === "body weight" &&
    hasAny(name, ["push-up", "push up", "row", "squat", "lunge", "plank", "hip thrust", "glute bridge"])
  ) {
    level = Math.max(level, 2);
  }

  if (equipment === "stability ball") {
    level = Math.max(level, 3);
  }

  const advancedControlTerms = [
    "single leg",
    "single-leg",
    "one leg",
    "one-leg",
    "single arm",
    "single-arm",
    "one arm",
    "one-arm",
    "unilateral",
    "alternating",
    "contralateral",
    "cross body",
    "cross-body",
    "half kneeling",
    "half-kneeling",
    "kneeling",
    "stability ball",
    "swiss ball",
    "bosu",
    "suspension",
    "trx",
    "hanging",
    "inverted",
    "side plank",
    "plank row",
    "renegade",
    "pike",
    "archer",
    "spiderman",
    "bear crawl",
    "crab walk",
    "turkish get-up",
    "turkish get up",
    "windmill",
    "overhead squat",
    "sots press",
    "jump squat",
    "jump lunge",
    "box jump",
    "broad jump",
    "tuck jump",
    "throw down",
    "lateral throw",
    "rotational throw",
    "wood chop",
    "woodchop",
    "around the world",
    "walking lunge",
  ];

  if (hasAny(text, advancedControlTerms)) {
    level = Math.max(level, 3);
  }

  const explosiveTerms = [
    "clean",
    "jerk",
    "snatch",
    "plyo",
    "plyometric",
    "explosive",
    "push press",
    "thruster",
    "sprint",
    "bound",
  ];

  if (hasAny(text, explosiveTerms)) {
    level = Math.max(level, 3);
  }

  const advancedBodyweightTerms = [
    "clap push-up",
    "clap push up",
    "diamond push-up",
    "diamond push up",
    "decline push-up",
    "decline push up",
    "typewriter",
    "wall walk",
    "handstand",
    "pull-up",
    "pull up",
    "chin-up",
    "chin up",
    "toes to bar",
  ];

  if (equipment === "body weight" && hasAny(name, advancedBodyweightTerms)) {
    level = Math.max(level, 3);
  }

  // Fixed-path and assisted exercises stay simple unless their name contains
  // an instability, unilateral, dynamic or high-skill modifier detected above.
  const stableEquipment = [
    "leverage machine",
    "assisted",
    "sled machine",
    "roller",
  ];

  if (stableEquipment.includes(equipment) && level < 3) {
    level = 1;
  }

  return Math.min(Math.max(level, 1), 4);
}


function trainingRoles(exercise, group, move) {
  const name = normalize(exercise.name);
  const text = normalize(
    `${exercise.name} ${exercise.target} ${exercise.category} ${exercise.muscle_group} ${exercise.equipment}`,
  );
  const roles = new Set();

  if (group === "chest") {
    if (hasAny(text, ["incline"])) roles.add("chest_incline_press");
    if (hasAny(text, ["decline"])) roles.add("chest_decline_press");
    if (hasAny(text, ["fly", "cross-over", "crossover", "pec deck", "butterfly"])) {
      roles.add("chest_adduction");
    }
    if (
      move === "horizontal_push" &&
      !roles.has("chest_incline_press") &&
      !roles.has("chest_decline_press") &&
      !roles.has("chest_adduction")
    ) {
      roles.add("chest_horizontal_press");
    }
    if (!roles.size) roles.add("chest_general");
  }

  if (group === "shoulders") {
    if (move === "vertical_push" || hasAny(text, ["shoulder press", "military press", "overhead press"])) {
      roles.add("shoulder_press");
    }
    if (hasAny(text, ["lateral raise", "side raise", "leaning lateral", "upright row"])) {
      roles.add("shoulder_lateral_raise");
    }
    if (hasAny(text, ["reverse fly", "rear delt", "rear deltoid", "face pull"])) {
      roles.add("shoulder_rear_delt");
    }
    if (hasAny(text, ["front raise"])) roles.add("shoulder_front_raise");
    if (hasAny(text, ["external rotation", "internal rotation", "rotator cuff"])) {
      roles.add("shoulder_rotation");
    }
    if (!roles.size) roles.add("shoulder_general");
  }

  if (group === "back") {
    if (move === "horizontal_pull" || hasAny(text, ["row"])) roles.add("back_horizontal_pull");
    if (move === "vertical_pull" || hasAny(text, ["pulldown", "pull-up", "pull up", "chin-up", "chin up"])) {
      roles.add("back_vertical_pull");
    }
    if (hasAny(text, ["face pull", "reverse fly", "rear delt", "high row", "wide row"])) {
      roles.add("back_upper_rear");
    }
    if (hasAny(text, ["straight arm", "straight-arm", "pullover", "pull-over"])) {
      roles.add("back_lat_isolation");
    }
    if (hasAny(text, ["shrug"])) roles.add("back_traps");
    if (!roles.size) roles.add("back_general");
  }

  if (["biceps", "arms"].includes(group)) {
    if (hasAny(text, ["hammer", "neutral grip", "neutral-grip", "rope curl"])) {
      roles.add("biceps_neutral");
    } else if (hasAny(text, ["reverse curl", "pronated", "overhand curl"])) {
      roles.add("biceps_pronated");
    } else if (hasAny(text, ["curl", "biceps"])) {
      roles.add("biceps_supinated");
    }
  }

  if (["triceps", "arms"].includes(group)) {
    if (hasAny(text, ["pushdown", "pressdown", "push-down", "press-down"])) {
      roles.add("triceps_pushdown");
    }
    if (hasAny(text, ["overhead", "lying extension", "skullcrusher", "skull crusher"])) {
      roles.add("triceps_overhead");
    }
    if (hasAny(text, ["close grip", "close-grip", "dip", "bench press"])) {
      roles.add("triceps_press");
    }
    if (!roles.size && hasAny(text, ["triceps", "extension"])) roles.add("triceps_general");
  }

  if (group === "forearms") {
    roles.add(hasAny(text, ["reverse curl", "pronated"]) ? "biceps_pronated" : "forearms_grip");
  }

  if (["quads", "legs"].includes(group)) {
    if (move === "squat" || hasAny(text, ["squat", "leg press", "lunge", "step-up", "step up"])) {
      roles.add("legs_knee_dominant");
    }
    if (move === "knee_extension" || hasAny(text, ["leg extension", "knee extension"])) {
      roles.add("legs_knee_extension");
    }
  }

  if (["hamstrings", "legs"].includes(group)) {
    if (move === "knee_flexion" || hasAny(text, ["leg curl", "hamstring curl"])) {
      roles.add("legs_knee_flexion");
    }
    if (
      move === "hinge" ||
      hasAny(text, ["deadlift", "good morning", "pull-through", "hip hinge"])
    ) {
      roles.add("legs_hip_dominant");
    }
  }

  if (["glutes", "legs"].includes(group)) {
    if (
      move === "hinge" ||
      hasAny(text, ["hip thrust", "glute bridge", "glute drive", "kickback", "pull-through"])
    ) {
      roles.add("legs_hip_dominant");
    }
    if (hasAny(text, ["kickback", "abduction", "glute bridge", "hip thrust"])) {
      roles.add("legs_glute_isolation");
    }
  }

  if (group === "calves") roles.add("legs_calves");
  if (group === "adductors") roles.add("legs_adductors");
  if (group === "abductors") roles.add("legs_abductors");

  if (group === "core") {
    if (hasAny(text, ["side plank", "side bridge", "lateral plank"])) roles.add("core_lateral");
    if (hasAny(text, ["pallof", "anti rotation", "anti-rotation"])) roles.add("core_rotation");
    if (hasAny(text, ["wood chop", "woodchop", "twist", "rotation"])) roles.add("core_rotation");
    if (hasAny(text, ["plank", "dead bug", "ab wheel", "body saw", "hollow hold"])) {
      roles.add("core_anti_extension");
    }
    if (hasAny(text, ["leg raise", "knee raise", "reverse crunch", "hip raise"])) {
      roles.add("core_hip_raise");
    }
    if (hasAny(text, ["crunch", "sit-up", "sit up", "curl-up", "curl up"])) {
      roles.add("core_flexion");
    }
    if (!roles.size) roles.add("core_general");
  }

  if (!roles.size) roles.add(`${group || "general"}_general`);
  return [...roles];
}

function goalTags(exercise, move) {
  const text = normalize(exercise.name);
  const tags = new Set(["hypertrophy", "general", "endurance"]);

  if (["squat", "hinge", "horizontal_push", "vertical_push", "horizontal_pull", "vertical_pull"].includes(move)) {
    tags.add("strength");
  }

  if (hasAny(text, ["snatch", "clean", "jerk", "jump", "sprint", "swing", "push press", "throw"])) {
    tags.add("power");
  }

  if (move === "cardio" || hasAny(text, ["burpee", "mountain climber", "jumping jack"])) {
    tags.add("conditioning");
  }

  if (move === "mobility") tags.add("mobility");

  return [...tags];
}

function safetyFlags(exercise) {
  const text = normalize(`${exercise.name} ${exercise.target} ${exercise.muscle_group}`);
  const group = muscleGroup(exercise);
  const flags = [];

  if (hasAny(text, ["deadlift", "good morning", "back extension", "hyperextension", "bent over", "sit-up", "sit up", "superman"])) {
    flags.push("back_pain");
  }

  if (hasAny(text, ["squat", "lunge", "leg extension", "jump", "running", "step-up", "step up", "pistol"])) {
    flags.push("knee_pain");
  }

  const armCurlOrExtension =
    ["biceps", "triceps", "forearms", "arms"].includes(group) &&
    hasAny(text, ["curl", "triceps", "skullcrusher", "skull crusher"]);
  const elbowLoadedCompound = hasAny(text, ["dip", "pull-up", "pull up", "chin-up", "chin up"]);
  if (armCurlOrExtension || elbowLoadedCompound) {
    flags.push("elbow_pain");
  }

  if (hasAny(text, ["overhead", "shoulder press", "military press", "upright row", "behind neck", "dip", "fly", "pullover", "handstand"])) {
    flags.push("shoulder_pain");
  }

  if (hasAny(text, ["dip", "bench dip", "pullover", "shoulder extension"])) {
    flags.push("avoid_shoulder_extension");
  }

  return [...new Set(flags)];
}

export function enrichExercise(exercise) {
  const group = muscleGroup(exercise);
  const move = movement(exercise);

  return {
    ...exercise,
    equipment: normalize(exercise.equipment),
    app: {
      group,
      movement: move,
      complexity: complexity(exercise, move),
      trainingRoles: trainingRoles(exercise, group, move),
      goalTags: goalTags(exercise, move),
      safetyFlags: safetyFlags(exercise),
    },
  };
}

export async function loadExercises() {
  const response = await fetch(DATASET_URL, { cache: "force-cache" });

  if (!response.ok) {
    throw new Error(`Exercise dataset could not be loaded (${response.status}).`);
  }

  const raw = await response.json();

  if (!Array.isArray(raw) || raw.length < 1000) {
    throw new Error("The full exercise dataset was not returned.");
  }

  return raw.map(enrichExercise);
}

export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:/i.test(path)) return path;

  return MEDIA_BASE_URL + String(path).replace(/^\.\//, "");
}

export function uniqueValues(exercises, key) {
  return [...new Set(exercises.map((exercise) => exercise[key]).filter(Boolean))].sort();
}
