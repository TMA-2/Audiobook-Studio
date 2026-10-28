import { describe, it, expect } from 'vitest';
import { getAudioDuration } from '../src/services/audioService';

describe('getAudioDuration', () => {
  it('computes L16 PCM duration without a browser Audio element', async () => {
    // 2 seconds of 16-bit mono at 24000 Hz
    const base64 = Buffer.alloc(24000 * 2 * 2).toString('base64');
    const duration = await getAudioDuration(base64, 'audio/l16; rate=24000; channels=1');
    expect(duration).toBeCloseTo(2, 3);
  });

  it('uses the rate from the L16 mime type', async () => {
    const base64 = Buffer.alloc(16000 * 2 * 2).toString('base64');
    const duration = await getAudioDuration(base64, 'audio/L16;rate=16000');
    expect(duration).toBeCloseTo(2, 3);
  });
});
