# AgentFabric

## Project Overview
Claude Code-native post-meeting automation framework for GTM teams.
After every customer call, one command: drafts follow-up emails in your voice,
creates Linear tasks, posts sales thread updates, and DMs you the customer summary for review.

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
│   ├── runs/            # JSONL run logger + per-account state for cross-meeting memory
│   ├── types/           # Zod schemas + TypeScript types
│   └── index.ts         # Public API exports
├── skills/
│   ├── process-meeting/ # Main post-meeting automation skill
│   ├── onboard/         # First-time setup skill
│   └── update/          # Auto-update skill
├── tests/               # Vitest test suite
└── docs/                # Design docs, user guide, plans
```

## Architecture

Three-layer pipeline: **Ingest -> Reason -> Act**

- **Ingest**: Fetches data from MCP sources (Fireflies, Slack, Calendar, Gmail, Granola)
- **Reason**: Single-pass "God Prompt" — extracts commitments, takeaways, email draft, sales thread update, and customer summary in ONE Claude call
- **Act**: Formats and dispatches to output targets (Gmail draft, Linear tasks, Slack)

### Key Design Decisions
- **Single-pass reasoning**: One Claude call instead of four. Faster, cheaper, coherent.
- **Cross-meeting memory**: Per-account state files provide instant O(1) lookup of previous commitments. JSONL audit logs kept for full history.
- **Human-in-the-loop**: Customer-facing Slack summaries are DM'd for review, never auto-posted.
- **Zero-click mode**: /process-meeting with no arg auto-detects from last calendar meeting.

## Code Conventions
- Strict TypeScript — no `any` types
- Zod for runtime validation of all external data
- Functional patterns — pure functions where possible
- Graceful degradation — continue if an MCP source fails
- Prefer early returns over nested conditionals

## User Config
Lives in `~/.agentfabric/` (not in repo — personal to each user):
- `config.yaml` — user ID, preferences, Linear project, sales threads channel
- `accounts.yaml` — account registry with Slack channels, domains, contacts
- `voice-profile.md` — generated voice style guide (markdown, hand-editable)
- `runs/` — JSONL output logs (one file per day)
- `state/accounts/` — per-account state files with unresolved commitments (cross-meeting memory)

## RunLayer GTM Defaults
When onboarding RunLayer GTM team members, use these defaults:
- **Sales updates channel:** `sales-threads` (reply in-thread under the account name)
- **Linear project:** `gtm`
- **Linear team:** `GTM`
- **Slack channel pattern:** `ext-{company}-runlayer`

## MCP Tools Used
- **Fireflies**: search, get_transcript, get_summary
- **Slack**: search, get_channel_history, send_message
- **Gmail**: search, create_draft
- **Google Calendar**: list_events
- **Granola**: query meetings (optional)
- **HubSpot**: search deals (onboarding only)
