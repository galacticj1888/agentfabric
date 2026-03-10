# Output Quality Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix unicode encoding issues (em dash mojibake in Gmail), thread sales updates into existing weekly Slack threads, and make customer-facing output feel human and momentum-driven.

**Architecture:** Add a sanitizeText utility that strips problematic unicode from all outputs. Update the sales thread payload to support thread replies. Rewrite the God Prompt's formatting constraints and customer summary instructions.

**Tech Stack:** TypeScript, Zod, Vitest

---

### Task 1: sanitizeText Utility

**Files:**
- Create: `src/utils/sanitize.ts`
- Create: `src/utils/index.ts`
- Test: `tests/utils/sanitize.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/utils/sanitize.test.ts
import { describe, it, expect } from "vitest";
import { sanitizeText } from "../../src/utils/index.js";

describe("sanitizeText", () => {
  it("replaces em dashes with space-hyphen-space", () => {
    expect(sanitizeText("hello — world")).toBe("hello - world");
  });

  it("replaces en dashes with hyphen", () => {
    expect(sanitizeText("2026–2027")).toBe("2026-2027");
  });

  it("replaces smart double quotes with straight quotes", () => {
    expect(sanitizeText('\u201CHello\u201D')).toBe('"Hello"');
  });

  it("replaces smart single quotes with straight quotes", () => {
    expect(sanitizeText('\u2018Hello\u2019')).toBe("'Hello'");
  });

  it("replaces ellipsis character with three dots", () => {
    expect(sanitizeText("wait\u2026")).toBe("wait...");
  });

  it("handles multiple replacements in one string", () => {
    expect(sanitizeText('He said \u201Chello\u201D — then left\u2026'))
      .toBe('He said "hello" - then left...');
  });

  it("passes through clean ASCII text unchanged", () => {
    expect(sanitizeText("normal text - no issues")).toBe("normal text - no issues");
  });

  it("handles empty string", () => {
    expect(sanitizeText("")).toBe("");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/utils/sanitize.test.ts`
Expected: FAIL - module not found

**Step 3: Write src/utils/sanitize.ts**

```typescript
/**
 * Sanitize text to prevent unicode encoding issues in Gmail and Slack.
 * Replaces em dashes, en dashes, smart quotes, and other unicode
 * punctuation that causes mojibake (e.g., "â€"" instead of "—").
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\u2014/g, " - ")   // em dash → space-hyphen-space
    .replace(/\u2013/g, "-")      // en dash → hyphen
    .replace(/\u201C/g, '"')      // left double quote
    .replace(/\u201D/g, '"')      // right double quote
    .replace(/\u2018/g, "'")      // left single quote
    .replace(/\u2019/g, "'")      // right single quote
    .replace(/\u2026/g, "...");   // ellipsis character
}
```

**Step 4: Write src/utils/index.ts**

```typescript
export { sanitizeText } from "./sanitize.js";
```

**Step 5: Run test to verify it passes**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/utils/sanitize.test.ts`
Expected: ALL PASS (8 tests)

**Step 6: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: sanitizeText utility for unicode cleanup"
```

---

### Task 2: Wire Sanitization Into All Output Paths

**Files:**
- Modify: `src/act/gmail-draft.ts`
- Modify: `src/act/sales-threads.ts`
- Modify: `src/act/customer-summary.ts`
- Modify: `src/reason/index.ts`
- Modify: `tests/act/act.test.ts`
- Modify: `tests/reason/reason.test.ts`

**Step 1: Add sanitization tests**

Add to `tests/act/act.test.ts`:

```typescript
// Add import at top
import { sanitizeText } from "../../src/utils/index.js";

// Add to formatEmailDraftForMCP describe block:
it("sanitizes unicode in subject and body", () => {
  const result = formatEmailDraftForMCP({
    to: ["test@test.com"],
    subject: 'Great session today \u2014 Thursday recap',
    body: 'Jonathan \u2014 adding the connector will be a big unlock',
  });
  expect(result.subject).not.toContain("\u2014");
  expect(result.subject).toContain(" - ");
  expect(result.body).not.toContain("\u2014");
  expect(result.body).toContain(" - ");
});

// Add to formatSalesThreadForMCP describe block:
it("sanitizes unicode in text", () => {
  const result = formatSalesThreadForMCP({
    channel: "sales-threads",
    text: "FINRA \u2014 big momentum today",
  });
  expect(result.text).not.toContain("\u2014");
  expect(result.text).toContain(" - ");
});

// Add to formatCustomerSummaryForReview describe block:
it("sanitizes unicode in summary text", () => {
  const result = formatCustomerSummaryForReview({
    account: "FINRA",
    targetChannel: "ext-finra-runlayer",
    summary: "Discussed timeline \u2014 looking good",
  });
  expect(result.text).not.toContain("\u2014");
  expect(result.text).toContain(" - ");
});
```

Add to `tests/reason/reason.test.ts`:

