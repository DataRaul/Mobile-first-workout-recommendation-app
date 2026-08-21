import assert from "node:assert/strict";
import fs from "node:fs";
import {
  installCustomizationCopy,
  personalize,
  syncRoutineReplacementCopy,
} from "../src/customization-copy.js";

function fakeButton(initialText = "Substitute") {
  let text = initialText;
  const attributes = new Map();
  return {
    textWrites: 0,
    attributeWrites: 0,
    get textContent() { return text; },
    set textContent(value) { text = value; this.textWrites += 1; },
    getAttribute(name) { return attributes.get(name) ?? null; },
    setAttribute(name, value) { attributes.set(name, String(value)); this.attributeWrites += 1; },
  };
}

const button = fakeButton();
assert.equal(syncRoutineReplacementCopy(button), true);
assert.equal(button.textContent, "Replace");
assert.equal(button.getAttribute("aria-label"), "Replace this exercise in this workout/day");
assert.equal(button.textWrites, 1);
assert.equal(button.attributeWrites, 1);
assert.equal(syncRoutineReplacementCopy(button), false, "a second pass must not mutate an already-correct button");
assert.equal(button.textWrites, 1);
assert.equal(button.attributeWrites, 1);

const stableRoot = {
  querySelectorAll: () => [button],
  querySelector: () => null,
};
assert.equal(personalize(stableRoot), 0, "personalization must settle to a no-op once copy is correct");
assert.equal(personalize(stableRoot), 0, "repeated observer passes must remain stable");

const observedButton = fakeButton();
const observedRoot = {
  documentElement: {},
  querySelectorAll: () => [observedButton],
  querySelector: () => null,
};
let observerCallback = null;
class FakeMutationObserver {
  constructor(callback) { observerCallback = callback; }
  observe() {}
}
installCustomizationCopy(observedRoot, FakeMutationObserver);
observerCallback(); observerCallback(); observerCallback();
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(observedButton.textWrites, 1, "initial observer burst must be coalesced into one effective mutation");
observerCallback(); observerCallback(); observerCallback();
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(observedButton.textWrites, 1, "settled observer callbacks must not create a self-sustaining DOM mutation loop");

const app = fs.readFileSync("src/app.js", "utf8");
const copySource = fs.readFileSync("src/customization-copy.js", "utf8");
assert.match(app, /\$\("#replaceToday"\)\.onclick = \(\) => openReplacementPicker/);
assert.match(app, /\$\("#replaceRoutine"\)\.onclick = \(\) => openReplacementPicker/);
assert.match(app, /\$\("#startRestNow"\)\.onclick = \(\) => startRest/);
assert.match(app, /\$\("#toggleRestPause"\)\.onclick/);
assert.match(app, /\$\("#skipRest"\)\.onclick = \(\) => clearRestTimer/);
assert.doesNotMatch(copySource, /setTimeout\(personalize, 0\)/, "observer callbacks must not enqueue unconditional personalization passes");
assert.match(copySource, /if \(scheduled\) return;/, "observer bursts should be coalesced");

console.log("Interactive controls and DOM observer stability regressions passed.");
