/**
 * Shows on the Create Event form: each date-and-time an event runs at. Most
 * events have one. The rules mirror the server's (schedule.normalize.js) and
 * the publisher's form.
 */

export interface ShowDraft {
  key: string;
  date: string;
  startTime: string;
  /** Differs from `date` only for a show that runs across days. */
  endDate: string;
  endTime: string;
}

export const newShow = (): ShowDraft => ({ key: Math.random().toString(36).slice(2), date: "", startTime: "", endDate: "", endTime: "" });

// Times are stored as typed, the way the publisher stores them.
export const at = (date: string, time = "00:00") => new Date(`${date}T${time}:00.000Z`);
const DAY = 86400000;
export const addDays = (date: string, n: number) => new Date(at(date).getTime() + n * DAY).toISOString().slice(0, 10);

/** A show's real start and end, or null while it is incomplete. An end at or before the start on the same date is the next morning. */
export const showSpan = (show: ShowDraft) => {
  if (!show.date || !show.startTime || !show.endTime) return null;
  const start = at(show.date, show.startTime);
  let end = at(show.endDate || show.date, show.endTime);
  if (end <= start && (!show.endDate || show.endDate === show.date)) end = new Date(end.getTime() + DAY);
  // Days it can be split into: only a show longer than a day, and not counting
  // a last morning it merely runs into (Fri 20:00 to Sun 02:00 is two nights).
  const calendarDays = Math.round((at(show.endDate || show.date).getTime() - at(show.date).getTime()) / DAY) + 1;
  const days = end.getTime() - start.getTime() > DAY ? calendarDays - (show.endTime <= show.startTime ? 1 : 0) : 1;
  return { start, end, calendarDays, days, hours: Math.round(((end.getTime() - start.getTime()) / 3600000) * 10) / 10 };
};

const dayLabel = (date: string) =>
  at(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** "Show 2 · Sun, 22 Nov, 17:00" — how a show is named in the ticket menus. */
export const showLabel = (show: ShowDraft, index: number) =>
  `Show ${index + 1}${show.date ? ` · ${dayLabel(show.date)}` : ""}${show.startTime ? `, ${show.startTime}` : ""}`;

/** One show across days, as one show per day with the same hours to start from. */
export const splitIntoDays = (show: ShowDraft): ShowDraft[] => {
  const span = showSpan(show);
  if (!span || span.days < 2) return [show];
  return Array.from({ length: span.days }, (_, i) => ({
    ...newShow(),
    date: addDays(show.date, i),
    endDate: addDays(show.date, i),
    startTime: show.startTime,
    endTime: show.endTime,
  }));
};

/** The first problem with the shows, or null. */
export const showsError = (shows: ShowDraft[]): string | null => {
  let previousEnd: Date | null = null;
  for (const [i, show] of shows.entries()) {
    const label = shows.length > 1 ? `Show ${i + 1}` : "The show";
    const span = showSpan(show);
    if (!span) return `${label}: pick a start date, a start time and an end time.`;
    if (span.end <= span.start) return `${label}: the end must be after the start.`;
    if (previousEnd && span.start < previousEnd) return `${label} starts before show ${i} has ended.`;
    previousEnd = span.end;
  }
  return null;
};

export const showStartIso = (show: ShowDraft) => at(show.date, show.startTime).toISOString();

/** The `schedule` the API stores. Only a show that really ends on another date says so. */
export const schedulePayload = (shows: ShowDraft[]) =>
  shows.map((d) => ({
    date: at(d.date).toISOString(),
    startTime: showStartIso(d),
    endTime: at(d.endDate || d.date, d.endTime).toISOString(),
    ...(d.endDate && d.endDate !== d.date ? { endDate: at(d.endDate).toISOString() } : {}),
  }));
