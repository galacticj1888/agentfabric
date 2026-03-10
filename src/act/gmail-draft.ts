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

function normalizeEmailSubject(subject: string): string {
  return sanitizeText(subject.trim()).replace(/\s+/g, " ");
}

function normalizeEmailBody(body: string): string {
  return sanitizeText(body.trim())
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
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
    subject: normalizeEmailSubject(input.subject),
    body: normalizeEmailBody(input.body),
  };
}
