import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../src/services/markdownParser';

describe('parseMarkdown speakers', () => {
  it('keeps role and drops pace/accent from bulleted speakers', () => {
    const project = parseMarkdown(
      '# Book\n\n## Speakers\n\n### Alice\n- Voice: Puck\n- Role: Protagonist\n- Pace: Fast\n- Accent: Irish\n\n## Chapter 1\n\nHello there.\n'
    );
    const alice: any = project.speakers.find(s => s.name === 'Alice');
    expect(alice).toBeDefined();
    expect(alice.voice).toBe('Puck');
    expect(alice.role).toBe('Protagonist');
    expect('pace' in alice).toBe(false);
    expect('accent' in alice).toBe(false);
  });

  it('drops pace/accent columns from a speakers table', () => {
    const project = parseMarkdown(
      '# Book\n\n## Speakers\n\n| Name | Voice | Role | Pace | Accent |\n| --- | --- | --- | --- | --- |\n| Bob | Kore | Sidekick | Slow | Welsh |\n\n## Chapter 1\n\nHi.\n'
    );
    const bob: any = project.speakers.find(s => s.name === 'Bob');
    expect(bob).toBeDefined();
    expect(bob.role).toBe('Sidekick');
    expect('pace' in bob).toBe(false);
    expect('accent' in bob).toBe(false);
  });
});
