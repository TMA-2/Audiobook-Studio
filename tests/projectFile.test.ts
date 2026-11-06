import { describe, it, expect } from 'vitest';
import { projectToFile, fileToProject, resolveSheetsLogging, PROJECT_FILE_VERSION, collectGenerationIds } from '../src/utils/projectFile';

const project: any = {
  title: 'T',
  settings: { model: 'gemini-3.1-flash-tts-preview', encoding: 'M4A', sampleRate: '24000' },
  speakers: [{ id: 'a', order: 0, name: 'Eva', voice: 'Pulcherrima', style: 'moody', role: 'Protagonist', isNarrator: true }],
  scenes: [],
  chapters: []
};

describe('projectFile speakers', () => {
  it('writes role to the file', () => {
    expect(projectToFile(project).speakers[0].role).toBe('Protagonist');
  });

  it('round-trips role through export and import', () => {
    const result = fileToProject(JSON.parse(JSON.stringify(projectToFile(project))));
    expect(result.speakers[0].role).toBe('Protagonist');
    expect(result.speakers[0].style).toBe('moody');
  });
});

describe('projectFile settings allowlist', () => {
  const withSettings = (settings: any) => ({ ...project, settings });

  it('never writes apiKey or unlisted settings', () => {
    const out = projectToFile(withSettings({ ...project.settings, apiKey: 'secret', bitRate: '128k', audioExportFormat: 'MP3', junk: 1 }));
    expect(out.settings).not.toHaveProperty('apiKey');
    expect(out.settings).not.toHaveProperty('bitRate');
    expect(out.settings).not.toHaveProperty('audioExportFormat');
    expect(out.settings).not.toHaveProperty('junk');
  });

  it('round-trips the allowlisted settings', () => {
    const settings = {
      model: 'gemini-3.1-flash-tts-preview',
      encoding: 'M4A',
      sampleRate: '24000',
      temperature: 0.7,
      apiType: 'generateContent',
      generationOption: 'combined',
      concatenationOption: 'per-scene',
      promptTemplate: 'x',
      sheetsLoggingEnabled: true,
      sheetsLoggingSpreadsheetId: 'abc',
      sheetsLoggingSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/abc'
    };
    const result = fileToProject(JSON.parse(JSON.stringify(projectToFile(withSettings(settings)))));
    expect(result.settings).toMatchObject(settings);
  });
});

describe('sheets logging resolution', () => {
  const prefs = { sheetsLoggingEnabled: true, sheetsSpreadsheetId: 'pref-id', sheetsSpreadsheetUrl: 'pref-url' };

  it('uses the project sheet ID over the preference', () => {
    const r = resolveSheetsLogging({ sheetsLoggingSpreadsheetId: 'proj-id' } as any, prefs);
    expect(r.sheetsSpreadsheetId).toBe('proj-id');
    expect(r.sheetsLoggingEnabled).toBe(true);
  });

  it('extracts the ID from a project URL', () => {
    const r = resolveSheetsLogging({ sheetsLoggingSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/url-id/edit' } as any, prefs);
    expect(r.sheetsSpreadsheetId).toBe('url-id');
  });

  it('falls back to the preference when the project has no sheet', () => {
    const r = resolveSheetsLogging({} as any, prefs);
    expect(r.sheetsSpreadsheetId).toBe('pref-id');
    expect(r.sheetsLoggingEnabled).toBe(true);
  });

  it('respects an explicit project opt-out', () => {
    const r = resolveSheetsLogging({ sheetsLoggingSpreadsheetId: 'proj-id', sheetsLoggingEnabled: false } as any, prefs);
    expect(r.sheetsLoggingEnabled).toBe(false);
  });

  it('defaults logging on for a project sheet even if the preference is off', () => {
    const r = resolveSheetsLogging({ sheetsLoggingSpreadsheetId: 'proj-id' } as any, { ...prefs, sheetsLoggingEnabled: false });
    expect(r.sheetsLoggingEnabled).toBe(true);
  });
});

describe('sheets logging import default', () => {
  it('turns logging on when the file has a sheet ID but no enabled flag', () => {
    const r = fileToProject({ settings: { sheetsLoggingSpreadsheetId: 'abc' } });
    expect(r.settings.sheetsLoggingEnabled).toBe(true);
  });

  it('keeps an explicit false', () => {
    const r = fileToProject({ settings: { sheetsLoggingSpreadsheetId: 'abc', sheetsLoggingEnabled: false } });
    expect(r.settings.sheetsLoggingEnabled).toBe(false);
  });

  it('leaves logging unset when there is no sheet', () => {
    const r = fileToProject({ settings: {} });
    expect(r.settings.sheetsLoggingEnabled).toBeUndefined();
  });
});

describe('project file version', () => {
  it('writes version 4', () => {
    expect(PROJECT_FILE_VERSION).toBe(4);
    expect(projectToFile(project).version).toBe(4);
  });

  it('reads a file without a version as v3', () => {
    const r = fileToProject({ projectName: 'Old', settings: { model: { id: 'm', name: 'M' }, sampleRate: 24000 } });
    expect(r.title).toBe('Old');
    expect(r.settings.sampleRate).toBe('24000');
    expect((r.settings.model as any).id).toBe('m');
  });

  it('reads a v4 file with a string model and numeric sampleRate', () => {
    const r = fileToProject({ version: 4, projectName: 'New', settings: { model: 'm', sampleRate: 24000 } });
    expect(r.settings.model).toBe('m');
    expect(r.settings.sampleRate).toBe('24000');
  });

  it('rejects a version newer than this app supports', () => {
    expect(() => fileToProject({ version: 5, projectName: 'Future' })).toThrow(/version 5/);
  });
});

describe('collectGenerationIds', () => {
  it('lists each generation once, including ones shared by several snippets', () => {
    const p: any = { ...project, chapters: [{ snippets: [
      { generations: [{ id: 'g1' }, { id: 'g2' }] },
      { generations: [{ id: 'g1' }] }
    ] }] };
    expect(collectGenerationIds(p).sort()).toEqual(['g1', 'g2']);
  });
});