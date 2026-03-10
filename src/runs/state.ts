import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { CommitmentSchema, TakeawaySchema } from "../types/fabric.js";
import type { FabricOutput } from "../types/fabric.js";

export const AccountStateSchema = z.object({
  account: z.string(),
  lastRunId: z.string(),
  lastRunTimestamp: z.string(),
  lastMeetingId: z.string(),
  unresolvedCommitments: z.array(CommitmentSchema),
  recentTakeaways: z.array(TakeawaySchema),
  runCount: z.number(),
});
export type AccountState = z.infer<typeof AccountStateSchema>;

const DEFAULT_STATE_DIR = join(
  process.env.HOME ?? process.env.USERPROFILE ?? "~",
  ".agentfabric",
  "state",
  "accounts"
);

function accountFileName(account: string): string {
  return account.toLowerCase().replace(/[^a-z0-9]/g, "-") + ".json";
}

export function readAccountState(
  account: string,
  stateDir: string = DEFAULT_STATE_DIR,
): AccountState | null {
  const filePath = join(stateDir, accountFileName(account));
  if (!existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    return AccountStateSchema.parse(raw);
  } catch {
    return null;
  }
}

export function writeAccountState(
  output: FabricOutput,
  stateDir: string = DEFAULT_STATE_DIR,
): void {
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }

  const existing = readAccountState(output.account, stateDir);
  const state: AccountState = {
    account: output.account,
    lastRunId: output.runId,
    lastRunTimestamp: output.timestamp,
    lastMeetingId: output.meetingId,
    unresolvedCommitments: output.commitments,
    recentTakeaways: output.takeaways.slice(0, 10),
    runCount: (existing?.runCount ?? 0) + 1,
  };

  const filePath = join(stateDir, accountFileName(output.account));
  writeFileSync(filePath, JSON.stringify(state, null, 2) + "\n");
}
