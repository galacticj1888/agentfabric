import { z } from "zod";
import { GOD_PROMPT_TEMPLATE } from "./prompt-templates.js";
import { CommitmentSchema, TakeawaySchema } from "../types/fabric.js";
import type { Commitment, Takeaway } from "../types/fabric.js";

// --- God Prompt Builder ---

interface GodPromptInput {
  sourceText: string;
  account: string;
  voiceProfile?: string;
  previousCommitments?: Commitment[];
}

export function buildGodPrompt(input: GodPromptInput): string {
  const previousSection = input.previousCommitments?.length
    ? `## Previous Commitments (from last meeting)\n\n${buildPreviousRunContext(input.previousCommitments)}`
    : "";

  return GOD_PROMPT_TEMPLATE
    .replace("{ACCOUNT}", input.account)
    .replace("{VOICE_PROFILE}", input.voiceProfile || "Professional and concise. Match a natural business tone.")
    .replace("{SOURCE_TEXT}", input.sourceText)
    .replace("{PREVIOUS_COMMITMENTS_SECTION}", previousSection);
}

// --- Response Parser ---

const GodPromptResponseSchema = z.object({
  commitments: z.array(z.object({
    who: z.string(),
    toWhom: z.string(),
    what: z.string(),
    byWhen: z.string().nullable().optional(),
    confidence: z.enum(["explicit", "implied", "inferred"]),
    rawQuote: z.string().nullable().optional(),
  })),
  takeaways: z.array(z.object({
    type: z.enum(["decision", "risk", "blocker", "opportunity", "insight"]),
    summary: z.string(),
    details: z.string().optional(),
  })),
  emailDraft: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  salesThreadUpdate: z.string(),
  customerSummary: z.string(),
});

interface ParsedGodPromptResponse {
  commitments: Commitment[];
  takeaways: Takeaway[];
  emailDraft: { subject: string; body: string };
  salesThreadUpdate: string;
  customerSummary: string;
}

export function parseGodPromptResponse(
  response: string,
  account: string,
  source: string,
): ParsedGodPromptResponse | null {
  try {
    // Try to extract JSON from code fence first
    const fenceMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    const jsonStr = fenceMatch ? fenceMatch[1].trim() : response.trim();

    // Find the JSON object
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!objMatch) return null;

    const raw = JSON.parse(objMatch[0]);
    const parsed = GodPromptResponseSchema.parse(raw);

    return {
      commitments: parsed.commitments.map((c) =>
        CommitmentSchema.parse({
          ...c,
          byWhen: c.byWhen ?? undefined,
          rawQuote: c.rawQuote ?? undefined,
          source,
        })
      ),
      takeaways: parsed.takeaways.map((t) =>
        TakeawaySchema.parse({ ...t, account })
      ),
      emailDraft: parsed.emailDraft,
      salesThreadUpdate: parsed.salesThreadUpdate,
      customerSummary: parsed.customerSummary,
    };
  } catch {
    return null;
  }
}

// --- Previous Run Context ---

export function buildPreviousRunContext(commitments: Commitment[]): string {
  if (commitments.length === 0) return "";
  return commitments
    .map((c) => {
      const due = c.byWhen ? ` (due: ${c.byWhen})` : "";
      return `- ${c.who} \u2192 ${c.toWhom}: ${c.what}${due} [${c.confidence}]`;
    })
    .join("\n");
}
