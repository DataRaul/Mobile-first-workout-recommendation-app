import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(app, /Programme inputs/);
assert.match(app, /App & data settings/);
assert.match(app, /id="profileInstructionLanguage"/);
assert.match(app, /The app interface remains English/);
assert.match(app, /previewImportState\(file\)/);
assert.match(app, /This will replace the live profile, programme, history and settings/);
assert.match(app, /Import cancelled\. Live data was not changed/);
assert.match(app, /Backup reminder/);
assert.match(app, /Export data file/);
assert.match(app, /Import data file/);
assert.match(app, /Delete local data/);
assert.match(app, /never saved to GitHub, the repository owner, an account or any server/);
assert.match(app, /showSaveFilePicker/);
assert.match(app, /Downloads location selected by this browser or device/);
assert.match(styles, /\.profile-section-heading/);

console.log("Profile settings, import preview and backup reminder checks passed.");
