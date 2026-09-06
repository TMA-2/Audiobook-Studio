import { Snippet, Generation, Chapter, Scene } from '../types';

export interface GenerationGroup {
  id: string;
  isGrouped: boolean;
  generationId: string | null;
  generation: Generation | null;
  snippets: Snippet[];
}

export interface GenerationStats {
  speakerCount: number;
  totalChars: number;
  totalWords: number;
  totalSentences: number;
  sentChars: number;
  sentWords: number;
  duration: number;
  totalTokens?: number;
  promptTokens?: number;
}

/**
 * Counts the number of sentences in a given text based on standard punctuation boundaries.
 * @param text The input text to analyze
 * @returns Number of sentences
 */
export function countSentences(text: string): number {
  if (!text || !text.trim()) {
    return 0;
  }
  const trimmed = text.trim();
  const sentences = trimmed.split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0);
  return sentences.length || (trimmed.length > 0 ? 1 : 0);
}

/**
 * Groups contiguous snippets that share the same active generation.
 * @param snippets Array of chapter snippets in display order
 * @returns Array of grouped and standalone generation blocks
 */
export function groupSnippetsByGeneration(snippets: Snippet[]): GenerationGroup[] {
  const groups: GenerationGroup[] = [];
  let i = 0;

  while (i < snippets.length) {
    const current = snippets[i];
    const activeGenId = current.activeGenerationId;

    if (!activeGenId) {
      groups.push({
        id: `standalone-${current.id}`,
        isGrouped: false,
        generationId: null,
        generation: null,
        snippets: [current]
      });
      i++;
      continue;
    }

    const currentGen = current.generations.find(g => g.id === activeGenId) || null;
    const matchingSnippets: Snippet[] = [current];
    let j = i + 1;

    while (j < snippets.length && snippets[j].activeGenerationId === activeGenId) {
      matchingSnippets.push(snippets[j]);
      j++;
    }

    if (matchingSnippets.length > 1) {
      groups.push({
        id: `group-${activeGenId}`,
        isGrouped: true,
        generationId: activeGenId,
        generation: currentGen,
        snippets: matchingSnippets
      });
      i = j;
    }
    else {
      groups.push({
        id: `standalone-${current.id}`,
        isGrouped: false,
        generationId: activeGenId,
        generation: currentGen,
        snippets: [current]
      });
      i++;
    }
  }

  return groups;
}

/**
 * Formats a timestamp into HH:MM:SS string.
 * @param timestamp ISO string or numeric timestamp
 * @returns HH:MM:SS string
 */
export function formatTimestampToTime(timestamp: string | number): string {
  try {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(Date.parse(timestamp));
    if (isNaN(date.getTime())) {
      return '00:00:00';
    }
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  catch {
    return '00:00:00';
  }
}

/**
 * Formats duration in seconds into M:SS or H:MM:SS.
 * @param durationSeconds Duration in seconds
 * @returns Formatted duration string
 */
export function formatDurationCompact(durationSeconds: number): string {
  if (!durationSeconds || durationSeconds <= 0) {
    return '0:00';
  }
  const totalSeconds = Math.floor(durationSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Formats a default generation label with timestamp, duration, chapter, scene, and line ranges.
 * @param options Label generation parameters
 * @returns Formatted label string
 */
export function formatDefaultGenerationLabel(options: {
  generation: Generation;
  snippets: Snippet[];
  chapterNumber?: number;
  sceneName?: string;
  customName?: string;
}): string {
  const { generation, snippets, chapterNumber, sceneName, customName } = options;

  if (customName && customName.trim().length > 0) {
    return customName.trim();
  }

  const timeStr = formatTimestampToTime(generation.timestamp);
  const durStr = formatDurationCompact(generation.duration);
  const chStr = chapterNumber !== undefined ? `🔖${chapterNumber}` : '';
  const scStr = sceneName ? `🎬${sceneName}` : '';

  let lineRange = '';
  if (snippets.length === 1) {
    lineRange = `💬${(snippets[0].order ?? 0) + 1}`;
  }
  else if (snippets.length > 1) {
    const start = (snippets[0].order ?? 0) + 1;
    const end = (snippets[snippets.length - 1].order ?? 0) + 1;
    lineRange = `💬${start}-${end}`;
  }

  const parts = [
    `⌚${timeStr}`,
    `↔️${durStr}`,
    chStr,
    scStr,
    lineRange
  ].filter(Boolean);

  return parts.join('-');
}

/**
 * Calculates cumulative statistics for a set of snippets and their generation.
 * @param snippets Snippets contained in the generation
 * @param generation The audio generation metadata
 * @returns GenerationStats object with characters, words, speakers, and tokens
 */
export function calculateGenerationStats(snippets: Snippet[], generation: Generation): GenerationStats {
  const speakerSet = new Set<string>();
  let totalChars = 0;
  let totalWords = 0;
  let totalSentences = 0;

  for (const snippet of snippets) {
    if (snippet.speakerId) {
      speakerSet.add(snippet.speakerId);
    }
    const text = snippet.text || '';
    totalChars += text.length;
    const words = text.trim().split(/\s+/).filter(Boolean);
    totalWords += words.length;
    totalSentences += countSentences(text);
  }

  const promptText = generation.text || '';
  const sentChars = promptText.length > 0 ? promptText.length : totalChars;
  const sentWords = promptText.length > 0 ? promptText.trim().split(/\s+/).filter(Boolean).length : totalWords;

  return {
    speakerCount: speakerSet.size || (generation.speakerId ? 1 : 0),
    totalChars,
    totalWords,
    totalSentences,
    sentChars,
    sentWords,
    duration: generation.duration || 0,
    totalTokens: generation.totalTokens,
    promptTokens: generation.promptTokens
  };
}

/**
 * Finds the next distinct playback target snippet, skipping intermediate snippets that share the same active generation.
 * @param snippets All chapter snippets in order
 * @param currentSnippetId Currently playing snippet ID
 * @returns Next snippet to play or null if end of chapter reached
 */
export function getNextPlaybackTarget(snippets: Snippet[], currentSnippetId: string): Snippet | null {
  const currentIndex = snippets.findIndex(s => s.id === currentSnippetId);
  if (currentIndex === -1) {
    return null;
  }

  const currentSnippet = snippets[currentIndex];
  const activeGenId = currentSnippet.activeGenerationId;

  if (!activeGenId) {
    // If current snippet had no generation, move to next snippet
    for (let i = currentIndex + 1; i < snippets.length; i++) {
      if (snippets[i].activeGenerationId) {
        return snippets[i];
      }
    }
    return null;
  }

  // Find the end index of the contiguous block sharing this activeGenId
  let nextIndex = currentIndex + 1;
  while (nextIndex < snippets.length && snippets[nextIndex].activeGenerationId === activeGenId) {
    nextIndex++;
  }

  // Find the next snippet that has an active generation
  for (let i = nextIndex; i < snippets.length; i++) {
    if (snippets[i].activeGenerationId) {
      return snippets[i];
    }
  }

  return null;
}
