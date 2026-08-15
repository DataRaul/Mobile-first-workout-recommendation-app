import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

assert.match(html, /name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/);
assert.match(styles, /\.app-shell\s*\{[^}]*width:\s*min\(980px, 100%\)[^}]*padding:\s*22px 16px 110px/s);
assert.match(styles, /\.bottom-nav\s*\{[^}]*position:\s*fixed[^}]*grid-template-columns:\s*repeat\(5, 1fr\)[^}]*safe-area-inset-bottom/s);
assert.match(styles, /\.bottom-nav\[hidden\]\s*\{[^}]*display:\s*none !important/s);
assert.match(styles, /\.rest-timer\s*\{[^}]*position:\s*fixed[^}]*safe-area-inset-bottom[^}]*width:\s*min\(676px, calc\(100% - 24px\)\)/s);
assert.match(styles, /@media \(max-width: 700px\)[\s\S]*\.grid\.two,[\s\S]*grid-template-columns:\s*1fr/);
assert.match(styles, /@media \(max-width: 700px\)[\s\S]*\.guide-dialog\s*\{[^}]*width:\s*calc\(100% - 12px\)[^}]*max-height:\s*96dvh/s);
assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.active-progress-card \.summary-row\s*\{[^}]*flex-direction:\s*column/s);
assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.active-progress-card \.btn\s*\{[^}]*width:\s*100%/s);
assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.exercise-line\s*\{[^}]*grid-template-columns:\s*34px 1fr/s);
assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.replacement-option\s*\{[^}]*grid-template-columns:\s*64px 1fr/s);
assert.match(styles, /@media \(max-width: 480px\)[\s\S]*\.weekday-picker\s*\{[^}]*repeat\(4, minmax\(0, 1fr\)\)/s);
assert.match(styles, /@media \(max-width: 480px\)[\s\S]*\.set-row\s*\{[^}]*30px repeat\(3, minmax\(0, 1fr\)\) 42px/s);
assert.match(styles, /@media \(max-width: 480px\)[\s\S]*\.record-row\s*\{[^}]*grid-template-columns:\s*1fr/s);
assert.match(styles, /@media \(max-width: 480px\)[\s\S]*\.history-set-edit\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/s);

assert.match(app, /\["loadingView", "onboardingView", "plannerView", "sessionView"\]/);
assert.match(app, /id="progressResumeActive"/);
assert.match(app, /id="routineStartNext"/);
assert.match(app, /id="exportData"/);

console.log("Mobile shell, focused flows and narrow Progress layout checks passed.");
