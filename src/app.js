import { CONSTRAINT_LABELS, DEFAULT_PROFILE, EQUIPMENT } from "./data.js";
import {
  equipmentFor,
  findReplacement,
  generateWorkout,
  muscleLabel,
  workoutFilterLabels,
} from "./engine.js";
import {
  exportData,
  importData,
  loadGym,
  loadHistory,
  loadProfile,
  resetAll,
  resetGym,
  saveGym,
  saveProfile,
  saveWorkout,
} from "./storage.js";

let profile = loadProfile();
let gym = loadGym();
let history = loadHistory();
let currentWorkout = null;
let deferredInstallPrompt = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function showView(viewId) {
  $$(".view").forEach(view => view.classList.toggle("active", view.id === viewId));
  $$(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.view === viewId));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindNavigation() {
  $$(".nav-button").forEach(button => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
}

function renderProfile() {
  $("#profileName").value = profile.name ?? "";
  $("#profileLevel").value = profile.level ?? "starter";
  $("#sessionMinutes").value = String(profile.sessionMinutes ?? 45);
  $("#kraftwerkMode").checked = profile.kraftwerkMode !== false;

  $$('input[name="equipmentMode"]').forEach(input => {
    input.checked = input.value === profile.equipmentMode;
  });

  $$('input[name="constraints"]').forEach(input => {
    input.checked = profile.constraints?.includes(input.value) ?? false;
  });

  $("#welcomeText").textContent = profile.name
    ? `${profile.name}, build your session`
    : "Build a safe session";
}

function readProfileForm() {
  const form = new FormData($("#profileForm"));
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    name: String(form.get("name") ?? "").trim(),
    level: String(form.get("level") ?? "starter"),
    sessionMinutes: Number(form.get("sessionMinutes") ?? 45),
    goal: "hypertrophy",
    equipmentMode: String(form.get("equipmentMode") ?? "machine_preferred"),
    constraints: form.getAll("constraints").map(String),
    kraftwerkMode: form.get("kraftwerkMode") === "on",
  };
}

function renderFilterChips() {
  $("#activeFilters").innerHTML = workoutFilterLabels(profile)
    .map(label => `<span class="chip">${escapeHtml(label)}</span>`)
    .join("");
}

function renderWorkout() {
  const list = $("#workoutList");
  list.innerHTML = "";

  $("#emptyWorkout").hidden = Boolean(currentWorkout?.exercises.length);
  const warning = $("#warningBanner");

  if (!currentWorkout) {
    $("#workoutSummary").textContent = "Set your profile, then generate a machine-aware hypertrophy workout.";
    warning.hidden = true;
    return;
  }

  $("#workoutSummary").textContent =
    `${currentWorkout.exercises.length} exercises · about ${currentWorkout.estimatedMinutes} minutes`;

  if (currentWorkout.warnings.length) {
    warning.hidden = false;
    warning.textContent = currentWorkout.warnings.join(" ");
  } else {
    warning.hidden = true;
  }

  currentWorkout.exercises.forEach((exercise, index) => {
    const fragment = $("#exerciseCardTemplate").content.cloneNode(true);
    const card = fragment.querySelector(".exercise-card");
    const equipment = equipmentFor(exercise);

    card.dataset.exerciseId = exercise.id;
    card.classList.toggle("completed", exercise.completed);
    fragment.querySelector(".exercise-number").textContent = String(index + 1);
    fragment.querySelector(".exercise-muscle").textContent = muscleLabel(exercise.muscleGroup);
    fragment.querySelector(".exercise-name").textContent = exercise.name;
    fragment.querySelector(".exercise-prescription").textContent =
      `${exercise.sets} sets × ${exercise.reps} · ${exercise.restSeconds}s rest`;
    fragment.querySelector(".exercise-equipment").textContent =
      `${equipment.name} · ${equipment.type.replace("_", " ")}`;
    fragment.querySelector(".exercise-note").textContent = exercise.note;

    const favoriteButton = fragment.querySelector(".favorite-button");
    const isFavorite = profile.favorites?.includes(exercise.id);
    favoriteButton.textContent = isFavorite ? "★" : "☆";
    favoriteButton.classList.toggle("selected", isFavorite);
    favoriteButton.addEventListener("click", () => toggleFavorite(exercise.id));

    fragment.querySelector(".rotate-button").addEventListener("click", () => rotateExercise(exercise.id));
    fragment.querySelector(".unavailable-button").addEventListener("click", () => markUnavailableAndRotate(exercise.id));

    const completeButton = fragment.querySelector(".complete-button");
    completeButton.textContent = exercise.completed ? "Completed ✓" : "Complete";
    completeButton.addEventListener("click", () => toggleComplete(exercise.id));

    list.appendChild(fragment);
  });
}

function generate() {
  profile = saveProfile(profile);
  history = loadHistory();
  currentWorkout = generateWorkout(profile, gym, history);
  renderFilterChips();
  renderWorkout();
}

function toggleFavorite(exerciseId) {
  const favorites = new Set(profile.favorites ?? []);
  favorites.has(exerciseId) ? favorites.delete(exerciseId) : favorites.add(exerciseId);
  profile = saveProfile({ ...profile, favorites: [...favorites] });
  renderWorkout();
}

