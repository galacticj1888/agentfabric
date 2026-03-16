# Sunday Sales Threads Redesign

## Overview

Redesign of the weekly Sunday sales threads process. Replaces the flat alphabetical dump with a stage-grouped, analysis-driven pipeline review that forces strategic weekly planning from every account owner.

## Data Sources

- **Deal roster:** HubSpot deals via `mcp__hubspot__search_crm_objects` (custom connector), stages 1a through 6. Stage 0 ignored.
- **State narratives:** Notion GTM Account Encyclopedia (page ID: `31d42cc7-c565-81de-ac98-ecc053492572`)
- **Slack thread history:** Last week's #sales-threads posts (channel ID: `C0AHTTDT4SG`)
- **Slack account channels:** ext-{company}-runlayer channels per accounts.yaml
- **Gmail:** Recent email threads per account domain
- **Fireflies:** Meeting transcripts from the past week
- **Calendar:** Meeting history (optional — graceful degradation if unavailable; Fireflies covers meeting detection)
- **Target channel:** `#sales-threads` (`C0AHTTDT4SG`)
- **DM target for all reports:** Jeff Settle (`U0A6PE41XK9`)

## HubSpot Stage Mapping

| Stage ID | Stage Name | Section |
|----------|------------|---------|
| 3030348496 | 1a - Meeting Set | Pipeline |
| qualifiedtobuy | 1b - Meeting Occurred | Pipeline |
| presentationscheduled | 2 - Qualified | Pipeline |
| 3125411551 | 3 - Evaluation | Pipeline |
| 2122875630 | 4 - POC | POC |
| decisionmakerboughtin | 5 - Negotiation | Closing |
| 3125411552 | 6 - Pre-Close | Closing |

## Owner -> Slack Tag Mapping

| HubSpot Owner ID | Name | Slack Tag |
|-------------------|------|-----------|
| 161976256 | Andrew Lenehan | `<@U0AAUJEB2US>` |
| 162120626 | Ryan Kearns | `<@U0ABFDUE6T0>` |
| 161657445 | Jeff Settle | `<@U0A6PE41XK9>` |

**Fallback:** Anyone not Andrew or Ryan gets tagged to Jeff.

## Architecture: Two-Phase Pipeline

### Phase 1: Parallel Analysis

Spawn parallel agents to gather max context and produce structured results per account. No Slack posting occurs in this phase.

### Phase 2: Serial Publish

A single orchestrator posts everything to Slack and Notion in deterministic order. No parallelism during publishing.

## Execution Flow

### Step 1: Data Pull & Filtering

**1a. HubSpot deal pull:**
Use `mcp__hubspot__search_crm_objects` to pull all deals in stages 1a-6. Use a single filterGroup with `dealstage IN [3030348496, qualifiedtobuy, presentationscheduled, 3125411551, 2122875630, decisionmakerboughtin, 3125411552]` to stay within HubSpot's 5-filterGroup limit. Capture: deal name, stage, owner ID, amount, close date.

**1b. Skull emoji scan:**
Concrete algorithm:
1. Use `get_channel_history` on `C0AHTTDT4SG` with `oldest` set to last Sunday's date to pull all messages from the past week.
2. Filter for top-level messages (no `thread_ts`, or `thread_ts == ts`) matching the bold deal name pattern (`*deal name*`).
3. For each matching message, call `get_reactions` with the channel + message `ts` to check for a `skull` reaction.
4. Any message with a skull (💀) reaction: extract the deal name, add to a kill list.
5. These deals are silently excluded from the entire process — no post, no Notion update, no mention.

Note: This requires N+1 API calls (1 history pull + 1 get_reactions per thread header). For ~30 deals, this runs sequentially during the data pull phase.

**1c. Build the active deal roster:**
HubSpot deals minus skull'd deals = active roster. Group into three sections:

- **🔥 CLOSING** — stages 5 (Negotiation) + 6 (Pre-Close)
- **⚙️ POC** — stage 4 (POC)
- **🌱 PIPELINE** — stages 1a (Meeting Set) through 3 (Evaluation)

Sort alphabetically within each section. Calculate dollar totals per section.

### Step 2: Phase 1 — Parallel Analysis Agents

