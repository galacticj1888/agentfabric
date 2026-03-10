import type { SlackMessage } from "../types/ingest.js";

export function mergeSlackText(messages: SlackMessage[]): string {
  if (messages.length === 0) return "";
  return messages
    .map((m) => {
      const who = m.user_name ?? m.username ?? m.user ?? "unknown";
      const channel = m.channel?.name ?? "dm";
      return `[${channel}] ${who}: ${m.text}`;
    })
    .join("\n");
}
