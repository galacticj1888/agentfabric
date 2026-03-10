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

  it("sanitizes unicode in subject and body", () => {
    const result = formatEmailDraftForMCP({
      to: ["test@test.com"],
      subject: "Great session today \u2014 Thursday recap",
      body: "Jonathan \u2014 adding the connector will be a big unlock",
    });
    expect(result.subject).not.toContain("\u2014");
    expect(result.subject).toContain(" - ");
    expect(result.body).not.toContain("\u2014");
    expect(result.body).toContain(" - ");
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

  it("repairs mojibake and normalizes plain-text email spacing", () => {
    const result = formatEmailDraftForMCP({
      to: ["test@test.com"],
      subject: "Great connecting today \u00e2\u20ac\u201d next steps",
      body: "Sydney,\r\n\r\nKey takeaways:\r\n\u2022 Role scope\u00a0\r\n\r\n\r\nNext steps:\r\n\u2022 Send terms",
    });
    expect(result.subject).toBe("Great connecting today - next steps");
    expect(result.body).toContain("Key takeaways:\n- Role scope");
    expect(result.body).not.toContain("\r");
    expect(result.body).not.toContain("\u00a0");
    expect(result.body).not.toContain("\n\n\n");
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

  it("sanitizes unicode in task titles and descriptions", () => {
    const tasks = formatLinearTasksForMCP({
      commitments: [
        {
          who: "Jeff",
          toWhom: "Duane",
          what: "Send pricing proposal — revised",
          rawQuote: "I'll send the “final” version…",
          confidence: "explicit" as const,
          source: "fireflies",
        },
      ],
      account: "FINRA",
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toContain(" - revised");
    expect(tasks[0].title).not.toContain("\u2014");
    expect(tasks[0].description).toContain('"final"');
    expect(tasks[0].description).toContain("version...");
    expect(tasks[0].description).not.toContain("\u201c");
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

  it("sanitizes unicode in text", () => {
    const result = formatSalesThreadForMCP({
      channel: "sales-threads",
      text: "FINRA \u2014 big momentum today",
    });
    expect(result.text).not.toContain("\u2014");
    expect(result.text).toContain(" - ");
  });

  it("includes thread_ts when provided", () => {
    const result = formatSalesThreadForMCP({
      channel: "sales-threads",
      text: "Pricing sent",
      thread_ts: "1741500000.000000",
    });
    expect(result.thread_ts).toBe("1741500000.000000");
  });

  it("omits thread_ts when not provided", () => {
    const result = formatSalesThreadForMCP({
      channel: "sales-threads",
      text: "New account thread",
    });
    expect(result.thread_ts).toBeUndefined();
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

  it("sanitizes unicode in summary text", () => {
    const result = formatCustomerSummaryForReview({
      account: "FINRA",
      targetChannel: "ext-finra-runlayer",
      summary: "Discussed timeline \u2014 looking good",
    });
    expect(result.text).not.toContain("\u2014");
    expect(result.text).toContain(" - ");
  });
});
