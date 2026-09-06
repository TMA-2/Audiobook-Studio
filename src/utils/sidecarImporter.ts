import { Generation } from '../types';

export interface StreamingImportProgress {
  bytesProcessed: number;
  totalBytes: number;
  percent: number;
  processedCount: number;
}

export interface StreamingImportOptions {
  onSaveAudio: (id: string, audioData: string, audioMimeType: string) => Promise<void>;
  onProgress?: (progress: StreamingImportProgress) => void;
}

export interface StreamingImportResult {
  metadata: {
    version?: number;
    exportedAt?: number;
    [key: string]: unknown;
  };
  importedGenerations: Generation[];
}

/**
 * Parses a sidecar JSON stream chunk-by-chunk to avoid loading large payloads (e.g. 500MB+) into a single JS string.
 * @param stream Readable stream of file bytes
 * @param totalBytes Total file size in bytes
 * @param options Callbacks for saving audio and reporting progress
 * @returns Parsed metadata and lightweight generation records
 */
export async function parseSidecarStream(
  stream: ReadableStream<Uint8Array>,
  totalBytes: number,
  options: StreamingImportOptions
): Promise<StreamingImportResult> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';
  let bytesProcessed = 0;
  let inGenerationsArray = false;
  let inString = false;
  let isEscaped = false;
  let currentItemBuffer = '';
  let itemDepth = 0;
  let processedCount = 0;

  const importedGenerations: Generation[] = [];
  const metadata: Record<string, unknown> = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      bytesProcessed += value.byteLength;
      const textChunk = decoder.decode(value, { stream: true });
      buffer += textChunk;

      if (options.onProgress && totalBytes > 0) {
        options.onProgress({
          bytesProcessed,
          totalBytes,
          percent: Math.min(100, Math.round((bytesProcessed / totalBytes) * 100)),
          processedCount
        });
      }

      if (!inGenerationsArray) {
        const generationsKeyIndex = buffer.indexOf('"generations"');
        if (generationsKeyIndex !== -1) {
          const bracketIndex = buffer.indexOf('[', generationsKeyIndex);
          if (bracketIndex !== -1) {
            const versionMatch = buffer.match(/"version"\s*:\s*([0-9]+)/);
            if (versionMatch) metadata.version = Number(versionMatch[1]);
            const exportedAtMatch = buffer.match(/"exportedAt"\s*:\s*([0-9]+)/);
            if (exportedAtMatch) metadata.exportedAt = Number(exportedAtMatch[1]);

            inGenerationsArray = true;
            buffer = buffer.substring(bracketIndex + 1);
          }
        }
      }

      if (inGenerationsArray && buffer.length > 0) {
        let i = 0;
        let lastProcessedIdx = 0;

        while (i < buffer.length) {
          const char = buffer[i];

          if (isEscaped) {
            isEscaped = false;
            if (itemDepth > 0) {
              currentItemBuffer += char;
            }
            i++;
            continue;
          }

          if (char === '\\') {
            isEscaped = true;
            if (itemDepth > 0) {
              currentItemBuffer += char;
            }
            i++;
            continue;
          }

          if (char === '"') {
            inString = !inString;
            if (itemDepth > 0) {
              currentItemBuffer += char;
            }
            i++;
            continue;
          }

          if (!inString) {
            if (char === '{') {
              if (itemDepth === 0) {
                currentItemBuffer = '{';
                itemDepth = 1;
              } else {
                itemDepth++;
                currentItemBuffer += char;
              }
            } else if (char === '}') {
              itemDepth--;
              currentItemBuffer += char;

              if (itemDepth === 0) {
                let genObj: Record<string, unknown>;
                try {
                  genObj = JSON.parse(currentItemBuffer);
                } catch (err: unknown) {
                  const parseErrMsg = err instanceof Error ? err.message : String(err);
                  throw new Error(`Failed to parse generation object at item #${processedCount + 1}: ${parseErrMsg}`);
                }

                const genId = typeof genObj.id === 'string' ? genObj.id : '';
                const audioData = typeof genObj.data === 'string'
                  ? genObj.data
                  : (typeof genObj.audioData === 'string' ? genObj.audioData : '');
                const audioMimeType = typeof genObj.audioMimeType === 'string' ? genObj.audioMimeType : 'audio/wav';

                if (genId && audioData) {
                  await options.onSaveAudio(genId, audioData, audioMimeType);
                }

                const snippetId = Array.isArray(genObj.snippetId)
                  ? (genObj.snippetId as string[])
                  : (typeof genObj.snippetId === 'string' ? genObj.snippetId : '');

                const lightweightGen: Generation = {
                  id: genId,
                  snippetId,
                  speakerId: typeof genObj.speakerId === 'string' ? genObj.speakerId : null,
                  sceneId: typeof genObj.sceneId === 'string' ? genObj.sceneId : undefined,
                  timestamp: typeof genObj.timestamp === 'number' || typeof genObj.timestamp === 'string' ? genObj.timestamp : Date.now(),
                  duration: typeof genObj.duration === 'number' ? genObj.duration : 0,
                  text: typeof genObj.text === 'string' ? genObj.text : '',
                  model: typeof genObj.model === 'string' ? genObj.model : 'gemini-3.1-flash-tts-preview',
                  audioMimeType,
                  temperature: typeof genObj.temperature === 'number' ? genObj.temperature : undefined,
                  name: typeof genObj.name === 'string' ? genObj.name : undefined
                };

                importedGenerations.push(lightweightGen);
                processedCount++;
                currentItemBuffer = '';
                lastProcessedIdx = i + 1;

                if (options.onProgress && totalBytes > 0) {
                  options.onProgress({
                    bytesProcessed,
                    totalBytes,
                    percent: Math.min(100, Math.round((bytesProcessed / totalBytes) * 100)),
                    processedCount
                  });
                }
              }
            }
            else if (char === ']') {
              if (itemDepth === 0) {
                inGenerationsArray = false;
                lastProcessedIdx = i + 1;
                break;
              }
              else {
                currentItemBuffer += char;
              }
            }
            else {
              if (itemDepth > 0) {
                currentItemBuffer += char;
              }
            }
          }
          else {
            if (itemDepth > 0) {
              currentItemBuffer += char;
            }
          }

          i++;
        }

        if (itemDepth === 0) {
          buffer = buffer.substring(lastProcessedIdx);
        } else {
          buffer = '';
        }
      }
    }

    const remainingText = decoder.decode();
    if (remainingText && itemDepth > 0) {
      throw new Error(`Unexpected end of JSON input while parsing sidecar generations array.`);
    }

    if (itemDepth > 0) {
      throw new Error(`Unexpected end of JSON input while parsing generation object #${processedCount + 1}.`);
    }

    if (options.onProgress && totalBytes > 0) {
      options.onProgress({
        bytesProcessed: totalBytes,
        totalBytes,
        percent: 100,
        processedCount
      });
    }

    return {
      metadata,
      importedGenerations
    };
  } finally {
    reader.releaseLock();
  }
}
