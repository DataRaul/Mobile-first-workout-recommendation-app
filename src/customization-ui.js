import { loadExercises, mediaUrl } from "./dataset.js";
import { maxComplexity, refreshProgramVolume, TRAINING_ROLE_LABELS } from "./programme.js";
import {
  applyRoutineSlotReplacement,
  candidateForRoutineSlot,
  replacementMatchLabel,
  replacementWarning,
  routineSlotOptions,
} from "./customization.js";

const STATE_KEY = "workout-recommender.state.v2";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
const label = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
let exercises = [];
let byId = new Map();
let replacementMode = null;
let lastDialogExerciseId = null;
let enhancing = false;

function state() {
  try { return JSON.parse(localStorage.getItem(STATE_KEY) || "null"); } catch { return null; }
}
function save(next) { localStorage.setItem(STATE_KEY, JSON.stringify(next)); }
function toast(message) {
  const node = $("#toast");
  if (!node) return;
  node.textContent = message;
  node.hidden = false;
  clearTimeout(node._customTimer);
  node._customTimer = setTimeout(() => { node.hidden = true; }, 3200);
}
function activeView(id) {
  $$(".view").forEach((node) => node.classList.toggle("active", node.id === id));
  $$("#bottomNav button").forEach((button) => button.classList.toggle("active", button.dataset.view === id));
  $("#bottomNav").hidden = false;
  window.scrollTo({ top: 0, behavior: "auto" });
}
function slotFromContext(context, nextState = state()) {
  const workout = nextState?.activeProgram?.workouts?.find((item) => item.id === context.workoutId);
  if (!workout) return null;
  const item = workout.exercises?.[context.itemIndex];
  return item ? { workout, item, itemIndex: context.itemIndex } : null;
}
function compatibilityText(exercise, currentState) {
  if (!currentState?.profile) return "Create a profile to check programme compatibility.";
  if ((currentState.gym?.unavailableExerciseIds || []).some((id) => String(id) === String(exercise.id))) return "Unavailable at my gym";
  if (exercise.app?.complexity > maxComplexity(currentState.profile.level)) return "Above your difficulty ceiling";
  const blocked = (currentState.profile.constraints || []).some((constraint) => exercise.app?.compatibility?.[constraint]?.status === "avoid");
  if (blocked) return "Not compatible with a current safety constraint";
  return "Compatible with current profile";
}
function roleText(exercise) {
  return (exercise.app?.trainingRoles || []).map((role) => TRAINING_ROLE_LABELS[role] || label(role)).join(", ") || "General";
}
function applyMetadata(item, replacementId, meta, complexity, candidate, currentState) {
  item.exerciseId = replacementId;
  if (meta) {
    item.requestedGroup = meta.requestedGroup || item.requestedGroup || item.targetGroup;
    item.targetGroup = meta.targetGroup || item.targetGroup;
    item.targetRole = meta.targetRole || item.targetRole;
    item.groupMatch = meta.groupMatch || "exact";
    item.roleMatch = meta.roleMatch || "group";
  }
  item.difficultyDelta = Number(complexity) - maxComplexity(currentState.profile.level);
  item.constraintNotes = (currentState.profile.constraints || []).map((constraint) => {
    const assessment = candidate.app?.compatibility?.[constraint];
    if (!assessment || assessment.status === "normal") return null;
    return { constraint, status: assessment.status, reason: assessment.reason, modification: assessment.modification, confidence: assessment.confidence };
  }).filter(Boolean);
  item.setCredits = candidate.app?.setCredits || { [candidate.app?.group]: 1 };
  item.qualityConfidence = candidate.app?.quality?.confidence || "unknown";
}
function confirmAndApply(candidate, context = replacementMode) {
  const currentState = state();
  const slot = slotFromContext(context, currentState);
  if (!slot) return;
  const eligible = candidateForRoutineSlot(exercises, candidate.id, slot, currentState.profile, currentState);
  if (!eligible) {
    toast("That exercise is not eligible for this routine slot.");
    return;
  }
  const warning = replacementWarning(eligible);
  if (warning && !confirm(`${warning}\n\nReplace this exercise in this workout/day only?`)) return;
  const oldName = byId.get(String(slot.item.exerciseId))?.name || "exercise";
  const changed = applyRoutineSlotReplacement({
    program: currentState.activeProgram,
    slot,
    candidate: eligible,
    profile: currentState.profile,
    applyMetadata: (item, id, meta, complexity, selected) => applyMetadata(item, id, meta, complexity, selected, currentState),
  });
  if (!changed) return;
  refreshProgramVolume(currentState.activeProgram, exercises, currentState.profile);
  save(currentState);
  replacementMode = null;
  $("#exerciseDialog")?.close();
  toast(`${oldName} replaced with ${candidate.name}.`);
  setTimeout(() => location.reload(), 450);
}
function candidateCard(candidate, slot) {
  const currentState = state();
  const eligible = candidateForRoutineSlot(exercises, candidate.id, slot, currentState.profile, currentState);
  if (!eligible) return "";
  const match = replacementMatchLabel(eligible);
  return `<article class="exercise-browser-card replacement-candidate-card">
    <button type="button" class="exercise-card-open custom-detail" data-custom-id="${esc(candidate.id)}" aria-label="View details for ${esc(candidate.name)}">
      <img loading="lazy" src="${mediaUrl(candidate.image)}" alt="">
      <div><strong>${esc(candidate.name)}</strong><small>${esc(label(candidate.app.group))} · ${esc(label(candidate.equipment))}</small><small>${esc(roleText(candidate))}</small><span class="replacement-badge">${esc(match)}</span></div>
    </button>
    <button type="button" class="btn small primary custom-replace-now" data-custom-id="${esc(candidate.id)}">Replace</button>
  </article>`;
}
function renderReplacementCatalogue() {
  const currentState = state();
  const slot = slotFromContext(replacementMode, currentState);
  if (!slot) { replacementMode = null; return; }
  const current = byId.get(String(slot.item.exerciseId));
  const view = $("#exercisesView");
  if (!view || !current) return;
  const dayIndex = currentState.activeProgram.workouts.findIndex((workout) => workout.id === slot.workout.id);
  const eligible = exercises.map((candidate) => candidateForRoutineSlot(exercises, candidate.id, slot, currentState.profile, currentState)).filter(Boolean);
  view.innerHTML = `<div class="hero exercise-replacement-context">
      <div class="eyebrow">Choose a replacement</div><h1>Replacing ${esc(current.name)}</h1>
      <p>Day ${dayIndex + 1} · ${esc(slot.workout.name)} · ${esc(label(slot.item.targetGroup || current.app.group))}. Your difficulty, equipment, safety and gym-availability limits stay active.</p>
      <button id="cancelCatalogueReplacement" type="button" class="btn ghost">Cancel replacement</button>
    </div>
    <div class="exercise-toolbar compact-custom-filters">
      <label class="field">Search<input id="customReplacementSearch" type="search" placeholder="Exercise, muscle, role or equipment"></label>
      <label class="field">Equipment<select id="customReplacementEquipment"><option value="">All eligible equipment</option>${[...new Set(eligible.map((x) => x.equipment))].sort().map((x) => `<option value="${esc(x)}">${esc(label(x))}</option>`).join("")}</select></label>
    </div>
    <div class="exercise-filter-chips"><span class="chip">${eligible.length} compatible</span><span class="chip">Available at my gym</span><span class="chip">Up to profile difficulty</span></div>
    <div id="customReplacementGrid" class="exercise-grid"></div>`;
  const render = () => {
    const q = String($("#customReplacementSearch")?.value || "").toLowerCase();
    const equipment = $("#customReplacementEquipment")?.value || "";
    const matches = eligible.filter((candidate) => (!equipment || candidate.equipment === equipment) && (!q || `${candidate.name} ${candidate.app.group} ${candidate.equipment} ${roleText(candidate)}`.toLowerCase().includes(q))).slice(0, 80);
    $("#customReplacementGrid").innerHTML = matches.map((candidate) => candidateCard(candidate, slot)).join("") || "<p>No compatible candidates match these filters.</p>";
  };
  $("#customReplacementSearch").oninput = render;
  $("#customReplacementEquipment").onchange = render;
  $("#cancelCatalogueReplacement").onclick = () => { replacementMode = null; $("#bottomNav button[data-view='routineView']")?.click(); };
  render();
  activeView("exercisesView");
}
function beginRoutineReplacement(button) {
  replacementMode = { workoutId: button.dataset.workoutId, itemIndex: Number(button.dataset.index) };
  renderReplacementCatalogue();
}
function slotChooser(exercise) {
  const currentState = state();
  if (!currentState?.activeProgram) return;
  const slots = routineSlotOptions(currentState.activeProgram);
  const dialog = $("#exerciseDialog");
  $("#exerciseDialogContent").innerHTML = `<div class="eyebrow">Use in routine</div><h2>Where should ${esc(exercise.name)} go?</h2><p>Select one exact workout/day slot. Completed workout history will not change.</p><div class="routine-slot-list">${slots.map((slot) => {
    const eligible = candidateForRoutineSlot(exercises, exercise.id, slot, currentState.profile, currentState);
    const old = byId.get(String(slot.item.exerciseId));
    return `<button type="button" class="routine-slot-choice ${eligible ? "" : "disabled-slot"}" data-workout-id="${esc(slot.workout.id)}" data-index="${slot.itemIndex}" ${eligible ? "" : "disabled"}><strong>${esc(slot.workout.name)}</strong><span>Replace ${esc(old?.name || slot.item.exerciseId)}</span><small>${eligible ? esc(replacementMatchLabel(eligible)) : "Not compatible with this slot"}</small></button>`;
  }).join("")}</div><button id="backToExerciseDetail" class="btn ghost" type="button">Back</button>`;
  $$(".routine-slot-choice:not(:disabled)").forEach((button) => button.onclick = () => {
    replacementMode = { workoutId: button.dataset.workoutId, itemIndex: Number(button.dataset.index) };
    confirmAndApply(exercise, replacementMode);
  });
  $("#backToExerciseDetail").onclick = () => openCustomDetail(exercise.id);
  if (!dialog.open) dialog.showModal();
}
function openCustomDetail(id) {
  const exercise = byId.get(String(id));
  if (!exercise) return;
  lastDialogExerciseId = String(id);
  const currentState = state();
  const compatible = compatibilityText(exercise, currentState);
  const inReplacement = replacementMode && slotFromContext(replacementMode, currentState);
  const eligible = inReplacement ? candidateForRoutineSlot(exercises, exercise.id, slotFromContext(replacementMode, currentState), currentState.profile, currentState) : null;
  const dialog = $("#exerciseDialog");
  $("#exerciseDialogContent").innerHTML = `<img class="exercise-media" src="${mediaUrl(exercise.gif_url || exercise.image)}" alt="${esc(exercise.name)} demonstration">
    <div class="eyebrow" style="margin-top:14px">${esc(label(exercise.app.group))}</div><h2>${esc(exercise.name)}</h2>
    <div class="chips"><span class="chip">${esc(label(exercise.equipment))}</span><span class="chip">Difficulty ${exercise.app.complexity}/4</span><span class="chip">Training role: ${esc(roleText(exercise))}</span></div>
    <div class="detail-facts"><p><strong>Profile:</strong> ${esc(compatible)}</p><p><strong>Primary muscle:</strong> ${esc(label(exercise.app.group))}</p><p><strong>Movement:</strong> ${esc(label(exercise.app.movement))}</p></div>
    ${eligible ? `<div class="notice"><strong>${esc(replacementMatchLabel(eligible))}</strong><p>${esc(replacementWarning(eligible) || "Preserves the intended muscle and role while staying inside your current profile limits.")}</p></div><button id="confirmCustomReplacement" class="btn primary" type="button">Replace ${esc(byId.get(String(slotFromContext(replacementMode, currentState).item.exerciseId))?.name || "exercise")}</button>` : ""}
    ${!inReplacement && currentState?.activeProgram ? '<button id="useExerciseInRoutine" class="btn primary" type="button">Use in routine</button>' : ""}`;
  $("#confirmCustomReplacement")?.addEventListener("click", () => confirmAndApply(exercise));
  $("#useExerciseInRoutine")?.addEventListener("click", () => slotChooser(exercise));
  if (!dialog.open) dialog.showModal();
}
function enhanceBrowse() {
  if (replacementMode) {
    const view = $("#exercisesView");
    if (!view?.querySelector(".exercise-replacement-context")) renderReplacementCatalogue();
    return;
  }
  const currentState = state();
  const view = $("#exercisesView");
  if (!view || !view.classList.contains("active") || enhancing) return;
  enhancing = true;
  try {
    const hero = view.querySelector(".hero");
    if (hero && !hero.querySelector(".customization-intro")) hero.insertAdjacentHTML("beforeend", `<div class="notice customization-intro"><strong>Explore, then personalize</strong><p>Browse the full catalogue here. With an accepted routine, open any exercise and choose <strong>Use in routine</strong> to replace one exact workout/day slot.</p></div>`);
    const toolbar = view.querySelector(".exercise-toolbar");
    if (toolbar && !$("#trainingRoleFilter")) {
      toolbar.insertAdjacentHTML("beforeend", `<label class="field">Training role<select id="trainingRoleFilter"><option value="">All roles</option>${[...new Set(exercises.flatMap((x) => x.app?.trainingRoles || []))].sort().map((x) => `<option value="${esc(x)}">${esc(TRAINING_ROLE_LABELS[x] || label(x))}</option>`).join("")}</select></label><label class="option favorites-filter"><input id="availableGymFilter" type="checkbox" ${currentState?.activeProgram ? "checked" : ""}><span>Available at my gym</span></label>`);
      $("#trainingRoleFilter").onchange = () => filterVisibleCards();
      $("#availableGymFilter").onchange = () => filterVisibleCards();
    }
    filterVisibleCards();
  } finally { enhancing = false; }
}
function filterVisibleCards() {
  const role = $("#trainingRoleFilter")?.value || "";
  const gymOnly = Boolean($("#availableGymFilter")?.checked);
  const currentState = state();
  $$("#exerciseGrid .exercise-browser-card").forEach((card) => {
    const id = card.querySelector("[data-id]")?.dataset.id;
    const exercise = byId.get(String(id));
    if (!exercise) return;
    const roleMatch = !role || (exercise.app?.trainingRoles || []).includes(role);
    const available = !gymOnly || !(currentState?.gym?.unavailableExerciseIds || []).some((x) => String(x) === String(id));
    card.hidden = !(roleMatch && available);
  });
}

