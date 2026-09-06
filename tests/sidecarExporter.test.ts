import { describe, it, expect, vi } from 'vitest';
import {
  formatSidecarHeader,
  formatSidecarItem,
  formatSidecarFooter,
  SidecarGenerationItem
} from '../src/utils/sidecarExporter';

describe('sidecarExporter', () => {
  it('formats header correctly', () => {
    const header = formatSidecarHeader('My Book', '2026-08-07T00:00:00.000Z');
    expect(header).toContain('"projectName": "My Book"');
    expect(header).toContain('"lastUpdate": "2026-08-07T00:00:00.000Z"');
    expect(header).toContain('"generations": [');
  });

  it('formats minimal first item with snippetId array without leading comma', () => {
    const item: SidecarGenerationItem = {
      id: 'gen-1',
      snippetId: ['snip-1', 'snip-2'],
      audioMimeType: 'audio/wav',
      duration: 1.5,
      data: 'base64data=='
    };

    const formatted = formatSidecarItem(item, true);
    expect(formatted.startsWith(',')).toBe(false);
    expect(formatted).toContain('"id": "gen-1"');
    expect(formatted).toContain('"snip-1"');
    expect(formatted).toContain('"snip-2"');
    expect(formatted).toContain('"data": "base64data=="');
    expect(formatted).not.toContain('"text":');
    expect(formatted).not.toContain('"speakerId":');
  });

  it('formats minimal subsequent item with leading comma', () => {
    const item: SidecarGenerationItem = {
      id: 'gen-2',
      snippetId: ['snip-3'],
      audioMimeType: 'audio/wav',
      duration: 2.0,
      data: 'base64data2=='
    };

    const formatted = formatSidecarItem(item, false);
    expect(formatted.trim().startsWith(',')).toBe(true);
    expect(formatted).toContain('"id": "gen-2"');
    expect(formatted).toContain('"snip-3"');
  });

  it('formats footer correctly', () => {
    const footer = formatSidecarFooter();
    expect(footer.trim()).toBe(']\n}');
  });

  it('exportSidecarStream deduplicates multi-snippet generations', async () => {
    const { exportSidecarStream } = await import('../src/utils/sidecarExporter');
    const mockProject: any = {
      title: 'Deduplication Test',
      chapters: [
        {
          id: 'ch-1',
          snippets: [
            {
              id: 'snip-1',
              generations: [
                { id: 'shared-gen-1', snippetId: 'snip-1', audioMimeType: 'audio/wav', duration: 3.5 }
              ]
            },
            {
              id: 'snip-2',
              generations: [
                { id: 'shared-gen-1', snippetId: 'snip-2', audioMimeType: 'audio/wav', duration: 3.5 }
              ]
            }
          ]
        }
      ]
    };

    const getAudioMock = vi.fn().mockResolvedValue({ base64Data: 'audioB64Data', mimeType: 'audio/wav', duration: 3.5 });
    
    // Mock document element for Blob download fallback
    const clickSpy = vi.fn();
    const docMock = {
      createElement: vi.fn().mockReturnValue({
        click: clickSpy,
        set href(v: string) {},
        set download(v: string) {}
      })
    };
    (global as any).document = docMock;

    let createdBlob: Blob | null = null;
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: any) => {
      createdBlob = blob;
      return 'blob:mock-url';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    await exportSidecarStream(mockProject, getAudioMock);

    expect(getAudioMock).toHaveBeenCalledTimes(1);
    expect(getAudioMock).toHaveBeenCalledWith('shared-gen-1');

    expect(createdBlob).not.toBeNull();
    if (createdBlob) {
      const text = await (createdBlob as Blob).text();
      const parsed = JSON.parse(text);
      expect(parsed.generations).toHaveLength(1);
      expect(parsed.generations[0].id).toEqual('shared-gen-1');
      expect(parsed.generations[0].snippetId).toEqual(['snip-1', 'snip-2']);
      expect(parsed.generations[0].data).toEqual('audioB64Data');
    }

    delete (global as any).document;
  });
});
