const personalize = () => {
  document.querySelectorAll(".substitute-exercise[data-scope='routine']").forEach((button) => {
    button.textContent = "Replace";
    button.setAttribute("aria-label", "Replace this exercise in this workout/day");
  });
  const planner = document.querySelector("#plannerView");
  if (planner?.classList.contains("active") && !planner.querySelector(".accept-personalization-note")) {
    const actions = planner.querySelector(".planner-actions");
    if (actions) actions.insertAdjacentHTML("beforebegin", '<div class="notice accept-personalization-note"><strong>Balanced first, personal after acceptance</strong><p>Accept this balanced programme as your starting point. You can replace individual exercises later from Routine or Exercises without rebuilding the whole programme.</p></div>');
  }
};
new MutationObserver(() => setTimeout(personalize, 0)).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
setTimeout(personalize, 0);
