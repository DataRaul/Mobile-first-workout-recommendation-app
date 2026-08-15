export const WEEKDAYS = [
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
  { value: 0, short: "Sun", label: "Sunday" },
];

const DEFAULTS = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

export function defaultTrainingWeekdays(daysPerWeek) {
  const days = Math.min(6, Math.max(2, Number(daysPerWeek) || 3));
  return [...DEFAULTS[days]];
}

export function normalizeTrainingWeekdays(values, daysPerWeek) {
  const expected = Math.min(6, Math.max(2, Number(daysPerWeek) || 3));
  const normalized = [...new Set((values || []).map(Number))].filter((day) => day >= 0 && day <= 6);
  return normalized.length === expected ? normalized : defaultTrainingWeekdays(expected);
}

export function weekdaySummary(values) {
  const selected = new Set((values || []).map(Number));
  return WEEKDAYS.filter((day) => selected.has(day.value)).map((day) => day.short).join(", ");
}

export function scheduleStatus(values, date = new Date()) {
  const selected = new Set((values || []).map(Number));
  const today = date.getDay();
  if (selected.has(today)) return { scheduledToday: true, daysUntilNext: 0, label: "Preferred training day" };

  for (let daysUntilNext = 1; daysUntilNext <= 7; daysUntilNext += 1) {
    if (selected.has((today + daysUntilNext) % 7)) {
      const next = WEEKDAYS.find((day) => day.value === (today + daysUntilNext) % 7);
      return {
        scheduledToday: false,
        daysUntilNext,
        label: `Next preferred day: ${next?.label || "scheduled day"}`,
      };
    }
  }

  return { scheduledToday: false, daysUntilNext: null, label: "No preferred weekdays selected" };
}
