import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { logRun, readRuns, readLastRunForAccount } from "../../src/runs/index.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { FabricOutput } from "../../src/types/fabric.js";

const makeOutput = (overrides: Partial<FabricOutput> = {}): FabricOutput => ({
  runId: "run-001",
  userId: "jeff",
  meetingId: "m1",
  account: "FINRA",
  timestamp: "2026-03-09T15:00:00Z",
  sources: ["fireflies"],
  commitments: [],
  takeaways: [],
  actions: {},
  ...overrides,
});

describe("logRun + readRuns", () => {
  let testDir: string;
  beforeEach(() => { testDir = mkdtempSync(join(tmpdir(), "agentfabric-runs-")); });
  afterEach(() => { rmSync(testDir, { recursive: true, force: true }); });

  it("logs a run and reads it back", () => {
    logRun(makeOutput(), testDir);
    const runs = readRuns("2026-03-09", testDir);
    expect(runs).toHaveLength(1);
    expect(runs[0].account).toBe("FINRA");
  });

  it("appends multiple runs to same day", () => {
    logRun(makeOutput(), testDir);
    logRun(makeOutput({ runId: "run-002", account: "Goldman Sachs" }), testDir);
    const runs = readRuns("2026-03-09", testDir);
    expect(runs).toHaveLength(2);
  });

  it("returns empty array for no runs on date", () => {
    expect(readRuns("2026-01-01", testDir)).toEqual([]);
  });

  it("separates runs by date", () => {
    logRun(makeOutput({ timestamp: "2026-03-09T10:00:00Z" }), testDir);
    logRun(makeOutput({ runId: "run-002", timestamp: "2026-03-10T10:00:00Z" }), testDir);
    expect(readRuns("2026-03-09", testDir)).toHaveLength(1);
    expect(readRuns("2026-03-10", testDir)).toHaveLength(1);
  });
});

describe("readLastRunForAccount", () => {
  let testDir: string;
  beforeEach(() => { testDir = mkdtempSync(join(tmpdir(), "agentfabric-runs-")); });
  afterEach(() => { rmSync(testDir, { recursive: true, force: true }); });

  it("returns the most recent run for an account", () => {
    logRun(makeOutput({
      runId: "run-001",
      timestamp: "2026-03-07T10:00:00Z",
      commitments: [{ who: "Jeff", toWhom: "Duane", what: "Old task", confidence: "explicit", source: "fireflies" }],
    }), testDir);
    logRun(makeOutput({
      runId: "run-002",
      timestamp: "2026-03-09T10:00:00Z",
      commitments: [{ who: "Jeff", toWhom: "Duane", what: "New task", confidence: "explicit", source: "fireflies" }],
    }), testDir);

    const last = readLastRunForAccount("FINRA", testDir);
    expect(last).not.toBeNull();
    expect(last!.runId).toBe("run-002");
    expect(last!.commitments[0].what).toBe("New task");
  });

  it("returns null when no runs for account", () => {
    logRun(makeOutput({ account: "Goldman Sachs" }), testDir);
    expect(readLastRunForAccount("FINRA", testDir)).toBeNull();
  });

  it("matches account name case-insensitively", () => {
    logRun(makeOutput({ account: "FINRA" }), testDir);
    expect(readLastRunForAccount("finra", testDir)).not.toBeNull();
  });
});
