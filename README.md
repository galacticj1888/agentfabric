```
     ___                    __  ______      __         _
    /   | ____ ____  ____  / /_/ ____/___ _/ /_  _____(_)____
   / /| |/ __ `/ _ \/ __ \/ __/ /_  / __ `/ __ \/ ___/ / ___/
  / ___ / /_/ /  __/ / / / /_/ __/ / /_/ / /_/ / /  / / /__
 /_/  |_\__, /\___/_/ /_/\__/_/    \__,_/_.___/_/  /_/\___/
       /____/
```

### Your meetings just ended. Your work is already done.

---

<br>

> *"Three months from now, you're not gonna be using Claude at all. You're gonna be fully on Claude Code. Every single email follow-up, every single Slack follow-up, is gonna be written for you in your own voice. You're not gonna have to copy and paste anything. All of that will be automatic. You're gonna go from call to call and only focus on the super high leverage stuff."*

<br>

---

## The Problem

You just hung up a customer call. Now what?

- Open Granola, copy the transcript
- Paste it into Claude, ask for a summary
- Copy that into Gmail, manually add recipients, fire it off
- Open HubSpot, update the deal notes
- Open Slack, write an update in #sales-threads
- Open Linear, manually create follow-up tasks
- Try to remember what you promised last week

**That's 30 minutes of busywork. Per meeting. Per day. Every day.**

You're running 20+ opportunities. You don't have 30 minutes.

## The Solution

```
> /process-meeting FINRA
```

That's it. One command. Everything else is automatic.

```
  Pulling Fireflies transcript...          done
  Scanning #ext-finra-runlayer...          done
  Checking calendar attendees...           done
  Loading previous commitments...          2 found

  Extracting commitments & takeaways...    done

  Email draft created                      "Following up: FINRA POC Kickoff"
                                            → duane.whitt@finra.org (Gmail drafts)

  3 Linear tasks created                   [FINRA] Send pricing proposal
                                           [FINRA] Schedule security review
                                           [FINRA] Share integration docs

  Sales thread posted                      #sales-threads

  Customer summary ready                   Sent to your DMs for review

  Run logged                               ~/.agentfabric/runs/2026-03-09.jsonl
```

**From call to done in 15 seconds.** Not 30 minutes. Seconds.

<br>

## How It Works

```
                         ┌─────────────────────────────────────┐
                         │          /process-meeting           │
                         └──────────────┬──────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
              ┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐
              │  INGEST    │     │   REASON     │    │    ACT      │
              │            │     │              │    │             │
              │ Fireflies  │     │  One Claude  │    │ Gmail Draft │
              │ Slack      │────▶│  call does   │───▶│ Linear Tasks│
              │ Calendar   │     │  everything  │    │ Sales Thread│
              │ Gmail      │     │              │    │ Slack DM    │
              │ Granola    │     │ commitments  │    │             │
              │            │     │ takeaways    │    │ Run Logger  │
              └────────────┘     │ email draft  │    └─────────────┘
                                 │ slack posts  │
                                 └──────────────┘
```

**Single-pass reasoning.** One prompt. One response. Everything extracted together so your email perfectly references the commitments, and your Slack update aligns with your tasks. No fragmentation.

**Cross-meeting memory.** AgentFabric remembers what happened last time. Your follow-up email says *"Following up on the security review you mentioned last week"* because it actually knows what happened last week.

**Human-in-the-loop.** Customer-facing summaries get DM'd to you first. Review it, tweak it, then post it. We never auto-send to customers. Ever.

<br>

## Quick Start

**Option A: One-line install** (recommended)

Open your terminal and paste this:
```bash
curl -fsSL https://raw.githubusercontent.com/galacticj1888/agentfabric/main/setup.sh | bash
```

It checks your setup, clones the repo, and installs everything. Then just run:
```bash
cd ~/Desktop/Projects/agentfabric && claude
```

AgentFabric will automatically walk you through the rest.

**Option B: Manual install**
```bash
git clone https://github.com/galacticj1888/agentfabric.git
cd agentfabric
npm install
claude
```

When Claude Code opens, it detects this is your first time and starts the guided setup automatically. No commands to memorize.

The onboarding wizard:

```
  Step 1   Validating MCP connections...
           Fireflies    ✓
           Slack         ✓
           Gmail         ✓
           Calendar      ✓
           Granola       ✓ (optional)

  Step 2   Training your voice profile...
           "I need 10-15 of your call transcripts."
           Analyzing tone, lexicon, sentence structure...

           Voice profile generated:
           ┌──────────────────────────────────────────┐
           │  # Voice Profile: Ryan Kearns            │
           │                                          │
           │  ## Tone                                 │
           │  Direct, high-energy, casual profanity.  │
           │  Balances enthusiasm with substance.     │
           │                                          │
           │  ## Lexicon                              │
           │  "bananas" — intensity marker            │
           │  "fire that off" — send action           │
           │  "fuck with" — engage positively         │
           └──────────────────────────────────────────┘

           Look good? (y/n)

  Step 3   Configuring your accounts...
           Pulled 12 deals from HubSpot
           Mapped Slack channels

  Step 4   All set. Run /process-meeting after your next call.
```

