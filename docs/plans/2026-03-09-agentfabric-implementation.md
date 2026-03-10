# AgentFabric Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Claude Code-native post-meeting automation framework that ingests meeting data via MCP, extracts commitments/takeaways, and produces email drafts, Linear tasks, sales thread updates, and customer Slack summaries — all in the user's trained voice.

**Architecture:** Three-layer pipeline (Ingest → Reason → Act) orchestrated by Claude Code skills. User config lives in `~/.agentfabric/`. Multi-user via per-user voice profiles and account registries. TypeScript strict mode, Zod validation, Vitest tests.

**Tech Stack:** Node.js 22+, TypeScript (strict), Zod, Vitest, tsx (dev), tsc (build)

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/index.ts`
- Create: `vitest.config.ts`

**Step 1: Initialize package.json**

```json
{
  "name": "agentfabric",
  "version": "0.1.0",
  "description": "Claude Code-native post-meeting automation for GTM teams",
  "type": "module",
  "engines": { "node": ">=22.0.0" },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/ --ext .ts",
    "lint:fix": "eslint src/ --ext .ts --fix"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^3.0.0",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0"
  },
  "dependencies": {
    "zod": "^3.24.0",
    "yaml": "^2.7.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: ".",
    include: ["tests/**/*.test.ts"],
  },
});
```

**Step 4: Create .gitignore**

```
node_modules/
dist/
*.tsbuildinfo
.env
.env.*
output/
```

**Step 5: Create src/index.ts**

```typescript
export { processMeeting } from "./reason/index.js";
export type { FabricOutput, FabricConfig } from "./types/fabric.js";
```

(This will fail to compile until we create the referenced modules — that's expected.)

**Step 6: Install dependencies**

Run: `cd ~/Desktop/Projects/agentfabric && npm install`
Expected: `node_modules/` created, lock file generated

**Step 7: Init git repo**

Run: `cd ~/Desktop/Projects/agentfabric && git init && git add -A && git commit -m "chore: project scaffold"`

---

### Task 2: Core Types

**Files:**
- Create: `src/types/fabric.ts`
- Create: `src/types/ingest.ts`
- Create: `src/types/config.ts`
- Create: `src/types/index.ts`
- Test: `tests/types/schemas.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/types/schemas.test.ts
import { describe, it, expect } from "vitest";
import {
  FabricOutputSchema,
  CommitmentSchema,
  TakeawaySchema,
  FabricConfigSchema,
  AccountEntrySchema,
} from "../../src/types/fabric.js";

describe("FabricOutput schema", () => {
  it("validates a complete output envelope", () => {
    const output = {
      runId: "run-abc123",
      userId: "jeff",
      meetingId: "fireflies-xyz",
      account: "FINRA",
      timestamp: "2026-03-09T15:00:00Z",
      sources: ["fireflies", "slack", "calendar"],
      commitments: [
        {
          who: "Jeff Settle",
          toWhom: "Duane Whitt",
          what: "Send pricing proposal",
          byWhen: "2026-03-12",
          confidence: "explicit" as const,
          rawQuote: "I'll get you pricing by Wednesday",
          source: "fireflies",
        },
      ],
      takeaways: [
        {
          type: "decision" as const,
          summary: "FINRA will proceed with POC",
          details: "Duane confirmed team alignment on evaluation timeline",
          account: "FINRA",
        },
      ],
      actions: {},
    };
    expect(FabricOutputSchema.parse(output)).toBeDefined();
  });

  it("rejects output missing required fields", () => {
    expect(() => FabricOutputSchema.parse({})).toThrow();
  });
});

describe("Commitment schema", () => {
  it("validates a commitment", () => {
    const commitment = {
      who: "Ryan Kearns",
      toWhom: "FINRA team",
      what: "Follow up on technical requirements",
      byWhen: "2026-03-10",
      confidence: "implied" as const,
      rawQuote: "I'll circle back on that",
      source: "fireflies",
    };
    expect(CommitmentSchema.parse(commitment)).toBeDefined();
  });
});

describe("FabricConfig schema", () => {
  it("validates user config", () => {
    const config = {
      userId: "jeff",
      voiceProfilePath: "~/.agentfabric/voice-profile.md",
      linearProject: "RunLayer GTM",
      linearTeam: "sales",
      salesThreadsChannel: "sales-threads",
      defaultSources: ["fireflies", "slack", "calendar"],
    };
    expect(FabricConfigSchema.parse(config)).toBeDefined();
  });
});

describe("AccountEntry schema", () => {
  it("validates an account entry", () => {
    const account = {
      name: "FINRA",
      slackChannel: "ext-finra-runlayer",
      domain: "finra.org",
      dealStage: "3-evaluation",
      contacts: ["duane.whitt@finra.org"],
    };
    expect(AccountEntrySchema.parse(account)).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/types/schemas.test.ts`
Expected: FAIL — modules not found

**Step 3: Write src/types/fabric.ts**

```typescript
import { z } from "zod";

// --- Commitment ---

export const CommitmentSchema = z.object({
  who: z.string(),
  toWhom: z.string(),
  what: z.string(),
  byWhen: z.string().optional(),
  confidence: z.enum(["explicit", "implied", "inferred"]),
  rawQuote: z.string().optional(),
  source: z.string(),
});
export type Commitment = z.infer<typeof CommitmentSchema>;

// --- Takeaway ---

export const TakeawaySchema = z.object({
  type: z.enum(["decision", "risk", "blocker", "opportunity", "insight"]),
  summary: z.string(),
  details: z.string().optional(),
  account: z.string(),
});
export type Takeaway = z.infer<typeof TakeawaySchema>;

// --- Action Results ---

export const EmailDraftResultSchema = z.object({
  threadId: z.string().optional(),
  draftId: z.string(),
  subject: z.string(),
  to: z.array(z.string()),
});
export type EmailDraftResult = z.infer<typeof EmailDraftResultSchema>;

export const LinearTaskResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
});
export type LinearTaskResult = z.infer<typeof LinearTaskResultSchema>;

export const SlackMessageResultSchema = z.object({
  channel: z.string(),
  ts: z.string(),
});
export type SlackMessageResult = z.infer<typeof SlackMessageResultSchema>;

export const ActionsSchema = z.object({
  emailDraft: EmailDraftResultSchema.optional(),
  linearTasks: z.array(LinearTaskResultSchema).optional(),
  salesThreadUpdate: SlackMessageResultSchema.optional(),
  customerSummary: SlackMessageResultSchema.optional(),
});
export type Actions = z.infer<typeof ActionsSchema>;

// --- Fabric Output Envelope ---

export const FabricOutputSchema = z.object({
  runId: z.string(),
  userId: z.string(),
  meetingId: z.string(),
  account: z.string(),
  timestamp: z.string(),
  sources: z.array(z.string()),
  commitments: z.array(CommitmentSchema),
  takeaways: z.array(TakeawaySchema),
  actions: ActionsSchema,
});
export type FabricOutput = z.infer<typeof FabricOutputSchema>;

// --- Config ---

export const FabricConfigSchema = z.object({
  userId: z.string(),
  voiceProfilePath: z.string(),
  linearProject: z.string().optional(),
  linearTeam: z.string().optional(),
  salesThreadsChannel: z.string().default("sales-threads"),
  defaultSources: z.array(z.string()).default(["fireflies", "slack", "calendar"]),
});
export type FabricConfig = z.infer<typeof FabricConfigSchema>;

// --- Account Entry ---

export const AccountEntrySchema = z.object({
  name: z.string(),
  slackChannel: z.string().optional(),
  domain: z.string().optional(),
  dealStage: z.string().optional(),
  contacts: z.array(z.string()).default([]),
});
export type AccountEntry = z.infer<typeof AccountEntrySchema>;
```

**Step 4: Write src/types/ingest.ts**

```typescript
import { z } from "zod";

// --- Fireflies ---

export const FirefliesAttendeeSchema = z.object({
  displayName: z.string(),
  email: z.string().optional(),
});

export const FirefliesSummarySchema = z.object({
  short_summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  action_items: z.string().optional(),
});

export const FirefliesTranscriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  dateString: z.string(),
  duration: z.number().optional(),
  organizerEmail: z.string().optional(),
  participants: z.array(z.string()).optional(),
  meetingAttendees: z.array(FirefliesAttendeeSchema).optional(),
  summary: FirefliesSummarySchema.optional(),
  transcript: z.string().optional(),
});
export type FirefliesTranscript = z.infer<typeof FirefliesTranscriptSchema>;

