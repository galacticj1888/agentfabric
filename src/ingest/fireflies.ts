import type { FirefliesTranscript } from "../types/ingest.js";

export function mergeTranscriptText(transcripts: FirefliesTranscript[]): string {
  if (transcripts.length === 0) return "";
  return transcripts
    .map((t) => {
      const parts: string[] = [`## ${t.title} (${t.dateString})`];
      if (t.summary?.short_summary) parts.push(`Summary: ${t.summary.short_summary}`);
      if (t.summary?.action_items) parts.push(`Action Items:\n${t.summary.action_items}`);
      if (t.summary?.keywords?.length) parts.push(`Keywords: ${t.summary.keywords.join(", ")}`);
      if (t.transcript) parts.push(`Transcript:\n${t.transcript}`);
      return parts.join("\n\n");
    })
    .join("\n\n---\n\n");
}
