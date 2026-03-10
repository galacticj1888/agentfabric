import type { GmailThread } from "../types/ingest.js";
import { sortByDate } from "./sort.js";

export function mergeGmailText(threads: GmailThread[]): string {
  if (threads.length === 0) return "";
  return sortByDate(threads, (thread) => thread.date)
    .map((t) => {
      const body = t.body ?? t.snippet ?? "";
      return `Subject: ${t.subject}\nFrom: ${t.from} (${t.date})\nTo: ${t.to.join(", ")}\n${body}`;
    })
    .join("\n\n---\n\n");
}