// --- Slack ---

export const SlackChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_private: z.boolean().optional(),
});

export const SlackMessageSchema = z.object({
  type: z.string().optional(),
  channel: SlackChannelSchema.optional(),
  user: z.string().optional(),
  user_name: z.string().optional(),
  username: z.string().optional(),
  text: z.string(),
  ts: z.string(),
  timestamp: z.string().optional(),
  permalink: z.string().optional(),
});
export type SlackMessage = z.infer<typeof SlackMessageSchema>;

// --- Calendar ---

export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

// --- Gmail ---

export const GmailThreadSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  date: z.string(),
  snippet: z.string().optional(),
  body: z.string().optional(),
});
export type GmailThread = z.infer<typeof GmailThreadSchema>;

// --- Granola ---

export const GranolaMeetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  notes: z.string().optional(),
  transcript: z.string().optional(),
});
export type GranolaMeeting = z.infer<typeof GranolaMeetingSchema>;

// --- Aggregated Ingest Data ---

export const IngestDataSchema = z.object({
  account: z.string(),
  fetchedAt: z.string(),
  fireflies: z.object({
    transcripts: z.array(FirefliesTranscriptSchema),
  }).optional(),
  slack: z.object({
    messages: z.array(SlackMessageSchema),
  }).optional(),
  calendar: z.object({
    events: z.array(CalendarEventSchema),
  }).optional(),
  gmail: z.object({
    threads: z.array(GmailThreadSchema),
  }).optional(),
  granola: z.object({
    meetings: z.array(GranolaMeetingSchema),
  }).optional(),
});
export type IngestData = z.infer<typeof IngestDataSchema>;
```

**Step 5: Write src/types/config.ts**

```typescript
import { z } from "zod";
import { AccountEntrySchema } from "./fabric.js";

export const AccountsFileSchema = z.object({
  accounts: z.array(AccountEntrySchema),
});
export type AccountsFile = z.infer<typeof AccountsFileSchema>;

export const VoiceProfile = z.object({
  raw: z.string(),
});
export type VoiceProfile = z.infer<typeof VoiceProfile>;
```

**Step 6: Write src/types/index.ts**

```typescript
export * from "./fabric.js";
export * from "./ingest.js";
export * from "./config.js";
```

**Step 7: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/types/schemas.test.ts`
Expected: ALL PASS

**Step 8: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: core types with Zod schemas (Commitment, Takeaway, FabricOutput, IngestData, Config)"
```

---

### Task 3: Config Loader

**Files:**
- Create: `src/config/schema.ts`
- Create: `src/config/loader.ts`
- Create: `src/config/accounts.ts`
- Create: `src/config/index.ts`
- Test: `tests/config/loader.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/config/loader.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadConfig, loadAccounts, loadVoiceProfile, resolveAccount } from "../../src/config/index.js";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("loadConfig", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "agentfabric-test-"));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("loads a valid config.yaml", () => {
    writeFileSync(
      join(testDir, "config.yaml"),
      `userId: jeff
voiceProfilePath: ./voice-profile.md
linearProject: RunLayer GTM
linearTeam: sales
salesThreadsChannel: sales-threads
defaultSources:
  - fireflies
  - slack
  - calendar
`
    );
    const config = loadConfig(testDir);
    expect(config.userId).toBe("jeff");
    expect(config.defaultSources).toEqual(["fireflies", "slack", "calendar"]);
  });

  it("throws on missing config.yaml", () => {
    expect(() => loadConfig(testDir)).toThrow();
  });
});

describe("loadAccounts", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "agentfabric-test-"));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("loads accounts.yaml", () => {
    writeFileSync(
      join(testDir, "accounts.yaml"),
      `accounts:
  - name: FINRA
    slackChannel: ext-finra-runlayer
    domain: finra.org
    contacts:
      - duane.whitt@finra.org
  - name: Goldman Sachs
    slackChannel: ext-gs-runlayer
    domain: gs.com
`
    );
    const accounts = loadAccounts(testDir);
    expect(accounts).toHaveLength(2);
    expect(accounts[0].name).toBe("FINRA");
  });

  it("returns empty array when no accounts.yaml", () => {
    const accounts = loadAccounts(testDir);
    expect(accounts).toEqual([]);
  });
});

describe("resolveAccount", () => {
  it("finds account by exact name (case-insensitive)", () => {
    const accounts = [
      { name: "FINRA", slackChannel: "ext-finra-runlayer", contacts: [] },
      { name: "Goldman Sachs", slackChannel: "ext-gs-runlayer", contacts: [] },
    ];
    expect(resolveAccount(accounts, "finra")?.name).toBe("FINRA");
    expect(resolveAccount(accounts, "goldman sachs")?.name).toBe("Goldman Sachs");
  });

  it("finds account by partial match", () => {
    const accounts = [
      { name: "Goldman Sachs", slackChannel: "ext-gs-runlayer", contacts: [] },
    ];
    expect(resolveAccount(accounts, "goldman")?.name).toBe("Goldman Sachs");
  });

  it("returns undefined for no match", () => {
    expect(resolveAccount([], "FINRA")).toBeUndefined();
  });
});

