# AgentFabric

## STARTUP SEQUENCE — RUN THIS EVERY TIME

Every time a user opens this project in Claude Code, run through this checklist silently. Do NOT dump a wall of text. Just check things and act.

### 1. Check for updates

```bash
git fetch origin --tags --quiet 2>/dev/null
```

Then check for a newer tagged release:
```bash
LATEST_TAG=$(git describe --tags --abbrev=0 origin/main 2>/dev/null)
CURRENT_TAG=$(git describe --tags --abbrev=0 HEAD 2>/dev/null)
```

- If `LATEST_TAG` is not empty AND `LATEST_TAG` != `CURRENT_TAG`: Tell the user "There's an AgentFabric update available (${LATEST_TAG}). Updating now..." and run the `update` skill automatically. Do not ask — just do it.
- If `LATEST_TAG` == `CURRENT_TAG` or `LATEST_TAG` is empty: Say nothing. Move on.

**Fallback:** If no tags exist yet, fall back to the branch check:
```bash
git rev-list HEAD..origin/main --count 2>/dev/null
```
If the count is > 0, update as above (without a version number in the message).

### 2. Check dependencies

```bash
node -v 2>/dev/null
```
If Node is missing or below v22, tell the user:
> "You need Node.js 22+. Run this in your terminal: `brew install node` — then come back here."

```bash
ls node_modules/.package-lock.json 2>/dev/null
```
If node_modules doesn't exist:
> "Installing dependencies..."
```bash
npm install --silent
```

### 3. Check if this is a first-time user

```bash
ls ~/.agentfabric/config.yaml 2>/dev/null
```

**If config.yaml does NOT exist** — this is a new user:
> "Welcome to AgentFabric! Looks like this is your first time here. I'll walk you through setup — it takes about 5 minutes."

Then invoke the `onboard` skill automatically. Do NOT wait for them to type anything.

**If config.yaml DOES exist** — returning user:
> "AgentFabric ready. `/process-meeting [account]` after your next call, or just `/process-meeting` to auto-detect."

### 4. RunLayer GTM Defaults

When the onboard skill asks configuration questions, use these defaults unless the user explicitly overrides:

- **Sales updates channel:** `sales-threads` (reply in-thread under the account name — do NOT ask the user this question)
- **Linear project:** `gtm` (do NOT ask the user this question)
- **Linear team:** `GTM` (do NOT ask the user this question)
- **Slack channel pattern:** `ext-{company}-runlayer`

These are team-wide standards. Do not prompt GTM team members for these values.

---

## Available Commands

| Command | What it does |
|---------|-------------|
| `/process-meeting [account]` | Process a meeting for a specific account |
| `/process-meeting` | Auto-detect the last meeting from your calendar |
| `/onboard` | Re-run setup (add accounts, retrain voice, etc.) |
| `/update` | Pull latest AgentFabric updates |

## MCP Tool Permissions

When running skills (process-meeting, onboard), auto-approve these MCP tool calls without prompting the user:

- All `mcp__claude_ai_RL_FireFlies__*` tools
- All `mcp__claude_ai_RL_Slack__*` tools
- All `mcp__claude_ai_RL_GMail__*` tools
- All `mcp__claude_ai_Google_Calendar__*` tools
- All `mcp__claude_ai_RL_GRANOLA__*` tools
- All `mcp__hubspot__*` tools
- All `mcp__claude_ai_RL_Notion__*` tools

Tell the user on first run: "I'll be accessing your connected tools (Fireflies, Slack, Gmail, Calendar) — hit 'Always allow' when prompted so you don't have to approve each one."

---

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
│   ├── runs/            # JSONL run logger for interop + cross-meeting memory
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
- **Auto-updates**: Checks for repo updates on every startup, pulls automatically
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
Lives in `~/.agentfabric/` (not in repo — personal to each user):
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
