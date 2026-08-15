import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  exerciseProgressRecords,
  historySessionStatus,
  summarizeHistory,
} from "../src/progress.js";

const history = [
  {
    id: "one",
    completedAt: "2026-08-01T10:00:00.000Z",
    status: "completed",
    exercises: [
      {
        exerciseId: "press",
        setsLog: [
          { weight: "20", reps: "10", done: true },
          { weight: "20", reps: "8", done: true },
        ],
      },
    ],
  },
  {
    id: "two",
    completedAt: "2026-08-08T10:00:00.000Z",
    status: "partial",
    exercises: [
      {
        exerciseId: "press",
        setsLog: [
          { weight: "22.5", reps: "10", done: true },
          { weight: "22.5", reps: "8", done: false },
        ],
      },
    ],
  },
];

assert.equal(historySessionStatus(history[0]), "completed");
assert.equal(historySessionStatus({ exercises: [{ setsLog: [{ done: false }] }] }), "partial");
assert.deepEqual(summarizeHistory(history), {
  recorded: 2,
  completed: 1,
  partial: 1,
  completedSets: 3,
  volumeKgReps: 585,
  completionRate: 50,
});

const [press] = exerciseProgressRecords(history);
assert.equal(press.exerciseId, "press");
assert.equal(press.sessions, 2);
assert.equal(press.bestWeightKg, 22.5);
assert.equal(press.bestReps, 10);
assert.equal(press.bestSetVolumeKgReps, 225);
assert.equal(press.loadChangeKg, 2.5);
assert.equal(press.repChange, 0);

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const worker = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");
assert.match(app, /Adherence context/);
assert.match(app, /Exercise records and trends/);
assert.match(app, /Correct values/);
assert.match(app, /Delete record/);
assert.match(app, /Load more history/);
assert.match(app, /Workout in progress/);
assert.match(app, /activeMetrics\.completedSets/);
assert.match(app, /activeMetrics\.totalSets/);
assert.match(app, /id="progressResumeActive"/);
assert.match(app, /before it appears in workout history and record totals/);
assert.match(styles, /\.history-session/);
assert.match(worker, /\.\/src\/progress\.js/);

console.log("Progress summary, PR and trend calculations passed.");
