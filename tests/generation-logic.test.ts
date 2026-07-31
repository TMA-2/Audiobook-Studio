import { assert } from 'console';
import { Snippet, Speaker, Scene, Project, Chapter } from '../src/types';
import { getGenerationValidationState } from '../src/utils/generationValidator';

console.log("Running Generation Decision Logic Tests...");

const mockSpeakers: Speaker[] = [
  { id: 'sp-1', name: 'Speaker A', voice: 'Zephyr', style: 'A style', order: 0, isNarrator: false },
  { id: 'sp-2', name: 'Speaker B', voice: 'Leda', style: 'B style', order: 1, isNarrator: false },
  { id: 'sp-3', name: 'Speaker C', voice: 'Kore', style: 'C style', order: 2, isNarrator: false },
];

const mockScenes: Scene[] = [
  { id: 'sc-1', name: 'Scene 1', description: 'Desc 1', context: 'Ctx 1', order: 0 },
  { id: 'sc-2', name: 'Scene 2', description: 'Desc 2', context: 'Ctx 2', order: 1 },
];

// Test 1: Per-paragraph mode enabled with single snippet and safe length
const s1: Snippet = { id: 'sn-1', order: 0, text: 'Hello world', speakerId: 'sp-1', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };
const res1 = getGenerationValidationState([s1], mockSpeakers, mockScenes, 'per-paragraph', 500);
console.log('Test 1 per-paragraph:', res1);
if (!res1.valid) throw new Error('Test 1 failed: single paragraph should be valid.');

// Test 2: Per-paragraph mode fails if size is >= 8KB (approx 8000 characters)
const s2: Snippet = { id: 'sn-2', order: 1, text: 'A'.repeat(8000), speakerId: 'sp-1', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };
const res2 = getGenerationValidationState([s2], mockSpeakers, mockScenes, 'per-paragraph', 500);
console.log('Test 2 per-paragraph over limit:', res2);
if (res2.valid) throw new Error('Test 2 failed: paragraph >= 8000 characters should be invalid.');

// Test 3: Per-scene mode fails if snippets belong to different scenes
const s3: Snippet = { id: 'sn-3', order: 2, text: 'Hello B', speakerId: 'sp-2', sceneId: 'sc-2', status: 'idle', generations: [], activeGenerationId: null };
const res3 = getGenerationValidationState([s1, s3], mockSpeakers, mockScenes, 'per-scene', 500);
console.log('Test 3 per-scene different scenes:', res3);
if (res3.valid) throw new Error('Test 3 failed: snippets from different scenes should be invalid.');

// Test 4: Per-scene mode fails if there are more than 2 speakers
const s4: Snippet = { id: 'sn-4', order: 1, text: 'Hello C', speakerId: 'sp-3', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };
const s1_dup: Snippet = { ...s1, order: 0 };
const s4_dup: Snippet = { ...s4, order: 1 };
const s5: Snippet = { id: 'sn-5', order: 2, text: 'Hello B', speakerId: 'sp-2', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };
const res4 = getGenerationValidationState([s1_dup, s4_dup, s5], mockSpeakers, mockScenes, 'per-scene', 500);
console.log('Test 4 per-scene 3 speakers:', res4);
if (res4.valid) throw new Error('Test 4 failed: >= 3 unique speakers should be invalid.');

// Test 5: Per-scene mode fails if selected snippets are not contiguous (gaps in order)
const s6: Snippet = { id: 'sn-6', order: 3, text: 'Hello again', speakerId: 'sp-2', sceneId: 'sc-1', status: 'idle', generations: [], activeGenerationId: null };
const res5 = getGenerationValidationState([s1_dup, s6], mockSpeakers, mockScenes, 'per-scene', 500);
console.log('Test 5 per-scene non-contiguous:', res5);
if (res5.valid) throw new Error('Test 5 failed: non-contiguous snippets should be invalid.');

// Test 6: Compile prompt interpolation
import { compilePrompt } from '../src/utils/promptCompiler';
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
const compilationResult = compilePrompt({ project: mockProject, activeChapter: mockChapter, snippetsOverride: [s1, s5] });
console.log('Compiled Prompt Output:\n', compilationResult.prompt);

if (!compilationResult.prompt.includes('My Gothic Novel')) throw new Error('Test 6 failed: Title not interpolated.');
if (!compilationResult.prompt.includes('Chapter One')) throw new Error('Test 6 failed: Chapter title not interpolated.');
if (!compilationResult.prompt.includes('Speaker A')) throw new Error('Test 6 failed: Speaker A details missing.');
if (!compilationResult.prompt.includes('Speaker B')) throw new Error('Test 6 failed: Speaker B details missing.');
if (compilationResult.prompt.includes('{speaker_name}')) throw new Error('Test 6 failed: Template variables remaining.');

console.log("All diagnostic tests passed successfully!");
