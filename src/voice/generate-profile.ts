export function parseVoiceProfileFromResponse(response: string): string {
  const fenceMatch = response.match(/```markdown\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  if (response.trim().startsWith("# Voice Profile")) return response.trim();
  const headingMatch = response.match(/(# Voice Profile[\s\S]*)/);
  return headingMatch ? headingMatch[1].trim() : response.trim();
}
