import { sanitizeText } from "../utils/index.js";

export interface EmailDraftInput {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
}

export interface EmailDraftPayload {
  to: string[];
  cc: string[];
  subject: string;
  body: string;
}

function normalizeRecipients(recipients: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const recipient of recipients) {
    const trimmed = recipient.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

export function formatEmailDraftForMCP(input: EmailDraftInput): EmailDraftPayload {
  const to = normalizeRecipients(input.to);
  const blockedCc = new Set(to.map((recipient) => recipient.toLowerCase()));
  const cc = normalizeRecipients(input.cc ?? [])
    .filter((recipient) => !blockedCc.has(recipient.toLowerCase()));

  return {
    to,
    cc,
    subject: sanitizeText(input.subject.trim()),
    body: sanitizeText(input.body.trim()),
  };
}
