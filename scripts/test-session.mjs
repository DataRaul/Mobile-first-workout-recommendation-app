import assert from "node:assert/strict";
import { sessionCompletion, updateSetLogValue } from "../src/session.js";

const session = (doneValues) => ({
  exercises: [
    {
      setsLog: doneValues.map((done, index) => ({ set: index + 1, done })),
    },
  ],
});

assert.deepEqual(sessionCompletion(session([true, true, true])), {
  completedSets: 3,
  totalSets: 3,
  status: "completed",
});

assert.deepEqual(sessionCompletion(session([true, false, false])), {
  completedSets: 1,
  totalSets: 3,
  status: "partial",
});

assert.deepEqual(sessionCompletion(session([false, false])), {
  completedSets: 0,
  totalSets: 2,
  status: "partial",
});

assert.deepEqual(sessionCompletion({ exercises: [] }), {
  completedSets: 0,
  totalSets: 0,
  status: "partial",
});

const loggedSet = { weight: "", reps: "", rir: "", done: false };
assert.equal(updateSetLogValue(loggedSet, "weight", 10), loggedSet);
updateSetLogValue(loggedSet, "reps", "12");
updateSetLogValue(loggedSet, "rir", 2);
updateSetLogValue(loggedSet, "unexpected", "ignored");
assert.deepEqual(loggedSet, {
  weight: "10",
  reps: "12",
  rir: "2",
  done: false,
});

console.log("Session completion checks passed.");
