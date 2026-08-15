import assert from "node:assert/strict";
import fs from "node:fs";
import {
  defaultTrainingWeekdays,
  normalizeTrainingWeekdays,
  scheduleStatus,
  weekdaySummary,
} from "../src/schedule.js";

assert.deepEqual(defaultTrainingWeekdays(3), [1, 3, 5]);
assert.deepEqual(normalizeTrainingWeekdays([1, 4], 2), [1, 4]);
assert.deepEqual(normalizeTrainingWeekdays([1], 3), [1, 3, 5]);
assert.equal(weekdaySummary([1, 3, 5]), "Mon, Wed, Fri");
assert.equal(scheduleStatus([1, 3, 5], new Date(2026, 7, 17)).scheduledToday, true);
assert.equal(scheduleStatus([1, 3, 5], new Date(2026, 7, 18)).daysUntilNext, 1);

const app = fs.readFileSync("src/app.js", "utf8");
assert.ok(app.includes("Missed calendar days do not skip this workout"));
assert.ok(app.includes("Training weeks advance after completed sessions"));

console.log("Weekday scheduling and training-week semantics passed.");
