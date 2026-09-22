import assert from "node:assert/strict";
import fs from "node:fs";

const styles = fs.readFileSync("styles.css", "utf8");
const app = fs.readFileSync("src/app.js", "utf8");
const mobileBlock = styles.match(/@media \(max-width: 480px\)\s*\{([\s\S]*)\}\s*$/)?.[1] || "";

assert.doesNotMatch(
  mobileBlock,
  /\.rir-field\s*\{[^}]*display:\s*none/s,
  "RIR must remain visible on narrow mobile screens",
);
assert.match(
  mobileBlock,
  /grid-template-columns:\s*30px repeat\(3, minmax\(0, 1fr\)\) 42px/,
  "the mobile set row must reserve columns for weight, repetitions and RIR",
);
assert.match(styles, /\.active-set-previous\s*\{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap/s);
assert.ok(
  app.indexOf('class="active-set-previous"') < app.indexOf('class="set-table"'),
  "previous performance must appear before the active set inputs",
);
assert.match(app, /<span>Last<\/span><strong>\$\{escapeHtml\(previous\)\}<\/strong>/);
assert.match(app, /RIR \$\{set\.rir\}/);
assert.doesNotMatch(app, /<strong>Previous:<\/strong>/);
assert.match(styles, /\.session-exercise-picker summary\s*\{[^}]*display:\s*flex/s);
assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.session-navigation-actions\s*\{[^}]*grid-template-columns:\s*1fr 1fr/s);
assert.ok(
  app.indexOf('class="session-exercise-picker"') < app.indexOf('class="card active-set-card"'),
  "the collapsed workout queue must stay above the active set without displacing Last performance below media",
);

console.log("Mobile workout logging regression checks passed.");
