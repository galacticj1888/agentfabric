import type { CalendarEvent } from "../types/ingest.js";
import { sortByDate } from "./sort.js";

export function mergeCalendarText(events: CalendarEvent[]): string {
  if (events.length === 0) return "";
  return sortByDate(events, (event) => event.start)
    .map((e) => {
      const attendees = e.attendees?.join(", ") ?? "no attendees listed";
      const parts = [`${e.title} (${e.start})`, `Attendees: ${attendees}`];
      if (e.location) parts.push(`Location: ${e.location}`);
      if (e.description) parts.push(`Description: ${e.description}`);
      return parts.join(" — ");
    })
    .join("\n");
}
