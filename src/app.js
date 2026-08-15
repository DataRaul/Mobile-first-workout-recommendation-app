import { COMMON_EQUIPMENT, CONSTRAINTS, EQUIPMENT_PRESETS, GOALS, LEVELS } from "./config.js";
import { loadExercises, mediaUrl, uniqueValues } from "./dataset.js";
import { exportState, importState, loadState, resetState, saveState } from "./storage.js";
import {
  acceptProgram,
  carriedForwardSets,
  comparePrograms,
  completedProgramSnapshot,
  currentWeek,
  defaultWorkoutDays,
  generateProgram,
  getSplitPresets,
  linkProgramContinuation,
  maxComplexity,
  MUSCLE_FOCUS_OPTIONS,
  nextWorkout,
  replacementOptions,
  refreshProgramVolume,
  summarizeProgramChanges,
  TRAINING_ROLE_LABELS,
  workoutDaysForProfile,
  WORKOUT_TYPES,
} from "./programme.js";
import {
  latestRecordedSession,
  READINESS_GUIDANCE,
  sessionCompletion,
  sessionMetrics,
  updateSetLogValue,
} from "./session.js";
import {
  defaultTrainingWeekdays,
  normalizeTrainingWeekdays,
  scheduleStatus,
  WEEKDAYS,
  weekdaySummary,
} from "./schedule.js";

let state = loadState();
let exercises = [];
let byId = new Map();
let browserLimit = 24;
let restInterval = null;
let restRemaining = 0;
let updateAvailable = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>'"]/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character],
  );
const labelize = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
const COMPLEXITY_LABELS = {
  1: "Starter",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
};

function persist() {
  saveState(state);
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(element._timer);
  element._timer = setTimeout(() => {
    element.hidden = true;
  }, 3000);
}

function updateDatasetBadge() {
  const badge = $("#datasetBadge");
  if (!exercises.length) {
    badge.textContent = navigator.onLine ? "Loading exercises…" : "Offline · checking saved copy";
    return;
  }
  badge.textContent = updateAvailable
    ? "Update ready · reopen app"
    : `${exercises.length.toLocaleString()} exercises${navigator.onLine ? "" : " · offline copy"}`;
  badge.classList.add("ready");
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register("./service-worker.js");
    if (registration.waiting) {
      updateAvailable = true;
      updateDatasetBadge();
    }
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          updateAvailable = true;
          updateDatasetBadge();
          toast("A new app version is ready. Reopen the app when convenient.");
        }
      });
    });
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // The app can still run online when installation is unavailable.
  }
}

