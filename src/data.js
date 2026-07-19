export const LEVEL_ORDER = {
  starter: 1,
  intermediate: 2,
  advanced: 3,
  pro: 4,
};

export const DEFAULT_PROFILE = {
  name: "",
  level: "starter",
  sessionMinutes: 45,
  goal: "hypertrophy",
  equipmentMode: "machine_preferred",
  constraints: [],
  kraftwerkMode: true,
  favorites: [],
};

export const DEFAULT_GYM = {
  schemaVersion: 1,
  gymId: "kraftwerk",
  name: "Kraftwerk",
  updatedAt: null,
  observations: {},
};

export const EQUIPMENT = [
  { id: "chest_press", name: "Chest press", area: "Chest", type: "selectorized" },
  { id: "pec_deck", name: "Pec deck / rear delt", area: "Chest & shoulders", type: "selectorized" },
  { id: "lat_pulldown", name: "Lat pulldown", area: "Back", type: "selectorized" },
  { id: "seated_row", name: "Seated row", area: "Back", type: "selectorized" },
  { id: "assisted_pullup", name: "Assisted pull-up", area: "Back", type: "selectorized" },
  { id: "leg_press", name: "Leg press", area: "Legs", type: "plate_loaded" },
  { id: "leg_extension", name: "Leg extension", area: "Legs", type: "selectorized" },
  { id: "seated_leg_curl", name: "Seated leg curl", area: "Legs", type: "selectorized" },
  { id: "lying_leg_curl", name: "Lying leg curl", area: "Legs", type: "selectorized" },
  { id: "hip_abductor", name: "Hip abductor", area: "Glutes", type: "selectorized" },
  { id: "hip_adductor", name: "Hip adductor", area: "Legs", type: "selectorized" },
  { id: "glute_drive", name: "Glute drive", area: "Glutes", type: "plate_loaded" },
  { id: "calf_raise", name: "Calf raise", area: "Calves", type: "selectorized" },
  { id: "shoulder_press", name: "Shoulder press", area: "Shoulders", type: "selectorized" },
  { id: "lateral_raise", name: "Lateral raise machine", area: "Shoulders", type: "selectorized" },
  { id: "biceps_curl", name: "Biceps curl machine", area: "Arms", type: "selectorized" },
  { id: "triceps_press", name: "Triceps press machine", area: "Arms", type: "selectorized" },
  { id: "cable_station", name: "Adjustable cable station", area: "Multi-area", type: "cable" },
  { id: "ab_crunch", name: "Abdominal crunch", area: "Core", type: "selectorized" },
  { id: "back_extension", name: "Back extension", area: "Back & core", type: "selectorized" },
];

const ex = (
  id, name, muscleGroup, equipmentId, level, sets, reps, restSeconds, minutes,
  notRecommendedFor = [], cautionFor = [], substitutions = [], note = "", movement = "isolation"
) => ({
  id, name, muscleGroup, equipmentId, equipmentType: "machine", level,
  sets, reps, restSeconds, minutes, notRecommendedFor, cautionFor,
  substitutions, note, movement
});

