from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text()


def write(path, text):
    (ROOT / path).write_text(text)


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected exactly one match, found {count}: {old[:80]!r}")
    write(path, text.replace(old, new, 1))


def append_once(path, marker, block):
    text = read(path)
    if marker not in text:
        write(path, text.rstrip() + "\n\n" + block.strip() + "\n")


# Versioning and cache coherence.
replace_once("src/config.js", 'export const APP_VERSION = "3.8.0";', 'export const APP_VERSION = "3.9.0";')
replace_once("package.json", '"version": "3.8.0"', '"version": "3.9.0"')
replace_once(
    "service-worker.js",
    'const CACHE = "workout-recommender-v3.8.0-exercise-customization-20260816";',
    'const CACHE = "workout-recommender-v3.9.0-timer-ux-20260818";',
)

# Backward-compatible state migration and persistent timer preferences.
replace_once("src/storage.js", "  schemaVersion: 2,", "  schemaVersion: 3,")
replace_once(
    "src/storage.js",
    '    weightUnit: "kg",\n',
    '    weightUnit: "kg",\n    useRestTimer: true,\n    defaultRestSeconds: null,\n    keepScreenAwake: false,\n',
)
replace_once(
    "src/storage.js",
    "    ...value,\n    history: Array.isArray(value.history) ? value.history : [],",
    "    ...value,\n    schemaVersion: 3,\n    history: Array.isArray(value.history) ? value.history : [],",
)
replace_once(
    "src/storage.js",
    '  normalized.preferences.weightUnit = normalized.preferences.weightUnit === "lb" ? "lb" : "kg";\n',
    '''  normalized.preferences.weightUnit = normalized.preferences.weightUnit === "lb" ? "lb" : "kg";\n  normalized.preferences.useRestTimer = normalized.preferences.useRestTimer !== false;\n  const preferredRest = Number(normalized.preferences.defaultRestSeconds);\n  normalized.preferences.defaultRestSeconds =\n    Number.isFinite(preferredRest) && preferredRest > 0\n      ? Math.min(600, Math.max(15, Math.round(preferredRest)))\n      : null;\n  normalized.preferences.keepScreenAwake = normalized.preferences.keepScreenAwake === true;\n\n  if (normalized.activeSession) {\n    const legacyEndsAt = Number(normalized.activeSession.restTimerEndsAt) || null;\n    const sourceTimer = normalized.activeSession.timer || null;\n    const allowedStatuses = new Set(["active", "paused", "completed", "cancelled"]);\n    const status = allowedStatuses.has(sourceTimer?.status)\n      ? sourceTimer.status\n      : legacyEndsAt\n        ? "active"\n        : null;\n\n    let timer = null;\n    if (status) {\n      const duration = Number(sourceTimer?.durationSeconds);\n      const recommended = Number(sourceTimer?.recommendedRestSeconds);\n      const pausedRemaining = Number(sourceTimer?.pausedRemainingSeconds);\n      const endsAt = Number(sourceTimer?.endsAt) || legacyEndsAt;\n      timer = {\n        status,\n        startedAt: Number(sourceTimer?.startedAt) || null,\n        endsAt: status === "active" ? endsAt || null : null,\n        durationSeconds:\n          Number.isFinite(duration) && duration > 0\n            ? Math.min(3600, Math.max(1, Math.round(duration)))\n            : legacyEndsAt\n              ? Math.max(1, Math.ceil((legacyEndsAt - Date.now()) / 1000))\n              : null,\n        recommendedRestSeconds:\n          Number.isFinite(recommended) && recommended > 0 ? Math.round(recommended) : null,\n        pausedRemainingSeconds:\n          status === "paused" && Number.isFinite(pausedRemaining)\n            ? Math.max(0, Math.round(pausedRemaining))\n            : null,\n        completedAt: Number(sourceTimer?.completedAt) || null,\n        cancelledAt: Number(sourceTimer?.cancelledAt) || null,\n      };\n    }\n\n    normalized.activeSession = { ...normalized.activeSession, timer };\n    delete normalized.activeSession.restTimerEndsAt;\n  }\n''',
)
replace_once(
    "src/storage.js",
    "    if (saved?.schemaVersion === 2) {\n      return normalizeState(saved);\n    }",
    "    if ([2, 3].includes(saved?.schemaVersion)) {\n      return normalizeState(saved);\n    }",
)
replace_once(
    "src/storage.js",
    '  if (parsed?.schemaVersion !== 2) throw new Error("This is not a Workout Recommender v2 export.");',
    '  if (![2, 3].includes(parsed?.schemaVersion)) throw new Error("This is not a supported Workout Recommender export.");',
)

