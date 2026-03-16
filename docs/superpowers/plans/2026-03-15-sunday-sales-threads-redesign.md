# Sunday Sales Threads Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the sunday-sales-threads skill with stage-grouped sections, weekly diff analysis, Notion weekly log, pipeline narrative approval gate, owner accountability prompts, and stale burrito report.

**Architecture:** Two-phase pipeline — parallel analysis agents gather max context per account, then a single serial orchestrator publishes to Notion and Slack in deterministic alphabetical order within stage-grouped sections.

**Tech Stack:** TypeScript, Zod, Vitest, Claude Code skill (SKILL.md)

**Spec:** `docs/superpowers/specs/2026-03-15-sunday-sales-threads-redesign.md`

---

## Chunk 1: Types & Formatters

### Task 1: Add Zod schemas for sales threads pipeline types

**Files:**
- Modify: `src/types/fabric.ts:80-88`
- Modify: `src/types/index.ts`
- Test: `tests/types/schemas.test.ts`

- [ ] **Step 1: Write failing tests for new schemas**

Add to `tests/types/schemas.test.ts`:

```typescript
import {
  DealAnalysisResultSchema,
  PipelineSectionSchema,
  SalesThreadsRosterSchema,
} from "../../src/types/index.js";

describe("DealAnalysisResultSchema", () => {
  it("validates a complete analysis result", () => {
    const result = DealAnalysisResultSchema.parse({
      dealName: "Acme Corp",
      stage: "decisionmakerboughtin",
      section: "closing",
      owner: { id: "161976256", name: "Andrew Lenehan", slackTag: "<@U0AAUJEB2US>" },
      amount: 500000,
      closeDate: "2026-04-01",
      currentState: "Procurement review underway. Legal redlines returned this week.",
      weeklyDiff: "Legal redlines cleared. Security questionnaire submitted.",
      notionEntry: "## Acme Corp\n**Stage:** Negotiation | **Amount:** $500K\n\nProcurement review underway.",
      isStale: false,
      daysSinceActivity: 2,
      stuckInStage: "",
    });
    expect(result.dealName).toBe("Acme Corp");
    expect(result.section).toBe("closing");
  });

  it("rejects invalid section values", () => {
    expect(() =>
      DealAnalysisResultSchema.parse({
        dealName: "Test",
        stage: "test",
        section: "invalid",
        owner: { id: "1", name: "Test", slackTag: "<@U1>" },
        amount: 0,
        closeDate: "2026-01-01",
        currentState: "Test",
        weeklyDiff: "Test",
        notionEntry: "Test",
        isStale: false,
        daysSinceActivity: 0,
        stuckInStage: "",
      })
    ).toThrow();
  });
});

describe("PipelineSectionSchema", () => {
  it("validates a section with deals and dollar total", () => {
    const section = PipelineSectionSchema.parse({
      name: "closing",
      emoji: "🔥",
      label: "CLOSING",
      totalAmount: 1200000,
      deals: [],
    });
    expect(section.emoji).toBe("🔥");
    expect(section.totalAmount).toBe(1200000);
  });
});

describe("SalesThreadsRosterSchema", () => {
  it("validates a full roster with three sections", () => {
    const roster = SalesThreadsRosterSchema.parse({
      closing: { name: "closing", emoji: "🔥", label: "CLOSING", totalAmount: 0, deals: [] },
      poc: { name: "poc", emoji: "⚙️", label: "POC", totalAmount: 0, deals: [] },
      pipeline: { name: "pipeline", emoji: "🌱", label: "PIPELINE", totalAmount: 0, deals: [] },
      killedDeals: [],
      totalAmount: 0,
      totalDeals: 0,
    });
    expect(roster.closing.emoji).toBe("🔥");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/types/schemas.test.ts`
Expected: FAIL — imports not found

- [ ] **Step 3: Implement the schemas**

Add to `src/types/fabric.ts` after the `AccountEntrySchema`:

