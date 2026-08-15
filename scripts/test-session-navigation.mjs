import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(app, /id="sessionExerciseHeading" tabindex="-1"/);
assert.match(app, /renderSession\(\{ focusHeading: true \}\)/);
assert.match(app, /#sessionExerciseHeading/);
assert.match(app, /state\.activeSession\.restTimerEndsAt = restTimerEnd\(seconds\)/);
assert.match(app, /restSecondsRemaining\(state\.activeSession\?\.restTimerEndsAt\)/);
assert.match(app, /role="timer" aria-label="Rest time remaining"/);
assert.match(styles, /\.rest-timer \{\s+position: fixed;/);

console.log("Session navigation and persistent rest-timer checks passed.");
