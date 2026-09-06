import { Project } from '../types';

export interface SidecarGenerationItem {
  id: string;
  snippetId: string[];
  audioMimeType: string;
  duration?: number;
  data: string;
}

/**
 * Formats the sidecar JSON header chunk.
 * @param projectName Name of the project
 * @param lastUpdate ISO timestamp string
 * @returns Header JSON string
 */
export function formatSidecarHeader(projectName: string, lastUpdate: string): string {
  return `{\n  "projectName": ${JSON.stringify(projectName)},\n  "lastUpdate": ${JSON.stringify(lastUpdate)},\n  "generations": [\n`;
}

/**
 * Formats an individual generation item for sidecar JSON.
 * @param item Generation item with audio data
 * @param isFirst Whether this is the first item in the array
 * @returns Formatted JSON snippet
 */
export function formatSidecarItem(item: SidecarGenerationItem, isFirst: boolean): string {
  const json = JSON.stringify(item, null, 4)
    .split('\n')
    .map(line => '    ' + line)
    .join('\n');
  return isFirst ? json : ',\n' + json;
}

/**
 * Formats the sidecar JSON footer chunk.
 * @returns Footer JSON string
 */
export function formatSidecarFooter(): string {
  return '\n  ]\n}\n';
}

/**
 * Streams the sidecar export directly to disk or via Blob chunk assembly without keeping all audio buffers in a single JS object.
 * @param project The current active Project
 * @param getAudioFn Async function retrieving individual audio data from IndexedDB
 * @param onProgress Callback invoked after processing each generation
 */
export async function exportSidecarStream(
  project: Project,
  getAudioFn: (id: string) => Promise<{ base64Data: string; mimeType: string; duration?: number; sampleRate?: number } | null>,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const generationMap = new Map<string, {
    id: string;
    snippetIds: Set<string>;
    audioMimeType: string;
    duration?: number;
  }>();

  for (const chapter of project.chapters) {
    for (const snippet of chapter.snippets) {
      for (const gen of snippet.generations) {
        let entry = generationMap.get(gen.id);
        if (!entry) {
          entry = {
            id: gen.id,
            snippetIds: new Set<string>(),
            audioMimeType: gen.audioMimeType,
            duration: gen.duration
          };
          generationMap.set(gen.id, entry);
        }
        if (snippet.id) {
          entry.snippetIds.add(snippet.id);
        }
        else if (gen.snippetId) {
          if (Array.isArray(gen.snippetId)) {
            gen.snippetId.forEach(id => entry.snippetIds.add(id));
          }
          else {
            entry.snippetIds.add(gen.snippetId);
          }
        }
      }
    }
  }

  const targets = Array.from(generationMap.values()).map(entry => ({
    id: entry.id,
    snippetId: Array.from(entry.snippetIds),
    audioMimeType: entry.audioMimeType,
    duration: entry.duration
  }));

  const safeTitle = (project.title || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project';
  const fileName = `${safeTitle}.audio.json`;

  let fileHandle: any = null;
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'Audio Sidecar JSON',
          accept: { 'application/json': ['.json'] }
        }]
      });
    }
    catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      fileHandle = null;
    }
  }

  const lastUpdate = new Date().toISOString();

  if (fileHandle) {
    const writable = await fileHandle.createWritable();
    await writable.write(formatSidecarHeader(project.title, lastUpdate));

    let exportedCount = 0;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const audio = await getAudioFn(target.id);
      if (audio) {
        const item: SidecarGenerationItem = {
          id: target.id,
          snippetId: target.snippetId,
          audioMimeType: target.audioMimeType || audio.mimeType || 'audio/wav',
          duration: target.duration !== undefined ? target.duration : audio.duration,
          data: audio.base64Data
        };
        await writable.write(formatSidecarItem(item, exportedCount === 0));
        exportedCount++;
      }
      if (onProgress) {
        onProgress(i + 1, targets.length);
      }
    }

    await writable.write(formatSidecarFooter());
    await writable.close();
  }
  else {
    const chunks: Blob[] = [];
    chunks.push(new Blob([formatSidecarHeader(project.title, lastUpdate)], { type: 'application/json' }));

    let exportedCount = 0;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const audio = await getAudioFn(target.id);
      if (audio) {
        const item: SidecarGenerationItem = {
          id: target.id,
          snippetId: target.snippetId,
          audioMimeType: target.audioMimeType || audio.mimeType || 'audio/wav',
          duration: target.duration !== undefined ? target.duration : audio.duration,
          data: audio.base64Data
        };
        chunks.push(new Blob([formatSidecarItem(item, exportedCount === 0)], { type: 'application/json' }));
        exportedCount++;
      }
      if (onProgress) {
        onProgress(i + 1, targets.length);
      }
    }

    chunks.push(new Blob([formatSidecarFooter()], { type: 'application/json' }));

    const finalBlob = new Blob(chunks, { type: 'application/json' });
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}
