# AgentFabric

## FIRST-RUN DETECTION — READ THIS FIRST

**Every time a user opens this project in Claude Code, check if `~/.agentfabric/config.yaml` exists.**

If it does NOT exist, the user has never set up AgentFabric. Do this IMMEDIATELY — before responding to anything else:

1. Say: "Welcome to AgentFabric! Looks like this is your first time here. I'll walk you through setup — it takes about 5 minutes."
2. Invoke the `onboard` skill automatically. Do NOT wait for the user to type `/onboard`.
3. The onboard skill handles everything from there.

If it DOES exist, greet them briefly:
- "AgentFabric ready. Run `/process-meeting [account]` after your next call, or just `/process-meeting` to auto-detect."

---

## Project Overview
Claude Code-native post-meeting automation framework for GTM teams.
After every customer call, one command: drafts follow-up emails in your voice,
creates Linear tasks, posts sales thread updates, and DMs you the customer summary for review.

## Available Commands

| Command | What it does |
|---------|-------------|
| `/onboard` | First-time setup: MCP connections, voice profile, accounts |
| `/process-meeting [account]` | Process a meeting for a specific account |
| `/process-meeting` | Auto-detect the last meeting from your calendar |

## Tech Stack
- **Runtime:** Node.js 22+ with TypeScript (strict mode)
- **Validation:** Zod for all external data
- **Testing:** Vitest
- **Build:** tsc for production, tsx for dev

## Dev Commands
```bash
npm run test         # Run test suite
npm run typecheck    # Type check without emitting
npm run build        # Compile TypeScript
npm run dev          # Development mode (watch)
```

## Project Structure
```
agentfabric/
├── src/
│   ├── ingest/          # MCP data fetchers + text mergers
│   ├── reason/          # Single-pass God Prompt (commitments, takeaways, drafts)
│   ├── act/             # Output formatters (Gmail, Linear, Slack)
│   ├── voice/           # Voice profile analysis + generation + application
│   ├── config/          # User config loader (config.yaml, accounts.yaml)
│   ├── runs/            # JSONL run logger for interop + cross-meeting memory
│   ├── types/           # Zod schemas + TypeScript types
│   └── index.ts         # Public API exports
├── skills/
│   ├── process-meeting/ # Main post-meeting automation skill
│   └── onboard/         # User onboarding skill
├── tests/               # Vitest test suite
└── docs/                # Design docs, user guide, implementation plans
```

## Architecture

Three-layer pipeline: **Ingest -> Reason -> Act**

- **Ingest**: Fetches data from MCP sources (Fireflies, Slack, Calendar, Gmail, Granola)
- **Reason**: Single-pass "God Prompt" — extracts commitments, takeaways, email draft, sales thread update, and customer summary in ONE Claude call
- **Act**: Formats and dispatches to output targets (Gmail draft, Linear tasks, Slack)

### Key Design Decisions
- **Single-pass reasoning**: One Claude call instead of four. Faster, cheaper, coherent.
- **Cross-meeting memory**: Previous run's commitments injected into prompt for continuity.
- **Human-in-the-loop**: Customer-facing Slack summaries are DM'd for review, never auto-posted.
- **Zero-click mode**: /process-meeting with no arg auto-detects from last calendar meeting.

## Code Conventions
- Strict TypeScript — no `any` types
- Zod for runtime validation of all external data
- Functional patterns — pure functions where possible
- Graceful degradation — continue if an MCP source fails
- Prefer early returns over nested conditionals

## User Config
Lives in `~/.agentfabric/` (not in repo):
- `config.yaml` — user ID, preferences, Linear project, sales threads channel
- `accounts.yaml` — account registry with Slack channels, domains, contacts
- `voice-profile.md` — generated voice style guide (markdown, hand-editable)
- `runs/` — JSONL output logs (one file per day)

## MCP Tools Used
- **Fireflies**: search, get_transcript, get_summary
- **Slack**: search, get_channel_history, send_message
- **Gmail**: search, create_draft
- **Google Calendar**: list_events
- **Granola**: query meetings (optional)
- **HubSpot**: search deals (onboarding only)
