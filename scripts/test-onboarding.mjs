import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("src/app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");

for (const title of ["Your training direction", "Your weekly schedule", "Equipment, safety and saving"]) {
  assert.ok(app.includes(title), `missing onboarding stage: ${title}`);
}
assert.equal((app.match(/data-profile-step="[123]"/g) || []).length, 3, "exactly three onboarding sections are expected");
assert.ok(app.includes("Customize individual workout days"));
assert.ok(app.includes("preset emphasis"));
assert.match(styles, /\.grid\.two > \*/);
assert.match(styles, /\.profile-step\[hidden\]/);

console.log("Staged onboarding and optional day-customization checks passed.");
