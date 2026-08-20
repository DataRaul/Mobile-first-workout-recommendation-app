import assert from "node:assert/strict";
import fs from "node:fs";
import {
  adjustRestTimer,
  cancelRestTimer,
  createRestTimer,
  pauseRestTimer,
  reconcileRestTimer,
  resetRestTimer,
  restTimerRemaining,
  resumeRestTimer,
} from "../src/session.js";
import { DEFAULT_STATE, loadState, saveState } from "../src/storage.js";

assert.equal(DEFAULT_STATE.preferences.useRestTimer, true, "existing users retain automatic timer behavior by default");
assert.equal(DEFAULT_STATE.preferences.defaultRestSeconds, null, "programme rest remains the default until overridden");

const custom = createRestTimer(40, { now: 0, recommendedRestSeconds: 90 });
assert.equal(custom.durationSeconds, 40);
assert.equal(custom.recommendedRestSeconds, 90);
assert.equal(custom.endsAt, 40_000);
assert.equal(restTimerRemaining(custom, 20_000), 20);

const suspended = createRestTimer(90, { now: 0, recommendedRestSeconds: 90 });
assert.equal(restTimerRemaining(suspended, 20_000), 70);
assert.equal(restTimerRemaining(suspended, 70_000), 20, "wall clock, not callback count, owns elapsed time");
const completed = reconcileRestTimer(suspended, 95_000);
assert.equal(completed.status, "completed");
assert.equal(restTimerRemaining(completed, 95_000), 0);

const paused = pauseRestTimer(suspended, 20_000);
assert.equal(paused.status, "paused");
assert.equal(paused.pausedRemainingSeconds, 70);
const resumed = resumeRestTimer(paused, 70_000);
assert.equal(resumed.endsAt, 140_000);
assert.equal(restTimerRemaining(resumed, 80_000), 60);
assert.equal(restTimerRemaining(adjustRestTimer(resumed, 15, 80_000), 80_000), 75);
assert.equal(resetRestTimer(custom, 60, 10_000).endsAt, 70_000);
assert.equal(custom.recommendedRestSeconds, 90, "execution override must not rewrite programme metadata");
const cancelled = cancelRestTimer(custom, 25_000);
assert.equal(cancelled.status, "cancelled");
assert.equal(cancelled.endsAt, null);
assert.equal(restTimerRemaining(cancelled, 30_000), 0);

const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};
store.set("workout-recommender.state.v2", JSON.stringify({
  schemaVersion: 2,
  profile: { name: "Timer migration" },
  activeProgram: { id: "p1" },
  activeSession: { programId: "p1", restTimerEndsAt: 90_000 },
  history: [{ id: "history-kept" }],
  preferences: { useRestTimer: false, defaultRestSeconds: 40 },
}));
const migrated = loadState();
assert.equal(migrated.schemaVersion, 3);
assert.equal(migrated.preferences.useRestTimer, false);
assert.equal(migrated.preferences.defaultRestSeconds, 40);
assert.equal(migrated.preferences.keepScreenAwake, false);
assert.equal(migrated.history[0].id, "history-kept");
assert.equal(migrated.activeSession.timer.status, "active");
assert.equal(migrated.activeSession.restTimerEndsAt, undefined);

migrated.activeSession.timer = custom;
saveState(migrated);
const reloaded = loadState();
assert.equal(reloaded.preferences.useRestTimer, false);
assert.equal(reloaded.preferences.defaultRestSeconds, 40);
assert.equal(reloaded.activeSession.timer.endsAt, 40_000);

const app = fs.readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
assert.match(app, /if \(set\.done && restTimerEnabled\(\)\) startRest\(item\.restSeconds\);/);
assert.match(app, /if \(!state\.activeSession \|\| !restTimerEnabled\(\)\) return;/);
assert.ok(app.indexOf('class="card active-set-card"') < app.indexOf('class="card exercise-info-card"'), "active set controls must precede secondary content");
assert.match(app, /visibilitychange/);
assert.match(app, /pageshow/);
assert.match(app, /navigator\.wakeLock\?\.request/);
assert.match(app, /nextSet\.weight = set\.weight/);
assert.match(styles, /\.set-row\.current/);
assert.match(worker, /workout-recommender-v3\.9\.1-ux-polish-20260821/);
console.log("Rest timer, optional behavior, suspension recovery, persistence and active-set regressions passed.");