```typescript
// --- Sales Threads Pipeline Types ---

export const DealOwnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  slackTag: z.string(),
});
export type DealOwner = z.infer<typeof DealOwnerSchema>;

export const DealAnalysisResultSchema = z.object({
  dealName: z.string(),
  stage: z.string(),
  section: z.enum(["closing", "poc", "pipeline"]),
  owner: DealOwnerSchema,
  amount: z.number(),
  closeDate: z.string(),
  currentState: z.string(),
  weeklyDiff: z.string(),
  notionEntry: z.string(),
  isStale: z.boolean(),
  daysSinceActivity: z.number(),
  stuckInStage: z.string(),
});
export type DealAnalysisResult = z.infer<typeof DealAnalysisResultSchema>;

export const PipelineSectionSchema = z.object({
  name: z.enum(["closing", "poc", "pipeline"]),
  emoji: z.string(),
  label: z.string(),
  totalAmount: z.number(),
  deals: z.array(DealAnalysisResultSchema),
});
export type PipelineSection = z.infer<typeof PipelineSectionSchema>;

export const SalesThreadsRosterSchema = z.object({
  closing: PipelineSectionSchema,
  poc: PipelineSectionSchema,
  pipeline: PipelineSectionSchema,
  killedDeals: z.array(z.string()),
  totalAmount: z.number(),
  totalDeals: z.number(),
});
export type SalesThreadsRoster = z.infer<typeof SalesThreadsRosterSchema>;
```

- [ ] **Step 4: No changes needed to `src/types/index.ts`**

The existing `export * from "./fabric.js"` wildcard re-export already covers all new schemas added to `fabric.ts`. No modification needed.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/types/schemas.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/fabric.ts tests/types/schemas.test.ts
git commit -m "feat: add Zod schemas for sales threads pipeline types"
```

---

### Task 2: Add new sales threads formatters

**Files:**
- Modify: `src/act/sales-threads.ts`
- Modify: `src/act/index.ts`
- Test: `tests/act/act.test.ts`

- [ ] **Step 1: Write failing tests for new formatters**

Add these new `describe` blocks to `tests/act/act.test.ts`:

```typescript
import {
  formatSectionHeader,
  formatThreadHeader,
  formatStateDiffReply,
  formatOwnerPromptReply,
  formatDateDivider,
  formatPipelineNarrative,
} from "../../src/act/index.js";

describe("formatSectionHeader", () => {
  it("formats a section header with emoji and dollar total", () => {
    const result = formatSectionHeader({
      channel: "C0AHTTDT4SG",
      emoji: "🔥",
      label: "CLOSING",
      totalAmount: 1200000,
    });
    expect(result.channel).toBe("C0AHTTDT4SG");
    expect(result.text).toBe("🔥 CLOSING — $1.2M");
  });

  it("formats amounts under 1M with K suffix", () => {
    const result = formatSectionHeader({
      channel: "C0AHTTDT4SG",
      emoji: "🌱",
      label: "PIPELINE",
      totalAmount: 400000,
    });
    expect(result.text).toBe("🌱 PIPELINE — $400K");
  });

  it("formats zero dollar amounts", () => {
    const result = formatSectionHeader({
      channel: "C0AHTTDT4SG",
      emoji: "⚙️",
      label: "POC",
      totalAmount: 0,
    });
    expect(result.text).toBe("⚙️ POC — $0");
  });
});

describe("formatThreadHeader", () => {
  it("formats deal name as bold lowercase", () => {
    const result = formatThreadHeader({
      channel: "C0AHTTDT4SG",
      dealName: "Acme Corp",
    });
    expect(result.text).toBe("*acme corp*");
    expect(result.channel).toBe("C0AHTTDT4SG");
  });

  it("preserves hyphens and suffixes in deal names", () => {
    const result = formatThreadHeader({
      channel: "C0AHTTDT4SG",
      dealName: "Klaviyo - Expansion",
    });
    expect(result.text).toBe("*klaviyo - expansion*");
  });
});

