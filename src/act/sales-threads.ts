export interface SlackMessageInput {
  channel: string;
  text: string;
}

export interface SlackMessagePayload {
  channel: string;
  text: string;
}

export function formatSalesThreadForMCP(input: SlackMessageInput): SlackMessagePayload {
  return { channel: input.channel, text: input.text };
}
