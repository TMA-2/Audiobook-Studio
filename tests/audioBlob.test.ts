import { describe, it, expect } from 'vitest';
import { base64ToBlob, blobToBase64 } from '../src/utils/audioBlob';

describe('audioBlob', () => {
  it('converts base64 to a Blob with the mime type and original bytes', async () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 255]);
    const base64 = Buffer.from(bytes).toString('base64');
    const blob = base64ToBlob(base64, 'audio/l16; rate=24000');
    expect(blob.type).toBe('audio/l16; rate=24000');
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
  });

  it('round-trips a payload larger than one conversion chunk', async () => {
    const bytes = new Uint8Array(200_000).map((_, i) => i % 256);
    const base64 = Buffer.from(bytes).toString('base64');
    expect(await blobToBase64(base64ToBlob(base64, 'audio/wav'))).toBe(base64);
  });
});
