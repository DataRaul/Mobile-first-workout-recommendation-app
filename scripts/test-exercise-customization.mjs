import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyRoutineSlotReplacement,
  replacementMatchLabel,
  replacementWarning,
  routineSlotOptions,
} from "../src/customization.js";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const worker = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");

assert.match(html, /data-view="exercisesView"/);
assert.match(app, /Choose a replacement/);
assert.match(app, /Cancel replacement/);
assert.match(app, /Use in routine/);
assert.match(app, /Replacing/);
assert.match(app, /Available at my gym/);
assert.match(app, /Training role/);
assert.match(app, /Accept this balanced programme as your starting point/);
assert.match(app, /replace this exercise in this workout\/day/i);
assert.match(styles, /\.exercise-replacement-context/);
assert.match(styles, /\.exercise-filter-chips/);
assert.match(worker, /\.\/src\/customization\.js/);

const originalA = { exerciseId: "press", targetGroup: "chest", requestedGroup: "chest", targetRole: "chest_horizontal_press" };
const originalB = { exerciseId: "row", targetGroup: "back", requestedGroup: "back", targetRole: "back_horizontal_pull" };
const program = {
  workouts: [
    { id: "day-1", name: "Upper A", exercises: [originalA, originalB] },
    { id: "day-2", name: "Upper B", exercises: [{ ...originalA }] },
  ],
};
const history = JSON.stringify([{ workoutId: "day-1", exercises: [{ exerciseId: "press" }] }]);
const slots = routineSlotOptions(program);
assert.equal(slots.length, 3);
const candidate = {
  id: "cable-press",
  app: { complexity: 2, group: "chest", setCredits: { chest: 1 }, quality: { confidence: "high" } },
  _replacement: { requestedGroup: "chest", targetGroup: "chest", targetRole: "chest_horizontal_press", groupMatch: "exact", roleMatch: "exact" },
};
const changed = applyRoutineSlotReplacement({
  program,
  slot: slots[0],
  candidate,
  profile: { level: "intermediate" },
  applyMetadata(item, id, meta) {
    item.exerciseId = id;
    item.requestedGroup = meta.requestedGroup;
    item.targetGroup = meta.targetGroup;
    item.targetRole = meta.targetRole;
    item.groupMatch = meta.groupMatch;
    item.roleMatch = meta.roleMatch;
  },
});
assert.equal(changed, true);
assert.equal(program.workouts[0].exercises[0].exerciseId, "cable-press");
assert.equal(program.workouts[0].exercises[1].exerciseId, "row");
assert.equal(program.workouts[1].exercises[0].exerciseId, "press", "same exercise on another day must remain unchanged");
assert.equal(history, JSON.stringify([{ workoutId: "day-1", exercises: [{ exerciseId: "press" }] }]), "history remains historical truth");
assert.equal(replacementMatchLabel(candidate), "Best match");
assert.equal(replacementWarning(candidate), "");
assert.match(replacementWarning({ _replacement: { groupMatch: "companion", roleMatch: "group" } }), /direct muscle emphasis/);

console.log("Exercise catalogue and exact-slot routine customization checks passed.");
