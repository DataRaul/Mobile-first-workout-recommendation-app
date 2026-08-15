import assert from "node:assert/strict";
import { summarizeProgramChanges } from "../src/programme.js";

const item = (exerciseId, targetGroup, sets = 3, reps = "8-12") => ({
  exerciseId,
  requestedGroup: targetGroup,
  targetGroup,
  movementRole: `${targetGroup}_main`,
  sets,
  reps,
  restSeconds: 90,
});

const previous = {
  id: "draft-1",
  workouts: [
    {
      id: "day-1",
      exercises: [item("chest-press", "chest"), item("row", "back")],
    },
  ],
};
const next = {
  id: "draft-2",
  workouts: [
    {
      id: "day-1",
      exercises: [item("incline-press", "chest"), item("row", "back", 4)],
    },
  ],
};

assert.deepEqual(summarizeProgramChanges(previous, next), {
  fromProgramId: "draft-1",
  toProgramId: "draft-2",
  retained: 1,
  replaced: 1,
  added: 0,
  removed: 0,
  adjusted: 1,
  changedExerciseSlots: 1,
});

const appSource = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../src/app.js", import.meta.url), "utf8"));
assert.match(appSource, /Compared with the recommendation you just replaced/);
assert.match(appSource, /state\.draftComparison = summarizeProgramChanges\(program, nextDraft\)/);
assert.match(appSource, /state\.draftComparison = summarizeProgramChanges\(previousDraft, nextDraft\)/);
assert.match(appSource, /window\.scrollTo\(\{ top: 0, behavior: "auto" \}\)/);

console.log("Draft recovery and regeneration comparison tests passed.");
