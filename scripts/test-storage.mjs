import assert from "node:assert/strict";

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
};

const { exportState, importState, loadState } = await import("../src/storage.js");

values.set(
  "workout-recommender.state.v2",
  JSON.stringify({ schemaVersion: 2, profile: { name: "Existing user" }, preferences: { language: "es" } }),
);
const existing = loadState();
assert.equal(existing.preferences.language, "es");
assert.equal(existing.preferences.profileStorage, "browser");
assert.equal(existing.preferences.lastBackupFileName, null);

const imported = await importState({
  text: async () => JSON.stringify({ schemaVersion: 2, profile: { name: "Imported user" } }),
});
assert.equal(imported.profile.name, "Imported user");
assert.equal(imported.preferences.profileStorage, "browser");

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
assert.match(download.fileName, /^workout-recommender-\d{4}-\d{2}-\d{2}\.json$/);
assert.equal(download.location, "your browser's Downloads location");

let written = "";
globalThis.window.showSaveFilePicker = async () => ({
  name: "chosen-backup.json",
  createWritable: async () => ({
    write: async content => { written = content; },
    close: async () => {},
  }),
});
const chosen = await exportState(imported, { chooseLocation: true });
assert.equal(chosen.fileName, "chosen-backup.json");
assert.equal(chosen.location, "the folder you selected");
assert.equal(JSON.parse(written).profile.name, "Imported user");

globalThis.window.showSaveFilePicker = async () => {
  const error = new Error("Cancelled");
  error.name = "AbortError";
  throw error;
};
assert.equal(await exportState(imported, { chooseLocation: true }), null);

console.log("Storage compatibility and backup tests passed.");
