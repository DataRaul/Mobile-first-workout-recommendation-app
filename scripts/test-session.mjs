import assert from "node:assert/strict";
import {
  latestRecordedSession,
  READINESS_GUIDANCE,
  sessionCompletion,
  sessionMetrics,
  updateSetLogValue,
} from "../src/session.js";

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

const recorded = {
  completedAt: "2026-08-14T10:00:00.000Z",
  exercises: [
    {
      setsLog: [
        { weight: "20", reps: "10", done: true },
        { weight: "20", reps: "8", done: true },
        { weight: "20", reps: "6", done: false },
      ],
    },
  ],
};
assert.deepEqual(sessionMetrics(recorded), {
  completedSets: 2,
  totalSets: 3,
  status: "partial",
  volume: 360,
});
assert.equal(
  latestRecordedSession([
    recorded,
    { completedAt: "2026-08-15T10:00:00.000Z", id: "latest" },
    { startedAt: "2026-08-16T10:00:00.000Z", id: "unfinished" },
  ]).id,
  "latest",
);
assert.match(READINESS_GUIDANCE.fatigued.guidance, /5–10% less weight/);
assert.match(READINESS_GUIDANCE.pain.guidance, /Do not train through/);

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
