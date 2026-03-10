import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { FabricConfigSchema } from "../types/fabric.js";
import { AccountsFileSchema } from "../types/config.js";
import type { FabricConfig, AccountEntry } from "../types/fabric.js";

const DEFAULT_DIR = join(
  process.env.HOME ?? process.env.USERPROFILE ?? "~",
  ".agentfabric"
);

export function loadConfig(configDir: string = DEFAULT_DIR): FabricConfig {
  const configPath = join(configDir, "config.yaml");
  if (!existsSync(configPath)) {
    throw new Error(`AgentFabric config not found at ${configPath}. Run /onboard to set up.`);
  }
  const raw = readFileSync(configPath, "utf-8");
  return FabricConfigSchema.parse(parseYaml(raw));
}

export function loadAccounts(configDir: string = DEFAULT_DIR): AccountEntry[] {
  const accountsPath = join(configDir, "accounts.yaml");
  if (!existsSync(accountsPath)) return [];
  const raw = readFileSync(accountsPath, "utf-8");
  return AccountsFileSchema.parse(parseYaml(raw)).accounts;
}

export function loadVoiceProfile(configDir: string = DEFAULT_DIR): string {
  const profilePath = join(configDir, "voice-profile.md");
  if (!existsSync(profilePath)) return "";
  return readFileSync(profilePath, "utf-8");
}
