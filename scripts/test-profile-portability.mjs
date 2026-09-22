import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const storage = readFileSync(new URL("../src/storage.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

assert.match(storage, /BACKUP_FILE_NAME = "workout-recommender-backup\.json"/);
assert.match(storage, /BACKUP_PICKER_ID = "workout-recommender-backup"/);
assert.match(storage, /id: BACKUP_PICKER_ID,[\s\S]*startIn: "downloads"/);
assert.match(storage, /export async function selectBackupFile/);
assert.match(app, /Restore existing profile/);
assert.match(app, /Telegram, WhatsApp and your normal browser can keep separate local copies/);
assert.match(app, /id="importDataButton"/);
assert.match(app, /startBackupRestore/);
assert.match(app, /bindBackupImportInput/);
assert.match(readme, /workout-recommender-backup\.json/);
assert.match(readme, /cannot silently read a shared phone folder on launch/);
console.log("Cross-browser profile portability regressions passed.");
