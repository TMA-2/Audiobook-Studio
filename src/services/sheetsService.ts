/**
 * Google Sheets Generation Logger Service
 * 
 * Provides functions to format, authenticate, validate, and append TTS generation metrics
 * to a dedicated Google Sheet ("AudiobookStudioLog yyyy") with monthly tabs.
 */

export interface GenerationLogPayload {
  timestamp: number;
  status: number | string;
  statusMessage: string;
  responseTimeMs: number;
  projectName: string;
  chapterName: string;
  speaker1: string;
  voice1: string;
  speaker2?: string;
  voice2?: string;
  model: string;
  temperature: number;
  snippetStart: number;
  snippetEnd: number;
  textChars: number;
  textWords: number;
  promptChars: number;
  promptWords: number;
  requestTokens: number;
  responseTokens: number;
  audioDurationMs: number;
  audioSizeBytes: number;
  note?: string;
}

/**
 * Returns standard spreadsheet file title for a given date, e.g. "AudiobookStudioLog 2026".
 * 
 * @param date The date to format.
 */
export function formatSpreadsheetTitle(date: Date = new Date()): string {
  return `AudiobookStudioLog ${date.getUTCFullYear()}`;
}

/**
 * Returns the month sheet/tab title for a given date, e.g. "2026-08".
 * 
 * @param date The date to format.
 */
export function formatMonthSheetName(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns the standard column headers matching specification.
 */
export function buildHeaderRow(): string[] {
  return [
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
  ];
}

/**
 * Maps a GenerationLogPayload into the ordered array of cell values.
 * 
 * @param payload The generation log metrics.
 */
export function buildLogRow(payload: GenerationLogPayload): (string | number)[] {
  return [
    payload.timestamp,
    payload.status,
    payload.statusMessage,
    payload.responseTimeMs,
    payload.projectName,
    payload.chapterName,
    payload.speaker1 || 'n/a',
    payload.voice1 || 'n/a',
    payload.speaker2 || 'n/a',
    payload.voice2 || 'n/a',
    payload.model,
    payload.temperature,
    payload.snippetStart,
    payload.snippetEnd,
    payload.textChars,
    payload.textWords,
    payload.promptChars,
    payload.promptWords,
    payload.requestTokens,
    payload.responseTokens,
    payload.audioDurationMs,
    payload.audioSizeBytes,
    payload.note || ''
  ];
}

/**
 * Creates a new spreadsheet or verifies existing month tab with headers.
 * 
 * @param accessToken Valid Google OAuth token with spreadsheets scope.
 * @param title Optional spreadsheet title.
 */
export async function createOrGetSpreadsheet(
  accessToken: string,
  title?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const defaultTitle = title || formatSpreadsheetTitle();
  const monthSheetName = formatMonthSheetName();

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: defaultTitle
      },
      sheets: [
        {
          properties: {
            title: monthSheetName
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: buildHeaderRow().map(header => ({
                    userEnteredValue: { stringValue: header }
                  }))
                }
              ]
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Failed to create Google Spreadsheet: ${response.status} ${errBody}`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
  };
}

/**
 * Ensures the target month sheet exists with headers in an existing spreadsheet.
 * 
 * @param accessToken Valid Google OAuth token.
 * @param spreadsheetId Target spreadsheet ID.
 * @param monthSheetName Tab name (e.g. "2026-08").
 */
export async function ensureMonthSheet(
  accessToken: string,
  spreadsheetId: string,
  monthSheetName: string
): Promise<void> {
  // Check existing sheets
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!metaRes.ok) return;
  const meta = await metaRes.json();
  const exists = meta.sheets?.some((s: any) => s.properties?.title === monthSheetName);

  if (!exists) {
    // Add new sheet tab
    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: monthSheetName
              }
            }
          }
        ]
      })
    });

    if (addRes.ok) {
      // Append headers
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(monthSheetName)}!A1:W1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [buildHeaderRow()]
        })
      });
    }
  }
}

/**
 * Appends a single generation log row to the target spreadsheet.
 * 
 * @param accessToken Valid Google OAuth token.
 * @param spreadsheetId Google Spreadsheet ID.
 * @param payload Log metrics payload.
 * @param date Optional date for determining target month tab.
 */
export async function appendGenerationLogToSheet(
  accessToken: string,
  spreadsheetId: string,
  payload: GenerationLogPayload,
  date: Date = new Date()
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken || !spreadsheetId) {
    return { success: false, error: 'Missing access token or spreadsheet ID.' };
  }

  const monthSheetName = formatMonthSheetName(date);
  const rowValues = buildLogRow(payload);

  try {
    const encodedRange = encodeURIComponent(`${monthSheetName}!A:W`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowValues]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      // If error is due to missing sheet tab, try creating it and retry once
      if (response.status === 400 && errText.includes('Unable to parse range')) {
        await ensureMonthSheet(accessToken, spreadsheetId, monthSheetName);
        const retryRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [rowValues]
          })
        });
        if (retryRes.ok) {
          return { success: true };
        }
      }
      return { success: false, error: `Google Sheets API error: ${response.status} ${errText}` };
    }

    return { success: true };
  }
  catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
