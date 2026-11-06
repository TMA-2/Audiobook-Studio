import { base64ToBlob, blobToBase64 } from '../utils/audioBlob';

const DB_NAME = 'AudiobookStudioDB';
const DB_VERSION = 2;
const STORE_NAME = 'audio_generations';

let dbInstance: IDBDatabase | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Stores generation audio in IndexedDB as a Blob.
 * @param id The generation ID.
 * @param base64Data The base64-encoded audio, decoded to a Blob before storing.
 * @param mimeType The audio mime type.
 * @param duration Duration in seconds.
 * @param sampleRate Sample rate in Hz.
 */
export async function saveAudio(
  id: string, 
  base64Data: string, 
  mimeType: string, 
  duration?: number, 
  sampleRate?: number
): Promise<void> {
  return saveAudioBlob(id, base64ToBlob(base64Data, mimeType), mimeType, duration, sampleRate);
}

/**
 * Stores generation audio that is already a Blob, such as an entry read from an .abs archive.
 * @param id The generation ID.
 * @param blob The audio bytes.
 * @param mimeType The audio mime type.
 * @param duration Duration in seconds.
 * @param sampleRate Sample rate in Hz.
 */
export async function saveAudioBlob(
  id: string,
  blob: Blob,
  mimeType: string,
  duration?: number,
  sampleRate?: number
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id, blob, mimeType, duration, sampleRate });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Reads a stored record. Records saved before Blob storage hold base64Data instead of blob.
 * @param id The generation ID.
 */
async function getRecord(id: string): Promise<any> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Gets generation audio as a base64 string with its metadata.
 * @param id The generation ID.
 */
export async function getAudio(id: string): Promise<{ base64Data: string; mimeType: string; duration?: number; sampleRate?: number } | null> {
  const record = await getRecord(id);
  if (!record) return null;

  return {
    base64Data: record.blob ? await blobToBase64(record.blob) : record.base64Data,
    mimeType: record.mimeType,
    duration: record.duration,
    sampleRate: record.sampleRate
  };
}

/**
 * Gets generation audio as a Blob with its metadata, for writers that don't need base64.
 * @param id The generation ID.
 */
export async function getAudioBlob(id: string): Promise<{ blob: Blob; mimeType: string; duration?: number; sampleRate?: number } | null> {
  const record = await getRecord(id);
  if (!record) return null;

  return {
    blob: record.blob ?? base64ToBlob(record.base64Data, record.mimeType),
    mimeType: record.mimeType,
    duration: record.duration,
    sampleRate: record.sampleRate
  };
}

export async function deleteAudio(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllAudio(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
