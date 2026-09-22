import assert from "node:assert/strict";

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
};

const { exportState, importState, loadState, previewImportState, selectBackupFile } = await import("../src/storage.js");

values.set(
  "workout-recommender.state.v2",
  JSON.stringify({ schemaVersion: 2, profile: { name: "Existing user" }, preferences: { language: "es" } }),
);
const existing = loadState();
assert.equal(existing.preferences.language, "es");
assert.equal(existing.preferences.profileStorage, "browser");
assert.equal(existing.preferences.lastBackupFileName, null);
assert.equal(existing.previousProgram, null);

const importFile = {
  text: async () => JSON.stringify({ schemaVersion: 2, profile: { name: "Imported user" } }),
};
const savedBeforePreview = values.get("workout-recommender.state.v2");
const previewed = await previewImportState(importFile);
assert.equal(previewed.profile.name, "Imported user");
assert.equal(values.get("workout-recommender.state.v2"), savedBeforePreview);
const imported = await importState(importFile);
assert.equal(imported.profile.name, "Imported user");
assert.equal(imported.preferences.profileStorage, "browser");
assert.equal(imported.previousProgram, null);

const normalizedPreferences = await previewImportState({
  text: async () => JSON.stringify({
    schemaVersion: 2,
    profile: { name: "Preferences" },
    preferences: { language: "unsupported", weightUnit: "stone" },
  }),
});
assert.equal(normalizedPreferences.preferences.language, "en");
assert.equal(normalizedPreferences.preferences.weightUnit, "kg");

values.set(
  "workout-recommender.state.v2",
  JSON.stringify({
    schemaVersion: 2,
    profile: null,
    draftProgram: { id: "orphan-draft" },
    activeProgram: { id: "orphan-active" },
    previousProgram: { id: "orphan-previous" },
    activeSession: { programId: "orphan-active" },
    history: [{ id: "orphan-session" }],
  }),
);
const profileless = loadState();
assert.equal(profileless.draftProgram, null);
assert.equal(profileless.activeProgram, null);
assert.equal(profileless.previousProgram, null);
assert.equal(profileless.activeSession, null);
assert.deepEqual(profileless.history, []);

values.set(
  "workout-recommender.state.v2",
  JSON.stringify({
    schemaVersion: 2,
    profile: { name: "Consistent user" },
    draftProgram: {
      id: "draft-2",
      predecessorProgramId: "missing-program",
      carryForwardExerciseIds: ["exercise-1"],
    },
    previousProgram: { id: "previous-1" },
    activeSession: { programId: "missing-active" },
    draftComparison: { fromProgramId: "draft-1", toProgramId: "old-draft" },
  }),
);
const reconciled = loadState();
assert.equal(reconciled.draftProgram.predecessorProgramId, null);
assert.deepEqual(reconciled.draftProgram.carryForwardExerciseIds, []);
assert.equal(reconciled.activeSession, null);
assert.equal(reconciled.draftComparison, null);

values.set(
  "workout-recommender.state.v2",
  JSON.stringify({
    schemaVersion: 2,
    profile: { name: "Active user" },
    draftProgram: { id: "stale-draft" },
    draftComparison: { toProgramId: "stale-draft" },
    activeProgram: { id: "active-1" },
    activeSession: { programId: "active-1" },
  }),
);
const active = loadState();
assert.equal(active.draftProgram, null);
assert.equal(active.draftComparison, null);
assert.equal(active.activeSession.programId, "active-1");

let clicked = false;
let appended = false;
globalThis.window = {};
globalThis.document = {
  body: { append: () => { appended = true; } },
  createElement: () => ({
    click: () => { clicked = true; },
    remove: () => {},
  }),
};
globalThis.URL = {
  createObjectURL: () => "blob:test",
  revokeObjectURL: () => {},
};

const download = await exportState(imported, { chooseLocation: true });
assert.equal(appended, true);
assert.equal(clicked, true);
assert.equal(download.fileName, "workout-recommender-backup.json");
assert.equal(download.location, "your browser's Downloads location");
assert.equal(await selectBackupFile(), undefined);

let written = "";
let savePickerOptions = null;
globalThis.window.showSaveFilePicker = async (options) => {
  savePickerOptions = options;
  return {
  name: "chosen-backup.json",
  createWritable: async () => ({
    write: async content => { written = content; },
    close: async () => {},
  }),
  };
};
const chosen = await exportState(imported, { chooseLocation: true });
assert.equal(chosen.fileName, "chosen-backup.json");
assert.equal(chosen.location, "the backup folder selected by this browser");
assert.equal(JSON.parse(written).profile.name, "Imported user");
assert.equal(savePickerOptions.id, "workout-recommender-backup");
assert.equal(savePickerOptions.startIn, "downloads");
assert.equal(savePickerOptions.suggestedName, "workout-recommender-backup.json");

let openPickerOptions = null;
globalThis.window.showOpenFilePicker = async (options) => {
  openPickerOptions = options;
  return [{ getFile: async () => importFile }];
};
assert.equal(await selectBackupFile(), importFile);
assert.equal(openPickerOptions.id, "workout-recommender-backup");
assert.equal(openPickerOptions.startIn, "downloads");
assert.equal(openPickerOptions.multiple, false);

globalThis.window.showOpenFilePicker = async () => {
  const error = new Error("Cancelled");
  error.name = "AbortError";
  throw error;
};
assert.equal(await selectBackupFile(), null);

globalThis.window.showSaveFilePicker = async () => {
  const error = new Error("Cancelled");
  error.name = "AbortError";
  throw error;
};
assert.equal(await exportState(imported, { chooseLocation: true }), null);

console.log("Storage compatibility and backup tests passed.");
