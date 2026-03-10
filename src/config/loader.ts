import { readFileSync, existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { FabricConfigSchema } from "../types/fabric.js";
import { AccountsFileSchema } from "../types/config.js";
import type { FabricConfig, AccountEntry } from "../types/fabric.js";

const DEFAULT_DIR = join(
  process.env.HOME ?? process.env.USERPROFILE ?? "~",
  ".agentfabric"
);

function expandHomeDir(filePath: string): string {
  if (!filePath.startsWith("~")) return filePath;
  const homeDir = process.env.HOME ?? process.env.USERPROFILE;
  if (!homeDir) return filePath;
  return filePath === "~"
    ? homeDir
    : join(homeDir, filePath.slice(2));
}

function resolveConfigPath(configDir: string, filePath: string): string {
  const expanded = expandHomeDir(filePath);
  return isAbsolute(expanded) ? expanded : resolve(configDir, expanded);
}

export function loadConfig(configDir: string = DEFAULT_DIR): FabricConfig {
  const configPath = join(configDir, "config.yaml");
  if (!existsSync(configPath)) {
    throw new Error(`AgentFabric config not found at ${configPath}. Run /onboard to set up.`);
  }
  const raw = readFileSync(configPath, "utf-8");
  const parsed = FabricConfigSchema.parse(parseYaml(raw));
  return {
    ...parsed,
    voiceProfilePath: resolveConfigPath(configDir, parsed.voiceProfilePath),
  };
}

export function loadAccounts(configDir: string = DEFAULT_DIR): AccountEntry[] {
  const accountsPath = join(configDir, "accounts.yaml");
  if (!existsSync(accountsPath)) return [];
  const raw = readFileSync(accountsPath, "utf-8");
  return AccountsFileSchema.parse(parseYaml(raw)).accounts;
}

export function loadVoiceProfile(
  configDir: string = DEFAULT_DIR,
  voiceProfilePath?: string,
): string {
  const profilePath = voiceProfilePath
    ? resolveConfigPath(configDir, voiceProfilePath)
    : join(configDir, "voice-profile.md");
  if (!existsSync(profilePath)) return "";
  return readFileSync(profilePath, "utf-8");
}
