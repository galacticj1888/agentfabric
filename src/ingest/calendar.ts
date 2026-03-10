import type { CalendarEvent } from "../types/ingest.js";

export function mergeCalendarText(events: CalendarEvent[]): string {
  if (events.length === 0) return "";
  return events
    .map((e) => {
      const attendees = e.attendees?.join(", ") ?? "no attendees listed";
      return `${e.title} (${e.start}) — Attendees: ${attendees}`;
    })
    .join("\n");
}
