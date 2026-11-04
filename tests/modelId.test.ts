import { describe, it, expect } from 'vitest';
import { resolveModelId } from '../src/utils/modelId';

describe('resolveModelId', () => {
  it('returns the id of a ModelOption object', () => {
    expect(resolveModelId({ id: 'gemini-3.1-flash-tts-preview', name: 'x', description: 'y' })).toBe('gemini-3.1-flash-tts-preview');
  });

  it('returns a plain string unchanged', () => {
    expect(resolveModelId('gemini-2.5-flash-tts')).toBe('gemini-2.5-flash-tts');
  });
});
