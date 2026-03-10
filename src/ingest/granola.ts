import type { GranolaMeeting } from "../types/ingest.js";

export function mergeGranolaText(meetings: GranolaMeeting[]): string {
  if (meetings.length === 0) return "";
  return meetings
    .map((m) => {
      const parts: string[] = [`## ${m.title} (${m.date})`];
      if (m.notes) parts.push(m.notes);
      if (m.transcript) parts.push(`Transcript:\n${m.transcript}`);
      return parts.join("\n\n");
    })
    .join("\n\n---\n\n");
}
