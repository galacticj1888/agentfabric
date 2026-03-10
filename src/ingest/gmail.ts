import type { GmailThread } from "../types/ingest.js";

export function mergeGmailText(threads: GmailThread[]): string {
  if (threads.length === 0) return "";
  return threads
    .map((t) => {
      const body = t.body ?? t.snippet ?? "";
      return `Subject: ${t.subject}\nFrom: ${t.from} (${t.date})\n${body}`;
    })
    .join("\n\n---\n\n");
}
