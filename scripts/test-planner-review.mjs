import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("src/app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");

for (const panel of ["overview", "week", "analysis"]) {
  assert.ok(app.includes(`data-planner-panel="${panel}"`), `missing planner panel: ${panel}`);
}
assert.ok(app.includes("Lower direct-volume schedule"));
assert.ok(app.includes("This plan is still usable and every planned muscle receives coverage"));
assert.ok(app.includes("A direct slot is an exercise mainly targeting that muscle"));
assert.ok(app.includes("reviewPlannerCautions"));
assert.ok(app.includes("reviewPlannerAdaptations"));
assert.ok(app.includes("plannerItemHasCaution"));
assert.ok(app.includes("plannerItemHasAdaptation"));
assert.ok(app.includes("secondary involvement in compound exercises"));
assert.ok(app.includes("this is context, not a direct-volume warning"));
assert.doesNotMatch(app, /Review \${issueCount} fallback/);
assert.match(styles, /\.planner-actions\s*\{[^}]*position:\s*sticky/s);
assert.match(styles, /\.planner-panel\[hidden\]/);

console.log("Recommendation review information architecture checks passed.");
