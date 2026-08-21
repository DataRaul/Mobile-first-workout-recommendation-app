import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const relative = normalize(pathname.replace(/^\/+/, ""));
    const filePath = join(root, relative);
    if (!filePath.startsWith(root)) throw new Error("Invalid path");
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": mime[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}/`;
let browser;

const stateFromPage = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("workout-recommender.state.v2") || "null"));
const waitForDataset = async (page) => {
  await page.waitForFunction(() => document.querySelector("#datasetBadge")?.textContent?.includes("1,324"), null, { timeout: 20_000 });
};
const waitForState = (page, predicateSource, arg) => page.waitForFunction(
  ({ source, arg }) => {
    const current = JSON.parse(localStorage.getItem("workout-recommender.state.v2") || "null");
    return Function("state", "arg", `return (${source})(state, arg);`)(current, arg);
  },
  { source: predicateSource, arg },
  { timeout: 5_000 },
);

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", (dialog) => void dialog.accept());

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await waitForDataset(page);
  await page.waitForSelector("#onboardingView.active");
  assert.equal(await page.locator("#bottomNav").evaluate((node) => node.hidden), true, "navigation stays hidden during first-time setup");

  await page.click("#nextProfileStep");
  await page.click("#nextProfileStep");
  await page.waitForSelector("#submitProfile:not([hidden])");
  await page.click("#submitProfile");
  await page.waitForSelector("#plannerView.active");
  await page.waitForSelector("#acceptProgram");

  let current = await stateFromPage(page);
  assert.ok(current?.profile, "profile is persisted after onboarding");
  assert.ok(current?.draftProgram?.workouts?.length, "programme draft is generated from the profile");

  await page.click("#acceptProgram");
  await page.waitForSelector("#todayView.active");
  current = await stateFromPage(page);
  assert.ok(current.activeProgram?.workouts?.length, "accepted programme is persisted");
  assert.equal(current.draftProgram, null, "accepting clears the draft");
  assert.equal(await page.locator("#bottomNav").evaluate((node) => node.hidden), false, "main navigation is visible after acceptance");

  await page.click("#bottomNav button[data-view='exercisesView']");
  await page.waitForSelector("#exercisesView.active");
  await page.fill("#exerciseSearch", "no-such-exercise-browser-regression");
  await page.waitForFunction(() => document.querySelector("#browserCount")?.textContent?.includes("0 matching exercises"));
  await page.fill("#exerciseSearch", "");
  const firstFavorite = page.locator(".favorite-exercise").first();
  await firstFavorite.waitFor();
  const favoriteId = await firstFavorite.getAttribute("data-favorite-id");
  await firstFavorite.click();
  await waitForState(page, "(state, arg) => state.profile.favorites.some((id) => String(id) === String(arg))", favoriteId);
  const favoritesFilter = page.locator("#favoritesFilter");
  const favoritesFilterLabel = page.locator("#favoritesFilterLabel");
  await favoritesFilterLabel.evaluate((node) => node.scrollIntoView({ block: "center" }));
  await favoritesFilterLabel.click();
  assert.equal(await favoritesFilter.isChecked(), true, "favorites-only filter can be toggled through its visible label");
  await page.locator(`.favorite-exercise[data-favorite-id='${favoriteId}']`).waitFor();
  await favoritesFilterLabel.click();
  assert.equal(await favoritesFilter.isChecked(), false, "favorites-only filter can be cleared through its visible label");
  await page.locator(".exercise-card-open").first().click();
  await page.waitForSelector("#exerciseDialog[open]");
  await page.click("#closeExerciseDialog");
  await page.waitForFunction(() => !document.querySelector("#exerciseDialog")?.open);

  await page.click("#bottomNav button[data-view='routineView']");
  await page.waitForSelector("#routineView.active");
  const routineReplace = page.locator(".substitute-exercise[data-scope='routine']").first();
  await routineReplace.waitFor();
  const routineWorkoutId = await routineReplace.getAttribute("data-workout-id");
  const routineIndex = Number(await routineReplace.getAttribute("data-index"));
  current = await stateFromPage(page);
  const originalRoutineId = current.activeProgram.workouts.find((workout) => workout.id === routineWorkoutId).exercises[routineIndex].exerciseId;

  await routineReplace.click();
  await page.waitForSelector("#exercisesView.active");
  const routineCandidate = page.locator(".custom-replace-now").first();
  await routineCandidate.waitFor();
  const routineCandidateId = await routineCandidate.getAttribute("data-custom-id");
  assert.notEqual(String(routineCandidateId), String(originalRoutineId), "routine replacement candidate differs from current exercise");
  await routineCandidate.click();
  await waitForState(page, "(state, arg) => String(state.activeProgram.workouts.find((workout) => workout.id === arg.workoutId).exercises[arg.index].exerciseId) === String(arg.candidateId)", {
    workoutId: routineWorkoutId,
    index: routineIndex,
    candidateId: routineCandidateId,
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForDataset(page);
  await page.waitForSelector("#todayView.active");
  current = await stateFromPage(page);
  assert.equal(String(current.activeProgram.workouts.find((workout) => workout.id === routineWorkoutId).exercises[routineIndex].exerciseId), String(routineCandidateId), "routine replacement survives a full application reload");

  await page.click("#startSession");
  await page.waitForSelector("#sessionView.active");
  current = await stateFromPage(page);
  assert.ok(current.activeSession, "starting a workout creates an active session");
  const sessionWorkoutId = current.activeSession.workoutId;
  const startingSessionIndex = current.activeSession.currentIndex;
  const expectedTemplateId = current.activeProgram.workouts.find((workout) => workout.id === sessionWorkoutId).exercises[startingSessionIndex].exerciseId;
  assert.equal(String(current.activeSession.exercises[startingSessionIndex].exerciseId), String(expectedTemplateId), "session starts from the accepted routine template");

  await page.click("#exitSession");
  await page.waitForSelector("#todayView.active");
  current = await stateFromPage(page);
  assert.ok(current.activeSession, "exiting a workout preserves the active session");
  assert.match(await page.locator("#startSession").textContent(), /Resume workout/i, "Today exposes resume after exiting an active workout");
  await page.click("#startSession");
  await page.waitForSelector("#sessionView.active");

  await page.click("#startRestNow");
  await waitForState(page, "(state) => state.activeSession.timer?.status === 'active'");
  const initialTimer = (await stateFromPage(page)).activeSession.timer;
  await page.click("#toggleRestPause");
  await waitForState(page, "(state) => state.activeSession.timer?.status === 'paused'");
  const pausedBeforeAdd = (await stateFromPage(page)).activeSession.timer.pausedRemainingSeconds;
  await page.click("#restPlus15");
  const pausedAfterAdd = (await stateFromPage(page)).activeSession.timer.pausedRemainingSeconds;
  assert.ok(pausedAfterAdd >= pausedBeforeAdd + 14, "timer +15 control updates paused time");

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForDataset(page);
  await page.waitForSelector("#sessionView.active");
  current = await stateFromPage(page);
  assert.equal(current.activeSession.timer?.status, "paused", "paused rest timer survives reload without resetting");
  assert.ok(current.activeSession.timer.pausedRemainingSeconds >= pausedAfterAdd - 1, "paused timer retains its adjusted remaining time across reload");
  await page.click("#toggleRestPause");
  await waitForState(page, "(state) => state.activeSession.timer?.status === 'active'");
  await page.click("#skipRest");
  await waitForState(page, "(state) => state.activeSession.timer?.status === 'cancelled'");
  assert.ok(initialTimer.durationSeconds > 0, "timer starts with a positive duration");

  const currentRow = page.locator(".set-row.current");
  await currentRow.locator("input[data-field='reps']").fill("8");
  await currentRow.locator("input[data-field='rir']").fill("2");
  await currentRow.locator("button[data-action='set-done']").click();
  await waitForState(page, "(state) => state.activeSession.exercises[state.activeSession.currentIndex].setsLog[0].done === true");
  assert.equal((await stateFromPage(page)).activeSession.exercises[startingSessionIndex].setsLog[0].reps, "8", "set repetitions persist after completion");
  if (await page.locator("#skipRest").count()) await page.click("#skipRest");

  await page.click("#reportPain");
  assert.equal(await page.locator("#painGuidance").evaluate((node) => node.hidden), false, "pain guidance opens from the workout control");
  await page.click("#clearPainReport");
  assert.equal(await page.locator("#painGuidance").evaluate((node) => node.hidden), true, "pain guidance can be dismissed");

  const mediaBefore = await page.locator("#toggleMedia").textContent();
  await page.click("#toggleMedia");
  assert.notEqual(await page.locator("#toggleMedia").textContent(), mediaBefore, "exercise visual toggle remains interactive");

  current = await stateFromPage(page);
  const todayOnlyTemplateId = current.activeProgram.workouts.find((workout) => workout.id === sessionWorkoutId).exercises[startingSessionIndex].exerciseId;
  const todayOnlyOldSessionId = current.activeSession.exercises[startingSessionIndex].exerciseId;
  await page.click("#replaceToday");
  await page.waitForSelector("#exerciseDialog[open]");
  const todayOnlyChoice = page.locator("#exerciseDialog .choose-replacement").first();
  await todayOnlyChoice.waitFor();
  const todayOnlyCandidateId = await todayOnlyChoice.getAttribute("data-id");
  await todayOnlyChoice.click();
  await waitForState(page, "(state, arg) => String(state.activeSession.exercises[state.activeSession.currentIndex].exerciseId) === String(arg)", todayOnlyCandidateId);
  current = await stateFromPage(page);
  assert.notEqual(String(current.activeSession.exercises[startingSessionIndex].exerciseId), String(todayOnlyOldSessionId), "today-only substitution changes the active session");
  assert.equal(String(current.activeProgram.workouts.find((workout) => workout.id === sessionWorkoutId).exercises[startingSessionIndex].exerciseId), String(todayOnlyTemplateId), "today-only substitution leaves the future routine unchanged");

  const sessionIdBeforePermanent = current.activeSession.exercises[startingSessionIndex].exerciseId;
  await page.click("#replaceRoutine");
  await page.waitForSelector("#exerciseDialog[open]");
  const permanentChoice = page.locator("#exerciseDialog .choose-replacement").first();
  await permanentChoice.waitFor();
  const permanentCandidateId = await permanentChoice.getAttribute("data-id");
  assert.notEqual(String(permanentCandidateId), String(sessionIdBeforePermanent), "permanent substitution candidate differs from current session exercise");
  await permanentChoice.click();
  await waitForState(page, "(state, arg) => String(state.activeSession.exercises[state.activeSession.currentIndex].exerciseId) === String(arg)", permanentCandidateId);
  current = await stateFromPage(page);
  assert.equal(String(current.activeProgram.workouts.find((workout) => workout.id === sessionWorkoutId).exercises[startingSessionIndex].exerciseId), String(permanentCandidateId), "routine substitution from an already modified session updates the exact future routine slot");

  const unavailableOldId = current.activeSession.exercises[startingSessionIndex].exerciseId;
  await page.click("#machineUnavailable");
  await page.waitForSelector("#exerciseDialog[open]");
  const unavailableChoice = page.locator("#exerciseDialog .choose-replacement").first();
  await unavailableChoice.waitFor();
  const unavailableCandidateId = await unavailableChoice.getAttribute("data-id");
  assert.notEqual(String(unavailableCandidateId), String(unavailableOldId), "unavailable-machine replacement differs from the unavailable exercise");
  await unavailableChoice.click();
  await waitForState(page, "(state, arg) => state.gym.unavailableExerciseIds.some((id) => String(id) === String(arg))", unavailableOldId);
  current = await stateFromPage(page);
  assert.equal(String(current.activeProgram.workouts.find((workout) => workout.id === sessionWorkoutId).exercises[startingSessionIndex].exerciseId), String(unavailableCandidateId), "marking an exercise unavailable updates the same future routine slot");

  while ((current = await stateFromPage(page)).activeSession) {
    const session = current.activeSession;
    const item = session.exercises[session.currentIndex];
    for (let setIndex = 0; setIndex < item.setsLog.length; setIndex += 1) {
      const latest = await stateFromPage(page);
      if (latest.activeSession.exercises[latest.activeSession.currentIndex].setsLog[setIndex].done) continue;
      const row = page.locator(`.set-row[data-set='${setIndex}']`);
      await row.locator("input[data-field='reps']").fill("8");
      await row.locator("input[data-field='rir']").fill("2");
      await row.locator("button[data-action='set-done']").click();
      await waitForState(page, "(state, arg) => state.activeSession.exercises[state.activeSession.currentIndex].setsLog[arg].done === true", setIndex);
      if (await page.locator("#skipRest").count()) await page.click("#skipRest");
    }

    const beforeNext = await stateFromPage(page);
    const lastExercise = beforeNext.activeSession.currentIndex === beforeNext.activeSession.exercises.length - 1;
    await page.click("#nextExercise");
    if (lastExercise) {
      await waitForState(page, "(state) => state.activeSession === null");
      break;
    }
    await waitForState(page, "(state, arg) => state.activeSession.currentIndex === arg", beforeNext.activeSession.currentIndex + 1);
  }

  await page.waitForSelector("#progressView.active");
  current = await stateFromPage(page);
  assert.equal(current.history.length, 1, "completed workout is written to history");
  assert.equal(current.history[0].status, "completed", "fully logged workout is stored as completed");
  assert.equal(current.activeSession, null, "completed workout clears the active session");
  assert.equal(current.activeProgram.completedSessions, 1, "completed workout advances the programme once");

  await page.locator(".history-session").first().locator("summary").click();
  await page.locator(".correct-history").first().click();
  await page.waitForSelector("#exerciseDialog[open]");
  const firstCorrectedReps = page.locator("#historyCorrectionForm input[data-field='reps']").first();
  await firstCorrectedReps.fill("9");
  await page.click("#historyCorrectionForm button[type='submit']");
  await waitForState(page, "(state) => state.history[0].exercises[0].setsLog.find((set) => set.done)?.reps === '9'");
  current = await stateFromPage(page);
  assert.ok(current.history[0].editedAt, "history correction records an edit timestamp");

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForDataset(page);
  await page.waitForSelector("#todayView.active");
  current = await stateFromPage(page);
  assert.equal(current.history.length, 1, "history survives a full application reload");
  assert.equal(current.activeProgram.completedSessions, 1, "programme progress survives reload");
  assert.equal(current.history[0].exercises[0].setsLog.find((set) => set.done)?.reps, "9", "corrected history values survive reload");

  await page.click("#bottomNav button[data-view='progressView']");
  await page.waitForSelector("#progressView.active");
  assert.match(await page.locator("#progressView").innerText(), /completed|workout|history/i, "progress view renders recorded training history");

  await page.click("#bottomNav button[data-view='profileView']");
  await page.waitForSelector("#profileView.active");
  assert.ok((await stateFromPage(page)).gym.unavailableExerciseIds.length >= 1, "gym-learning state retains unavailable exercise choices");
  assert.equal(await page.locator("#resetGym").isDisabled(), false, "gym-learning reset is available when unavailable items exist");
  await page.click("#resetGym");
  await waitForState(page, "(state) => state.gym.unavailableExerciseIds.length === 0");
  const timerPreference = page.locator("#profileUseRestTimer");
  const timerPreferenceLabel = page.locator("label.option:has(#profileUseRestTimer) span");
  const timerPreferenceBefore = await timerPreference.isChecked();
  await timerPreferenceLabel.evaluate((node) => node.scrollIntoView({ block: "center" }));
  await timerPreferenceLabel.click();
  assert.equal(await timerPreference.isChecked(), !timerPreferenceBefore, "rest-timer preference toggles through its visible label");
  await waitForState(page, "(state, arg) => state.preferences.useRestTimer === arg", !timerPreferenceBefore);
  await timerPreferenceLabel.click();
  assert.equal(await timerPreference.isChecked(), timerPreferenceBefore, "rest-timer preference can be restored through its visible label");
  await waitForState(page, "(state, arg) => state.preferences.useRestTimer === arg", timerPreferenceBefore);

  await page.click("#bottomNav button[data-view='todayView']");
  await page.waitForSelector("#todayView.active");
  current = await stateFromPage(page);
  const completedBeforePartial = current.activeProgram.completedSessions;
  const nextWorkoutIndexBeforePartial = current.activeProgram.nextWorkoutIndex;
  await page.click("#startSession");
  await page.waitForSelector("#sessionView.active");
  while (true) {
    const partialState = await stateFromPage(page);
    const isLast = partialState.activeSession.currentIndex === partialState.activeSession.exercises.length - 1;
    await page.click("#nextExercise");
    if (isLast) break;
    await waitForState(page, "(state, arg) => state.activeSession?.currentIndex === arg", partialState.activeSession.currentIndex + 1);
  }
  await waitForState(page, "(state) => state.activeSession === null");
  await page.waitForSelector("#progressView.active");
  current = await stateFromPage(page);
  assert.equal(current.history.length, 2, "partial workout is retained as a distinct history record");
  assert.equal(current.history[1].status, "partial", "unfinished workout is explicitly stored as partial");
  assert.equal(current.activeProgram.completedSessions, completedBeforePartial, "partial workout does not advance completed-session count");
  assert.equal(current.activeProgram.nextWorkoutIndex, nextWorkoutIndexBeforePartial, "partial workout does not advance the routine position");

  assert.deepEqual(pageErrors, [], `real app user-flow run must not raise browser errors: ${pageErrors.join(" | ")}`);
  await context.close();
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log("Full Chromium user-flow regression passed: onboarding, programme, exercise library, routine persistence, workout resume, timer persistence, substitutions, gym learning, completion, history correction, partial-session handling and profile preferences all work end-to-end.");
