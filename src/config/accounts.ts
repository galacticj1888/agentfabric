import type { AccountEntry } from "../types/fabric.js";

export function resolveAccount(
  accounts: AccountEntry[],
  query: string
): AccountEntry | undefined {
  const q = query.toLowerCase().trim();
  const exact = accounts.find((a) => a.name.toLowerCase() === q);
  if (exact) return exact;
  return accounts.find(
    (a) => a.name.toLowerCase().startsWith(q) || a.name.toLowerCase().includes(q)
  );
}