# Pure, deadline-based timer state transitions. Existing restTimerEnd/restSecondsRemaining remain for compatibility.
replace_once(
    "src/session.js",
    '''export function restSecondsRemaining(endTimestamp, now = Date.now()) {\n  if (!endTimestamp) return 0;\n  return Math.max(0, Math.ceil((Number(endTimestamp) - now) / 1000));\n}\n''',
    '''export function restSecondsRemaining(endTimestamp, now = Date.now()) {\n  if (!endTimestamp) return 0;\n  return Math.max(0, Math.ceil((Number(endTimestamp) - now) / 1000));\n}\n\nexport function normalizeRestDuration(seconds, fallback = null) {\n  const value = Number(seconds);\n  if (!Number.isFinite(value) || value <= 0) return fallback;\n  return Math.min(3600, Math.max(1, Math.round(value)));\n}\n\nexport function createRestTimer(\n  durationSeconds,\n  { now = Date.now(), recommendedRestSeconds = null } = {},\n) {\n  const duration = normalizeRestDuration(durationSeconds, 0);\n  const recommended = normalizeRestDuration(recommendedRestSeconds, null);\n  return {\n    status: duration > 0 ? "active" : "cancelled",\n    startedAt: now,\n    endsAt: duration > 0 ? now + duration * 1000 : null,\n    durationSeconds: duration,\n    recommendedRestSeconds: recommended,\n    pausedRemainingSeconds: null,\n    completedAt: null,\n    cancelledAt: duration > 0 ? null : now,\n  };\n}\n\nexport function restTimerRemaining(timer, now = Date.now()) {\n  if (!timer) return 0;\n  if (timer.status === "paused") {\n    return Math.max(0, Number(timer.pausedRemainingSeconds) || 0);\n  }\n  if (timer.status !== "active") return 0;\n  return restSecondsRemaining(timer.endsAt, now);\n}\n\nexport function reconcileRestTimer(timer, now = Date.now()) {\n  if (!timer || timer.status !== "active") return timer;\n  if (restTimerRemaining(timer, now) > 0) return timer;\n  return {\n    ...timer,\n    status: "completed",\n    endsAt: null,\n    pausedRemainingSeconds: 0,\n    completedAt: now,\n  };\n}\n\nexport function pauseRestTimer(timer, now = Date.now()) {\n  if (!timer || timer.status !== "active") return timer;\n  const remaining = restTimerRemaining(timer, now);\n  if (remaining <= 0) return reconcileRestTimer(timer, now);\n  return {\n    ...timer,\n    status: "paused",\n    endsAt: null,\n    pausedRemainingSeconds: remaining,\n  };\n}\n\nexport function resumeRestTimer(timer, now = Date.now()) {\n  if (!timer || timer.status !== "paused") return timer;\n  const remaining = Math.max(0, Number(timer.pausedRemainingSeconds) || 0);\n  if (remaining <= 0) {\n    return { ...timer, status: "completed", pausedRemainingSeconds: 0, completedAt: now };\n  }\n  return {\n    ...timer,\n    status: "active",\n    endsAt: now + remaining * 1000,\n    pausedRemainingSeconds: null,\n  };\n}\n\nexport function adjustRestTimer(timer, deltaSeconds, now = Date.now()) {\n  if (!timer || !["active", "paused"].includes(timer.status)) return timer;\n  const adjusted = Math.min(3600, Math.max(0, restTimerRemaining(timer, now) + Number(deltaSeconds || 0)));\n  if (adjusted <= 0) {\n    return {\n      ...timer,\n      status: "completed",\n      endsAt: null,\n      pausedRemainingSeconds: 0,\n      completedAt: now,\n    };\n  }\n  if (timer.status === "paused") {\n    return { ...timer, pausedRemainingSeconds: adjusted };\n  }\n  return { ...timer, endsAt: now + adjusted * 1000 };\n}\n\nexport function resetRestTimer(timer, durationSeconds = timer?.durationSeconds, now = Date.now()) {\n  return createRestTimer(durationSeconds, {\n    now,\n    recommendedRestSeconds: timer?.recommendedRestSeconds ?? null,\n  });\n}\n\nexport function cancelRestTimer(timer, now = Date.now()) {\n  return {\n    ...(timer || {}),\n    status: "cancelled",\n    endsAt: null,\n    pausedRemainingSeconds: 0,\n    completedAt: null,\n    cancelledAt: now,\n  };\n}\n''',
)

# App imports and runtime state.
replace_once(
    "src/app.js",
    '''  latestRecordedSession,\n  invalidCompletedSets,\n  READINESS_GUIDANCE,\n  restSecondsRemaining,\n  restTimerEnd,\n  sessionCompletion,''',
    '''  latestRecordedSession,\n  invalidCompletedSets,\n  READINESS_GUIDANCE,\n  adjustRestTimer,\n  cancelRestTimer,\n  createRestTimer,\n  pauseRestTimer,\n  reconcileRestTimer,\n  resetRestTimer,\n  restTimerRemaining,\n  resumeRestTimer,\n  sessionCompletion,''',
)
replace_once(
    "src/app.js",
    "let restInterval = null;\nlet updateAvailable = false;",
    "let restInterval = null;\nlet wakeLockSentinel = null;\nlet updateAvailable = false;",
)
replace_once(
    "src/app.js",
    '''  window.scrollTo({ top: 0, behavior: "auto" });\n}\n\nfunction exerciseById(id) {''',
    '''  window.scrollTo({ top: 0, behavior: "auto" });\n  void syncWakeLock(viewId === "sessionView");\n}\n\nasync function releaseWakeLock() {\n  const sentinel = wakeLockSentinel;\n  wakeLockSentinel = null;\n  if (!sentinel) return;\n  try {\n    await sentinel.release();\n  } catch {\n    // Wake Lock is best-effort only.\n  }\n}\n\nasync function syncWakeLock(workoutVisible = $("#sessionView")?.classList.contains("active")) {\n  const shouldHold =\n    Boolean(state.preferences?.keepScreenAwake) &&\n    Boolean(state.activeSession) &&\n    Boolean(workoutVisible) &&\n    !document.hidden &&\n    Boolean(navigator.wakeLock?.request);\n\n  if (!shouldHold) {\n    await releaseWakeLock();\n    return;\n  }\n  if (wakeLockSentinel) return;\n  try {\n    wakeLockSentinel = await navigator.wakeLock.request("screen");\n    wakeLockSentinel.addEventListener(\n      "release",\n      () => {\n        wakeLockSentinel = null;\n      },\n      { once: true },\n    );\n  } catch {\n    wakeLockSentinel = null;\n  }\n}\n\nfunction exerciseById(id) {''',
)
replace_once(
    "src/app.js",
    '''function weightUnit() {\n  return state.preferences?.weightUnit === "lb" ? "lb" : "kg";\n}\n''',
    '''function weightUnit() {\n  return state.preferences?.weightUnit === "lb" ? "lb" : "kg";\n}\n\nfunction restTimerEnabled() {\n  return state.preferences?.useRestTimer !== false;\n}\n\nfunction preferredRestSeconds(recommendedSeconds) {\n  const preferred = Number(state.preferences?.defaultRestSeconds);\n  if (Number.isFinite(preferred) && preferred > 0) {\n    return Math.min(600, Math.max(15, Math.round(preferred)));\n  }\n  return Math.max(0, Math.round(Number(recommendedSeconds) || 0));\n}\n\nfunction clampRestPreference(value) {\n  const seconds = Number(value);\n  if (!Number.isFinite(seconds) || seconds <= 0) return null;\n  return Math.min(600, Math.max(15, Math.round(seconds)));\n}\n''',
)

