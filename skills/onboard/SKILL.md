---
name: onboard
description: First-time setup for AgentFabric — walks you through everything step by step
---

# Onboard

First-time setup for AgentFabric. This skill is invoked automatically when a new user opens the project, or manually with `/onboard`.

## Trigger

- Automatically on first run (detected by CLAUDE.md when ~/.agentfabric/config.yaml is missing)
- "/onboard"
- "Set up AgentFabric"
- "I'm new, help me get started"

## IMPORTANT: Interaction Style

This is likely the user's FIRST TIME using Claude Code. Do not assume they know anything.

- Number every step clearly: "Step 1 of 6", "Step 2 of 6", etc.
- Show progress: "You're 2/6 of the way through setup."
- Use plain English. No jargon. No acronyms without explanation.
- After each step, confirm it worked before moving on.
- If something fails, explain EXACTLY what to do in simple terms.
- Be encouraging. This should feel easy, not technical.

## Protocol

### Progress Display

At the START of every step, display a progress bar:

> ━━━━━━━━━━━━━━━━━━━━ Step [N] of 6: [Step Name]
> ▓▓▓▓▓▓▓░░░░░░░░░░░░░ [N/6]

This helps users who are new to terminal UIs understand where they are in the process.

### Step 1 of 6: Create Your Config Folder

Say to the user:
> "First, I need to create a folder on your computer to store your AgentFabric settings. This is private to you — it won't be shared with anyone."

Then run:
```bash
mkdir -p ~/.agentfabric/runs
```

Confirm:
> "Done! Your settings will live in ~/.agentfabric/."
>
> "Step 1 of 6 complete. Next up: checking your connections."

### Step 2 of 6: Check Your Connections

Say to the user:
> "AgentFabric connects to your existing tools — Fireflies for call transcripts, Slack for messages, Gmail for email, and Calendar for meeting info. Let me make sure everything is connected."

Test each tool one by one. After each test, report the result immediately:

**Required connections (need all 5):**

1. Test Fireflies:
```
mcp__claude_ai_RL_FireFlies__fireflies_get_transcripts (limit: 1)
```
Report: "Fireflies: Connected" or "Fireflies: Not connected"

2. Test Slack:
```
mcp__claude_ai_RL_Slack__list_channels (limit: 1)
```
Report: "Slack: Connected" or "Slack: Not connected"

3. Test Gmail:
```
mcp__claude_ai_RL_GMail__list_messages (limit: 1)
```
Report: "Gmail: Connected" or "Gmail: Not connected"

4. Test Calendar:
```
mcp__claude_ai_Google_Calendar__gcal_list_events (max_results: 1)
```
Report: "Calendar: Connected" or "Calendar: Not connected"

5. Test HubSpot:
```
mcp__hubspot__search_crm_objects
  objectType: "deals"
  limit: 1
```
Report: "HubSpot: Connected" or "HubSpot: Not connected"

**Optional connections (nice to have):**

6. Test Granola:
```
mcp__claude_ai_RL_GRANOLA__list_meetings (limit: 1)
```
Report: "Granola: Connected" or "Granola: Not available (that's fine, it's optional)"

Show a summary:
```
Your connections:
  Fireflies    ✓ Connected
  Slack        ✓ Connected
  Gmail        ✓ Connected
  Calendar     ✓ Connected
  HubSpot      ✓ Connected
  Granola      ✓ Connected (optional)
```

**IMPORTANT:** A connection is only "Connected" if the test call above returns actual data (even if empty results). If the call throws an error, permission error, or auth error, the connection is NOT working regardless of what the MCP dashboard says.

**If a connection fails with a permissions error:**
> "[Tool name] is connected but doesn't have the right permissions. Go to your Claude Code MCP connections page, find [tool name], click the three dots → Edit, and make sure all permissions are enabled. Then come back and I'll test again."

Do NOT just say "connected" based on whether the tool exists — actually verify the response.

**If any REQUIRED connection fails:**
> "Looks like [tool name] isn't connected yet. This is an MCP connection that needs to be set up in your Claude Code settings. Ask Jeff or check the RunLayer dashboard to get this connected, then run /onboard again."

Stop here. Do not continue with a broken required connection.

**If all required connections pass:**
> "All your connections are working. Step 2 of 6 complete."

### Step 3 of 6: Learn Your Writing Style

Say to the user:
> "Now for the fun part. I'm going to learn how YOU write — your tone, your go-to phrases, how you structure emails. That way, when I draft follow-ups for you, they'll actually sound like you."
>
> "I need to see 10-15 of your recent call transcripts. I can pull these from Fireflies automatically. Want me to do that, or would you rather paste some in?"

**If they want auto-pull (most common):**

Ask: "What's your email address? I'll search Fireflies for your recent calls."

```
mcp__claude_ai_RL_FireFlies__fireflies_search
  query: "organizer:[their email]"
```

Fetch transcripts for the top 10-15 results:
```
mcp__claude_ai_RL_FireFlies__fireflies_get_transcript
  transcriptId: "[ID]"
```

**If they want to paste:** Accept whatever they paste.

**If fewer than 3 transcripts found (common for new hires):**

Try these fallback sources IN ORDER until you have enough material:

1. Search Fireflies for any call where the user was a PARTICIPANT (not just organizer):
```
mcp__claude_ai_RL_FireFlies__fireflies_search
  query: "[their name]"
```

2. If still < 3, search their sent emails for recent threads:
```
mcp__claude_ai_RL_GMail__search
  query: "from:me newer_than:30d"
  limit: 15
```

3. If still < 3, search their Slack messages:
```
mcp__claude_ai_RL_Slack__search
  query: "from:@[their name]"
  limit: 20
```

