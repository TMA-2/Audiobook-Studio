import { Zip, ZipPassThrough, Unzip, UnzipPassThrough } from 'fflate';

const READ_CHUNK = 1024 * 1024;
const PROJECT_ENTRY = 'project.json';
const GENERATIONS_DIR = 'generations/';

/**
 * Picks the file extension for an audio mime type.
 * @param mimeType The generation's audio mime type.
 */
export function audioExtension(mimeType: string): string {
  const type = mimeType.toLowerCase();
  if (type.includes('l16')) return 'pcm';
  if (type.includes('wav')) return 'wav';
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3';
  if (type.includes('mp4') || type.includes('m4a') || type.includes('aac')) return 'm4a';
  if (type.includes('ogg')) return 'ogg';
  return 'bin';
}

/**
 * Collects the id -> mime type map from the generations listed in a project.json object.
 * @param project The parsed project.json.
 */
function collectMimeTypes(project: any): Map<string, string> {
  const map = new Map<string, string>();
  for (const chapter of project.chapters ?? []) {
    for (const snippet of chapter.content ?? []) {
      for (const gen of snippet.generations ?? []) {
        if (gen.id && gen.audioMimeType) {
          map.set(gen.id, gen.audioMimeType);
        }
      }
    }
  }
  return map;
}

/**
 * Writes an .abs archive (a zip with uncompressed entries) in chunks.
 * project.json is written first, then generations/<id>.<ext> for each audio ID.
 * Audio is read from each Blob in 1 MB slices so a full archive is never held in memory.
 * @param project The project.json contents.
 * @param audioIds IDs of the generations to include.
 * @param getAudio Returns the audio Blob for a generation ID.
 * @param write Receives each chunk of the archive in order; the next chunk waits for it to finish.
 */
export async function writeAbs(
  project: object,
  audioIds: string[],
  getAudio: (id: string) => Promise<Blob | null>,
  write: (chunk: Uint8Array) => void | Promise<void>
): Promise<void> {
  const mimeTypes = collectMimeTypes(project);
  const pending: Uint8Array[] = [];
  let failure: Error | null = null;
  let finished = false;

  const zip = new Zip((err, chunk, final) => {
    if (err) {
      failure = err;
      return;
    }
    pending.push(chunk);
    if (final) finished = true;
  });

  const drain = async () => {
    if (failure) throw failure;
    while (pending.length > 0) {
      await write(pending.shift()!);
    }
  };

  const projectEntry = new ZipPassThrough(PROJECT_ENTRY);
  zip.add(projectEntry);
  projectEntry.push(new TextEncoder().encode(JSON.stringify(project, null, 2)), true);
  await drain();

  for (const id of audioIds) {
    const blob = await getAudio(id);
    if (!blob) continue;

    const entry = new ZipPassThrough(`${GENERATIONS_DIR}${id}.${audioExtension(mimeTypes.get(id) ?? blob.type)}`);
    zip.add(entry);
    for (let offset = 0; offset < blob.size; offset += READ_CHUNK) {
      const slice = new Uint8Array(await blob.slice(offset, offset + READ_CHUNK).arrayBuffer());
      entry.push(slice, offset + READ_CHUNK >= blob.size);
      await drain();
    }
    if (blob.size === 0) {
      entry.push(new Uint8Array(0), true);
      await drain();
    }
  }

  zip.end();
  await drain();
  if (!finished) throw new Error('Archive writer did not finish.');
}

/**
 * Reads an .abs archive. project.json must be the first entry (writeAbs guarantees this).
 * Each audio entry is passed to onAudio as a Blob with the mime type recorded in project.json.
 * @param file The archive.
 * @param onAudio Called once per generations/<id>.<ext> entry.
 * @param onProgress Called after each chunk with bytes read, total bytes and audio entries restored so far.
 * @returns The parsed project.json.
 */
export async function readAbs(
  file: Blob,
  onAudio: (id: string, blob: Blob, mimeType: string) => Promise<void>,
  onProgress?: (bytesRead: number, totalBytes: number, audioCount: number) => void
): Promise<object> {
  let project: any = null;
  let mimeTypes = new Map<string, string>();
  let failure: Error | null = null;
  let audioCount = 0;
  const completed: Promise<void>[] = [];

  const unzip = new Unzip((entry) => {
    const chunks: Uint8Array[] = [];
    const isProject = entry.name === PROJECT_ENTRY;
    const isAudio = entry.name.startsWith(GENERATIONS_DIR);
    if (!isProject && !isAudio) return;

    entry.ondata = (err, data, final) => {
      if (err) {
        failure = err;
        return;
      }
      chunks.push(data);
      if (!final) return;

      if (isProject) {
        project = JSON.parse(new TextDecoder().decode(concat(chunks)));
        mimeTypes = collectMimeTypes(project);
        return;
      }

      if (!project) {
        failure = new Error('project.json must be the first entry in the archive.');
        return;
      }
      const id = entry.name.slice(GENERATIONS_DIR.length).replace(/\.[^.]+$/, '');
      const mimeType = mimeTypes.get(id) ?? '';
      completed.push(onAudio(id, new Blob(chunks as BlobPart[], { type: mimeType }), mimeType).then(() => { audioCount++; }));
    };
    entry.start();
  });
  unzip.register(UnzipPassThrough);

  for (let offset = 0; offset < file.size; offset += READ_CHUNK) {
    const slice = new Uint8Array(await file.slice(offset, offset + READ_CHUNK).arrayBuffer());
    unzip.push(slice, offset + READ_CHUNK >= file.size);
    if (failure) throw failure;
    onProgress?.(Math.min(offset + READ_CHUNK, file.size), file.size, audioCount);
  }

  await Promise.all(completed);
  onProgress?.(file.size, file.size, audioCount);
  if (!project) throw new Error('Archive has no project.json.');
  return project;
}

/**
 * Joins byte chunks into one array.
 * @param chunks The chunks to join.
 */
function concat(chunks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}
