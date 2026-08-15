import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(app, /class="card routine-next-card"/);
assert.match(app, /id="routineStartNext"/);
assert.match(app, /activeSession\?\.programId === program\.id/);
assert.match(app, /activeSession\?\.workoutId === next\.id/);
assert.match(app, /In progress · \$\{activeNextMetrics\.completedSets\}\/\$\{activeNextMetrics\.totalSets\} sets complete/);
assert.match(app, /<details class="routine-workout"/);
assert.match(app, /showPerformance: true/);
assert.match(app, /Last performance:/);
assert.match(app, /class="card routine-action-menu"/);
assert.match(app, /countLabel\(completedSessions, "session"\)/);
assert.match(styles, /\.routine-workout-list/);

console.log("Routine scanability, context and action checks passed.");
