import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

assert.match(app, /End-of-block review/);
assert.match(app, /name="outcome"/);
assert.match(app, /name="recovery"/);
assert.match(app, /name="symptoms"/);
assert.match(app, /Save review and refresh follow-up/);
assert.match(app, /Protect a long-term programme chain/);
assert.match(app, /id="backupFollowUp"/);
assert.match(app, /Progressed load/);
assert.match(app, /Progressed repetitions/);
assert.match(app, /Reduced starting load/);
assert.match(app, /replacements start blank/);
assert.match(app, /Follow-up starting values/);

console.log("End-of-block review, adjustment communication and backup checks passed.");
