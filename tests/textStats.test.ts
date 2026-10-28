import { describe, it, expect } from 'vitest';
import { computeRawTextStats } from '../src/utils/textStats';

describe('computeRawTextStats', () => {
  it('counts trimmed text joined with newlines', () => {
    const stats = computeRawTextStats([{ text: '  Hello world ' }, { text: 'Second line' }]);
    expect(stats.text).toBe('Hello world\nSecond line');
    expect(stats.chars).toBe(23);
    expect(stats.words).toBe(4);
  });

  it('returns zero counts for no snippets', () => {
    expect(computeRawTextStats([])).toEqual({ text: '', chars: 0, words: 0 });
  });

  it('returns zero words for whitespace-only snippets', () => {
    expect(computeRawTextStats([{ text: '   ' }]).words).toBe(0);
  });
});
