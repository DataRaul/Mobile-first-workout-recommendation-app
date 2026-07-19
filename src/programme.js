import { EQUIPMENT_PRESETS, GOALS } from "./config.js";

const SPLITS = {
  2: [
    { name:"Full Body A", slots:["quads","chest","back","hamstrings","shoulders","core"] },
    { name:"Full Body B", slots:["glutes","back","chest","quads","arms","core"] },
  ],
  3: [
    { name:"Full Body A", slots:["quads","chest","back","hamstrings","shoulders","core"] },
    { name:"Full Body B", slots:["glutes","back","chest","quads","biceps","triceps"] },
    { name:"Full Body C", slots:["hamstrings","shoulders","back","chest","calves","core"] },
  ],
  4: [
    { name:"Upper A", slots:["chest","back","shoulders","biceps","triceps","core"] },
    { name:"Lower A", slots:["quads","hamstrings","glutes","calves","core","adductors"] },
    { name:"Upper B", slots:["back","chest","shoulders","triceps","biceps","forearms"] },
    { name:"Lower B", slots:["glutes","quads","hamstrings","calves","core","abductors"] },
  ],
  5: [
    { name:"Push", slots:["chest","shoulders","triceps","chest","shoulders","core"] },
    { name:"Pull", slots:["back","back","biceps","shoulders","forearms","core"] },
    { name:"Legs", slots:["quads","hamstrings","glutes","calves","adductors","core"] },
    { name:"Upper", slots:["chest","back","shoulders","biceps","triceps","core"] },
    { name:"Lower", slots:["glutes","quads","hamstrings","calves","abductors","core"] },
  ],
  6: [
    { name:"Push A", slots:["chest","shoulders","triceps","chest","shoulders","core"] },
    { name:"Pull A", slots:["back","back","biceps","shoulders","forearms","core"] },
    { name:"Legs A", slots:["quads","hamstrings","glutes","calves","adductors","core"] },
    { name:"Push B", slots:["shoulders","chest","triceps","chest","shoulders","core"] },
    { name:"Pull B", slots:["back","biceps","back","shoulders","forearms","core"] },
    { name:"Legs B", slots:["glutes","quads","hamstrings","calves","abductors","core"] },
  ],
};

function hashString(value) {
  let h = 2166136261;
  for (let i=0;i<value.length;i++) { h ^= value.charCodeAt(i); h = Math.imul(h,16777619); }
  return h >>> 0;
}
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function allowedEquipment(profile) {
  if (profile.equipmentPreset === "custom") return new Set(profile.equipment || []);
  return new Set(EQUIPMENT_PRESETS[profile.equipmentPreset]?.equipment || EQUIPMENT_PRESETS.full_gym.equipment);
}

function maxComplexity(level) { return ({starter:1,intermediate:2,advanced:3,pro:4})[level] || 1; }

export function eligibleForProfile(ex, profile, state) {
  const allowed = allowedEquipment(profile);
  if (!allowed.has(ex.equipment)) return false;
  if ((state.gym?.unavailableExerciseIds || []).includes(ex.id)) return false;
  if (ex.app.complexity > maxComplexity(profile.level)) return false;
  if ((profile.constraints || []).some(c => ex.app.safetyFlags.includes(c))) return false;
  if (profile.goal === "mobility") return ex.app.goalTags.includes("mobility");
  if (profile.goal === "conditioning") return ex.app.goalTags.includes("conditioning") || ex.app.goalTags.includes("general");
  return !ex.app.goalTags.includes("mobility");
}

function groupMatches(ex, slot) {
  if (slot === "arms") return ["biceps","triceps","forearms","arms"].includes(ex.app.group);
  if (slot === "legs") return ["quads","hamstrings","glutes","calves","adductors","abductors","legs"].includes(ex.app.group);
  return ex.app.group === slot;
}

function goalScore(ex, goal) {
  let score = ex.app.goalTags.includes(goal) ? 6 : 0;
  if (["strength","hypertrophy","general"].includes(goal) && ["squat","hinge","horizontal_push","vertical_push","horizontal_pull","vertical_pull"].includes(ex.app.movement)) score += 3;
  if (goal === "power" && ex.app.goalTags.includes("power")) score += 8;
  if (goal === "conditioning" && ["cardio","squat","horizontal_push","horizontal_pull"].includes(ex.app.movement)) score += 3;
  if (goal === "endurance" && ["body weight","band","cable","leverage machine"].includes(ex.equipment)) score += 2;
  return score;
}

