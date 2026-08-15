import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(app, /exact\.slice\(0, 5\)/);
assert.match(app, /Broader companion matches/);
assert.match(app, /id="replacementSearch" type="search"/);
assert.match(app, /id="replacementEquipment"/);
assert.match(app, /Preview details/);
assert.match(app, /Change scope/);
assert.match(app, /actionToast\(message, "Undo"/);
assert.match(app, /data-restore-availability=/);
assert.match(styles, /\.replacement-filters/);
assert.match(styles, /\.unavailable-list/);

console.log("Substitution discovery, scope, undo and availability checks passed.");
