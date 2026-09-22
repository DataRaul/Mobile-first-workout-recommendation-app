import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(app, /id="sessionExerciseHeading" tabindex="-1"/);
assert.match(app, /renderSession\(\{ focusHeading: true \}\)/);
assert.match(app, /#sessionExerciseHeading/);
assert.match(app, /Today's exercises/);
assert.match(app, /id="skipExerciseLater"/);
assert.match(app, /openSessionExercisePicker/);
assert.match(app, /<h2>Choose next exercise<\/h2>/);
assert.match(app, /session-exercise-picker-choice/);
assert.match(app, /dialog\.showModal\(\)/);
assert.match(app, /Your current exercise stays in today's workout/);
assert.match(app, /class="session-exercise-jump/);
assert.match(app, /id="finishWorkout"/);
assert.match(app, /goToSessionExercise/);
assert.match(app, /syncVisibleSetInputs\(\);[\s\S]*session\.currentIndex = targetIndex/);
assert.match(app, /Changes today's execution order only\. Your routine stays unchanged\./);
assert.doesNotMatch(app, /#skipExerciseLater"[\s\S]{0,180}goToSessionExercise\(skipTargetIndex\)/);
assert.doesNotMatch(app, /session\.currentIndex === session\.exercises\.length - 1 \? "Finish workout"/);
assert.match(styles, /\.session-exercise-picker/);
assert.match(styles, /\.session-exercise-jump\.current/);
assert.match(app, /createRestTimer\(durationSeconds, \{ recommendedRestSeconds: recommendedSeconds \}\)/);
assert.match(app, /reconcileRestTimer\(timer\)/);
assert.match(app, /restTimerRemaining\(timer\)/);
assert.match(app, /role="timer" aria-label="Rest time remaining"/);
assert.match(app, /document\.addEventListener\("visibilitychange"/);
assert.match(app, /window\.addEventListener\("pageshow"/);
assert.match(styles, /\.rest-timer \{\s+position: fixed;/);

console.log("Session navigation and deadline-based rest-timer checks passed.");
