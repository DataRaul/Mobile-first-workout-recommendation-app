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
  const flags = [];

  if (hasAny(text, ["deadlift", "good morning", "back extension", "hyperextension", "bent over", "sit-up", "sit up", "superman"])) {
    flags.push("back_pain");
  }

  if (hasAny(text, ["squat", "lunge", "leg extension", "jump", "running", "step-up", "step up", "pistol"])) {
    flags.push("knee_pain");
  }

  if (hasAny(text, ["curl", "triceps", "dip", "pull-up", "pull up", "chin-up", "chin up", "skullcrusher"])) {
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
