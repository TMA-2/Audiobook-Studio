import { GEMINI_MODELS, GEMINI_VOICES, Project, UserPreferences } from '../types';
import { generateId } from '../services/idService';

const SETTINGS_KEYS = [
  'model',
  'encoding',
  'sampleRate',
  'temperature',
  'apiType',
  'generationOption',
  'concatenationOption',
  'promptTemplate',
  'sheetsLoggingEnabled',
  'sheetsLoggingSpreadsheetId',
  'sheetsLoggingSpreadsheetUrl'
] as const;

/**
 * Copies only the settings keys that belong in a project file. apiKey is never included.
 * @param settings The settings object to filter.
 */
function pickSettings(settings: any): Record<string, any> {
  const picked: Record<string, any> = {};
  for (const key of SETTINGS_KEYS) {
    if (settings?.[key] !== undefined) {
      picked[key] = settings[key];
    }
  }
  return picked;
}

export const PROJECT_FILE_VERSION = 4;

const hasSheetTarget = (s: any) => !!(s?.sheetsLoggingSpreadsheetId || s?.sheetsLoggingSpreadsheetUrl);

/**
 * Combines project and global sheets logging settings. The project's sheet wins;
 * the global preference is the fallback. A project sheet turns logging on unless the project disables it.
 * @param settings The project settings.
 * @param prefs The global user preferences.
 */
export function resolveSheetsLogging(settings: Project['settings'], prefs: UserPreferences): UserPreferences {
  if (!hasSheetTarget(settings)) {
    return prefs;
  }

  const urlId = settings.sheetsLoggingSpreadsheetUrl?.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  return {
    ...prefs,
    sheetsSpreadsheetId: settings.sheetsLoggingSpreadsheetId || urlId,
    sheetsSpreadsheetUrl: settings.sheetsLoggingSpreadsheetUrl,
    sheetsLoggingEnabled: settings.sheetsLoggingEnabled ?? true
  };
}

/**
 * Lists the unique generation IDs in a project, which are the audio entries an .abs archive needs.
 * @param project The project to scan.
 */
export function collectGenerationIds(project: Project): string[] {
  const ids = new Set<string>();
  for (const chapter of project.chapters) {
    for (const snippet of chapter.snippets) {
      for (const gen of snippet.generations ?? []) {
        ids.add(gen.id);
      }
    }
  }
  return [...ids];
}

/**
 * Converts an in-memory project into the JSON shape written to project files.
 * @param project The project to serialize.
 */
export function projectToFile(project: Project): any {
  return {
    version: PROJECT_FILE_VERSION,
    projectName: project.title,
    settings: pickSettings(project.settings),
    speakers: project.speakers.map(s => ({
      id: s.id,
      order: s.order,
      name: s.name,
      voice: s.voice,
      instructions: s.style,
      role: s.role,
      isNarrator: s.isNarrator
    })),
    scenes: (project.scenes || []).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      order: s.order
    })),
    chapters: project.chapters.map(c => ({
      id: c.id,
      name: c.title,
      order: c.order,
      globalSpeaker: c.defaultSpeakerId,
      collapsed: c.isCollapsed,
      content: c.snippets.map(s => ({
        id: s.id,
        speaker: s.speakerId,
        sceneId: s.sceneId,
        order: s.order,
        collapsed: s.isCollapsed,
        text: s.text.split('\n'),
        generations: s.generations,
        activeGenerationId: s.activeGenerationId
      }))
    }))
  };
}

/**
 * Converts parsed project file JSON into an in-memory project.
 * @param data The parsed contents of a project file.
 */
export function fileToProject(data: any): Project {
  // Files without a version field are v3
  const version = data.version ?? 3;
  if (version > PROJECT_FILE_VERSION) {
    throw new Error(`Project file version ${version} is newer than this app supports (${PROJECT_FILE_VERSION}).`);
  }

  const settings = {
    ...pickSettings(data.settings),
    model: data.settings?.model || GEMINI_MODELS[0],
    encoding: data.settings?.encoding || 'M4A',
    sampleRate: String(data.settings?.sampleRate || '24000')
  } as any;
  if (hasSheetTarget(settings) && settings.sheetsLoggingEnabled === undefined) {
    settings.sheetsLoggingEnabled = true;
  }

  return {
    title: data.projectName || 'Imported Project',
    settings,
    speakers: (data.speakers || []).map((s: any, i: number) => ({
      id: s.id || generateId(),
      name: s.name || '',
      order: s.order ?? i,
      voice: s.voice || GEMINI_VOICES[0].id,
      style: s.instructions || '',
      role: s.role || undefined,
      isNarrator: !!s.isNarrator
    })),
    scenes: (data.scenes || []).map((s: any, i: number) => ({
      id: s.id || generateId(),
      name: s.name || '',
      description: s.description || '',
      order: s.order ?? i
    })),
    chapters: (data.chapters || []).map((c: any, i: number) => ({
      id: c.id || generateId(),
      title: c.name || 'Untitled Chapter',
      order: c.order ?? i,
      defaultSpeakerId: c.globalSpeaker || null,
      isCollapsed: !!c.collapsed,
      snippets: (c.content || []).map((s: any, j: number) => ({
        id: s.id || generateId(),
        text: Array.isArray(s.text) ? s.text.join('\n') : (s.text || ''),
        speakerId: s.speaker || null,
        sceneId: s.sceneId || null,
        order: s.order ?? j,
        status: s.activeGenerationId ? 'done' : 'idle',
        generations: s.generations || [],
        activeGenerationId: s.activeGenerationId || null,
        isCollapsed: !!s.collapsed
      }))
    }))
  };
}
