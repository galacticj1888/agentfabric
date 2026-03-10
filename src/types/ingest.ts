import { z } from "zod";

// --- Fireflies ---
export const FirefliesAttendeeSchema = z.object({
  displayName: z.string(),
  email: z.string().optional(),
});

export const FirefliesSummarySchema = z.object({
  short_summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  action_items: z.string().optional(),
});

export const FirefliesTranscriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  dateString: z.string(),
  duration: z.number().optional(),
  organizerEmail: z.string().optional(),
  participants: z.array(z.string()).optional(),
  meetingAttendees: z.array(FirefliesAttendeeSchema).optional(),
  summary: FirefliesSummarySchema.optional(),
  transcript: z.string().optional(),
});
export type FirefliesTranscript = z.infer<typeof FirefliesTranscriptSchema>;

// --- Slack ---
export const SlackChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_private: z.boolean().optional(),
});

export const SlackMessageSchema = z.object({
  type: z.string().optional(),
  channel: SlackChannelSchema.optional(),
  user: z.string().optional(),
  user_name: z.string().optional(),
  username: z.string().optional(),
  text: z.string(),
  ts: z.string(),
  timestamp: z.string().optional(),
  permalink: z.string().optional(),
});
export type SlackMessage = z.infer<typeof SlackMessageSchema>;

// --- Calendar ---
export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

// --- Gmail ---
export const GmailThreadSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  date: z.string(),
  snippet: z.string().optional(),
  body: z.string().optional(),
});
export type GmailThread = z.infer<typeof GmailThreadSchema>;

// --- Granola ---
export const GranolaMeetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  notes: z.string().optional(),
  transcript: z.string().optional(),
});
export type GranolaMeeting = z.infer<typeof GranolaMeetingSchema>;

// --- Aggregated Ingest Data ---
export const IngestDataSchema = z.object({
  account: z.string(),
  fetchedAt: z.string(),
  fireflies: z.object({ transcripts: z.array(FirefliesTranscriptSchema) }).optional(),
  slack: z.object({ messages: z.array(SlackMessageSchema) }).optional(),
  calendar: z.object({ events: z.array(CalendarEventSchema) }).optional(),
  gmail: z.object({ threads: z.array(GmailThreadSchema) }).optional(),
  granola: z.object({ meetings: z.array(GranolaMeetingSchema) }).optional(),
});
export type IngestData = z.infer<typeof IngestDataSchema>;
