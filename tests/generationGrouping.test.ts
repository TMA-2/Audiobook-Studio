import { describe, it, expect } from 'vitest';
import { Snippet, Generation, Chapter, Scene } from '../src/types';
import {
  groupSnippetsByGeneration,
  formatDefaultGenerationLabel,
  calculateGenerationStats,
  getNextPlaybackTarget
} from '../src/utils/generationGrouping';

describe('generationGrouping utilities', () => {
  const dummyGen: Generation = {
    id: 'gen-123',
    snippetId: 'snip-1',
    speakerId: 'spk-1',
    sceneId: 'sc-1',
    timestamp: '2026-08-07T06:10:46.000Z',
    model: 'gemini-3.1-flash-tts-preview',
    text: 'Hello world',
    audioMimeType: 'audio/wav',
    duration: 36.5
  };

  const dummyScenes: Scene[] = [
    { id: 'sc-1', name: 'The Park', description: 'Park scene', context: 'Morning', order: 0 }
  ];

  it('groups contiguous snippets with the same activeGenerationId into a single group', () => {
    const snippets: Snippet[] = [
      { id: 'snip-1', order: 0, text: 'One', speakerId: 'spk-1', sceneId: 'sc-1', status: 'done', generations: [dummyGen], activeGenerationId: 'gen-123' },
      { id: 'snip-2', order: 1, text: 'Two', speakerId: 'spk-2', sceneId: 'sc-1', status: 'done', generations: [dummyGen], activeGenerationId: 'gen-123' },
      { id: 'snip-3', order: 2, text: 'Three', speakerId: 'spk-1', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null },
      { id: 'snip-4', order: 3, text: 'Four', speakerId: 'spk-1', sceneId: 'sc-1', status: 'done', generations: [{ ...dummyGen, id: 'gen-456' }], activeGenerationId: 'gen-456' }
    ];

    const groups = groupSnippetsByGeneration(snippets);
    expect(groups).toHaveLength(3);
    expect(groups[0].isGrouped).toBe(true);
    expect(groups[0].generationId).toBe('gen-123');
    expect(groups[0].snippets).toHaveLength(2);

    expect(groups[1].isGrouped).toBe(false);
    expect(groups[1].snippets).toHaveLength(1);
    expect(groups[1].snippets[0].id).toBe('snip-3');

    expect(groups[2].isGrouped).toBe(false);
    expect(groups[2].snippets).toHaveLength(1);
    expect(groups[2].snippets[0].id).toBe('snip-4');
  });

  it('formats default generation label with timestamp, duration, chapter, scene, and snippet ranges', () => {
    const snippets: Snippet[] = [
      { id: 'snip-1', order: 0, text: 'Line 1', speakerId: 'spk-1', sceneId: 'sc-1', status: 'done', generations: [dummyGen], activeGenerationId: 'gen-123' },
      { id: 'snip-2', order: 1, text: 'Line 2', speakerId: 'spk-2', sceneId: 'sc-1', status: 'done', generations: [dummyGen], activeGenerationId: 'gen-123' }
    ];

    const label = formatDefaultGenerationLabel({
      generation: dummyGen,
      snippets,
      chapterNumber: 6,
      sceneName: 'The Park',
      customName: ''
    });

    expect(label).toContain('06:10:46');
    expect(label).toContain('0:36');
    expect(label).toContain('6');
    expect(label).toContain('The Park');
    expect(label).toContain('1-2');
  });

  it('calculates cumulative generation stats correctly including sentence count', () => {
    const snippets: Snippet[] = [
      { id: 'snip-1', order: 0, text: 'Hello world. How are you?', speakerId: 'spk-1', sceneId: 'sc-1', status: 'done', generations: [dummyGen], activeGenerationId: 'gen-123' },
      { id: 'snip-2', order: 1, text: 'I am fine! What a day.', speakerId: 'spk-2', sceneId: 'sc-1', status: 'done', generations: [dummyGen], activeGenerationId: 'gen-123' }
    ];

    const stats = calculateGenerationStats(snippets, dummyGen);
    expect(stats.speakerCount).toBe(2);
    expect(stats.totalChars).toBe('Hello world. How are you?'.length + 'I am fine! What a day.'.length);
    expect(stats.totalWords).toBe(11);
    expect(stats.totalSentences).toBe(4);
    expect(stats.duration).toBe(36.5);
  });

  it('finds the next distinct playback target skipping grouped snippets with the same generation', () => {
    const snippets: Snippet[] = [
      { id: 'snip-1', order: 0, text: 'One', speakerId: 'spk-1', status: 'done', generations: [dummyGen], activeGenerationId: 'gen-123' },
      { id: 'snip-2', order: 1, text: 'Two', speakerId: 'spk-2', status: 'done', generations: [dummyGen], activeGenerationId: 'gen-123' },
      { id: 'snip-3', order: 2, text: 'Three', speakerId: 'spk-1', status: 'done', generations: [{ ...dummyGen, id: 'gen-999' }], activeGenerationId: 'gen-999' }
    ];

    const nextTarget = getNextPlaybackTarget(snippets, 'snip-1');
    expect(nextTarget?.id).toBe('snip-3');
    expect(nextTarget?.activeGenerationId).toBe('gen-999');
  });
});
