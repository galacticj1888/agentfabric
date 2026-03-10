---
name: onboard
description: Set up AgentFabric for a new user — validate MCP connections, train voice profile, configure accounts
---

# Onboard

Set up a new AgentFabric user with voice profile, account list, and MCP validation.

## Trigger

- "/onboard"
- "Set up AgentFabric"
- "Configure AgentFabric"
- "I'm new, help me get started"

## Protocol

### Step 1: Create Config Directory

```bash
mkdir -p ~/.agentfabric/runs
```

### Step 2: Validate MCP Connections

Test each MCP tool to confirm access. Report status:

**Required:**
- [ ] Fireflies: `mcp__claude_ai_RL_FireFlies__fireflies_get_transcripts` (limit: 1)
- [ ] Slack: `mcp__claude_ai_RL_Slack__list_channels` (limit: 1)
- [ ] Gmail: `mcp__claude_ai_RL_GMail__list_messages` (limit: 1)
- [ ] Calendar: `mcp__claude_ai_Google_Calendar__gcal_list_events` (max_results: 1)

**Optional:**
- [ ] Granola: `mcp__claude_ai_RL_GRANOLA__list_meetings` (limit: 1)
- [ ] Linear: (check if available)

If any required tool fails, tell the user which MCP server needs to be connected and stop.

### Step 3: Voice Profile Training

Ask the user: "I need 10-15 of your call transcripts to learn your communication style. You can either:"
1. "Paste them here"
2. "Tell me to search Fireflies for your recent calls"

If option 2:
```
mcp__claude_ai_RL_FireFlies__fireflies_search
  query: "organizer:[USER_EMAIL]"
```
Fetch the top 15 transcripts.

Analyze the transcripts for:
- Tone and personality
- Signature phrases and lexicon
- Email patterns (opens, structure, closes, sign-off)
- Sentence structure and length

Generate ~/.agentfabric/voice-profile.md and show it to the user for approval.
If they want changes, iterate until they're happy.

### Step 4: Account Configuration

Ask: "Which accounts are yours? I can pull from HubSpot or you can list them."

If HubSpot available:
```
mcp__hubspot__search_crm_objects
  objectType: "deals"
```

For each account, resolve:
- Account name
- Slack channel (pattern: ext-{company}-runlayer)
- Domain
- Key contacts (email addresses)

Write ~/.agentfabric/accounts.yaml:
```yaml
accounts:
  - name: FINRA
    slackChannel: ext-finra-runlayer
    domain: finra.org
    contacts:
      - duane.whitt@finra.org
  - name: Goldman Sachs
    slackChannel: ext-gs-runlayer
    domain: gs.com
```

### Step 5: General Config

Ask the user:
- "What's your Linear team/project for tasks?" (or skip for now)
- "What channel do you post sales updates in?" (default: sales-threads)

Write ~/.agentfabric/config.yaml:
```yaml
userId: [name]
voiceProfilePath: ./voice-profile.md
linearProject: [project name]
linearTeam: [team name]
salesThreadsChannel: sales-threads
defaultSources:
  - fireflies
  - slack
  - calendar
  - gmail
```

### Step 6: Test Run

Ask: "Want me to do a test run on one of your accounts? Which one?"

Run /process-meeting [chosen account] as a dry run to verify everything works end-to-end.

### Step 7: Done

Report:
- MCP connections validated (N/N required, M/M optional)
- Voice profile generated (show brief excerpt)
- N accounts configured
- Config saved to ~/.agentfabric/

"You're all set. After your next meeting, just say `/process-meeting [account]` or just `/process-meeting` to auto-detect."

## Error Handling

- If MCP tool validation fails: explain which server to connect and provide setup instructions
- If Fireflies has no transcripts: ask user to paste transcripts manually
- If HubSpot unavailable: have user list accounts manually
- If voice profile doesn't look right: iterate with user until approved
