import assert from "node:assert/strict";

import {
  carriedForwardSets,
  comparePrograms,
  completedProgramSnapshot,
  linkProgramContinuation,
  summarizeProgramPerformance,
} from "../src/programme.js";

const item = (exerciseId, targetGroup, targetRole, sets = 3, reps = "6–12") => ({
  exerciseId,
  requestedGroup: targetGroup,
  targetGroup,
  targetRole,
  sets,
  reps,
  restSeconds: 90,
});

const previousProgram = {
  id: "program-previous",
  status: "active",
  durationWeeks: 1,
  daysPerWeek: 1,
  completedSessions: 1,
  workouts: [
    {
      id: "workout-1",
      name: "Full Body A",
      exercises: [
        item("chest-press", "chest", "chest_horizontal_press"),
        item("row", "back", "back_horizontal_pull"),
        item("plank", "core", "core_anti_extension", 2, "30–60 sec"),
      ],
    },
  ],
};

const history = [
  {
    id: "session-1",
    programId: previousProgram.id,
    workoutId: "workout-1",
    workoutName: "Full Body A",
    completedAt: "2026-08-01T10:00:00.000Z",
    exercises: [
      {
        ...previousProgram.workouts[0].exercises[0],
        setsLog: [
          { weight: "30", reps: "10", rir: "2", done: true },
          { weight: "30", reps: "10", rir: "2", done: true },
          { weight: "30", reps: "9", rir: "1", done: true },
        ],
      },
      {
        ...previousProgram.workouts[0].exercises[1],
        setsLog: [
          { weight: "35", reps: "10", rir: "2", done: true },
          { weight: "35", reps: "9", rir: "2", done: true },
          { weight: "", reps: "", rir: "", done: false },
        ],
      },
    ],
  },
  {
    id: "session-2",
    programId: previousProgram.id,
    workoutId: "workout-1",
    workoutName: "Full Body A",
    completedAt: "2026-08-08T10:00:00.000Z",
    exercises: [
      {
        ...previousProgram.workouts[0].exercises[0],
        setsLog: [
          { weight: "35", reps: "12", rir: "2", done: true },
          { weight: "35", reps: "11", rir: "2", done: true },
          { weight: "35", reps: "10", rir: "1", done: true },
        ],
      },
    ],
  },
  {
    id: "other-program-session",
    programId: "different-program",
    workoutId: "workout-1",
    workoutName: "Other",
    completedAt: "2026-08-09T10:00:00.000Z",
    exercises: [
      {
        ...previousProgram.workouts[0].exercises[0],
        setsLog: [{ weight: "999", reps: "1", rir: "0", done: true }],
      },
    ],
  },
];

const performance = summarizeProgramPerformance(previousProgram, history);
assert.equal(performance["chest-press"].completedAt, "2026-08-08T10:00:00.000Z");
assert.equal(performance["chest-press"].sets[0].weight, "35");
assert.equal(performance["row"].sets.length, 2);
assert.equal(performance["plank"], undefined);

const snapshot = completedProgramSnapshot(
  previousProgram,
  history,
  "2026-08-08T10:30:00.000Z",
);
assert.equal(snapshot.status, "completed");
assert.equal(snapshot.completedAt, "2026-08-08T10:30:00.000Z");
assert.equal(snapshot.performanceByExercise["chest-press"].sets[2].reps, "10");

const nextProgram = {
  id: "program-next",
  status: "draft",
  workouts: [
    {
      id: "workout-1",
      name: "Full Body A",
      exercises: [
        item("chest-press", "chest", "chest_horizontal_press", 4),
        item("cable-row", "back", "back_horizontal_pull"),
        item("lateral-raise", "shoulders", "shoulder_lateral_raise"),
      ],
    },
  ],
};

const comparison = comparePrograms(snapshot, nextProgram);
assert.deepEqual(comparison.summary, {
  retained: 1,
  replaced: 1,
  added: 1,
  removed: 1,
  adjusted: 1,
});
assert.deepEqual(comparison.retainedExerciseIds, ["chest-press"]);
assert.equal(comparison.workouts[0].entries[0].performance.sets[0].weight, "35");
assert.equal(comparison.workouts[0].entries[1].status, "replaced");

const linked = linkProgramContinuation(nextProgram, snapshot);
assert.equal(linked.predecessorProgramId, snapshot.id);
assert.deepEqual(linked.carryForwardExerciseIds, ["chest-press"]);

const carried = carriedForwardSets(linked, snapshot, nextProgram.workouts[0].exercises[0]);
assert.equal(carried.length, 4);
assert.deepEqual(carried[0], {
  set: 1,
  weight: "35",
  reps: "12",
  rir: "2",
  done: false,
});
assert.equal(carried[3].weight, "");
assert.equal(
  carriedForwardSets(linked, snapshot, nextProgram.workouts[0].exercises[1]),
  null,
);

console.log("Programme continuation comparison tests passed.");
