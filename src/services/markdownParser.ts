import { Project, Chapter, Snippet, Speaker, Scene, GEMINI_MODELS } from '../types';
import { generateId } from './idService';

// Helper to clean names for robust matching (e.g. "Justin (Narrator)" -> "justin")
function cleanName(name: string): string {
  return name.toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '').trim();
}

function parseMarkdownTable(lines: string[]): Speaker[] {
  const speakers: Speaker[] = [];
  let headers: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.includes('|')) continue;

    const cells = trimmed.split('|').map(c => c.trim());
    if (cells[0] === '') cells.shift();
    if (cells[cells.length - 1] === '') cells.pop();

    if (cells.length < 2) continue;

    // Check if separator row
    if (cells.every(c => c.startsWith('-') || c.startsWith(':') || c.endsWith(':'))) {
      continue;
    }

    if (headers.length === 0) {
      headers = cells.map(h => h.toLowerCase());
      continue;
    }

    const speaker: Partial<Speaker> = { id: generateId(), order: speakers.length, isNarrator: false };
    cells.forEach((cell, idx) => {
      const header = headers[idx];
      if (!header) return;
      if (header.includes('name')) {
        speaker.name = cell;
      } else if (header.includes('voice') || header.includes('model')) {
        speaker.voice = cell;
      } else if (header.includes('narrator')) {
        speaker.isNarrator = ['yes', 'true', '1', '[x]', 'x'].includes(cell.toLowerCase());
      } else if (header.includes('style') || header.includes('instruction')) {
        speaker.style = cell;
      } else if (header.includes('role')) {
        speaker.role = cell;
      } else if (header.includes('pace')) {
        speaker.pace = cell;
      } else if (header.includes('accent')) {
        speaker.accent = cell;
      }
    });

    if (speaker.name) {
      speakers.push({
        id: speaker.id || generateId(),
        order: speaker.order ?? speakers.length,
        name: speaker.name,
        voice: speaker.voice || 'Zephyr',
        style: speaker.style || '',
        isNarrator: !!speaker.isNarrator,
        role: speaker.role,
        pace: speaker.pace,
        accent: speaker.accent
      });
    }
  }
  return speakers;
}

