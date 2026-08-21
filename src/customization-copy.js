const ROUTINE_REPLACEMENT_LABEL = "Replace this exercise in this workout/day";

export function syncRoutineReplacementCopy(button) {
  if (!button) return false;
  let changed = false;
  if (button.textContent !== "Replace") {
    button.textContent = "Replace";
    changed = true;
  }
  if (button.getAttribute?.("aria-label") !== ROUTINE_REPLACEMENT_LABEL) {
    button.setAttribute?.("aria-label", ROUTINE_REPLACEMENT_LABEL);
    changed = true;
  }
  return changed;
}

export function personalize(root = document) {
  let mutations = 0;
  root.querySelectorAll(".substitute-exercise[data-scope='routine']").forEach((button) => {
    if (syncRoutineReplacementCopy(button)) mutations += 1;
  });
  const planner = root.querySelector("#plannerView");
  if (planner?.classList.contains("active") && !planner.querySelector(".accept-personalization-note")) {
    const actions = planner.querySelector(".planner-actions");
    if (actions) {
      actions.insertAdjacentHTML("beforebegin", '<div class="notice accept-personalization-note"><strong>Balanced first, personal after acceptance</strong><p>Accept this balanced programme as your starting point. You can replace individual exercises later from Routine or Exercises without rebuilding the whole programme.</p></div>');
      mutations += 1;
    }
  }
  return mutations;
}

export function installCustomizationCopy(root = document, MutationObserverClass = MutationObserver) {
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      personalize(root);
    }, 0);
  };
  const observer = new MutationObserverClass(schedule);
  observer.observe(root.documentElement || root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });
  schedule();
  return observer;
}

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  installCustomizationCopy();
}
