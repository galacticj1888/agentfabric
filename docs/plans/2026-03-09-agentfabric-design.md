# AgentFabric — Design Document

**Date:** 2026-03-09
**Author:** Jeff Settle + Claude
**Status:** Approved

## What It Is

A Claude Code-native post-meeting automation framework for GTM teams. You clone the repo, run onboarding, and after every meeting your agent aggregates data, extracts commitments, drafts follow-ups in your voice, creates tasks, and posts updates — all in one command.

## Core UX

```
> /process-meeting FINRA
```

1. Pulls latest Fireflies transcript for FINRA
2. Grabs recent Slack from `#ext-finra-runlayer`
3. Checks Calendar for who was on the call
4. Extracts commitments and takeaways
5. Drafts follow-up email in your voice → Gmail drafts
6. Creates Linear tasks for every action item
7. Posts state update to `#sales-threads`
8. Drops meeting summary in `#ext-finra-runlayer`

## Multi-User

Each user has their own `~/.agentfabric/` directory:

```
~/.agentfabric/
├── config.yaml          # MCP connections, Linear project, defaults
├── voice-profile.md     # Generated during onboarding from transcripts
├── accounts.yaml        # Account registry (name, slack channel, deal stage)
└── runs/                # JSONL output log (interop with Chief of Staff, etc.)
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     AgentFabric                      │
├──────────────┬────────────────────┬──────────────────┤
│    INGEST    │       REASON       │       ACT        │
├──────────────┼────────────────────┼──────────────────┤
│ Fireflies    │ Commitment         │ Gmail Drafts     │
│ Slack        │   Extraction       │ Linear Tasks     │
│ Calendar     │ Takeaway           │ Sales Threads    │
│ Gmail        │   Distillation     │ Slack Summaries  │
│ Granola      │ Voice Synthesis    │                  │
└──────────────┴────────────────────┴──────────────────┘
         ↑              ↑                  ↑
     MCP Tools     Claude API          MCP Tools
```

### Module Structure

```
src/
├── ingest/
│   ├── fireflies.ts       # Fetch transcripts, summaries, action items
│   ├── slack.ts            # Channel history, thread replies, search
│   ├── calendar.ts         # Meeting details, attendees
│   ├── gmail.ts            # Recent threads with account contacts
│   ├── granola.ts          # Meeting notes (optional source)
│   └── index.ts            # Parallel fetcher with graceful degradation
├── reason/
│   ├── commitments.ts      # WHO committed TO WHOM about WHAT BY WHEN
│   ├── takeaways.ts        # Key discussion points, decisions, risks
│   ├── followup.ts         # Draft email generation with voice profile
│   └── index.ts            # Reasoning pipeline orchestrator
├── act/
│   ├── gmail-draft.ts      # Create draft in user's Gmail
│   ├── linear-tasks.ts     # Create tasks in Linear per account
│   ├── sales-threads.ts    # Post update to #sales-threads
│   ├── slack-summary.ts    # Post meeting summary to shared channel
│   └── index.ts            # Action dispatcher
├── voice/
│   ├── analyze.ts          # Extract lexicon, tone, patterns from transcripts
│   ├── generate-profile.ts # Produce voice-profile.md from analysis
│   └── apply.ts            # Apply voice profile to generated content
├── config/
│   ├── loader.ts           # Load ~/.agentfabric/ config
│   ├── schema.ts           # Zod schemas for config validation
│   └── accounts.ts         # Account registry helpers
├── types/
│   ├── fabric.ts           # Core types (FabricOutput, Commitment, Takeaway)
│   ├── ingest.ts           # MCP data source types
│   └── config.ts           # Config and account types
└── index.ts                # Main entry point
```

### Skills

```
skills/
├── onboard/SKILL.md          # Onboarding flow (MCP validation, voice training, accounts)
├── process-meeting/SKILL.md  # Main post-meeting automation
└── morning-briefing/SKILL.md # Daily commitment summary (Level 2+)
```

## Interoperability

Every run produces a structured `FabricOutput` envelope:

```typescript
interface FabricOutput {
  runId: string;
  userId: string;
  meetingId: string;
  account: string;
  timestamp: string;
  sources: string[];              // which MCP sources contributed
  commitments: Commitment[];
  takeaways: Takeaway[];
  actions: {
    emailDraft?: { threadId: string; subject: string; };
    linearTasks?: { id: string; title: string; url: string; }[];
    salesThreadUpdate?: { channel: string; ts: string; };
    customerSummary?: { channel: string; ts: string; };
  };
}
```

Written to `~/.agentfabric/runs/YYYY-MM-DD.jsonl`. Downstream systems (Chief of Staff, Account Encyclopedia) can read this log without coupling.

## Onboarding Flow

```
> /onboard

1. Validate MCP connections (Fireflies, Slack, Gmail, Calendar, Linear)
2. "Paste or point me to 10-15 call transcripts"
3. Analyze transcripts → extract lexicon, tone, structure, greetings, closings
4. Generate ~/.agentfabric/voice-profile.md
5. "Which accounts are yours?" → populate accounts.yaml
6. "Which Linear team/project?" → configure task destination
7. Confirmation + first test run
```

## Voice Profile

A markdown document — not embeddings, not fine-tuning. A detailed style guide:

```markdown
# Voice Profile: Ryan Kearns

## Tone
Direct, confident, high-energy. Uses casual profanity naturally.
Balances enthusiasm with substance.

## Lexicon
- "bananas" (intensity marker)
- "fire that off" (send action)
- "fuck with" (engage with positively)

## Email Patterns
- Opens with context reminder, not pleasantries
- Bullet-pointed action items
- Closes with clear next step + timeline
- Signs off: "Best, Ryan"

## Sentence Structure
- Short, punchy sentences. Rarely exceeds 15 words.
- Uses em-dashes for asides.
- Asks direct questions — never hedges.
```

Editable by hand. Applied at generation time via prompt injection.

## Elevation Path

### Level 1: Claude Code Native (Day One)
- Skills invoke TypeScript library functions
- User triggers manually after meetings
- All MCP calls go through Claude Code's MCP proxy

### Level 2: CLI + Cron
- `npx agentfabric process FINRA` works standalone
- Cron jobs for morning briefings, end-of-day summaries
- Fireflies webhook triggers processing automatically

### Level 3: Always-On Daemon
- macOS launchd / systemd service
- Real-time Slack listener for commands
- Webhook-driven (meeting ends → auto-process)
- Dashboard UI (Electron or web)

## Tech Stack

- **Runtime:** Node.js 22+ / TypeScript (strict mode)
- **Validation:** Zod
- **Testing:** Vitest
- **MCP:** Claude Code MCP proxy (Level 1), direct MCP SDK (Level 2+)
- **Build:** tsc + tsx for dev
- **Package Manager:** npm

## What's Out of Scope

- CRM/HubSpot updates (separate flow)
- Fine-tuning or embeddings for voice (markdown profiles are sufficient)
- Multi-tenant hosting (this is clone-and-run, not SaaS)
- UI beyond CLI (until Level 3)
