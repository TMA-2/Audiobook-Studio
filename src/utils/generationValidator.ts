import { Snippet, Speaker, Scene } from '../types';

export interface ValidationState {
  valid: boolean;
  reason?: string;
}

/**
 * Checks if the current selection of snippets is valid for generation under the chosen mode and constraints.
 * 
 * @param selectedSnippets The array of selected/focused snippets.
 * @param speakers The list of configured speakers.
 * @param scenes The list of acoustic scenes.
 * @param mode The active generation mode: 'per-paragraph' | 'per-scene' | 'per-chapter'
 * @param promptTemplateOverheadLength Estimated characters/tokens of the surrounding prompt template formatting.
 * @returns An object indicating if valid, and a descriptive reason if not.
 */
export function getGenerationValidationState(
  selectedSnippets: Snippet[],
  speakers: Speaker[],
  scenes: Scene[],
  mode: 'per-paragraph' | 'per-scene' | 'per-chapter' | 'full-project' | string,
  promptTemplateOverheadLength: number = 1000
): ValidationState {
  if (!selectedSnippets || selectedSnippets.length === 0) {
    return { valid: false, reason: 'No snippets selected.' };
  }

  const totalTextLength = selectedSnippets.reduce((sum, s) => sum + (s.text || '').length, 0);
  const totalSize = totalTextLength + promptTemplateOverheadLength;

  if (mode === 'per-paragraph') {
    // Single snippet size check
    if (totalSize >= 8000) {
      return {
        valid: false,
        reason: `Snippet text size (${totalSize} characters) exceeds the 8KB limit.`
      };
    }
    return { valid: true };
  }

  if (mode === 'per-scene') {
    // 1. Must belong to exactly one scene
    const sceneIds = new Set(selectedSnippets.map(s => s.sceneId || 'null'));
    if (sceneIds.size !== 1 || sceneIds.has('null')) {
      return {
        valid: false,
        reason: 'Selected snippets must belong to exactly one defined scene.'
      };
    }

    // 2. Must contain no more than 2 unique speakers
    const defaultSpeakerId = speakers[0]?.id || 'default_narrator';
    const speakerIds = new Set(selectedSnippets.map(s => s.speakerId || defaultSpeakerId));
    if (speakerIds.size > 2) {
      return {
        valid: false,
        reason: `Selected range contains ${speakerIds.size} speakers, max 2 allowed for multi-speaker API.`
      };
    }

    // 3. Must be contiguous (no gaps in order within the same segment)
    const orders = selectedSnippets.map(s => s.order).sort((a, b) => a - b);
    const isContiguous = orders.every((val, idx) => idx === 0 || val === orders[idx - 1] + 1);
    if (!isContiguous) {
      return {
        valid: false,
        reason: 'Selected snippets must be contiguous (no gaps in sequence).'
      };
    }

    // 4. Size check
    if (totalSize >= 8000) {
      return {
        valid: false,
        reason: `Combined scene text size (${totalSize} characters) exceeds the 8KB limit.`
      };
    }

    return { valid: true };
  }

  if (mode === 'per-chapter') {
    // 1. Must contain no more than 2 unique speakers
    const defaultSpeakerId = speakers[0]?.id || 'default_narrator';
    const speakerIds = new Set(selectedSnippets.map(s => s.speakerId || defaultSpeakerId));
    if (speakerIds.size > 2) {
      return {
        valid: false,
        reason: `Selected range contains ${speakerIds.size} speakers, max 2 allowed for multi-speaker API.`
      };
    }

    // 2. Must belong to exactly one scene (if scenes are defined)
    const sceneIds = new Set(selectedSnippets.map(s => s.sceneId || 'null'));
    if (sceneIds.size > 1) {
      return {
        valid: false,
        reason: 'Selected snippets in the chapter must belong to exactly one scene.'
      };
    }

    // 3. Size check
    if (totalSize >= 8000) {
      return {
        valid: false,
        reason: `Combined chapter text size (${totalSize} characters) exceeds the 8KB limit.`
      };
    }

    return { valid: true };
  }

  // Fallback
  return { valid: true };
}
