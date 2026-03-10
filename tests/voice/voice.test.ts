import { describe, it, expect } from "vitest";
import { buildVoiceAnalysisPrompt, parseVoiceProfileFromResponse, applyVoiceProfile } from "../../src/voice/index.js";

describe("buildVoiceAnalysisPrompt", () => {
  it("includes all transcripts in the prompt", () => {
    const transcripts = [
      "Hey man, so I'll fire that off to you by EOD. Sound good?",
      "Dude, that's bananas. Let me circle back on that tomorrow.",
    ];
    const prompt = buildVoiceAnalysisPrompt(transcripts);
    expect(prompt).toContain("fire that off");
    expect(prompt).toContain("bananas");
    expect(prompt).toContain("Tone");
    expect(prompt).toContain("Lexicon");
  });

  it("numbers transcripts", () => {
    const prompt = buildVoiceAnalysisPrompt(["transcript one", "transcript two"]);
    expect(prompt).toContain("Transcript 1");
    expect(prompt).toContain("Transcript 2");
  });
});

describe("parseVoiceProfileFromResponse", () => {
  it("extracts markdown from code fence", () => {
    const response = `Here is the profile:\n\n\`\`\`markdown\n# Voice Profile: Ryan\n\n## Tone\nDirect and confident.\n\`\`\``;
    const profile = parseVoiceProfileFromResponse(response);
    expect(profile).toContain("# Voice Profile: Ryan");
    expect(profile).toContain("Direct and confident");
    expect(profile).not.toContain("```");
  });

  it("handles response that starts with heading directly", () => {
    const response = "# Voice Profile: Jeff\n\n## Tone\nCasual but authoritative.";
    const profile = parseVoiceProfileFromResponse(response);
    expect(profile).toContain("# Voice Profile: Jeff");
  });

  it("extracts from response with preamble text", () => {
    const response = "Based on my analysis, here's the voice profile:\n\n# Voice Profile: Ryan\n\n## Tone\nEnergetic.";
    const profile = parseVoiceProfileFromResponse(response);
    expect(profile).toContain("# Voice Profile: Ryan");
  });
});

describe("applyVoiceProfile", () => {
  it("prepends voice profile to a generation prompt", () => {
    const profile = "# Voice Profile\n\nDirect and confident.";
    const prompt = "Write a follow-up email for FINRA.";
    const result = applyVoiceProfile(profile, prompt);
    expect(result).toContain("Direct and confident");
    expect(result).toContain("Write a follow-up email");
  });

  it("returns prompt unchanged when no profile", () => {
    const prompt = "Write a follow-up email.";
    expect(applyVoiceProfile("", prompt)).toBe(prompt);
  });

  it("returns prompt unchanged for whitespace-only profile", () => {
    expect(applyVoiceProfile("   ", "Do something")).toBe("Do something");
  });
});
