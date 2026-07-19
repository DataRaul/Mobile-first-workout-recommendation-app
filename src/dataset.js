import { DATASET_URL, MEDIA_BASE_URL } from "./config.js";

const normalize = value => String(value || "").trim().toLowerCase();
const hasAny = (text, terms) => terms.some(term => text.includes(term));

function muscleGroup(ex) {
  const target = normalize(ex.target);
  const category = normalize(ex.category || ex.body_part);
  const muscle = normalize(ex.muscle_group);
  const all = `${target} ${category} ${muscle}`;
  if (hasAny(all,["pector","chest"])) return "chest";
  if (hasAny(all,["lat","back","rhomboid","trap","spine","teres major"])) return "back";
  if (hasAny(all,["deltoid","delt","shoulder"])) return "shoulders";
  if (hasAny(all,["biceps"])) return "biceps";
  if (hasAny(all,["triceps"])) return "triceps";
  if (hasAny(all,["forearm","wrist","brachioradialis"])) return "forearms";
  if (hasAny(all,["quad"])) return "quads";
  if (hasAny(all,["hamstring"])) return "hamstrings";
  if (hasAny(all,["glute"])) return "glutes";
  if (hasAny(all,["calf","gastrocnemius","soleus"])) return "calves";
  if (hasAny(all,["adductor"])) return "adductors";
  if (hasAny(all,["abductor"])) return "abductors";
  if (hasAny(all,["abs","oblique","waist","core"])) return "core";
  if (category === "cardio") return "cardio";
  if (category === "neck") return "neck";
  if (category === "upper legs") return "legs";
  if (category === "lower legs") return "calves";
  if (category === "upper arms") return "arms";
  return category || target || "other";
}

function movement(ex) {
  const text = normalize(`${ex.name} ${ex.target} ${ex.category}`);
  if (hasAny(text,["stretch","mobility","rotation","circle","roll","pose","flexibility"])) return "mobility";
  if (hasAny(text,["run","walk","bike","cycling","jump rope","burpee","mountain climber","jack"])) return "cardio";
  if (hasAny(text,["squat","leg press","lunge","step-up","step up"])) return "squat";
  if (hasAny(text,["deadlift","good morning","hip hinge","pull-through","glute drive","hip thrust"])) return "hinge";
  if (hasAny(text,["bench press","chest press","push-up","push up","fly"])) return "horizontal_push";
  if (hasAny(text,["shoulder press","military press","overhead press","handstand push"])) return "vertical_push";
  if (hasAny(text,["row"])) return "horizontal_pull";
  if (hasAny(text,["pulldown","pull-up","pull up","chin-up","chin up"])) return "vertical_pull";
  if (hasAny(text,["curl"])) return muscleGroup(ex) === "hamstrings" ? "knee_flexion" : "elbow_flexion";
  if (hasAny(text,["extension"])) return muscleGroup(ex) === "quads" ? "knee_extension" : "extension";
  if (hasAny(text,["raise"])) return "raise";
  return "isolation";
}

function complexity(ex) {
  const text = normalize(ex.name);
  let score = 1;
  if (hasAny(text,["single leg","one arm","one-leg","one arm","unilateral","pistol","handstand","muscle-up","muscle up"])) score += 2;
  if (hasAny(text,["snatch","clean","jerk","olympic","plyo","depth jump"])) score += 3;
  if (["barbell","kettlebell","weighted"].includes(normalize(ex.equipment))) score += 1;
  return Math.min(score,4);
}

function goalTags(ex, move) {
  const text = normalize(ex.name);
  const tags = new Set(["hypertrophy","general","endurance"]);
  if (["squat","hinge","horizontal_push","vertical_push","horizontal_pull","vertical_pull"].includes(move)) tags.add("strength");
  if (hasAny(text,["snatch","clean","jerk","jump","sprint","swing","push press","throw"])) tags.add("power");
  if (move === "cardio" || hasAny(text,["burpee","mountain climber","jumping jack"])) tags.add("conditioning");
  if (move === "mobility") tags.add("mobility");
  return [...tags];
}

function safetyFlags(ex) {
  const text = normalize(`${ex.name} ${ex.target} ${ex.muscle_group}`);
  const flags = [];
  if (hasAny(text,["deadlift","good morning","back extension","hyperextension","bent over","sit-up","sit up","superman"])) flags.push("back_pain");
  if (hasAny(text,["squat","lunge","leg extension","jump","running","step-up","step up","pistol"])) flags.push("knee_pain");
  if (hasAny(text,["curl","triceps","dip","pull-up","pull up","chin-up","chin up","skullcrusher"])) flags.push("elbow_pain");
  if (hasAny(text,["overhead","shoulder press","military press","upright row","behind neck","dip","fly","pullover","handstand"])) flags.push("shoulder_pain");
  if (hasAny(text,["dip","bench dip","pullover","shoulder extension"])) flags.push("avoid_shoulder_extension");
  return [...new Set(flags)];
}

export function enrichExercise(ex) {
  const group = muscleGroup(ex);
  const move = movement(ex);
  return {
    ...ex,
    equipment: normalize(ex.equipment),
    app: {
      group,
      movement: move,
      complexity: complexity(ex),
      goalTags: goalTags(ex, move),
      safetyFlags: safetyFlags(ex),
    },
  };
}

export async function loadExercises() {
  const response = await fetch(DATASET_URL, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Exercise dataset could not be loaded (${response.status}).`);
  const raw = await response.json();
  if (!Array.isArray(raw) || raw.length < 1000) throw new Error("The full exercise dataset was not returned.");
  return raw.map(enrichExercise);
}

export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:/i.test(path)) return path;
  return MEDIA_BASE_URL + String(path).replace(/^\.\//, "");
}

export function uniqueValues(exercises, key) {
  return [...new Set(exercises.map(ex => ex[key]).filter(Boolean))].sort();
}
