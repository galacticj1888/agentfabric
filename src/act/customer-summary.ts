export interface CustomerSummaryInput {
  account: string;
  targetChannel: string;
  summary: string;
}

export interface CustomerSummaryReviewPayload {
  text: string;
}

function formatSlackDestination(target: string): string {
  const normalized = target.trim().replace(/^#/, "");
  if (!normalized) return "`unknown channel`";
  if (/^[CDG][A-Z0-9]+$/i.test(normalized)) return `\`${normalized}\``;
  return `\`#${normalized}\``;
}

/**
 * Formats the customer summary as a DM to the user for review.
 * NEVER auto-post to customer channels. Human-in-the-loop required.
 */
export function formatCustomerSummaryForReview(input: CustomerSummaryInput): CustomerSummaryReviewPayload {
  const destination = formatSlackDestination(input.targetChannel);

  return {
    text: [
      `*Meeting summary ready for review* — ${input.account}`,
      ``,
      `> Target channel: ${destination}`,
      ``,
      `---`,
      ``,
      input.summary,
      ``,
      `---`,
      ``,
      `_Copy the summary above and paste it into ${destination} when you're ready._`,
    ].join("\n"),
  };
}
