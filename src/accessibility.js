const ACTION_BUTTON_SELECTOR = [
  "#bottomNav button",
  "#closeExerciseDialog",
  "#closeGuideDialog",
  ".inspect-exercise",
  ".substitute-exercise",
  "#continueLater",
  "#acceptProgram",
  "#anotherProgram",
  "#adjustProfile",
  "#continueDraft",
  "#newDraft",
  "#editDraftProfile",
  "#startSession",
  "#previewRoutine",
  "#exitSession",
  "#toggleMedia",
  "#replaceToday",
  "#replaceRoutine",
  "#machineUnavailable",
  "#prevExercise",
  "#nextExercise",
  "#routineContinueDraft",
  "#profileContinueDraft",
  "#editProfile",
  "#exportData",
  "#resetData",
  "#resetGym",
  "#retryDataset",
].join(",");

const PLANNER_TAB_IDS = {
  overview: ["plannerTabOverview", "plannerPanelOverview"],
  week: ["plannerTabWeek", "plannerPanelWeek"],
  analysis: ["plannerTabAnalysis", "plannerPanelAnalysis"],
};

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function matchingElements(root, selector) {
  const elements = [];
  if (root instanceof Element && root.matches(selector)) elements.push(root);
  if (root?.querySelectorAll) elements.push(...root.querySelectorAll(selector));
  return elements;
}

function ensureActionButtonTypes(root = document) {
  matchingElements(root, ACTION_BUTTON_SELECTOR).forEach((button) => {
    if (!button.hasAttribute("type")) button.setAttribute("type", "button");
  });
}

function syncPlannerSemantics(root = document) {
  const tabs = [...root.querySelectorAll?.("[data-planner-tab][role='tab']") || []];
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    const key = tab.dataset.plannerTab;
    const ids = PLANNER_TAB_IDS[key];
    if (!ids) return;
    const [tabId, panelId] = ids;
    tab.id = tabId;
    tab.setAttribute("aria-controls", panelId);
    tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;

    const panel = document.querySelector(`[data-planner-panel="${key}"]`);
    if (!panel) return;
    panel.id = panelId;
    panel.setAttribute("aria-labelledby", tabId);
    panel.tabIndex = 0;
  });
}

function syncSessionSemantics(root = document) {
  const painButton = root.querySelector?.("#reportPain");
  if (painButton) painButton.setAttribute("aria-controls", "painGuidance");

  const mediaButton = root.querySelector?.("#toggleMedia");
  if (mediaButton) {
    mediaButton.setAttribute("aria-pressed", String(mediaButton.textContent.trim() === "Show image"));
  }
}

function syncTodayProgress(root = document) {
  const card = root.querySelector?.("#todayView .today-card") || document.querySelector("#todayView .today-card");
  if (!card) return;
  const progress = card.querySelector(".progress-track");
  const metric = card.querySelector(".metric strong")?.textContent || "";
  const match = metric.match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
  if (!progress || !match) return;

  const completed = Number(match[1]);
  const total = Number(match[2]);
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", "Programme sessions completed");
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", String(total));
  progress.setAttribute("aria-valuenow", String(completed));
}

function enhance(root = document) {
  ensureActionButtonTypes(root);
  syncPlannerSemantics(document);
  syncSessionSemantics(document);
  syncTodayProgress(document);
}

let activeViewId = null;
function focusActiveViewHeading() {
  const activeView = document.querySelector(".view.active");
  if (!activeView || activeView.id === activeViewId) return;
  activeViewId = activeView.id;
  requestAnimationFrame(() => {
    const heading = activeView.querySelector("h1");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  });
}

function moveTab(event, selector, dataKey) {
  const current = event.target.closest(selector);
  if (!current) return false;
  const tabs = [...document.querySelectorAll(selector)];
  const index = tabs.indexOf(current);
  if (index < 0) return false;

  let nextIndex;
  if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = tabs.length - 1;
  else if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
  else return false;

  event.preventDefault();
  event.stopImmediatePropagation();
  const nextValue = tabs[nextIndex].dataset[dataKey];
  tabs[nextIndex].click();
  queueMicrotask(() => {
    enhance(document);
    document.querySelector(`${selector}[data-${dataKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}="${nextValue}"]`)?.focus();
  });
  return true;
}

document.addEventListener(
  "keydown",
  (event) => {
    if (["Home", "End"].includes(event.key) && event.target.closest("[data-guide-section][role='tab']")) {
      moveTab(event, "[data-guide-section][role='tab']", "guideSection");
      return;
    }
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      moveTab(event, "[data-planner-tab][role='tab']", "plannerTab");
    }
  },
  true,
);

document.addEventListener(
  "click",
  (event) => {
    if (prefersReducedMotion() && event.target.closest("#reviewPlannerIssues")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelectorAll(".planner-workout").forEach((details) => {
        details.open = details.dataset.hasIssues === "true";
      });
      document
        .querySelector(".planner-workout[data-has-issues='true']")
        ?.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }

    if (event.target.closest("#toggleMedia, [data-planner-tab]")) {
      queueMicrotask(() => enhance(document));
    }
  },
  true,
);

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) enhance(node);
    });
  });
  enhance(document);
  focusActiveViewHeading();
});

observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["class", "hidden", "aria-selected"],
});

enhance(document);
focusActiveViewHeading();