For each active deal, spawn a parallel analysis agent. Each agent gathers max context for its assigned accounts and returns a structured result.

**Per-account analysis:**

1. **Notion lookup** — search Account Encyclopedia for the company, extract current TLDR
2. **Last week's Slack thread** — find last Sunday's thread header for this account in #sales-threads, read all replies (state narrative, owner responses, discussion)
3. **Slack channel history** — pull recent messages from the account's ext- channel (if configured in accounts.yaml)
4. **HubSpot deal data** — current stage, amount, close date, owner. Stage change detection: compare current HubSpot stage against last week's stage as recorded in the previous Slack thread (the section header it appeared under indicates prior stage). Also query `hs_date_entered_{stage}` properties if available to determine how long a deal has been in its current stage.
5. **Gmail threads** — recent email activity with the account domain
6. **Fireflies transcripts** — any meetings in the last week

**Weekly diff synthesis:** From all context, produce:

- **Current state** — 2-3 sentence narrative of where things stand right now
- **What changed** — specific deltas from last week (stage moved, new meeting held, email thread started, commitment made/fulfilled, etc.)
- **Stale indicator** — boolean flag + days since last meaningful activity (for stale burrito report)
- **Notion weekly entry** — formatted content for the master weekly page

**Return object per account:**
```typescript
{
  dealName: string;
  stage: string;
  section: 'closing' | 'poc' | 'pipeline';
  owner: { id: string; name: string; slackTag: string };
  amount: number;
  closeDate: string;
  currentState: string;      // 2-3 sentence narrative
  weeklyDiff: string;        // what changed this week
  notionEntry: string;       // formatted Notion markdown for this account's weekly entry
  isStale: boolean;
  daysSinceActivity: number;
  stuckInStage: string;      // stage name if deal has been in same stage 3+ weeks, empty otherwise
}
```

Each agent returns its `notionEntry` as a string in the result object. No temp Notion pages are created — all content is assembled in memory.

### Step 3: Notion Updates

**Master weekly page:** After all analysis agents return, the orchestrator assembles the full page content in memory by iterating through the deal roster in section order (Closing -> POC -> Pipeline), alphabetical within each section. It concatenates each account's `notionEntry` under the appropriate section header.

Then create the master page in a single call:
```
mcp__claude_ai_Notion__notion-create-pages
  parent: { page_id: "31d42cc7-c565-81de-ac98-ecc053492572" }
  pages: [{ properties: { title: "Week ending MM/DD/YYYY" }, content: [assembled markdown] }]
```

This avoids concurrent writes and eliminates the need for temp page cleanup (Notion MCP has no delete-page tool).

**Master page structure:**
```
# 🔥 Closing — $1.2M

## Acme Corp
**Stage:** Negotiation | **Amount:** $500K | **Owner:** Andrew Lenehan

Current state narrative. What changed this week.

## Snowflake
**Stage:** Pre-Close | **Amount:** $700K | **Owner:** Ryan Kearns

Current state narrative. What changed this week.

# ⚙️ POC — $850K

## Databricks
...

# 🌱 Pipeline — $400K

## Klaviyo
...
```

### Step 4: Pipeline Narrative & Approval Gate

Before any threads post to Slack, Claude runs a programmatic pipeline analysis and drafts a narrative for Jeff to review.

**Analysis inputs:**
- Total pipeline value by section (Closing, POC, Pipeline)
- Week-over-week changes: deals added/removed, stage movements, total dollar delta
- Deals that moved forward vs stalled
- Skull emoji'd deals being dropped (listed by name)
- Deals with close dates in the next 2 weeks
- Closing pipeline concentration: count of deals in stages 5+6 vs total active deals as a pipeline health proxy

**Draft narrative:** 2-3 paragraphs, executive tone. Where we are as a company, what moved, what needs attention.

**Delivery:** DM'd to Jeff in Slack for review/editing.

**Approval gate:** The agent pauses after DM'ing the narrative and asks Jeff to review in the current Claude Code session. Jeff can:
- Edit the text and paste a revised version back
- Confirm with "approved" / "looks good" / "lgtm"
The agent uses the final confirmed text for posting. Nothing posts to #sales-threads until Jeff approves.

### Step 5: Slack Posting — Serial Orchestrator

