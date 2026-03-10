# AgentFabric User Guide

## What is AgentFabric?

AgentFabric is a post-meeting automation tool for sales teams. It plugs into Claude Code and connects to the tools you already use — Fireflies, Slack, Gmail, Google Calendar — to handle everything that happens after a customer call.

You finish a meeting, run one command, and AgentFabric:

1. **Drafts a follow-up email** in your personal writing style and saves it to your Gmail drafts
2. **Creates action items** in Linear for every commitment your team made on the call
3. **Posts an internal update** to your team's sales channel in Slack
4. **Sends you a meeting summary** via Slack DM so you can review it before sharing with the customer

It learns how you write by analyzing your past call transcripts, so the emails it drafts actually sound like you — not like a robot.

Each person on the team gets their own setup. Ryan's emails sound like Ryan. Andrew's sound like Andrew. Same system, different voices.

---

## TL;DR Install

```bash
git clone https://github.com/galacticj1888/agentfabric.git
cd agentfabric
npm install
```

Open Claude Code in the `agentfabric` directory and type:

```
/onboard
```

Follow the prompts. After that, use it with:

```
/process-meeting FINRA
```

That's it.

---

## Prerequisites

Before you install, make sure you have:

- **Node.js 22 or higher** — check with `node --version`
- **Claude Code** — Anthropic's CLI tool ([install guide](https://docs.anthropic.com/en/docs/claude-code))
- **MCP connections** to these services (configured in Claude Code):
  - **Fireflies** — for meeting transcripts
  - **Slack** — for channel history and posting updates
  - **Gmail** — for creating email drafts
  - **Google Calendar** — for meeting attendee info

**Optional but recommended:**
- **Granola** — for additional meeting notes
- **Linear** — for task creation
- **HubSpot** — for auto-populating your account list during onboarding

If you're using RunLayer, AgentFabric is available as a plugin. Install it from:
https://ecs.prod.runlayer.com/plugins/21018e91-d5a3-467a-a169-263d4d6783ff

---

## Step-by-Step Installation

### 1. Clone the repo

```bash
git clone https://github.com/galacticj1888/agentfabric.git
cd agentfabric
```

### 2. Install dependencies

```bash
npm install
```

This installs TypeScript, Zod (for data validation), and Vitest (for tests). No API keys or environment variables needed — AgentFabric uses Claude Code's MCP connections for everything.

### 3. Verify the install

```bash
npm test
```

You should see all tests passing. If not, make sure you're on Node 22+.

### 4. Open Claude Code in the project directory

```bash
cd agentfabric
claude
```

Or if you already have Claude Code open, navigate to the agentfabric directory.

### 5. Run onboarding

In Claude Code, type:

```
/onboard
```

The onboarding wizard walks you through four things:

#### a. MCP Connection Validation

It checks that Claude Code can reach Fireflies, Slack, Gmail, and Calendar. If any connection fails, it tells you exactly which one and how to fix it.

```
Validating MCP connections...
  Fireflies    ✓
  Slack        ✓
  Gmail        ✓
  Calendar     ✓
  Granola      ✓ (optional)
```

#### b. Voice Profile Training

It asks for 10-15 of your call transcripts. You can either paste them or have it pull them from Fireflies automatically.

It analyzes your transcripts and generates a voice profile — a markdown file that captures how you write: your tone, your go-to phrases, how you open and close emails, your sentence structure.

```
~/.agentfabric/voice-profile.md
```

It shows you the profile and asks if it looks right. Say no and it'll iterate until you're happy.

#### c. Account Configuration

It asks which accounts (deals/customers) are yours. If you have HubSpot connected, it can pull your deals automatically. Otherwise, you list them manually.

For each account it captures:
- Account name (e.g., "FINRA")
- Shared Slack channel (e.g., "#ext-finra-runlayer")
- Domain (e.g., "finra.org")
- Key contacts (email addresses for follow-ups)

```
~/.agentfabric/accounts.yaml
```

#### d. General Config

For RunLayer GTM users, AgentFabric applies the team defaults automatically:
- Linear project/team: `gtm` / `GTM`
- Sales updates channel: `#sales-threads`
- Sales update mode: reply inside each account's weekly thread

If you need something different later, edit `~/.agentfabric/config.yaml`.

```
~/.agentfabric/config.yaml
```

### 6. Test it

The wizard offers to do a test run on one of your accounts. Say yes — it runs the full pipeline and shows you what it produces.

### 7. Done

Your config is saved to `~/.agentfabric/`. This directory is local to your machine and NOT in the repo — each person has their own.

```
~/.agentfabric/
├── config.yaml          # Your preferences
├── voice-profile.md     # Your writing style
├── accounts.yaml        # Your accounts and contacts
└── runs/                # Log of every meeting you've processed
```

---

## How to Use

### Process a meeting (with account name)

After a customer call, open Claude Code in the agentfabric directory and type:

