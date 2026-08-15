import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(app, /id="groupFilter"/);
assert.match(app, /exercise\.app\.group === group/);
assert.match(app, /id="movementFilter"/);
assert.match(app, /id="complexityFilter"/);
assert.match(app, /id="favoritesFilter"/);
assert.match(app, /toggleFavoriteExercise/);
assert.match(app, /aria-label="View details for/);
assert.match(app, /id="toggleDetailMedia"/);
assert.match(app, /Secondary muscles:/);
assert.match(app, /Goal tags:/);
assert.match(app, /Enrichment confidence:/);
assert.match(html, /aria-label="Exercise details and choices"/);
assert.match(styles, /\.favorite-exercise\[aria-pressed="true"\]/);

console.log("Exercise library taxonomy, favorites and detail checks passed.");
