import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, loadAccounts, loadVoiceProfile, resolveAccount } from "../../src/config/index.js";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("loadConfig", () => {
  let testDir: string;
  beforeEach(() => { testDir = mkdtempSync(join(tmpdir(), "agentfabric-test-")); });
  afterEach(() => { rmSync(testDir, { recursive: true, force: true }); });

  it("loads a valid config.yaml", () => {
    writeFileSync(join(testDir, "config.yaml"),
`userId: jeff
voiceProfilePath: ./voice-profile.md
linearProject: RunLayer GTM
linearTeam: sales
salesThreadsChannel: sales-threads
defaultSources:
  - fireflies
  - slack
  - calendar
`);
    const config = loadConfig(testDir);
    expect(config.userId).toBe("jeff");
    expect(config.defaultSources).toEqual(["fireflies", "slack", "calendar"]);
    expect(config.voiceProfilePath).toBe(join(testDir, "voice-profile.md"));
  });

  it("throws on missing config.yaml", () => {
    expect(() => loadConfig(testDir)).toThrow();
  });
});

describe("loadAccounts", () => {
  let testDir: string;
  beforeEach(() => { testDir = mkdtempSync(join(tmpdir(), "agentfabric-test-")); });
  afterEach(() => { rmSync(testDir, { recursive: true, force: true }); });

  it("loads accounts.yaml", () => {
    writeFileSync(join(testDir, "accounts.yaml"),
`accounts:
  - name: FINRA
    slackChannel: ext-finra-runlayer
    domain: finra.org
    contacts:
      - duane.whitt@finra.org
  - name: Goldman Sachs
    slackChannel: ext-gs-runlayer
    domain: gs.com
`);
    const accounts = loadAccounts(testDir);
    expect(accounts).toHaveLength(2);
    expect(accounts[0].name).toBe("FINRA");
  });

  it("returns empty array when no accounts.yaml", () => {
    expect(loadAccounts(testDir)).toEqual([]);
  });
});

describe("resolveAccount", () => {
  const accounts = [
    { name: "FINRA", slackChannel: "ext-finra-runlayer", contacts: [] as string[] },
    { name: "Goldman Sachs", slackChannel: "ext-gs-runlayer", contacts: [] as string[] },
  ];

  it("finds account by exact name (case-insensitive)", () => {
    expect(resolveAccount(accounts, "finra")?.name).toBe("FINRA");
    expect(resolveAccount(accounts, "goldman sachs")?.name).toBe("Goldman Sachs");
  });

  it("finds account by partial match", () => {
    expect(resolveAccount(accounts, "goldman")?.name).toBe("Goldman Sachs");
  });

  it("finds account by domain, email, or slack channel", () => {
    const richerAccounts = [
      {
        name: "FINRA",
        slackChannel: "ext-finra-runlayer",
        domain: "finra.org",
        contacts: ["duane.whitt@finra.org"],
      },
    ];
    expect(resolveAccount(richerAccounts, "finra.org")?.name).toBe("FINRA");
    expect(resolveAccount(richerAccounts, "duane.whitt@finra.org")?.name).toBe("FINRA");
    expect(resolveAccount(richerAccounts, "#ext-finra-runlayer")?.name).toBe("FINRA");
  });

  it("returns undefined for no match", () => {
    expect(resolveAccount([], "FINRA")).toBeUndefined();
  });
});

describe("loadVoiceProfile", () => {
  let testDir: string;
  beforeEach(() => { testDir = mkdtempSync(join(tmpdir(), "agentfabric-test-")); });
  afterEach(() => { rmSync(testDir, { recursive: true, force: true }); });

  it("loads voice-profile.md as raw string", () => {
    writeFileSync(join(testDir, "voice-profile.md"), "# Voice Profile\n\nDirect and confident.");
    const profile = loadVoiceProfile(testDir);
    expect(profile).toContain("Direct and confident");
  });

  it("loads a profile from the configured relative path", () => {
    writeFileSync(join(testDir, "custom-profile.md"), "# Voice Profile\n\nCustom tone.");
    const profile = loadVoiceProfile(testDir, "./custom-profile.md");
    expect(profile).toContain("Custom tone");
  });

  it("returns empty string when no profile", () => {
    expect(loadVoiceProfile(testDir)).toBe("");
  });
});
