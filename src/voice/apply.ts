export function applyVoiceProfile(profile: string, prompt: string): string {
  if (!profile.trim()) return prompt;
  return `## Voice Profile\n\n${profile}\n\n---\n\n${prompt}`;
}
