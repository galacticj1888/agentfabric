---
name: process-meeting
description: Process a meeting for a specific account — extract commitments, draft email, create tasks, post updates
---

<!--
  SKILL REGISTRATION: This skill is registered as "process-meeting" in the
  skills/ directory. If Claude Code says "unknown skill", the skills directory
  may not be in the project root. Verify: ls skills/process-meeting/SKILL.md
-->

# Process Meeting

Run the full AgentFabric pipeline for a specific account after a meeting.

## Trigger

- "Process meeting for [account]"
- "/process-meeting [account]"
- "/process-meeting" (auto-detects from last calendar meeting)
- "Run the process for [account]"
- "Post-meeting [account]"
- "process meeting" (without slash — common for new users)

## Protocol

### Step 1: Resolve Account

If an account name is provided:
- Read ~/.agentfabric/config.yaml and ~/.agentfabric/accounts.yaml
- Match the query against account names (case-insensitive, partial match OK)
- If no match: ask the user to clarify or run /onboard to add the account

If NO account name provided (zero-click mode):
- Query Calendar for the meeting that ended most recently (within last 60 minutes):
```
mcp__claude_ai_Google_Calendar__gcal_list_events
```
- Extract attendee email domains from that meeting
- Cross-reference against accounts.yaml to auto-resolve the account
- If no match found: ask the user which account this was for

### Step 2: Load Previous Run (Cross-Meeting Memory)

Check ~/.agentfabric/runs/ for the last run for this account.
If found, note the previous commitments — they'll be injected into the prompt so the agent can reference them in the follow-up email (e.g., "Following up on the security review from last week...").

### Step 3: Fetch Data via MCP (in parallel)

Launch parallel data fetches for the resolved account. Use whatever MCP tools are available — graceful degradation if any source fails.

**Fireflies — recent transcripts:**
```
mcp__claude_ai_RL_FireFlies__fireflies_search
  query: "[ACCOUNT NAME]"
```
Then for the top 3 results, fetch full transcripts:
```
mcp__claude_ai_RL_FireFlies__fireflies_get_transcript
  transcriptId: "[ID]"
```

**Slack — shared channel + search:**
```
mcp__claude_ai_RL_Slack__get_channel_history
  channel: "[SLACK_CHANNEL from accounts.yaml]"
  limit: 30
```
```
mcp__claude_ai_RL_Slack__search
  query: "[ACCOUNT NAME] after:[7 days ago YYYY-MM-DD]"
```

**Calendar — recent meetings:**
```
mcp__claude_ai_Google_Calendar__gcal_list_events
  query: "[ACCOUNT NAME]"
```

**Gmail — recent threads (optional):**
```
mcp__claude_ai_RL_GMail__search
  query: "[ACCOUNT DOMAIN] newer_than:7d"
```

**Granola — meeting notes (optional):**
```
mcp__claude_ai_RL_GRANOLA__query_granola_meetings
  query: "[ACCOUNT NAME]"
```

### Step 4: Single-Pass Reasoning (God Prompt)

Combine ALL fetched data into one text block. Load the user's voice profile from ~/.agentfabric/voice-profile.md.

Prompt Claude with EVERYTHING in a single pass — commitments, takeaways, email draft, sales thread update, and customer summary all generated together. This is faster, cheaper, and produces more coherent output than separate calls.

The prompt should include:
- Account name
- Voice profile
- All source material (transcripts, Slack messages, calendar events, emails)
- Previous commitments from the last run (if any)

Claude returns a single JSON object with all outputs.

### Step 5: Execute Actions

**5a. Email Follow-Up Draft**
Create the draft in Gmail:
```
mcp__claude_ai_RL_GMail__create_draft
  to: [contact emails from accounts.yaml]
  subject: [from god prompt response]
  body: [from god prompt response]
```

**5b. Linear Tasks**
For each commitment owned by our team, create a Linear task.
Format title as: `[ACCOUNT] Action item description`

**5c. Sales Thread Update**

Read `salesThreadsChannel` and `salesThreadsMode` from `config.yaml`.

If `salesThreadsMode` is `top-level`, always post a top-level message:
```
mcp__claude_ai_RL_Slack__send_message
  channel: "[salesThreadsChannel from config.yaml]"
  text: [from god prompt response]
```

If `salesThreadsMode` is `reply-in-thread`, first find this week's account thread in the configured sales channel:
```
mcp__claude_ai_RL_Slack__search
  query: "[ACCOUNT NAME] in:#[salesThreadsChannel from config.yaml] after:[last Sunday's date YYYY-MM-DD]"
```

Look through the results for a top-level message in that channel that mentions the account name. This is the weekly thread created on Sunday.

If found, grab the message `ts` (timestamp) and reply to that thread:
```
mcp__claude_ai_RL_Slack__send_message
  channel: "[salesThreadsChannel from config.yaml]"
  thread_ts: "[ts from the search result]"
  text: [from god prompt response]
```

If NO existing thread is found (new account, or Sunday thread hasn't been created yet), post a new top-level message instead:
```
mcp__claude_ai_RL_Slack__send_message
  channel: "[salesThreadsChannel from config.yaml]"
  text: [from god prompt response]
```

**5d. Customer Meeting Summary (HUMAN-IN-THE-LOOP)**
DO NOT auto-post to the customer channel. Instead, DM the summary to the user:
```
mcp__claude_ai_RL_Slack__send_message
  channel: "[DM to user]"
  text: "Meeting summary ready for review — [ACCOUNT]\n\n> Target: #[slackChannel]\n\n[summary text]\n\n_Copy and paste to the customer channel when ready._"
```

### Step 6: Log Run

Write the FabricOutput envelope to ~/.agentfabric/runs/YYYY-MM-DD.jsonl with:
- All extracted commitments and takeaways
- Action results (draft ID, task IDs, Slack message timestamps)
- Which sources contributed data

### Step 7: Report to User

Summarize what was done:
- Email draft created (subject, recipients)
- N Linear tasks created (list them)
- Sales thread updated in #sales-threads
- Customer summary sent to your DMs for review
- N commitments extracted, N takeaways
- Previous commitments referenced: [list if any]

## Error Handling

- If Fireflies returns no results: Continue — note "No transcripts found"
- If Slack channel not configured: Skip customer summary, warn user
- If Gmail draft fails: Show the email text so user can copy/paste
- If Linear unavailable: List tasks as text for manual entry
- If god prompt returns malformed JSON: Retry once, then show raw response
- Always complete the run log regardless of action failures