4. If STILL not enough material from any source, generate a "starter" profile:
> "I don't have enough of your writing yet to build a full voice profile. I'll create a starter profile based on what I've seen so far. After your first 5 calls, run `/onboard` again and I'll retrain it with more data."

Write a basic starter profile with:
- Tone: "Professional but personable (will be refined after more calls)"
- Lexicon: [leave empty, note "Will populate after more transcripts"]
- Email Patterns: Standard professional patterns
- Mark it with a header: `<!-- STARTER PROFILE - retrain after 5 calls -->`

Once you have the transcripts, analyze them for:
- Tone and personality (formal? casual? direct? warm?)
- Signature phrases they repeat ("fire that off", "circle back", "bananas")
- Email patterns — how they open, structure, and close emails
- Sign-off style ("Best,", "Thanks,", "Cheers,")
- Sentence length and structure

Generate the voice profile and write it to `~/.agentfabric/voice-profile.md`.

Show it to them:
> "Here's what I learned about your writing style:"
>
> [show the voice profile]
>
> "Does this sound like you? I can adjust anything that doesn't feel right."

Iterate until they approve. Then:
> "Voice profile saved. Step 3 of 6 complete."

### Step 4 of 6: Set Up Your Accounts

Say to the user:
> "Now I need to know which customers/deals are yours. For each account, I'll need:"
> - "The company name"
> - "Your shared Slack channel with them (like #ext-finra-runlayer)"
> - "Their email domain (like finra.org)"
> - "The main contact's email (for follow-up emails)"
>
> "I can pull your deal list from HubSpot if you have it connected. Otherwise, just list your accounts and I'll set them up."

**If HubSpot is available:**
```
mcp__hubspot__search_crm_objects
  objectType: "deals"
```
Parse the deals, show them to the user, and ask which ones are theirs.

**If HubSpot is available but user has no deals assigned:**
Search for deals where the user's name appears in notes, recent activity, or where their manager mentioned them:
```
mcp__hubspot__search_crm_objects
  objectType: "deals"
  query: "[user's name]"
```

Also search Fireflies for accounts the user has been on calls about:
```
mcp__claude_ai_RL_FireFlies__fireflies_search
  query: "[user's name]"
```

Present what you find:
> "I found these accounts that seem relevant to you based on call history and deal notes:"
> [list accounts]
> "Want me to add any or all of these? You can also add more later with /onboard."

**If the user just started and has nothing:**
> "No worries — you're brand new! You can skip this step and add accounts later with /onboard. For now, I'll set up your config so you're ready to go."

Write an empty accounts.yaml:
```yaml
accounts: []
```

Do NOT block onboarding because a new hire has no accounts yet.

**If HubSpot is not available:**
Ask them to list their accounts. For each one, ask:
1. "What's the company name?"
2. "What's your shared Slack channel with them?" (suggest the pattern: ext-{company}-runlayer)
3. "What's their email domain?"
4. "Who's the main contact? (name and email)"

Write the accounts to `~/.agentfabric/accounts.yaml`:
```yaml
accounts:
  - name: FINRA
    slackChannel: ext-finra-runlayer
    domain: finra.org
    contacts:
      - duane.whitt@finra.org
```

After all accounts are added:
> "Got it — [N] accounts configured. Step 4 of 6 complete."

### Step 5 of 6: Apply Team Defaults

Say to the user:
> "Applying RunLayer GTM team defaults for your config..."

Write config to `~/.agentfabric/config.yaml` with these HARD-CODED values — do NOT ask the user:
```yaml
userId: [their first name, lowercase]
voiceProfilePath: ./voice-profile.md
salesThreadsChannel: sales-threads
salesThreadsMode: reply-in-thread
linearProject: gtm
linearTeam: GTM
defaultSources:
  - fireflies
  - slack
  - calendar
  - gmail
```

Then show them what was set:
> "Here's your config:"
> - Sales updates → #sales-threads (reply under each account's thread)
> - Task tracking → Linear GTM project
> - Data sources → Fireflies, Slack, Calendar, Gmail
>
> "If any of this is wrong, just tell me and I'll change it. Otherwise, Step 5 of 6 complete."

### Step 6 of 6: Test Run

Say to the user:
> "Let's test this on a real account to make sure everything works. Which account do you want to try? Just pick one you had a recent call with."

Wait for their answer. Then:
> "Running the full pipeline for [account]..."

Execute the process-meeting skill for the chosen account.

After it completes, walk them through what happened:
> "Here's what AgentFabric just did:"
> - "Pulled [N] transcripts from Fireflies"
> - "Found [N] Slack messages in #[channel]"
> - "Extracted [N] commitments and [N] takeaways"
> - "Drafted a follow-up email (check your Gmail drafts)"
> - "Posted an update to #sales-threads"
> - "Sent you the customer summary via Slack DM"

Then:
> "That's it! You're all set."
>
> "From now on, after every customer call, just come back here and type:"
>
> `/process-meeting [account name]`
>
> "Or just `/process-meeting` and I'll figure out which meeting you just had."
>
> "Setup complete! Welcome to AgentFabric."

## Error Handling

For EVERY error, explain it in plain English and give a clear next step:

- **MCP tool fails:** "Looks like [tool] isn't connected. Ask Jeff or check RunLayer to get it set up, then run /onboard again."
- **No Fireflies transcripts:** "I couldn't find any transcripts in Fireflies. You can paste some call transcripts here instead and I'll use those."
- **HubSpot not available:** "No worries — just list your accounts and I'll type them in for you."
- **Voice profile doesn't look right:** "No problem. Tell me what's off and I'll adjust it. We can go back and forth until it sounds right."
- **Test run fails partially:** "The test mostly worked but [specific thing] didn't come through. That's probably because [reason]. Everything else is set up correctly."