# Profile/onboarding preferences.
replace_once(
    "src/app.js",
    '''        <label class="field">Weight unit\n          <select name="weightUnit">\n            <option value="kg" ${weightUnit() === "kg" ? "selected" : ""}>Kilograms (kg)</option>\n            <option value="lb" ${weightUnit() === "lb" ? "selected" : ""}>Pounds (lb)</option>\n          </select>\n          <small>Workout entries and history are converted when you change this display unit.</small>\n        </label>\n''',
    '''        <label class="field">Weight unit\n          <select name="weightUnit">\n            <option value="kg" ${weightUnit() === "kg" ? "selected" : ""}>Kilograms (kg)</option>\n            <option value="lb" ${weightUnit() === "lb" ? "selected" : ""}>Pounds (lb)</option>\n          </select>\n          <small>Workout entries and history are converted when you change this display unit.</small>\n        </label>\n        <fieldset class="profile-subsection timer-preferences">\n          <legend>Rest timer</legend>\n          <div class="grid two">\n            <label class="option">\n              <input type="checkbox" name="useRestTimer" ${state.preferences?.useRestTimer !== false ? "checked" : ""}>\n              <span><strong>Use rest timer</strong><small>When off, completing a set never starts or interrupts with a timer.</small></span>\n            </label>\n            <label class="field">Default rest override (seconds)\n              <input type="number" name="defaultRestSeconds" min="15" max="600" step="5" inputmode="numeric" list="restDurationChoices" value="${state.preferences?.defaultRestSeconds ?? ""}" placeholder="Use programme target">\n              <small>Leave blank to use each programme recommendation. Common values include 30, 40, 45, 60, 75, 90, 120 and 150 seconds.</small>\n            </label>\n          </div>\n          <label class="option">\n            <input type="checkbox" name="keepScreenAwake" ${state.preferences?.keepScreenAwake ? "checked" : ""}>\n            <span><strong>Keep screen awake during workout</strong><small>Uses Screen Wake Lock when the browser supports it; timer correctness does not depend on this.</small></span>\n          </label>\n          <datalist id="restDurationChoices"><option value="30"><option value="40"><option value="45"><option value="60"><option value="75"><option value="90"><option value="120"><option value="150"></datalist>\n        </fieldset>\n''',
)
replace_once(
    "src/app.js",
    '''    const selectedStorage = String(form.get("profileStorage") || "browser");\n    state.preferences = {\n      ...state.preferences,\n      profileStorage: selectedStorage,\n      weightUnit: String(form.get("weightUnit")) === "lb" ? "lb" : "kg",\n    };''',
    '''    const selectedStorage = String(form.get("profileStorage") || "browser");\n    const selectedDefaultRest = clampRestPreference(form.get("defaultRestSeconds"));\n    state.preferences = {\n      ...state.preferences,\n      profileStorage: selectedStorage,\n      weightUnit: String(form.get("weightUnit")) === "lb" ? "lb" : "kg",\n      useRestTimer: form.get("useRestTimer") === "on",\n      defaultRestSeconds: selectedDefaultRest,\n      keepScreenAwake: form.get("keepScreenAwake") === "on",\n    };''',
)

