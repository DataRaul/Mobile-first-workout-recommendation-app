const KEY = "workout-recommender.state.v2";

export const DEFAULT_STATE = {
  schemaVersion: 2,
  profile: null,
  draftProgram: null,
  activeProgram: null,
  activeSession: null,
  history: [],
  gym: { unavailableExerciseIds: [], unavailableEquipment: [] },
  preferences: { language: "en" },
};

const clone = value => JSON.parse(JSON.stringify(value));

function migrateLegacy() {
  try {
    const old = JSON.parse(localStorage.getItem("workout.profile.v1") || "null");
    if (!old) return null;
    const preset = old.equipmentMode === "machine_only" ? "machines" : "full_gym";
    return {
      ...clone(DEFAULT_STATE),
      profile: {
        name: old.name || "",
        goal: "hypertrophy",
        level: old.level || "starter",
        daysPerWeek: 3,
        sessionMinutes: old.sessionMinutes || 45,
        durationWeeks: 12,
        equipmentPreset: preset,
        equipment: [],
        constraints: old.constraints || [],
        favorites: old.favorites || [],
      },
    };
  } catch { return null; }
}

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved?.schemaVersion === 2) return { ...clone(DEFAULT_STATE), ...saved };
  } catch {}
  return migrateLegacy() || clone(DEFAULT_STATE);
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workout-recommender-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importState(file) {
  const parsed = JSON.parse(await file.text());
  if (parsed?.schemaVersion !== 2) throw new Error("This is not a Workout Recommender v2 export.");
  saveState(parsed);
  return parsed;
}

export function resetState() {
  localStorage.removeItem(KEY);
  return clone(DEFAULT_STATE);
}
