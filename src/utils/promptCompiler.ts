import { Project, Chapter, Snippet, Speaker, Scene } from '../types';

export interface CompilePromptOptions {
  project: Project;
  activeChapter?: Chapter | null;
  selectedSnippetIds?: Set<string>;
  focusedSnippetId?: string | null;
  snippetsOverride?: Snippet[];
  templateOverride?: string;
}

/**
 * Compiles a full prompt for Gemini multi-speaker / single-speaker generation based on settings template.
 * Serves as the single source of truth for both prompt template preview and execution.
 */
export function compilePrompt(options: CompilePromptOptions): { 
  prompt: string; 
  uniqueSpeakers: Speaker[]; 
  targetSnippets: Snippet[];
} {
  const { project, snippetsOverride, templateOverride } = options;

  const templateStr = templateOverride || project.settings.promptTemplate || `# {project_title}
## {chapter_title}

## Speakers

### {speaker_name}
- Role: {speaker_role}
- Voice: {speaker_voice}
- Style: {speaker_instructions}

## Scene: {scene_name}
{scene_description}

### Context
{scene_context}

## TRANSCRIPT
{snippet_text}`;

  const activeChapter = options.activeChapter 
    || project.chapters.find(c => options.selectedSnippetIds && Array.from(options.selectedSnippetIds).some(id => c.snippets.some(s => s.id === id)))
    || project.chapters[0];

  const generationOption = project.settings.generationOption || 'individual';

  // 1. Determine target snippets based on selection/focus/mode rules
  let targetSnippets: Snippet[] = [];

  if (snippetsOverride && snippetsOverride.length > 0) {
    targetSnippets = snippetsOverride;
  } else {
    const allProjectSnippets = project.chapters.flatMap(c => c.snippets);
    const chapterSnippets = activeChapter ? activeChapter.snippets : [];

    const selectedSnippets = (options.selectedSnippetIds && options.selectedSnippetIds.size > 0)
      ? allProjectSnippets.filter(s => options.selectedSnippetIds!.has(s.id))
      : [];

    if (generationOption === 'individual') {
      // SINGLE SPINNER / SINGLE SNIPPET MODE
      // 1) If snippets are selected, use the first selected snippet
      if (selectedSnippets.length > 0) {
        targetSnippets = [selectedSnippets[0]];
      } 
      // 2) If no snippets selected, use the currently focused snippet
      else if (options.focusedSnippetId) {
        const focused = allProjectSnippets.find(s => s.id === options.focusedSnippetId);
        if (focused) {
          targetSnippets = [focused];
        }
      }
      
      // 3) If none selected / focused, use the first snippet in the active chapter
      if (targetSnippets.length === 0 && chapterSnippets.length > 0) {
        targetSnippets = [chapterSnippets[0]];
      }
    } else {
      // MULTI-SPEAKER / COMBINED MODE
      // 1) If snippets are selected, use those
      if (selectedSnippets.length > 0) {
        targetSnippets = selectedSnippets;
      } 
      else {
        // 2) Use snippets from the first scene assigned in the chapter
        const snippetWithScene = chapterSnippets.find(s => !!s.sceneId);
        if (snippetWithScene && snippetWithScene.sceneId) {
          const targetSceneId = snippetWithScene.sceneId;
          targetSnippets = chapterSnippets.filter(s => s.sceneId === targetSceneId);
        } else {
          // 3) First 10 snippets in the chapter
          targetSnippets = chapterSnippets.slice(0, 10);
        }
      }
    }
  }

  // Enforce max 2 speakers / 8KB limit for combined mode or multi-snippet selections
  if (targetSnippets.length > 1) {
    const constrainedSnippets: Snippet[] = [];
    const speakerSet = new Set<string>();
    let totalTextLen = 0;

    for (const sn of targetSnippets) {
      const defaultSpId = activeChapter?.defaultSpeakerId || project.speakers[0]?.id;
      const effectiveSpId = sn.speakerId || defaultSpId;

      const prospectiveSpeakers = new Set(speakerSet);
      if (effectiveSpId) prospectiveSpeakers.add(effectiveSpId);

      if (prospectiveSpeakers.size > 2) {
        break; // Max 2 speakers reached
      }

      const textLen = (sn.text || "").length;
      if (totalTextLen + textLen > 8000 && constrainedSnippets.length > 0) {
        break; // 8KB character limit reached
      }

      if (effectiveSpId) speakerSet.add(effectiveSpId);
      totalTextLen += textLen;
      constrainedSnippets.push(sn);
    }

    if (constrainedSnippets.length > 0) {
      targetSnippets = constrainedSnippets;
    }
  }

  // 2. Identify unique speakers in targetSnippets
  const defaultSpId = activeChapter?.defaultSpeakerId || project.speakers[0]?.id;
  const speakerIdsInRange = Array.from(new Set(targetSnippets.map(s => {
    return s.speakerId || defaultSpId;
  }))).filter(Boolean);

  let uniqueSpeakers = speakerIdsInRange
    .map(id => project.speakers.find(sp => sp.id === id))
    .filter((sp): sp is Speaker => !!sp);

  if (uniqueSpeakers.length === 0 && project.speakers.length > 0) {
    uniqueSpeakers = [project.speakers[0]];
  }

  // 3. Identify active scene based on snippets and chapter
  let activeScene: Scene | undefined = undefined;
  const firstSnippetWithScene = targetSnippets.find(s => !!s.sceneId);
  if (firstSnippetWithScene && firstSnippetWithScene.sceneId) {
    activeScene = project.scenes?.find(sc => sc.id === firstSnippetWithScene.sceneId);
  } else if (activeChapter && activeChapter.snippets) {
    const chapterSnippetWithScene = activeChapter.snippets.find(s => !!s.sceneId);
    if (chapterSnippetWithScene && chapterSnippetWithScene.sceneId) {
      activeScene = project.scenes?.find(sc => sc.id === chapterSnippetWithScene.sceneId);
    }
  }

  let compiled = templateStr;

  // 4. Interpolate project and chapter info
  compiled = compiled.replace(/\{project_title\}/g, project.title || "Untitled Project");
  compiled = compiled.replace(/\{chapter_title\}/g, activeChapter ? activeChapter.title : "Chapter One");

  // 5. Interpolate speaker blocks
  const speakerNameIndex = compiled.indexOf('{speaker_name}');
  if (speakerNameIndex !== -1) {
    let lineStart = compiled.lastIndexOf('\n', speakerNameIndex);
    lineStart = lineStart === -1 ? 0 : lineStart + 1;

    const rest = compiled.slice(lineStart);
    const isListItem = /^[ \t]*[*-]\s/.test(rest);

    let blockEndIndex: number;
    if (isListItem) {
      const lineEnd = rest.indexOf('\n');
      blockEndIndex = lineEnd === -1 ? compiled.length : lineStart + lineEnd;
    } else {
      const endMatch = rest.match(/\n(?=#{1,6}\s|<!--|$)/);
      blockEndIndex = (endMatch && endMatch.index !== undefined) ? lineStart + endMatch.index : compiled.length;
    }

    const blockTemplate = compiled.slice(lineStart, blockEndIndex).trimEnd();

    const renderedSpeakers = uniqueSpeakers.map(sp => {
      let spBlock = blockTemplate;
      spBlock = spBlock.replace(/\{speaker_name\}/g, sp.name);
      spBlock = spBlock.replace(/\{speaker_role\}/g, sp.role || "Narrator");
      spBlock = spBlock.replace(/\{speaker_voice\}/g, sp.voice);
      spBlock = spBlock.replace(/\{speaker_instructions\}/g, sp.style || "");
      spBlock = spBlock.replace(/\{speaker_style\}/g, sp.style || "");
      spBlock = spBlock.replace(/\{speaker_pace\}/g, sp.pace || "Natural");
      spBlock = spBlock.replace(/\{speaker_accent\}/g, sp.accent || "Neutral");
      return spBlock;
    }).join(isListItem ? '\n' : '\n\n');

    compiled = compiled.slice(0, lineStart) + renderedSpeakers + compiled.slice(blockEndIndex);
  }

  // 6. Interpolate scene variables (or omit section if no scene assigned)
  if (activeScene) {
    compiled = compiled.replace(/\{scene_name\}/g, activeScene.name);
    compiled = compiled.replace(/\{scene_description\}/g, activeScene.description || "No description.");
    compiled = compiled.replace(/\{scene_context\}/g, activeScene.context || "No context.");
  } else {
    // Leave scene section out if no scene assigned
    const sceneBlockRegex = /(?:^|\n)(#{1,6}\s*Scene:?[^\n]*\n[\s\S]*?)(?=\n#{1,6}\s|\n<!--|$)/i;
    compiled = compiled.replace(sceneBlockRegex, '');
    compiled = compiled.replace(/\{scene_name\}/g, '');
    compiled = compiled.replace(/\{scene_description\}/g, '');
    compiled = compiled.replace(/\{scene_context\}/g, '');
  }

  // 7. Format and interpolate transcript
  let transcriptText = "";
  if (targetSnippets.length > 0) {
    transcriptText = targetSnippets.map(s => {
      const effectiveSpId = s.speakerId || activeChapter?.defaultSpeakerId;
      const sp = project.speakers.find(x => x.id === effectiveSpId);
      const prefix = sp ? `${sp.name}: ` : "Narrator: ";
      const cleanText = (s.text || "").replace(/\r?\n/g, " ").trim();
      return `${prefix}${cleanText}`;
    }).join('\n');
  }

  if (!transcriptText) {
    const primarySpName = uniqueSpeakers[0]?.name || "Narrator";
    transcriptText = `${primarySpName}: "Hey, you! Select or create some snippets in the main studio editor to see them transcribed here."`;
  }

  compiled = compiled.replace(/\{snippet_text\}/g, transcriptText);

  // Clean up excessive blank lines
  compiled = compiled.replace(/\n{3,}/g, '\n\n').trim();

  return {
    prompt: compiled,
    uniqueSpeakers,
    targetSnippets
  };
}
