import { sanitizeText } from "../utils/index.js";

// --- Existing types (preserved for process-meeting compatibility) ---

export interface SlackMessageInput {
  channel: string;
  text: string;
  thread_ts?: string;
}

export interface SlackMessagePayload {
  channel: string;
  text: string;
  thread_ts?: string;
}

export function formatSalesThreadForMCP(input: SlackMessageInput): SlackMessagePayload {
  const payload: SlackMessagePayload = { channel: input.channel, text: sanitizeText(input.text) };
  if (input.thread_ts) {
    payload.thread_ts = input.thread_ts;
  }
  return payload;
}

// --- New formatters for redesigned sales threads ---
// Em dashes intentionally preserved in section headers, date dividers, and owner prompts.
// Slack renders them correctly. sanitizeText is for Gmail/plain-text contexts.

export interface SectionHeaderInput {
  channel: string;
  emoji: string;
  label: string;
  totalAmount: number;
}

export function formatDollarAmount(amount: number): string {
  if (amount === 0) return "$0";
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `$${formatted}M`;
  }
  const thousands = Math.round(amount / 1000);
  return `$${thousands}K`;
}

export function formatSectionHeader(input: SectionHeaderInput): SlackMessagePayload {
  const dollars = formatDollarAmount(input.totalAmount);
  return {
    channel: input.channel,
    text: `${input.emoji} ${input.label} \u2014 ${dollars}`,
  };
}

export interface ThreadHeaderInput {
  channel: string;
  dealName: string;
}

export function formatThreadHeader(input: ThreadHeaderInput): SlackMessagePayload {
  return {
    channel: input.channel,
    text: `*${input.dealName.toLowerCase()}*`,
  };
}

export interface StateDiffReplyInput {
  channel: string;
  thread_ts: string;
  currentState: string;
  weeklyDiff: string;
}

export function formatStateDiffReply(input: StateDiffReplyInput): SlackMessagePayload {
  const state = sanitizeText(input.currentState);
  const diff = sanitizeText(input.weeklyDiff);
  return {
    channel: input.channel,
    thread_ts: input.thread_ts,
    text: `${state}\n\n_This week:_ ${diff}`,
  };
}

export interface OwnerPromptReplyInput {
  channel: string;
  thread_ts: string;
  ownerSlackTag: string;
  dealName: string;
}

// Em dash intentionally preserved — Slack display message, not plain-text.
export function formatOwnerPromptReply(input: OwnerPromptReplyInput): SlackMessagePayload {
  return {
    channel: input.channel,
    thread_ts: input.thread_ts,
    text: `${input.ownerSlackTag} \u2014 What do we need to accomplish with ${input.dealName} this week? What's our stretch goal?`,
  };
}

export interface DateDividerInput {
  channel: string;
  date: string;
}

// Em dashes intentionally preserved — Slack display message, not plain-text.
export function formatDateDivider(input: DateDividerInput): SlackMessagePayload {
  return {
    channel: input.channel,
    text: `\u2014\u2014\u2014\u2014 ${input.date} \u2014\u2014\u2014\u2014`,
  };
}

export interface PipelineNarrativeInput {
  channel: string;
  narrative: string;
}

export function formatPipelineNarrative(input: PipelineNarrativeInput): SlackMessagePayload {
  return {
    channel: input.channel,
    text: sanitizeText(input.narrative),
  };
}
