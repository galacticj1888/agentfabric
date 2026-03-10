import { describe, it, expect } from "vitest";
import {
  FabricOutputSchema,
  CommitmentSchema,
  TakeawaySchema,
  FabricConfigSchema,
  AccountEntrySchema,
  IngestDataSchema,
} from "../../src/types/index.js";

describe("FabricOutput schema", () => {
  it("validates a complete output envelope", () => {
    const output = {
      runId: "run-abc123",
      userId: "jeff",
      meetingId: "fireflies-xyz",
      account: "FINRA",
      timestamp: "2026-03-09T15:00:00Z",
      sources: ["fireflies", "slack", "calendar"],
      commitments: [
        {
          who: "Jeff Settle",
          toWhom: "Duane Whitt",
          what: "Send pricing proposal",
          byWhen: "2026-03-12",
          confidence: "explicit" as const,
          rawQuote: "I'll get you pricing by Wednesday",
          source: "fireflies",
        },
      ],
      takeaways: [
        {
          type: "decision" as const,
          summary: "FINRA will proceed with POC",
          details: "Duane confirmed team alignment",
          account: "FINRA",
        },
      ],
      actions: {},
    };
    expect(FabricOutputSchema.parse(output)).toBeDefined();
  });

  it("rejects output missing required fields", () => {
    expect(() => FabricOutputSchema.parse({})).toThrow();
  });
});

describe("Commitment schema", () => {
  it("validates a commitment", () => {
    const commitment = {
      who: "Ryan Kearns",
      toWhom: "FINRA team",
      what: "Follow up on technical requirements",
      byWhen: "2026-03-10",
      confidence: "implied" as const,
      rawQuote: "I'll circle back on that",
      source: "fireflies",
    };
    expect(CommitmentSchema.parse(commitment)).toBeDefined();
  });

  it("rejects invalid confidence level", () => {
    expect(() => CommitmentSchema.parse({
      who: "Jeff", toWhom: "Duane", what: "test",
      confidence: "maybe", source: "test",
    })).toThrow();
  });
});

describe("Takeaway schema", () => {
  it("validates all takeaway types", () => {
    const types = ["decision", "risk", "blocker", "opportunity", "insight"] as const;
    for (const type of types) {
      expect(TakeawaySchema.parse({
        type, summary: "Test", account: "FINRA",
      })).toBeDefined();
    }
  });
});

describe("FabricConfig schema", () => {
  it("validates user config with defaults", () => {
    const config = FabricConfigSchema.parse({
      userId: "jeff",
      voiceProfilePath: "~/.agentfabric/voice-profile.md",
    });
    expect(config.salesThreadsChannel).toBe("sales-threads");
    expect(config.defaultSources).toEqual(["fireflies", "slack", "calendar"]);
  });
});

describe("AccountEntry schema", () => {
  it("validates an account entry", () => {
    const account = AccountEntrySchema.parse({
      name: "FINRA",
      slackChannel: "ext-finra-runlayer",
      domain: "finra.org",
      contacts: ["duane.whitt@finra.org"],
    });
    expect(account.name).toBe("FINRA");
    expect(account.contacts).toHaveLength(1);
  });

  it("defaults contacts to empty array", () => {
    const account = AccountEntrySchema.parse({ name: "Test" });
    expect(account.contacts).toEqual([]);
  });
});

describe("IngestData schema", () => {
  it("validates with partial sources", () => {
    const data = IngestDataSchema.parse({
      account: "FINRA",
      fetchedAt: "2026-03-09T15:00:00Z",
      fireflies: {
        transcripts: [{
          id: "t1", title: "FINRA Call", dateString: "2026-03-09",
          summary: { short_summary: "Discussed POC" },
        }],
      },
    });
    expect(data.fireflies?.transcripts).toHaveLength(1);
    expect(data.slack).toBeUndefined();
  });
});
