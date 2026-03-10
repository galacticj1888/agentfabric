/**
 * Sanitize text to prevent unicode encoding issues in Gmail and Slack.
 * Replaces em dashes, en dashes, smart quotes, and other unicode
 * punctuation that causes mojibake (e.g., "a]e"" instead of "-").
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/ ?\u2014 ?/g, " - ") // em dash (absorb surrounding spaces)
    .replace(/\u2013/g, "-")      // en dash
    .replace(/\u201C/g, '"')      // left double quote
    .replace(/\u201D/g, '"')      // right double quote
    .replace(/\u2018/g, "'")      // left single quote
    .replace(/\u2019/g, "'")      // right single quote
    .replace(/\u2026/g, "...");   // ellipsis character
}