```typescript
// Add to parseGodPromptResponse describe block:
it("sanitizes unicode in parsed outputs", () => {
  const response = JSON.stringify({
    commitments: [],
    takeaways: [],
    emailDraft: { subject: "Recap \u2014 next steps", body: "Hey \u2014 great call" },
    salesThreadUpdate: "Update \u2014 moving fast",
    customerSummary: "Summary \u2014 next steps",
  });
  const result = parseGodPromptResponse(response, "Test", "test");
  expect(result).not.toBeNull();
  expect(result!.emailDraft.subject).not.toContain("\u2014");
  expect(result!.emailDraft.subject).toContain(" - ");
  expect(result!.emailDraft.body).toContain(" - ");
  expect(result!.salesThreadUpdate).toContain(" - ");
  expect(result!.customerSummary).toContain(" - ");
});
```

**Step 2: Run tests to verify they fail**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run`
Expected: 4 new tests FAIL (sanitization not applied yet)

**Step 3: Wire sanitizeText into gmail-draft.ts**

In `src/act/gmail-draft.ts`, add import and apply:

```typescript
import { sanitizeText } from "../utils/index.js";
```

In `formatEmailDraftForMCP`, change the return to:

```typescript
return {
  to,
  cc,
  subject: sanitizeText(input.subject.trim()),
  body: sanitizeText(input.body.trim()),
};
```

**Step 4: Wire sanitizeText into sales-threads.ts**

In `src/act/sales-threads.ts`:

```typescript
import { sanitizeText } from "../utils/index.js";

export function formatSalesThreadForMCP(input: SlackMessageInput): SlackMessagePayload {
  return { channel: input.channel, text: sanitizeText(input.text) };
}
```

**Step 5: Wire sanitizeText into customer-summary.ts**

In `src/act/customer-summary.ts`, add import:

```typescript
import { sanitizeText } from "../utils/index.js";
```

Change the summary line in the `text` array from:

```typescript
input.summary,
```

to:

```typescript
sanitizeText(input.summary),
```

**Step 6: Wire sanitizeText into reason/index.ts**

In `src/reason/index.ts`, add import:

```typescript
import { sanitizeText } from "../utils/index.js";
```

In `parseGodPromptResponse`, change the return block to sanitize all text outputs:

```typescript
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
  emailDraft: {
    subject: sanitizeText(parsed.emailDraft.subject),
    body: sanitizeText(parsed.emailDraft.body),
  },
  salesThreadUpdate: sanitizeText(parsed.salesThreadUpdate),
  customerSummary: sanitizeText(parsed.customerSummary),
};
```

**Step 7: Run all tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run`
Expected: ALL PASS

**Step 8: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "fix: sanitize unicode in all output paths (fixes Gmail mojibake)"
```

---

### Task 3: Update God Prompt — No Unicode + Customer Summary Vibe

**Files:**
- Modify: `src/reason/prompt-templates.ts`
- Modify: `tests/reason/reason.test.ts`

**Step 1: Add test for the no-unicode instruction**

Add to `tests/reason/reason.test.ts` in the `buildGodPrompt` describe block:

```typescript
it("includes no-unicode formatting constraint", () => {
  const prompt = buildGodPrompt({
    sourceText: "test",
    account: "Test",
  });
  expect(prompt).toContain("Never use em dashes");
  expect(prompt).toContain("ASCII");
});

it("includes momentum-driven customer summary instructions", () => {
  const prompt = buildGodPrompt({
    sourceText: "test",
    account: "Test",
  });
  expect(prompt).toContain("forward motion");
  expect(prompt).toContain("voice profile");
  expect(prompt).toContain("CUSTOMER-FACING");
});
```

**Step 2: Run tests to verify they fail**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/reason/reason.test.ts`
Expected: 2 new tests FAIL

**Step 3: Update the God Prompt template**

Replace the entire content of `src/reason/prompt-templates.ts` with:

```typescript
export const GOD_PROMPT_TEMPLATE = `You are an expert GTM Chief of Staff. Analyze the meeting data below and produce a complete post-meeting package in a single pass.

## CRITICAL FORMATTING RULE