export const EXERCISES = [
  ex("machine_chest_press", "Machine chest press", "chest", "chest_press", "starter", 3, "8–12", 90, 7,
    ["shoulder_pain"], ["elbow_pain"], ["cable_chest_press", "pec_deck"], "Keep shoulder blades gently set and stop before the shoulders roll forward.", "horizontal_push"),
  ex("neutral_chest_press", "Neutral-grip chest press", "chest", "chest_press", "starter", 3, "10–15", 75, 7,
    [], ["shoulder_pain", "elbow_pain"], ["cable_chest_press", "pec_deck"], "Use the neutral handles when available and keep elbows below shoulder height.", "horizontal_push"),
  ex("pec_deck", "Pec deck fly", "chest", "pec_deck", "starter", 3, "10–15", 60, 6,
    ["shoulder_pain", "avoid_shoulder_extension"], [], ["machine_chest_press", "cable_chest_press"], "Do not let the elbows travel behind the torso.", "chest_fly"),
  ex("cable_chest_press", "Standing cable chest press", "chest", "cable_station", "intermediate", 3, "10–15", 75, 7,
    ["back_pain"], ["shoulder_pain"], ["machine_chest_press", "pec_deck"], "Use a staggered stance and avoid leaning or arching.", "horizontal_push"),

  ex("neutral_lat_pulldown", "Neutral-grip lat pulldown", "back", "lat_pulldown", "starter", 3, "8–12", 90, 7,
    [], ["elbow_pain", "shoulder_pain"], ["seated_row_neutral", "assisted_pullup"], "Pull toward the upper chest without swinging or forcing range.", "vertical_pull"),
  ex("wide_lat_pulldown", "Medium-wide lat pulldown", "back", "lat_pulldown", "intermediate", 3, "10–15", 75, 7,
    ["shoulder_pain"], ["elbow_pain"], ["neutral_lat_pulldown", "seated_row_neutral"], "Use a medium rather than extreme width.", "vertical_pull"),
  ex("seated_row_neutral", "Neutral-grip seated row", "back", "seated_row", "starter", 3, "8–12", 90, 7,
    [], ["back_pain", "elbow_pain"], ["neutral_lat_pulldown", "chest_supported_row"], "Keep the torso supported or still; do not rock through the lower back.", "horizontal_pull"),
  ex("chest_supported_row", "Chest-supported machine row", "back", "seated_row", "starter", 3, "10–15", 75, 7,
    [], ["elbow_pain"], ["seated_row_neutral", "neutral_lat_pulldown"], "Keep the chest on the pad to reduce lower-back loading.", "horizontal_pull"),
  ex("assisted_pullup", "Assisted neutral-grip pull-up", "back", "assisted_pullup", "intermediate", 3, "6–10", 105, 8,
    ["shoulder_pain"], ["elbow_pain"], ["neutral_lat_pulldown", "seated_row_neutral"], "Choose enough assistance to control the full movement.", "vertical_pull"),
  ex("reverse_pec_deck", "Reverse pec deck", "rear_shoulders", "pec_deck", "starter", 3, "12–20", 60, 6,
    ["shoulder_pain"], [], ["cable_rear_delt", "seated_row_neutral"], "Lead with the elbows and avoid shrugging.", "rear_delt"),
  ex("cable_rear_delt", "Cable rear-delt fly", "rear_shoulders", "cable_station", "intermediate", 3, "12–20", 60, 6,
    ["shoulder_pain"], [], ["reverse_pec_deck", "seated_row_neutral"], "Use light load and keep the shoulder motion controlled.", "rear_delt"),

  ex("leg_press", "Leg press", "quads", "leg_press", "starter", 3, "8–12", 105, 8,
    ["knee_pain", "back_pain"], [], ["leg_extension", "hip_adductor"], "Use a pain-free depth and keep the pelvis supported.", "knee_dominant"),
  ex("shallow_leg_press", "Partial-range leg press", "quads", "leg_press", "starter", 3, "10–15", 90, 8,
    ["knee_pain"], ["back_pain"], ["leg_extension", "hip_adductor"], "Use only a comfortable range; do not force deep hip flexion.", "knee_dominant"),
  ex("leg_extension", "Leg extension", "quads", "leg_extension", "starter", 3, "10–15", 75, 6,
    ["knee_pain"], [], ["leg_press", "hip_adductor"], "Align the knee with the machine pivot and avoid snapping into lockout.", "knee_extension"),
  ex("seated_leg_curl", "Seated leg curl", "hamstrings", "seated_leg_curl", "starter", 3, "10–15", 75, 6,
    [], ["knee_pain"], ["lying_leg_curl", "glute_drive"], "Keep the hips against the pad and control the return.", "knee_flexion"),
  ex("lying_leg_curl", "Lying leg curl", "hamstrings", "lying_leg_curl", "starter", 3, "10–15", 75, 6,
    ["back_pain"], ["knee_pain"], ["seated_leg_curl", "glute_drive"], "Avoid arching the lower back as the heels rise.", "knee_flexion"),
  ex("glute_drive", "Glute drive machine", "glutes", "glute_drive", "intermediate", 3, "8–12", 105, 8,
    ["back_pain"], ["knee_pain"], ["hip_abductor", "seated_leg_curl"], "Finish by squeezing the glutes, not by overextending the lower back.", "hip_extension"),
  ex("hip_abductor", "Hip abductor machine", "glutes", "hip_abductor", "starter", 3, "12–20", 60, 5,
    [], [], ["glute_drive", "seated_leg_curl"], "Keep the torso stable and use a controlled range.", "hip_abduction"),
  ex("hip_adductor", "Hip adductor machine", "adductors", "hip_adductor", "starter", 3, "12–20", 60, 5,
    [], [], ["leg_press", "seated_leg_curl"], "Use a comfortable starting width.", "hip_adduction"),
  ex("machine_calf_raise", "Machine calf raise", "calves", "calf_raise", "starter", 3, "10–15", 60, 5,
    [], ["knee_pain"], ["leg_press_calf_raise"], "Pause briefly at the top and use a controlled stretch.", "plantar_flexion"),
  ex("leg_press_calf_raise", "Leg-press calf raise", "calves", "leg_press", "intermediate", 3, "12–20", 60, 5,
    ["knee_pain", "back_pain"], [], ["machine_calf_raise"], "Keep knees softly extended and move only through the ankles.", "plantar_flexion"),

  ex("machine_shoulder_press", "Machine shoulder press", "shoulders", "shoulder_press", "intermediate", 3, "8–12", 90, 7,
    ["shoulder_pain"], ["elbow_pain", "back_pain"], ["lateral_raise_machine", "reverse_pec_deck"], "Use a pain-free range and avoid excessive lower-back arching.", "vertical_push"),
  ex("lateral_raise_machine", "Lateral raise machine", "shoulders", "lateral_raise", "starter", 3, "12–20", 60, 6,
    ["shoulder_pain"], [], ["cable_lateral_raise", "reverse_pec_deck"], "Raise only to a comfortable height without shrugging.", "shoulder_abduction"),
  ex("cable_lateral_raise", "Cable lateral raise", "shoulders", "cable_station", "intermediate", 3, "12–20", 60, 6,
    ["shoulder_pain"], [], ["lateral_raise_machine", "reverse_pec_deck"], "Use a light load and keep the wrist neutral.", "shoulder_abduction"),

  ex("machine_biceps_curl", "Machine biceps curl", "biceps", "biceps_curl", "starter", 3, "10–15", 60, 5,
    ["elbow_pain"], [], ["cable_biceps_curl"], "Keep the upper arm supported and avoid forcing full extension.", "elbow_flexion"),
  ex("cable_biceps_curl", "Cable biceps curl", "biceps", "cable_station", "starter", 3, "10–15", 60, 5,
    ["elbow_pain"], [], ["machine_biceps_curl"], "Use a comfortable handle and keep wrists neutral.", "elbow_flexion"),
  ex("machine_triceps_press", "Machine triceps press", "triceps", "triceps_press", "starter", 3, "10–15", 60, 5,
    ["elbow_pain", "shoulder_pain"], [], ["rope_pressdown"], "Keep shoulders down and stop before elbow discomfort.", "elbow_extension"),
  ex("rope_pressdown", "Rope triceps pressdown", "triceps", "cable_station", "starter", 3, "10–15", 60, 5,
    ["elbow_pain"], ["shoulder_pain"], ["machine_triceps_press"], "Keep elbows near the torso and use a neutral wrist.", "elbow_extension"),

  ex("machine_ab_crunch", "Machine abdominal crunch", "core", "ab_crunch", "starter", 3, "10–15", 60, 5,
    ["back_pain"], [], ["pallof_press"], "Move through the trunk without pulling with the arms.", "trunk_flexion"),
  ex("pallof_press", "Cable Pallof press", "core", "cable_station", "starter", 3, "10–12 each side", 45, 6,
    [], ["shoulder_pain"], ["machine_ab_crunch"], "Stand tall and resist rotation without holding your breath.", "anti_rotation"),
  ex("machine_back_extension", "Machine back extension", "lower_back", "back_extension", "intermediate", 3, "10–15", 75, 6,
    ["back_pain"], [], ["pallof_press", "seated_row_neutral"], "Use a small controlled range and avoid hyperextension.", "trunk_extension"),
];

export const MUSCLE_LABELS = {
  chest: "Chest",
  back: "Back",
  rear_shoulders: "Rear shoulders",
  quads: "Quadriceps",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  adductors: "Adductors",
  calves: "Calves",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  core: "Core",
  lower_back: "Lower back",
};

export const CONSTRAINT_LABELS = {
  back_pain: "Back-pain aware",
  knee_pain: "Knee-pain aware",
  elbow_pain: "Elbow-pain aware",
  shoulder_pain: "Shoulder-pain aware",
  avoid_shoulder_extension: "No shoulder extension",
};