# Active session owns its timer object.
replace_once(
    "src/app.js",
    '''    startedAt: new Date().toISOString(),\n    currentIndex: 0,\n    allowedGroups:''',
    '''    startedAt: new Date().toISOString(),\n    currentIndex: 0,\n    timer: null,\n    allowedGroups:''',
)
replace_once(
    "src/app.js",
    '''  const instructions = instructionSteps(exercise);\n  const unit = weightUnit();\n\n  $("#sessionView").innerHTML = `''',
    '''  const instructions = instructionSteps(exercise);\n  const unit = weightUnit();\n  const firstIncompleteSet = item.setsLog.findIndex((set) => !set.done);\n  const activeSetIndex = firstIncompleteSet === -1\n    ? Math.max(0, item.setsLog.length - 1)\n    : firstIncompleteSet;\n  const activeSetLabel = firstIncompleteSet === -1\n    ? "All planned sets complete"\n    : `Set ${activeSetIndex + 1} of ${item.setsLog.length}`;\n\n  $("#sessionView").innerHTML = `''',
)
replace_once(
    "src/app.js",
    '<article class="card" style="margin-top:14px">',
    '<article class="card exercise-info-card" style="margin-top:14px">',
)
replace_once(
    "src/app.js",
    '''      <article class="card">\n        <h2>Record sets</h2>\n        <p>Weight is optional for bodyweight movements. Enter repetitions or seconds before marking a set complete. RIR means repetitions in reserve.</p>''',
    '''      <article class="card active-set-card">\n        <div class="active-set-heading"><div><div class="eyebrow">${escapeHtml(activeSetLabel)}</div><h2>Weight · reps · RIR</h2></div><span class="chip">${item.sets} × ${escapeHtml(item.reps)}</span></div>\n        <p class="active-set-prescription">Prescription: ${item.sets} × ${escapeHtml(item.reps)} · programme rest ${item.restSeconds}s${state.preferences?.defaultRestSeconds ? ` · preferred timer ${preferredRestSeconds(item.restSeconds)}s` : ""}. RIR means repetitions in reserve.</p>''',
)
replace_once(
    "src/app.js",
    '''return `<div class="set-row ${set.done ? "done" : ""} ${validation.valid ? "" : "invalid"}" data-set="${index}">''',
    '''return `<div class="set-row ${set.done ? "done" : ""} ${index === activeSetIndex && !set.done ? "current" : ""} ${validation.valid ? "" : "invalid"}" data-set="${index}">''',
)
replace_once(
    "src/app.js",
    '''              <button type="button" class="set-check ${set.done ? "done" : ""}" data-action="set-done" aria-label="${set.done ? "Mark" : "Mark"} set ${index + 1} ${set.done ? "not complete" : "complete"}">${set.done ? "✓" : "○"}</button>''',
    '''              <button type="button" class="set-check ${set.done ? "done" : ""}" data-action="set-done" aria-label="${set.done ? "Mark" : "Mark"} set ${index + 1} ${set.done ? "not complete" : "complete"}">${set.done ? "✓ Done" : "Complete"}</button>''',
)
replace_once(
    "src/app.js",
    '''      set.done = !set.done;\n      persist();\n      if (set.done) startRest(item.restSeconds);\n      renderSession();''',
    '''      set.done = !set.done;\n      if (set.done) {\n        const setIndex = Number(row.dataset.set);\n        const nextSet = item.setsLog[setIndex + 1];\n        if (nextSet && !nextSet.done && !String(nextSet.weight || "").trim() && String(set.weight || "").trim()) {\n          nextSet.weight = set.weight;\n        }\n      }\n      persist();\n      if (set.done && restTimerEnabled()) startRest(item.restSeconds);\n      renderSession();''',
)

# Reorder the existing set-entry card before secondary exercise content in DOM order, and place timer directly after it.
app_path = ROOT / "src/app.js"
app = app_path.read_text()
session_template_start = app.index('  $("#sessionView").innerHTML = `')
session_template_end = app.index('\n    </div>`;', session_template_start) + len('\n    </div>`;')
chunk = app[session_template_start:session_template_end]
info_start = chunk.index('<article class="card exercise-info-card"')
info_end = chunk.index('</article>', info_start) + len('</article>')
active_start = chunk.index('<article class="card active-set-card">')
active_end = chunk.index('</article>', active_start) + len('</article>')
if not info_start < active_start:
    raise RuntimeError("Active-set card is already before exercise info unexpectedly")
info_block = chunk[info_start:info_end]
active_block = chunk[active_start:active_end]
between = chunk[info_end:active_start]
after = chunk[active_end:]
rest_markup = '      <div id="restTimer"></div>\n'
if rest_markup not in after:
    raise RuntimeError("Expected rest timer markup in session template")
after = after.replace(rest_markup, "", 1)
chunk = chunk[:info_start] + active_block + "\n      <div id=\"restTimer\"></div>\n" + between + info_block + after
app = app[:session_template_start] + chunk + app[session_template_end:]
app_path.write_text(app)