describe("loadVoiceProfile", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "agentfabric-test-"));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("loads voice-profile.md as raw string", () => {
    writeFileSync(join(testDir, "voice-profile.md"), "# Voice Profile\n\nDirect and confident.");
    const profile = loadVoiceProfile(testDir);
    expect(profile).toContain("Direct and confident");
  });

  it("returns empty string when no profile", () => {
    expect(loadVoiceProfile(testDir)).toBe("");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/config/loader.test.ts`
Expected: FAIL — modules not found

**Step 3: Write src/config/loader.ts**

```typescript
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { FabricConfigSchema, AccountEntrySchema } from "../types/fabric.js";
import { AccountsFileSchema } from "../types/config.js";
import type { FabricConfig, AccountEntry } from "../types/fabric.js";

const DEFAULT_DIR = join(
  process.env.HOME ?? process.env.USERPROFILE ?? "~",
  ".agentfabric"
);

export function loadConfig(configDir: string = DEFAULT_DIR): FabricConfig {
  const configPath = join(configDir, "config.yaml");
  if (!existsSync(configPath)) {
    throw new Error(
      `AgentFabric config not found at ${configPath}. Run /onboard to set up.`
    );
  }
  const raw = readFileSync(configPath, "utf-8");
  const parsed = parseYaml(raw);
  return FabricConfigSchema.parse(parsed);
}

export function loadAccounts(configDir: string = DEFAULT_DIR): AccountEntry[] {
  const accountsPath = join(configDir, "accounts.yaml");
  if (!existsSync(accountsPath)) {
    return [];
  }
  const raw = readFileSync(accountsPath, "utf-8");
  const parsed = parseYaml(raw);
  const file = AccountsFileSchema.parse(parsed);
  return file.accounts;
}

export function loadVoiceProfile(configDir: string = DEFAULT_DIR): string {
  const profilePath = join(configDir, "voice-profile.md");
  if (!existsSync(profilePath)) {
    return "";
  }
  return readFileSync(profilePath, "utf-8");
}
```

**Step 4: Write src/config/accounts.ts**

```typescript
import type { AccountEntry } from "../types/fabric.js";

export function resolveAccount(
  accounts: AccountEntry[],
  query: string
): AccountEntry | undefined {
  const q = query.toLowerCase().trim();

  // Exact match (case-insensitive)
  const exact = accounts.find((a) => a.name.toLowerCase() === q);
  if (exact) return exact;

  // Partial match (starts with or contains)
  const partial = accounts.find(
    (a) =>
      a.name.toLowerCase().startsWith(q) ||
      a.name.toLowerCase().includes(q)
  );
  return partial;
}
```

**Step 5: Write src/config/index.ts**

```typescript
export { loadConfig, loadAccounts, loadVoiceProfile } from "./loader.js";
export { resolveAccount } from "./accounts.js";
```

**Step 6: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/config/loader.test.ts`
Expected: ALL PASS

**Step 7: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: config loader (config.yaml, accounts.yaml, voice profile)"
```

---

### Task 4: Ingest Layer

**Files:**
- Create: `src/ingest/fireflies.ts`
- Create: `src/ingest/slack.ts`
- Create: `src/ingest/calendar.ts`
- Create: `src/ingest/gmail.ts`
- Create: `src/ingest/granola.ts`
- Create: `src/ingest/index.ts`
- Test: `tests/ingest/ingest.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/ingest/ingest.test.ts
import { describe, it, expect } from "vitest";
import { buildIngestData, mergeTranscriptText } from "../../src/ingest/index.js";
import type { FirefliesTranscript, SlackMessage, CalendarEvent } from "../../src/types/ingest.js";

describe("buildIngestData", () => {
  it("assembles ingest data from partial sources", () => {
    const transcripts: FirefliesTranscript[] = [
      {
        id: "t1",
        title: "Call with FINRA",
        dateString: "2026-03-09",
        summary: { short_summary: "Discussed POC timeline" },
      },
    ];
    const messages: SlackMessage[] = [
      { text: "FINRA update: POC approved", ts: "1741500000.000000" },
    ];

    const result = buildIngestData("FINRA", {
      fireflies: { transcripts },
      slack: { messages },
    });

    expect(result.account).toBe("FINRA");
    expect(result.fireflies?.transcripts).toHaveLength(1);
    expect(result.slack?.messages).toHaveLength(1);
    expect(result.calendar).toBeUndefined();
  });

  it("handles empty sources gracefully", () => {
    const result = buildIngestData("FINRA", {});
    expect(result.account).toBe("FINRA");
    expect(result.fireflies).toBeUndefined();
  });
});

describe("mergeTranscriptText", () => {
  it("combines transcript summaries and action items", () => {
    const transcripts: FirefliesTranscript[] = [
      {
        id: "t1",
        title: "FINRA Kickoff",
        dateString: "2026-03-07",
        summary: {
          short_summary: "Discussed POC scope",
          action_items: "**Jeff**\nSend pricing\n**Duane**\nGet team aligned",
        },
      },
      {
        id: "t2",
        title: "FINRA Follow-up",
        dateString: "2026-03-09",
        transcript: "Full transcript text here",
      },
    ];
    const text = mergeTranscriptText(transcripts);
    expect(text).toContain("FINRA Kickoff");
    expect(text).toContain("Discussed POC scope");
    expect(text).toContain("Send pricing");
    expect(text).toContain("Full transcript text here");
  });

  it("returns empty string for no transcripts", () => {
    expect(mergeTranscriptText([])).toBe("");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/ingest/ingest.test.ts`
Expected: FAIL

**Step 3: Write src/ingest/fireflies.ts**

```typescript
import type { FirefliesTranscript } from "../types/ingest.js";

/**
 * Merge multiple transcript objects into a single text block
 * suitable for reasoning (commitment extraction, takeaway distillation).
 */
export function mergeTranscriptText(transcripts: FirefliesTranscript[]): string {
  if (transcripts.length === 0) return "";

  return transcripts
    .map((t) => {
      const parts: string[] = [`## ${t.title} (${t.dateString})`];

      if (t.summary?.short_summary) {
        parts.push(`Summary: ${t.summary.short_summary}`);
      }
      if (t.summary?.action_items) {
        parts.push(`Action Items:\n${t.summary.action_items}`);
      }
      if (t.summary?.keywords?.length) {
        parts.push(`Keywords: ${t.summary.keywords.join(", ")}`);
      }
      if (t.transcript) {
        parts.push(`Transcript:\n${t.transcript}`);
      }

      return parts.join("\n\n");
    })
    .join("\n\n---\n\n");
}
```

**Step 4: Write src/ingest/slack.ts**

```typescript
import type { SlackMessage } from "../types/ingest.js";

export function mergeSlackText(messages: SlackMessage[]): string {
  if (messages.length === 0) return "";

  return messages
    .map((m) => {
      const who = m.user_name ?? m.username ?? m.user ?? "unknown";
      const channel = m.channel?.name ?? "dm";
      return `[${channel}] ${who}: ${m.text}`;
    })
    .join("\n");
}
```

**Step 5: Write src/ingest/calendar.ts**

```typescript
import type { CalendarEvent } from "../types/ingest.js";

export function mergeCalendarText(events: CalendarEvent[]): string {
  if (events.length === 0) return "";

  return events
    .map((e) => {
      const attendees = e.attendees?.join(", ") ?? "no attendees listed";
      return `${e.title} (${e.start}) — Attendees: ${attendees}`;
    })
    .join("\n");
}
```

**Step 6: Write src/ingest/gmail.ts**

```typescript
import type { GmailThread } from "../types/ingest.js";

export function mergeGmailText(threads: GmailThread[]): string {
  if (threads.length === 0) return "";

  return threads
    .map((t) => {
      const body = t.body ?? t.snippet ?? "";
      return `Subject: ${t.subject}\nFrom: ${t.from} (${t.date})\n${body}`;
    })
    .join("\n\n---\n\n");
}
```

**Step 7: Write src/ingest/granola.ts**

```typescript
import type { GranolaMeeting } from "../types/ingest.js";

export function mergeGranolaText(meetings: GranolaMeeting[]): string {
  if (meetings.length === 0) return "";

  return meetings
    .map((m) => {
      const parts: string[] = [`## ${m.title} (${m.date})`];
      if (m.notes) parts.push(m.notes);
      if (m.transcript) parts.push(`Transcript:\n${m.transcript}`);
      return parts.join("\n\n");
    })
    .join("\n\n---\n\n");
}
```

**Step 8: Write src/ingest/index.ts**

```typescript
import type { IngestData } from "../types/ingest.js";
import type { FirefliesTranscript, SlackMessage, CalendarEvent, GmailThread, GranolaMeeting } from "../types/ingest.js";
import { IngestDataSchema } from "../types/ingest.js";

export { mergeTranscriptText } from "./fireflies.js";
export { mergeSlackText } from "./slack.js";
export { mergeCalendarText } from "./calendar.js";
export { mergeGmailText } from "./gmail.js";
export { mergeGranolaText } from "./granola.js";

interface PartialSources {
  fireflies?: { transcripts: FirefliesTranscript[] };
  slack?: { messages: SlackMessage[] };
  calendar?: { events: CalendarEvent[] };
  gmail?: { threads: GmailThread[] };
  granola?: { meetings: GranolaMeeting[] };
}

export function buildIngestData(
  account: string,
  sources: PartialSources
): IngestData {
  const data: Record<string, unknown> = {
    account,
    fetchedAt: new Date().toISOString(),
  };

  if (sources.fireflies?.transcripts.length) {
    data.fireflies = sources.fireflies;
  }
  if (sources.slack?.messages.length) {
    data.slack = sources.slack;
  }
  if (sources.calendar?.events.length) {
    data.calendar = sources.calendar;
  }
  if (sources.gmail?.threads.length) {
    data.gmail = sources.gmail;
  }
  if (sources.granola?.meetings.length) {
    data.granola = sources.granola;
  }

  return IngestDataSchema.parse(data);
}
```

**Step 9: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/ingest/ingest.test.ts`
Expected: ALL PASS

**Step 10: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: ingest layer — data fetchers and text mergers for all MCP sources"
```

---

### Task 5: Reasoning Layer — Commitment Extraction

**Files:**
- Create: `src/reason/commitments.ts`
- Create: `src/reason/prompt-templates.ts`
- Test: `tests/reason/commitments.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/reason/commitments.test.ts
import { describe, it, expect } from "vitest";
import { buildCommitmentExtractionPrompt, parseCommitmentsFromResponse } from "../../src/reason/commitments.js";

describe("buildCommitmentExtractionPrompt", () => {
  it("includes the transcript text and extraction rules", () => {
    const prompt = buildCommitmentExtractionPrompt("Jeff called Duane. Jeff said he'd send pricing by Wednesday.");
    expect(prompt).toContain("Jeff called Duane");
    expect(prompt).toContain("WHO");
    expect(prompt).toContain("TO WHOM");
    expect(prompt).toContain("WHAT");
    expect(prompt).toContain("BY WHEN");
    expect(prompt).toContain("CONFIDENCE");
  });
});

describe("parseCommitmentsFromResponse", () => {
  it("parses JSON array of commitments from Claude response", () => {
    const response = `Here are the commitments I extracted:

\`\`\`json
[
  {
    "who": "Jeff Settle",
    "toWhom": "Duane Whitt",
    "what": "Send pricing proposal",
    "byWhen": "2026-03-12",
    "confidence": "explicit",
    "rawQuote": "I'll get you pricing by Wednesday"
  }
]
\`\`\``;

    const commitments = parseCommitmentsFromResponse(response, "fireflies");
    expect(commitments).toHaveLength(1);
    expect(commitments[0].who).toBe("Jeff Settle");
    expect(commitments[0].source).toBe("fireflies");
  });

  it("returns empty array on malformed response", () => {
    expect(parseCommitmentsFromResponse("no json here", "fireflies")).toEqual([]);
  });

  it("handles response with bare JSON (no code fence)", () => {
    const response = `[{"who":"Ryan","toWhom":"FINRA","what":"Follow up","confidence":"implied"}]`;
    const commitments = parseCommitmentsFromResponse(response, "slack");
    expect(commitments).toHaveLength(1);
    expect(commitments[0].source).toBe("slack");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/reason/commitments.test.ts`
Expected: FAIL

**Step 3: Write src/reason/prompt-templates.ts**

```typescript
export const COMMITMENT_EXTRACTION_TEMPLATE = `You are an expert at extracting commitments from meeting transcripts and business communications.

A commitment is when someone promises, agrees, or implies they will take a specific action.

## Extraction Rules

For each commitment, extract:
- **WHO**: Person making the commitment
- **TO WHOM**: Person or team receiving the commitment
- **WHAT**: The specific action promised
- **BY WHEN**: Deadline (ISO date if mentioned, null if not)
- **CONFIDENCE**: "explicit" (clear promise), "implied" (likely intent), or "inferred" (contextual guess)
- **RAW QUOTE**: The exact words that indicate the commitment (if available)

## What Counts as a Commitment
YES: "I'll send that over", "Let me follow up", "We'll get you pricing", "I owe you X"
NO: Questions, opinions, past actions already completed, hypotheticals

## Edge Cases
- "Let me check on that" → commitment (implied)
- "I'll circle back" → commitment (implied)
- "We should do X" → NOT a commitment unless followed by ownership
- Delegation: "I'll have [person] do X" → commitment by speaker, not delegatee

## Output Format

Return a JSON array of commitments. No other text outside the JSON.

\`\`\`json
[
  {
    "who": "Name",
    "toWhom": "Name or Team",
    "what": "Specific action",
    "byWhen": "YYYY-MM-DD or null",
    "confidence": "explicit|implied|inferred",
    "rawQuote": "exact words or null"
  }
]
\`\`\`

If there are no commitments, return an empty array: \`[]\`

## Source Material

{SOURCE_TEXT}`;

export const TAKEAWAY_EXTRACTION_TEMPLATE = `You are an expert at distilling key takeaways from meeting transcripts and business communications.

Extract the most important takeaways — decisions made, risks identified, blockers surfaced, opportunities discovered, and key insights.

## For Each Takeaway

- **TYPE**: "decision", "risk", "blocker", "opportunity", or "insight"
- **SUMMARY**: One sentence description
- **DETAILS**: Additional context (optional, keep brief)

## Output Format

Return a JSON array. No other text outside the JSON.

\`\`\`json
[
  {
    "type": "decision|risk|blocker|opportunity|insight",
    "summary": "One sentence",
    "details": "Optional context"
  }
]
\`\`\`

If there are no meaningful takeaways, return an empty array: \`[]\`

## Source Material

{SOURCE_TEXT}`;

export const EMAIL_DRAFT_TEMPLATE = `You are drafting a follow-up email after a meeting.

## Voice Profile

{VOICE_PROFILE}

## Meeting Context

Account: {ACCOUNT}
{MEETING_CONTEXT}

## Commitments Made

{COMMITMENTS}

## Takeaways

{TAKEAWAYS}

## Instructions

Write a follow-up email that:
1. Thanks them for the meeting (briefly, don't overdo it)
2. Recaps key decisions and next steps
3. Lists action items with owners
4. Proposes timeline for follow-up

Write in the voice described above. Match the tone, lexicon, and sentence structure exactly.

Return ONLY the email body (no subject line, no metadata). The email should be ready to send.`;

export const SALES_THREAD_TEMPLATE = `You are writing a brief status update for an internal sales team Slack channel.

## Account: {ACCOUNT}

## Meeting Context
{MEETING_CONTEXT}

## Commitments
{COMMITMENTS}

## Takeaways
{TAKEAWAYS}

## Instructions

Write a concise Slack message (3-5 bullets max) covering:
- What happened in the meeting
- Key decisions or movement
- Next steps and who owns them
- Any risks or blockers

Use Slack mrkdwn formatting. Be direct — this is for the internal team.`;

export const CUSTOMER_SUMMARY_TEMPLATE = `You are writing a meeting summary to post in a shared Slack channel with the customer.

## Voice Profile

{VOICE_PROFILE}

## Account: {ACCOUNT}

## Meeting Context
{MEETING_CONTEXT}

## Commitments
{COMMITMENTS}

## Takeaways
{TAKEAWAYS}

## Instructions

Write a professional, concise meeting summary that:
1. Recaps what was discussed
2. Lists agreed-upon next steps with owners
3. Notes any open questions

This is CUSTOMER-FACING. Do not include internal strategy, pricing discussions, or competitive intel.
Use the voice profile for tone. Use Slack mrkdwn formatting.`;
```

**Step 4: Write src/reason/commitments.ts**

```typescript
import { COMMITMENT_EXTRACTION_TEMPLATE } from "./prompt-templates.js";
import type { Commitment } from "../types/fabric.js";
import { CommitmentSchema } from "../types/fabric.js";

export function buildCommitmentExtractionPrompt(sourceText: string): string {
  return COMMITMENT_EXTRACTION_TEMPLATE.replace("{SOURCE_TEXT}", sourceText);
}

export function parseCommitmentsFromResponse(
  response: string,
  source: string
): Commitment[] {
  try {
    // Try to extract JSON from code fence
    const fenceMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    const jsonStr = fenceMatch ? fenceMatch[1].trim() : response.trim();

    // Try to find a JSON array
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!arrayMatch) return [];

    const parsed = JSON.parse(arrayMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item: unknown) => {
        try {
          const commitment = CommitmentSchema.parse({ ...item as Record<string, unknown>, source });
          return commitment;
        } catch {
          return null;
        }
      })
      .filter((c): c is Commitment => c !== null);
  } catch {
    return [];
  }
}
```

**Step 5: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/reason/commitments.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: commitment extraction — prompt templates and response parser"
```

---

### Task 6: Reasoning Layer — Takeaways & Follow-up Generation

**Files:**
- Create: `src/reason/takeaways.ts`
- Create: `src/reason/followup.ts`
- Create: `src/reason/index.ts`
- Test: `tests/reason/takeaways.test.ts`
- Test: `tests/reason/followup.test.ts`

**Step 1: Write the failing tests**

```typescript
// tests/reason/takeaways.test.ts
import { describe, it, expect } from "vitest";
import { buildTakeawayPrompt, parseTakeawaysFromResponse } from "../../src/reason/takeaways.js";

describe("buildTakeawayPrompt", () => {
  it("includes source text in the prompt", () => {
    const prompt = buildTakeawayPrompt("FINRA agreed to proceed with POC");
    expect(prompt).toContain("FINRA agreed to proceed");
    expect(prompt).toContain("decision");
  });
});

describe("parseTakeawaysFromResponse", () => {
  it("parses takeaways from Claude response", () => {
    const response = `\`\`\`json
[
  {
    "type": "decision",
    "summary": "FINRA will proceed with POC",
    "details": "Timeline is 4 weeks starting March 15"
  },
  {
    "type": "risk",
    "summary": "Budget approval needed from FINRA CFO"
  }
]
\`\`\``;
    const takeaways = parseTakeawaysFromResponse(response, "FINRA");
    expect(takeaways).toHaveLength(2);
    expect(takeaways[0].type).toBe("decision");
    expect(takeaways[1].account).toBe("FINRA");
  });
});
```

```typescript
// tests/reason/followup.test.ts
import { describe, it, expect } from "vitest";
import { buildEmailDraftPrompt, buildSalesThreadPrompt, buildCustomerSummaryPrompt } from "../../src/reason/followup.js";

describe("buildEmailDraftPrompt", () => {
  it("injects voice profile and meeting context", () => {
    const prompt = buildEmailDraftPrompt({
      voiceProfile: "Direct and confident. Uses short sentences.",
      account: "FINRA",
      meetingContext: "Discussed POC timeline with Duane",
      commitments: "Jeff: send pricing by Wednesday",
      takeaways: "Decision: proceed with POC",
    });
    expect(prompt).toContain("Direct and confident");
    expect(prompt).toContain("FINRA");
    expect(prompt).toContain("send pricing by Wednesday");
  });
});

describe("buildSalesThreadPrompt", () => {
  it("builds internal update prompt", () => {
    const prompt = buildSalesThreadPrompt({
      account: "FINRA",
      meetingContext: "POC kickoff meeting",
      commitments: "Send pricing",
      takeaways: "Team aligned",
    });
    expect(prompt).toContain("FINRA");
    expect(prompt).toContain("internal");
  });
});

describe("buildCustomerSummaryPrompt", () => {
  it("builds customer-facing summary prompt", () => {
    const prompt = buildCustomerSummaryPrompt({
      voiceProfile: "Professional but warm",
      account: "FINRA",
      meetingContext: "POC kickoff",
      commitments: "Next steps listed",
      takeaways: "Agreed on timeline",
    });
    expect(prompt).toContain("CUSTOMER-FACING");
    expect(prompt).toContain("FINRA");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/reason/`
Expected: FAIL

**Step 3: Write src/reason/takeaways.ts**

```typescript
import { TAKEAWAY_EXTRACTION_TEMPLATE } from "./prompt-templates.js";
import type { Takeaway } from "../types/fabric.js";
import { TakeawaySchema } from "../types/fabric.js";

export function buildTakeawayPrompt(sourceText: string): string {
  return TAKEAWAY_EXTRACTION_TEMPLATE.replace("{SOURCE_TEXT}", sourceText);
}

export function parseTakeawaysFromResponse(
  response: string,
  account: string
): Takeaway[] {
  try {
    const fenceMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    const jsonStr = fenceMatch ? fenceMatch[1].trim() : response.trim();

    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!arrayMatch) return [];

    const parsed = JSON.parse(arrayMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item: unknown) => {
        try {
          return TakeawaySchema.parse({ ...item as Record<string, unknown>, account });
        } catch {
          return null;
        }
      })
      .filter((t): t is Takeaway => t !== null);
  } catch {
    return [];
  }
}
```

**Step 4: Write src/reason/followup.ts**

```typescript
import {
  EMAIL_DRAFT_TEMPLATE,
  SALES_THREAD_TEMPLATE,
  CUSTOMER_SUMMARY_TEMPLATE,
} from "./prompt-templates.js";

interface FollowupContext {
  voiceProfile?: string;
  account: string;
  meetingContext: string;
  commitments: string;
  takeaways: string;
}

export function buildEmailDraftPrompt(ctx: FollowupContext): string {
  return EMAIL_DRAFT_TEMPLATE
    .replace("{VOICE_PROFILE}", ctx.voiceProfile ?? "Professional and concise.")
    .replace("{ACCOUNT}", ctx.account)
    .replace("{MEETING_CONTEXT}", ctx.meetingContext)
    .replace("{COMMITMENTS}", ctx.commitments)
    .replace("{TAKEAWAYS}", ctx.takeaways);
}

export function buildSalesThreadPrompt(ctx: FollowupContext): string {
  return SALES_THREAD_TEMPLATE
    .replace("{ACCOUNT}", ctx.account)
    .replace("{MEETING_CONTEXT}", ctx.meetingContext)
    .replace("{COMMITMENTS}", ctx.commitments)
    .replace("{TAKEAWAYS}", ctx.takeaways);
}

export function buildCustomerSummaryPrompt(ctx: FollowupContext): string {
  return CUSTOMER_SUMMARY_TEMPLATE
    .replace("{VOICE_PROFILE}", ctx.voiceProfile ?? "Professional and concise.")
    .replace("{ACCOUNT}", ctx.account)
    .replace("{MEETING_CONTEXT}", ctx.meetingContext)
    .replace("{COMMITMENTS}", ctx.commitments)
    .replace("{TAKEAWAYS}", ctx.takeaways);
}
```

**Step 5: Write src/reason/index.ts**

```typescript
export { buildCommitmentExtractionPrompt, parseCommitmentsFromResponse } from "./commitments.js";
export { buildTakeawayPrompt, parseTakeawaysFromResponse } from "./takeaways.js";
export { buildEmailDraftPrompt, buildSalesThreadPrompt, buildCustomerSummaryPrompt } from "./followup.js";
```

**Step 6: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/reason/`
Expected: ALL PASS

**Step 7: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: reasoning layer — takeaway extraction and follow-up generation prompts"
```

---

### Task 7: Voice Profile Generator

**Files:**
- Create: `src/voice/analyze.ts`
- Create: `src/voice/generate-profile.ts`
- Create: `src/voice/apply.ts`
- Create: `src/voice/index.ts`
- Test: `tests/voice/voice.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/voice/voice.test.ts
import { describe, it, expect } from "vitest";
import { buildVoiceAnalysisPrompt, applyVoiceProfile } from "../../src/voice/index.js";

describe("buildVoiceAnalysisPrompt", () => {
  it("includes all transcripts in the prompt", () => {
    const transcripts = [
      "Hey man, so I'll fire that off to you by EOD. Sound good?",
      "Dude, that's bananas. Let me circle back on that tomorrow.",
    ];
    const prompt = buildVoiceAnalysisPrompt(transcripts);
    expect(prompt).toContain("fire that off");
    expect(prompt).toContain("bananas");
    expect(prompt).toContain("tone");
    expect(prompt).toContain("lexicon");
  });
});

describe("applyVoiceProfile", () => {
  it("prepends voice profile to a generation prompt", () => {
    const profile = "# Voice Profile\n\nDirect and confident.";
    const prompt = "Write a follow-up email for FINRA.";
    const result = applyVoiceProfile(profile, prompt);
    expect(result).toContain("Direct and confident");
    expect(result).toContain("Write a follow-up email");
  });

  it("returns prompt unchanged when no profile", () => {
    const prompt = "Write a follow-up email.";
    expect(applyVoiceProfile("", prompt)).toBe(prompt);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/voice/voice.test.ts`
Expected: FAIL

**Step 3: Write src/voice/analyze.ts**

```typescript
export const VOICE_ANALYSIS_PROMPT = `You are an expert communication analyst. Analyze the following transcripts from one person's meetings and calls. Extract their unique communication style.

## Analyze For

### Tone
- Overall personality in communication (formal, casual, direct, warm, etc.)
- How they handle difficult topics
- Energy level and enthusiasm markers

### Lexicon
- Signature phrases and expressions they use repeatedly
- Slang, colloquialisms, or industry jargon
- Filler words or verbal tics

### Email Patterns
- How they typically open emails (context-first, greeting-first, etc.)
- How they structure the body (bullets, paragraphs, mixed)
- How they close (sign-off style, call-to-action patterns)

### Sentence Structure
- Average sentence length
- Use of punctuation (em-dashes, ellipses, etc.)
- Question style (direct, rhetorical, hedged)

## Output Format

Return a markdown document formatted as a Voice Profile:

\`\`\`markdown
# Voice Profile: [Name]

## Tone
[2-3 sentences]

## Lexicon
- "[phrase]" ([meaning/usage])
- ...

## Email Patterns
- Opens with: [pattern]
- Body style: [pattern]
- Closes with: [pattern]
- Sign-off: [typical sign-off]

## Sentence Structure
- [Key observations]
\`\`\`

## Transcripts to Analyze

{TRANSCRIPTS}`;

export function buildVoiceAnalysisPrompt(transcripts: string[]): string {
  const numbered = transcripts
    .map((t, i) => `### Transcript ${i + 1}\n\n${t}`)
    .join("\n\n---\n\n");

  return VOICE_ANALYSIS_PROMPT.replace("{TRANSCRIPTS}", numbered);
}
```

**Step 4: Write src/voice/generate-profile.ts**

```typescript
/**
 * Parse the voice profile markdown from Claude's response.
 * Extracts the markdown block if wrapped in code fences, otherwise returns as-is.
 */
export function parseVoiceProfileFromResponse(response: string): string {
  const fenceMatch = response.match(/```markdown\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // If the response starts with "# Voice Profile", it's already clean
  if (response.trim().startsWith("# Voice Profile")) {
    return response.trim();
  }

  // Return everything after the first heading
  const headingMatch = response.match(/(# Voice Profile[\s\S]*)/);
  return headingMatch ? headingMatch[1].trim() : response.trim();
}
```

**Step 5: Write src/voice/apply.ts**

```typescript
export function applyVoiceProfile(profile: string, prompt: string): string {
  if (!profile.trim()) return prompt;
  return `## Voice Profile\n\n${profile}\n\n---\n\n${prompt}`;
}
```

**Step 6: Write src/voice/index.ts**

```typescript
export { buildVoiceAnalysisPrompt } from "./analyze.js";
export { parseVoiceProfileFromResponse } from "./generate-profile.js";
export { applyVoiceProfile } from "./apply.js";
```

**Step 7: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/voice/voice.test.ts`
Expected: ALL PASS

**Step 8: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: voice profile — analysis, generation, and application"
```

---

### Task 8: Act Layer — Output Writers

**Files:**
- Create: `src/act/gmail-draft.ts`
- Create: `src/act/linear-tasks.ts`
- Create: `src/act/sales-threads.ts`
- Create: `src/act/slack-summary.ts`
- Create: `src/act/index.ts`
- Test: `tests/act/act.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/act/act.test.ts
import { describe, it, expect } from "vitest";
import {
  formatEmailDraftForMCP,
  formatLinearTasksForMCP,
  formatSalesThreadForMCP,
  formatCustomerSummaryForMCP,
} from "../../src/act/index.js";

describe("formatEmailDraftForMCP", () => {
  it("formats email draft with recipients and subject", () => {
    const result = formatEmailDraftForMCP({
      to: ["duane.whitt@finra.org"],
      subject: "Following up: FINRA POC Kickoff",
      body: "Hi Duane,\n\nGreat call today...",
      account: "FINRA",
    });
    expect(result.to).toContain("duane.whitt@finra.org");
    expect(result.subject).toContain("FINRA");
    expect(result.body).toContain("Great call");
  });
});

describe("formatLinearTasksForMCP", () => {
  it("formats commitments as Linear task payloads", () => {
    const tasks = formatLinearTasksForMCP({
      commitments: [
        {
          who: "Jeff",
          toWhom: "Duane",
          what: "Send pricing proposal",
          confidence: "explicit" as const,
          source: "fireflies",
        },
      ],
      account: "FINRA",
      project: "RunLayer GTM",
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toContain("Send pricing proposal");
    expect(tasks[0].description).toContain("FINRA");
  });

  it("skips commitments not owned by our team", () => {
    const tasks = formatLinearTasksForMCP({
      commitments: [
        {
          who: "Duane Whitt",
          toWhom: "Jeff",
          what: "Get team aligned",
          confidence: "explicit" as const,
          source: "fireflies",
        },
      ],
      account: "FINRA",
      project: "RunLayer GTM",
      teamMembers: ["Jeff", "Ryan", "Andrew", "Kyle"],
    });
    // External person's commitment → not a task for us
    expect(tasks).toHaveLength(0);
  });
});

describe("formatSalesThreadForMCP", () => {
  it("formats Slack message for sales threads", () => {
    const result = formatSalesThreadForMCP({
      channel: "sales-threads",
      text: "*FINRA*: POC approved, sending pricing Wednesday",
    });
    expect(result.channel).toBe("sales-threads");
    expect(result.text).toContain("FINRA");
  });
});

describe("formatCustomerSummaryForMCP", () => {
  it("formats customer-facing Slack message", () => {
    const result = formatCustomerSummaryForMCP({
      channel: "ext-finra-runlayer",
      text: "Thanks for the great conversation today...",
    });
    expect(result.channel).toBe("ext-finra-runlayer");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/act/act.test.ts`
Expected: FAIL

**Step 3: Write src/act/gmail-draft.ts**

```typescript
export interface EmailDraftInput {
  to: string[];
  subject: string;
  body: string;
  account: string;
  cc?: string[];
}

export interface EmailDraftPayload {
  to: string[];
  cc: string[];
  subject: string;
  body: string;
}

export function formatEmailDraftForMCP(input: EmailDraftInput): EmailDraftPayload {
  return {
    to: input.to,
    cc: input.cc ?? [],
    subject: input.subject,
    body: input.body,
  };
}
```

**Step 4: Write src/act/linear-tasks.ts**

```typescript
import type { Commitment } from "../types/fabric.js";

export interface LinearTaskInput {
  commitments: Commitment[];
  account: string;
  project?: string;
  teamMembers?: string[];
}

export interface LinearTaskPayload {
  title: string;
  description: string;
  project: string;
  labels: string[];
}

export function formatLinearTasksForMCP(input: LinearTaskInput): LinearTaskPayload[] {
  const team = (input.teamMembers ?? []).map((m) => m.toLowerCase());

  return input.commitments
    .filter((c) => {
      // Only create tasks for commitments owned by our team
      if (team.length === 0) return true;
      return team.some(
        (member) =>
          c.who.toLowerCase().includes(member)
      );
    })
    .map((c) => ({
      title: `[${input.account}] ${c.what}`,
      description: [
        `**Account:** ${input.account}`,
        `**Owner:** ${c.who}`,
        `**For:** ${c.toWhom}`,
        c.byWhen ? `**Due:** ${c.byWhen}` : null,
        c.rawQuote ? `**Quote:** "${c.rawQuote}"` : null,
        `**Confidence:** ${c.confidence}`,
        `**Source:** ${c.source}`,
      ]
        .filter(Boolean)
        .join("\n"),
      project: input.project ?? "default",
      labels: [input.account.toLowerCase(), "agentfabric"],
    }));
}
```

**Step 5: Write src/act/sales-threads.ts**

```typescript
export interface SlackMessageInput {
  channel: string;
  text: string;
}

export interface SlackMessagePayload {
  channel: string;
  text: string;
}

export function formatSalesThreadForMCP(input: SlackMessageInput): SlackMessagePayload {
  return { channel: input.channel, text: input.text };
}
```

**Step 6: Write src/act/slack-summary.ts**

```typescript
import type { SlackMessageInput, SlackMessagePayload } from "./sales-threads.js";

export function formatCustomerSummaryForMCP(input: SlackMessageInput): SlackMessagePayload {
  return { channel: input.channel, text: input.text };
}
```

**Step 7: Write src/act/index.ts**

```typescript
export { formatEmailDraftForMCP } from "./gmail-draft.js";
export type { EmailDraftInput, EmailDraftPayload } from "./gmail-draft.js";
export { formatLinearTasksForMCP } from "./linear-tasks.js";
export type { LinearTaskInput, LinearTaskPayload } from "./linear-tasks.js";
export { formatSalesThreadForMCP } from "./sales-threads.js";
export { formatCustomerSummaryForMCP } from "./slack-summary.js";
export type { SlackMessageInput, SlackMessagePayload } from "./sales-threads.js";
```

**Step 8: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/act/act.test.ts`
Expected: ALL PASS

**Step 9: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: act layer — Gmail draft, Linear task, sales thread, and Slack summary formatters"
```

---

### Task 9: Run Logger (Interop Layer)

**Files:**
- Create: `src/runs/logger.ts`
- Create: `src/runs/index.ts`
- Test: `tests/runs/logger.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/runs/logger.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { logRun, readRuns } from "../../src/runs/index.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { FabricOutput } from "../../src/types/fabric.js";

describe("run logger", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "agentfabric-runs-"));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("logs a run and reads it back", () => {
    const output: FabricOutput = {
      runId: "run-001",
      userId: "jeff",
      meetingId: "m1",
      account: "FINRA",
      timestamp: "2026-03-09T15:00:00Z",
      sources: ["fireflies"],
      commitments: [],
      takeaways: [],
      actions: {},
    };

    logRun(output, testDir);
    const runs = readRuns("2026-03-09", testDir);
    expect(runs).toHaveLength(1);
    expect(runs[0].account).toBe("FINRA");
  });

  it("appends multiple runs to same day", () => {
    const base: FabricOutput = {
      runId: "run-001",
      userId: "jeff",
      meetingId: "m1",
      account: "FINRA",
      timestamp: "2026-03-09T15:00:00Z",
      sources: [],
      commitments: [],
      takeaways: [],
      actions: {},
    };

    logRun(base, testDir);
    logRun({ ...base, runId: "run-002", account: "Goldman Sachs" }, testDir);

    const runs = readRuns("2026-03-09", testDir);
    expect(runs).toHaveLength(2);
  });

  it("returns empty array for no runs on date", () => {
    expect(readRuns("2026-01-01", testDir)).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/runs/logger.test.ts`
Expected: FAIL

**Step 3: Write src/runs/logger.ts**

```typescript
import { appendFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { FabricOutput } from "../types/fabric.js";
import { FabricOutputSchema } from "../types/fabric.js";

const DEFAULT_RUNS_DIR = join(
  process.env.HOME ?? process.env.USERPROFILE ?? "~",
  ".agentfabric",
  "runs"
);

export function logRun(
  output: FabricOutput,
  runsDir: string = DEFAULT_RUNS_DIR
): void {
  if (!existsSync(runsDir)) {
    mkdirSync(runsDir, { recursive: true });
  }

  const date = output.timestamp.slice(0, 10); // YYYY-MM-DD
  const filePath = join(runsDir, `${date}.jsonl`);
  appendFileSync(filePath, JSON.stringify(output) + "\n");
}

export function readRuns(
  date: string,
  runsDir: string = DEFAULT_RUNS_DIR
): FabricOutput[] {
  const filePath = join(runsDir, `${date}.jsonl`);
  if (!existsSync(filePath)) return [];

  const lines = readFileSync(filePath, "utf-8")
    .split("\n")
    .filter((line) => line.trim());

  return lines
    .map((line) => {
      try {
        return FabricOutputSchema.parse(JSON.parse(line));
      } catch {
        return null;
      }
    })
    .filter((r): r is FabricOutput => r !== null);
}
```

**Step 4: Write src/runs/index.ts**

```typescript
export { logRun, readRuns } from "./logger.js";
```

**Step 5: Run tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run tests/runs/logger.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: run logger — JSONL persistence for interop with downstream systems"
```

---

### Task 10: Update Entry Point & Wire Exports

**Files:**
- Modify: `src/index.ts`

**Step 1: Update src/index.ts**

```typescript
// Types
export type {
  FabricOutput,
  FabricConfig,
  Commitment,
  Takeaway,
  AccountEntry,
  Actions,
  EmailDraftResult,
  LinearTaskResult,
  SlackMessageResult,
} from "./types/fabric.js";
export type { IngestData } from "./types/ingest.js";

// Config
export { loadConfig, loadAccounts, loadVoiceProfile } from "./config/index.js";
export { resolveAccount } from "./config/index.js";

// Ingest
export {
  buildIngestData,
  mergeTranscriptText,
  mergeSlackText,
  mergeCalendarText,
  mergeGmailText,
  mergeGranolaText,
} from "./ingest/index.js";

// Reason
export {
  buildCommitmentExtractionPrompt,
  parseCommitmentsFromResponse,
  buildTakeawayPrompt,
  parseTakeawaysFromResponse,
  buildEmailDraftPrompt,
  buildSalesThreadPrompt,
  buildCustomerSummaryPrompt,
} from "./reason/index.js";

// Voice
export {
  buildVoiceAnalysisPrompt,
  parseVoiceProfileFromResponse,
  applyVoiceProfile,
} from "./voice/index.js";

// Act
export {
  formatEmailDraftForMCP,
  formatLinearTasksForMCP,
  formatSalesThreadForMCP,
  formatCustomerSummaryForMCP,
} from "./act/index.js";

// Runs
export { logRun, readRuns } from "./runs/index.js";
```

**Step 2: Typecheck**

Run: `cd ~/Desktop/Projects/agentfabric && npx tsc --noEmit`
Expected: No errors

**Step 3: Run all tests**

Run: `cd ~/Desktop/Projects/agentfabric && npx vitest run`
Expected: ALL PASS

**Step 4: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: wire all module exports through entry point"
```

---

### Task 11: Claude Code Skills — process-meeting

**Files:**
- Create: `skills/process-meeting/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: process-meeting
description: Process a meeting for a specific account — extract commitments, draft email, create tasks, post updates
---

# Process Meeting

Run the full AgentFabric pipeline for a specific account after a meeting.

## Trigger

- "Process meeting for [account]"
- "/process-meeting [account]"
- "Run the process for [account]"
- "Post-meeting [account]"

## Protocol

### Step 1: Resolve Account

Load the user's config and find the matching account:

```bash
cd ~/Desktop/Projects/agentfabric
```

Read `~/.agentfabric/config.yaml` and `~/.agentfabric/accounts.yaml`.
Match the user's query against account names (case-insensitive, partial match OK).

If no match: ask the user to clarify or add the account via `/onboard`.

### Step 2: Fetch Data via MCP (in parallel)

Launch parallel data fetches for the resolved account. Use whatever MCP tools are available — graceful degradation if any source fails.

**Fireflies — recent transcripts:**
```
mcp__claude_ai_RL_FireFlies__fireflies_search
  query: "[ACCOUNT NAME]"
```
Then for the top 3 results:
```
mcp__claude_ai_RL_FireFlies__fireflies_get_transcript
  transcriptId: "[ID]"
```

**Slack — shared channel + search:**
```
mcp__claude_ai_RL_Slack__get_channel_history
  channel: "[SLACK_CHANNEL from accounts.yaml]"
  limit: 30
```
```
mcp__claude_ai_RL_Slack__search
  query: "[ACCOUNT NAME] after:[7 days ago YYYY-MM-DD]"
```

**Calendar — recent meetings:**
```
mcp__claude_ai_Google_Calendar__gcal_list_events
  query: "[ACCOUNT NAME]"
```

**Gmail — recent threads (optional):**
```
mcp__claude_ai_RL_GMail__search
  query: "[ACCOUNT DOMAIN] newer_than:7d"
```

**Granola — meeting notes (optional):**
```
mcp__claude_ai_RL_GRANOLA__query_granola_meetings
  query: "[ACCOUNT NAME]"
```

### Step 3: Extract Commitments

Using the aggregated data, extract commitments:

Prompt Claude with ALL the fetched data and ask it to extract commitments using this format:

For each commitment: WHO committed TO WHOM about WHAT BY WHEN, with CONFIDENCE level and RAW QUOTE.

Output as JSON array of commitments.

### Step 4: Extract Takeaways

Prompt Claude with the same data to extract key takeaways:
- Decisions made
- Risks identified
- Blockers surfaced
- Opportunities discovered
- Key insights

Output as JSON array of takeaways.

### Step 5: Generate Outputs (in parallel)

Using the commitments, takeaways, and the user's voice profile (`~/.agentfabric/voice-profile.md`):

**5a. Email Follow-Up Draft**

Prompt Claude to write a follow-up email in the user's voice. Then create the draft:
```
mcp__claude_ai_RL_GMail__create_draft
  to: [contact emails from accounts.yaml]
  subject: "Following up: [Meeting Topic]"
  body: [generated email]
```

**5b. Linear Tasks**

For each commitment owned by our team, create a Linear task.
Format: `[ACCOUNT] Action item description`
Tag with account name.

**5c. Sales Thread Update**

Generate a 3-5 bullet internal update and post:
```
mcp__claude_ai_RL_Slack__send_message
  channel: "[salesThreadsChannel from config.yaml]"
  text: [generated update with account name bolded]
```

**5d. Customer Meeting Summary**

Generate a customer-facing summary and post to shared channel:
```
mcp__claude_ai_RL_Slack__send_message
  channel: "[slackChannel from accounts.yaml]"
  text: [generated summary — NO internal strategy, pricing, or competitive intel]
```

### Step 6: Log Run

Write the FabricOutput envelope to `~/.agentfabric/runs/YYYY-MM-DD.jsonl`.

### Step 7: Report to User

Summarize what was done:
- ✓ Email draft created (subject, recipients)
- ✓ N Linear tasks created
- ✓ Sales thread updated in #sales-threads
- ✓ Meeting summary posted to #ext-[account]-runlayer
- Commitments extracted: N
- Takeaways extracted: N

## Error Handling

- If Fireflies returns no results: Continue — note "No transcripts found"
- If Slack channel not found: Skip customer summary, warn user
- If Gmail draft fails: Show the email text so user can copy/paste
- If Linear unavailable: List tasks as text for manual entry
- Always complete the run log regardless of action failures
```

**Step 2: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: process-meeting skill — main post-meeting automation workflow"
```

---

### Task 12: Claude Code Skills — onboard

**Files:**
- Create: `skills/onboard/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: onboard
description: Set up AgentFabric for a new user — validate MCP connections, train voice profile, configure accounts
---

# Onboard

Set up a new AgentFabric user with voice profile, account list, and MCP validation.

## Trigger

- "/onboard"
- "Set up AgentFabric"
- "Configure AgentFabric"
- "I'm new, help me get started"

## Protocol

### Step 1: Create Config Directory

```bash
mkdir -p ~/.agentfabric/runs
```

### Step 2: Validate MCP Connections

Test each MCP tool to confirm access. Report status:

**Required:**
- [ ] Fireflies: `mcp__claude_ai_RL_FireFlies__fireflies_get_transcripts` (limit: 1)
- [ ] Slack: `mcp__claude_ai_RL_Slack__list_channels` (limit: 1)
- [ ] Gmail: `mcp__claude_ai_RL_GMail__list_messages` (limit: 1)
- [ ] Calendar: `mcp__claude_ai_Google_Calendar__gcal_list_events` (max_results: 1)

**Optional:**
- [ ] Granola: `mcp__claude_ai_RL_GRANOLA__list_meetings` (limit: 1)
- [ ] Linear: (check if available)

If any required tool fails, tell the user which MCP server needs to be connected and stop.

### Step 3: Voice Profile Training

Ask the user: "I need 10-15 of your call transcripts to learn your communication style. You can either:"
1. "Paste them here"
2. "Tell me to search Fireflies for your recent calls"

If option 2:
```
mcp__claude_ai_RL_FireFlies__fireflies_search
  query: "organizer:[USER_EMAIL]"
```
Fetch the top 15 transcripts.

Analyze the transcripts for:
- Tone and personality
- Signature phrases and lexicon
- Email patterns (opens, structure, closes, sign-off)
- Sentence structure and length

Generate `~/.agentfabric/voice-profile.md` and show it to the user for approval.

### Step 4: Account Configuration

Ask: "Which accounts are yours? I can pull from HubSpot or you can list them."

If HubSpot available:
```
mcp__hubspot__search_crm_objects
  objectType: "deals"
  filterGroups: [{"filters": [{"propertyName": "hubspot_owner_id", "operator": "EQ", "value": "[OWNER_ID]"}]}]
```

For each account, resolve:
- Account name
- Slack channel (pattern: `ext-{company}-runlayer`)
- Domain
- Key contacts

Write `~/.agentfabric/accounts.yaml`:
```yaml
accounts:
  - name: FINRA
    slackChannel: ext-finra-runlayer
    domain: finra.org
    contacts:
      - duane.whitt@finra.org
  - name: Goldman Sachs
    slackChannel: ext-gs-runlayer
    domain: gs.com
```

### Step 5: General Config

Ask the user:
- "What's your Linear team/project for tasks?" (or skip for now)
- "What channel do you post sales updates in?" (default: sales-threads)

Write `~/.agentfabric/config.yaml`:
```yaml
userId: jeff
voiceProfilePath: ./voice-profile.md
linearProject: RunLayer GTM
linearTeam: sales
salesThreadsChannel: sales-threads
defaultSources:
  - fireflies
  - slack
  - calendar
  - gmail
```

### Step 6: Test Run

Ask: "Want me to do a test run on one of your accounts? Which one?"

Run `/process-meeting [chosen account]` as a dry run.

### Step 7: Done

Report:
- ✓ MCP connections validated
- ✓ Voice profile generated
- ✓ N accounts configured
- ✓ Config saved to ~/.agentfabric/

"You're set up. After your next meeting, just say `/process-meeting [account]`."
```

**Step 2: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "feat: onboard skill — user setup with voice training and account configuration"
```

---

### Task 13: CLAUDE.md & README

**Files:**
- Create: `CLAUDE.md`
- Create: `README.md`

**Step 1: Write CLAUDE.md**

```markdown
# AgentFabric

## Project Overview
Claude Code-native post-meeting automation framework for GTM teams.
Ingests meeting data via MCP, extracts commitments/takeaways, drafts follow-up emails
in the user's trained voice, creates Linear tasks, and posts Slack updates.

## Tech Stack
- **Runtime:** Node.js 22+ with TypeScript (strict mode)
- **Validation:** Zod for all external data
- **Testing:** Vitest
- **Build:** tsc for production, tsx for dev

## Commands
```bash
npm run dev          # Development mode (watch)
npm run build        # Compile TypeScript
npm run test         # Run test suite
npm run test:watch   # Tests in watch mode
npm run typecheck    # Type check without emitting
npm run lint         # ESLint
npm run lint:fix     # ESLint autofix
```

## Project Structure
```
agentfabric/
├── src/
│   ├── ingest/          # MCP data fetchers + text mergers
│   ├── reason/          # Commitment extraction, takeaways, follow-up prompts
│   ├── act/             # Output formatters (Gmail, Linear, Slack)
│   ├── voice/           # Voice profile analysis + generation + application
│   ├── config/          # User config loader (config.yaml, accounts.yaml)
│   ├── runs/            # JSONL run logger for interop
│   ├── types/           # Zod schemas + TypeScript types
│   └── index.ts         # Public API exports
├── skills/
│   ├── process-meeting/ # Main post-meeting automation skill
│   └── onboard/         # User onboarding skill
├── tests/               # Vitest test suite
└── docs/plans/          # Design docs and implementation plans
```

## Architecture
Three-layer pipeline: Ingest → Reason → Act
- **Ingest**: Fetches data from MCP sources (Fireflies, Slack, Calendar, Gmail, Granola)
- **Reason**: Claude-powered extraction (commitments, takeaways, email drafts)
- **Act**: Formats and dispatches to output targets (Gmail, Linear, Slack)

## Code Conventions
- Strict TypeScript — no `any` types
- Zod for runtime validation of all external data
- Functional patterns — pure functions where possible
- Graceful degradation — continue if an MCP source fails
- All async functions must have error handling
- Prefer early returns over nested conditionals

## User Config
Lives in `~/.agentfabric/` (not in repo):
- `config.yaml` — user ID, MCP preferences, Linear project
- `accounts.yaml` — account registry with Slack channels, domains, contacts
- `voice-profile.md` — generated voice style guide
- `runs/` — JSONL output logs

## MCP Tools Used
- Fireflies: search, get_transcript, get_summary
- Slack: search, get_channel_history, send_message
- Gmail: search, create_draft
- Google Calendar: list_events
- Granola: query meetings (optional)
- HubSpot: search deals (onboarding only)
- Linear: create tasks (via skill, not direct MCP yet)

## Git Workflow
- Branch naming: `feat/description` or `fix/description`
- Conventional commits
- Run tests before committing
```

**Step 2: Write README.md**

```markdown
# AgentFabric

Post-meeting automation for GTM teams, powered by Claude Code.

After every customer meeting, one command processes your calls and:
- Drafts a follow-up email in your voice → Gmail drafts
- Creates action item tasks → Linear
- Posts a state update → your sales channel
- Drops a meeting summary → the shared customer Slack channel

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

That's it. The agent handles everything.

## What It Does

```
/process-meeting FINRA
  → Pulls latest Fireflies transcript
  → Grabs recent Slack from #ext-finra-runlayer
  → Checks Calendar for attendees
  → Extracts commitments and takeaways
  → Drafts follow-up email in your voice → Gmail
  → Creates Linear tasks per action item
  → Posts update to #sales-threads
  → Posts meeting summary to #ext-finra-runlayer
```

## Multi-User

Each person gets their own `~/.agentfabric/` config:
- **Voice profile** — trained from your transcripts, writes like you
- **Account list** — your deals, your channels
- **Run history** — JSONL log of every processed meeting

## Requirements

- Node.js 22+
- Claude Code with MCP connections to: Fireflies, Slack, Gmail, Google Calendar
- Optional: Granola, Linear, HubSpot

## License

MIT
```

**Step 3: Commit**

```bash
cd ~/Desktop/Projects/agentfabric && git add -A && git commit -m "docs: CLAUDE.md project guide and README"
```

---

### Task 14: Create GitHub Repo & Push

**Step 1: Create the repo on GitHub**

```bash
cd ~/Desktop/Projects/agentfabric && gh repo create galacticj1888/agentfabric --public --source=. --remote=origin --description "Post-meeting automation for GTM teams, powered by Claude Code"
```

**Step 2: Push**

```bash
cd ~/Desktop/Projects/agentfabric && git push -u origin main
```

**Step 3: Verify**

```bash
gh repo view galacticj1888/agentfabric --web
```

---
