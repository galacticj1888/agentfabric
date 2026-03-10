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
      if (team.length === 0) return true;
      return team.some((member) => c.who.toLowerCase().includes(member));
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
      ].filter(Boolean).join("\n"),
      project: input.project ?? "default",
      labels: [input.account.toLowerCase(), "agentfabric"],
    }));
}
