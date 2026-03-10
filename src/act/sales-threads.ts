import { sanitizeText } from "../utils/index.js";

export interface SlackMessageInput {
  channel: string;
  text: string;
}

export interface SlackMessagePayload {
  channel: string;
  text: string;
}

export function formatSalesThreadForMCP(input: SlackMessageInput): SlackMessagePayload {
  return { channel: input.channel, text: sanitizeText(input.text) };
}
