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

const SET_LOG_FIELDS = new Set(["weight", "reps", "rir"]);

export function updateSetLogValue(set, field, value) {
  if (!set || !SET_LOG_FIELDS.has(field)) return set;
  set[field] = String(value ?? "");
  return set;
}
