import { describe, it, expect, vi } from 'vitest';
import { parseSidecarStream, StreamingImportProgress } from '../src/utils/sidecarImporter';

describe('sidecarImporter', () => {
  it('parses valid sidecar stream in multiple small chunks and imports generations', async () => {
    const dummyGeneration1 = {
      id: 'gen-1',
      snippetId: 'snip-1',
      audioData: 'audio-data-1',
      audioMimeType: 'audio/wav',
      duration: 5.2,
      timestamp: 1700000000000
    };
    const dummyGeneration2 = {
      id: 'gen-2',
      snippetId: 'snip-2',
      audioData: 'audio-data-2',
      audioMimeType: 'audio/wav',
      duration: 3.1,
      timestamp: 1700000001000
    };

    const sidecarJson = JSON.stringify({
      version: 1,
      exportedAt: 1700000002000,
      generations: [dummyGeneration1, dummyGeneration2]
    }, null, 2);

    const encoder = new TextEncoder();
    const bytes = encoder.encode(sidecarJson);
    const chunkSize = 10;
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i += chunkSize) {
      chunks.push(bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      }
    });

    const savedAudio: Record<string, { data: string; mimeType: string }> = {};
    const onSaveAudio = vi.fn(async (id: string, data: string, mimeType: string) => {
      savedAudio[id] = { data, mimeType };
    });

    const progressUpdates: StreamingImportProgress[] = [];
    const onProgress = vi.fn((progress: StreamingImportProgress) => {
      progressUpdates.push({ ...progress });
    });

    const result = await parseSidecarStream(stream, bytes.length, {
      onSaveAudio,
      onProgress
    });

    expect(result.metadata.version).toBe(1);
    expect(result.importedGenerations.length).toBe(2);
    expect(result.importedGenerations[0].id).toBe('gen-1');
    expect(result.importedGenerations[0].duration).toBe(5.2);
    expect(result.importedGenerations[1].id).toBe('gen-2');
    expect(result.importedGenerations[1].duration).toBe(3.1);

    expect(onSaveAudio).toHaveBeenCalledTimes(2);
    expect(savedAudio['gen-1']).toEqual({ data: 'audio-data-1', mimeType: 'audio/wav' });
    expect(savedAudio['gen-2']).toEqual({ data: 'audio-data-2', mimeType: 'audio/wav' });
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1].processedCount).toBe(2);
  });

  it('handles escaped quotes and special characters within strings without breaking tokenization', async () => {
    const dummyGen = {
      id: 'gen-escaped',
      snippetId: 'snip-1',
      text: 'He said: "Hello! \\"Testing quotes\\" and braces { } and brackets [ ]."',
      audioData: 'escaped-audio-data',
      audioMimeType: 'audio/wav',
      duration: 4.0,
      timestamp: 1700000000000
    };

    const sidecarJson = JSON.stringify({
      version: 1,
      exportedAt: 1700000002000,
      generations: [dummyGen]
    });

    const encoder = new TextEncoder();
    const bytes = encoder.encode(sidecarJson);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      }
    });

    const onSaveAudio = vi.fn(async () => {});
    const result = await parseSidecarStream(stream, bytes.length, { onSaveAudio });

    expect(result.importedGenerations.length).toBe(1);
    expect(result.importedGenerations[0].id).toBe('gen-escaped');
    expect(result.importedGenerations[0].text).toBe(dummyGen.text);
    expect(onSaveAudio).toHaveBeenCalledWith(
      'gen-escaped',
      'escaped-audio-data',
      'audio/wav'
    );
  });

  it('parses large base64 payload split across multiple arbitrary chunks', async () => {
    const largeBase64 = 'A'.repeat(500000);
    const dummyGen = {
      id: 'gen-large',
      snippetId: 'snip-large',
      text: 'Long audio snippet text here.',
      audioData: largeBase64,
      audioMimeType: 'audio/wav',
      duration: 120.5,
      timestamp: 1700000000000
    };

    const sidecarJson = JSON.stringify({
      version: 1,
      exportedAt: 1700000002000,
      generations: [dummyGen]
    });

    const encoder = new TextEncoder();
    const bytes = encoder.encode(sidecarJson);

    const chunkSize = 16384;
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i += chunkSize) {
      chunks.push(bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      }
    });

    let savedAudioData = '';
    const onSaveAudio = vi.fn(async (_id: string, data: string) => {
      savedAudioData = data;
    });

    const result = await parseSidecarStream(stream, bytes.length, { onSaveAudio });

    expect(result.importedGenerations.length).toBe(1);
    expect(result.importedGenerations[0].id).toBe('gen-large');
    expect(result.importedGenerations[0].duration).toBe(120.5);
    expect(onSaveAudio).toHaveBeenCalledTimes(1);
    expect(savedAudioData.length).toBe(500000);
    expect(savedAudioData).toBe(largeBase64);
  });

  it('handles empty generations array cleanly', async () => {
    const sidecarJson = JSON.stringify({
      version: 1,
      exportedAt: 1700000002000,
      generations: []
    });

    const encoder = new TextEncoder();
    const bytes = encoder.encode(sidecarJson);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      }
    });

    const onSaveAudio = vi.fn();
    const result = await parseSidecarStream(stream, bytes.length, { onSaveAudio });

    expect(result.importedGenerations).toEqual([]);
    expect(onSaveAudio).not.toHaveBeenCalled();
  });

  it('reports descriptive error when JSON is invalid or truncated', async () => {
    const malformedJson = '{"version": 1, "generations": [{"id": "gen-1", "snippetId": ';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(malformedJson);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      }
    });

    await expect(parseSidecarStream(stream, bytes.length, {
      onSaveAudio: vi.fn()
    })).rejects.toThrow(/Unexpected end of JSON|parsing error/i);
  });

  it('correctly parses generations containing array snippetId and data field', async () => {
    const rawSidecarJson = `{
  "projectName": "The Roommate Trap",
  "lastUpdate": "2026-08-29T21:55:45.729Z",
  "generations": [
    {
      "id": "f6cdd671-5678-486c-9444-ffdfca69fb36",
      "snippetId": [
        "ca257c7b-789b-491c-a088-85b5251c9f7e"
      ],
      "audioMimeType": "audio/l16; rate=24000; channels=1",
      "duration": 15.24,
      "data": "VGVzdEF1ZGlvQmFzZTY0"
    }
  ]
}`;

    const encoder = new TextEncoder();
    const bytes = encoder.encode(rawSidecarJson);

    // Feed in small 8-byte chunks to test chunk boundary splitting across arrays
    const chunkSize = 8;
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i += chunkSize) {
      chunks.push(bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      }
    });

    const savedAudio: Record<string, { data: string; mimeType: string }> = {};
    const onSaveAudio = vi.fn(async (id: string, data: string, mimeType: string) => {
      savedAudio[id] = { data, mimeType };
    });

    const result = await parseSidecarStream(stream, bytes.length, { onSaveAudio });

    expect(result.importedGenerations.length).toBe(1);
    const gen = result.importedGenerations[0];
    expect(gen.id).toBe('f6cdd671-5678-486c-9444-ffdfca69fb36');
    expect(gen.snippetId).toEqual(['ca257c7b-789b-491c-a088-85b5251c9f7e']);
    expect(gen.duration).toBe(15.24);
    expect(onSaveAudio).toHaveBeenCalledWith(
      'f6cdd671-5678-486c-9444-ffdfca69fb36',
      'VGVzdEF1ZGlvQmFzZTY0',
      'audio/l16; rate=24000; channels=1'
    );
  });
});
