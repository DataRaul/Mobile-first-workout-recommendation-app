import { maxComplexity, replacementOptions } from "./programme.js";

export function routineSlotOptions(program) {
  if (!program) return [];
  return (program.workouts || []).flatMap((workout, workoutIndex) =>
    (workout.exercises || []).map((item, itemIndex) => ({
      workout,
      workoutIndex,
      item,
      itemIndex,
    })),
  );
}

export function candidateForRoutineSlot(exercises, candidateId, slot, profile, state) {
  if (!slot?.workout || !slot?.item || !profile) return null;
  const options = replacementOptions(
    exercises,
    slot.item.exerciseId,
    slot.workout.exercises.map((entry) => entry.exerciseId),
    profile,
    state,
    profile.goal,
    exercises.length,
    "profile",
    slot.item.targetGroup || null,
    slot.item.targetRole || null,
    slot.workout.allowedGroups || slot.workout.emphasis || [],
    slot.item.requestedGroup || slot.item.targetGroup || null,
  );
  return options.find((candidate) => String(candidate.id) === String(candidateId)) || null;
}

export function replacementMatchLabel(candidate) {
  if (!candidate?._replacement) return "Compatible alternative";
  if (candidate._replacement.groupMatch === "exact" && candidate._replacement.roleMatch === "exact") {
    return "Best match";
  }
  if (candidate._replacement.groupMatch === "exact") return "Same muscle";
  return "Alternative";
}

export function replacementWarning(candidate) {
  if (!candidate?._replacement) return "";
  if (candidate._replacement.groupMatch !== "exact") {
    return "This is a broader compatible alternative. It changes the direct muscle emphasis of this slot, so review the updated weekly coverage before continuing.";
  }
  if (!["exact", "related"].includes(candidate._replacement.roleMatch)) {
    return "This keeps the intended muscle but changes the movement role. The routine remains within your profile limits, but the training emphasis will differ.";
  }
  return "";
}

export function applyRoutineSlotReplacement({ program, slot, candidate, profile, applyMetadata }) {
  if (!program || !slot?.item || !candidate || !profile || typeof applyMetadata !== "function") {
    return false;
  }
  if (candidate.app?.complexity > maxComplexity(profile.level)) return false;
  applyMetadata(
    slot.item,
    candidate.id,
    candidate._replacement || null,
    candidate.app?.complexity,
    candidate,
  );
  program.updatedAt = new Date().toISOString();
  return true;
}
