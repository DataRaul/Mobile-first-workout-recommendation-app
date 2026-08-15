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