# Replace the timer UI/runtime with persisted deadline-based state transitions.
old_timer_block = '''function startRest(seconds) {\n  clearInterval(restInterval);\n  state.activeSession.restTimerEndsAt = restTimerEnd(seconds);\n  persist();\n  restInterval = setInterval(tickRestTimer, 1000);\n  renderRest();\n}\n\nfunction clearRestTimer({ notify = false } = {}) {\n  clearInterval(restInterval);\n  restInterval = null;\n  if (state.activeSession?.restTimerEndsAt) {\n    state.activeSession.restTimerEndsAt = null;\n    persist();\n  }\n  renderRest();\n  if (notify) toast("Rest complete");\n}\n\nfunction tickRestTimer() {\n  const remaining = restSecondsRemaining(state.activeSession?.restTimerEndsAt);\n  if (remaining <= 0) {\n    clearRestTimer({ notify: true });\n    return;\n  }\n  renderRest();\n}\n\nfunction renderRest() {\n  const element = $("#restTimer");\n  const restRemaining = restSecondsRemaining(state.activeSession?.restTimerEndsAt);\n  if (!element || restRemaining <= 0) {\n    if (element) element.innerHTML = "";\n    if (restRemaining <= 0 && state.activeSession?.restTimerEndsAt) {\n      state.activeSession.restTimerEndsAt = null;\n      persist();\n    }\n    return;\n  }\n  if (!restInterval) restInterval = setInterval(tickRestTimer, 1000);\n  element.innerHTML = `<div class="rest-timer" role="timer" aria-label="Rest time remaining"><strong>Rest ${Math.floor(restRemaining / 60)}:${String(restRemaining % 60).padStart(2, "0")}</strong><button id="skipRest" type="button" class="btn small">Skip rest</button></div>`;\n  $("#skipRest").onclick = () => clearRestTimer();\n}\n'''
new_timer_block = '''function currentRestRecommendation() {\n  const session = state.activeSession;\n  const item = session?.exercises?.[session.currentIndex];\n  return Math.max(0, Math.round(Number(item?.restSeconds ?? activeGoal().rest) || 0));\n}\n\nfunction stopRestInterval() {\n  clearInterval(restInterval);\n  restInterval = null;\n}\n\nfunction ensureRestInterval() {\n  if (!restInterval && state.activeSession?.timer?.status === "active") {\n    restInterval = setInterval(tickRestTimer, 1000);\n  }\n}\n\nfunction saveSessionTimer(timer) {\n  if (!state.activeSession) return;\n  state.activeSession.timer = timer;\n  persist();\n}\n\nfunction startRest(recommendedSeconds, durationSeconds = preferredRestSeconds(recommendedSeconds)) {\n  if (!state.activeSession || !restTimerEnabled()) return;\n  stopRestInterval();\n  saveSessionTimer(\n    createRestTimer(durationSeconds, {\n      recommendedRestSeconds: recommendedSeconds,\n    }),\n  );\n  ensureRestInterval();\n  renderRest();\n}\n\nfunction clearRestTimer({ notify = false } = {}) {\n  stopRestInterval();\n  if (state.activeSession?.timer) {\n    saveSessionTimer(cancelRestTimer(state.activeSession.timer));\n  }\n  renderRest();\n  if (notify && restTimerEnabled()) toast("Rest dismissed");\n}\n\nfunction announceRestComplete() {\n  if (!restTimerEnabled()) return;\n  toast("Rest complete");\n  if (!document.hidden) navigator.vibrate?.([120, 80, 120]);\n}\n\nfunction reconcileRestState({ notify = false, render = true } = {}) {\n  const timer = state.activeSession?.timer;\n  if (!timer) {\n    stopRestInterval();\n    if (render) renderRest();\n    return;\n  }\n  const previousStatus = timer.status;\n  const reconciled = reconcileRestTimer(timer);\n  if (reconciled !== timer) saveSessionTimer(reconciled);\n  if (reconciled?.status === "active") ensureRestInterval();\n  else stopRestInterval();\n  if (notify && previousStatus === "active" && reconciled?.status === "completed") {\n    announceRestComplete();\n  }\n  if (render) renderRest();\n}\n\nfunction tickRestTimer() {\n  reconcileRestState({ notify: true });\n}\n\nfunction timerDurationOptions(selectedSeconds) {\n  const common = [30, 40, 45, 60, 75, 90, 120, 150];\n  const values = common.includes(selectedSeconds) ? common : [...common, selectedSeconds].filter(Boolean).sort((a, b) => a - b);\n  return values.map((seconds) => `<option value="${seconds}" ${seconds === selectedSeconds ? "selected" : ""}>${seconds} sec</option>`).join("");\n}\n\nfunction renderRest() {\n  const element = $("#restTimer");\n  if (!element) return;\n  if (!restTimerEnabled()) {\n    stopRestInterval();\n    element.innerHTML = "";\n    return;\n  }\n\n  const recommended = currentRestRecommendation();\n  let timer = state.activeSession?.timer || null;\n  if (timer?.status === "active") {\n    const reconciled = reconcileRestTimer(timer);\n    if (reconciled !== timer) {\n      timer = reconciled;\n      saveSessionTimer(timer);\n    }\n  }\n\n  const preferred = preferredRestSeconds(recommended);\n  if (!timer || ["completed", "cancelled"].includes(timer.status)) {\n    stopRestInterval();\n    const completed = timer?.status === "completed";\n    element.innerHTML = `<div class="rest-timer rest-ready" role="status">\n      <div><strong>${completed ? "Rest complete" : "Rest timer ready"}</strong><small>Programme target ${recommended}s${state.preferences?.defaultRestSeconds ? ` · preferred ${preferred}s` : ""}</small></div>\n      <div class="rest-controls">\n        <select id="restReadyDuration" aria-label="Rest duration">${timerDurationOptions(preferred)}</select>\n        <button id="startRestNow" type="button" class="btn small">Start</button>\n      </div>\n    </div>`;\n    $("#startRestNow").onclick = () => startRest(recommended, Number($("#restReadyDuration").value));\n    return;\n  }\n\n  const remaining = restTimerRemaining(timer);\n  const duration = Number(timer.durationSeconds) || preferred;\n  if (timer.status === "active") ensureRestInterval();\n  else stopRestInterval();\n  element.innerHTML = `<div class="rest-timer" role="timer" aria-label="Rest time remaining">\n    <div class="rest-readout"><strong>Rest ${Math.floor(remaining / 60)}:${String(Math.ceil(remaining) % 60).padStart(2, "0")}</strong><small>${timer.status === "paused" ? "Paused" : "Running"} · programme ${timer.recommendedRestSeconds || recommended}s</small></div>\n    <div class="rest-duration-control">\n      <label for="restDurationDuringWorkout">Timer</label>\n      <input id="restDurationDuringWorkout" type="number" min="15" max="600" step="5" inputmode="numeric" value="${duration}" aria-label="Rest timer duration in seconds">\n      <span>sec</span>\n    </div>\n    <div class="rest-controls">\n      <button id="restMinus15" type="button" class="btn small ghost">−15</button>\n      <button id="toggleRestPause" type="button" class="btn small">${timer.status === "paused" ? "Resume" : "Pause"}</button>\n      <button id="restPlus15" type="button" class="btn small ghost">+15</button>\n      <button id="resetRest" type="button" class="btn small ghost">Reset</button>\n      <button id="skipRest" type="button" class="btn small ghost">Skip</button>\n    </div>\n  </div>`;\n\n  $("#restMinus15").onclick = () => { saveSessionTimer(adjustRestTimer(state.activeSession.timer, -15)); renderRest(); };\n  $("#restPlus15").onclick = () => { saveSessionTimer(adjustRestTimer(state.activeSession.timer, 15)); renderRest(); };\n  $("#toggleRestPause").onclick = () => {\n    const current = state.activeSession.timer;\n    saveSessionTimer(current.status === "paused" ? resumeRestTimer(current) : pauseRestTimer(current));\n    if (state.activeSession.timer.status === "active") ensureRestInterval();\n    else stopRestInterval();\n    renderRest();\n  };\n  $("#resetRest").onclick = () => {\n    saveSessionTimer(resetRestTimer(state.activeSession.timer, Number($("#restDurationDuringWorkout").value)));\n    ensureRestInterval();\n    renderRest();\n  };\n  $("#restDurationDuringWorkout").onchange = (event) => {\n    const seconds = clampRestPreference(event.target.value) || duration;\n    saveSessionTimer(resetRestTimer(state.activeSession.timer, seconds));\n    ensureRestInterval();\n    renderRest();\n  };\n  $("#skipRest").onclick = () => clearRestTimer();\n}\n'''
app = app_path.read_text()
count = app.count(old_timer_block)
if count != 1:
    raise RuntimeError(f"src/app.js: expected one legacy timer block, found {count}")
