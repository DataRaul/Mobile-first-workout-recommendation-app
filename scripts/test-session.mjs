import assert from "node:assert/strict";
import { sessionCompletion } from "../src/session.js";

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

console.log("Session completion checks passed.");
