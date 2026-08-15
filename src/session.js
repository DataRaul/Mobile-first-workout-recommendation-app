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

const SET_LOG_FIELDS = new Set(["weight", "reps", "rir"]);

export function updateSetLogValue(set, field, value) {
  if (!set || !SET_LOG_FIELDS.has(field)) return set;
  set[field] = String(value ?? "");
  return set;
}
