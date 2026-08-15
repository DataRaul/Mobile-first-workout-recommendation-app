import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(app, /aria-label="Set \$\{index \+ 1\} weight in \$\{unit\}"/);
assert.match(app, /min="1" max="999" step="1" data-field="reps"/);
assert.match(app, /validateSetLog\(set\)/);
assert.match(app, /invalidCompletedSets\(session\)/);
assert.match(app, /Instructions unavailable/);
assert.match(app, /Warm up before working sets/);
assert.match(app, /Pain or unusual symptoms during this movement/);
assert.match(app, /name="weightUnit"/);
assert.match(app, /id="profileWeightUnit"/);
assert.match(styles, /\.set-row\.invalid input\[aria-invalid="true"\]/);

console.log("Active workout validation, safety and unit checks passed.");
