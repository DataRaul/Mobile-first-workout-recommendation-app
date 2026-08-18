const normalize = (value) => String(value || "").trim().toLowerCase();

const STAGE_BY_LEVEL = {
  starter: "orientation",
  intermediate: "early_trained",
  advanced: "developing",
  pro: "established",
};

const STAGE_LABELS = {
  orientation: "Orientation / novice",
  early_trained: "Early trained",
  developing: "Developing",
  established: "Established / advanced",
};

const COMMON_DEFAULT_PATTERNS = [
  "chest press",
  "bench press",
  "incline press",
  "lat pulldown",
  "pulldown",
  "seated row",
  "cable row",
  "leg press",
  "hack squat",
  "leg extension",
  "leg curl",
  "hamstring curl",
  "hip thrust",
  "glute bridge",
  "lateral raise",
  "face pull",
  "biceps curl",
  "hammer curl",
  "triceps pushdown",
  "calf raise",
  "plank",
];

const HIGH_SKILL_PATTERNS = [
  "planche",
  "front lever",
  "back lever",
  "muscle-up",
  "muscle up",
  "human flag",
  "handstand push-up",
  "handstand push up",
  "pistol squat",
  "dragon flag",
  "snatch",
  "clean and jerk",
  "clean & jerk",
  "sots press",
  "turkish get-up",
  "turkish get up",
];

const UNSTABLE_SETUP_PATTERNS = [
  "exercise ball",
  "stability ball",
  "bosu",
  "balance board",
  "wobble board",
];

const STABLE_EQUIPMENT = new Set([
  "leverage machine",
  "sled machine",
  "assisted",
  "cable",
  "smith machine",
]);

function hasPattern(name, patterns) {
  return patterns.some((pattern) => name.includes(pattern));
}

export function trainingStage(profile = {}) {
  const months = Number(profile.trainingMonths);
  if (Number.isFinite(months) && months >= 0) {
    if (months < 2) return "orientation";
    if (months < 6) return "early_trained";
    if (months < 12) return "developing";
    return "established";
  }
  return STAGE_BY_LEVEL[profile.level] || "orientation";
}

export function trainingStageLabel(profile = {}) {
  return STAGE_LABELS[trainingStage(profile)];
}

export function exerciseRecommendationPrior(exercise, profile = {}) {
  const stage = trainingStage(profile);
  const name = normalize(exercise?.name);
  const equipment = normalize(exercise?.equipment);
  const app = exercise?.app || {};
  const mechanics = app.mechanics || {};
  const complexity = Number(app.complexity) || 1;
  const commonDefault = hasPattern(name, COMMON_DEFAULT_PATTERNS);
  const highSkill = hasPattern(name, HIGH_SKILL_PATTERNS) || complexity >= 4;
  const unstableSetup =
    hasPattern(name, UNSTABLE_SETUP_PATTERNS) ||
    mechanics.stability === "high";
  const stableSetup =
    !unstableSetup && (
      STABLE_EQUIPMENT.has(equipment) ||
      mechanics.supported === true ||
      mechanics.stability === "low"
    );
  const loadable = mechanics.loadability === "high" || mechanics.loadability === "moderate";
  const starterBridge =
    stage === "orientation" &&
    complexity === 2 &&
    !highSkill &&
    !unstableSetup &&
    !app.programming?.defaultAvoid &&
    (commonDefault || stableSetup);

  let score = 0;
  const reasons = [];

  if (commonDefault) {
    score += 2.5;
    reasons.push("common_repeatable_default");
  }
  if (stableSetup) {
    score += stage === "orientation" ? 2 : 1;
    reasons.push("stable_setup");
  }
  if (loadable) {
    score += 1;
    reasons.push("progressively_loadable");
  }
  if (unstableSetup) {
    score -= stage === "orientation" ? 6 : 2;
    reasons.push("unstable_setup_not_default");
  }
  if (app.programming?.defaultAvoid) {
    score -= 8;
    reasons.push("default_avoid");
  }

  if (stage === "orientation") {
    if (complexity <= 1) score += 2;
    if (starterBridge) {
      score += 0.5;
      reasons.push("starter_bridge_candidate");
    }
    if (complexity >= 3) score -= 8;
    if (highSkill) score -= 12;
  } else if (stage === "early_trained") {
    if (complexity <= 2) score += 1.5;
    if (complexity >= 4) score -= 6;
  } else if (stage === "developing") {
    if (complexity <= 3) score += 1;
    if (highSkill && !commonDefault) score -= 1;
  } else {
    // Established trainees do not get a complexity bonus merely for being advanced.
    // Simple productive exercises remain high-value when goal fit is strong.
    if (complexity <= 2 && (commonDefault || stableSetup || loadable)) {
      score += 1;
      reasons.push("simple_exercise_remains_valid");
    }
    if (highSkill && !commonDefault) {
      score -= 3;
      reasons.push("high_skill_not_default_progression");
    }
  }

  return {
    score,
    stage,
    stageLabel: STAGE_LABELS[stage],
    commonDefault,
    stableSetup,
    unstableSetup,
    loadable,
    highSkill,
    starterBridge,
    reasons,
  };
}

export function allowsStageComplexity(exercise, profile = {}, hardCeiling = 1) {
  const complexity = Number(exercise?.app?.complexity) || 1;
  if (complexity <= hardCeiling) return true;
  const prior = exerciseRecommendationPrior(exercise, profile);
  return prior.starterBridge && complexity === hardCeiling + 1;
}

export function splitStagePrior(daysPerWeek, profile = {}) {
  const days = Math.min(6, Math.max(2, Number(daysPerWeek) || 3));
  const stage = trainingStage(profile);
  const simple = {
    2: ["full_body_rotation", "upper_lower"],
    3: ["full_body_rotation", "full_upper_lower"],
    4: ["upper_lower", "full_upper_lower_full"],
    5: ["push_pull_legs_upper_lower"],
    6: ["push_pull_legs_twice"],
  };
  const developing = {
    2: ["upper_lower", "full_body_rotation"],
    3: ["full_upper_lower", "push_pull_legs", "full_body_rotation"],
    4: ["upper_lower", "full_upper_lower_full"],
    5: ["push_pull_legs_upper_lower"],
    6: ["push_pull_legs_twice"],
  };
  return {
    stage,
    preferredPresetIds:
      stage === "orientation" || stage === "early_trained"
        ? simple[days]
        : developing[days],
    note:
      "Split choice is a schedule/programming prior, not an advancement ladder. Elapsed time alone does not require PPL or a higher-frequency split.",
  };
}
