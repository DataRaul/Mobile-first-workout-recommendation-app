export function sessionCompletion(session) {
  const sets = (session?.exercises || []).flatMap((exercise) => exercise.setsLog || []);
  const completedSets = sets.filter((set) => set.done).length;
  const totalSets = sets.length;

  return {
    completedSets,
    totalSets,
    status: totalSets > 0 && completedSets === totalSets ? "completed" : "partial",
  };
}

export function sessionMetrics(session) {
  const completion = sessionCompletion(session);
  const volume = (session?.exercises || [])
    .flatMap((exercise) => exercise.setsLog || [])
    .filter((set) => set.done)
    .reduce(
      (sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0),
      0,
    );
  return { ...completion, volume: Math.round(volume) };
}

export function latestRecordedSession(history = []) {
  return history
    .filter((session) => session?.completedAt)
    .slice()
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))[0] || null;
}

export const READINESS_GUIDANCE = {
  ready: {
    label: "Ready as planned",
    guidance: "Follow the planned sets and repetitions, adjusting weight so the target RIR remains honest.",
  },
  fatigued: {
    label: "Some fatigue",
    guidance: "Consider 5–10% less weight, leave 2–3 repetitions in reserve, or omit one set per exercise today.",
  },
  pain: {
    label: "Pain or unusual symptoms",
    guidance: "Do not train through sharp or worsening pain. Replace the painful movement or skip today, and seek qualified medical advice when appropriate.",
  },
};

const KG_PER_LB = 0.45359237;

export function weightForDisplay(value, unit = "kg") {
  if (value === "" || value === null || value === undefined) return "";
  const kilograms = Number(value);
  if (!Number.isFinite(kilograms)) return String(value);
  const displayed = unit === "lb" ? kilograms / KG_PER_LB : kilograms;
  return String(Math.round(displayed * 10) / 10);
}

export function weightForStorage(value, unit = "kg") {
  if (value === "" || value === null || value === undefined) return "";
  const displayed = Number(value);
  if (!Number.isFinite(displayed)) return String(value);
  const kilograms = unit === "lb" ? displayed * KG_PER_LB : displayed;
  return String(Math.round(kilograms * 1000) / 1000);
}

export function validateSetLog(set, { requireReps = true } = {}) {
  const errors = {};
  const weight = String(set?.weight ?? "").trim();
  const reps = String(set?.reps ?? "").trim();
  const rir = String(set?.rir ?? "").trim();

  if (weight && (!Number.isFinite(Number(weight)) || Number(weight) < 0 || Number(weight) > 5000)) {
    errors.weight = "Weight must be between 0 and 5,000 kg.";
  }
  if (requireReps && !reps) {
    errors.reps = "Enter completed repetitions or seconds.";
  } else if (reps && (!Number.isInteger(Number(reps)) || Number(reps) < 1 || Number(reps) > 999)) {
    errors.reps = "Repetitions or seconds must be a whole number from 1 to 999.";
  }
  if (rir && (!Number.isInteger(Number(rir)) || Number(rir) < 0 || Number(rir) > 10)) {
    errors.rir = "RIR must be a whole number from 0 to 10.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function invalidCompletedSets(session) {
  const issues = [];
  (session?.exercises || []).forEach((exercise, exerciseIndex) => {
    (exercise.setsLog || []).forEach((set, setIndex) => {
      if (!set.done) return;
      const validation = validateSetLog(set);
      if (!validation.valid) issues.push({ exerciseIndex, setIndex, errors: validation.errors });
    });
  });
  return issues;
}

export function restTimerEnd(seconds, now = Date.now()) {
  const duration = Math.max(0, Number(seconds) || 0);
  return duration ? now + duration * 1000 : null;
}

export function restSecondsRemaining(endTimestamp, now = Date.now()) {
  if (!endTimestamp) return 0;
  return Math.max(0, Math.ceil((Number(endTimestamp) - now) / 1000));
}

export function normalizeRestDuration(seconds, fallback = null) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(3600, Math.max(1, Math.round(value)));
}

export function createRestTimer(
  durationSeconds,
  { now = Date.now(), recommendedRestSeconds = null } = {},
) {
  const duration = normalizeRestDuration(durationSeconds, 0);
  const recommended = normalizeRestDuration(recommendedRestSeconds, null);
  return {
    status: duration > 0 ? "active" : "cancelled",
    startedAt: now,
    endsAt: duration > 0 ? now + duration * 1000 : null,
    durationSeconds: duration,
    recommendedRestSeconds: recommended,
    pausedRemainingSeconds: null,
    completedAt: null,
    cancelledAt: duration > 0 ? null : now,
  };
}

export function restTimerRemaining(timer, now = Date.now()) {
  if (!timer) return 0;
  if (timer.status === "paused") {
    return Math.max(0, Number(timer.pausedRemainingSeconds) || 0);
  }
  if (timer.status !== "active") return 0;
  return restSecondsRemaining(timer.endsAt, now);
}

export function reconcileRestTimer(timer, now = Date.now()) {
  if (!timer || timer.status !== "active") return timer;
  if (restTimerRemaining(timer, now) > 0) return timer;
  return {
    ...timer,
    status: "completed",
    endsAt: null,
    pausedRemainingSeconds: 0,
    completedAt: now,
  };
}

export function pauseRestTimer(timer, now = Date.now()) {
  if (!timer || timer.status !== "active") return timer;
  const remaining = restTimerRemaining(timer, now);
  if (remaining <= 0) return reconcileRestTimer(timer, now);
  return {
    ...timer,
    status: "paused",
    endsAt: null,
    pausedRemainingSeconds: remaining,
  };
}

export function resumeRestTimer(timer, now = Date.now()) {
  if (!timer || timer.status !== "paused") return timer;
  const remaining = Math.max(0, Number(timer.pausedRemainingSeconds) || 0);
  if (remaining <= 0) {
    return { ...timer, status: "completed", pausedRemainingSeconds: 0, completedAt: now };
  }
  return {
    ...timer,
    status: "active",
    endsAt: now + remaining * 1000,
    pausedRemainingSeconds: null,
  };
}

export function adjustRestTimer(timer, deltaSeconds, now = Date.now()) {
  if (!timer || !["active", "paused"].includes(timer.status)) return timer;
  const adjusted = Math.min(
    3600,
    Math.max(0, restTimerRemaining(timer, now) + Number(deltaSeconds || 0)),
  );
  if (adjusted <= 0) {
    return {
      ...timer,
      status: "completed",
      endsAt: null,
      pausedRemainingSeconds: 0,
      completedAt: now,
    };
  }
  if (timer.status === "paused") {
    return { ...timer, pausedRemainingSeconds: adjusted };
  }
  return { ...timer, endsAt: now + adjusted * 1000 };
}

export function resetRestTimer(timer, durationSeconds = timer?.durationSeconds, now = Date.now()) {
  return createRestTimer(durationSeconds, {
    now,
    recommendedRestSeconds: timer?.recommendedRestSeconds ?? null,
  });
}

export function cancelRestTimer(timer, now = Date.now()) {
  return {
    ...(timer || {}),
    status: "cancelled",
    endsAt: null,
    pausedRemainingSeconds: 0,
    completedAt: null,
    cancelledAt: now,
  };
}

const SET_LOG_FIELDS = new Set(["weight", "reps", "rir"]);

export function updateSetLogValue(set, field, value) {
  if (!set || !SET_LOG_FIELDS.has(field)) return set;
  set[field] = String(value ?? "");
  return set;
}