app_path.write_text(app.replace(old_timer_block, new_timer_block, 1))

replace_once(
    "src/app.js",
    '''  clearInterval(restInterval);\n  restInterval = null;\n  session.restTimerEndsAt = null;\n  state.history.push(session);''',
    '''  stopRestInterval();\n  session.timer = null;\n  void releaseWakeLock();\n  state.history.push(session);''',
)

# Profile page timer controls and persistence.
replace_once(
    "src/app.js",
    '''        </label>\n      </div>\n    </div>\n    <div class="card">\n      <h2>Where your data is saved</h2>''',
    '''        </label>\n      </div>\n      <div class="timer-profile-controls">\n        <label class="option">\n          <input id="profileUseRestTimer" type="checkbox" ${preferences.useRestTimer !== false ? "checked" : ""}>\n          <span><strong>Use rest timer</strong><small>Turn this off for uninterrupted set logging with no automatic timer.</small></span>\n        </label>\n        <label class="field" for="profileDefaultRestSeconds">Default rest override\n          <input id="profileDefaultRestSeconds" type="number" min="15" max="600" step="5" inputmode="numeric" value="${preferences.defaultRestSeconds ?? ""}" placeholder="Programme target">\n          <small>Blank uses each programme target. Your override never changes the programme prescription.</small>\n        </label>\n        <label class="option">\n          <input id="profileKeepScreenAwake" type="checkbox" ${preferences.keepScreenAwake ? "checked" : ""}>\n          <span><strong>Keep screen awake during workout</strong><small>Best-effort Screen Wake Lock on supported browsers; optional and separate from timer correctness.</small></span>\n        </label>\n      </div>\n    </div>\n    <div class="card">\n      <h2>Where your data is saved</h2>''',
)
replace_once(
    "src/app.js",
    '''  $("#profileInstructionLanguage").onchange = (event) => {\n    state.preferences.language = INSTRUCTION_LANGUAGES[event.target.value]\n      ? event.target.value\n      : "en";\n    persist();\n    renderAll();\n    toast(`Exercise instructions set to ${INSTRUCTION_LANGUAGES[state.preferences.language]}.`);\n  };\n''',
    '''  $("#profileInstructionLanguage").onchange = (event) => {\n    state.preferences.language = INSTRUCTION_LANGUAGES[event.target.value]\n      ? event.target.value\n      : "en";\n    persist();\n    renderAll();\n    toast(`Exercise instructions set to ${INSTRUCTION_LANGUAGES[state.preferences.language]}.`);\n  };\n  $("#profileUseRestTimer").onchange = (event) => {\n    state.preferences.useRestTimer = event.target.checked;\n    if (!event.target.checked && state.activeSession?.timer) {\n      state.activeSession.timer = cancelRestTimer(state.activeSession.timer);\n      stopRestInterval();\n    }\n    persist();\n    toast(event.target.checked ? "Rest timer enabled." : "Rest timer disabled. Set logging remains unchanged.");\n  };\n  $("#profileDefaultRestSeconds").onchange = (event) => {\n    state.preferences.defaultRestSeconds = clampRestPreference(event.target.value);\n    event.target.value = state.preferences.defaultRestSeconds ?? "";\n    persist();\n    toast(state.preferences.defaultRestSeconds ? `Default rest timer set to ${state.preferences.defaultRestSeconds} seconds.` : "Using programme rest targets.");\n  };\n  $("#profileKeepScreenAwake").onchange = (event) => {\n    state.preferences.keepScreenAwake = event.target.checked;\n    persist();\n    void syncWakeLock(false);\n    toast(event.target.checked ? "Screen wake lock will be requested during workouts when supported." : "Screen wake lock disabled.");\n  };\n''',
)

