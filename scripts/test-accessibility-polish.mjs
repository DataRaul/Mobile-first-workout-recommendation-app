import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const accessibility = await readFile(new URL("../src/accessibility.js", import.meta.url), "utf8");
const accessibilityStyles = await readFile(new URL("../accessibility.css", import.meta.url), "utf8");
const serviceWorker = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");

assert.match(html, /href="\.\/accessibility\.css"/);
assert.match(html, /src="\.\/src\/accessibility\.js"/);
assert.match(html, /data-view="todayView" class="active" type="button"/);
assert.match(html, /id="closeExerciseDialog"[^>]*type="button"/);
assert.match(html, /id="closeGuideDialog"[^>]*type="button"/);

assert.match(accessibilityStyles, /\.btn\.small\s*\{[^}]*min-height:\s*40px/s);
assert.match(accessibilityStyles, /@media \(max-width: 480px\)[\s\S]*\.performance-list li[\s\S]*flex-direction:\s*column/);
assert.match(accessibilityStyles, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(accessibilityStyles, /animation-duration:\s*0\.01ms !important/);

assert.match(accessibility, /aria-controls/);
assert.match(accessibility, /aria-pressed/);
assert.match(accessibility, /Programme sessions completed/);
assert.match(accessibility, /focus\(\{ preventScroll: true \}\)/);
assert.match(accessibility, /"Home", "End"/);
assert.match(accessibility, /"ArrowLeft", "ArrowRight", "Home", "End"/);
assert.match(accessibility, /prefers-reduced-motion: reduce/);
assert.match(accessibility, /scrollIntoView\(\{ behavior: "auto", block: "start" \}\)/);
assert.match(accessibility, /ACTION_BUTTON_SELECTOR/);

assert.match(serviceWorker, /workout-recommender-v3\.7\.0-accessibility-20260815/);
assert.match(serviceWorker, /"\.\/accessibility\.css"/);
assert.match(serviceWorker, /"\.\/src\/accessibility\.js"/);

// Preserve the newer local-file UX that landed after the stale accessibility branch diverged.
assert.match(app, /Export data file/);
assert.match(app, /Import data file/);
assert.match(app, /Delete local data/);

console.log("Accessibility reconciliation checks passed without reverting newer app copy.");
