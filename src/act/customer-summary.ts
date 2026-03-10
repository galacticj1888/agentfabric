export interface CustomerSummaryInput {
  account: string;
  targetChannel: string;
  summary: string;
}

export interface CustomerSummaryReviewPayload {
  text: string;
}

/**
 * Formats the customer summary as a DM to the user for review.
 * NEVER auto-post to customer channels. Human-in-the-loop required.
 */
export function formatCustomerSummaryForReview(input: CustomerSummaryInput): CustomerSummaryReviewPayload {
  return {
    text: [
      `*Meeting summary ready for review* — ${input.account}`,
      ``,
      `> Target channel: \`#${input.targetChannel}\``,
      ``,
      `---`,
      ``,
      input.summary,
      ``,
      `---`,
      ``,
      `_Copy the summary above and paste it into #${input.targetChannel} when you're ready._`,
    ].join("\n"),
  };
}
