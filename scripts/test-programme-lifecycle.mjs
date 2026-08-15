import assert from "node:assert/strict";

import {
  carriedForwardSets,
  comparePrograms,
  completedProgramSnapshot,
  linkProgramContinuation,
} from "../src/programme.js";
import { sessionCompletion } from "../src/session.js";

const item = (exerciseId, targetGroup, targetRole) => ({
  exerciseId,
  requestedGroup: targetGroup,
  targetGroup,
  targetRole,
  sets: 3,
  reps: "6–12",
  restSeconds: 90,
});

const activeProgram = {
  id: "programme-ending",
  title: "Ending programme",
  status: "active",
  durationWeeks: 1,
  daysPerWeek: 2,
  completedSessions: 1,
  nextWorkoutIndex: 1,
  workouts: [
    { id: "day-a", name: "Day A", exercises: [item("row", "back", "back_horizontal_pull")] },
    { id: "day-b", name: "Day B", exercises: [item("press", "chest", "chest_horizontal_press")] },
  ],
};

const history = [{
  id: "earlier-session",
  programId: activeProgram.id,
  workoutId: "day-a",
  workoutName: "Day A",
  completedAt: "2026-08-01T10:00:00.000Z",
  status: "completed",
  exercises: [{
    ...activeProgram.workouts[0].exercises[0],
    setsLog: [
      { weight: "35", reps: "10", rir: "2", done: true },
      { weight: "35", reps: "10", rir: "2", done: true },
      { weight: "35", reps: "10", rir: "2", done: true },
    ],
  }],
}];

const finalSession = {
  id: "final-session",
  programId: activeProgram.id,
  workoutId: "day-b",
  workoutName: "Day B",
  exercises: [{
    ...activeProgram.workouts[1].exercises[0],
    setsLog: [
      { weight: "40", reps: "12", rir: "2", done: true },
      { weight: "40", reps: "12", rir: "2", done: true },
      { weight: "40", reps: "12", rir: "2", done: true },
    ],
  }],
};

const completion = sessionCompletion(finalSession);
assert.equal(completion.status, "completed");
assert.equal(completion.completedSets, completion.totalSets);
finalSession.status = completion.status;
finalSession.completedAt = "2026-08-08T10:00:00.000Z";
history.push(finalSession);
activeProgram.completedSessions += 1;
assert.equal(activeProgram.completedSessions, activeProgram.durationWeeks * activeProgram.daysPerWeek);

const snapshot = completedProgramSnapshot(activeProgram, history, finalSession.completedAt);
snapshot.review = {
  outcome: "too_easy",
  recovery: "good",
  symptoms: "no",
  notes: "Ready for a small progression.",
  reviewedAt: "2026-08-08T10:05:00.000Z",
};
assert.equal(snapshot.status, "completed");
assert.equal(snapshot.performanceByExercise.press.sets[0].weight, "40");

const nextRecommendation = {
  id: "programme-next",
  status: "draft",
  workouts: [
    {
      id: "next-a",
      name: "Next A",
      exercises: [item("cable-row", "back", "back_horizontal_pull")],
    },
    {
      id: "next-b",
      name: "Next B",
      exercises: [item("press", "chest", "chest_horizontal_press")],
    },
  ],
};

const linked = linkProgramContinuation(nextRecommendation, snapshot);
const comparison = comparePrograms(snapshot, linked);
assert.equal(linked.predecessorProgramId, snapshot.id);
assert.deepEqual(linked.carryForwardExerciseIds, ["press"]);
assert.equal(comparison.summary.progressed, 1);
assert.equal(comparison.summary.replaced, 1);
const retainedPress = linked.workouts[1].exercises[0];
assert.equal(retainedPress.continuation.type, "progressed_load");
assert.deepEqual(carriedForwardSets(linked, snapshot, retainedPress)[0], {
  set: 1,
  weight: "41",
  reps: "6",
  rir: "2",
  done: false,
});
assert.equal(carriedForwardSets(linked, snapshot, linked.workouts[0].exercises[0]), null);

let written = "";
globalThis.window = {
  showSaveFilePicker: async () => ({
    name: "programme-chain.json",
    createWritable: async () => ({
      write: async (value) => { written = value; },
      close: async () => {},
    }),
  }),
};
const { exportState, previewImportState } = await import("../src/storage.js");
const portableState = {
  schemaVersion: 2,
  profile: { name: "Lifecycle fixture" },
  previousProgram: snapshot,
  draftProgram: linked,
  activeProgram: null,
  activeSession: null,
  history,
};
const backup = await exportState(portableState, { chooseLocation: true });
assert.equal(backup.fileName, "programme-chain.json");
const restored = await previewImportState({ text: async () => written });
assert.equal(restored.previousProgram.id, snapshot.id);
assert.equal(restored.previousProgram.review.notes, "Ready for a small progression.");
assert.equal(restored.draftProgram.predecessorProgramId, snapshot.id);
assert.equal(restored.draftProgram.workouts[1].exercises[0].continuation.type, "progressed_load");
assert.equal(restored.history.at(-1).id, finalSession.id);

console.log("Final-session, follow-up progression and portable programme-chain lifecycle passed.");
