// AgentFabric — Post-meeting automation for GTM teams
// Public API barrel export

// Types
export type {
  FabricOutput,
  FabricConfig,
  Commitment,
  Takeaway,
  AccountEntry,
  Actions,
  EmailDraftResult,
  LinearTaskResult,
  SlackMessageResult,
} from "./types/fabric.js";
export type {
  IngestData,
  FirefliesTranscript,
  SlackMessage,
  CalendarEvent,
  GmailThread,
  GranolaMeeting,
} from "./types/ingest.js";
export type { AccountsFile } from "./types/config.js";

// Schemas (for runtime validation)
export {
  FabricOutputSchema,
  FabricConfigSchema,
  CommitmentSchema,
  TakeawaySchema,
  AccountEntrySchema,
  ActionsSchema,
} from "./types/fabric.js";
export { IngestDataSchema } from "./types/ingest.js";
export { AccountsFileSchema } from "./types/config.js";

// Config
export { loadConfig, loadAccounts, loadVoiceProfile } from "./config/index.js";
export { resolveAccount } from "./config/index.js";

// Ingest
export {
  buildIngestData,
  mergeTranscriptText,
  mergeSlackText,
  mergeCalendarText,
  mergeGmailText,
  mergeGranolaText,
} from "./ingest/index.js";

// Reason
export {
  buildGodPrompt,
  parseGodPromptResponse,
  buildPreviousRunContext,
} from "./reason/index.js";

// Voice
export {
  buildVoiceAnalysisPrompt,
  parseVoiceProfileFromResponse,
  applyVoiceProfile,
} from "./voice/index.js";

// Act
export {
  formatEmailDraftForMCP,
  formatLinearTasksForMCP,
  formatSalesThreadForMCP,
  formatCustomerSummaryForReview,
} from "./act/index.js";
export type {
  EmailDraftInput,
  EmailDraftPayload,
  LinearTaskInput,
  LinearTaskPayload,
  SlackMessageInput,
  SlackMessagePayload,
  CustomerSummaryInput,
  CustomerSummaryReviewPayload,
} from "./act/index.js";

// Runs
export { logRun, readRuns, readLastRunForAccount } from "./runs/index.js";
