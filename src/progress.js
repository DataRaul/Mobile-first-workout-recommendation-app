function completedSets(session) {
  return (session?.exercises || []).flatMap((exercise) =>
    (exercise.setsLog || []).filter((set) => set.done),
  );
}

export function historySessionStatus(session) {
  if (session?.status === "completed" || session?.status === "partial") return session.status;
  const sets = (session?.exercises || []).flatMap((exercise) => exercise.setsLog || []);
  return sets.length > 0 && sets.every((set) => set.done) ? "completed" : "partial";
}

export function summarizeHistory(history = []) {
  const completed = history.filter((session) => historySessionStatus(session) === "completed").length;
  const partial = history.filter((session) => historySessionStatus(session) === "partial").length;
  const completedSetCount = history.reduce(
    (sum, session) => sum + completedSets(session).length,
    0,
  );
  const volumeKgReps = history.reduce(
    (sum, session) =>
      sum +
      completedSets(session).reduce(
        (sessionSum, set) =>
          sessionSum + (Number(set.weight) || 0) * (Number(set.reps) || 0),
        0,
      ),
    0,
  );

  return {
    recorded: history.length,
    completed,
    partial,
    completedSets: completedSetCount,
    volumeKgReps: Math.round(volumeKgReps),
    completionRate: history.length ? Math.round((completed / history.length) * 100) : 0,
  };
}

export function exerciseProgressRecords(history = []) {
  const records = new Map();
  const chronological = history
    .filter((session) => session?.completedAt)
    .slice()
    .sort((a, b) => String(a.completedAt).localeCompare(String(b.completedAt)));

  for (const session of chronological) {
    for (const exercise of session.exercises || []) {
      const sets = (exercise.setsLog || []).filter((set) => set.done);
      if (!sets.length) continue;
      const exerciseId = String(exercise.exerciseId);
      const bestWeightKg = Math.max(...sets.map((set) => Number(set.weight) || 0));
      const bestReps = Math.max(...sets.map((set) => Number(set.reps) || 0));
      const bestSetVolumeKgReps = Math.max(
        ...sets.map((set) => (Number(set.weight) || 0) * (Number(set.reps) || 0)),
      );
      const existing = records.get(exerciseId) || {
        exerciseId,
        sessions: 0,
        firstAt: session.completedAt,
        firstBestWeightKg: bestWeightKg,
        firstBestReps: bestReps,
        latestAt: session.completedAt,
        latestBestWeightKg: bestWeightKg,
        latestBestReps: bestReps,
        bestWeightKg: 0,
        bestReps: 0,
        bestSetVolumeKgReps: 0,
      };
      existing.sessions += 1;
      existing.latestAt = session.completedAt;
      existing.latestBestWeightKg = bestWeightKg;
      existing.latestBestReps = bestReps;
      existing.bestWeightKg = Math.max(existing.bestWeightKg, bestWeightKg);
      existing.bestReps = Math.max(existing.bestReps, bestReps);
      existing.bestSetVolumeKgReps = Math.max(
        existing.bestSetVolumeKgReps,
        bestSetVolumeKgReps,
      );
      records.set(exerciseId, existing);
    }
  }

  return [...records.values()]
    .map((record) => ({
      ...record,
      loadChangeKg:
        record.sessions > 1
          ? Math.round((record.latestBestWeightKg - record.firstBestWeightKg) * 1000) / 1000
          : null,
      repChange:
        record.sessions > 1 ? record.latestBestReps - record.firstBestReps : null,
    }))
    .sort((a, b) => String(b.latestAt).localeCompare(String(a.latestAt)));
}
