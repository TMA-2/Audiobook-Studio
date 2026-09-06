import { GenerationLogPayload, appendGenerationLogToSheet } from '../services/sheetsService';
import { getCachedGoogleToken } from '../services/googleAuthService';
import { UserPreferences } from '../types';

export interface CreateLogPayloadOptions {
  status: number | string;
  statusMessage: string;
  responseTimeMs: number;
  projectName: string;
  chapterName: string;
  speakers: Array<{ name: string; voice: string }>;
  model: string;
  temperature: number;
  snippetStart: number;
  snippetEnd: number;
  rawText: string;
  promptText: string;
  promptTokens?: number;
  responseTokens?: number;
  audioDurationMs?: number;
  audioSizeBytes?: number;
  note?: string;
}

/**
 * Constructs a normalized GenerationLogPayload from generation execution metrics.
 * 
 * @param options The raw generation parameters and metrics.
 */
export function createLogPayloadFromGeneration(options: CreateLogPayloadOptions): GenerationLogPayload {
  const speaker1 = options.speakers[0]?.name || 'n/a';
  const voice1 = options.speakers[0]?.voice || 'n/a';
  const speaker2 = options.speakers[1]?.name || 'n/a';
  const voice2 = options.speakers[1]?.voice || 'n/a';

  const rawTextClean = (options.rawText || '').trim();
  const promptTextClean = (options.promptText || '').trim();

  const textChars = rawTextClean.length;
  const textWords = rawTextClean ? rawTextClean.split(/\s+/g).length : 0;

  const promptChars = promptTextClean.length;
  const promptWords = promptTextClean ? promptTextClean.split(/\s+/g).length : 0;

  return {
    timestamp: Date.now(),
    status: options.status,
    statusMessage: options.statusMessage,
    responseTimeMs: options.responseTimeMs,
    projectName: options.projectName,
    chapterName: options.chapterName,
    speaker1,
    voice1,
    speaker2,
    voice2,
    model: options.model,
    temperature: options.temperature,
    snippetStart: options.snippetStart,
    snippetEnd: options.snippetEnd,
    textChars,
    textWords,
    promptChars,
    promptWords,
    requestTokens: options.promptTokens || 0,
    responseTokens: options.responseTokens || 0,
    audioDurationMs: options.audioDurationMs || 0,
    audioSizeBytes: options.audioSizeBytes || 0,
    note: options.note || ''
  };
}

/**
 * Asynchronously logs a generation event to Google Sheets if user preferences permit.
 * Executes without blocking audio playback.
 * 
 * @param payload The structured log row.
 * @param preferences User preferences containing sheets logging configuration.
 */
export async function logGenerationEvent(
  payload: GenerationLogPayload,
  preferences: UserPreferences
): Promise<void> {
  if (!preferences.sheetsLoggingEnabled || !preferences.sheetsSpreadsheetId) {
    return;
  }

  const token = getCachedGoogleToken();
  if (!token) {
    console.debug('[SheetsLogger] Google OAuth token not currently active in memory. Skipping sheet append.');
    return;
  }

  try {
    const res = await appendGenerationLogToSheet(token, preferences.sheetsSpreadsheetId, payload);
    if (!res.success) {
      console.warn('[SheetsLogger] Failed to append generation row to sheet:', res.error);
    }
  }
  catch (err) {
    console.warn('[SheetsLogger] Exception while logging to Google Sheets:', err);
  }
}