# Lifecycle reconciliation: callbacks repaint only; wall clock remains authoritative.
replace_once(
    "src/app.js",
    '''async function init() {\n  bindGlobal();\n  installMediaFallback();\n  window.addEventListener("online", updateDatasetBadge);\n  window.addEventListener("offline", updateDatasetBadge);''',
    '''async function init() {\n  bindGlobal();\n  installMediaFallback();\n  window.addEventListener("online", updateDatasetBadge);\n  window.addEventListener("offline", updateDatasetBadge);\n  document.addEventListener("visibilitychange", () => {\n    if (document.hidden) {\n      void releaseWakeLock();\n      return;\n    }\n    reconcileRestState({ notify: true });\n    void syncWakeLock($("#sessionView")?.classList.contains("active"));\n  });\n  window.addEventListener("focus", () => reconcileRestState({ notify: true }));\n  window.addEventListener("pageshow", () => reconcileRestState({ notify: true }));''',
)
replace_once(
    "src/app.js",
    '''  } else if (state.activeSession) {\n    renderAll();\n    renderSession({ focusHeading: true });''',
    '''  } else if (state.activeSession) {\n    reconcileRestState({ notify: false, render: false });\n    renderAll();\n    renderSession({ focusHeading: true });''',
)

# Mobile-first styling for the active set and compact one-handed timer controls.
append_once(
    "styles.css",
    "/* Rest timer UX v3.9.0 */",
    r'''/* Rest timer UX v3.9.0 */
.active-set-card {
  border-color: rgba(142, 227, 178, 0.48);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
}

.active-set-heading,
.rest-timer,
.rest-readout,
.rest-duration-control,
.rest-controls,
.timer-profile-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.active-set-heading {
  justify-content: space-between;
  align-items: flex-start;
}

.active-set-heading h2 {
  margin: 3px 0 0;
}

.active-set-prescription {
  margin-bottom: 12px;
}

.set-row.current {
  border-color: rgba(142, 227, 178, 0.52);
  background: rgba(142, 227, 178, 0.07);
}

.set-check {
  min-width: 86px;
  min-height: 44px;
  padding-inline: 10px;
}

.rest-timer {
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(142, 227, 178, 0.35);
  border-radius: 14px;
  background: rgba(142, 227, 178, 0.07);
}

.rest-timer strong,
.rest-timer small {
  display: block;
}

.rest-timer strong {
  font-size: 1.2rem;
}

.rest-timer small {
  margin-top: 3px;
  color: var(--muted);
}

.rest-duration-control {
  gap: 6px;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 800;
}

.rest-duration-control input,
.rest-controls select {
  width: auto;
  min-width: 84px;
  padding: 8px 10px;
}

.rest-controls {
  flex-wrap: wrap;
}

.timer-profile-controls {
  align-items: stretch;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

@media (max-width: 640px) {
  .active-set-card {
    padding: 14px;
  }

  .set-table-head {
    grid-template-columns: 28px repeat(3, minmax(0, 1fr)) 88px;
  }

  .set-row {
    grid-template-columns: 28px repeat(3, minmax(0, 1fr)) 88px;
  }

  .set-row input {
    min-width: 0;
    padding: 11px 7px;
  }

  .set-check {
    min-width: 82px;
    padding: 9px 6px;
    font-size: 0.76rem;
  }

  .rest-timer,
  .rest-controls {
    width: 100%;
  }

  .rest-controls > * {
    min-height: 44px;
  }

  .timer-profile-controls {
    grid-template-columns: 1fr;
  }

  .active-set-card input:focus {
    scroll-margin-bottom: 160px;
  }
}
''',
)