<br>

## Zero-Click Mode

Don't even type the account name.

```
> /process-meeting
```

AgentFabric checks your calendar, finds the meeting that just ended, matches the attendee domains to your accounts, and runs the whole pipeline. You finish a call, type seven characters, and you're done.

<br>

## Multi-User

This isn't a personal script. It's a team framework.

Each person clones the repo, runs `/onboard`, and gets their own:

```
~/.agentfabric/
├── config.yaml          # Your preferences
├── voice-profile.md     # Writes like YOU
├── accounts.yaml        # Your deals, your channels
└── runs/                # Your meeting history
```

Ryan's follow-ups sound like Ryan. Andrew's sound like Andrew. Jeff's sound like Jeff. Same system, different voices.

<br>

## The Elevation Path

AgentFabric is designed to grow with you.

```
  LEVEL 1                    LEVEL 2                    LEVEL 3
  ─────────────────          ─────────────────          ─────────────────
  Claude Code Native         CLI + Cron                 Always-On Daemon

  You type the command.      It runs on a schedule.     It just happens.
  After every meeting.       Morning briefings.         Fireflies webhook
  Manual trigger.            Nightly summaries.         fires, pipeline runs,
                             Cron jobs.                 you never touch it.

  ◄── YOU ARE HERE
```

Start simple. Elevate when you're ready.

<br>

## What Gets Built

| Output | Destination | Auto? |
|--------|------------|-------|
| Follow-up email | Gmail Drafts | Yes — in your voice |
| Action items | Linear | Yes — tagged per account |
| State update | #sales-threads | Yes — internal only |
| Meeting summary | Your Slack DMs | Yes — you review before posting |
| Run log | ~/.agentfabric/runs/ | Yes — feeds downstream systems |

<br>

## Architecture

```
src/
├── ingest/          # Pull data from MCP sources
│   ├── fireflies    #   transcripts, summaries, action items
│   ├── slack        #   channel history, search, threads
│   ├── calendar     #   meeting details, attendees
│   ├── gmail        #   recent email threads
│   └── granola      #   meeting notes
│
├── reason/          # Single-pass "God Prompt"
│   ├── prompt       #   builds the combined extraction prompt
│   ├── parser       #   validates Claude's JSON response
│   └── memory       #   injects previous run commitments
│
├── act/             # Dispatch outputs
│   ├── gmail-draft  #   create draft via MCP
│   ├── linear-tasks #   create tasks, filter by team
│   ├── sales-thread #   post to internal channel
│   └── customer-dm  #   DM summary for review (never auto-post)
│
├── voice/           # Voice profile system
│   ├── analyze      #   extract style from transcripts
│   ├── generate     #   produce voice-profile.md
│   └── apply        #   inject into prompts
│
├── config/          # User configuration
│   ├── loader       #   read yaml + markdown files
│   └── accounts     #   fuzzy account resolution
│
├── runs/            # Persistence + interop
│   └── logger       #   JSONL append, date queries, account lookup
│
└── types/           # Zod schemas + TypeScript types
    ├── fabric       #   FabricOutput, Commitment, Takeaway
    ├── ingest       #   MCP source data shapes
    └── config       #   user config shapes
```

**58 tests. Strict TypeScript. Zod validation. Zero `any` types.**

<br>

## Requirements

- **Node.js 22+**
- **Claude Code** with MCP connections:
  - Fireflies (transcripts)
  - Slack (channels + messaging)
  - Gmail (drafts)
  - Google Calendar (events)
- **Optional:** Granola, Linear, HubSpot

<br>

## Development

```bash
npm run test         # 58 tests, <500ms
npm run typecheck    # strict mode, zero errors
npm run build        # compile to dist/
npm run dev          # watch mode
```

<br>

## The Vision

You're running 30 opportunities. You go from call to call. Every follow-up email is written in your voice. Every task is tracked. Every internal update is posted. Every customer summary is reviewed and sent.

You focus on the high-leverage stuff — building relationships, negotiating deals, closing revenue.

Everything else? AgentFabric handles it.

**Hands-free driving for GTM.**

<br>

---

<p align="center">
  <b>Built with Claude Code</b>
  <br>
  <sub>MIT License</sub>
</p>