document.addEventListener("click", (event) => {
  const replace = event.target.closest(".substitute-exercise[data-scope='routine']");
  if (replace) {
    event.preventDefault(); event.stopImmediatePropagation(); beginRoutineReplacement(replace); return;
  }
  const customDetail = event.target.closest(".custom-detail");
  if (customDetail) { event.preventDefault(); openCustomDetail(customDetail.dataset.customId); return; }
  const replaceNow = event.target.closest(".custom-replace-now");
  if (replaceNow) { event.preventDefault(); const exercise = byId.get(String(replaceNow.dataset.customId)); if (exercise) confirmAndApply(exercise); return; }
  const normalCard = event.target.closest("#exerciseGrid .exercise-card-open[data-id]");
  if (normalCard && !replacementMode) lastDialogExerciseId = String(normalCard.dataset.id);
}, true);

const observer = new MutationObserver(() => {
  if ($("#exercisesView")?.classList.contains("active")) setTimeout(enhanceBrowse, 0);
  const dialog = $("#exerciseDialog");
  if (dialog?.open && lastDialogExerciseId && !replacementMode && state()?.activeProgram && !$("#useExerciseInRoutine")) {
    const exercise = byId.get(lastDialogExerciseId);
    if (exercise) {
      const button = document.createElement("button");
      button.id = "useExerciseInRoutine"; button.type = "button"; button.className = "btn primary"; button.textContent = "Use in routine";
      button.onclick = () => slotChooser(exercise);
      $("#exerciseDialogContent")?.append(button);
    }
  }
});
observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "open"] });

try {
  exercises = await loadExercises();
  byId = new Map(exercises.map((exercise) => [String(exercise.id), exercise]));
  setTimeout(enhanceBrowse, 0);
} catch (error) {
  console.warn("Exercise customization enhancement could not load the catalogue.", error);
}