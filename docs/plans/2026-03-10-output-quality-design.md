# Output Quality Improvements — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix unicode/encoding issues, thread sales updates correctly, and make customer-facing output feel human and momentum-driven.

**Four changes:**
1. Unicode sanitization (em dashes, smart quotes) across all outputs
2. Gmail encoding fix via sanitization in the format layer
3. Sales thread replies to existing weekly threads (not new posts)
4. Customer summary rewrite for voice, warmth, and subtle momentum

---

### Task 1: sanitizeText utility

**Files:**
- Create: `src/utils/sanitize.ts`
- Create: `src/utils/index.ts`
- Test: `tests/utils/sanitize.test.ts`

Add a `sanitizeText(text: string): string` function that:
- Replaces em dashes `—` (U+2014) with ` - `
- Replaces en dashes `–` (U+2013) with `-`
- Replaces smart double quotes `""` with `"`
- Replaces smart single quotes `''` with `'`
- Replaces ellipsis character `…` with `...`
- Strips any other common mojibake-causing unicode punctuation

### Task 2: Wire sanitization into all output paths

**Files:**
- Modify: `src/act/gmail-draft.ts` — sanitize subject + body
- Modify: `src/act/sales-threads.ts` — sanitize text
- Modify: `src/act/customer-summary.ts` — sanitize summary
- Modify: `src/reason/index.ts` — sanitize all parsed God Prompt outputs

### Task 3: Update God Prompt — no unicode, better customer summary

**Files:**
- Modify: `src/reason/prompt-templates.ts`

Two changes to the God Prompt:

**A) Add formatting constraint:**
> "IMPORTANT: Never use em dashes, en dashes, curly quotes, or special unicode punctuation. Use plain hyphens (-), straight quotes, and standard ASCII only. This prevents encoding issues in email and Slack."

**B) Rewrite the customerSummary section to:**
> Write a Slack message to the customer as if you're casually recapping the call in your shared channel. This should sound like YOU - use the voice profile. Be warm, be direct, and keep it moving forward.
>
> Structure: Quick acknowledgment of the call, then what was discussed, then next steps. Frame everything as forward motion - things are happening, progress is being made. The subtext should be momentum. Not stated, not "we're so excited" - just the natural confidence of things moving. Lead with what got done and what's coming, not what's pending.
>
> Bad: "Action items from today's call: 1) Send pricing 2) Schedule review"
> Good: "Pricing coming your way Wednesday. Security review - let's lock that in for next week. Shooting over the integration docs today so your team can start poking around."
>
> This is CUSTOMER-FACING - no internal strategy, pricing discussions, or competitive intel. Use Slack mrkdwn. Keep it concise.

### Task 4: Sales thread — reply to existing weekly thread

**Files:**
- Modify: `src/act/sales-threads.ts` — add thread_ts to payload
- Modify: `skills/process-meeting/SKILL.md` — update Step 5c

Change the sales thread act layer to support thread replies:

```typescript
export interface SlackMessagePayload {
  channel: string;
  text: string;
  thread_ts?: string;  // reply to existing thread
}
```

Update the process-meeting skill Step 5c to:
1. Search #sales-threads for the account name posted after last Sunday
2. If found, grab the thread ts and reply to it
3. If not found, post a new top-level message (fallback)