# Regression coverage is self-contained and auto-discovered by scripts/test-all.mjs.
(ROOT / "scripts/test-rest-timer-ux.mjs").write_text(r'''import assert from "node:assert/strict";
import fs from "node:fs";
import {
  adjustRestTimer,
  createRestTimer,
  pauseRestTimer,
  reconcileRestTimer,
  resetRestTimer,
  restTimerRemaining,
  resumeRestTimer,
} from "../src/session.js";
import { loadState, saveState } from "../src/storage.js";

const custom = createRestTimer(40, { now: 0, recommendedRestSeconds: 90 });
assert.equal(custom.durationSeconds, 40);
assert.equal(custom.recommendedRestSeconds, 90);
assert.equal(custom.endsAt, 40_000);
assert.equal(restTimerRemaining(custom, 20_000), 20);

const suspended = createRestTimer(90, { now: 0, recommendedRestSeconds: 90 });
assert.equal(restTimerRemaining(suspended, 20_000), 70);
assert.equal(restTimerRemaining(suspended, 70_000), 20, "wall clock, not callback count, owns elapsed time");
const completed = reconcileRestTimer(suspended, 95_000);
assert.equal(completed.status, "completed");
assert.equal(restTimerRemaining(completed, 95_000), 0);

const paused = pauseRestTimer(suspended, 20_000);
assert.equal(paused.status, "paused");
assert.equal(paused.pausedRemainingSeconds, 70);
const resumed = resumeRestTimer(paused, 70_000);
assert.equal(resumed.endsAt, 140_000);
assert.equal(restTimerRemaining(resumed, 80_000), 60);
assert.equal(restTimerRemaining(adjustRestTimer(resumed, 15, 80_000), 80_000), 75);
assert.equal(resetRestTimer(custom, 60, 10_000).endsAt, 70_000);
assert.equal(custom.recommendedRestSeconds, 90, "user timer duration must not rewrite programme recommendation metadata");

const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};
store.set("workout-recommender.state.v2", JSON.stringify({
  schemaVersion: 2,
  profile: { name: "Timer migration" },
  activeProgram: { id: "p1" },
  activeSession: { programId: "p1", restTimerEndsAt: 90_000 },
  history: [{ id: "history-kept" }],
  preferences: { useRestTimer: false, defaultRestSeconds: 40 },
}));
const migrated = loadState();
assert.equal(migrated.schemaVersion, 3);
assert.equal(migrated.preferences.useRestTimer, false);
assert.equal(migrated.preferences.defaultRestSeconds, 40);
assert.equal(migrated.preferences.keepScreenAwake, false);
assert.equal(migrated.history[0].id, "history-kept");
assert.equal(migrated.activeSession.timer.status, "active");
assert.equal(migrated.activeSession.restTimerEndsAt, undefined);

migrated.activeSession.timer = custom;
saveState(migrated);
const reloaded = loadState();
assert.equal(reloaded.preferences.useRestTimer, false);
assert.equal(reloaded.preferences.defaultRestSeconds, 40);
assert.equal(reloaded.activeSession.timer.endsAt, 40_000);

const app = fs.readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
assert.match(app, /if \(set\.done && restTimerEnabled\(\)\) startRest\(item\.restSeconds\);/);
assert.ok(app.indexOf('class="card active-set-card"') < app.indexOf('class="card exercise-info-card"'), "active-set controls must precede secondary content in DOM order");
assert.match(app, /visibilitychange/);
assert.match(app, /pageshow/);
assert.match(app, /navigator\.wakeLock\?\.request/);
assert.match(app, /nextSet\.weight = set\.weight/);
assert.match(styles, /\.set-row\.current/);
assert.match(styles, /Rest timer UX v3\.9\.0/);

const serviceWorker = fs.readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
assert.match(serviceWorker, /workout-recommender-v3\.9\.0-timer-ux-20260818/);

console.log("Rest timer, persistence, suspension recovery, active-set ordering and PWA cache regressions passed.");
''')

# Documentation and manual acceptance scenarios.
append_once(
    "README.md",
    "## Rest timer and live-set UX (3.9.0)",
    r'''## Rest timer and live-set UX (3.9.0)

The rest timer is an optional workout aid, not a progression gate. `Profile` now includes **Use rest timer**, an optional persistent default rest override, and **Keep screen awake during workout**. Leaving the rest override blank preserves the programme's own goal-based rest prescription. A user override changes only execution timing; the programme recommendation remains available separately.

Active timer state is stored with the active workout session (`startedAt`, absolute `endsAt`, duration, recommended rest and status). The countdown is deadline-based: visible `setInterval()` callbacks repaint the UI, but elapsed-time truth comes from `Date.now()` versus the stored deadline. `visibilitychange`, window focus and `pageshow` reconcile the timer after suspension or reload. If a 90-second timer is backgrounded after 20 seconds and reopened at 70 seconds elapsed, it shows about 20 seconds remaining; if the deadline passed, it is immediately marked complete.

Mobile browsers and installed PWAs may suspend JavaScript while the phone is locked. This app therefore **does not claim continuous background JavaScript or guaranteed background sound/vibration**. Timer state remains wall-clock correct when the app resumes. Vibration is best-effort when completion is observed while the app can run. The optional Screen Wake Lock request can keep the display awake during an active workout on supported browsers and gracefully does nothing elsewhere.

During a workout the set-entry card is now before exercise media, technique, previous performance and notes. Weight, reps, RIR and the complete-set action are therefore the first actionable training inputs below the exercise heading and progress. The current incomplete set is highlighted, sensible decimal loads remain supported, and a completed set can prefill the next blank set's load without changing historical records.

Timer controls support Start, Pause/Resume, Reset, Skip, +15 seconds and -15 seconds, plus direct duration editing. Completing a set starts the configured timer only when the preference is enabled. Timer completion is never required to continue to the next set or exercise.

### Manual phone acceptance

1. **No timer:** disable **Use rest timer**, start a workout, complete several sets and confirm no timer UI interrupts set logging.
2. **40 seconds:** enable the timer, set the default override to 40 seconds, complete a set and confirm the timer starts at 40 seconds while the programme target remains visible separately.
3. **Screen off:** start a 90-second timer, wait roughly 20 seconds, lock/background the phone, return later and confirm the remaining time is derived from the original deadline.
4. **Deadline passes off-screen:** start a short timer, keep the phone locked beyond the deadline, reopen and confirm the timer is immediately complete rather than resuming an old visible count.
5. **Active-set clarity:** on a normal phone viewport confirm exercise name, current set, prescription, weight, reps, RIR and the complete action appear before media, technique and history dominate the screen.
''',
)

print("Applied timer UX/background-safe revision.")
