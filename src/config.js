export const APP_VERSION = "3.8.0";
export const DATASET_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
export const MEDIA_BASE_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
export const DATASET_REPOSITORY = "https://github.com/hasaneyldrm/exercises-dataset";

export const GOALS = {
  strength: {
    label: "Strength",
    sets: 4,
    reps: "3–6",
    rest: 150,
    summary: "Build maximal force with stable compound lifts and longer recovery.",
    weeks: 12,
    guidance: {
      outcome: "Maximal force",
      chooseWhen: "Choose this when increasing controlled lifting strength is the main priority.",
      prescription: "Main strength movements use 3–6 repetitions. Compatible accessory work may use 6–10.",
      repLabel: "3–6 main reps",
      restLabel: "Up to 150 sec rest",
    },
  },
  hypertrophy: {
    label: "Hypertrophy",
    sets: 3,
    reps: "6–12",
    rest: 90,
    summary: "Build muscle through repeatable volume and progressive overload.",
    weeks: 12,
    guidance: {
      outcome: "Muscle growth",
      chooseWhen: "Choose this when increasing muscle size is the main priority.",
      prescription: "Main or compound lifts use 6–10 repetitions; accessory and isolation work uses 10–15.",
      repLabel: "6–15 reps by role",
      restLabel: "About 90 sec rest",
      recommended: true,
    },
  },
  power: {
    label: "Power and athleticism",
    sets: 4,
    reps: "3–6",
    rest: 150,
    summary: "Prioritize fast, technically sound force production with generous recovery.",
    weeks: 8,
    guidance: { outcome: "Explosive force", chooseWhen: "Choose this when speed-strength and athletic movement quality are the priority.", prescription: "Power movements stay low-repetition with long recovery; compatible accessories use moderate repetitions.", repLabel: "3–6 main reps", restLabel: "Up to 150 sec rest" },
  },
  endurance: {
    label: "Muscular endurance",
    sets: 3,
    reps: "15–20",
    rest: 60,
    summary: "Build local muscular work capacity with higher repetitions and shorter recovery.",
    weeks: 8,
    guidance: { outcome: "Muscular work capacity", chooseWhen: "Choose this when sustaining repeated muscular effort matters more than maximal load.", prescription: "Exercises use higher repetitions with shorter recovery and manageable fatigue.", repLabel: "15–20 reps", restLabel: "About 60 sec rest" },
  },
  general: {
    label: "General fitness",
    sets: 3,
    reps: "8–12",
    rest: 90,
    summary: "Balance strength, muscle, movement quality and sustainable weekly training.",
    weeks: 10,
    guidance: { outcome: "Balanced fitness", chooseWhen: "Choose this when you want a broad, sustainable programme rather than one specialized outcome.", prescription: "Stable compound and accessory movements use moderate repetitions and recovery.", repLabel: "8–12 reps", restLabel: "About 90 sec rest", recommended: true },
  },
  conditioning: {
    label: "Conditioning",
    sets: 3,
    reps: "12–20",
    rest: 45,
    summary: "Improve whole-session work capacity with shorter recovery and conditioning-friendly movements.",
    weeks: 8,
    guidance: { outcome: "Whole-session work capacity", chooseWhen: "Choose this when maintaining output across repeated efforts is the main goal.", prescription: "Conditioning-compatible movements use moderate-to-high repetitions with shorter recovery.", repLabel: "12–20 reps", restLabel: "About 45 sec rest" },
  },
  mobility: {
    label: "Mobility and recovery",
    sets: 2,
    reps: "30–45 sec",
    rest: 30,
    summary: "Prioritize controlled range, low fatigue and repeatable mobility practice.",
    weeks: 6,
    guidance: { outcome: "Controlled range and recovery", chooseWhen: "Choose this for low-fatigue mobility practice rather than resistance-training progression.", prescription: "Mobility-tagged exercises use timed controlled work and short recovery.", repLabel: "30–45 sec", restLabel: "About 30 sec rest" },
  },
};

export const LEVELS = { starter: "Starter", intermediate: "Intermediate", advanced: "Advanced", pro: "Expert" };
export const COMMON_EQUIPMENT = ["body weight", "dumbbell", "barbell", "cable", "leverage machine", "smith machine", "band", "kettlebell", "ez barbell", "medicine ball", "stability ball", "bosu ball", "assisted", "sled machine", "rope", "roller"];
export const EQUIPMENT_PRESETS = {
  machines: { label: "Machines first", equipment: ["body weight", "cable", "leverage machine", "smith machine", "assisted", "sled machine"] },
  full_gym: { label: "Full gym", equipment: COMMON_EQUIPMENT },
  bodyweight: { label: "Bodyweight", equipment: ["body weight"] },
  custom: { label: "Custom equipment", equipment: [] },
};
export const CONSTRAINTS = {
  knee: "Knee sensitivity",
  lower_back: "Lower-back sensitivity",
  shoulder: "Shoulder sensitivity",
  wrist: "Wrist sensitivity",
  neck: "Neck sensitivity",
};
