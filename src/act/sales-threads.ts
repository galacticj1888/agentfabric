import { sanitizeText } from "../utils/index.js";

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
