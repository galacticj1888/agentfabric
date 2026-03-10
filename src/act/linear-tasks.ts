import type { Commitment } from "../types/fabric.js";
import { sanitizeText } from "../utils/index.js";

export interface LinearTaskInput {
  commitments: Commitment[];
  account: string;
  project?: string;
  teamMembers?: string[];
  includeInferred?: boolean;
}

export interface LinearTaskPayload {
  title: string;
  description: string;
  project: string;
  labels: string[];
}

function normalizePersonName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function matchesTeamMember(owner: string, teamMembers: string[]): boolean {
  const normalizedOwner = normalizePersonName(owner);
  if (!normalizedOwner) return false;

  const ownerTokens = new Set(normalizedOwner.split(" ").filter(Boolean));
  return teamMembers.some((member) => {
    const normalizedMember = normalizePersonName(member);
    if (!normalizedMember) return false;
    if (normalizedMember === normalizedOwner) return true;

    const memberTokens = normalizedMember.split(" ").filter(Boolean);
    return memberTokens.length > 0 && memberTokens.every((token) => ownerTokens.has(token));
  });
}

export function formatLinearTasksForMCP(input: LinearTaskInput): LinearTaskPayload[] {
  const team = input.teamMembers ?? [];
  const accountLabel = normalizeLabel(input.account) || "account";
  const deduped = new Set<string>();

  return input.commitments
    .filter((c) => {
      if (!input.includeInferred && c.confidence === "inferred") return false;
      if (!c.what.trim()) return false;
      if (team.length === 0) return true;
      return matchesTeamMember(c.who, team);
    })
    .filter((c) => {
      const key = [
        normalizePersonName(c.who),
        c.what.trim().toLowerCase(),
        c.byWhen ?? "",
      ].join("|");
      if (deduped.has(key)) return false;
      deduped.add(key);
      return true;
    })
    .map((c) => {
      const description = [
        `**Account:** ${input.account}`,
        `**Owner:** ${c.who}`,
        `**For:** ${c.toWhom}`,
        c.byWhen ? `**Due:** ${c.byWhen}` : null,
        c.rawQuote ? `**Quote:** "${c.rawQuote}"` : null,
        `**Confidence:** ${c.confidence}`,
        `**Source:** ${c.source}`,
      ].filter(Boolean).join("\n");

      return {
        title: sanitizeText(`[${input.account}] ${c.what}`),
        description: sanitizeText(description),
        project: input.project ?? "default",
        labels: [accountLabel, "agentfabric"],
      };
    });
}
