const KEY = "workout-recommender.state.v2";

export const DEFAULT_STATE = {
  schemaVersion: 2,
  profile: null,
  draftProgram: null,
  activeProgram: null,
  activeSession: null,
  history: [],
  gym: { unavailableExerciseIds: [], unavailableEquipment: [] },
  preferences: {
    language: "en",
    profileStorage: "browser",
    lastBackupAt: null,
    lastBackupFileName: null,
    lastBackupLocation: null,
  },
};

const clone = value => JSON.parse(JSON.stringify(value));

function normalizeState(value) {
  return {
    ...clone(DEFAULT_STATE),
    ...value,
    preferences: {
      ...clone(DEFAULT_STATE.preferences),
      ...(value.preferences || {}),
    },
  };
}

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
    if (saved?.schemaVersion === 2) {
      return normalizeState(saved);
    }
  } catch {}
  return migrateLegacy() || clone(DEFAULT_STATE);
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export async function exportState(state, { chooseLocation = false } = {}) {
  const content = JSON.stringify(state, null, 2);
  const fileName = `workout-recommender-${new Date().toISOString().slice(0,10)}.json`;

  if (chooseLocation && typeof window.showSaveFilePicker === "function") {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "Workout Recommender backup",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return {
        fileName: handle.name || fileName,
        location: "the folder you selected",
      };
    } catch (error) {
      if (error?.name === "AbortError") return null;
      console.warn("The file picker was unavailable; using a browser download instead.", error);
    }
  }

  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return {
    fileName,
    location: "your browser's Downloads location",
  };
}

export async function importState(file) {
  const parsed = JSON.parse(await file.text());
  if (parsed?.schemaVersion !== 2) throw new Error("This is not a Workout Recommender v2 export.");
  const imported = normalizeState(parsed);
  saveState(imported);
  return imported;
}

export function resetState() {
  localStorage.removeItem(KEY);
  return clone(DEFAULT_STATE);
}