function rotateExercise(exerciseId) {
  if (!currentWorkout) return;
  const index = currentWorkout.exercises.findIndex(item => item.id === exerciseId);
  const current = currentWorkout.exercises[index];
  const replacement = findReplacement(current, currentWorkout, profile, gym, history);

  if (!replacement) {
    alert("No eligible replacement is available for this muscle group with the current filters.");
    return;
  }

  currentWorkout.exercises[index] = { ...replacement, completed: false };
  currentWorkout.estimatedMinutes = currentWorkout.exercises.reduce((sum, item) => sum + item.minutes, 0);
  renderWorkout();
}

function markUnavailableAndRotate(exerciseId) {
  if (!currentWorkout) return;
  const exercise = currentWorkout.exercises.find(item => item.id === exerciseId);
  const equipment = equipmentFor(exercise);

  gym = saveGym({
    ...gym,
    observations: {
      ...gym.observations,
      [exercise.equipmentId]: {
        status: "unavailable",
        observedAt: new Date().toISOString(),
        source: profile.name || "local-user",
      },
    },
  });

  renderEquipment();
  rotateExercise(exerciseId);
  $("#warningBanner").hidden = false;
  $("#warningBanner").textContent = `${equipment.name} marked unavailable in the local Kraftwerk map.`;
}

function toggleComplete(exerciseId) {
  if (!currentWorkout) return;
  const exercise = currentWorkout.exercises.find(item => item.id === exerciseId);
  exercise.completed = !exercise.completed;

  if (currentWorkout.exercises.every(item => item.completed)) {
    history = saveWorkout(currentWorkout);
    $("#warningBanner").hidden = false;
    $("#warningBanner").textContent = "Workout completed and added to local rotation history.";
  }

  renderWorkout();
}

function renderEquipment() {
  const observations = gym.observations ?? {};
  const counts = { available: 0, unavailable: 0, unknown: 0 };

  for (const item of EQUIPMENT) {
    const status = observations[item.id]?.status ?? "unknown";
    counts[status] += 1;
  }

  $("#gymStats").innerHTML = `
    <div class="stat"><strong>${counts.available}</strong><span>Available</span></div>
    <div class="stat"><strong>${counts.unavailable}</strong><span>Unavailable</span></div>
    <div class="stat"><strong>${counts.unknown}</strong><span>Unknown</span></div>
  `;

  $("#equipmentList").innerHTML = "";
  for (const item of EQUIPMENT) {
    const status = observations[item.id]?.status ?? "unknown";
    const card = document.createElement("article");
    card.className = "equipment-card";
    card.innerHTML = `
      <h3>${escapeHtml(item.name)}</h3>
      <div class="equipment-meta">${escapeHtml(item.area)} · ${escapeHtml(item.type.replace("_", " "))}</div>
      <div class="segmented" role="group" aria-label="${escapeHtml(item.name)} availability">
        ${["available", "unavailable", "unknown"].map(value => `
          <button class="${value === status ? "selected" : ""}" data-status="${value}">
            ${value[0].toUpperCase() + value.slice(1)}
          </button>
        `).join("")}
      </div>
    `;

    card.querySelectorAll("[data-status]").forEach(button => {
      button.addEventListener("click", () => setEquipmentStatus(item.id, button.dataset.status));
    });

    $("#equipmentList").appendChild(card);
  }
}

function setEquipmentStatus(equipmentId, status) {
  const observations = { ...gym.observations };

  if (status === "unknown") {
    delete observations[equipmentId];
  } else {
    observations[equipmentId] = {
      status,
      observedAt: new Date().toISOString(),
      source: profile.name || "local-user",
    };
  }

  gym = saveGym({ ...gym, observations });
  renderEquipment();
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bindActions() {
  $("#generateButton").addEventListener("click", generate);

  $("#profileForm").addEventListener("submit", event => {
    event.preventDefault();
    profile = saveProfile(readProfileForm());
    renderProfile();
    renderFilterChips();
    $("#profileSavedBadge").textContent = "Saved locally";
    setTimeout(() => { $("#profileSavedBadge").textContent = "Local only"; }, 1800);
  });

  $("#resetGymButton").addEventListener("click", () => {
    if (!confirm("Reset all local Kraftwerk equipment observations?")) return;
    gym = resetGym();
    renderEquipment();
  });

  $("#exportButton").addEventListener("click", () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(exportData(), `workout-app-export-${date}.json`);
  });

  $("#importInput").addEventListener("change", async event => {
    const [file] = event.target.files;
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text());
      importData(payload);
      profile = loadProfile();
      gym = loadGym();
      history = loadHistory();
      renderProfile();
      renderFilterChips();
      renderEquipment();
      $("#importStatus").textContent = `Imported ${file.name}. Review the Profile and Gym tabs.`;
    } catch (error) {
      $("#importStatus").textContent = `Import failed: ${error.message}`;
    } finally {
      event.target.value = "";
    }
  });

  $("#resetAllButton").addEventListener("click", () => {
    if (!confirm("Delete all workout-app data stored in this browser?")) return;
    resetAll();
    profile = loadProfile();
    gym = loadGym();
    history = loadHistory();
    currentWorkout = null;
    renderProfile();
    renderFilterChips();
    renderEquipment();
    renderWorkout();
    $("#importStatus").textContent = "Local data deleted.";
  });
}

function bindInstall() {
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    $("#installButton").hidden = false;
  });

  $("#installButton").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $("#installButton").hidden = true;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
  }
}

bindNavigation();
bindActions();
bindInstall();
renderProfile();
renderFilterChips();
renderEquipment();
renderWorkout();