describe("formatStateDiffReply", () => {
  it("formats state and weekly diff as a threaded reply", () => {
    const result = formatStateDiffReply({
      channel: "C0AHTTDT4SG",
      thread_ts: "1741500000.000000",
      currentState: "Acme is a $500K negotiation-stage deal.",
      weeklyDiff: "Legal redlines cleared this week.",
    });
    expect(result.thread_ts).toBe("1741500000.000000");
    expect(result.text).toContain("$500K negotiation-stage deal");
    expect(result.text).toContain("Legal redlines cleared");
  });

  it("sanitizes unicode in state and diff text", () => {
    const result = formatStateDiffReply({
      channel: "C0AHTTDT4SG",
      thread_ts: "1741500000.000000",
      currentState: "Deal is progressing — procurement started",
      weeklyDiff: "Stage moved from "Qualified" to POC",
    });
    expect(result.text).not.toContain("\u2014");
    expect(result.text).not.toContain("\u201c");
  });
});

describe("formatOwnerPromptReply", () => {
  it("formats the owner accountability prompt as a threaded reply", () => {
    const result = formatOwnerPromptReply({
      channel: "C0AHTTDT4SG",
      thread_ts: "1741500000.000000",
      ownerSlackTag: "<@U0AAUJEB2US>",
      dealName: "Acme Corp",
    });
    expect(result.thread_ts).toBe("1741500000.000000");
    expect(result.text).toContain("<@U0AAUJEB2US>");
    expect(result.text).toContain("\u2014");
    expect(result.text).toContain("Acme Corp");
    expect(result.text).toContain("accomplish");
    expect(result.text).toContain("stretch goal");
  });
});

describe("formatDateDivider", () => {
  it("formats a date divider with em dashes", () => {
    const result = formatDateDivider({
      channel: "C0AHTTDT4SG",
      date: "03/15/2026",
    });
    expect(result.text).toBe("\u2014\u2014\u2014\u2014 03/15/2026 \u2014\u2014\u2014\u2014");
  });
});

