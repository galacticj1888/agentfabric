import { z } from "zod";

// --- Commitment ---
export const CommitmentSchema = z.object({
  who: z.string(),
  toWhom: z.string(),
  what: z.string(),
  byWhen: z.string().optional(),
  confidence: z.enum(["explicit", "implied", "inferred"]),
  rawQuote: z.string().optional(),
  source: z.string(),
});
export type Commitment = z.infer<typeof CommitmentSchema>;

// --- Takeaway ---
export const TakeawaySchema = z.object({
  type: z.enum(["decision", "risk", "blocker", "opportunity", "insight"]),
  summary: z.string(),
  details: z.string().optional(),
  account: z.string(),
});
export type Takeaway = z.infer<typeof TakeawaySchema>;

// --- Action Results ---
export const EmailDraftResultSchema = z.object({
  threadId: z.string().optional(),
  draftId: z.string(),
  subject: z.string(),
  to: z.array(z.string()),
});
export type EmailDraftResult = z.infer<typeof EmailDraftResultSchema>;

export const LinearTaskResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
});
export type LinearTaskResult = z.infer<typeof LinearTaskResultSchema>;

export const SlackMessageResultSchema = z.object({
  channel: z.string(),
  ts: z.string(),
});
export type SlackMessageResult = z.infer<typeof SlackMessageResultSchema>;

export const ActionsSchema = z.object({
  emailDraft: EmailDraftResultSchema.optional(),
  linearTasks: z.array(LinearTaskResultSchema).optional(),
  salesThreadUpdate: SlackMessageResultSchema.optional(),
  customerSummary: SlackMessageResultSchema.optional(),
});
export type Actions = z.infer<typeof ActionsSchema>;

// --- Fabric Output Envelope ---
export const FabricOutputSchema = z.object({
  runId: z.string(),
  userId: z.string(),
  meetingId: z.string(),
  account: z.string(),
  timestamp: z.string(),
  sources: z.array(z.string()),
  commitments: z.array(CommitmentSchema),
  takeaways: z.array(TakeawaySchema),
  actions: ActionsSchema,
});
export type FabricOutput = z.infer<typeof FabricOutputSchema>;

// --- Config ---
export const FabricConfigSchema = z.object({
  userId: z.string(),
  voiceProfilePath: z.string(),
  linearProject: z.string().optional(),
  linearTeam: z.string().optional(),
  salesThreadsChannel: z.string().default("sales-threads"),
  defaultSources: z.array(z.string()).default(["fireflies", "slack", "calendar"]),
});
export type FabricConfig = z.infer<typeof FabricConfigSchema>;

// --- Account Entry ---
export const AccountEntrySchema = z.object({
  name: z.string(),
  slackChannel: z.string().optional(),
  domain: z.string().optional(),
  dealStage: z.string().optional(),
  contacts: z.array(z.string()).default([]),
});
export type AccountEntry = z.infer<typeof AccountEntrySchema>;
