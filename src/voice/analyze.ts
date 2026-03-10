export const VOICE_ANALYSIS_PROMPT = `You are an expert communication analyst. Analyze the following transcripts from one person's meetings and calls. Extract their unique communication style.

## Analyze For

### Tone
- Overall personality (formal, casual, direct, warm, etc.)
- How they handle difficult topics
- Energy level and enthusiasm markers

### Lexicon
- Signature phrases and expressions they use repeatedly
- Slang, colloquialisms, or industry jargon
- Filler words or verbal tics

### Email Patterns
- How they typically open emails
- How they structure the body (bullets, paragraphs, mixed)
- How they close (sign-off style, call-to-action patterns)

### Sentence Structure
- Average sentence length
- Punctuation style (em-dashes, ellipses, etc.)
- Question style (direct, rhetorical, hedged)

## Output Format

Return a markdown document:

\`\`\`markdown
# Voice Profile: [Name]

## Tone
[2-3 sentences]

## Lexicon
- "[phrase]" ([meaning/usage])

## Email Patterns
- Opens with: [pattern]
- Body style: [pattern]
- Closes with: [pattern]
- Sign-off: [typical sign-off]

## Sentence Structure
- [Key observations]
\`\`\`

## Transcripts to Analyze

{TRANSCRIPTS}`;

export function buildVoiceAnalysisPrompt(transcripts: string[]): string {
  const numbered = transcripts
    .map((t, i) => `### Transcript ${i + 1}\n\n${t}`)
    .join("\n\n---\n\n");
  return VOICE_ANALYSIS_PROMPT.replace("{TRANSCRIPTS}", numbered);
}
