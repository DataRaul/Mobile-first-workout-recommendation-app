import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

import {
  assessDifficulty,
  correctedGroup,
  correctMovement,
  correctTrainingRoles,
} from "../src/enrichment-rules.js";

const overlayText = fs.readFileSync("data/exercise-enrichment.json", "utf8");
const overlay = JSON.parse(overlayText);
const metadata = JSON.parse(fs.readFileSync("data/enrichment-metadata.json", "utf8"));
const audit = JSON.parse(fs.readFileSync("data/enrichment-audit.json", "utf8"));
const overrides = JSON.parse(fs.readFileSync("data/exercise-overrides.json", "utf8"));
const records = Object.values(overlay);

assert.equal(records.length, 1324);
assert.equal(metadata.records, 1324);
assert.equal(audit.records, 1324);
assert.equal(crypto.createHash("sha256").update(overlayText).digest("hex"), metadata.overlaySha256);
assert.equal(metadata.overlaySha256, audit.overlaySha256);
assert.equal(metadata.sourceSha256, audit.sourceSha256);

const tally = (values) => Object.fromEntries(
  [...values.reduce((counts, value) => counts.set(String(value), (counts.get(String(value)) || 0) + 1), new Map())]
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true })),
);

assert.deepEqual(tally(records.map((record) => record.complexity)), metadata.difficultyCounts);
assert.deepEqual(tally(records.map((record) => record.group)), metadata.groupCounts);
assert.deepEqual(tally(records.map((record) => record.quality.confidence)), metadata.confidenceCounts);
assert.deepEqual(tally(records.map((record) => record.quality.reviewStatus)), metadata.reviewCounts);

for (const record of records) {
  assert.ok([1, 2, 3, 4].includes(record.complexity));
  assert.equal(record.difficulty.level, record.complexity);
  for (const angle of ["technique", "relativeStrength", "mechanicalDemand"]) {
    assert.ok([1, 2, 3, 4].includes(record.difficulty[angle].level));
    assert.ok(record.difficulty[angle].reasons.length > 0);
  }
  const expectedCautions = Object.entries(record.compatibility)
    .filter(([, value]) => ["caution", "default_exclude", "needs_review"].includes(value.status))
    .map(([condition]) => condition);
  const expectedSafety = Object.entries(record.compatibility)
    .filter(([, value]) => ["default_exclude", "needs_review"].includes(value.status))
    .map(([condition]) => condition);
  assert.deepEqual(record.cautionFlags, expectedCautions);
  assert.deepEqual(record.safetyFlags, expectedSafety);
}

const exercise = (name, equipment = "body weight") => ({ name, equipment, instructions: { en: "" } });
assert.equal(assessDifficulty(exercise("push-up")).level, 2);
assert.equal(assessDifficulty(exercise("push-up (wall)")).level, 1);
assert.equal(assessDifficulty(exercise("pull-up")).level, 3);
assert.equal(assessDifficulty(exercise("handstand")).level, 3);
assert.equal(assessDifficulty(exercise("muscle up")).level, 4);
assert.equal(assessDifficulty(exercise("iron cross stretch"), { movement: "mobility", exerciseType: "mobility" }).level, 1);
assert.equal(correctMovement(exercise("biceps narrow pull-ups"), "horizontal_pull"), "vertical_pull");
assert.equal(correctMovement(exercise("inverse leg curl (on pull-up cable machine)"), "knee_flexion"), "knee_flexion");
assert.equal(correctMovement(exercise("full planche"), "mobility"), "anti_extension");
assert.equal(correctMovement(exercise("cable supine reverse fly"), "horizontal_push"), "horizontal_pull");
assert.equal(correctMovement(exercise("quick feet v. 2"), "isolation"), "cardio");
assert.equal(correctedGroup(exercise("modified push up to lower arms"), "forearms", "horizontal_push"), "triceps");
assert.deepEqual(
  correctTrainingRoles(exercise("modified push up to lower arms"), ["forearms_grip"], "triceps", "horizontal_push"),
  ["triceps_press"],
);

assert.equal(overlay["0662"].complexity, 2, "standard push-up should not be starter difficulty");
assert.equal(overlay["1430"].complexity, 3, "chest dip should require advanced relative strength");
assert.equal(overlay["3302"].complexity, 3, "handstand should require advanced control");
assert.equal(overlay["0631"].complexity, 4, "muscle-up should remain highly experienced");
assert.equal(overlay["1419"].complexity, 1, "iron cross stretch must not inherit gymnastics difficulty");
assert.equal(overlay["0139"].movement, "vertical_pull", "narrow must not trigger the row substring");
assert.equal(overlay["3299"].movement, "anti_extension", "planche must not be classified as mobility");
assert.equal(overrides["0240"].movement, "horizontal_pull", "reverse fly must not be classified as a press");
assert.equal(overrides["0602"].movement, "horizontal_pull", "machine reverse fly must not be classified as a press");
assert.equal(overrides["1421"].group, "triceps", "modified lower-arm push-up must not fill a forearm slot");
assert.deepEqual(overrides["1421"].trainingRoles, ["triceps_press"]);
assert.equal(overrides["3552"].movement, "cardio", "quick feet must not fill a knee-dominant strength role");
assert.deepEqual(overrides["3552"].trainingRoles, []);
assert.equal(overrides["3552"].exerciseType, "conditioning");
assert.ok(!overrides["3552"].goalTags.includes("hypertrophy"));
assert.ok(!overrides["3552"].goalTags.includes("strength"));

console.log("Exercise enrichment integrity and regression tests passed.");
