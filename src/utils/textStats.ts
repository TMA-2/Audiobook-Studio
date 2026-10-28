/**
 * Joins snippet text the way it is sent to the TTS request (trimmed, newline-separated)
 * and counts its characters and words.
 * @param snippets Snippets (or any objects with a `text` field) to count.
 */
export function computeRawTextStats(snippets: { text?: string }[]): { text: string; chars: number; words: number } {
  const text = snippets.map(s => (s.text || '').trim()).join('\n');
  const trimmed = text.trim();
  return {
    text,
    chars: text.length,
    words: trimmed ? trimmed.split(/\s+/).length : 0
  };
}
