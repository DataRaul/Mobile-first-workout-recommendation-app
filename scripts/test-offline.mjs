import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("src/app.js", "utf8");
const worker = fs.readFileSync("service-worker.js", "utf8");

assert.ok(html.includes("First setup needs an internet connection"));
assert.ok(app.indexOf("await registerServiceWorker()") < app.indexOf("await loadExercises()"));
assert.ok(app.includes("offline copy"));
assert.ok(app.includes("does not yet have a complete saved exercise library"));
assert.ok(app.includes("Your profile data has not been changed"));
assert.ok(app.includes("Exercise visual unavailable"));
assert.doesNotMatch(app, /onclick="location\.reload\(\)"/);
assert.ok(worker.includes("const response = await fetch(event.request)"));
assert.ok(worker.includes('cache.match(event.request)'));

console.log("Launch, offline and media-fallback checks passed.");
