import { describe, it, expect } from "vitest";
import {
  formatEmailDraftForMCP,
  formatLinearTasksForMCP,
  formatSalesThreadForMCP,
  formatCustomerSummaryForReview,
} from "../../src/act/index.js";

describe("formatEmailDraftForMCP", () => {
  it("formats email draft with recipients and subject", () => {
    const result = formatEmailDraftForMCP({
      to: ["duane.whitt@finra.org"],
      subject: "Following up: FINRA POC Kickoff",
      body: "Hi Duane,\n\nGreat call today...",
    });
    expect(result.to).toContain("duane.whitt@finra.org");
    expect(result.subject).toContain("FINRA");
    expect(result.body).toContain("Great call");
  });

  it("defaults cc to empty array", () => {
    const result = formatEmailDraftForMCP({
      to: ["test@test.com"], subject: "Test", body: "Test",
    });
    expect(result.cc).toEqual([]);
  });

  it("deduplicates recipients and removes cc entries already present in to", () => {
    const result = formatEmailDraftForMCP({
      to: [" jeff@runlayer.com ", "JEFF@runlayer.com", "finra@finra.org"],
      cc: ["finra@finra.org", "team@runlayer.com", "team@runlayer.com"],
      subject: " Subject ",
      body: " Body ",
    });
    expect(result.to).toEqual(["jeff@runlayer.com", "finra@finra.org"]);
    expect(result.cc).toEqual(["team@runlayer.com"]);
    expect(result.subject).toBe("Subject");
    expect(result.body).toBe("Body");
  });
});

describe("formatLinearTasksForMCP", () => {
  it("formats commitments as Linear task payloads", () => {
    const tasks = formatLinearTasksForMCP({
      commitments: [
        {
          who: "Jeff", toWhom: "Duane", what: "Send pricing proposal",
          confidence: "explicit" as const, source: "fireflies",
        },
      ],
      account: "FINRA",
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toContain("Send pricing proposal");
    expect(tasks[0].title).toContain("FINRA");
    expect(tasks[0].description).toContain("FINRA");
  });

  it("filters out commitments not owned by team members", () => {
    const tasks = formatLinearTasksForMCP({
      commitments: [
        {
          who: "Duane Whitt", toWhom: "Jeff", what: "Get team aligned",
          confidence: "explicit" as const, source: "fireflies",
        },
      ],
      account: "FINRA",
      teamMembers: ["Jeff", "Ryan", "Andrew", "Kyle"],
    });
    expect(tasks).toHaveLength(0);
  });

  it("includes all commitments when no team filter", () => {
    const tasks = formatLinearTasksForMCP({
      commitments: [
        { who: "External Person", toWhom: "Jeff", what: "Do something", confidence: "explicit" as const, source: "test" },
      ],
      account: "Test",
    });
    expect(tasks).toHaveLength(1);
  });

  it("excludes inferred commitments by default", () => {
    const tasks = formatLinearTasksForMCP({
      commitments: [
        { who: "Jeff", toWhom: "Duane", what: "Maybe send pricing", confidence: "inferred" as const, source: "test" },
      ],
      account: "FINRA",
    });
    expect(tasks).toHaveLength(0);
  });

  it("supports explicit opt-in for inferred commitments", () => {
    const tasks = formatLinearTasksForMCP({
      commitments: [
        { who: "Jeff", toWhom: "Duane", what: "Maybe send pricing", confidence: "inferred" as const, source: "test" },
      ],
      account: "FINRA",
      includeInferred: true,
    });
    expect(tasks).toHaveLength(1);
  });

  it("matches team members on token boundaries instead of substrings", () => {
    const tasks = formatLinearTasksForMCP({
      commitments: [
        { who: "Joann Smith", toWhom: "Jeff", what: "Handle procurement", confidence: "explicit" as const, source: "test" },
      ],
      account: "FINRA",
      teamMembers: ["Ann"],
    });
    expect(tasks).toHaveLength(0);
  });
});

describe("formatSalesThreadForMCP", () => {
  it("formats Slack message for sales threads", () => {
    const result = formatSalesThreadForMCP({
      channel: "sales-threads",
      text: "*FINRA*: POC approved, sending pricing Wednesday",
    });
    expect(result.channel).toBe("sales-threads");
    expect(result.text).toContain("FINRA");
  });
});

describe("formatCustomerSummaryForReview", () => {
  it("wraps summary in a review message for the user", () => {
    const result = formatCustomerSummaryForReview({
      account: "FINRA",
      targetChannel: "ext-finra-runlayer",
      summary: "Thanks for the great call today. Here's what we discussed...",
    });
    expect(result.text).toContain("FINRA");
    expect(result.text).toContain("ext-finra-runlayer");
    expect(result.text).toContain("great call today");
    expect(result.text).toContain("review");
  });

  it("includes the target channel so user knows where to post", () => {
    const result = formatCustomerSummaryForReview({
      account: "Goldman Sachs",
      targetChannel: "ext-gs-runlayer",
      summary: "Summary text here",
    });
    expect(result.text).toContain("ext-gs-runlayer");
  });

  it("does not duplicate the channel prefix when target already includes #", () => {
    const result = formatCustomerSummaryForReview({
      account: "FINRA",
      targetChannel: "#ext-finra-runlayer",
      summary: "Summary text here",
    });
    expect(result.text).toContain("`#ext-finra-runlayer`");
    expect(result.text).not.toContain("##ext-finra-runlayer");
  });
});
