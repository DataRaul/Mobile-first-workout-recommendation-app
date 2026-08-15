import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("src/app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");

for (const view of ["onboardingView", "plannerView", "sessionView"]) {
  assert.ok(app.includes(view), `${view} must remain part of the navigation visibility logic`);
}

assert.match(
  styles,
  /\.bottom-nav\[hidden\]\s*\{[^}]*display:\s*none\s*!important;/s,
  "the bottom navigation hidden state must override its grid display",
);

console.log("Navigation visibility regression checks passed.");
