const KEY = "workout-recommender.state.v2";

export const DEFAULT_STATE = {
  schemaVersion: 3,
  profile: null,
  draftProgram: null,
  draftComparison: null,
  activeProgram: null,
  previousProgram: null,
  activeSession: null,
  history: [],
  gym: { unavailableExerciseIds: [], unavailableEquipment: [] },
  preferences: {
    language: "en",
    profileStorage: "browser",
    lastBackupAt: null,
    lastBackupFileName: null,
    lastBackupLocation: null,
    readinessCheck: null,
    weightUnit: "kg",
    useRestTimer: true,
    defaultRestSeconds: null,
    keepScreenAwake: false,
  },
};

const clone = value => JSON.parse(JSON.stringify(value));

function normalizeTimer(timer, legacyEndsAt = null) {
  const source = timer && typeof timer === "object" ? timer : null;
  const legacyDeadline = Number(legacyEndsAt) || null;
  const allowedStatuses = new Set(["active", "paused", "completed", "cancelled"]);
  const status = allowedStatuses.has(source?.status)
    ? source.status
    : legacyDeadline
      ? "active"
      : null;
  if (!status) return null;

  const duration = Number(source?.durationSeconds);
  const recommended = Number(source?.recommendedRestSeconds);
  const pausedRemaining = Number(source?.pausedRemainingSeconds);
  const endsAt = Number(source?.endsAt) || legacyDeadline;
  return {
    status,
    startedAt: Number(source?.startedAt) || null,
    endsAt: status === "active" ? endsAt || null : null,
    durationSeconds:
      Number.isFinite(duration) && duration > 0
        ? Math.min(3600, Math.max(1, Math.round(duration)))
        : legacyDeadline
          ? Math.max(1, Math.ceil((legacyDeadline - Date.now()) / 1000))
          : null,
    recommendedRestSeconds:
      Number.isFinite(recommended) && recommended > 0 ? Math.round(recommended) : null,
    pausedRemainingSeconds:
      status === "paused" && Number.isFinite(pausedRemaining)
        ? Math.max(0, Math.round(pausedRemaining))
        : null,
    completedAt: Number(source?.completedAt) || null,
    cancelledAt: Number(source?.cancelledAt) || null,
  };
}

function normalizeState(value) {
  const normalized = {
    ...clone(DEFAULT_STATE),
    ...value,
    schemaVersion: 3,
    history: Array.isArray(value.history) ? value.history : [],
    gym: {
      ...clone(DEFAULT_STATE.gym),
      ...(value.gym || {}),
      unavailableExerciseIds: Array.isArray(value.gym?.unavailableExerciseIds)
        ? value.gym.unavailableExerciseIds
        : [],
      unavailableEquipment: Array.isArray(value.gym?.unavailableEquipment)
        ? value.gym.unavailableEquipment
        : [],
    },
    preferences: {
      ...clone(DEFAULT_STATE.preferences),
      ...(value.preferences || {}),
    },
  };
  const supportedLanguages = new Set(["en", "es", "it", "fr", "tr", "ru", "zh", "hi", "pl", "ko"]);
  if (!supportedLanguages.has(normalized.preferences.language)) {
    normalized.preferences.language = "en";
  }
  normalized.preferences.weightUnit = normalized.preferences.weightUnit === "lb" ? "lb" : "kg";
  normalized.preferences.useRestTimer = normalized.preferences.useRestTimer !== false;
  const preferredRest = Number(normalized.preferences.defaultRestSeconds);
  normalized.preferences.defaultRestSeconds =
    Number.isFinite(preferredRest) && preferredRest > 0
      ? Math.min(600, Math.max(15, Math.round(preferredRest)))
      : null;
  normalized.preferences.keepScreenAwake = normalized.preferences.keepScreenAwake === true;

  if (!normalized.profile) {
    normalized.draftProgram = null;
    normalized.draftComparison = null;
    normalized.activeProgram = null;
    normalized.previousProgram = null;
    normalized.activeSession = null;
    normalized.history = [];
    return normalized;
  }

  if (normalized.activeProgram) {
    normalized.draftProgram = null;
    normalized.draftComparison = null;
  }

  if (
    normalized.activeSession &&
    (!normalized.activeProgram || normalized.activeSession.programId !== normalized.activeProgram.id)
  ) {
    normalized.activeSession = null;
  }

  if (normalized.activeSession) {
    normalized.activeSession = {
      ...normalized.activeSession,
      timer: normalizeTimer(
        normalized.activeSession.timer,
        normalized.activeSession.restTimerEndsAt,
      ),
    };
    delete normalized.activeSession.restTimerEndsAt;
  }

  if (
    normalized.draftProgram?.predecessorProgramId &&
    normalized.draftProgram.predecessorProgramId !== normalized.previousProgram?.id
  ) {
    normalized.draftProgram = {
      ...normalized.draftProgram,
      predecessorProgramId: null,
      carryForwardExerciseIds: [],
    };
  }

  if (
    normalized.draftComparison &&
    normalized.draftComparison.toProgramId !== normalized.draftProgram?.id
  ) {
    normalized.draftComparison = null;
  }

  return normalized;
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
    if ([2, 3].includes(saved?.schemaVersion)) {
      return normalizeState(saved);
    }
  } catch {}
  return migrateLegacy() || clone(DEFAULT_STATE);
}

export function saveState(state) {
  state.schemaVersion = 3;
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

export async function previewImportState(file) {
  const parsed = JSON.parse(await file.text());
  if (![2, 3].includes(parsed?.schemaVersion)) {
    throw new Error("This is not a supported Workout Recommender export.");
  }
  return normalizeState(parsed);
}

export async function importState(file) {
  const imported = await previewImportState(file);
  saveState(imported);
  return imported;
}

export function resetState() {
  localStorage.removeItem(KEY);
  return clone(DEFAULT_STATE);
}
