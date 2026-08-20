import assert from "node:assert/strict";
import fs from "node:fs";

import { replacementScopeLabel, restTimerState } from "../src/ux-polish.js";

assert.deepEqual(replacementScopeLabel("Today only · the routine template stays unchanged."), {
  key: "today",
  label: "TODAY ONLY",
});
assert.deepEqual(replacementScopeLabel("Today + future routine · this changes both."), {
  key: "today-routine",
  label: "TODAY + FUTURE ROUTINE",
});
assert.deepEqual(replacementScopeLabel("Future routine · completed history stays unchanged."), {
  key: "routine",
  label: "FUTURE ROUTINE",
});
assert.deepEqual(replacementScopeLabel("Draft only · this changes the recommendation."), {
  key: "draft",
  label: "DRAFT ONLY",
});

assert.equal(restTimerState("Rest 1:12 Running · programme 90s"), "running");
assert.equal(restTimerState("Rest 0:48 Paused · programme 90s"), "paused");
assert.equal(restTimerState("Rest complete Programme target 90s"), "complete");
assert.equal(restTimerState("Rest timer ready Programme target 90s"), "ready");

const html = fs.readFileSync("index.html", "utf8");
const script = fs.readFileSync("src/ux-polish.js", "utf8");
const css = fs.readFileSync("ux-polish.css", "utf8");
const serviceWorker = fs.readFileSync("service-worker.js", "utf8");
const config = fs.readFileSync("src/config.js", "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

assert.match(html, /href="\.\/ux-polish\.css"/);
assert.match(html, /src="\.\/src\/ux-polish\.js"/);
assert.match(script, /className = "btn small ghost movement-preview-toggle"/);
assert.match(script, /exercise\?\.gif_url/);
assert.match(script, /button\.setAttribute\("aria-expanded", "true"\)/);
assert.match(script, /stopOtherMovementPreviews\(card\)/);
assert.match(script, /new MutationObserver\(enhanceRestTimer\)/);
assert.match(script, /new MutationObserver\(enhanceReplacementDialog\)/);
assert.match(css, /#restTimer \.rest-timer \{[\s\S]*background: var\(--surface\);/);
assert.match(css, /#restTimer \.rest-readout strong \{[\s\S]*font-variant-numeric: tabular-nums;/);
assert.match(css, /#exerciseDialog\.replacement-dialog-active\[open\][\s\S]*height: 94dvh;/);
assert.match(css, /\.replacement-option\.movement-previewing > img[\s\S]*width: 100%;/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(serviceWorker, /workout-recommender-v3\.9\.1-ux-polish-20260821/);
assert.match(serviceWorker, /"\.\/ux-polish\.css"/);
assert.match(serviceWorker, /"\.\/src\/ux-polish\.js"/);
assert.match(config, /APP_VERSION = "3\.9\.1"/);
assert.equal(packageJson.version, "3.9.1");

console.log("User-tested timer and substitution UX polish regression passed.");
