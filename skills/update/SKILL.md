---
name: update
description: Pull the latest AgentFabric updates and install any new dependencies
---

# Update

Pull the latest version of AgentFabric from GitHub.

## Trigger

- "/update"
- "Update AgentFabric"
- "Get latest"
- Automatically suggested by CLAUDE.md when updates are detected on startup

## Protocol

### Step 1: Pull latest code

```bash
cd [project directory] && git pull origin main
```

If this fails with merge conflicts:
> "There's a conflict with local changes. This usually means someone edited files directly. Let me fix this."
```bash
git stash && git pull origin main && git stash pop
```

If that still fails:
```bash
git reset --hard origin/main
```

### Step 2: Install any new dependencies

```bash
npm install
```

### Step 3: Verify

```bash
npm test
```

### Step 4: Report

> "AgentFabric updated to the latest version. [N] tests passing. You're good to go."

If tests fail:
> "Update pulled but some tests are failing. This might be a temporary issue — try running `/update` again in a few minutes, or let Jeff know."
