import assert from "node:assert/strict";
import fs from "node:fs";

import { GOALS } from "../src/config.js";

const expectedGoals = [
  "conditioning",
  "endurance",
  "general",
  "hypertrophy",
  "mobility",
  "power",
  "strength",
];

assert.deepEqual(Object.keys(GOALS).sort(), expectedGoals, "all seven supported goals must remain documented");

for (const [key, goal] of Object.entries(GOALS)) {
  assert.ok(goal.label, `${key}: missing label`);
  assert.ok(goal.summary, `${key}: missing recommender summary`);
  assert.ok(Number.isFinite(goal.sets) && goal.sets > 0, `${key}: invalid set target`);
  assert.ok(Number.isFinite(goal.rest) && goal.rest > 0, `${key}: invalid rest target`);
  assert.ok(Number.isFinite(goal.weeks) && goal.weeks > 0, `${key}: invalid programme length`);

  for (const field of ["outcome", "chooseWhen", "prescription", "repLabel", "restLabel"]) {
    assert.ok(goal.guidance?.[field], `${key}: missing guidance.${field}`);
  }
}

const recommendedGoals = Object.entries(GOALS)
  .filter(([, goal]) => goal.guidance.recommended)
  .map(([key]) => key);
assert.deepEqual(recommendedGoals, ["general"], "general fitness should be the only guidance default");

const html = fs.readFileSync("index.html", "utf8");
assert.match(html, /id="guideDialog"/, "the reusable guide dialog must remain mounted");
assert.equal(
  (html.match(/<button data-view=/g) || []).length,
  5,
  "guidance must not add a sixth primary navigation tab",
);

const app = fs.readFileSync("src/app.js", "utf8");
for (const title of [
  "Create your profile",
  "Review the recommendation",
  "Adjust exercises",
  "Accept your programme",
  "Complete workouts",
  "Compare what comes next",
]) {
  assert.ok(app.includes(title), `missing how-it-works step: ${title}`);
}
assert.ok(app.includes("Compare all goals"), "onboarding must link to the complete goal comparison");
assert.ok(app.includes("Suggested repetitions are prefilled. Weight remains blank"), "weight ownership must be explicit");
assert.ok(app.includes("goal-comparison-head"), "goal guidance must provide a compact comparison header");
assert.ok(app.includes("goal-comparison-detail"), "goal rationale must remain expandable");
assert.ok(!app.includes('class="guide-goal-card'), "goal guidance must not render seven fully expanded cards");

console.log("Guide content, seven-goal metadata and five-tab navigation passed.");