function chooseExercise(pool, slot, used, profile, random) {
  const candidates = pool.filter(ex => groupMatches(ex,slot) && !used.has(ex.id));
  const fallback = pool.filter(ex => !used.has(ex.id));
  const ranked = (candidates.length ? candidates : fallback).map(ex => ({
    ex,
    score: goalScore(ex,profile.goal) + (profile.favorites || []).includes(ex.id)*4 + random()*1.5,
  })).sort((a,b)=>b.score-a.score);
  return ranked[0]?.ex || null;
}

function prescription(profile, ex, index) {
  const cfg = GOALS[profile.goal] || GOALS.general;
  let sets = cfg.sets;
  let reps = cfg.reps;
  let restSeconds = cfg.rest;
  if (profile.goal === "strength" && !["squat","hinge","horizontal_push","vertical_push","horizontal_pull","vertical_pull"].includes(ex.app.movement)) { sets=3; reps="6–10"; restSeconds=90; }
  if (profile.goal === "power" && !ex.app.goalTags.includes("power")) { sets=3; reps="6–10"; restSeconds=90; }
  if (profile.goal === "mobility") { sets=2; reps="30–60 sec"; restSeconds=20; }
  return { exerciseId:ex.id, sets, reps, restSeconds, order:index+1 };
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

export function generateProgram(exercises, profile, state, variation=0) {
  const pool = exercises.filter(ex => eligibleForProfile(ex,profile,state));
  if (pool.length < 20) throw new Error("The current equipment and safety filters leave too few exercises. Adjust the profile before building a programme.");
  const split = SPLITS[Math.min(6,Math.max(2,Number(profile.daysPerWeek)||3))];
  const random = rng(hashString(JSON.stringify(profile)+variation));
  const usedAcross = new Set();
  const targetCount = profile.sessionMinutes <= 30 ? 5 : profile.sessionMinutes <= 45 ? 6 : profile.sessionMinutes <= 60 ? 7 : 8;
  const workouts = split.map((template,wi) => {
    const used = new Set();
    const slots = [...template.slots];
    while (slots.length < targetCount) slots.push(slots[slots.length % template.slots.length]);
    const chosen = [];
    for (const slot of slots.slice(0,targetCount)) {
      let ex = chooseExercise(pool,slot,used,profile,random);
      if (!ex) continue;
      if (usedAcross.has(ex.id) && pool.length > targetCount*split.length) {
        const altPool = pool.filter(x=>!usedAcross.has(x.id));
        ex = chooseExercise(altPool,slot,used,profile,random) || ex;
      }
      used.add(ex.id); usedAcross.add(ex.id); chosen.push(ex);
    }
    return {
      id:`workout-${wi+1}`,
      name:template.name,
      exercises:chosen.map((ex,i)=>prescription(profile,ex,i)),
    };
  });
  const cfg = GOALS[profile.goal] || GOALS.general;
  return {
    id:`program-${Date.now()}-${variation}`,
    status:"draft",
    createdAt:new Date().toISOString(),
    variation,
    title:`${profile.durationWeeks || cfg.weeks}-week ${cfg.label} programme`,
    goal:profile.goal,
    durationWeeks:Number(profile.durationWeeks||cfg.weeks),
    daysPerWeek:Number(profile.daysPerWeek),
    sessionMinutes:Number(profile.sessionMinutes),
    splitName: Number(profile.daysPerWeek)===4 ? "Upper / Lower" : Number(profile.daysPerWeek)>=5 ? "Multi-day split" : "Full-body rotation",
    progression:progression(profile.goal),
    reviewWeeks:[4,8,Number(profile.durationWeeks||cfg.weeks)].filter((v,i,a)=>v<=Number(profile.durationWeeks||cfg.weeks)&&a.indexOf(v)===i),
    workouts,
  };
}

export function acceptProgram(program) {
  return {
    ...program,
    status:"active",
    acceptedAt:new Date().toISOString(),
    startDate:new Date().toISOString().slice(0,10),
    completedSessions:0,
    nextWorkoutIndex:0,
  };
}

export function currentWeek(program) {
  return Math.min(program.durationWeeks, Math.floor((program.completedSessions||0)/program.daysPerWeek)+1);
}

export function nextWorkout(program) {
  return program.workouts[(program.nextWorkoutIndex||0)%program.workouts.length];
}

export function findReplacement(exercises,currentId,existingIds,profile,state,goal) {
  const current = exercises.find(ex=>ex.id===currentId);
  if (!current) return null;
  return exercises
    .filter(ex=>ex.id!==currentId && !existingIds.includes(ex.id) && eligibleForProfile(ex,profile,state))
    .filter(ex=>ex.app.group===current.app.group || ex.app.movement===current.app.movement)
    .map(ex=>({ex,score:(ex.app.group===current.app.group?5:0)+(ex.app.movement===current.app.movement?3:0)+goalScore(ex,goal)}))
    .sort((a,b)=>b.score-a.score)[0]?.ex || null;
}