function installMediaFallback() {
  const fallback = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 440"><rect width="640" height="440" fill="#171c24"/><text x="320" y="220" fill="#aab4c3" font-family="system-ui,sans-serif" font-size="24" text-anchor="middle">Exercise visual unavailable</text></svg>',
  )}`;
  document.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || image.dataset.mediaFallback) return;
      image.dataset.mediaFallback = "true";
      image.classList.add("media-unavailable");
      image.alt = `${image.alt || "Exercise"} — visual unavailable`;
      image.src = fallback;
    },
    true,
  );
}

function currentDeviceLabel() {
  const mobile =
    navigator.userAgentData?.mobile ??
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return mobile ? "this mobile device" : "this computer";
}

function backupMessage(backup) {
  return `Backup saved as ${backup.fileName} in ${backup.location}.`;
}

function view(viewId) {
  $$(".view").forEach((element) => element.classList.toggle("active", element.id === viewId));
  $$("#bottomNav button").forEach((button) => {
    const selectedView = viewId === "plannerView" ? "todayView" : viewId;
    button.classList.toggle("active", button.dataset.view === selectedView);
  });
  $("#bottomNav").hidden = ["loadingView", "onboardingView", "plannerView", "sessionView"].includes(viewId);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function exerciseById(id) {
  return byId.get(String(id));
}

function instructionSteps(item) {
  const language = state.preferences?.language || "en";
  return (
    item.instruction_steps?.[language] ||
    item.instruction_steps?.en ||
    String(item.instructions?.[language] || item.instructions?.en || "")
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)
  );
}

function activeGoal() {
  return GOALS[state.profile?.goal] || GOALS.general;
}

function complexityText(exercise) {
  if (!exercise?.app?.complexity) return "Complexity unknown";
  return `Complexity ${exercise.app.complexity}/4 · ${COMPLEXITY_LABELS[exercise.app.complexity]}`;
}

function profileComplexityText() {
  const target = maxComplexity(state.profile?.level);
  return `${LEVELS[state.profile?.level] || "Starter"} profile · maximum ${target}/4 (${COMPLEXITY_LABELS[target]}) · simpler exercises may fill roles`;
}

function trainingRoleText(item) {
  if (!item?.targetRole) return "";
  return TRAINING_ROLE_LABELS[item.targetRole] || labelize(item.targetRole);
}

function difficultyFallbackText(item) {
  if (!item?.difficultyDelta) return "";
  if (item.difficultyDelta > 0) {
    return "above the current profile maximum; rebuild this saved programme";
  }
  return Math.abs(item.difficultyDelta) === 1
    ? "one level below profile for balanced coverage"
    : "simpler technical exercise used for balanced coverage";
}


function roleCoverageText(item) {
  if (item?.roleMatch === "related") return "closest related role";
  if (item?.roleMatch === "alternative") {
    const requested = TRAINING_ROLE_LABELS[item.requestedRole] || labelize(item.requestedRole);
    return `same-muscle alternative to ${requested}`;
  }
  if (item?.roleMatch === "group") return "same-muscle fallback";
  return "";
}

function groupCoverageText(item) {
  if (item?.groupMatch !== "companion") return "";
  const requested = labelize(item.requestedGroup || "selected muscle");
  const resolved = labelize(item.targetGroup || "companion muscle");
  return `${resolved} added because ${requested} options were exhausted`;
}

const GUIDE_STEPS = [
  {
    title: "Create your profile",
    text: "Choose a goal, experience ceiling, schedule, equipment, safety constraints and where the live profile is saved.",
  },
  {
    title: "Review the recommendation",
    text: "The planner balances muscle groups across the week before selecting compatible exercises and prescriptions.",
  },
  {
    title: "Adjust exercises",
    text: "Replace an exercise in the draft, accepted routine or current session without weakening active safety filters.",
  },
  {
    title: "Accept your programme",
    text: "Acceptance turns the recommendation into a stable routine for the selected programme length.",
  },
  {
    title: "Complete workouts",
    text: "Follow the suggested sets and repetitions, then record the weight, completed repetitions and RIR that apply to you.",
  },
  {
    title: "Compare what comes next",
    text: "After the programme ends, compare it with the next recommendation and carry forward performance for retained exercises.",
  },
];

function guideGoalKeys() {
  return Object.keys(GOALS).sort((left, right) => {
    const recommendedDifference =
      Number(Boolean(GOALS[right].guidance?.recommended)) -
      Number(Boolean(GOALS[left].guidance?.recommended));
    return recommendedDifference || 0;
  });
}

function goalGuidanceHtml(goalKey, { compact = false } = {}) {
  const goal = GOALS[goalKey] || GOALS.general;
  const guidance = goal.guidance;
  const headingLevel = compact ? 3 : 2;
  return `
    <article class="goal-guidance ${compact ? "goal-guidance-compact" : ""}">
      <div class="goal-guidance-heading">
        <div>
          <div class="eyebrow">${escapeHtml(guidance.outcome)}</div>
          <h${headingLevel}>${escapeHtml(goal.label)}</h${headingLevel}>
        </div>
        ${guidance.recommended ? '<span class="recommendation-badge">Good default</span>' : ""}
      </div>
      ${compact ? "" : `<p>${escapeHtml(guidance.chooseWhen)}</p>`}
      <p>${escapeHtml(guidance.prescription)}</p>
      <div class="chips goal-chips">
        <span class="chip">${escapeHtml(guidance.repLabel)}</span>
        <span class="chip">${escapeHtml(guidance.restLabel)}</span>
        <span class="chip">${goal.weeks} weeks</span>
      </div>
      ${compact ? '<small>Suggested repetitions are prefilled. Weight remains blank for you to record.</small>' : ""}
    </article>`;
}

function guideHowHtml() {
  return `
    <div class="guide-intro">
      <div class="eyebrow">From profile to follow-up</div>
      <h2 id="guideDialogTitle">How the app works</h2>
      <p>The recommendation becomes a routine only after you review and accept it.</p>
    </div>
    <ol class="guide-steps">
      ${GUIDE_STEPS.map(
        (step, index) => `
          <li>
            <span class="guide-step-number">${index + 1}</span>
            <div><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></div>
          </li>`,
      ).join("")}
    </ol>
    <div class="notice guide-notice">
      <strong>Accepted routines stay stable.</strong>
      <p>Changing profile inputs rebuilds the next recommendation. Completed workout history is retained.</p>
    </div>
    <div class="guide-basics grid three">
      <div><strong>Difficulty</strong><span>Your experience level is a hard automatic ceiling.</span></div>
      <div><strong>Weight</strong><span>The app suggests repetitions; you record an appropriate weight.</span></div>
      <div><strong>Storage</strong><span>The live copy stays in this browser unless you export a backup.</span></div>
    </div>`;
}

function guideGoalsHtml(selectedGoal, allowGoalSelection) {
  return `
    <div class="guide-intro">
      <div class="eyebrow">Choose deliberately</div>
      <h2 id="guideDialogTitle">Training goals</h2>
      <p>Your goal changes exercise priorities, repetitions, rest, progression and programme length. It does not choose your working weight.</p>
    </div>
    <div class="notice"><strong>Not sure?</strong><p>General fitness is the balanced starting point. You can refine the goal when you rebuild a future recommendation.</p></div>
    <div class="goal-comparison">
      <div class="goal-comparison-head" aria-hidden="true"><span>Goal</span><span>Repetitions</span><span>Rest</span><span>Block</span></div>
      ${guideGoalKeys()
        .map((key) => {
          const goal = GOALS[key];
          const guidance = goal.guidance;
          const selected = key === selectedGoal;
          return `
            <details class="goal-comparison-row ${selected ? "selected" : ""}" ${selected ? "open" : ""}>
              <summary>
                <span class="goal-comparison-name"><strong>${escapeHtml(goal.label)}</strong><small>${escapeHtml(guidance.outcome)}${guidance.recommended ? " · good default" : ""}</small></span>
                <span data-label="Repetitions">${escapeHtml(guidance.repLabel)}</span>
                <span data-label="Rest">${escapeHtml(guidance.restLabel)}</span>
                <span data-label="Block">${goal.weeks} weeks</span>
              </summary>
              <div class="goal-comparison-detail">
                <p><strong>Choose when:</strong> ${escapeHtml(guidance.chooseWhen)}</p>
                <p><strong>How it is programmed:</strong> ${escapeHtml(guidance.prescription)}</p>
                ${
                  allowGoalSelection
                    ? `<button class="btn ${selected ? "primary" : ""} small" type="button" data-select-goal="${key}">${selected ? `${escapeHtml(goal.label)} selected` : `Use ${escapeHtml(goal.label)}`}</button>`
                    : selected
                      ? '<span class="current-goal-label">Current profile goal</span>'
                      : ""
                }
              </div>
            </details>`;
        })
        .join("")}
    </div>`;
}

function openGuide(section = "how", { allowGoalSelection = false } = {}) {
  const dialog = $("#guideDialog");
  const content = $("#guideDialogContent");
  let activeSection = section === "goals" ? "goals" : "how";

  function selectedGoal() {
    return $("#goalSelect")?.value || state.profile?.goal || "general";
  }

  function renderGuideDialog() {
    content.innerHTML = `
      <div class="guide-tabs" role="tablist" aria-label="Guide sections">
        <button id="guideTabHow" type="button" role="tab" data-guide-section="how" aria-controls="guidePanel" aria-selected="${activeSection === "how"}" tabindex="${activeSection === "how" ? 0 : -1}">How it works</button>
        <button id="guideTabGoals" type="button" role="tab" data-guide-section="goals" aria-controls="guidePanel" aria-selected="${activeSection === "goals"}" tabindex="${activeSection === "goals" ? 0 : -1}">Training goals</button>
      </div>
      <div id="guidePanel" class="guide-content" role="tabpanel" aria-labelledby="${activeSection === "how" ? "guideTabHow" : "guideTabGoals"}">
        ${activeSection === "how" ? guideHowHtml() : guideGoalsHtml(selectedGoal(), allowGoalSelection)}
      </div>`;

    content.querySelectorAll("[data-guide-section]").forEach((button) => {
      button.onclick = () => {
        activeSection = button.dataset.guideSection;
        renderGuideDialog();
        content.querySelector(`[data-guide-section="${activeSection}"]`)?.focus();
      };
      button.onkeydown = (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        activeSection = activeSection === "how" ? "goals" : "how";
        renderGuideDialog();
        content.querySelector(`[data-guide-section="${activeSection}"]`)?.focus();
      };
    });

    content.querySelectorAll("[data-select-goal]").forEach((button) => {
      button.onclick = () => {
        const goalSelect = $("#goalSelect");
        if (goalSelect) {
          goalSelect.value = button.dataset.selectGoal;
          goalSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
        dialog.close();
      };
    });
  }

  renderGuideDialog();
  dialog.showModal();
}

function workoutMuscleChipsHtml(workout) {
  const stored = Array.isArray(workout?.muscleCoverage)
    ? workout.muscleCoverage
    : [];
  const coverage = stored.length
    ? stored
    : [...countBy((workout?.exercises || []).map((item) => item.targetGroup || item.requestedGroup).filter(Boolean))]
        .map(([group, exercises]) => ({ group, exercises }));
  if (!coverage.length) return "";

  return `<div class="muscle-coverage" aria-label="Muscles trained">
    ${coverage
      .map(
        ({ group, exercises }) =>
          `<span class="muscle-chip">${escapeHtml(labelize(group))}<strong>${Number(exercises) || 1}</strong></span>`,
      )
      .join("")}
  </div>`;
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
    return counts;
  }, new Map());
}

function constraintNotesHtml(item, compact = false) {
  const notes = Array.isArray(item?.constraintNotes)
    ? item.constraintNotes.filter((note) => note.status === "caution")
    : [];
  if (!notes.length) return "";

  if (compact) {
    return `<small class="constraint-note">Caution: ${notes
      .map((note) => `${labelize(note.constraint)} — ${note.modification}`)
      .map(escapeHtml)
      .join(" · ")}</small>`;
  }

  return `<div class="notice"><strong>Profile-aware caution</strong>${notes
    .map(
      (note) =>
        `<p><strong>${escapeHtml(labelize(note.constraint))}:</strong> ${escapeHtml(note.reason)} ${escapeHtml(note.modification)}</p>`,
    )
    .join("")}</div>`;
}

function weeklyVolumeHtml(program) {
  const volume = program?.weeklyVolume || {};
  const entries = Object.entries(volume);
  if (!entries.length) return "";

  return `
    <div class="card">
      <div class="summary-row">
        <div>
          <h2>Weekly set-volume check</h2>
          <p>Effective sets include full credit for the primary muscle and fractional credit for meaningful secondary work.</p>
        </div>
      </div>
      <div class="grid two">
        ${entries
          .map(([group, values]) => {
            const statusText =
              values.status === "below"
                ? "Below preferred range"
                : values.status === "above"
                  ? "Above preferred range"
                  : "Within preferred range";
            return `<div class="notice">
              <strong>${escapeHtml(labelize(group))}: ${values.effective} effective sets</strong>
              <p>${values.direct} direct · preferred ${values.min}–${values.max} · ${statusText}</p>
            </div>`;
          })
          .join("")}
      </div>
      <p><small>${escapeHtml(program.volumeMethod || "")}</small></p>
    </div>`;
}

function weeklyCoverageHtml(program) {
  const coverage = program?.weeklyCoverage;
  const entries = Object.entries(coverage?.groups || {});
  if (!entries.length) return "";

  return `
    <div class="card">
      <div class="summary-row">
        <div>
          <h2>Weekly muscle coverage</h2>
          <p>${escapeHtml(program.coverageMethod || "Direct exercise slots are distributed across the selected training week.")}</p>
        </div>
        <div class="metric"><strong>${coverage.totalExerciseSlots}</strong><span>weekly exercise slots</span></div>
      </div>
      ${coverage.capacityLimited ? '<div class="notice capacity-note"><strong>Lower direct-volume schedule</strong><p>This plan is still usable and every planned muscle receives coverage. Shorter or fewer sessions mean some muscles receive one direct exercise plus meaningful work from compound exercises. Add time or another day only if you want more direct work.</p></div>' : ""}
      ${coverage.availabilityShortfall ? `<div class="notice"><strong>Safe-candidate limit</strong><p>The active difficulty, equipment, goal and safety filters provide ${coverage.totalExerciseSlots} of ${coverage.requestedExerciseSlots} requested weekly slots. The planner leaves the remaining slots empty instead of exceeding your profile difficulty or repeating an exercise inside one workout.</p></div>` : ""}
      <div class="grid two coverage-grid">
        ${entries
          .map(([group, values]) => {
            const statusText =
              values.status === "below"
                ? "Below planned coverage"
                : values.status === "above"
                  ? "Above planned coverage"
                  : "Within planned coverage";
            return `<div class="coverage-item coverage-${values.status}">
              <div><strong>${escapeHtml(labelize(group))}</strong><span>${escapeHtml(statusText)}</span></div>
              <p>${values.exerciseSlots} direct exercise ${values.exerciseSlots === 1 ? "slot" : "slots"} · ${values.uniqueExercises} unique · ${values.sessions} ${values.sessions === 1 ? "day" : "days"}</p>
              <small>${values.directSets} direct sets · planned ${values.min}–${values.max} exercise slots</small>
            </div>`;
          })
          .join("")}
      </div>
    </div>`;
}

function performanceText(performance) {
  const sets = performance?.sets || [];
  if (!sets.length) return "No final weight or repetitions were recorded.";
  return `Last recorded: ${sets
    .map((set) => `${set.weight || "—"} kg × ${set.reps || "—"}${set.rir ? ` · RIR ${set.rir}` : ""}`)
    .join(", ")}`;
}

function prescriptionChangeText(changes) {
  if (!changes.length) return "Prescription unchanged";
  return changes
    .map((change) => {
      if (change.field === "rest") return `rest ${change.before}s → ${change.after}s`;
      return `${change.field} ${change.before} → ${change.after}`;
    })
    .join(" · ");
}

function programmeComparisonHtml(previousProgram, nextProgram) {
  if (
    !previousProgram ||
    !nextProgram ||
    nextProgram.predecessorProgramId !== previousProgram.id
  ) {
    return "";
  }

  const comparison = comparePrograms(previousProgram, nextProgram);
  const labels = {
    retained: { symbol: "✓", text: "Retained" },
    replaced: { symbol: "↔", text: "Replaced" },
    added: { symbol: "+", text: "Added" },
    removed: { symbol: "−", text: "Removed" },
  };

  return `
    <div class="card">
      <div class="summary-row">
        <div>
          <div class="eyebrow">Programme follow-up</div>
          <h2>Previous programme versus new recommendation</h2>
          <p>The recommender built a new programme from your current profile. Exact retained exercises carry their last recorded weight and repetitions into their first occurrence in the new programme; replacements start blank.</p>
        </div>
      </div>
      <div class="chips">
        <span class="chip">${comparison.summary.retained} retained</span>
        <span class="chip">${comparison.summary.replaced} replaced</span>
        <span class="chip">${comparison.summary.added} added</span>
        <span class="chip">${comparison.summary.removed} removed</span>
        <span class="chip">${comparison.summary.adjusted} prescriptions adjusted</span>
      </div>
      ${comparison.workouts
        .map(({ previousWorkout, nextWorkout: nextWorkoutItem, entries }) => {
          const workoutName = nextWorkoutItem?.name || previousWorkout?.name || "Workout";
          return `<div class="programme-workout">
            <h3>${escapeHtml(workoutName)}</h3>
            ${entries
              .map((entry) => {
                const label = labels[entry.status];
                const previousExercise = entry.previousItem
                  ? exerciseById(entry.previousItem.exerciseId)
                  : null;
                const nextExercise = entry.nextItem
                  ? exerciseById(entry.nextItem.exerciseId)
                  : null;
                const title =
                  entry.status === "retained"
                    ? nextExercise?.name || entry.nextItem.exerciseId
                    : entry.status === "replaced"
                      ? `${previousExercise?.name || entry.previousItem.exerciseId} → ${nextExercise?.name || entry.nextItem.exerciseId}`
                      : entry.status === "added"
                        ? nextExercise?.name || entry.nextItem.exerciseId
                        : previousExercise?.name || entry.previousItem.exerciseId;
                const group =
                  entry.nextItem?.requestedGroup ||
                  entry.nextItem?.targetGroup ||
                  entry.previousItem?.requestedGroup ||
                  entry.previousItem?.targetGroup ||
                  nextExercise?.app.group ||
                  previousExercise?.app.group ||
                  "";
                return `<div class="exercise-line">
                  <span class="number">${label.symbol}</span>
                  <div>
                    <strong>${escapeHtml(label.text)}: ${escapeHtml(title)}</strong>
                    <small>${escapeHtml(labelize(group))}${entry.changes.length ? ` · ${escapeHtml(prescriptionChangeText(entry.changes))}` : entry.status === "retained" ? ` · ${escapeHtml(prescriptionChangeText([]))}` : ""}</small>
                    ${entry.performance ? `<small>${escapeHtml(performanceText(entry.performance))}</small>` : ""}
                    ${entry.status === "replaced" && entry.performance ? "<small>Previous load is shown for reference only and is not transferred to the replacement.</small>" : ""}
                  </div>
                </div>`;
              })
              .join("")}
          </div>`;
        })
        .join("")}
    </div>`;
}

function draftRegenerationHtml(program) {
  const comparison = state.draftComparison;
  if (!comparison || comparison.toProgramId !== program?.id) return "";

  const exerciseChangeText = comparison.changedExerciseSlots
    ? `${comparison.changedExerciseSlots} exercise slot${comparison.changedExerciseSlots === 1 ? "" : "s"} changed.`
    : "The exercise selection stayed the same.";
  const prescriptionText = comparison.adjusted
    ? ` ${comparison.adjusted} prescription${comparison.adjusted === 1 ? " was" : "s were"} adjusted.`
    : " Prescriptions stayed the same.";

  return `
    <div class="notice" role="status">
      <strong>Compared with the recommendation you just replaced</strong>
      <p>${exerciseChangeText}${prescriptionText}</p>
      <div class="chips">
        <span class="chip">${comparison.retained} retained</span>
        <span class="chip">${comparison.replaced} replaced</span>
        <span class="chip">${comparison.added} added</span>
        <span class="chip">${comparison.removed} removed</span>
      </div>
    </div>`;
}

function generateDraftProgram(variation = 0, previousProgram = null) {
  const generated = generateProgram(exercises, state.profile, state, variation);
  return previousProgram
    ? linkProgramContinuation(generated, previousProgram)
    : generated;
}

function reconcileStoredProgramMetrics() {
  if (!state.profile || !exercises.length) return;

  if (state.draftProgram?.plannerVersion !== "3.3.0") {
    const previousDraft = state.draftProgram;
    const continuationSource =
      state.draftProgram?.predecessorProgramId === state.previousProgram?.id
        ? state.previousProgram
        : null;
    try {
      state.draftProgram = generateDraftProgram(
        state.draftProgram?.variation || 0,
        continuationSource,
      );
      state.draftComparison = null;
    } catch (error) {
      console.warn("The saved draft could not be upgraded automatically.", error);
      state.draftProgram = previousDraft;
      refreshProgramVolume(state.draftProgram, exercises, state.profile);
    }
  }

  if (state.activeProgram) {
    refreshProgramVolume(state.activeProgram, exercises, state.profile);
  }

  persist();
}

function applyReplacementMetadata(
  item,
  replacementId,
  replacementMeta,
  candidateComplexity,
  candidate = null,
) {
  item.exerciseId = replacementId;
  if (replacementMeta) {
    item.requestedGroup = replacementMeta.requestedGroup || item.requestedGroup || item.targetGroup;
    item.targetGroup = replacementMeta.targetGroup || item.targetGroup;
    item.targetRole = replacementMeta.targetRole || item.targetRole;
    item.groupMatch = replacementMeta.groupMatch || "exact";
    item.roleMatch = replacementMeta.roleMatch || "group";
  }
  if (Number.isFinite(Number(candidateComplexity))) {
    item.difficultyDelta = Number(candidateComplexity) - maxComplexity(state.profile.level);
  }
  if (candidate) {
    item.constraintNotes = (state.profile.constraints || [])
      .map((constraint) => {
        const assessment = candidate.app.compatibility?.[constraint];
        if (!assessment || assessment.status === "normal") return null;
        return {
          constraint,
          status: assessment.status,
          reason: assessment.reason,
          modification: assessment.modification,
          confidence: assessment.confidence,
        };
      })
      .filter(Boolean);
    item.setCredits = candidate.app.setCredits || { [candidate.app.group]: 1 };
    item.qualityConfidence = candidate.app.quality?.confidence || "unknown";
  }
}

function markDraftUpdated() {
  if (state.draftProgram) state.draftProgram.updatedAt = new Date().toISOString();
}

function renderOnboarding(edit = false) {
  const profile = state.profile || {
    name: "",
    goal: "hypertrophy",
    level: "starter",
    daysPerWeek: 3,
    sessionMinutes: 60,
    durationWeeks: 12,
    equipmentPreset: "machines",
    equipment: [],
    constraints: [],
    favorites: [],
    splitPreset: "full_body_rotation",
    workoutDays: defaultWorkoutDays(3, "full_body_rotation"),
  };

  let selectedDaysPerWeek = Math.min(6, Math.max(2, Number(profile.daysPerWeek) || 3));
  let selectedPreset = profile.splitPreset || getSplitPresets(selectedDaysPerWeek)[0].id;
  const profileStorage = state.preferences?.profileStorage || "browser";
  const deviceLabel = currentDeviceLabel();
  let selectedWorkoutDays = workoutDaysForProfile({
    ...profile,
    daysPerWeek: selectedDaysPerWeek,
  });
  let selectedTrainingWeekdays = normalizeTrainingWeekdays(
    profile.trainingWeekdays,
    selectedDaysPerWeek,
  );

  const presetOptions = () => {
    const presets = getSplitPresets(selectedDaysPerWeek);
    return `${presets
      .map(
        (preset) =>
          `<option value="${preset.id}" ${selectedPreset === preset.id ? "selected" : ""}>${escapeHtml(preset.label)}</option>`,
      )
      .join("")}<option value="custom" ${selectedPreset === "custom" ? "selected" : ""}>Custom structure</option>`;
  };

  $("#onboardingView").innerHTML = `
    <div class="hero">
      <div class="eyebrow">${edit ? "Update profile" : "First-time setup"}</div>
      <h1>${edit ? "Update your training profile" : "Build a programme that fits you"}</h1>
      <p>Choose the goal, schedule, weekly structure, equipment and safety constraints. Every training day can have its own type and muscle emphasis.</p>
      <button id="openHowItWorks" class="btn ghost small" type="button">How this app works</button>
    </div>
    <form id="profileForm" class="card grid">
      <ol class="profile-stepper" aria-label="Profile setup progress">
        <li><button type="button" data-profile-step-button="1" aria-current="step"><span>1</span>Goal</button></li>
        <li><button type="button" data-profile-step-button="2"><span>2</span>Schedule</button></li>
        <li><button type="button" data-profile-step-button="3"><span>3</span>Setup</button></li>
      </ol>

      <section class="profile-step" data-profile-step="1">
        <div class="eyebrow">Step 1 of 3</div>
        <h2 tabindex="-1">Your training direction</h2>
        <p>Start with the outcome and difficulty ceiling. You can compare every goal before choosing.</p>
        <div class="grid two profile-field-grid">
        <label class="field">Name<input name="name" value="${escapeHtml(profile.name)}" placeholder="Your name"></label>
        <div class="goal-field">
          <div class="field-label-row"><label for="goalSelect">Primary goal</label><button id="compareGoals" class="text-button" type="button">Compare all goals</button></div>
          <select id="goalSelect" name="goal">${Object.entries(GOALS)
            .map(([key, value]) => `<option value="${key}" ${profile.goal === key ? "selected" : ""}>${value.label}</option>`)
            .join("")}</select>
          <div id="selectedGoalGuidance">${goalGuidanceHtml(profile.goal, { compact: true })}</div>
        </div>
        <label class="field">Experience<select name="level">${Object.entries(LEVELS)
          .map(([key, value]) => `<option value="${key}" ${profile.level === key ? "selected" : ""}>${value}</option>`)
          .join("")}</select><small>This is a hard maximum difficulty. Simpler exercises remain valid.</small></label>
        </div>
      </section>

      <section class="profile-step" data-profile-step="2" hidden>
        <div class="eyebrow">Step 2 of 3</div>
        <h2 tabindex="-1">Your weekly schedule</h2>
        <p>Choose a practical weekly structure. Individual day controls stay optional.</p>
        <div class="grid two profile-field-grid">
        <label class="field">Training days per week<select name="daysPerWeek" id="daysPerWeekSelect">${[2, 3, 4, 5, 6]
          .map((number) => `<option value="${number}" ${selectedDaysPerWeek === number ? "selected" : ""}>${number}</option>`)
          .join("")}</select></label>
        <label class="field">Typical session<select name="sessionMinutes">${[30, 45, 60, 75]
          .map((number) => `<option value="${number}" ${profile.sessionMinutes == number ? "selected" : ""}>${number} minutes</option>`)
          .join("")}</select></label>
        <label class="field">Programme length<select name="durationWeeks">${[8, 10, 12, 16]
          .map((number) => `<option value="${number}" ${profile.durationWeeks == number ? "selected" : ""}>${number} weeks</option>`)
          .join("")}</select></label>
        </div>
        <fieldset class="profile-subsection">
          <legend>Preferred weekdays</legend>
          <p>Select ${selectedDaysPerWeek} days. This guides your calendar; missed days never skip the next workout.</p>
          <div id="weekdayPicker" class="weekday-picker"></div>
          <small id="weekdayScheduleNote">Training weeks advance after completed sessions, not automatically on Monday.</small>
        </fieldset>
        <fieldset class="profile-subsection">
          <legend>Weekly workout structure</legend>
          <label class="field">Starting split<select id="splitPresetSelect" name="splitPreset">${presetOptions()}</select></label>
          <div id="splitSummary" class="split-summary" aria-live="polite"></div>
          <details id="customizeWorkoutDays" class="day-customizer" ${selectedPreset === "custom" ? "open" : ""}>
            <summary>Customize individual workout days</summary>
            <p class="notice">Preset emphasis is only a recommendation priority. Changing a muscle selection turns on “Use only selected muscles” for that day.</p>
            <div id="workoutDayEditor" class="grid"></div>
          </details>
        </fieldset>
      </section>

      <section class="profile-step" data-profile-step="3" hidden>
        <div class="eyebrow">Step 3 of 3</div>
        <h2 tabindex="-1">Equipment, safety and saving</h2>
        <p>Finish with the environment and safety filters that apply to you.</p>
        <fieldset class="profile-subsection">
        <legend>Training environment</legend>
        <div class="option-grid">${Object.entries(EQUIPMENT_PRESETS)
          .map(
            ([key, value]) => `<label class="option"><input type="radio" name="equipmentPreset" value="${key}" ${profile.equipmentPreset === key ? "checked" : ""}><span>${value.label}</span></label>`,
          )
          .join("")}</div>
      </fieldset>
        <fieldset id="customEquipment" class="profile-subsection ${profile.equipmentPreset === "custom" ? "" : "hidden"}">
        <legend>Custom equipment</legend>
        <div class="option-grid">${COMMON_EQUIPMENT.map(
          (item) => `<label class="option"><input type="checkbox" name="equipment" value="${item}" ${(profile.equipment || []).includes(item) ? "checked" : ""}><span>${labelize(item)}</span></label>`,
        ).join("")}</div>
      </fieldset>
        <fieldset class="profile-subsection">
        <legend>Pain and movement constraints</legend>
        <p class="notice">These are conservative software filters, not medical clearance. Stop any exercise that increases symptoms.</p>
        <div class="option-grid">${Object.entries(CONSTRAINTS)
          .map(
            ([key, value]) => `<label class="option"><input type="checkbox" name="constraints" value="${key}" ${(profile.constraints || []).includes(key) ? "checked" : ""}><span>${value}</span></label>`,
          )
          .join("")}</div>
      </fieldset>
        <fieldset class="profile-subsection">
        <legend>Where should your profile be saved?</legend>
        <div class="option-grid storage-options">
          <label class="option">
            <input type="radio" name="profileStorage" value="browser" ${profileStorage === "browser" ? "checked" : ""}>
            <span><strong>This browser only</strong><small>Keep the live profile in this browser on ${deviceLabel}.</small></span>
          </label>
          <label class="option">
            <input type="radio" name="profileStorage" value="browser_and_backup" ${profileStorage === "browser_and_backup" ? "checked" : ""}>
            <span><strong>This browser + backup file</strong><small>Also choose a file location on supported computers, or download it on mobile.</small></span>
          </label>
        </div>
        <p class="notice">There is no account or cloud sync. Clearing this browser's site data removes the live copy. A backup file can be imported on another phone or computer.</p>
        </fieldset>
      </section>

      <div class="actions profile-step-actions">
        <button id="previousProfileStep" class="btn ghost" type="button" hidden>Back</button>
        <button id="nextProfileStep" class="btn primary" type="button">Continue</button>
        <button id="submitProfile" class="btn primary" type="submit" hidden>${edit ? "Save and rebuild recommendation" : "Build my programme"}</button>
        ${edit ? '<button id="cancelProfile" class="btn ghost" type="button">Cancel</button>' : ""}
      </div>
    </form>`;

  let activeProfileStep = 1;

  function showProfileStep(step, { focus = false } = {}) {
    activeProfileStep = Math.min(3, Math.max(1, Number(step) || 1));
    $$('[data-profile-step]').forEach((section) => {
      section.hidden = Number(section.dataset.profileStep) !== activeProfileStep;
    });
    $$('[data-profile-step-button]').forEach((button) => {
      const active = Number(button.dataset.profileStepButton) === activeProfileStep;
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    $("#previousProfileStep").hidden = activeProfileStep === 1;
    $("#nextProfileStep").hidden = activeProfileStep === 3;
    $("#submitProfile").hidden = activeProfileStep !== 3;
    if (focus) $(`[data-profile-step="${activeProfileStep}"] h2`)?.focus();
  }

  function markStructureCustom() {
    selectedPreset = "custom";
    $("#splitPresetSelect").value = "custom";
  }

  function renderSplitSummary() {
    $("#splitSummary").innerHTML = selectedWorkoutDays
      .map(
        (day, index) => `<div><strong>Day ${index + 1}: ${escapeHtml(day.name)}</strong><span>${escapeHtml(WORKOUT_TYPES[day.type]?.label || "Full Body")}${day.emphasis?.length ? ` · preset emphasis: ${day.emphasis.map(labelize).join(", ")}` : " · balanced emphasis"}</span></div>`,
      )
      .join("");
  }

  function renderWeekdayPicker() {
    const selected = new Set(selectedTrainingWeekdays);
    $("#weekdayPicker").innerHTML = WEEKDAYS.map(
      (day) => `<label class="option"><input type="checkbox" name="trainingWeekdays" value="${day.value}" ${selected.has(day.value) ? "checked" : ""}><span>${day.short}</span></label>`,
    ).join("");
    $("#weekdayScheduleNote").textContent = `${weekdaySummary(selectedTrainingWeekdays)} selected. Training weeks advance after ${selectedDaysPerWeek} completed sessions, not automatically on Monday.`;

    $$('#weekdayPicker input[name="trainingWeekdays"]').forEach((checkbox) => {
      checkbox.onchange = (event) => {
        const value = Number(event.target.value);
        const current = new Set(selectedTrainingWeekdays);
        if (event.target.checked && current.size >= selectedDaysPerWeek) {
          event.target.checked = false;
          alert(`Choose exactly ${selectedDaysPerWeek} preferred weekdays.`);
          return;
        }
        if (event.target.checked) current.add(value);
        else current.delete(value);
        selectedTrainingWeekdays = [...current];
        $("#weekdayScheduleNote").textContent = `${weekdaySummary(selectedTrainingWeekdays) || "No days"} selected (${selectedTrainingWeekdays.length}/${selectedDaysPerWeek}). Training weeks advance only after completed sessions.`;
      };
    });
  }

  function renderWorkoutDayEditor() {
    $("#workoutDayEditor").innerHTML = selectedWorkoutDays
      .map(
        (day, index) => `
          <article class="card workout-day-card">
            <div class="eyebrow">Day ${index + 1}</div>
            <div class="grid two">
              <label class="field">Day name
                <input data-day-index="${index}" data-day-field="name" value="${escapeHtml(day.name)}" placeholder="Day ${index + 1}">
              </label>
              <label class="field">Workout type
                <select data-day-index="${index}" data-day-field="type">
                  ${Object.entries(WORKOUT_TYPES)
                    .map(
                      ([key, config]) => `<option value="${key}" ${day.type === key ? "selected" : ""}>${escapeHtml(config.label)}</option>`,
                    )
                    .join("")}
                </select>
              </label>
            </div>
            <fieldset>
              <legend>Muscle selection</legend>
              <div class="option-grid">
                ${MUSCLE_FOCUS_OPTIONS.map(
                  (option) => `<label class="option"><input type="checkbox" data-day-index="${index}" data-focus-value="${option.value}" ${(day.emphasis || []).includes(option.value) ? "checked" : ""}><span>${option.label}</span></label>`,
                ).join("")}
              </div>
              <label class="option" style="margin-top:12px">
                <input type="checkbox" data-day-index="${index}" data-strict-focus ${day.strictFocus || day.type === "custom" ? "checked" : ""}>
                <span>Use only selected muscles in this workout</span>
              </label>
              <p class="notice">Enabled: every recommendation and substitute stays inside the selected groups. Disabled: the workout type keeps its broader structure and these muscles receive extra emphasis.</p>
            </fieldset>
          </article>`,
      )
      .join("");

    renderSplitSummary();

    $$('[data-day-field="name"]').forEach((input) => {
      input.addEventListener("input", (event) => {
        selectedWorkoutDays[Number(event.target.dataset.dayIndex)].name = event.target.value;
        markStructureCustom();
        renderSplitSummary();
      });
    });

    $$('[data-day-field="type"]').forEach((select) => {
      select.addEventListener("change", (event) => {
        const day = selectedWorkoutDays[Number(event.target.dataset.dayIndex)];
        day.type = event.target.value;
        if (day.type === "custom") day.strictFocus = true;
        markStructureCustom();
        renderWorkoutDayEditor();
      });
    });

    $$('[data-focus-value]').forEach((checkbox) => {
      checkbox.addEventListener("change", (event) => {
        const day = selectedWorkoutDays[Number(event.target.dataset.dayIndex)];
        const value = event.target.dataset.focusValue;
        const current = new Set(day.emphasis || []);

        if (event.target.checked && current.size >= 3 && !current.has(value)) {
          event.target.checked = false;
          alert("Choose a maximum of three priority muscle groups for each workout day.");
          return;
        }

        if (event.target.checked) current.add(value);
        else current.delete(value);
        day.emphasis = [...current];
        day.strictFocus = true;
        const strictToggle = $(`[data-strict-focus][data-day-index="${event.target.dataset.dayIndex}"]`);
        if (strictToggle) strictToggle.checked = true;
        markStructureCustom();
        renderSplitSummary();
      });
    });

    $$('[data-strict-focus]').forEach((checkbox) => {
      checkbox.addEventListener("change", (event) => {
        const day = selectedWorkoutDays[Number(event.target.dataset.dayIndex)];
        day.strictFocus = event.target.checked;
        if (day.type === "custom" && !day.strictFocus) {
          day.type = "full_body";
          renderWorkoutDayEditor();
        }
        markStructureCustom();
        renderSplitSummary();
      });
    });
  }

  renderWorkoutDayEditor();
  renderWeekdayPicker();
  showProfileStep(1);

  $$('[data-profile-step-button]').forEach((button) => {
    button.onclick = () => showProfileStep(button.dataset.profileStepButton, { focus: true });
  });
  $("#previousProfileStep").onclick = () => showProfileStep(activeProfileStep - 1, { focus: true });
  $("#nextProfileStep").onclick = () => showProfileStep(activeProfileStep + 1, { focus: true });

  const goalSelect = $("#goalSelect");
  goalSelect.addEventListener("change", () => {
    $("#selectedGoalGuidance").innerHTML = goalGuidanceHtml(goalSelect.value, { compact: true });
  });
  $("#openHowItWorks").onclick = () => openGuide("how", { allowGoalSelection: true });
  $("#compareGoals").onclick = () => openGuide("goals", { allowGoalSelection: true });

  $("#daysPerWeekSelect").addEventListener("change", (event) => {
    selectedDaysPerWeek = Number(event.target.value);
    const firstPreset = getSplitPresets(selectedDaysPerWeek)[0];
    selectedPreset = firstPreset.id;
    selectedWorkoutDays = defaultWorkoutDays(selectedDaysPerWeek, selectedPreset);
    selectedTrainingWeekdays = defaultTrainingWeekdays(selectedDaysPerWeek);
    $("#splitPresetSelect").innerHTML = presetOptions();
    renderWorkoutDayEditor();
    renderWeekdayPicker();
  });

  $("#splitPresetSelect").addEventListener("change", (event) => {
    selectedPreset = event.target.value;
    if (selectedPreset !== "custom") {
      selectedWorkoutDays = defaultWorkoutDays(selectedDaysPerWeek, selectedPreset);
      renderWorkoutDayEditor();
    }
  });

  $("#profileForm").addEventListener("change", (event) => {
    if (event.target.name === "equipmentPreset") {
      $("#customEquipment").classList.toggle("hidden", event.target.value !== "custom");
    }
  });

  $("#profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const workoutDays = selectedWorkoutDays.map((day, index) => ({
      name: String(day.name || "").trim() || `Day ${index + 1}`,
      type: WORKOUT_TYPES[day.type] ? day.type : "full_body",
      emphasis: [...new Set(day.emphasis || [])].slice(0, 3),
      strictFocus: Boolean(day.strictFocus || day.type === "custom"),
    }));

    const invalidStrictDay = workoutDays.find(
      (day) => day.strictFocus && !day.emphasis.length,
    );
    if (invalidStrictDay) {
      alert(`Workout “${invalidStrictDay.name}” needs at least one selected muscle group.`);
      return;
    }
    if (selectedTrainingWeekdays.length !== selectedDaysPerWeek) {
      alert(`Choose exactly ${selectedDaysPerWeek} preferred weekdays.`);
      showProfileStep(2, { focus: true });
      return;
    }

    state.profile = {
      ...profile,
      name: String(form.get("name") || "").trim(),
      goal: String(form.get("goal")),
      level: String(form.get("level")),
      daysPerWeek: selectedDaysPerWeek,
      sessionMinutes: Number(form.get("sessionMinutes")),
      durationWeeks: Number(form.get("durationWeeks")),
      equipmentPreset: String(form.get("equipmentPreset")),
      equipment: form.getAll("equipment").map(String),
      constraints: form.getAll("constraints").map(String),
      favorites: profile.favorites || [],
      splitPreset: selectedPreset,
      workoutDays,
      trainingWeekdays: selectedTrainingWeekdays,
    };
    const selectedStorage = String(form.get("profileStorage") || "browser");
    state.preferences = {
      ...state.preferences,
      profileStorage: selectedStorage,
    };

    try {
      const continuationSource = state.activeProgram ? null : state.previousProgram;
      state.draftProgram = generateDraftProgram(0, continuationSource);
      state.draftComparison = null;
      if (edit) state.activeProgram = null;
      state.activeSession = null;
      persist();
    } catch (error) {
      alert(error.message);
      return;
    }

    let confirmation = `Profile saved in this browser on ${deviceLabel}.`;
    if (selectedStorage === "browser_and_backup") {
      try {
        const backup = await exportState(state, { chooseLocation: true });
        if (backup) {
          state.preferences = {
            ...state.preferences,
            lastBackupAt: new Date().toISOString(),
            lastBackupFileName: backup.fileName,
            lastBackupLocation: backup.location,
          };
          persist();
          confirmation = `${confirmation} ${backupMessage(backup)}`;
        } else {
          confirmation = `${confirmation} Backup creation was cancelled.`;
        }
      } catch (error) {
        console.error(error);
        confirmation = `${confirmation} The backup file could not be created.`;
      }
    }

    renderPlanner();
    view("plannerView");
    toast(confirmation);
  });

  $("#cancelProfile")?.addEventListener("click", () => {
    if (state.activeProgram) {
      renderProfile();
      view("profileView");
    } else if (state.draftProgram) {
      renderPlanner();
      view("plannerView");
    } else {
      renderToday();
      view("todayView");
    }
  });
}

function workoutHtml(workout, { editable = false, scope = "view" } = {}) {
  return `
    <div class="programme-workout">
      <div class="summary-row">
        <div>
          <h3>${escapeHtml(workout.name)}</h3>
          <p>${workout.exercises.length} exercises · approximately ${state.profile.sessionMinutes} minutes${workout.emphasis?.length ? ` · ${workout.strictFocus ? "muscles" : "focus"}: ${workout.emphasis.map(labelize).join(", ")}` : ""}</p>
          ${workoutMuscleChipsHtml(workout)}
          ${workout.availabilityShortfall ? `<p class="constraint-note">${workout.exercises.length} of ${workout.requestedExerciseCount} requested slots filled. Current filters contain no additional safe, distinct match.</p>` : ""}
        </div>
      </div>
      ${workout.exercises
        .map((item, index) => {
          const exercise = exerciseById(item.exerciseId);
          return `
            <div class="exercise-line">
              <span class="number">${index + 1}</span>
              <div>
                <strong>${escapeHtml(exercise?.name || item.exerciseId)}</strong>
                <small>${labelize(exercise?.app.group)} · ${labelize(exercise?.equipment)} · ${item.sets} × ${item.reps}</small>
                ${item.targetRole ? `<small>Training role: ${escapeHtml(trainingRoleText(item))}${item.roleMatch && item.roleMatch !== "exact" ? ` · ${escapeHtml(roleCoverageText(item))}` : ""}</small>` : ""}
                ${item.groupMatch === "companion" ? `<small>Same-day coverage: ${escapeHtml(groupCoverageText(item))}</small>` : ""}
                <small class="complexity-meta">${escapeHtml(complexityText(exercise))}${item.difficultyDelta ? ` · ${escapeHtml(difficultyFallbackText(item))}` : ""}${item.qualityConfidence ? ` · enrichment ${escapeHtml(item.qualityConfidence)}` : ""}</small>
                ${constraintNotesHtml(item, true)}
              </div>
              <div class="exercise-line-actions">
                <button class="btn small ghost inspect-exercise" data-id="${item.exerciseId}">View</button>
                ${
                  editable
                    ? `<button class="btn small substitute-exercise" data-scope="${scope}" data-workout-id="${workout.id}" data-index="${index}">Substitute</button>`
                    : ""
                }
              </div>
            </div>`;
        })
        .join("")}
    </div>`;
}

function bindWorkoutActions() {
  $$(".inspect-exercise").forEach((button) => {
    button.addEventListener("click", () => openExercise(button.dataset.id));
  });
  $$(".substitute-exercise").forEach((button) => {
    button.addEventListener("click", () =>
      openReplacementPicker({
        scope: button.dataset.scope,
        workoutId: button.dataset.workoutId,
        itemIndex: Number(button.dataset.index),
      }),
    );
  });
}

function renderPlanner() {
  let program = state.draftProgram;
  if (!program) {
    state.draftProgram = generateDraftProgram(0, state.previousProgram);
    state.draftComparison = null;
    persist();
    program = state.draftProgram;
  }
  const issueCount = program.workouts
    .flatMap((workout) => workout.exercises)
    .filter(
      (item) =>
        item.groupMatch === "companion" ||
        ![null, undefined, "exact"].includes(item.roleMatch) ||
        item.difficultyDelta ||
        item.constraintNotes?.some((note) => note.status === "caution"),
    ).length;

  $("#plannerView").innerHTML = `
    <div class="hero">
      <div class="eyebrow">Programme recommendation</div>
      <h1>${escapeHtml(program.title)}</h1>
      <p>${activeGoal().summary}</p>
      <div class="chips">
        <span class="chip">${program.daysPerWeek} days/week</span>
        <span class="chip">${program.sessionMinutes} min/session</span>
        <span class="chip">${program.splitName}</span>
        <span class="chip">${profileComplexityText()}</span>
      </div>
    </div>
    <div class="planner-tabs" role="tablist" aria-label="Recommendation review sections">
      <button type="button" role="tab" data-planner-tab="overview" aria-selected="true">Overview</button>
      <button type="button" role="tab" data-planner-tab="week" aria-selected="false">Weekly plan</button>
      <button type="button" role="tab" data-planner-tab="analysis" aria-selected="false">Analysis</button>
    </div>

    <section class="planner-panel" data-planner-panel="overview" role="tabpanel">
      <div class="card saved-draft-card">
        <div>
          <div class="eyebrow">Saved automatically</div>
          <h2>Your recommendation will still be here</h2>
          <p>You do not have to accept it now. You can leave, reopen the app, and continue reviewing this same draft.</p>
        </div>
        <button id="continueLater" class="btn ghost">Continue later</button>
      </div>
      ${draftRegenerationHtml(program)}
      ${programmeComparisonHtml(state.previousProgram, program)}
      <div class="card">
        <h2>Why this fits</h2>
        <p>The routine first balances muscles across your selected week, then chooses goal-, equipment-, difficulty- and safety-compatible exercises. Your experience ceiling is never exceeded automatically.</p>
        ${program.structureNote ? `<div class="notice"><strong>Goal-aware structure</strong><p>${escapeHtml(program.structureNote)}</p></div>` : ""}
        <div class="notice"><strong>Progression:</strong> ${escapeHtml(program.progression)}</div>
      </div>
    </section>

    <section class="planner-panel" data-planner-panel="week" role="tabpanel" hidden>
      <div class="card">
        <div class="summary-row">
          <div>
            <h2>Weekly routine</h2>
            <p>Open each day to review exercises. Substitutions remain inside your profile limits.</p>
          </div>
          ${issueCount ? `<button id="reviewPlannerIssues" class="btn small" type="button">Review ${issueCount} fallback${issueCount === 1 ? "" : "s"}</button>` : ""}
        </div>
        <div class="planner-workout-list">
          ${program.workouts
            .map((workout, index) => {
              const hasIssues = workout.exercises.some(
                (item) =>
                  item.groupMatch === "companion" ||
                  ![null, undefined, "exact"].includes(item.roleMatch) ||
                  item.difficultyDelta ||
                  item.constraintNotes?.some((note) => note.status === "caution"),
              );
              return `<details class="planner-workout" data-has-issues="${hasIssues}" ${index === 0 ? "open" : ""}>
                <summary><span><strong>${escapeHtml(workout.name)}</strong><small>${workout.exercises.length} exercises · about ${program.sessionMinutes} minutes</small></span><div>${workoutMuscleChipsHtml(workout)}</div></summary>
                ${workoutHtml(workout, { editable: true, scope: "draft" })}
              </details>`;
            })
            .join("")}
        </div>
      </div>
    </section>

    <section class="planner-panel" data-planner-panel="analysis" role="tabpanel" hidden>
      <div class="notice analysis-explainer"><strong>How to read this</strong><p>A direct slot is an exercise mainly targeting that muscle. Effective sets also give partial credit when a compound exercise trains it meaningfully.</p></div>
      ${weeklyCoverageHtml(program)}
      ${weeklyVolumeHtml(program)}
    </section>

    <div class="planner-actions">
      <button id="acceptProgram" class="btn primary">Accept programme</button>
      <button id="anotherProgram" class="btn">Generate another</button>
      <button id="adjustProfile" class="btn ghost">Adjust profile</button>
    </div>
    `;

  function showPlannerPanel(panelName) {
    $$('[data-planner-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.plannerPanel !== panelName;
    });
    $$('[data-planner-tab]').forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.plannerTab === panelName));
    });
  }

  $$('[data-planner-tab]').forEach((button) => {
    button.onclick = () => showPlannerPanel(button.dataset.plannerTab);
  });

  bindWorkoutActions();
  $("#reviewPlannerIssues")?.addEventListener("click", () => {
    $$(".planner-workout").forEach((details) => {
      details.open = details.dataset.hasIssues === "true";
    });
    $(".planner-workout[data-has-issues='true']")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#acceptProgram").onclick = () => {
    state.activeProgram = acceptProgram(program);
    state.draftProgram = null;
    state.draftComparison = null;
    persist();
    renderAll();
    view("todayView");
    toast("Programme accepted. Your routine is now active.");
  };
  $("#anotherProgram").onclick = () => {
    const continuationSource =
      program.predecessorProgramId === state.previousProgram?.id
        ? state.previousProgram
        : null;
    const nextDraft = generateDraftProgram(
      (program.variation || 0) + 1,
      continuationSource,
    );
    state.draftProgram = nextDraft;
    state.draftComparison = summarizeProgramChanges(program, nextDraft);
    persist();
    renderPlanner();
  };
  $("#adjustProfile").onclick = () => {
    renderOnboarding(true);
    view("onboardingView");
  };
  $("#continueLater").onclick = () => {
    renderAll();
    view("todayView");
    toast("Draft saved. Open Today to continue the recommendation.");
  };
}

function renderToday() {
  if (!state.activeProgram) {
    const draft = state.draftProgram;
    const followUp = draft?.predecessorProgramId === state.previousProgram?.id;
    $("#todayView").innerHTML = `
      <div class="hero">
        <div class="eyebrow">Today</div>
        <h1>Your programme is not active yet</h1>
        <p>${draft ? followUp ? "Your completed programme and next recommendation are ready to compare." : "Your saved recommendation is ready to continue." : "Build a recommendation before starting workouts."}</p>
      </div>
      <article class="card today-card">
        <div class="summary-row">
          <div>
            <div class="eyebrow">${draft ? followUp ? "Programme follow-up" : "Saved draft" : "No recommendation"}</div>
            <h2>${draft ? escapeHtml(draft.title) : "Create your programme"}</h2>
            <p>${draft ? `${draft.daysPerWeek} days/week · ${draft.splitName} · ${profileComplexityText()}` : "Your profile will be used to create a multi-week routine."}</p>
          </div>
        </div>
        <div class="actions">
          <button id="continueDraft" class="btn primary">${draft ? "Continue recommendation" : "Build recommendation"}</button>
          ${draft ? '<button id="newDraft" class="btn">Generate another</button>' : ""}
          <button id="editDraftProfile" class="btn ghost">Adjust profile</button>
        </div>
      </article>`;

    $("#continueDraft").onclick = () => {
      if (!state.draftProgram) {
        state.draftProgram = generateDraftProgram(0, state.previousProgram);
        state.draftComparison = null;
        persist();
      }
      renderPlanner();
      view("plannerView");
    };
    $("#newDraft")?.addEventListener("click", () => {
      const previousDraft = state.draftProgram;
      const variation = (state.draftProgram?.variation || 0) + 1;
      const continuationSource =
        state.draftProgram?.predecessorProgramId === state.previousProgram?.id
          ? state.previousProgram
          : null;
      const nextDraft = generateDraftProgram(variation, continuationSource);
      state.draftProgram = nextDraft;
      state.draftComparison = summarizeProgramChanges(previousDraft, nextDraft);
      persist();
      renderPlanner();
      view("plannerView");
    });
    $("#editDraftProfile").onclick = () => {
      renderOnboarding(true);
      view("onboardingView");
    };
    return;
  }

  const program = state.activeProgram;
  const workout = nextWorkout(program);
  const week = currentWeek(program);
  const totalSessions = program.durationWeeks * program.daysPerWeek;
  const completedSessions = program.completedSessions || 0;
  const percent = Math.min(100, (completedSessions / totalSessions) * 100);
  const trainingWeekdays = normalizeTrainingWeekdays(
    state.profile.trainingWeekdays,
    program.daysPerWeek,
  );
  const todaySchedule = scheduleStatus(trainingWeekdays);
  const completedThisWeek = completedSessions % program.daysPerWeek;
  const remainingSessions = Math.max(0, totalSessions - completedSessions);
  const latestSession = latestRecordedSession(state.history);
  const latestMetrics = latestSession ? sessionMetrics(latestSession) : null;
  const readinessDate = new Date().toISOString().slice(0, 10);
  const savedReadiness =
    state.preferences.readinessCheck?.date === readinessDate
      ? state.preferences.readinessCheck.value
      : null;

  function readinessHtml(value) {
    const option = READINESS_GUIDANCE[value];
    return option
      ? `<div id="readinessGuidance" class="notice" role="status"><strong>${escapeHtml(option.label)}</strong><p>${escapeHtml(option.guidance)}</p></div>`
      : '<div id="readinessGuidance" class="notice subtle" role="status"><p>Select how you feel for optional adjustments. This does not change or advance your programme.</p></div>';
  }

  function lastSessionHtml() {
    if (!latestSession) {
      return '<div class="card"><h2>Last workout</h2><p>No workout has been recorded yet. Your first completed or partial session will appear here.</p></div>';
    }
    const loggedExercises = (latestSession.exercises || [])
      .map((item) => {
        const performed = (item.setsLog || [])
          .filter((set) => set.done)
          .map((set) => `${set.weight || "—"} kg × ${set.reps || "—"}`)
          .join(", ");
        if (!performed) return "";
        return `<li><strong>${escapeHtml(exerciseById(item.exerciseId)?.name || item.exerciseId)}</strong><span>${escapeHtml(performed)}</span></li>`;
      })
      .filter(Boolean)
      .slice(0, 4)
      .join("");
    const status = latestSession.status === "partial" ? "Partial workout" : "Completed workout";
    return `<div class="card last-session-card">
      <div class="summary-row">
        <div>
          <div class="eyebrow">Last recorded workout</div>
          <h2>${escapeHtml(latestSession.workoutName || "Workout")}</h2>
          <p>${escapeHtml(status)} · ${new Date(latestSession.completedAt).toLocaleDateString()} · ${latestMetrics.completedSets}/${latestMetrics.totalSets} sets completed</p>
        </div>
        <div class="metric"><strong>${latestMetrics.volume.toLocaleString()}</strong><span>kg-rep volume</span></div>
      </div>
      ${loggedExercises ? `<ul class="performance-list">${loggedExercises}</ul>` : "<p>No completed set values were recorded.</p>"}
    </div>`;
  }

  $("#todayView").innerHTML = `
    <div class="hero">
      <div class="eyebrow">Today</div>
      <h1>${state.profile.name ? `${escapeHtml(state.profile.name)}, ` : ""}${state.activeSession ? "resume your workout" : "your next session is ready"}</h1>
      <p>Your accepted programme remains stable. Change individual exercises only when needed.</p>
    </div>
    <article class="card today-card">
      <div class="summary-row">
        <div>
          <div class="eyebrow">Training week ${week} of ${program.durationWeeks} · ${escapeHtml(todaySchedule.label)}</div>
          <h2>${escapeHtml(state.activeSession?.workoutName || workout.name)}</h2>
          <p>${workout.exercises.length} exercises · approximately ${program.sessionMinutes} minutes</p>
          <small>Preferred days: ${weekdaySummary(trainingWeekdays)}. Missed calendar days do not skip this workout.</small>
          ${workoutMuscleChipsHtml(workout)}
        </div>
        <div class="metric"><strong>${completedSessions}/${totalSessions}</strong><span>sessions</span></div>
      </div>
      <div class="progress-track"><span style="width:${percent}%"></span></div>
      <div class="chips programme-context">
        <span class="chip">This training week: ${completedThisWeek}/${program.daysPerWeek} complete</span>
        <span class="chip">Programme: ${remainingSessions} session${remainingSessions === 1 ? "" : "s"} remaining</span>
      </div>
      <div class="actions">
        <button id="startSession" class="btn primary">${state.activeSession ? "Resume workout" : "Start workout"}</button>
        <button id="previewRoutine" class="btn">View routine</button>
      </div>
    </article>
    <div class="card readiness-card">
      <h2>Quick readiness check</h2>
      <p>How do you feel before this workout?</p>
      <div class="readiness-options" role="group" aria-label="Readiness before this workout">
        ${Object.entries(READINESS_GUIDANCE)
          .map(([value, option]) => `<button type="button" class="btn small" data-readiness="${value}" aria-pressed="${savedReadiness === value}">${escapeHtml(option.label)}</button>`)
          .join("")}
      </div>
      ${readinessHtml(savedReadiness)}
    </div>
    ${lastSessionHtml()}
    <div class="card">
      <h2>Programme rules</h2>
      <p>${escapeHtml(program.progression)}</p>
      <div class="chips">${program.reviewWeeks.map((reviewWeek) => `<span class="chip">Review week ${reviewWeek}</span>`).join("")}</div>
    </div>`;

  $("#startSession").onclick = () => {
    if (!state.activeSession) createSession();
    renderSession();
    view("sessionView");
  };
  $("#previewRoutine").onclick = () => {
    renderRoutine();
    view("routineView");
  };
  $$('[data-readiness]').forEach((button) => {
    button.onclick = () => {
      const value = button.dataset.readiness;
      state.preferences.readinessCheck = { date: readinessDate, value };
      persist();
      $$('[data-readiness]').forEach((option) => {
        option.setAttribute("aria-pressed", String(option.dataset.readiness === value));
      });
      $("#readinessGuidance").outerHTML = readinessHtml(value);
    };
  });
}

function createSession() {
  const workout = nextWorkout(state.activeProgram);
  state.activeSession = {
    id: `session-${Date.now()}`,
    programId: state.activeProgram.id,
    workoutId: workout.id,
    workoutName: workout.name,
    startedAt: new Date().toISOString(),
    currentIndex: 0,
    allowedGroups: workout.allowedGroups || workout.emphasis || [],
    exercises: workout.exercises.map((item) => {
      const alreadyPerformed = state.history.some(
        (session) =>
          session.programId === state.activeProgram.id &&
          session.exercises?.some(
            (entry) =>
              entry.exerciseId === item.exerciseId &&
              entry.setsLog?.some((set) => set.done),
          ),
      );
      const carriedSets = alreadyPerformed
        ? null
        : carriedForwardSets(
            state.activeProgram,
            state.previousProgram,
            item,
          );
      return {
        ...item,
        carriedFromPrevious: Boolean(carriedSets),
        setsLog:
          carriedSets ||
          Array.from({ length: item.sets }, (_, index) => ({
            set: index + 1,
            weight: "",
            reps: "",
            rir: "",
            done: false,
          })),
      };
    }),
  };
  persist();
}

function previousPerformance(exerciseId) {
  for (const session of [...state.history].reverse()) {
    const item = session.exercises?.find((exercise) => exercise.exerciseId === exerciseId);
    if (item) {
      return (
        item.setsLog
          ?.filter((set) => set.done)
          .map((set) => `${set.weight || "—"} × ${set.reps || "—"}`)
          .join(", ") || "No completed sets logged"
      );
    }
  }
  const stored = state.previousProgram?.performanceByExercise?.[exerciseId];
  if (stored?.sets?.length) {
    return stored.sets
      .map((set) => `${set.weight || "—"} × ${set.reps || "—"}`)
      .join(", ");
  }
  return "No previous logged sets";
}

function renderSession() {
  const session = state.activeSession;
  if (!session) {
    renderToday();
    view("todayView");
    return;
  }

  const item = session.exercises[session.currentIndex];
  const exercise = exerciseById(item.exerciseId);
  const completedSets = session.exercises.flatMap((entry) => entry.setsLog).filter((set) => set.done).length;
  const totalSets = session.exercises.flatMap((entry) => entry.setsLog).length;

  $("#sessionView").innerHTML = `
    <div class="exercise-stage">
      <div class="summary-row">
        <div>
          <div class="eyebrow">${escapeHtml(session.workoutName)} · Exercise ${session.currentIndex + 1}/${session.exercises.length}</div>
          <h1>${escapeHtml(exercise.name)}</h1>
        </div>
        <button id="exitSession" class="btn ghost small">Exit</button>
      </div>
      <div class="progress-track"><span style="width:${(completedSets / totalSets) * 100}%"></span></div>
      <article class="card" style="margin-top:14px">
        <img id="sessionMedia" class="exercise-media" src="${mediaUrl(exercise.image)}" alt="${escapeHtml(exercise.name)}">
        <div class="exercise-title-row">
          <div>
            <h2>${escapeHtml(exercise.name)}</h2>
            <p>${labelize(exercise.app.group)} · ${labelize(exercise.equipment)} · target: ${escapeHtml(exercise.target)}</p>
          </div>
          <button id="toggleMedia" class="btn small">Show animation</button>
        </div>
        <div class="chips">
          <span class="chip">${item.sets} sets</span>
          <span class="chip">${item.reps}</span>
          <span class="chip">${item.restSeconds}s rest</span>
          ${item.targetRole ? `<span class="chip">${escapeHtml(trainingRoleText(item))}${item.roleMatch && item.roleMatch !== "exact" ? ` · ${escapeHtml(roleCoverageText(item))}` : ""}</span>` : ""}
          ${item.groupMatch === "companion" ? `<span class="chip">${escapeHtml(groupCoverageText(item))}</span>` : ""}
          <span class="chip complexity-chip">${escapeHtml(complexityText(exercise))}${item.difficultyDelta ? ` · ${escapeHtml(difficultyFallbackText(item))}` : ""}</span>
        </div>
        ${constraintNotesHtml(item)}
        <p><strong>Previous:</strong> ${escapeHtml(previousPerformance(exercise.id))}</p>
        ${item.carriedFromPrevious ? '<div class="notice"><strong>Carried forward</strong><p>The last recorded weight, repetitions and RIR are prefilled below. Edit them to match what you actually complete today.</p></div>' : ""}
        <details><summary>How to perform it</summary><ol class="instructions">${instructionSteps(exercise)
          .map((step) => `<li>${escapeHtml(step)}</li>`)
          .join("")}</ol></details>
      </article>
      <article class="card">
        <h2>Record sets</h2>
        <div class="set-table">${item.setsLog
          .map(
            (set, index) => `<div class="set-row ${set.done ? "done" : ""}" data-set="${index}">
              <strong>${index + 1}</strong>
              <input data-field="weight" value="${escapeHtml(set.weight)}" inputmode="decimal" placeholder="kg">
              <input data-field="reps" value="${escapeHtml(set.reps)}" inputmode="numeric" placeholder="reps">
              <input class="rir-field" data-field="rir" value="${escapeHtml(set.rir)}" inputmode="numeric" placeholder="RIR">
              <button class="set-check ${set.done ? "done" : ""}" data-action="set-done">${set.done ? "✓" : "○"}</button>
            </div>`,
          )
          .join("")}</div>
      </article>
      <div class="actions">
        <button id="replaceToday" class="btn">Choose substitute for today</button>
        <button id="replaceRoutine" class="btn">Choose substitute for routine</button>
        <button id="machineUnavailable" class="btn danger">Not available at this gym</button>
      </div>
      <div class="actions">
        <button id="prevExercise" class="btn ghost" ${session.currentIndex === 0 ? "disabled" : ""}>Previous</button>
        <button id="nextExercise" class="btn primary">${session.currentIndex === session.exercises.length - 1 ? "Finish workout" : "Next exercise"}</button>
      </div>
      <div id="restTimer"></div>
    </div>`;

  let showingAnimation = false;
  $("#toggleMedia").onclick = () => {
    showingAnimation = !showingAnimation;
    $("#sessionMedia").src = mediaUrl(showingAnimation ? exercise.gif_url : exercise.image);
    $("#toggleMedia").textContent = showingAnimation ? "Show image" : "Show animation";
  };

  function syncSetRow(row) {
    const set = item.setsLog[Number(row.dataset.set)];
    row.querySelectorAll("input[data-field]").forEach((input) => {
      updateSetLogValue(set, input.dataset.field, input.value);
    });
    return set;
  }

  function syncVisibleSetInputs() {
    $$(".set-row").forEach(syncSetRow);
    persist();
  }

  $$(".set-row input").forEach((input) => {
    input.addEventListener("input", (event) => {
      syncSetRow(event.target.closest(".set-row"));
      persist();
    });
  });

  $$('[data-action="set-done"]').forEach((button) => {
    button.onclick = () => {
      const row = button.closest(".set-row");
      const set = syncSetRow(row);
      set.done = !set.done;
      persist();
      if (set.done) startRest(item.restSeconds);
      renderSession();
    };
  });

  $("#exitSession").onclick = () => {
    syncVisibleSetInputs();
    renderToday();
    view("todayView");
  };
  $("#prevExercise").onclick = () => {
    syncVisibleSetInputs();
    session.currentIndex -= 1;
    persist();
    renderSession();
  };
  $("#nextExercise").onclick = () => {
    syncVisibleSetInputs();
    if (session.currentIndex < session.exercises.length - 1) {
      session.currentIndex += 1;
      persist();
      renderSession();
    } else {
      finishSession();
    }
  };
  $("#replaceToday").onclick = () => openReplacementPicker({ scope: "session", permanent: false });
  $("#replaceRoutine").onclick = () => openReplacementPicker({ scope: "session", permanent: true });
  $("#machineUnavailable").onclick = () =>
    openReplacementPicker({ scope: "session", permanent: true, markUnavailable: true });

  renderRest();
}

function replacementContext({ scope, workoutId, itemIndex }) {
  if (scope === "draft") {
    const workout = state.draftProgram?.workouts.find((entry) => entry.id === workoutId);
    if (!workout) return null;
    const item = workout.exercises[itemIndex];
    return {
      item,
      requestedGroup: item?.requestedGroup || item?.targetGroup || null,
      targetGroup: item?.targetGroup || null,
      targetRole: item?.targetRole || null,
      allowedGroups: workout.allowedGroups || workout.emphasis || [],
      existingIds: workout.exercises.map((entry) => entry.exerciseId),
      apply(
        replacementId,
        { replacementMeta = null, candidateComplexity = null, candidate = null } = {},
      ) {
        applyReplacementMetadata(
          item,
          replacementId,
          replacementMeta,
          candidateComplexity,
          candidate,
        );
        refreshProgramVolume(state.draftProgram, exercises, state.profile);
        state.draftComparison = null;
        markDraftUpdated();
        persist();
        renderPlanner();
      },
      successMessage: "Draft programme updated.",
    };
  }

  if (scope === "routine") {
    const workout = state.activeProgram?.workouts.find((entry) => entry.id === workoutId);
    if (!workout) return null;
    const item = workout.exercises[itemIndex];
    return {
      item,
      requestedGroup: item?.requestedGroup || item?.targetGroup || null,
      targetGroup: item?.targetGroup || null,
      targetRole: item?.targetRole || null,
      allowedGroups: workout.allowedGroups || workout.emphasis || [],
      existingIds: workout.exercises.map((entry) => entry.exerciseId),
      apply(
        replacementId,
        { replacementMeta = null, candidateComplexity = null, candidate = null } = {},
      ) {
        applyReplacementMetadata(
          item,
          replacementId,
          replacementMeta,
          candidateComplexity,
          candidate,
        );
        refreshProgramVolume(state.activeProgram, exercises, state.profile);
        persist();
        renderRoutine();
      },
      successMessage: "Routine exercise updated.",
    };
  }

  if (scope === "session") {
    const session = state.activeSession;
    if (!session) return null;
    const item = session.exercises[session.currentIndex];
    const workout = state.activeProgram?.workouts.find((entry) => entry.id === session.workoutId);
    return {
      item,
      requestedGroup: item.requestedGroup || item.targetGroup || null,
      targetGroup: item.targetGroup || null,
      targetRole: item.targetRole || null,
      allowedGroups: session.allowedGroups || workout?.allowedGroups || workout?.emphasis || [],
      existingIds: session.exercises.map((entry) => entry.exerciseId),
      apply(
        replacementId,
        {
          permanent = false,
          markUnavailable = false,
          replacementMeta = null,
          candidateComplexity = null,
          candidate = null,
        } = {},
      ) {
        const oldId = item.exerciseId;
        applyReplacementMetadata(
          item,
          replacementId,
          replacementMeta,
          candidateComplexity,
          candidate,
        );
        item.setsLog = item.setsLog.map((set, index) => ({
          set: index + 1,
          weight: "",
          reps: "",
          rir: "",
          done: false,
        }));
        item.carriedFromPrevious = false;

        if (permanent) {
          const template = workout?.exercises.find((entry) => entry.exerciseId === oldId);
          if (template) {
            applyReplacementMetadata(
              template,
              replacementId,
              replacementMeta,
              candidateComplexity,
              candidate,
            );
            refreshProgramVolume(state.activeProgram, exercises, state.profile);
          }
        }
        if (markUnavailable && !state.gym.unavailableExerciseIds.includes(oldId)) {
          state.gym.unavailableExerciseIds.push(oldId);
        }
        persist();
        renderSession();
      },
      successMessage: "Exercise substituted.",
    };
  }

  return null;
}

function openReplacementPicker({
  scope,
  workoutId = null,
  itemIndex = null,
  permanent = false,
  markUnavailable = false,
}) {
  const context = replacementContext({ scope, workoutId, itemIndex });
  if (!context?.item) return;

  const currentExercise = exerciseById(context.item.exerciseId);
  const replacementTarget = context.targetGroup || currentExercise?.app?.group || "selected muscle";
  const replacementRole = context.targetRole
    ? TRAINING_ROLE_LABELS[context.targetRole] || labelize(context.targetRole)
    : null;
  const profileDifficulty = maxComplexity(state.profile.level);
  let selectedDifficulty = "profile";

  const difficultyOptions = [
    { value: "profile", label: `Up to ${LEVELS[state.profile.level]} — profile maximum` },
    ...[
      { value: "1", label: "Starter — complexity 1/4" },
      { value: "2", label: "Intermediate — complexity 2/4" },
      { value: "3", label: "Advanced — complexity 3/4" },
      { value: "4", label: "Expert — complexity 4/4" },
    ].slice(0, profileDifficulty),
  ];

  function renderReplacementResults() {
    const options = replacementOptions(
      exercises,
      context.item.exerciseId,
      context.existingIds,
      state.profile,
      state,
      state.profile.goal,
      30,
      selectedDifficulty,
      context.targetGroup,
      context.targetRole,
      context.allowedGroups,
      context.requestedGroup,
    );

    const optionsById = new Map(options.map((candidate) => [String(candidate.id), candidate]));

    $("#replacementResults").innerHTML = options.length
      ? options
          .map(
            (candidate) => `
              <article class="replacement-option">
                <img loading="lazy" src="${mediaUrl(candidate.image)}" alt="">
                <div>
                  <strong>${escapeHtml(candidate.name)}</strong>
                  <small>${labelize(candidate.app.group)} · ${labelize(candidate.equipment)}</small>
                  ${candidate._replacement?.groupMatch === "companion" ? `<small>Same-day companion for ${escapeHtml(labelize(candidate._replacement.requestedGroup))}</small>` : ""}
                  <small class="complexity-meta">${escapeHtml(complexityText(candidate))} · ${labelize(candidate.app.movement)}</small>
                </div>
                <button class="btn small primary choose-replacement" data-id="${candidate.id}">Choose</button>
              </article>`,
          )
          .join("")
      : `<p>No eligible ${escapeHtml(labelize(replacementTarget))} replacements match this difficulty with the current equipment and safety filters.</p>`;

    $$(".choose-replacement").forEach((button) => {
      button.onclick = () => {
        const candidate = optionsById.get(String(button.dataset.id));
        context.apply(button.dataset.id, {
          permanent,
          markUnavailable,
          replacementMeta: candidate?._replacement || null,
          candidateComplexity: candidate?.app?.complexity,
          candidate,
        });
        $("#exerciseDialog").close();
        if (markUnavailable) {
          toast("Marked unavailable at this gym and replaced in the routine.");
        } else if (scope === "session") {
          toast(permanent ? "Routine updated with your selected substitute." : "Substituted for this session only.");
        } else {
          toast(context.successMessage);
        }
      };
    });
  }

  $("#exerciseDialogContent").innerHTML = `
    <div class="eyebrow">Choose a substitute</div>
    <h2>Replace ${escapeHtml(currentExercise.name)}</h2>
    <p>Options first stay inside the intended muscle slot. If that muscle has no eligible alternatives, the picker may use a sensible companion muscle already assigned to this workout—never an unrelated training day. Equipment, safety and profile-difficulty limits remain active.</p>
    <div class="chips">
      <span class="chip">Target: ${escapeHtml(labelize(replacementTarget))}</span>
      ${replacementRole ? `<span class="chip">Role: ${escapeHtml(replacementRole)}</span>` : ""}
      <span class="chip">Current: ${escapeHtml(complexityText(currentExercise))}</span>
      <span class="chip">${escapeHtml(profileComplexityText())}</span>
    </div>
    <label class="field" style="margin-top:14px">
      Difficulty
      <select id="replacementDifficulty">
        ${difficultyOptions
          .map(
            (option) =>
              `<option value="${option.value}" ${option.value === selectedDifficulty ? "selected" : ""}>${escapeHtml(option.label)}</option>`,
          )
          .join("")}
      </select>
    </label>
    <div id="replacementResults" class="replacement-list"></div>`;

  $("#exerciseDialog").showModal();
  $("#replacementDifficulty").addEventListener("change", (event) => {
    selectedDifficulty = event.target.value;
    renderReplacementResults();
  });
  renderReplacementResults();
}

function startRest(seconds) {
  clearInterval(restInterval);
  restRemaining = seconds;
  restInterval = setInterval(() => {
    restRemaining -= 1;
    renderRest();
    if (restRemaining <= 0) {
      clearInterval(restInterval);
      toast("Rest complete");
    }
  }, 1000);
}

function renderRest() {
  const element = $("#restTimer");
  if (!element || restRemaining <= 0) {
    if (element) element.innerHTML = "";
    return;
  }
  element.innerHTML = `<div class="rest-timer"><strong>Rest ${Math.floor(restRemaining / 60)}:${String(restRemaining % 60).padStart(2, "0")}</strong><button id="skipRest" class="btn small">Skip</button></div>`;
  $("#skipRest").onclick = () => {
    clearInterval(restInterval);
    restRemaining = 0;
    renderRest();
  };
}

function finishSession() {
  const session = state.activeSession;
  const completion = sessionCompletion(session);
  if (
    completion.status === "partial" &&
    !confirm(
      `${completion.completedSets}/${completion.totalSets} planned sets are marked complete. Save this workout as partial? It will not advance your programme.`,
    )
  ) {
    return;
  }

  session.completedAt = new Date().toISOString();
  session.status = completion.status;
  state.history.push(session);
  state.activeSession = null;

  if (completion.status === "partial") {
    persist();
    renderAll();
    view("progressView");
    toast("Partial workout saved without advancing your programme.");
    return;
  }

  state.activeProgram.completedSessions = (state.activeProgram.completedSessions || 0) + 1;
  state.activeProgram.nextWorkoutIndex =
    ((state.activeProgram.nextWorkoutIndex || 0) + 1) % state.activeProgram.workouts.length;

  const completedProgram = state.activeProgram;
  const requiredSessions = completedProgram.durationWeeks * completedProgram.daysPerWeek;
  if ((completedProgram.completedSessions || 0) >= requiredSessions) {
    const previousProgram = completedProgramSnapshot(
      completedProgram,
      state.history,
      session.completedAt,
    );
    state.previousProgram = previousProgram;
    state.activeProgram = null;
    state.draftProgram = generateDraftProgram(
      (completedProgram.variation || 0) + 1,
      previousProgram,
    );
    state.draftComparison = null;
    persist();
    renderAll();
    renderPlanner();
    view("plannerView");
    toast("Programme completed. Compare it with your next recommendation.");
    return;
  }

  persist();
  renderAll();
  view("progressView");
  toast("Workout completed and added to progress.");
}

function renderRoutine() {
  const program = state.activeProgram;
  if (!program) {
    $("#routineView").innerHTML = `
      <div class="hero"><h1>No active routine</h1><p>Your recommendation must be accepted before it becomes a routine.</p></div>
      <div class="card"><button id="routineContinueDraft" class="btn primary">Continue recommendation</button></div>`;
    $("#routineContinueDraft").onclick = () => {
      renderPlanner();
      view("plannerView");
    };
    return;
  }

  $("#routineView").innerHTML = `
    <div class="hero">
      <div class="eyebrow">My routine</div>
      <h1>${escapeHtml(program.title)}</h1>
      <p>Week ${currentWeek(program)} of ${program.durationWeeks} · ${program.completedSessions || 0} sessions complete.</p>
    </div>
    ${weeklyCoverageHtml(program)}
    ${weeklyVolumeHtml(program)}
    <div class="card"><h2>Progression</h2><p>${escapeHtml(program.progression)}</p></div>
    <div class="card">
      <h2>Workout templates</h2>
      <p>Routine substitutions change future sessions. Every option remains inside your selected complexity and safety limits.</p>
      ${program.workouts.map((workout) => workoutHtml(workout, { editable: true, scope: "routine" })).join("")}
    </div>
    <div class="actions"><button id="endProgram" class="btn danger">End and rebuild programme</button></div>`;

  bindWorkoutActions();
  $("#endProgram").onclick = () => {
    if (confirm("End the active programme? Completed workout history will be kept.")) {
      state.activeProgram = null;
      state.activeSession = null;
      state.draftProgram = generateProgram(exercises, state.profile, state, 0);
      state.draftComparison = null;
      persist();
      renderPlanner();
      view("plannerView");
    }
  };
}

function sessionVolume(session) {
  return session.exercises
    .flatMap((exercise) => exercise.setsLog || [])
    .reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
}

function renderProgress() {
  const sessions = state.history;
  const completedSets = sessions
    .flatMap((session) => session.exercises.flatMap((exercise) => exercise.setsLog || []))
    .filter((set) => set.done).length;
  const volume = Math.round(sessions.reduce((sum, session) => sum + sessionVolume(session), 0));

  $("#progressView").innerHTML = `
    <div class="hero"><div class="eyebrow">Progress</div><h1>Your training record</h1><p>All data stays in this browser unless you export it.</p></div>
    <div class="stat-grid">
      <div class="stat"><strong>${sessions.length}</strong><span>workouts</span></div>
      <div class="stat"><strong>${completedSets}</strong><span>completed sets</span></div>
      <div class="stat"><strong>${volume.toLocaleString()}</strong><span>kg-rep volume</span></div>
      <div class="stat"><strong>${state.activeProgram ? currentWeek(state.activeProgram) : "—"}</strong><span>programme week</span></div>
    </div>
    <div class="card" style="margin-top:14px">
      <h2>Recent workouts</h2>
      ${
        sessions.length
          ? sessions
              .slice()
              .reverse()
              .slice(0, 12)
              .map(
                (session) => `<div class="exercise-line"><span class="number">${session.status === "partial" ? "…" : "✓"}</span><div><strong>${escapeHtml(session.workoutName)}${session.status === "partial" ? " · Partial" : ""}</strong><small>${new Date(session.completedAt).toLocaleDateString()} · ${session.exercises.flatMap((exercise) => exercise.setsLog).filter((set) => set.done).length} sets · ${sessionVolume(session).toLocaleString()} volume</small></div></div>`,
              )
              .join("")
          : "<p>No completed workouts yet.</p>"
      }
    </div>`;
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function browserResults() {
  const query = normalize($("#exerciseSearch")?.value);
  const category = $("#categoryFilter")?.value || "";
  const equipment = $("#equipmentFilter")?.value || "";
  return exercises.filter(
    (exercise) =>
      (!query || normalize(`${exercise.name} ${exercise.target} ${exercise.muscle_group}`).includes(query)) &&
      (!category || exercise.category === category) &&
      (!equipment || exercise.equipment === equipment),
  );
}

function renderExercises(reset = false) {
  if (reset) browserLimit = 24;
  const categories = uniqueValues(exercises, "category");
  const equipment = uniqueValues(exercises, "equipment");

  $("#exercisesView").innerHTML = `
    <div class="hero">
      <div class="eyebrow">Exercise library</div>
      <h1>All ${exercises.length.toLocaleString()} exercises</h1>
      <p>Search the complete source dataset. Complexity is calculated by this app and programme recommendations are capped by your profile level.</p>
    </div>
    <div class="exercise-toolbar">
      <input id="exerciseSearch" placeholder="Search name, muscle or target">
      <select id="categoryFilter"><option value="">All body parts</option>${categories.map((value) => `<option>${escapeHtml(value)}</option>`).join("")}</select>
      <select id="equipmentFilter"><option value="">All equipment</option>${equipment.map((value) => `<option>${escapeHtml(value)}</option>`).join("")}</select>
    </div>
    <div id="browserCount"></div>
    <div id="exerciseGrid" class="exercise-grid"></div>
    <div class="actions"><button id="loadMore" class="btn">Load more</button></div>`;

  ["exerciseSearch", "categoryFilter", "equipmentFilter"].forEach((id) => {
    $("#" + id).addEventListener(id === "exerciseSearch" ? "input" : "change", () => {
      browserLimit = 24;
      renderBrowserGrid();
    });
  });
  $("#loadMore").onclick = () => {
    browserLimit += 24;
    renderBrowserGrid();
  };
  renderBrowserGrid();
}

function renderBrowserGrid() {
  const results = browserResults();
  const shown = results.slice(0, browserLimit);
  $("#browserCount").innerHTML = `<p>${results.length.toLocaleString()} matching exercises</p>`;
  $("#exerciseGrid").innerHTML = shown
    .map(
      (exercise) => `<button class="exercise-browser-card" data-id="${exercise.id}"><img loading="lazy" src="${mediaUrl(exercise.image)}" alt=""><div><strong>${escapeHtml(exercise.name)}</strong><small>${labelize(exercise.app.group)} · ${labelize(exercise.equipment)}</small><small class="complexity-meta">${escapeHtml(complexityText(exercise))}</small></div></button>`,
    )
    .join("");
  $$(".exercise-browser-card").forEach((button) => {
    button.onclick = () => openExercise(button.dataset.id);
  });
  $("#loadMore").hidden = shown.length >= results.length;
}

function openExercise(id) {
  const exercise = exerciseById(id);
  if (!exercise) return;
  $("#exerciseDialogContent").innerHTML = `
    <img class="exercise-media" src="${mediaUrl(exercise.gif_url || exercise.image)}" alt="${escapeHtml(exercise.name)}">
    <div class="eyebrow" style="margin-top:14px">${labelize(exercise.category)}</div>
    <h2>${escapeHtml(exercise.name)}</h2>
    <div class="chips">
      <span class="chip">${labelize(exercise.equipment)}</span>
      <span class="chip">Target: ${escapeHtml(exercise.target)}</span>
      <span class="chip">${labelize(exercise.app.movement)}</span>
      <span class="chip complexity-chip">${escapeHtml(complexityText(exercise))}</span>
    </div>
    <ol class="instructions">${instructionSteps(exercise).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    <p class="notice">Automated safety enrichment: ${exercise.app.safetyFlags.length ? exercise.app.safetyFlags.map((flag) => CONSTRAINTS[flag]).join(", ") : "no specific flag detected"}. This is not medical advice.</p>`;
  $("#exerciseDialog").showModal();
}

function renderProfile() {
  const profile = state.profile;
  const preferences = state.preferences || {};
  const deviceLabel = currentDeviceLabel();
  const lastBackup = preferences.lastBackupFileName
    ? `<p><strong>Latest backup:</strong> ${escapeHtml(preferences.lastBackupFileName)} — ${escapeHtml(preferences.lastBackupLocation || "download location")}.</p>`
    : "<p><strong>Latest backup:</strong> No backup file has been created yet.</p>";
  $("#profileView").innerHTML = `
    <div class="hero"><div class="eyebrow">Profile</div><h1>${escapeHtml(profile?.name || "Training profile")}</h1><p>Changing programme inputs rebuilds the recommendation. History is retained.</p></div>
    <div class="card">
      <div class="chips">
        <span class="chip">${activeGoal().label}</span>
        <span class="chip">${LEVELS[profile.level]}</span>
        <span class="chip">Complexity cap ${maxComplexity(profile.level)}/4</span>
        <span class="chip">${profile.daysPerWeek} days/week</span>
        <span class="chip">${profile.sessionMinutes} min</span>
        <span class="chip">${EQUIPMENT_PRESETS[profile.equipmentPreset]?.label}</span>
        ${(profile.constraints || []).map((constraint) => `<span class="chip">${CONSTRAINTS[constraint]}</span>`).join("")}
      </div>
      <div class="actions">
        ${!state.activeProgram && state.draftProgram ? '<button id="profileContinueDraft" class="btn primary">Continue recommendation</button>' : ""}
        <button id="editProfile" class="btn ${!state.activeProgram && state.draftProgram ? "" : "primary"}">Edit profile</button>
      </div>
    </div>
    <div class="card">
      <h2>Weekly structure</h2>
      <p>${workoutDaysForProfile(profile)
        .map((day, index) => `Day ${index + 1}: ${escapeHtml(day.name)}${day.emphasis?.length ? ` — focus ${day.emphasis.map(labelize).join(", ")}` : ""}`)
        .join("<br>")}</p>
    </div>
    <div class="card">
      <div class="eyebrow">Guide & help</div>
      <h2>Understand your programme</h2>
      <p>Review how recommendations become routines, or compare what each training goal changes.</p>
      <div class="actions">
        <button id="profileGuideHow" class="btn" type="button">How it works</button>
        <button id="profileGuideGoals" class="btn" type="button">Training goals</button>
      </div>
    </div>
    <div class="card">
      <h2>Where your data is saved</h2>
      <p><strong>Live copy:</strong> This browser on ${deviceLabel}. It is not stored in an account or automatically synced to another device.</p>
      ${lastBackup}
      <p>Export the profile, routine, gym observations and history to create or update a portable backup.</p>
      <div class="actions">
        <button id="exportData" class="btn">Create backup file</button>
        <label class="btn">Import data<input id="importData" type="file" accept="application/json" hidden></label>
        <button id="resetData" class="btn danger">Reset all local data</button>
      </div>
    </div>
    <div class="card">
      <h2>Gym learning</h2>
      <p>${state.gym.unavailableExerciseIds.length} exercise or machine variants are currently marked unavailable at this gym.</p>
      <button id="resetGym" class="btn ghost">Clear unavailable list</button>
    </div>`;

  $("#profileContinueDraft")?.addEventListener("click", () => {
    renderPlanner();
    view("plannerView");
  });
  $("#editProfile").onclick = () => {
    renderOnboarding(true);
    view("onboardingView");
  };
  $("#profileGuideHow").onclick = () => openGuide("how");
  $("#profileGuideGoals").onclick = () => openGuide("goals");
  $("#exportData").onclick = async () => {
    try {
      const backup = await exportState(state, { chooseLocation: true });
      if (!backup) {
        toast("Export cancelled.");
        return;
      }
      state.preferences = {
        ...state.preferences,
        lastBackupAt: new Date().toISOString(),
        lastBackupFileName: backup.fileName,
        lastBackupLocation: backup.location,
      };
      persist();
      renderProfile();
      toast(backupMessage(backup));
    } catch (error) {
      alert(`Could not export data: ${error.message}`);
    }
  };
  $("#importData").onchange = async (event) => {
    try {
      state = await importState(event.target.files[0]);
      reconcileStoredProgramMetrics();
      renderAll();
      routeInitial();
      toast("Data imported.");
    } catch (error) {
      alert(error.message);
    }
  };
  $("#resetData").onclick = () => {
    if (confirm("Delete the local profile, programme and history from this browser?")) {
      state = resetState();
      renderOnboarding();
      view("onboardingView");
    }
  };
  $("#resetGym").onclick = () => {
    state.gym.unavailableExerciseIds = [];
    persist();
    renderProfile();
  };
}

function renderAll() {
  renderToday();
  renderRoutine();
  renderProgress();
  renderExercises(true);
  renderProfile();
  $("#headerSubtitle").textContent = state.activeProgram
    ? `Week ${currentWeek(state.activeProgram)} · ${activeGoal().label}`
    : state.draftProgram
      ? "Draft recommendation saved"
      : "Personal programme";
}

function routeInitial() {
  if (!state.profile) {
    renderOnboarding();
    view("onboardingView");
  } else if (state.activeSession) {
    renderAll();
    renderSession();
    view("sessionView");
  } else if (state.activeProgram) {
    renderAll();
    view("todayView");
  } else {
    if (!state.draftProgram) {
      state.draftProgram = generateDraftProgram(0, state.previousProgram);
      state.draftComparison = null;
    }
    persist();
    renderPlanner();
    view("plannerView");
  }
}

function bindGlobal() {
  $$("#bottomNav button").forEach((button) => {
    button.onclick = () => {
      const viewId = button.dataset.view;
      if (viewId === "todayView") renderToday();
      if (viewId === "routineView") renderRoutine();
      if (viewId === "progressView") renderProgress();
      if (viewId === "exercisesView") renderExercises(true);
      if (viewId === "profileView") renderProfile();
      view(viewId);
    };
  });

  $("#brandButton").onclick = () => {
    if (state.activeSession) {
      renderSession();
      view("sessionView");
    } else if (state.activeProgram) {
      renderToday();
      view("todayView");
    } else if (state.draftProgram) {
      renderPlanner();
      view("plannerView");
    } else if (state.profile) {
      renderToday();
      view("todayView");
    } else {
      renderOnboarding();
      view("onboardingView");
    }
  };

  $("#closeExerciseDialog").onclick = () => $("#exerciseDialog").close();
  $("#closeGuideDialog").onclick = () => $("#guideDialog").close();
}

async function init() {
  bindGlobal();
  installMediaFallback();
  window.addEventListener("online", updateDatasetBadge);
  window.addEventListener("offline", updateDatasetBadge);
  await registerServiceWorker();
  try {
    exercises = await loadExercises();
    byId = new Map(exercises.map((exercise) => [String(exercise.id), exercise]));
    reconcileStoredProgramMetrics();
    updateDatasetBadge();
    routeInitial();
  } catch (error) {
    const offline = !navigator.onLine;
    $("#loadingView").innerHTML = `<div><h1>Exercise library unavailable</h1><p>${
      offline
        ? "This device is offline and does not yet have a complete saved exercise library. Connect once to finish setup."
        : `The exercise source could not be reached. ${escapeHtml(error.message)}`
    }</p><p>Your profile data has not been changed.</p><button id="retryDataset" class="btn primary">Retry</button></div>`;
    $("#retryDataset").onclick = () => location.reload();
  }
}

init();