describe("formatPipelineNarrative", () => {
  it("formats the narrative as a top-level message", () => {
    const result = formatPipelineNarrative({
      channel: "C0AHTTDT4SG",
      narrative: "Pipeline sits at $2.4M across 34 active deals.",
    });
    expect(result.channel).toBe("C0AHTTDT4SG");
    expect(result.text).toContain("$2.4M");
    expect(result.thread_ts).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/act/act.test.ts`
Expected: FAIL — imports not found

- [ ] **Step 3: Implement new formatters in `src/act/sales-threads.ts`**

Replace the entire file:

```typescript
import { sanitizeText } from "../utils/index.js";

// --- Existing types (preserved for process-meeting compatibility) ---

export interface SlackMessageInput {
  channel: string;
  text: string;
  thread_ts?: string;
}

export interface SlackMessagePayload {
  channel: string;
  text: string;
  thread_ts?: string;
}

export function formatSalesThreadForMCP(input: SlackMessageInput): SlackMessagePayload {
  const payload: SlackMessagePayload = { channel: input.channel, text: sanitizeText(input.text) };
  if (input.thread_ts) {
    payload.thread_ts = input.thread_ts;
  }
  return payload;
}

// --- New formatters for redesigned sales threads ---

export interface SectionHeaderInput {
  channel: string;
  emoji: string;
  label: string;
  totalAmount: number;
}

export function formatDollarAmount(amount: number): string {
  if (amount === 0) return "$0";
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `$${formatted}M`;
  }
  const thousands = Math.round(amount / 1000);
  return `$${thousands}K`;
}

// Em dashes intentionally preserved — Slack renders them correctly.
// sanitizeText is for Gmail/plain-text contexts, not Slack display messages.
export function formatSectionHeader(input: SectionHeaderInput): SlackMessagePayload {
  const dollars = formatDollarAmount(input.totalAmount);
  return {
    channel: input.channel,
    text: `${input.emoji} ${input.label} \u2014 ${dollars}`,
  };
}

export interface ThreadHeaderInput {
  channel: string;
  dealName: string;
}

export function formatThreadHeader(input: ThreadHeaderInput): SlackMessagePayload {
  return {
    channel: input.channel,
    text: `*${input.dealName.toLowerCase()}*`,
  };
}

export interface StateDiffReplyInput {
  channel: string;
  thread_ts: string;
  currentState: string;
  weeklyDiff: string;
}

export function formatStateDiffReply(input: StateDiffReplyInput): SlackMessagePayload {
  const state = sanitizeText(input.currentState);
  const diff = sanitizeText(input.weeklyDiff);
  return {
    channel: input.channel,
    thread_ts: input.thread_ts,
    text: `${state}\n\n_This week:_ ${diff}`,
  };
}

export interface OwnerPromptReplyInput {
  channel: string;
  thread_ts: string;
  ownerSlackTag: string;
  dealName: string;
}

// Em dash intentionally preserved — Slack display message, not plain-text.
export function formatOwnerPromptReply(input: OwnerPromptReplyInput): SlackMessagePayload {
  return {
    channel: input.channel,
    thread_ts: input.thread_ts,
    text: `${input.ownerSlackTag} \u2014 What do we need to accomplish with ${input.dealName} this week? What's our stretch goal?`,
  };
}

export interface DateDividerInput {
  channel: string;
  date: string;
}

// Em dashes intentionally preserved — Slack display message, not plain-text.
export function formatDateDivider(input: DateDividerInput): SlackMessagePayload {
  return {
    channel: input.channel,
    text: `\u2014\u2014\u2014\u2014 ${input.date} \u2014\u2014\u2014\u2014`,
  };
}

export interface PipelineNarrativeInput {
  channel: string;
  narrative: string;
}

export function formatPipelineNarrative(input: PipelineNarrativeInput): SlackMessagePayload {
  return {
    channel: input.channel,
    text: sanitizeText(input.narrative),
  };
}
```

- [ ] **Step 4: Update exports in `src/act/index.ts`**

Add to `src/act/index.ts`:
```typescript
export {
  formatSectionHeader,
  formatThreadHeader,
  formatStateDiffReply,
  formatOwnerPromptReply,
  formatDateDivider,
  formatPipelineNarrative,
  formatDollarAmount,
} from "./sales-threads.js";
export type {
  SectionHeaderInput,
  ThreadHeaderInput,
  StateDiffReplyInput,
  OwnerPromptReplyInput,
  DateDividerInput,
  PipelineNarrativeInput,
} from "./sales-threads.js";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/act/act.test.ts`
Expected: ALL PASS (existing tests still pass, new tests pass)

- [ ] **Step 6: Commit**

```bash
git add src/act/sales-threads.ts src/act/index.ts tests/act/act.test.ts
git commit -m "feat: add formatters for redesigned sales threads (section headers, state+diff, owner prompts)"
```

---

### Task 3: Add formatDollarAmount edge case tests

**Files:**
- Test: `tests/act/act.test.ts`

- [ ] **Step 1: Add edge case tests for dollar formatting**

Note: `formatDollarAmount` was already imported in Task 2's test additions.

Add to `tests/act/act.test.ts`:

```typescript
describe("formatDollarAmount", () => {
  it("formats millions with one decimal when not whole", () => {
    expect(formatDollarAmount(1_500_000)).toBe("$1.5M");
  });

  it("formats whole millions without decimal", () => {
    expect(formatDollarAmount(2_000_000)).toBe("$2M");
  });

  it("formats thousands", () => {
    expect(formatDollarAmount(250_000)).toBe("$250K");
  });

  it("rounds thousands to nearest K", () => {
    expect(formatDollarAmount(99_500)).toBe("$100K");
  });

  it("formats zero", () => {
    expect(formatDollarAmount(0)).toBe("$0");
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/act/act.test.ts`
Expected: PASS (these should pass with the implementation from Task 2)

- [ ] **Step 3: Commit**

```bash
git add tests/act/act.test.ts
git commit -m "test: add edge case coverage for formatDollarAmount"
```

---

## Chunk 2: Skill Rewrite

### Task 4: Rewrite the sunday-sales-threads SKILL.md

This is the main deliverable — the complete skill definition that Claude Code follows.

**Files:**
- Modify: `~/.claude/skills/sunday-sales-threads/SKILL.md`

- [ ] **Step 1: Read the current skill to confirm path**

Run: `cat ~/.claude/skills/sunday-sales-threads/SKILL.md | head -5`
Expected: Shows the current skill frontmatter

- [ ] **Step 2: Write the new SKILL.md**

Replace the entire file with the new skill definition:

```markdown
---
name: sunday-sales-threads
description: Weekly pipeline review — stage-grouped threads with analysis, owner accountability prompts, Notion weekly log, and stale burrito report
---

# Sunday Sales Threads

Weekly process that publishes a stage-grouped pipeline review to `#sales-threads`. Each account gets a weekly diff analysis and an owner accountability prompt. Results are archived to Notion.

## Trigger

- "Run sales threads"
- "Sunday process"
- "Populate sales threads"
- "Weekly threads"
- "/sunday-sales-threads"

## Constants

- **Sales channel:** `#sales-threads` (channel ID: `C0AHTTDT4SG`)
- **Notion Account Encyclopedia:** page ID `31d42cc7-c565-81de-ac98-ecc053492572`
- **DM target:** Jeff Settle (`U0A6PE41XK9`)
- **HubSpot connector:** `mcp__hubspot__search_crm_objects` (custom connector)

### HubSpot Stage → Section Mapping

| Stage ID | Stage Name | Section |
|----------|------------|---------|
| 3030348496 | 1a - Meeting Set | 🌱 PIPELINE |
| qualifiedtobuy | 1b - Meeting Occurred | 🌱 PIPELINE |
| presentationscheduled | 2 - Qualified | 🌱 PIPELINE |
| 3125411551 | 3 - Evaluation | 🌱 PIPELINE |
| 2122875630 | 4 - POC | ⚙️ POC |
| decisionmakerboughtin | 5 - Negotiation | 🔥 CLOSING |
| 3125411552 | 6 - Pre-Close | 🔥 CLOSING |

### Owner → Slack Tag Mapping

| HubSpot Owner ID | Name | Slack Tag |
|-------------------|------|-----------|
| 161976256 | Andrew Lenehan | `<@U0AAUJEB2US>` |
| 162120626 | Ryan Kearns | `<@U0ABFDUE6T0>` |
| 161657445 | Jeff Settle | `<@U0A6PE41XK9>` |

**Fallback rule:** Anyone NOT Andrew Lenehan or Ryan Kearns gets tagged to Jeff Settle (`<@U0A6PE41XK9>`).

---

## Execution Protocol

### Step 1: Pull HubSpot Pipeline

Use the custom HubSpot connector to pull all active deals:

```
mcp__hubspot__search_crm_objects
  objectType: "deals"
  properties: ["dealname", "dealstage", "hubspot_owner_id", "amount", "closedate"]
  filterGroups: [{
    filters: [{
      propertyName: "dealstage",
      operator: "IN",
      values: ["3030348496", "qualifiedtobuy", "presentationscheduled", "3125411551", "2122875630", "decisionmakerboughtin", "3125411552"]
    }]
  }]
  limit: 200
```

Check the `total` count — if > 200, paginate with `offset` to get all deals. Capture: deal name, stage, owner ID, amount, close date.

### Step 2: Skull Emoji Scan — Identify Dead Deals

Pull last week's messages from #sales-threads:

```
mcp__claude_ai_Slack_2__get_channel_history
  channel: "C0AHTTDT4SG"
  oldest: "[last Sunday's date as Unix timestamp]"
  limit: 200
```

Filter for top-level messages (no `thread_ts`, or `thread_ts == ts`) matching the bold deal name pattern (`*deal name*`).

For each matching thread header message, check reactions:

```
mcp__claude_ai_Slack_2__get_reactions
  channel: "C0AHTTDT4SG"
  timestamp: "[message ts]"
```

Any message with a `skull` reaction (💀): extract the deal name, add to a **kill list**.

### Step 3: Build the Active Deal Roster

HubSpot deals minus skull'd deals = active roster.

Group into three sections using the stage mapping above:
- **🔥 CLOSING** — stages 5 + 6
- **⚙️ POC** — stage 4
- **🌱 PIPELINE** — stages 1a through 3

**Sort alphabetically within each section by deal name.**

Calculate dollar totals per section by summing the `amount` field.

### Step 4: Phase 1 — Parallel Analysis Agents

Spawn parallel background agents to analyze each account. Batch accounts into groups of ~10-12 for efficiency. Each agent processes its batch sequentially.

**For each account, the analysis agent gathers:**

1. **Notion lookup:**
```
mcp__claude_ai_Notion__notion-search
  query: "[company base name]"
```
Search within the Account Encyclopedia (page ID: `31d42cc7-c565-81de-ac98-ecc053492572`). If the deal name has a suffix (e.g., "Gusto - Expansion"), search for the base company name ("Gusto"). Fetch the matching child page and extract the TL;DR section.

2. **Last week's Slack thread:**
Search for this account's thread from last week:
```
mcp__claude_ai_Slack_2__search
  query: "[deal name] in:#sales-threads after:[last Sunday YYYY-MM-DD]"
```
If found, read the full thread to get last week's state narrative and any owner responses:
```
mcp__claude_ai_Slack_2__get_thread_messages
  channel: "C0AHTTDT4SG"
  thread_ts: "[header message ts]"
```

3. **Slack account channel history** (if configured):
```
mcp__claude_ai_Slack_2__get_channel_history
  channel: "[ext-{company}-runlayer channel]"
  limit: 30
```

4. **HubSpot deal data:** Already captured in Step 1. For stage change detection: compare current stage against the section the deal appeared in last week's Slack threads. Also query `hs_date_entered_{stage}` if available to determine time in current stage.

5. **Gmail threads:**
```
mcp__claude_ai_Gmail__search
  query: "[account domain] newer_than:7d"
```

6. **Fireflies transcripts:**
```
mcp__claude_ai_Fireflies_AI__fireflies_search
  query: "[company name]"
```
For any results from the past week, fetch the full transcript.

7. **Granola meeting notes:**
```
mcp__claude_ai_Granola__query_granola_meetings
  query: "[company name]"
```

**Each agent produces per account:**
- `dealName`: string
- `stage`: HubSpot stage ID
- `section`: "closing" | "poc" | "pipeline"
- `owner`: { id, name, slackTag }
- `amount`: number
- `closeDate`: string
- `currentState`: 2-3 sentence narrative of where things stand now
- `weeklyDiff`: What specifically changed since last week
- `notionEntry`: Formatted markdown for the Notion weekly page
- `isStale`: boolean — no meaningful activity this week
- `daysSinceActivity`: number
- `stuckInStage`: stage name if deal has been static 3+ weeks, empty otherwise

### Step 5: Notion Weekly Page

After ALL analysis agents return, assemble the master Notion page **in memory**.

Build the page content by iterating through sections in order (Closing → POC → Pipeline), alphabetically within each section. Concatenate each account's `notionEntry` under the appropriate section header.

**Page structure:**
```markdown
# 🔥 Closing — $X

## Account Name
**Stage:** Stage Name | **Amount:** $X | **Owner:** Owner Name

Current state narrative. What changed this week.

# ⚙️ POC — $X

## Account Name
...

# 🌱 Pipeline — $X

## Account Name
...
```

Create the page in a single call:
```
mcp__claude_ai_Notion__notion-create-pages
  parent: { page_id: "31d42cc7-c565-81de-ac98-ecc053492572" }
  pages: [{
    properties: { title: "Week ending MM/DD/YYYY" },
    content: "[assembled markdown]"
  }]
```

### Step 6: Pipeline Narrative — Draft & Approval Gate

Run a programmatic pipeline analysis using the collected data:

**Analysis inputs:**
- Total pipeline value by section (Closing, POC, Pipeline) and overall
- Week-over-week changes: deals added/removed, stage movements, total dollar delta
- Deals that moved forward vs stalled
- Skull emoji'd deals being dropped (listed by name)
- Deals with close dates in the next 2 weeks
- Closing pipeline concentration: count of deals in stages 5+6 vs total active deals

**Draft a 2-3 paragraph narrative** in executive tone. Where we are as a company, what moved, what needs attention.

**DM the draft to Jeff for review:**
```
mcp__claude_ai_Slack_2__send_message
  channel: "U0A6PE41XK9"
  text: "📊 *Pipeline Narrative Draft — Week of MM/DD*\n\n[draft narrative]\n\n_Review and edit this. Reply here with your final version, or say 'approved' to post as-is._"
```

**STOP AND WAIT.** Ask Jeff in the Claude Code session to review the narrative. Jeff can:
- Edit the text and paste a revised version back
- Confirm with "approved" / "looks good" / "lgtm"

Use the final confirmed text for posting. **Nothing posts to #sales-threads until Jeff approves.**

### Step 7: Slack Posting — Serial Orchestrator

A **single agent** handles ALL Slack posting. No parallelism. Deterministic order. Every message waits for confirmation (`ts` returned) before the next one sends.

**Posting sequence:**

**7a. Post the approved pipeline narrative:**
```
mcp__claude_ai_Slack_2__send_message
  channel: "C0AHTTDT4SG"
  text: "[Jeff's approved narrative]"
```

**7b. Post the date divider:**
```
mcp__claude_ai_Slack_2__send_message
  channel: "C0AHTTDT4SG"
  text: "———— MM/DD/YYYY ————"
```

**7c. For each section (Closing → POC → Pipeline):**

Post section header:
```
mcp__claude_ai_Slack_2__send_message
  channel: "C0AHTTDT4SG"
  text: "🔥 CLOSING — $1.2M"
```

Then for each account **alphabetically** within the section:

**Post thread header** (top-level message):
```
mcp__claude_ai_Slack_2__send_message
  channel: "C0AHTTDT4SG"
  text: "*{lowercase deal name}*"
```
Capture the `ts` from the response.

**Post state + diff reply** (in-thread):
```
mcp__claude_ai_Slack_2__send_message
  channel: "C0AHTTDT4SG"
  thread_ts: "[captured ts]"
  text: "[current state narrative]\n\n_This week:_ [weekly diff]"
```

**Post owner prompt reply** (in-thread):
```
mcp__claude_ai_Slack_2__send_message
  channel: "C0AHTTDT4SG"
  thread_ts: "[captured ts]"
  text: "{owner slack tag} — What do we need to accomplish with {deal name} this week? What's our stretch goal?"
```

**Wait for each message to return before posting the next.** No fire-and-forget.

**Error handling:** If a Slack post fails, retry once. If it fails again, log it, skip to the next account, include in the final report.

### Step 8: Final Report + Stale Burrito Report

DM Jeff with the full report:

```
mcp__claude_ai_Slack_2__send_message
  channel: "U0A6PE41XK9"
  text: "[report]"
```

**Report contents:**

```
✅ *Sales Threads Complete — MM/DD/YYYY*

*Totals:*
• 🔥 Closing: N accounts — $X
• ⚙️ POC: N accounts — $X
• 🌱 Pipeline: N accounts — $X
• Total: N accounts — $X

*Dropped (skull emoji'd):*
• [deal name 1]
• [deal name 2]

*Missing Notion pages:*
• [deal name]

*Slack failures:*
• [deal name — error]

*Notion weekly page:* [link]

———

🌯 *Stale Burrito Report*

Accounts with no meaningful activity this week (no stage change, no meetings, no emails, no Slack activity):

• *deal name* — Stage: [stage], Owner: [name], [N] days since last activity
  ⚠️ EXTRA STALE: stuck in [stage] for 3+ weeks
• *deal name* — Stage: [stage], Owner: [name], [N] days since last activity
```

Sort stale accounts by staleness (longest stale first). Flag accounts in the same stage for 3+ weeks as **extra stale** with a warning.

---

## Edge Cases

- **Duplicate companies** (e.g., "Klaviyo" + "Klaviyo - Expansion"): Post as separate threads with full HubSpot deal name lowercased
- **No Notion page found:** Use fallback narrative from HubSpot stage/amount + any Slack/email context available
- **Notion rate limits:** Wait 30 seconds and retry
- **Deal name cleanup:** Strip suffixes for Notion search but keep full name for Slack posting
- **No activity at all for an account:** Still post the thread with whatever HubSpot data exists; flag in stale burrito report
- **Jeff doesn't approve narrative:** Process pauses. Nothing posts until approval.
- **Date divider encoding:** The em dashes (————) are Unicode U+2014 characters. Use literal em dashes, not ASCII hyphens.
- **Calendar MCP unavailable:** Degrade gracefully — Fireflies and Granola cover meeting detection. Skip calendar and note in final report.

## Integration with process-meeting

The `process-meeting` skill (Step 5c) searches for this week's account thread header in #sales-threads and replies in-thread. After this redesign, each thread already has 2 replies (state+diff and owner prompt). Process-meeting's reply-in-thread behavior is compatible — mid-week meeting updates appear as additional replies below the Sunday-created ones. No changes needed.
```

- [ ] **Step 3: Verify the skill file was written correctly**

Run: `head -10 ~/.claude/skills/sunday-sales-threads/SKILL.md`
Expected: Shows the new frontmatter and title

- [ ] **Step 4: Commit the skill file**

The skill file is outside the repo (in `~/.claude/skills/`), so it won't be tracked by git. This is expected — skills are personal to each user. Note this in the final report.

---

### Task 5: Typecheck and full test suite

**Files:** None new — validation pass

- [ ] **Step 1: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS — no regressions

- [ ] **Step 3: Commit any fixes if needed**

If typecheck or tests revealed issues, fix and commit.

---

### Task 6: Update the existing skill reference in process-meeting

**Files:**
- Modify: `skills/process-meeting/SKILL.md` (Step 5c only — minor wording update)

- [ ] **Step 1: Add a note about the redesigned Sunday threads**

In `skills/process-meeting/SKILL.md`, at the end of Step 5c (Sales Thread Update), add:

```markdown
> **Note:** The Sunday sales threads process now creates thread headers with two initial replies (state+diff and owner prompt). Your meeting update reply will appear after those. No change needed to search/reply logic.
```

- [ ] **Step 2: Commit**

```bash
git add skills/process-meeting/SKILL.md
git commit -m "docs: add note about redesigned Sunday threads to process-meeting skill"
```

---

## Chunk 3: Final Validation

### Task 7: End-to-end dry run validation

- [ ] **Step 1: Verify HubSpot connectivity**

Run a test query against the custom HubSpot connector to confirm it returns deal data with the expected properties:
```
mcp__hubspot__search_crm_objects
  objectType: "deals"
  properties: ["dealname", "dealstage", "hubspot_owner_id", "amount"]
  limit: 3
```
Expected: Returns deal objects with the four properties populated.

- [ ] **Step 2: Verify Slack channel access**

Test that we can read #sales-threads history:
```
mcp__claude_ai_Slack_2__get_channel_history
  channel: "C0AHTTDT4SG"
  limit: 3
```
Expected: Returns recent messages from the channel.

- [ ] **Step 3: Verify Notion access**

Test that we can read the Account Encyclopedia:
```
mcp__claude_ai_Notion__notion-fetch
  url: "31d42cc7-c565-81de-ac98-ecc053492572"
```
Expected: Returns the encyclopedia page content with child pages.

- [ ] **Step 4: Report readiness**

Confirm all systems are accessible and the skill is ready for its first live run.
