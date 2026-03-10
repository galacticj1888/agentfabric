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

**Required connections (need all 4):**

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

**Optional connections (nice to have):**

5. Test Granola:
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
  Granola      ✓ Connected (optional)
```

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

### Step 5 of 6: Final Settings

Say to the user:
> "Almost done. Just two quick questions."

**Question 1:**
> "What Slack channel does your team post sales updates to? (If you're not sure, I'll default to #sales-threads)"

**Question 2:**
> "Do you use Linear for task tracking? If so, what's the project or team name? (If you don't use Linear or aren't sure, just say skip)"

Write config to `~/.agentfabric/config.yaml`:
```yaml
userId: [their name, lowercase]
voiceProfilePath: ./voice-profile.md
salesThreadsChannel: [their answer or "sales-threads"]
linearProject: [their answer or omit]
linearTeam: [their answer or omit]
defaultSources:
  - fireflies
  - slack
  - calendar
  - gmail
```

> "Settings saved. Step 5 of 6 complete. One more step — let's take it for a spin."

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
