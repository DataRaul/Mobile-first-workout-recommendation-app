import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  assessDifficulty,
  compatibilityFromMechanics,
  correctExerciseType,
  correctGoalTags,
  correctMechanics,
  correctMovement,
  correctedGroup,
  correctTrainingRoles,
  reconcileExpectedCompatibility,
} from "../src/enrichment-rules.js";

const DEFAULT_SOURCE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const EXPECTED_SOURCE_SHA256 = "656634224b8977b99a6d765470ee123260d4979715eaa4e7c0b7c8bb0d79f93d";

function parseArgs(argv) {
  const args = {
    source: DEFAULT_SOURCE,
    baseline: "data/enrichment-baselines/exercise-enrichment-v3.0.json",
    overlayOut: "data/exercise-enrichment.json",
    metadataOut: "data/enrichment-metadata.json",
    auditOut: "data/enrichment-audit.json",
    check: false,
    allowSourceUpdate: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") {
      args.check = true;
      continue;
    }
    if (arg === "--allow-source-update") {
      args.allowSourceUpdate = true;
      continue;
    }
    const key = {
      "--source": "source",
      "--baseline": "baseline",
      "--overlay-out": "overlayOut",
      "--metadata-out": "metadataOut",
      "--audit-out": "auditOut",
    }[arg];
    if (!key || !argv[index + 1]) throw new Error(`Unknown or incomplete argument: ${arg}`);
    args[key] = argv[index + 1];
    index += 1;
  }
  return args;
}