Never use em dashes, en dashes, curly quotes, or special unicode punctuation in your output. Use plain hyphens (-), straight quotes (" and '), and standard ASCII only. This prevents encoding issues in email and Slack.

- WRONG: "hello — world"
- RIGHT: "hello - world"
- WRONG: \u201CHello\u201D
- RIGHT: "Hello"

## Your Account
{ACCOUNT}

{PREVIOUS_COMMITMENTS_SECTION}

## Voice Profile
{VOICE_PROFILE}

## Source Material
{SOURCE_TEXT}

## Instructions

Analyze the source material and return a single JSON object with these fields:

### commitments
Extract every commitment made during this meeting. A commitment is when someone promises, agrees, or implies they will take a specific action.

For each commitment:
- **who**: Person making the commitment
- **toWhom**: Person or team receiving it
- **what**: The specific action promised
- **byWhen**: Deadline (YYYY-MM-DD if mentioned, null if not)
- **confidence**: "explicit" (clear promise), "implied" (likely intent), or "inferred" (contextual guess)
- **rawQuote**: The exact words (if available)

What counts: "I'll send that over", "Let me follow up", "We'll get you pricing"
What doesn't count: Questions, opinions, completed past actions, hypotheticals
Edge cases: "Let me check on that" = commitment (implied), "We should do X" = NOT a commitment unless someone takes ownership

If there are previous commitments listed above, reference them in the email where appropriate (e.g., "Following up on the security review from last week...").

### takeaways
Extract the most important takeaways:
- **type**: "decision", "risk", "blocker", "opportunity", or "insight"
- **summary**: One sentence
- **details**: Additional context (optional)

### emailDraft
Write a follow-up email in the voice profile above:
- **subject**: Email subject line
- **body**: Full email body ready to send. Thank them briefly, recap decisions, list action items with owners, propose next steps. Match the voice profile exactly.

### salesThreadUpdate
Write a brief internal Slack update (3-5 bullets, Slack mrkdwn). Cover: what happened, key decisions, next steps with owners, risks/blockers. Be direct - this is for the internal team only.

### customerSummary
Write a Slack message to the customer as if you're casually recapping the call in your shared channel. This should sound like YOU - use the voice profile. Be warm, be direct, and keep it moving forward.

Structure: Quick acknowledgment of the call, then what was discussed, then next steps. Frame everything as forward motion - things are happening, progress is being made. The subtext should be momentum. Not stated, not "we're so excited" - just the natural confidence of things moving. Lead with what got done and what's coming, not what's pending or outstanding.

Bad example: "Action items from today's call: 1) Send pricing 2) Schedule review 3) Share docs"
Good example: "Pricing coming your way Wednesday. Security review - let's lock that in for next week. Shooting over the integration docs today so your team can start poking around."

This is CUSTOMER-FACING - no internal strategy, pricing discussions, or competitive intel. Use Slack mrkdwn. Keep it concise.

## Output Format

Return ONLY a JSON object. No other text. No markdown fences.

{
  "commitments": [...],
  "takeaways": [...],
  "emailDraft": { "subject": "...", "body": "..." },
  "salesThreadUpdate": "...",
  "customerSummary": "..."
}`;
```

**Step 4: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/reason/reason.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: God Prompt - no unicode rule + momentum-driven customer summary"
```

---

### Task 4: Sales Thread — Reply to Existing Weekly Thread

**Files:**
- Modify: `src/act/sales-threads.ts`
- Modify: `src/act/index.ts`
- Modify: `tests/act/act.test.ts`
- Modify: `skills/process-meeting/SKILL.md`

**Step 1: Add tests for thread reply support**

Add to `tests/act/act.test.ts`:

```typescript
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
```

**Step 2: Run tests to verify they fail**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/act/act.test.ts`
Expected: 2 new tests FAIL (thread_ts not in types)

**Step 3: Update src/act/sales-threads.ts**

```typescript
import { sanitizeText } from "../utils/index.js";

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
  const payload: SlackMessagePayload = {
    channel: input.channel,
    text: sanitizeText(input.text),
  };
  if (input.thread_ts) {
    payload.thread_ts = input.thread_ts;
  }
  return payload;
}
```

**Step 4: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/act/act.test.ts`
Expected: ALL PASS

**Step 5: Update skills/process-meeting/SKILL.md Step 5c**

Find the section `**5c. Sales Thread Update**` and replace it with:

```markdown
**5c. Sales Thread Update (reply to existing weekly thread)**

First, find this week's thread for the account in #sales-threads:
```
mcp__claude_ai_RL_Slack__search
  query: "[ACCOUNT NAME] in:#sales-threads after:[last Sunday's date YYYY-MM-DD]"
```

Look through the results for a top-level message in #sales-threads that mentions the account name. This is the weekly thread created on Sunday.

If found, grab the message `ts` (timestamp) and reply to that thread:
```
mcp__claude_ai_RL_Slack__send_message
  channel: "sales-threads"
  thread_ts: "[ts from the search result]"
  text: [from god prompt response]
```

If NO existing thread is found (new account, or Sunday thread hasn't been created yet), post a new top-level message instead:
```
mcp__claude_ai_RL_Slack__send_message
  channel: "[salesThreadsChannel from config.yaml]"
  text: [from god prompt response]
```
```

**Step 6: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: sales thread replies to existing weekly threads"
```

---

### Task 5: Update Entry Point Exports + Final Verification

**Files:**
- Modify: `src/index.ts` — add utils export

**Step 1: Add utils export to src/index.ts**

Add this line to the exports:

```typescript
// Utils
export { sanitizeText } from "./utils/index.js";
```

**Step 2: Run full test suite**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run`
Expected: ALL PASS (75+ tests)

**Step 3: Run typecheck**

Run: `cd ~/Desktop/Projects/agentfabric && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit and push**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: wire sanitizeText export + final verification"
git push origin main
```

---
