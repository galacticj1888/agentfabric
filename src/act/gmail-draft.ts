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

export function formatEmailDraftForMCP(input: EmailDraftInput): EmailDraftPayload {
  return {
    to: input.to,
    cc: input.cc ?? [],
    subject: input.subject,
    body: input.body,
  };
}
