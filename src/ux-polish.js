import { loadExercises, mediaUrl } from "./dataset.js";

let exerciseMapPromise = null;

export function replacementScopeLabel(scopeText = "") {
  const normalized = String(scopeText).trim().toLowerCase();
  if (normalized.startsWith("today + future routine")) {
    return { key: "today-routine", label: "TODAY + FUTURE ROUTINE" };
  }
  if (normalized.startsWith("today only")) {
    return { key: "today", label: "TODAY ONLY" };
  }
  if (normalized.startsWith("future routine")) {
    return { key: "routine", label: "FUTURE ROUTINE" };
  }
  if (normalized.startsWith("draft only")) {
    return { key: "draft", label: "DRAFT ONLY" };
  }
  return { key: "other", label: "CHANGE SCOPE" };
}

export function restTimerState(text = "") {
  const normalized = String(text).toLowerCase();
  if (normalized.includes("paused")) return "paused";
  if (normalized.includes("running")) return "running";
  if (normalized.includes("rest complete")) return "complete";
  return "ready";
}

function restTimerStateLabel(state) {
  return {
    running: "RESTING",
    paused: "PAUSED",
    complete: "COMPLETE",
    ready: "READY",
  }[state] || "REST";
}

function getExerciseMap() {
  if (!exerciseMapPromise) {
    exerciseMapPromise = loadExercises()
      .then((items) => new Map(items.map((exercise) => [String(exercise.id), exercise])))
      .catch((error) => {
        exerciseMapPromise = null;
        throw error;
      });
  }
  return exerciseMapPromise;
}

function restoreMovementPreview(card) {
  const image = card?.querySelector("img");
  const button = card?.querySelector(".movement-preview-toggle");
  if (!image || !button) return;
  if (image.dataset.stillSrc) image.src = image.dataset.stillSrc;
  card.classList.remove("movement-previewing", "movement-preview-error");
  button.textContent = "Preview movement";
  button.setAttribute("aria-expanded", "false");
  card.querySelector(".movement-preview-error-message")?.remove();
}

function stopOtherMovementPreviews(activeCard) {
  document.querySelectorAll(".replacement-option.movement-previewing").forEach((card) => {
    if (card !== activeCard) restoreMovementPreview(card);
  });
}

function showPreviewError(card, button, messageText = "Movement preview could not load. Written instructions are still available.") {
  card.classList.add("movement-preview-error");
  button.textContent = "Retry movement preview";
  button.disabled = false;
  button.setAttribute("aria-expanded", "false");
  let message = card.querySelector(".movement-preview-error-message");
  if (!message) {
    message = document.createElement("small");
    message.className = "movement-preview-error-message";
    button.insertAdjacentElement("afterend", message);
  }
  message.textContent = messageText;
}

async function toggleMovementPreview(button) {
  const card = button.closest(".replacement-option");
  const image = card?.querySelector("img");
  const chooseButton = card?.querySelector(".choose-replacement[data-id]");
  if (!card || !image || !chooseButton) return;

  if (card.classList.contains("movement-previewing")) {
    restoreMovementPreview(card);
    return;
  }

  const exerciseId = String(chooseButton.dataset.id || "");
  if (!exerciseId) return;

  button.disabled = true;
  button.textContent = "Loading movement…";
  card.classList.remove("movement-preview-error");
  card.querySelector(".movement-preview-error-message")?.remove();

  try {
    const exercise = (await getExerciseMap()).get(exerciseId);
    if (!card.isConnected) return;
    if (!exercise?.gif_url) {
      showPreviewError(card, button, "Movement preview is unavailable for this exercise. Written instructions are still available.");
      return;
    }

    stopOtherMovementPreviews(card);
    image.dataset.stillSrc ||= image.currentSrc || image.src;
    image.src = mediaUrl(exercise.gif_url);
    card.classList.add("movement-previewing");
    button.textContent = "Show still";
    button.setAttribute("aria-expanded", "true");
    button.disabled = false;
  } catch {
    if (card.isConnected) showPreviewError(card, button);
  }
}

function enhanceReplacementScope(dialogContent) {
  const scope = dialogContent.querySelector(".replacement-scope");
  if (!scope) return;
  const paragraph = scope.querySelector("p");
  const heading = scope.querySelector("strong");
  if (!paragraph || !heading) return;

  const resolved = replacementScopeLabel(paragraph.textContent);
  scope.dataset.scope = resolved.key;
  heading.textContent = resolved.label;
}

function enhanceReplacementCards(dialogContent) {
  dialogContent.querySelectorAll(".replacement-option").forEach((card) => {
    if (card.querySelector(".movement-preview-toggle")) return;
    const chooseButton = card.querySelector(".choose-replacement[data-id]");
    const details = card.querySelector(".replacement-preview");
    const content = chooseButton?.previousElementSibling;
    if (!chooseButton || !content) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn small ghost movement-preview-toggle";
    button.textContent = "Preview movement";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", `Preview movement for ${content.querySelector("strong")?.textContent || "this exercise"}`);

    if (details && details.parentElement === content) {
      content.insertBefore(button, details);
    } else {
      content.append(button);
    }
  });
}

function enhanceReplacementDialog() {
  const dialog = document.getElementById("exerciseDialog");
  const dialogContent = document.getElementById("exerciseDialogContent");
  if (!dialog || !dialogContent) return;

  const replacementActive = Boolean(dialogContent.querySelector(".replacement-list"));
  dialog.classList.toggle("replacement-dialog-active", replacementActive);
  if (!replacementActive) {
    dialog.setAttribute("aria-label", "Exercise details and choices");
    return;
  }

  dialog.setAttribute("aria-label", "Choose an exercise substitute");
  enhanceReplacementScope(dialogContent);
  enhanceReplacementCards(dialogContent);
}

function enhanceRestTimer() {
  const sessionView = document.getElementById("sessionView");
  const dock = document.querySelector("#restTimer .rest-timer");
  sessionView?.classList.toggle("rest-dock-visible", Boolean(dock));
  if (!dock) return;

  const state = restTimerState(dock.textContent);
  dock.dataset.timerState = state;
  const labelHost = dock.querySelector(".rest-readout") || dock.firstElementChild;
  if (!labelHost || labelHost.querySelector(".rest-state-label")) return;

  const label = document.createElement("span");
  label.className = "rest-state-label";
  label.textContent = restTimerStateLabel(state);
  labelHost.prepend(label);
}

function installUxPolish() {
  const sessionView = document.getElementById("sessionView");
  const dialogContent = document.getElementById("exerciseDialogContent");

  if (sessionView) {
    new MutationObserver(enhanceRestTimer).observe(sessionView, { childList: true, subtree: true });
    enhanceRestTimer();
  }

  if (dialogContent) {
    new MutationObserver(enhanceReplacementDialog).observe(dialogContent, { childList: true, subtree: true });
    dialogContent.addEventListener("click", (event) => {
      const button = event.target.closest?.(".movement-preview-toggle");
      if (button) void toggleMovementPreview(button);
    });
    enhanceReplacementDialog();
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installUxPolish, { once: true });
  } else {
    installUxPolish();
  }
}
