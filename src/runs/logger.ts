import { appendFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { FabricOutput } from "../types/fabric.js";
import { FabricOutputSchema } from "../types/fabric.js";

const DEFAULT_RUNS_DIR = join(
  process.env.HOME ?? process.env.USERPROFILE ?? "~",
  ".agentfabric",
  "runs"
);

export function logRun(output: FabricOutput, runsDir: string = DEFAULT_RUNS_DIR): void {
  const validatedOutput = FabricOutputSchema.parse(output);

  if (!existsSync(runsDir)) {
    mkdirSync(runsDir, { recursive: true });
  }
  const date = validatedOutput.timestamp.slice(0, 10);
  const filePath = join(runsDir, `${date}.jsonl`);
  appendFileSync(filePath, JSON.stringify(validatedOutput) + "\n");
}

export function readRuns(date: string, runsDir: string = DEFAULT_RUNS_DIR): FabricOutput[] {
  const filePath = join(runsDir, `${date}.jsonl`);
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, "utf-8").split("\n").filter((l) => l.trim());
  return lines
    .map((line) => {
      try { return FabricOutputSchema.parse(JSON.parse(line)); }
      catch { return null; }
    })
    .filter((r): r is FabricOutput => r !== null);
}

export function readLastRunForAccount(
  account: string,
  runsDir: string = DEFAULT_RUNS_DIR,
): FabricOutput | null {
  if (!existsSync(runsDir)) return null;

  const files = readdirSync(runsDir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .reverse();

  const accountLower = account.toLowerCase();

  for (const file of files) {
    const runs = readRuns(file.replace(".jsonl", ""), runsDir);
    const matching = runs
      .filter((r) => r.account.toLowerCase() === accountLower)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (matching.length > 0) return matching[0];
  }

  return null;
}