A single agent handles ALL Slack posting. No parallelism. Deterministic order. Every message waits for confirmation (`ts` returned) before the next one sends.

**Posting sequence:**

```
1. Jeff's approved pipeline narrative
2. Date divider: ———— MM/DD/YYYY ————
3. 🔥 CLOSING — $X
4.   *acme corp*                          [thread header - capture ts]
5.     ↳ State + weekly diff reply         [in-thread]
6.     ↳ @owner prompt reply               [in-thread]
7.   *snowflake*                           [thread header - capture ts]
8.     ↳ State + weekly diff reply         [in-thread]
9.     ↳ @owner prompt reply               [in-thread]
10. ⚙️ POC — $X
11.   *databricks*                         [thread header - capture ts]
12.    ↳ ...
13. 🌱 PIPELINE — $X
14.   *klaviyo*                            [thread header - capture ts]
15.    ↳ ...
```

**Per-account thread structure:**

1. **Thread header:** `*{lowercase deal name}*` — top-level message in #sales-threads
2. **Reply 1 (state + diff):** Current state narrative + what changed since last week
3. **Reply 2 (owner prompt):** `{owner slack tag} — What do we need to accomplish with {account name} this week? What's our stretch goal?`

**Error handling:** If a Slack post fails, retry once. If second attempt fails, log it, skip to next account, include in final report.

### Step 6: Final Report

DM'd to Jeff after all posting completes:

- **Totals:** Accounts posted by section, pipeline value by section and overall
- **Dropped deals:** Skull emoji'd deals listed by name
- **Missing Notion pages:** Accounts without an encyclopedia entry
- **Slack failures:** Any accounts that failed to post
- **Notion link:** Direct link to the master "Week ending MM/DD" page

### Step 7: Stale Burrito Report

Appended to the final report. Accounts with no meaningful activity this week:

- No stage change
- No meetings (Fireflies/Calendar)
- No email activity
- No Slack channel activity

Sorted by staleness (longest stale first). Accounts in the same stage for 3+ weeks flagged as **extra stale**. Each entry includes: account name, current stage, owner, days since last activity, last known activity.

## Message Format Examples

**Pipeline narrative (posted by Jeff after review):**
```
Pipeline sits at $2.4M across 34 active deals, up from $2.1M last week.
Three deals moved into POC — Gusto, Klaviyo, and Databricks...
```

**Date divider:**
```
———— 03/15/2026 ————
```

**Section header:**
```
🔥 CLOSING — $1.2M
```

**Thread header:**
```
*acme corp*
```

**State + diff reply:**
```
Acme is a $500K negotiation-stage deal with procurement review underway.
This week: Legal redlines returned, Jeff had a call with their CISO on
Thursday, and the security questionnaire was submitted. Last week they
were blocked on internal legal review — that's now cleared.
```

**Owner prompt reply:**
```
<@U0AAUJEB2US> — What do we need to accomplish with Acme Corp this week?
What's our stretch goal?
```

## Integration with process-meeting

The `process-meeting` skill (Step 5c) searches for this week's account thread header in #sales-threads and replies in-thread with post-meeting updates. After this redesign, each account thread will already have 2 bot-authored replies (state+diff and owner prompt). Process-meeting's reply-in-thread behavior is compatible — mid-week meeting updates will appear as additional thread replies below the Sunday-created replies. No changes to process-meeting are required.

## Edge Cases

- **Duplicate companies** (e.g., "Klaviyo" + "Klaviyo - Expansion"): Post as separate threads with full HubSpot deal name lowercased
- **No Notion page found:** Use fallback narrative from HubSpot stage/amount + any Slack/email context
- **Notion rate limits:** Wait 30 seconds and retry
- **Deal name cleanup:** Strip suffixes for Notion search but keep full name for Slack posting
- **No activity at all for an account:** Still post the thread with whatever HubSpot data exists; flag in stale burrito report
- **Jeff doesn't approve narrative:** Process pauses. Nothing posts until approval.
- **Date divider encoding:** The em dashes (————) are Unicode U+2014 characters. Use literal em dashes, not ASCII hyphens.
- **Calendar MCP unavailable:** Degrade gracefully — Fireflies covers meeting detection. Skip calendar data and note in final report.
