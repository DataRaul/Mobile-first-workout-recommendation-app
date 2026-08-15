import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(app, /This training week:/);
assert.match(app, /Last recorded workout/);
assert.match(app, /data-readiness=/);
assert.match(app, /aria-pressed=/);
assert.match(app, /state\.preferences\.readinessCheck = \{ date: readinessDate, value \}/);
assert.match(styles, /\.readiness-options \[aria-pressed="true"\]/);

console.log("Today context and readiness checks passed.");
