import assert from "node:assert/strict";
import {
  allowsStageComplexity,
  exerciseRecommendationPrior,
  splitStagePrior,
  trainingStage,
} from "../src/recommendation-priors.js";

function exercise(name, equipment, complexity, mechanics = {}) {
  return {
    name,
    equipment,
    app: {
      complexity,
      mechanics,
      programming: {},
    },
  };
}

const starter = { level: "starter" };
const advanced = { level: "pro" };

const chestPress = exercise("Leverage machine chest press", "leverage machine", 1, {
  stability: "low",
  loadability: "high",
  supported: true,
});
const benchPress = exercise("Barbell bench press", "barbell", 2, {
  stability: "moderate",
  loadability: "high",
});
const planche = exercise("Full planche", "body weight", 4, {
  stability: "high",
  loadability: "low",
});
const cableRaise = exercise("Cable lateral raise", "cable", 1, {
  stability: "low",
  loadability: "high",
});

assert.equal(trainingStage({ trainingMonths: 0 }), "orientation");
assert.equal(trainingStage({ trainingMonths: 5 }), "early_trained");
assert.equal(trainingStage({ trainingMonths: 8 }), "developing");
assert.equal(trainingStage({ trainingMonths: 18 }), "established");

assert.ok(
  exerciseRecommendationPrior(chestPress, starter).score >
    exerciseRecommendationPrior(planche, starter).score,
  "common stable starter exercise should outrank high-skill novelty",
);
assert.equal(
  allowsStageComplexity(benchPress, starter, 1),
  true,
  "a common, progressively loadable complexity-2 exercise can bridge a starter ceiling",
);
assert.ok(
  exerciseRecommendationPrior(cableRaise, advanced).score > 0,
  "simple cable/isolation work must remain positively usable for established trainees",
);
assert.equal(
  splitStagePrior(3, { trainingMonths: 1 }).preferredPresetIds[0],
  "full_body_rotation",
);
assert.ok(
  splitStagePrior(3, { trainingMonths: 8 }).preferredPresetIds.includes("push_pull_legs"),
  "developing users may consider PPL without making it mandatory",
);

console.log("Recommendation priors: PASS");
