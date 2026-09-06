import { describe, it, expect, vi } from 'vitest';
import {
  formatMonthSheetName,
  formatSpreadsheetTitle,
  buildHeaderRow,
  buildLogRow,
  createOrGetSpreadsheet,
  appendGenerationLogToSheet,
  type GenerationLogPayload
} from '../src/services/sheetsService';

describe('sheetsService', () => {
  it('formats spreadsheet title and month sheet tab name correctly', () => {
    const testDate = new Date('2026-08-31T15:30:00Z');
    expect(formatSpreadsheetTitle(testDate)).toBe('AudiobookStudioLog 2026');
    expect(formatMonthSheetName(testDate)).toBe('2026-08');
  });

  it('builds the correct standard header row matching specification', () => {
    const headers = buildHeaderRow();
    expect(headers).toEqual([
      'Timestamp',
      'Status',
      'Status Message',
      'Response Time (ms)',
      'Project',
      'Chapter',
      'Speaker 1',
      'Voice 1',
      'Speaker 2',
      'Voice 2',
      'Model',
      'Temperature',
      'Snippet Start',
      'Snippet End',
      'Text Chars',
      'Text Words',
      'Prompt Chars',
      'Prompt Words',
      'Request Tokens',
      'Response Tokens',
      'Audio Duration (ms)',
      'Audio Size (bytes)',
      'Note'
    ]);
  });

  it('builds a correctly ordered log row from payload', () => {
    const payload: GenerationLogPayload = {
      timestamp: 1788190450974,
      status: 200,
      statusMessage: 'OK',
      responseTimeMs: 23057,
      projectName: 'Why I Believe In Otokonoko',
      chapterName: 'Chapter 105: This Is Still Going?',
      speaker1: 'Narrator',
      voice1: 'Charon',
      speaker2: 'n/a',
      voice2: 'n/a',
      model: 'gemini-3.1-flash-tts-preview',
      temperature: 1.0,
      snippetStart: 2,
      snippetEnd: 5,
      textChars: 535,
      textWords: 107,
      promptChars: 935,
      promptWords: 187,
      requestTokens: 133,
      responseTokens: 250,
      audioDurationMs: 46513,
      audioSizeBytes: 2083200,
      note: ''
    };

    const row = buildLogRow(payload);
    expect(row).toEqual([
      1788190450974,
      200,
      'OK',
      23057,
      'Why I Believe In Otokonoko',
      'Chapter 105: This Is Still Going?',
      'Narrator',
      'Charon',
      'n/a',
      'n/a',
      'gemini-3.1-flash-tts-preview',
      1.0,
      2,
      5,
      535,
      107,
      935,
      187,
      133,
      250,
      46513,
      2083200,
      ''
    ]);
  });

  it('appends log row via Google Sheets API fetch call', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ updates: { updatedRows: 1 } })
    });
    global.fetch = mockFetch;

    const payload: GenerationLogPayload = {
      timestamp: 1788190450974,
      status: 200,
      statusMessage: 'OK',
      responseTimeMs: 1200,
      projectName: 'Test Project',
      chapterName: 'Chapter 1',
      speaker1: 'Narrator',
      voice1: 'Puck',
      speaker2: '',
      voice2: '',
      model: 'gemini-3.1-flash-tts-preview',
      temperature: 1.0,
      snippetStart: 1,
      snippetEnd: 1,
      textChars: 100,
      textWords: 20,
      promptChars: 200,
      promptWords: 40,
      requestTokens: 50,
      responseTokens: 100,
      audioDurationMs: 5000,
      audioSizeBytes: 100000,
      note: 'test note'
    };

    const result = await appendGenerationLogToSheet('fake-token', 'sheet-123', payload, new Date('2026-08-31T00:00:00Z'));
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`https://sheets.googleapis.com/v4/spreadsheets/sheet-123/values/${encodeURIComponent('2026-08!A:W')}:append?valueInputOption=USER_ENTERED`),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-token'
        })
      })
    );
  });
});
