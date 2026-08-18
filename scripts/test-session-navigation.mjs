import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(app, /id="sessionExerciseHeading" tabindex="-1"/);
assert.match(app, /renderSession\(\{ focusHeading: true \}\)/);
assert.match(app, /#sessionExerciseHeading/);
assert.match(app, /createRestTimer\(durationSeconds, \{ recommendedRestSeconds: recommendedSeconds \}\)/);
assert.match(app, /reconcileRestTimer\(timer\)/);
assert.match(app, /restTimerRemaining\(timer\)/);
assert.match(app, /role="timer" aria-label="Rest time remaining"/);
assert.match(app, /document\.addEventListener\("visibilitychange"/);
assert.match(app, /window\.addEventListener\("pageshow"/);
assert.match(styles, /\.rest-timer \{\s+position: fixed;/);

console.log("Session navigation and deadline-based rest-timer checks passed.");
