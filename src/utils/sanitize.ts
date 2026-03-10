/**
 * Sanitize text to prevent unicode encoding issues in Gmail and Slack.
 * Replaces unicode punctuation and common mojibake sequences with
 * plain ASCII equivalents so downstream tools receive stable plain text.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\u00e2\u20ac\u201d/g, " - ") // mojibake em dash: â€”
    .replace(/\u00e2\u20ac\u201c/g, "-")   // mojibake en dash: â€“
    .replace(/\u00e2\u20ac\u0153/g, '"')   // mojibake left double quote: â€œ
    .replace(/\u00e2\u20ac[\u009d\u001d]/g, '"') // mojibake right double quote
    .replace(/\u00e2\u20ac\u02dc/g, "'")   // mojibake left single quote: â€˜
    .replace(/\u00e2\u20ac\u2122/g, "'")   // mojibake right single quote: â€™
    .replace(/\u00e2\u20ac\u00a6/g, "...") // mojibake ellipsis: â€¦
    .replace(/\u00c2\u00a0/g, " ")         // mojibake non-breaking space: Â
    .replace(/\u00c2/g, "")                // stray mojibake prefix: Â
    .replace(/\u00a0/g, " ")               // non-breaking space
    .replace(/[\u200b-\u200d\ufeff]/g, "") // zero-width chars / BOM
    .replace(/ ?\u2014 ?/g, " - ") // em dash (absorb surrounding spaces)
    .replace(/\u2013/g, "-")      // en dash
    .replace(/\u201C/g, '"')      // left double quote
    .replace(/\u201D/g, '"')      // right double quote
    .replace(/\u2018/g, "'")      // left single quote
    .replace(/\u2019/g, "'")      // right single quote
    .replace(/\u2022/g, "- ")     // bullet
    .replace(/\u2026/g, "...")    // ellipsis character
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}