```
/process-meeting FINRA
```

You can use partial names — `/process-meeting goldman` will match "Goldman Sachs".

### Process a meeting (auto-detect)

If you just finished a call and don't want to type the name:

```
/process-meeting
```

It checks your calendar for the meeting that ended in the last 60 minutes, looks at the attendee email domains, and matches them to your accounts automatically.

### What happens when you run it

1. **Data fetch** — Pulls the latest Fireflies transcript, recent Slack messages from the shared channel, calendar attendees, and recent Gmail threads. All in parallel. If one source fails, the rest continue.

2. **Previous context** — Checks if you've processed this account before. If so, it loads the commitments from last time so the follow-up email can reference them ("Following up on the security review from last week...").

3. **Single-pass analysis** — Sends everything to Claude in one prompt. Claude extracts commitments, takeaways, drafts the email, writes the sales thread update, and writes the customer summary — all at once. One call, not four. This makes the outputs coherent with each other.

4. **Actions executed:**
   - **Gmail** — Follow-up email saved as a draft. Open Gmail, review it, hit send.
   - **Linear** — Tasks created for every commitment your team made. Tagged with the account name.
   - **Slack (#sales-threads)** — Internal update posted automatically.
   - **Slack (DM to you)** — Customer-facing summary sent to your DMs. Review it, then copy/paste to the shared customer channel when ready. AgentFabric never auto-posts to customer channels.

5. **Run logged** — Everything is saved to `~/.agentfabric/runs/YYYY-MM-DD.jsonl` for cross-meeting memory and downstream system interop.

### What you see when it's done

```
✓ Email draft created
  Subject: "Following up: FINRA POC Kickoff"
  To: duane.whitt@finra.org

✓ 3 Linear tasks created
  [FINRA] Send pricing proposal (due: 2026-03-12)
  [FINRA] Schedule security review
  [FINRA] Share integration docs

✓ Sales thread updated in #sales-threads

✓ Customer summary sent to your DMs for review
  Target channel: #ext-finra-runlayer

Commitments extracted: 3
Takeaways extracted: 4
Previous commitments referenced: 1
```

---

## Common Scenarios

### "I want to add a new account"

Run `/onboard` again and it'll walk you through adding accounts. Or edit `~/.agentfabric/accounts.yaml` directly:

```yaml
accounts:
  - name: FINRA
    slackChannel: ext-finra-runlayer
    domain: finra.org
    contacts:
      - duane.whitt@finra.org
  - name: New Customer           # add this
    slackChannel: ext-newco-runlayer
    domain: newcustomer.com
    contacts:
      - jane@newcustomer.com
```

### "My voice profile doesn't sound like me"

Edit `~/.agentfabric/voice-profile.md` directly. It's just a markdown file. Change whatever doesn't match your style. Or run `/onboard` again and re-train it with different transcripts.

### "I don't use Linear"

That's fine. Skip the Linear config during onboarding. AgentFabric will list the tasks as text in the output instead of creating them in Linear. You can add Linear later.

### "A data source didn't return anything"

AgentFabric is designed for graceful degradation. If Fireflies has no transcript, it continues with Slack and Calendar data. If Slack search returns nothing, it continues with everything else. The more data sources you have connected, the better the output — but it works with whatever's available.

### "The email draft wasn't quite right"

It's saved as a draft, not sent. Open Gmail, find the draft, edit it, send it. Over time, as AgentFabric processes more of your meetings, the voice profile gets more accurate. You can also fine-tune `~/.agentfabric/voice-profile.md` to correct specific patterns.

### "I want to see past runs"

Every run is logged to `~/.agentfabric/runs/`. Files are named by date:

```bash
cat ~/.agentfabric/runs/2026-03-09.jsonl
```

Each line is a JSON object with the full output: commitments, takeaways, actions taken, sources used.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `/process-meeting` not recognized | Make sure you're in the `agentfabric` directory in Claude Code |
| MCP connection fails | Check your Claude Code MCP settings — the relevant server needs to be connected and authorized |
| "Config not found" error | Run `/onboard` first to create your `~/.agentfabric/` config |
| No transcripts found | Check that Fireflies is recording your meetings and the account name matches |
| Email draft not appearing | Check Gmail drafts folder. If it failed, the email text is shown in the output so you can copy/paste |
| Wrong account matched | Use the full account name instead of a partial. Check `~/.agentfabric/accounts.yaml` for exact names |
| Tests failing after install | Make sure you're on Node.js 22+: `node --version` |

---

## For Developers

If you want to extend AgentFabric or understand the codebase:

```bash
npm run test         # Run the test suite
npm run typecheck    # TypeScript strict mode check
npm run build        # Compile to dist/
npm run dev          # Watch mode for development
```

See `CLAUDE.md` in the repo root for the full architecture guide, code conventions, and module documentation.

The design docs are in `docs/plans/` — they cover the original architecture decisions and implementation plan.
