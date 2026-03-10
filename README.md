# AgentFabric

Post-meeting automation for GTM teams, powered by Claude Code.

After every customer meeting, one command processes your calls and:
- **Drafts a follow-up email** in your voice -> Gmail drafts
- **Creates action item tasks** -> Linear
- **Posts a state update** -> your sales channel
- **Sends you a meeting summary** for review -> Slack DM

## Quick Start

```bash
git clone https://github.com/galacticj1888/agentfabric.git
cd agentfabric
npm install
```

Then in Claude Code:
```
> /onboard
```

This walks you through:
1. Validating your MCP connections (Fireflies, Slack, Gmail, Calendar)
2. Training your voice profile from your call transcripts
3. Configuring your accounts and Slack channels

## Usage

After a meeting:
```
> /process-meeting FINRA
```

Or just:
```
> /process-meeting
```
(Auto-detects from your last calendar meeting)

That's it. The agent handles everything.

## What It Does

```
/process-meeting FINRA
  -> Pulls latest Fireflies transcript
  -> Grabs recent Slack from #ext-finra-runlayer
  -> Checks Calendar for attendees
  -> Checks Gmail for recent threads
  -> Loads previous commitments for continuity
  -> Extracts commitments and takeaways (single pass)
  -> Drafts follow-up email in your voice -> Gmail
  -> Creates Linear tasks per action item
  -> Posts update to #sales-threads
  -> DMs you the customer summary for review
```

## Multi-User

Each person gets their own `~/.agentfabric/` config:
- **Voice profile** -- trained from your transcripts, writes like you
- **Account list** -- your deals, your channels
- **Run history** -- JSONL log of every processed meeting

Your voice. Your deals. Your drafts.

## Architecture

```
Ingest -> Reason -> Act

MCP Sources          God Prompt           Outputs
-----------         ------------         ----------
Fireflies    -|     Single Claude   |->  Gmail Draft
Slack        -|     call extracts:  |->  Linear Tasks
Calendar     -|-->  - commitments   |->  Sales Thread
Gmail        -|     - takeaways     |->  Customer Summary
Granola      -|     - email draft         (DM for review)
                    - slack updates
```

## Requirements

- Node.js 22+
- Claude Code with MCP connections to: Fireflies, Slack, Gmail, Google Calendar
- Optional: Granola, Linear, HubSpot

## Development

```bash
npm run test         # Run test suite
npm run typecheck    # TypeScript strict mode check
npm run build        # Compile to dist/
```

## License

MIT
