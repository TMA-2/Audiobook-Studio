import { describe, it, expect } from 'vitest';
import { unzipSync } from 'fflate';
import { writeAbs, readAbs, audioExtension } from '../src/utils/absArchive';

const projectJson = {
  version: 4,
  projectName: 'T',
  chapters: [
    { content: [{ generations: [
      { id: 'g1', audioMimeType: 'audio/l16; rate=24000; channels=1' },
      { id: 'g2', audioMimeType: 'audio/wav' }
    ] }] }
  ]
};

async function write(audio: Record<string, Uint8Array>) {
  const parts: Uint8Array[] = [];
  await writeAbs(projectJson, Object.keys(audio), async (id) => new Blob([audio[id] as BlobPart]), (chunk) => { parts.push(chunk); });
  return new Blob(parts as BlobPart[]);
}

describe('absArchive', () => {
  it('maps mime types to extensions', () => {
    expect(audioExtension('audio/l16; rate=24000')).toBe('pcm');
    expect(audioExtension('audio/wav')).toBe('wav');
    expect(audioExtension('audio/mpeg')).toBe('mp3');
  });

  it('writes project.json and generations/<id>.<ext> entries', async () => {
    const zip = await write({ g1: new Uint8Array([1, 2, 3]), g2: new Uint8Array([4, 5]) });
    const files = unzipSync(new Uint8Array(await zip.arrayBuffer()));
    expect(Object.keys(files).sort()).toEqual(['generations/g1.pcm', 'generations/g2.wav', 'project.json']);
    expect(JSON.parse(new TextDecoder().decode(files['project.json'])).projectName).toBe('T');
  });

  it('stores entries uncompressed', async () => {
    const data = new Uint8Array(50_000);
    const zip = await write({ g1: data });
    // compression method 0 (STORE) sits at offset 8 of the first local header
    const bytes = new Uint8Array(await zip.arrayBuffer());
    expect(bytes[8]).toBe(0);
    expect(bytes.length).toBeGreaterThan(50_000);
  });

  it('reads back the project and audio with mime types from project.json', async () => {
    const g1 = new Uint8Array(300_000).map((_, i) => i % 251);
    const zip = await write({ g1, g2: new Uint8Array([9, 8, 7]) });
    const got: Record<string, { blob: Blob; mimeType: string }> = {};
    const project = await readAbs(zip, async (id, blob, mimeType) => { got[id] = { blob, mimeType }; });
    expect((project as any).projectName).toBe('T');
    expect(got.g1.mimeType).toBe('audio/l16; rate=24000; channels=1');
    expect(new Uint8Array(await got.g1.blob.arrayBuffer())).toEqual(g1);
    expect(got.g2.mimeType).toBe('audio/wav');
  });

  it('rejects an archive without project.json', async () => {
    await expect(readAbs(new Blob([new Uint8Array([80, 75, 5, 6, ...new Array(18).fill(0)])]), async () => {})).rejects.toThrow(/project\.json/);
  });

  it('reports bytes read and audio entries restored', async () => {
    const zip = await write({ g1: new Uint8Array(2_500_000), g2: new Uint8Array([1]) });
    const calls: { bytesRead: number; total: number; audioCount: number }[] = [];
    await readAbs(zip, async () => {}, (bytesRead, total, audioCount) => { calls.push({ bytesRead, total, audioCount }); });
    expect(calls.length).toBeGreaterThan(1);
    expect(calls.at(-1)).toEqual({ bytesRead: zip.size, total: zip.size, audioCount: 2 });
  });});