async function readSource(location) {
  if (/^https?:/i.test(location)) {
    const response = await fetch(location);
    if (!response.ok) throw new Error(`Could not load source dataset (${response.status}).`);
    return response.text();
  }
  return fs.readFileSync(location, "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function tally(values) {
  return Object.fromEntries(
    [...values.reduce((counts, value) => counts.set(value, (counts.get(value) || 0) + 1), new Map())]
      .sort(([left], [right]) => String(left).localeCompare(String(right), undefined, { numeric: true })),
  );
}

function difficultyByGroup(source, overlay) {
  const result = {};
  for (const exercise of source) {
    const record = overlay[String(exercise.id)];
    result[record.group] ||= { total: 0, difficulty: { 1: 0, 2: 0, 3: 0, 4: 0 } };
    result[record.group].total += 1;
    result[record.group].difficulty[record.complexity] += 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

function difficultyByEquipment(source, overlay) {
  const result = {};
  for (const exercise of source) {
    const equipment = String(exercise.equipment || "other").toLowerCase();
    const record = overlay[String(exercise.id)];
    result[equipment] ||= { total: 0, difficulty: { 1: 0, 2: 0, 3: 0, 4: 0 } };
    result[equipment].total += 1;
    result[equipment].difficulty[record.complexity] += 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

function changedIds(source, before, after, selector) {
  return source
    .filter((exercise) => JSON.stringify(selector(before[String(exercise.id)])) !== JSON.stringify(selector(after[String(exercise.id)])))
    .map((exercise) => String(exercise.id));
}

function reconcileFlags(compatibility) {
  const cautionFlags = [];
  const safetyFlags = [];
  for (const [condition, details] of Object.entries(compatibility || {})) {
    if (["caution", "default_exclude", "needs_review"].includes(details.status)) cautionFlags.push(condition);
    if (["default_exclude", "needs_review"].includes(details.status)) safetyFlags.push(condition);
  }
  return { cautionFlags, safetyFlags };
}

function qualityFor(existing, reviewReasons) {
  const current = existing.quality || {};
  const persistentReasons = (current.reasons || []).filter((reason) =>
    ["ambiguous_name", "requires_manual_classification"].includes(reason),
  );
  const reasons = [...new Set([...persistentReasons, ...reviewReasons])];
  const hardReview = current.reviewStatus === "needs_review" || current.confidence === "low";
  if (hardReview) {
    return {
      score: Math.min(current.score ?? 0.65, 0.65),
      confidence: "low",
      reviewStatus: "needs_review",
      reasons,
    };
  }
  if (reasons.length) {
    return {
      score: 0.85,
      confidence: "medium",
      reviewStatus: "review_recommended",
      reasons,
    };
  }
  return { score: 0.97, confidence: "high", reviewStatus: "accepted", reasons: [] };
}

function rerunRecord(exercise, existing) {
  const movement = correctMovement(exercise, existing.movement);
  const group = correctedGroup(exercise, existing.group, movement);
  const exerciseType = correctExerciseType(exercise, existing.exerciseType, movement);
  const mechanics = correctMechanics(exercise, existing.mechanics);
  const mechanicsChanged = JSON.stringify(mechanics) !== JSON.stringify(existing.mechanics);
  const mechanicallyReconciledCompatibility = mechanicsChanged
    ? compatibilityFromMechanics(mechanics, existing.compatibility)
    : existing.compatibility;
  const { compatibility } = reconcileExpectedCompatibility(exercise, group, mechanicallyReconciledCompatibility);
  const assessmentInput = { ...existing, group, movement, exerciseType, mechanics, compatibility };
  const difficulty = assessDifficulty(exercise, assessmentInput);
  const trainingRoles = correctTrainingRoles(exercise, existing.trainingRoles, group, movement);
  const goalTags = correctGoalTags(existing.goalTags, movement);
  const reviewReasons = [...difficulty.reviewReasons];
  const { cautionFlags, safetyFlags } = reconcileFlags(compatibility);
  const programming = {
    ...(existing.programming || {}),
    substitutionFamily: trainingRoles[0] || existing.programming?.substitutionFamily,
  };
  const setCredits = { ...(existing.setCredits || {}) };
  if (group !== existing.group) setCredits[group] = Math.max(1, setCredits[group] || 0);

  return {
    ...existing,
    group,
    movement,
    exerciseType,
    mechanics,
    compatibility,
    trainingRoles,
    complexity: difficulty.level,
    difficulty: {
      level: difficulty.level,
      technique: { level: difficulty.technique.level, reasons: difficulty.technique.reasons },
      relativeStrength: { level: difficulty.relativeStrength.level, reasons: difficulty.relativeStrength.reasons },
      mechanicalDemand: {
        level: difficulty.mechanicalDemand.level,
        points: difficulty.mechanicalDemand.points ?? null,
        reasons: difficulty.mechanicalDemand.reasons,
      },
    },
    goalTags,
    setCredits,
    cautionFlags,
    safetyFlags,
    programming,
    quality: qualityFor(existing, reviewReasons),
  };
}

function buildAudit(source, before, after, sourceHash, baselineHash, outputHash) {
  const difficultyIds = changedIds(source, before, after, (record) => record.complexity);
  const movementIds = changedIds(source, before, after, (record) => record.movement);
  const groupIds = changedIds(source, before, after, (record) => record.group);
  const roleIds = changedIds(source, before, after, (record) => record.trainingRoles);
  const goalIds = changedIds(source, before, after, (record) => record.goalTags);
  const exerciseTypeIds = changedIds(source, before, after, (record) => record.exerciseType);
  const mechanicsIds = changedIds(source, before, after, (record) => record.mechanics);
  const compatibilityIds = changedIds(source, before, after, (record) => record.compatibility);
  const safetyIds = changedIds(source, before, after, (record) => ({ safetyFlags: record.safetyFlags, cautionFlags: record.cautionFlags }));

  const transitions = {};
  let increased = 0;
  let decreased = 0;
  for (const exercise of source) {
    const from = before[String(exercise.id)].complexity;
    const to = after[String(exercise.id)].complexity;
    transitions[`${from}->${to}`] = (transitions[`${from}->${to}`] || 0) + 1;
    if (to > from) increased += 1;
    if (to < from) decreased += 1;
  }

  return {
    version: "3.1.0",
    records: source.length,
    sourceSha256: sourceHash,
    baselineOverlaySha256: baselineHash,
    overlaySha256: outputHash,
    method: {
      aggregate: "maximum of technique, relative-strength accessibility, and mechanical-demand angles",
      mobilityCap: 2,
      expertRule: "level 4 requires an explicit expert skill/strength anchor or agreement from two angles",
    },
    changes: {
      difficulty: difficultyIds.length,
      increased,
      decreased,
      unchanged: source.length - difficultyIds.length,
      movement: movementIds.length,
      primaryGroup: groupIds.length,
      trainingRoles: roleIds.length,
      goalTags: goalIds.length,
      exerciseType: exerciseTypeIds.length,
      mechanics: mechanicsIds.length,
      compatibility: compatibilityIds.length,
      reconciledSafetyFlags: safetyIds.length,
    },
    difficultyCounts: {
      before: tally(source.map((exercise) => before[String(exercise.id)].complexity)),
      after: tally(source.map((exercise) => after[String(exercise.id)].complexity)),
    },
    transitions: Object.fromEntries(Object.entries(transitions).sort(([left], [right]) => left.localeCompare(right))),
    groupCounts: {
      before: tally(source.map((exercise) => before[String(exercise.id)].group)),
      after: tally(source.map((exercise) => after[String(exercise.id)].group)),
    },
    difficultyByGroup: {
      before: difficultyByGroup(source, before),
      after: difficultyByGroup(source, after),
    },
    difficultyByEquipment: {
      before: difficultyByEquipment(source, before),
      after: difficultyByEquipment(source, after),
    },
    reviewCounts: tally(source.map((exercise) => after[String(exercise.id)].quality.reviewStatus)),
    confidenceCounts: tally(source.map((exercise) => after[String(exercise.id)].quality.confidence)),
    changedIds: {
      difficulty: difficultyIds,
      movement: movementIds,
      primaryGroup: groupIds,
      trainingRoles: roleIds,
      goalTags: goalIds,
      exerciseType: exerciseTypeIds,
      mechanics: mechanicsIds,
      compatibility: compatibilityIds,
      reconciledSafetyFlags: safetyIds,
    },
  };
}

function serializeJson(value, pretty = false) {
  return `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`;
}

function writeOrCheck(filePath, content, check) {
  if (check) {
    const current = fs.readFileSync(filePath, "utf8");
    if (current !== content) throw new Error(`${filePath} is not reproducible; rerun the enrichment generator.`);
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const args = parseArgs(process.argv.slice(2));
const sourceText = await readSource(args.source);
const baselineText = fs.readFileSync(args.baseline, "utf8");
const source = JSON.parse(sourceText);
const baseline = JSON.parse(baselineText);

if (!Array.isArray(source) || source.length !== 1324) throw new Error(`Expected 1,324 source exercises; received ${source.length}.`);
const sourceIds = new Set(source.map((exercise) => String(exercise.id)));
if (sourceIds.size !== source.length || Object.keys(baseline).length !== source.length) throw new Error("Source and baseline IDs are incomplete or duplicated.");
for (const id of sourceIds) if (!baseline[id]) throw new Error(`Baseline is missing exercise ${id}.`);

const output = {};
for (const exercise of source) output[String(exercise.id)] = rerunRecord(exercise, baseline[String(exercise.id)]);

const overlayText = serializeJson(output);
const sourceHash = sha256(sourceText);
const baselineHash = sha256(baselineText);
const outputHash = sha256(overlayText);
if (!args.allowSourceUpdate && sourceHash !== EXPECTED_SOURCE_SHA256) {
  throw new Error(`Source SHA-256 changed (${sourceHash}); review the upstream update before using --allow-source-update.`);
}
const audit = buildAudit(source, baseline, output, sourceHash, baselineHash, outputHash);
const metadata = {
  version: "3.1.0",
  records: source.length,
  sourceSha256: sourceHash,
  baselineOverlaySha256: baselineHash,
  overlaySha256: outputHash,
  generator: "scripts/rerun-enrichment.mjs",
  confidenceCounts: audit.confidenceCounts,
  reviewCounts: audit.reviewCounts,
  reviewQueue: (audit.reviewCounts.needs_review || 0) + (audit.reviewCounts.review_recommended || 0),
  difficultyCounts: audit.difficultyCounts.after,
  groupCounts: audit.groupCounts.after,
};

writeOrCheck(args.overlayOut, overlayText, args.check);
writeOrCheck(args.metadataOut, serializeJson(metadata, true), args.check);
writeOrCheck(args.auditOut, serializeJson(audit, true), args.check);

console.log(JSON.stringify({
  records: source.length,
  sourceSha256: sourceHash,
  overlaySha256: outputHash,
  changes: audit.changes,
  difficultyCounts: audit.difficultyCounts,
  reviewCounts: audit.reviewCounts,
}, null, 2));
