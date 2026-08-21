export const APP_VERSION = "3.9.2";
export const DATASET_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
export const MEDIA_BASE_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
export const DATASET_REPOSITORY = "https://github.com/hasaneyldrm/exercises-dataset";

export const GOALS = {
  strength: {
    label: "Strength", sets: 4, reps: "3–6", rest: 150,
    summary: "Build maximal force with stable compound lifts and longer recovery.", weeks: 12,
    guidance: { outcome: "Maximal force", chooseWhen: "Choose this when increasing controlled lifting strength is the main priority.", prescription: "Main strength movements use 3–6 repetitions. Compatible accessory work may use 6–10.", repLabel: "3–6 main reps", restLabel: "Up to 150 sec rest" },
  },
  hypertrophy: {
    label: "Hypertrophy", sets: 3, reps: "6–12", rest: 90,
    summary: "Build muscle through repeatable volume and progressive overload.", weeks: 12,
    guidance: { outcome: "Muscle growth", chooseWhen: "Choose this when building muscle is more important than testing maximal strength.", prescription: "Main or compound movements use 6–10 repetitions. Accessory and isolation work uses 10–15.", repLabel: "6–15 reps by role", restLabel: "90 sec rest" },
  },
  power: {
    label: "Power & athleticism", sets: 4, reps: "3–5", rest: 150,
    summary: "Prioritise fast, technically controlled explosive movements.", weeks: 8,
    guidance: { outcome: "Explosive force", chooseWhen: "Choose this when producing force quickly matters and technique is already dependable.", prescription: "Power movements use 3–5 technically controlled repetitions. Supporting exercises may use 6–10.", repLabel: "3–5 power reps", restLabel: "Up to 150 sec rest" },
  },
  endurance: {
    label: "Muscular endurance", sets: 3, reps: "15–25", rest: 45,
    summary: "Improve local muscular work capacity with higher repetitions.", weeks: 10,
    guidance: { outcome: "Repeated muscular effort", chooseWhen: "Choose this when sustaining repeated contractions matters more than maximum load.", prescription: "Exercises generally use 15–25 repetitions with shorter recovery between sets.", repLabel: "15–25 reps", restLabel: "45 sec rest" },
  },
  general: {
    label: "General fitness", sets: 3, reps: "8–15", rest: 75,
    summary: "Develop balanced strength, movement quality and consistency.", weeks: 12,
    guidance: { outcome: "Balanced fitness", chooseWhen: "Choose this when you want a balanced routine or are not sure which specialised goal fits yet.", prescription: "Exercises generally use 8–15 repetitions with moderate rest and balanced movement coverage.", repLabel: "8–15 reps by role", restLabel: "75 sec rest", recommended: true },
  },
  conditioning: {
    label: "Conditioning", sets: 3, reps: "30–45 sec", rest: 30,
    summary: "Combine resistance and cardio movements to improve work capacity.", weeks: 8,
    guidance: { outcome: "Whole-body work capacity", chooseWhen: "Choose this when repeated full-body effort and shorter recovery are the main target.", prescription: "Exercises generally use 30–45-second efforts with short recovery between sets.", repLabel: "30–45 sec work", restLabel: "30 sec rest" },
  },
  mobility: {
    label: "Mobility & recovery", sets: 2, reps: "30–60 sec", rest: 30,
    summary: "Build a repeatable mobility routine with controlled ranges.", weeks: 8,
    guidance: { outcome: "Controlled range of motion", chooseWhen: "Choose this for a dedicated mobility routine rather than a resistance-training split.", prescription: "Movements generally use 30–60-second controlled ranges or holds with easy transitions.", repLabel: "30–60 sec movement", restLabel: "30 sec transition" },
  },
};

export const LEVELS = { starter: "Starter", intermediate: "Intermediate", advanced: "Advanced", pro: "Highly experienced" };
export const EQUIPMENT_PRESETS = {
  full_gym: { label: "Full gym", equipment: ["body weight","dumbbell","barbell","cable","leverage machine","smith machine","ez barbell","weighted","assisted","sled machine","kettlebell","band","stability ball","medicine ball","rope","roller"] },
  machines: { label: "Machines and cables", equipment: ["leverage machine","cable","smith machine","assisted","sled machine","body weight"] },
  home_dumbbells: { label: "Home: dumbbells", equipment: ["body weight","dumbbell","band","stability ball","kettlebell"] },
  bodyweight: { label: "Bodyweight only", equipment: ["body weight"] },
  custom: { label: "Custom equipment", equipment: [] },
};
export const COMMON_EQUIPMENT = ["body weight","dumbbell","barbell","cable","leverage machine","smith machine","ez barbell","kettlebell","band","weighted","assisted","sled machine","stability ball","medicine ball","rope","roller"];
export const CONSTRAINTS = { back_pain: "Back-pain aware", knee_pain: "Knee-pain aware", elbow_pain: "Elbow-pain aware", shoulder_pain: "Shoulder-pain aware", avoid_shoulder_extension: "Avoid shoulder extension" };
