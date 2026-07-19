export const DATASET_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
export const MEDIA_BASE_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
export const DATASET_REPOSITORY = "https://github.com/hasaneyldrm/exercises-dataset";

export const GOALS = {
  strength: { label: "Strength", sets: 4, reps: "3–6", rest: 150, summary: "Build maximal force with stable compound lifts and longer recovery.", weeks: 12 },
  hypertrophy: { label: "Hypertrophy", sets: 3, reps: "6–12", rest: 90, summary: "Build muscle through repeatable volume and progressive overload.", weeks: 12 },
  power: { label: "Power & athleticism", sets: 4, reps: "3–5", rest: 150, summary: "Prioritise fast, technically controlled explosive movements.", weeks: 8 },
  endurance: { label: "Muscular endurance", sets: 3, reps: "15–25", rest: 45, summary: "Improve local muscular work capacity with higher repetitions.", weeks: 10 },
  general: { label: "General fitness", sets: 3, reps: "8–15", rest: 75, summary: "Develop balanced strength, movement quality and consistency.", weeks: 12 },
  conditioning: { label: "Conditioning", sets: 3, reps: "30–45 sec", rest: 30, summary: "Combine resistance and cardio movements to improve work capacity.", weeks: 8 },
  mobility: { label: "Mobility & recovery", sets: 2, reps: "30–60 sec", rest: 30, summary: "Build a repeatable mobility routine with controlled ranges.", weeks: 8 },
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

export const CONSTRAINTS = {
  back_pain: "Back-pain aware",
  knee_pain: "Knee-pain aware",
  elbow_pain: "Elbow-pain aware",
  shoulder_pain: "Shoulder-pain aware",
  avoid_shoulder_extension: "Avoid shoulder extension",
};