export function parseMarkdown(markdown: string, stripQuotes: boolean = true): Project {
  const lines = markdown.split('\n');
  let title = 'Untitled Audiobook';
  let speakers: Speaker[] = [];
  let chapters: Chapter[] = [];
  let scenes: Scene[] = [];

  let currentSection: 'none' | 'speakers' | 'content' = 'none';
  let currentSpeaker: Speaker | null = null;
  let currentChapter: Chapter | null = null;
  let currentScene: Scene | null = null;
  let parsingSceneContext = false;
  let parsingSceneDescription = false;

  // Pre-pass to find the speakers section and check for table strictly
  let speakersSectionLines: string[] = [];
  let hasTable = false;
  let inSpeakersSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      const secName = trimmed.substring(3).toLowerCase();
      if (secName.includes('speaker') || secName.includes('character') || secName.includes('voice')) {
        inSpeakersSection = true;
        continue;
      } else {
        inSpeakersSection = false;
      }
    }
    if (inSpeakersSection) {
      if (trimmed.startsWith('## ')) {
        inSpeakersSection = false;
        continue;
      }
      speakersSectionLines.push(line);
    }
  }

  // Strict table detection: must have a line with '|' followed by a separator line with '|' and '---'
  for (let i = 0; i < speakersSectionLines.length - 1; i++) {
    const line = speakersSectionLines[i].trim();
    const nextLine = speakersSectionLines[i + 1].trim();
    if (line.includes('|') && nextLine.includes('|') && nextLine.includes('---')) {
      hasTable = true;
      break;
    }
  }

  if (hasTable) {
    speakers = parseMarkdownTable(speakersSectionLines);
  }

  // Main pass
  currentSection = 'none';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      title = trimmed.substring(2).trim();
      currentSection = 'none';
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const secName = trimmed.substring(3).toLowerCase().trim();
      if (secName.includes('speaker') || secName.includes('character') || secName.includes('voice')) {
        currentSection = 'speakers';
        parsingSceneContext = false;
        parsingSceneDescription = false;
        continue;
      } else if (secName.startsWith('scene') || secName.includes('scene:') || secName.includes('scene -')) {
        // Parse scene heading from ## H2
        const finalSceneName = trimmed.replace(/^##\s*Scene:\s*/i, '').replace(/^##\s*Scene\s*-\s*/i, '').replace(/^##\s*Scene\s*/i, '').trim();
        
        currentScene = {
          id: generateId(),
          name: finalSceneName,
          description: '',
          context: '',
          order: scenes.length
        };
        scenes.push(currentScene);
        parsingSceneContext = false;
        parsingSceneDescription = true;
        continue;
      } else if (secName.includes('transcript')) {
        currentSection = 'content';
        parsingSceneContext = false;
        parsingSceneDescription = false;
        continue;
      } else {
        // CRITICAL BUG FIX: We are leaving the speakers section to go to content!
        // Flush the last parsed speaker immediately so it is available in the speakers array
        if (currentSpeaker && !hasTable) {
          speakers.push(currentSpeaker);
          currentSpeaker = null;
        }
        currentSection = 'content';
        parsingSceneContext = false;
        parsingSceneDescription = false;

        if (currentChapter) {
          chapters.push(currentChapter);
        }
        
        const chapterTitle = trimmed.substring(3).trim();

        currentChapter = {
          id: generateId(),
          order: chapters.length,
          title: chapterTitle,
          defaultSpeakerId: null,
          isCollapsed: false,
          snippets: []
        };
        continue;
      }
    }

    if (trimmed.startsWith('### ')) {
      const h3Name = trimmed.substring(4).toLowerCase().trim();
      if (h3Name.includes('context')) {
        parsingSceneContext = true;
        parsingSceneDescription = false;
        continue;
      } else if (h3Name.includes('transcript')) {
        parsingSceneContext = false;
        parsingSceneDescription = false;
        continue;
      } else if (currentSection === 'speakers' && !hasTable) {
        if (currentSpeaker) {
          speakers.push(currentSpeaker);
        }
        const spName = trimmed.substring(4).trim();

        currentSpeaker = {
          id: generateId(),
          order: speakers.length,
          name: spName,
          voice: 'Zephyr',
          style: '',
          isNarrator: false
        };
        continue;
      } else if (currentSection !== 'speakers') {
        // Parse scene heading from ### H3
        const finalSceneName = trimmed.replace(/^###\s*Scene:\s*/i, '').replace(/^###\s*Scene\s*-\s*/i, '').replace(/^###\s*Scene\s*/i, '').trim();
        
        currentScene = {
          id: generateId(),
          name: finalSceneName,
          description: '',
          context: '',
          order: scenes.length
        };
        scenes.push(currentScene);
        parsingSceneContext = false;
        parsingSceneDescription = true;
        continue;
      }
    }

    if (currentSection === 'speakers' && !hasTable) {
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        if (currentSpeaker) {
          const content = trimmed.substring(1).trim();
          const colonIdx = content.indexOf(':');
          if (colonIdx !== -1) {
            const key = content.substring(0, colonIdx).trim().toLowerCase();
            const val = content.substring(colonIdx + 1).trim();

            if (key.includes('voice') || key.includes('model')) {
              currentSpeaker.voice = val;
            } else if (key.includes('style') || key.includes('instruction')) {
              currentSpeaker.style = val;
            } else if (key.includes('role')) {
              currentSpeaker.role = val;
            } else if (key.includes('pace') || key.includes('pacing')) {
              currentSpeaker.pace = val;
            } else if (key.includes('accent')) {
              currentSpeaker.accent = val;
            } else if (key.includes('narrator')) {
              currentSpeaker.isNarrator = ['yes', 'true', '1', '[x]', 'x'].includes(val.toLowerCase());
            }
          }
        }
      }
    }
    else if (currentScene && (parsingSceneDescription || parsingSceneContext)) {
      // Gather Scene Description / Context lines
      const cleanVal = trimmed.trim();
      
      if (parsingSceneContext) {
        currentScene.context = (currentScene.context ? currentScene.context + '\n' : '') + cleanVal;
      } else {
        currentScene.description = (currentScene.description ? currentScene.description + '\n' : '') + cleanVal;
      }
    }
    else if (currentSection === 'content') {
      if (!currentChapter) {
        currentChapter = {
          id: generateId(),
          order: 0,
          title: 'Chapter 1',
          defaultSpeakerId: null,
          isCollapsed: false,
          snippets: []
        };
      }

      // Parse snippet line and match against speakers using cleanName
      let matchedSpeaker: Speaker | null = null;
      let cleanText = trimmed;

      const speakerMatch = trimmed.match(/^([\w .-]+)\s*:\s*/);
      if (speakerMatch) {
        const matchedPrefix = cleanName(speakerMatch[1]);
        for (const sp of speakers) {
          if (cleanName(sp.name) === matchedPrefix) {
            matchedSpeaker = sp;
            cleanText = trimmed.substring(speakerMatch[0].length).trim();
            break;
          }
        }
      }

      // Strip quotes if they wrap the text
      if (stripQuotes) {
        if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
          cleanText = cleanText.substring(1, cleanText.length - 1);
        } else if (cleanText.startsWith('“') && cleanText.endsWith('”')) {
          cleanText = cleanText.substring(1, cleanText.length - 1);
        }
      }

      currentChapter.snippets.push({
        id: generateId(),
        order: currentChapter.snippets.length,
        text: cleanText,
        speakerId: matchedSpeaker ? matchedSpeaker.id : null,
        sceneId: currentScene ? currentScene.id : null,
        status: 'idle',
        generations: [],
        activeGenerationId: null
      });
    }
  }

  // Flush remaining speaker if any (fallback)
  if (currentSpeaker && !hasTable) {
    speakers.push(currentSpeaker);
  }
  // Flush remaining chapter if any
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  // Fallback if no speakers parsed
  if (speakers.length === 0) {
    speakers = [
      {
        id: generateId(),
        order: 0,
        name: 'Narrator',
        voice: 'Zephyr',
        style: 'Clear, steady pace appropriate for a romance audiobook.',
        isNarrator: true
      }
    ];
  }

  // Fallback if no chapters parsed
  if (chapters.length === 0) {
    chapters = [
      {
        id: generateId(),
        order: 0,
        title: 'Chapter 1',
        defaultSpeakerId: speakers[0]?.id || null,
        isCollapsed: false,
        snippets: [
          {
            id: generateId(),
            order: 0,
            text: 'It was a dark and stormy night.',
            speakerId: null,
            sceneId: null,
            status: 'idle',
            isCollapsed: false,
            generations: [],
            activeGenerationId: null
          }
        ]
      }
    ];
  }

  // Set default speaker for chapters if they have narrators
  const defaultNarrator = speakers.find(s => s.isNarrator) || speakers[0];
  chapters.forEach(c => {
    if (!c.defaultSpeakerId && defaultNarrator) {
      c.defaultSpeakerId = defaultNarrator.id;
    }
  });

  return {
    title,
    settings: {
      model: GEMINI_MODELS[0],
      encoding: 'M4A',
      sampleRate: '24000'
    },
    speakers,
    chapters,
    scenes
  };
}
