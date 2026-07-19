import { DEFAULT_GYM, DEFAULT_PROFILE } from "./data.js";

const KEYS = {
  profile: "workout.profile.v1",
  gym: "workout.gym.kraftwerk.v1",
  history: "workout.history.v1",
};

const clone = value => JSON.parse(JSON.stringify(value));

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...clone(fallback), ...JSON.parse(raw) } : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadProfile() {
  return read(KEYS.profile, DEFAULT_PROFILE);
}

export function saveProfile(profile) {
  const value = { ...DEFAULT_PROFILE, ...profile, updatedAt: new Date().toISOString() };
  write(KEYS.profile, value);
  return value;
}

export function loadGym() {
  return read(KEYS.gym, DEFAULT_GYM);
}

export function saveGym(gym) {
  const value = { ...DEFAULT_GYM, ...gym, updatedAt: new Date().toISOString() };
  write(KEYS.gym, value);
  return value;
}

export function loadHistory() {
  return read(KEYS.history, { workouts: [], recentExerciseIds: [] });
}

export function saveWorkout(workout) {
  const history = loadHistory();
  const completedIds = workout.exercises.filter(item => item.completed).map(item => item.id);
  const allIds = workout.exercises.map(item => item.id);
  const record = {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    generatedAt: workout.generatedAt,
    completedAt: new Date().toISOString(),
    completedExerciseIds: completedIds,
    exerciseIds: allIds,
  };
  const next = {
    workouts: [record, ...history.workouts].slice(0, 30),
    recentExerciseIds: [...allIds, ...history.recentExerciseIds]
      .filter((id, index, array) => array.indexOf(id) === index)
      .slice(0, 18),
  };
  write(KEYS.history, next);
  return next;
}

export function exportData() {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "Mobile-first-workout-recommendation-app",
    profile: loadProfile(),
    gym: loadGym(),
    history: loadHistory(),
  };
}

export function importData(payload) {
  if (!payload || payload.schemaVersion !== 1 || typeof payload !== "object") {
    throw new Error("Unsupported or invalid export file.");
  }

  if (payload.profile) saveProfile(payload.profile);
  if (payload.gym) saveGym(payload.gym);
  if (payload.history && Array.isArray(payload.history.workouts)) {
    write(KEYS.history, payload.history);
  }

  return exportData();
}

export function resetGym() {
  localStorage.removeItem(KEYS.gym);
  return loadGym();
}

export function resetAll() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
