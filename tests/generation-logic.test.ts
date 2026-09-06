import { describe, it, expect } from 'vitest';
import { Snippet, Speaker, Scene, Project, Chapter } from '../src/types';
import { getGenerationValidationState } from '../src/utils/generationValidator';
import { compilePrompt } from '../src/utils/promptCompiler';

describe('Generation Decision Logic Tests', () => {
  const mockSpeakers: Speaker[] = [
    { id: 'sp-1', name: 'Speaker A', voice: 'Zephyr', style: 'A style', order: 0, isNarrator: false },
    { id: 'sp-2', name: 'Speaker B', voice: 'Leda', style: 'B style', order: 1, isNarrator: false },
    { id: 'sp-3', name: 'Speaker C', voice: 'Kore', style: 'C style', order: 2, isNarrator: false },
  ];

  const mockScenes: Scene[] = [
    { id: 'sc-1', name: 'Scene 1', description: 'Desc 1', context: 'Ctx 1', order: 0 },
    { id: 'sc-2', name: 'Scene 2', description: 'Desc 2', context: 'Ctx 2', order: 1 },
  ];

  const s1: Snippet = { id: 'sn-1', order: 0, text: 'Hello world', speakerId: 'sp-1', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };
  const s2: Snippet = { id: 'sn-2', order: 1, text: 'A'.repeat(8000), speakerId: 'sp-1', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };
  const s3: Snippet = { id: 'sn-3', order: 2, text: 'Hello B', speakerId: 'sp-2', sceneId: 'sc-2', status: 'idle', generations: [], activeGenerationId: null };
  const s4: Snippet = { id: 'sn-4', order: 1, text: 'Hello C', speakerId: 'sp-3', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };
  const s5: Snippet = { id: 'sn-5', order: 2, text: 'Hello B', speakerId: 'sp-2', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };
  const s6: Snippet = { id: 'sn-6', order: 3, text: 'Hello again', speakerId: 'sp-2', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };

  it('validates per-paragraph mode with single snippet and safe length', () => {
    const res = getGenerationValidationState([s1], mockSpeakers, mockScenes, 'per-paragraph', 500);
    expect(res.valid).toBe(true);
  });

  it('fails per-paragraph mode if text length exceeds threshold', () => {
    const res = getGenerationValidationState([s2], mockSpeakers, mockScenes, 'per-paragraph', 500);
    expect(res.valid).toBe(false);
  });

  it('fails per-scene mode if snippets belong to different scenes', () => {
    const res = getGenerationValidationState([s1, s3], mockSpeakers, mockScenes, 'per-scene', 500);
    expect(res.valid).toBe(false);
  });

  it('fails per-scene mode if there are more than 2 speakers', () => {
    const res = getGenerationValidationState([{ ...s1, order: 0 }, { ...s4, order: 1 }, s5], mockSpeakers, mockScenes, 'per-scene', 500);
    expect(res.valid).toBe(false);
  });

  it('fails per-scene mode if selected snippets are non-contiguous', () => {
    const res = getGenerationValidationState([s1, s6], mockSpeakers, mockScenes, 'per-scene', 500);
    expect(res.valid).toBe(false);
  });

  it('compiles prompt with interpolated variables', () => {
    const mockProject: Project = {
      title: 'My Gothic Novel',
      settings: {
        model: { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS (Preview)', description: 'Primary model' },
        encoding: 'M4A',
        sampleRate: '24000',
        promptTemplate: `# {project_title}\n## {chapter_title}\n\n### {speaker_name}\n- Role: {speaker_role}\n- Style: {speaker_instructions}\n\n## Scene: {scene_name}\n{scene_description}\n\n### Context\n{scene_context}\n\n## TRANSCRIPT\n{snippet_text}`
      },
      speakers: mockSpeakers,
      chapters: [],
      scenes: mockScenes
    };
    const mockChapter: Chapter = {
      id: 'ch-1',
      title: 'Chapter One',
      defaultSpeakerId: 'sp-1',
      order: 0,
      isCollapsed: false,
      snippets: []
    };

    const result = compilePrompt({ project: mockProject, activeChapter: mockChapter, snippetsOverride: [s1, s5] });
    expect(result.prompt).toContain('My Gothic Novel');
    expect(result.prompt).toContain('Chapter One');
    expect(result.prompt).toContain('Speaker A');
    expect(result.prompt).toContain('Speaker B');
    expect(result.prompt).not.toContain('{speaker_name}');
  });
});
