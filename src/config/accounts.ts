import type { AccountEntry } from "../types/fabric.js";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function extractEmailDomain(value: string): string | null {
  const normalized = normalize(value);
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex === -1 || atIndex === normalized.length - 1) return null;
  return normalized.slice(atIndex + 1);
}

export function resolveAccount(
  accounts: AccountEntry[],
  query: string
): AccountEntry | undefined {
  const q = normalize(query);
  if (!q) return undefined;

  const domainQuery = extractEmailDomain(q) ?? q;
  const channelQuery = q.replace(/^#/, "");

  const exact = accounts.find((a) => {
    const name = normalize(a.name);
    const domain = a.domain ? normalize(a.domain) : undefined;
    const channel = a.slackChannel ? normalize(a.slackChannel).replace(/^#/, "") : undefined;
    const contacts = a.contacts.map(normalize);

    return (
      name === q ||
      domain === domainQuery ||
      channel === channelQuery ||
      contacts.includes(q)
    );
  });
  if (exact) return exact;

  return accounts.find(
    (a) =>
      normalize(a.name).startsWith(q) ||
      normalize(a.name).includes(q) ||
      (a.domain ? normalize(a.domain).includes(domainQuery) : false) ||
      a.contacts.some((contact) => normalize(contact).includes(q))
  );
}
