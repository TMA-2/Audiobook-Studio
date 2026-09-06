import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logGenerationEvent, createLogPayloadFromGeneration } from '../src/utils/generationLogger';
import * as sheetsService from '../src/services/sheetsService';
import * as googleAuthService from '../src/services/googleAuthService';

describe('generationLogger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  it('creates a formatted log payload from successful generation parameters', () => {
    const payload = createLogPayloadFromGeneration({
      status: 200,
      statusMessage: 'OK',
      responseTimeMs: 1500,
      projectName: 'My Novel',
      chapterName: 'Chapter 1',
      speakers: [{ name: 'Narrator', voice: 'Puck' }],
      model: 'gemini-3.1-flash-tts-preview',
      temperature: 1.0,
      snippetStart: 1,
      snippetEnd: 1,
      rawText: 'Hello world from audiobook studio.',
      promptText: 'System Prompt\nHello world from audiobook studio.',
      promptTokens: 20,
      responseTokens: 50,
      audioDurationMs: 3200,
      audioSizeBytes: 153600
    });

    expect(payload.status).toBe(200);
    expect(payload.statusMessage).toBe('OK');
    expect(payload.projectName).toBe('My Novel');
    expect(payload.chapterName).toBe('Chapter 1');
    expect(payload.speaker1).toBe('Narrator');
    expect(payload.voice1).toBe('Puck');
    expect(payload.textChars).toBe(34);
    expect(payload.textWords).toBe(5);
    expect(payload.promptChars).toBe(48);
    expect(payload.promptWords).toBe(7);
    expect(payload.audioDurationMs).toBe(3200);
    expect(payload.audioSizeBytes).toBe(153600);
  });

  it('triggers sheets append when user has logging enabled and auth token available', async () => {
    vi.spyOn(googleAuthService, 'getCachedGoogleToken').mockReturnValue('valid-token');
    const appendSpy = vi.spyOn(sheetsService, 'appendGenerationLogToSheet').mockResolvedValue({ success: true });

    const payload = createLogPayloadFromGeneration({
      status: 200,
      statusMessage: 'OK',
      responseTimeMs: 1200,
      projectName: 'Test',
      chapterName: 'Ch 1',
      speakers: [{ name: 'Narrator', voice: 'Fenrir' }],
      model: 'gemini-3.1-flash-tts-preview',
      temperature: 1.0,
      snippetStart: 1,
      snippetEnd: 1,
      rawText: 'Test phrase',
      promptText: 'Test prompt phrase',
      promptTokens: 10,
      responseTokens: 20,
      audioDurationMs: 1000,
      audioSizeBytes: 48000
    });

    await logGenerationEvent(payload, {
      sheetsLoggingEnabled: true,
      sheetsSpreadsheetId: 'sheet-456'
    });

    expect(appendSpy).toHaveBeenCalledWith('valid-token', 'sheet-456', payload);
  });

  it('bypasses sheets append gracefully when logging is disabled or spreadsheetId is missing', async () => {
    const appendSpy = vi.spyOn(sheetsService, 'appendGenerationLogToSheet').mockResolvedValue({ success: true });

    const payload = createLogPayloadFromGeneration({
      status: 200,
      statusMessage: 'OK',
      responseTimeMs: 1200,
      projectName: 'Test',
      chapterName: 'Ch 1',
      speakers: [{ name: 'Narrator', voice: 'Fenrir' }],
      model: 'gemini-3.1-flash-tts-preview',
      temperature: 1.0,
      snippetStart: 1,
      snippetEnd: 1,
      rawText: 'Test phrase',
      promptText: 'Test prompt phrase',
      promptTokens: 10,
      responseTokens: 20,
      audioDurationMs: 1000,
      audioSizeBytes: 48000
    });

    await logGenerationEvent(payload, {
      sheetsLoggingEnabled: false,
      sheetsSpreadsheetId: 'sheet-456'
    });

    expect(appendSpy).not.toHaveBeenCalled();
  });
});
