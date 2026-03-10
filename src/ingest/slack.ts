import type { SlackMessage } from "../types/ingest.js";
import { sortByDate } from "./sort.js";

export function mergeSlackText(messages: SlackMessage[]): string {
  if (messages.length === 0) return "";
  return sortByDate(
    messages.filter((message) => message.text.trim().length > 0),
    (message) => message.timestamp ?? message.ts,
  )
    .map((m) => {
      const who = m.user_name ?? m.username ?? m.user ?? "unknown";
      const channel = m.channel?.name ?? "dm";
      return `[${channel}] ${who}: ${m.text}`;
    })
    .join("\n");
}
