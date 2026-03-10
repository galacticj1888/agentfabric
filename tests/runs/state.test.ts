import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readAccountState, writeAccountState } from "../../src/runs/state.js";
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
  commitments: [
    { who: "Jeff", toWhom: "Duane", what: "Send pricing proposal", confidence: "explicit" as const, source: "fireflies" },
  ],
  takeaways: [
    { type: "decision" as const, summary: "Moving to POC", account: "FINRA" },
  ],
  actions: {},
  ...overrides,
});

describe("account state", () => {
  let testDir: string;
  beforeEach(() => { testDir = mkdtempSync(join(tmpdir(), "agentfabric-state-")); });
  afterEach(() => { rmSync(testDir, { recursive: true, force: true }); });

  it("returns null for unknown account", () => {
    expect(readAccountState("FINRA", testDir)).toBeNull();
  });

  it("writes and reads account state", () => {
    writeAccountState(makeOutput(), testDir);
    const state = readAccountState("FINRA", testDir);
    expect(state).not.toBeNull();
    expect(state!.account).toBe("FINRA");
    expect(state!.lastRunId).toBe("run-001");
    expect(state!.unresolvedCommitments).toHaveLength(1);
    expect(state!.unresolvedCommitments[0].what).toBe("Send pricing proposal");
    expect(state!.runCount).toBe(1);
  });

  it("increments runCount on subsequent writes", () => {
    writeAccountState(makeOutput(), testDir);
    writeAccountState(makeOutput({ runId: "run-002", timestamp: "2026-03-10T10:00:00Z" }), testDir);
    const state = readAccountState("FINRA", testDir);
    expect(state!.runCount).toBe(2);
    expect(state!.lastRunId).toBe("run-002");
  });

  it("matches account name case-insensitively", () => {
    writeAccountState(makeOutput(), testDir);
    expect(readAccountState("finra", testDir)).not.toBeNull();
    expect(readAccountState("Finra", testDir)).not.toBeNull();
  });

  it("sanitizes account name for filename", () => {
    writeAccountState(makeOutput({ account: "Goldman Sachs" }), testDir);
    expect(readAccountState("Goldman Sachs", testDir)).not.toBeNull();
  });

  it("caps recentTakeaways at 10", () => {
    const manyTakeaways = Array.from({ length: 15 }, (_, i) => ({
      type: "insight" as const,
      summary: `Takeaway ${i}`,
      account: "FINRA",
    }));
    writeAccountState(makeOutput({ takeaways: manyTakeaways }), testDir);
    const state = readAccountState("FINRA", testDir);
    expect(state!.recentTakeaways).toHaveLength(10);
  });
});
