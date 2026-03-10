import type { IngestData, FirefliesTranscript, SlackMessage, CalendarEvent, GmailThread, GranolaMeeting } from "../types/ingest.js";
import { IngestDataSchema } from "../types/ingest.js";

export { mergeTranscriptText } from "./fireflies.js";
export { mergeSlackText } from "./slack.js";
export { mergeCalendarText } from "./calendar.js";
export { mergeGmailText } from "./gmail.js";
export { mergeGranolaText } from "./granola.js";

interface PartialSources {
  fireflies?: { transcripts: FirefliesTranscript[] };
  slack?: { messages: SlackMessage[] };
  calendar?: { events: CalendarEvent[] };
  gmail?: { threads: GmailThread[] };
  granola?: { meetings: GranolaMeeting[] };
}

export function buildIngestData(account: string, sources: PartialSources): IngestData {
  const data: Record<string, unknown> = {
    account,
    fetchedAt: new Date().toISOString(),
  };
  if (sources.fireflies?.transcripts.length) data.fireflies = sources.fireflies;
  if (sources.slack?.messages.length) data.slack = sources.slack;
  if (sources.calendar?.events.length) data.calendar = sources.calendar;
  if (sources.gmail?.threads.length) data.gmail = sources.gmail;
  if (sources.granola?.meetings.length) data.granola = sources.granola;
  return IngestDataSchema.parse(data);
}
