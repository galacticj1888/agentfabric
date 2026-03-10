---
name: update
description: Pull the latest AgentFabric updates and install any new dependencies
---

# Update

Pull the latest version of AgentFabric from GitHub.

## Trigger

- "/update"
- "update" (without slash — common for new users)
- "Update AgentFabric"
- "Get latest"
- Automatically suggested by CLAUDE.md when updates are detected on startup

## Protocol

### Step 1: Pull latest code from main

```bash
cd [project directory] && git fetch origin --quiet
```

Check for uncommitted local changes:
```bash
git status --short
```

If there are local changes, STOP and tell the user:
> "This install has local changes, so I didn't auto-update it. Commit, stash, or discard those changes first, then run `/update` again."

If the working tree is clean, make sure you're on `main` and fast-forward it:
```bash
git checkout main
git pull --ff-only origin main
```

If `git checkout main` fails because the branch does not exist locally, create it from `origin/main`:
```bash
git checkout -B main origin/main
```

If `git pull --ff-only origin main` fails, STOP and tell the user:
> "I couldn't fast-forward this install cleanly. Check the local git state, then rerun `/update` once it's back on `main`."

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
