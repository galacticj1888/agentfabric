import { describe, it, expect } from "vitest";
import { buildIngestData, mergeTranscriptText, mergeSlackText, mergeCalendarText } from "../../src/ingest/index.js";
import type { FirefliesTranscript, SlackMessage, CalendarEvent } from "../../src/types/ingest.js";

describe("buildIngestData", () => {
  it("assembles ingest data from partial sources", () => {
    const transcripts: FirefliesTranscript[] = [{
      id: "t1", title: "Call with FINRA", dateString: "2026-03-09",
      summary: { short_summary: "Discussed POC timeline" },
    }];
    const messages: SlackMessage[] = [
      { text: "FINRA update: POC approved", ts: "1741500000.000000" },
    ];
    const result = buildIngestData("FINRA", {
      fireflies: { transcripts },
      slack: { messages },
    });
    expect(result.account).toBe("FINRA");
    expect(result.fireflies?.transcripts).toHaveLength(1);
    expect(result.slack?.messages).toHaveLength(1);
    expect(result.calendar).toBeUndefined();
  });

  it("handles empty sources gracefully", () => {
    const result = buildIngestData("FINRA", {});
    expect(result.account).toBe("FINRA");
    expect(result.fireflies).toBeUndefined();
  });
});

describe("mergeTranscriptText", () => {
  it("combines transcript summaries and action items", () => {
    const transcripts: FirefliesTranscript[] = [
      {
        id: "t1", title: "FINRA Kickoff", dateString: "2026-03-07",
        summary: {
          short_summary: "Discussed POC scope",
          action_items: "**Jeff**\nSend pricing\n**Duane**\nGet team aligned",
        },
      },
      {
        id: "t2", title: "FINRA Follow-up", dateString: "2026-03-09",
        transcript: "Full transcript text here",
      },
    ];
    const text = mergeTranscriptText(transcripts);
    expect(text).toContain("FINRA Kickoff");
    expect(text).toContain("Discussed POC scope");
    expect(text).toContain("Send pricing");
    expect(text).toContain("Full transcript text here");
  });

  it("returns empty string for no transcripts", () => {
    expect(mergeTranscriptText([])).toBe("");
  });
});

describe("mergeSlackText", () => {
  it("formats messages with channel and user", () => {
    const messages: SlackMessage[] = [
      { text: "POC approved", ts: "123", user_name: "jeff", channel: { id: "C1", name: "ext-finra" } },
      { text: "Great news", ts: "124", username: "ryan" },
    ];
    const text = mergeSlackText(messages);
    expect(text).toContain("[ext-finra] jeff: POC approved");
    expect(text).toContain("ryan: Great news");
  });

  it("returns empty string for no messages", () => {
    expect(mergeSlackText([])).toBe("");
  });
});

describe("mergeCalendarText", () => {
  it("formats events with attendees", () => {
    const events: CalendarEvent[] = [{
      id: "e1", title: "FINRA POC Kickoff", start: "2026-03-10T10:00:00Z",
      attendees: ["duane@finra.org", "jeff@runlayer.com"],
    }];
    const text = mergeCalendarText(events);
    expect(text).toContain("FINRA POC Kickoff");
    expect(text).toContain("duane@finra.org");
  });

  it("returns empty string for no events", () => {
    expect(mergeCalendarText([])).toBe("");
  });
});
