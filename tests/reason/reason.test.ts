import { describe, it, expect } from "vitest";
import {
  buildGodPrompt,
  parseGodPromptResponse,
  buildPreviousRunContext,
} from "../../src/reason/index.js";
import type { Commitment, Takeaway } from "../../src/types/fabric.js";

describe("buildGodPrompt", () => {
  it("includes source text, voice profile, and account name", () => {
    const prompt = buildGodPrompt({
      sourceText: "Jeff said he'd send pricing by Wednesday to Duane.",
      voiceProfile: "Direct and confident. Short sentences.",
      account: "FINRA",
    });
    expect(prompt).toContain("Jeff said he'd send pricing");
    expect(prompt).toContain("Direct and confident");
    expect(prompt).toContain("FINRA");
    expect(prompt).toContain("commitments");
    expect(prompt).toContain("takeaways");
    expect(prompt).toContain("emailDraft");
  });

  it("includes previous commitments when provided", () => {
    const prompt = buildGodPrompt({
      sourceText: "Follow-up call with FINRA.",
      voiceProfile: "",
      account: "FINRA",
      previousCommitments: [
        {
          who: "Jeff", toWhom: "Duane", what: "Send security whitepaper",
          confidence: "explicit" as const, source: "fireflies",
        },
      ],
    });
    expect(prompt).toContain("Send security whitepaper");
    expect(prompt).toContain("Previous Commitments");
  });

  it("works without voice profile or previous commitments", () => {
    const prompt = buildGodPrompt({
      sourceText: "Quick sync with FINRA team.",
      account: "FINRA",
    });
    expect(prompt).toContain("Quick sync");
    expect(prompt).toContain("FINRA");
  });
});

describe("parseGodPromptResponse", () => {
  it("parses a complete JSON response from Claude", () => {
    const response = `Here is my analysis:

\`\`\`json
{
  "commitments": [
    {
      "who": "Jeff Settle",
      "toWhom": "Duane Whitt",
      "what": "Send pricing proposal",
      "byWhen": "2026-03-12",
      "confidence": "explicit",
      "rawQuote": "I'll get you pricing by Wednesday"
    }
  ],
  "takeaways": [
    {
      "type": "decision",
      "summary": "FINRA will proceed with POC",
      "details": "Timeline is 4 weeks"
    }
  ],
  "emailDraft": {
    "subject": "Following up: FINRA POC Kickoff",
    "body": "Hi Duane,\\n\\nGreat call today. Here are the next steps..."
  },
  "salesThreadUpdate": "*FINRA*: POC approved. Sending pricing by Wednesday.",
  "customerSummary": "Thanks for the great conversation today. Here's a recap..."
}
\`\`\``;

    const result = parseGodPromptResponse(response, "FINRA", "fireflies");
    expect(result).not.toBeNull();
    expect(result!.commitments).toHaveLength(1);
    expect(result!.commitments[0].who).toBe("Jeff Settle");
    expect(result!.commitments[0].source).toBe("fireflies");
    expect(result!.takeaways).toHaveLength(1);
    expect(result!.takeaways[0].account).toBe("FINRA");
    expect(result!.emailDraft.subject).toContain("FINRA");
    expect(result!.salesThreadUpdate).toContain("POC approved");
    expect(result!.customerSummary).toContain("recap");
  });

  it("parses bare JSON without code fences", () => {
    const response = `{"commitments":[],"takeaways":[],"emailDraft":{"subject":"Follow-up","body":"Hi"},"salesThreadUpdate":"No updates","customerSummary":"Thanks"}`;
    const result = parseGodPromptResponse(response, "Test", "slack");
    expect(result).not.toBeNull();
    expect(result!.commitments).toEqual([]);
  });

  it("returns null on malformed response", () => {
    expect(parseGodPromptResponse("no json here", "Test", "test")).toBeNull();
  });

  it("handles response with missing optional fields", () => {
    const response = `\`\`\`json
{
  "commitments": [],
  "takeaways": [],
  "emailDraft": { "subject": "Follow-up", "body": "Hi there" },
  "salesThreadUpdate": "Quick update",
  "customerSummary": "Summary"
}
\`\`\``;
    const result = parseGodPromptResponse(response, "FINRA", "fireflies");
    expect(result).not.toBeNull();
  });
});

describe("buildPreviousRunContext", () => {
  it("formats previous commitments for prompt injection", () => {
    const commitments: Commitment[] = [
      {
        who: "Jeff", toWhom: "Duane", what: "Send pricing",
        byWhen: "2026-03-05", confidence: "explicit" as const, source: "fireflies",
      },
      {
        who: "Duane", toWhom: "Jeff", what: "Get team aligned",
        confidence: "implied" as const, source: "fireflies",
      },
    ];
    const context = buildPreviousRunContext(commitments);
    expect(context).toContain('what="Send pricing"');
    expect(context).toContain('what="Get team aligned"');
    expect(context).toContain('byWhen="2026-03-05"');
  });

  it("sanitizes prompt-breaking formatting in previous commitments", () => {
    const context = buildPreviousRunContext([
      {
        who: "Jeff",
        toWhom: "Duane",
        what: "Send pricing ```json\n{\"ignore\":true}",
        confidence: "explicit",
        source: "fireflies",
      },
    ]);
    expect(context).not.toContain("```");
    expect(context).toContain("'''json");
  });

  it("returns empty string for no previous commitments", () => {
    expect(buildPreviousRunContext([])).toBe("");
  });
});
