import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  Settings, 
  Users, 
  Upload,
  Download,
  GripVertical,
  SplitSquareVertical,
  Merge,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Mic,
  Wand2,
  Volume2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Save,
  FolderOpen,
  ArrowDownToLine,
  PanelRightClose,
  PanelRight,
  History,
  FileAudio,
  Minimize2,
  Maximize2,
  BookOpen,
  Clapperboard,
  CheckSquare,
  FileText,
  Sparkles,
  Layers
} from 'lucide-react';
import { Project, Chapter, Snippet, Speaker, AudioEncoding, Generation, Scene, GEMINI_VOICES, GEMINI_MODELS } from './types';
import { generateTTS } from './services/geminiService';
import { playAudio, stopAudio, createWavBlob, getAudioDuration, concatenatePCMChunks } from './services/audioService';
import { generateId } from './services/idService';
import { parseMarkdown } from './services/markdownParser';
import { saveAudio, getAudio, deleteAudio } from './services/dbService';
import { parseSidecarStream, StreamingImportProgress } from './utils/sidecarImporter';
import { formatDuration, formatError, getSpeakerStyles } from './services/utils';
import * as StateModifiers from './services/appStateModifiers';
import WaveformPlayer from './components/WaveformPlayer';
import { SettingsDialogue } from './components/SettingsDialogue';
import { GenerationGroupContainer } from './components/GenerationGroupContainer';
import { getGenerationValidationState } from './utils/generationValidator';
import { compilePrompt } from './utils/promptCompiler';
import { exportSidecarStream } from './utils/sidecarExporter';
import { groupSnippetsByGeneration, GenerationGroup } from './utils/generationGrouping';
import { UserPreferences } from './types';
import { loadUserPreferences } from './services/preferenceService';
import { createLogPayloadFromGeneration, logGenerationEvent } from './utils/generationLogger';

// --- Constants ---
const defaultEncoding: AudioEncoding = 'M4A';
const INITIAL_PROJECT: Project = {
  title: 'Untitled Audiobook',
  settings: {
    model: GEMINI_MODELS[0],
    encoding: defaultEncoding,
    sampleRate: '24000'
  },
  speakers: [
    {
      id: generateId(),
      order: 0,
      name: 'Narrator',
      voice: 'Zephyr',
      style: 'Clear, steady pace appropriate for a romance audiobook.',
      isNarrator: true
    }
  ],
  chapters: [
    {
      id: generateId(),
      order: 0,
      title: 'Chapter 1',
      defaultSpeakerId: null,
      isCollapsed: false,
      snippets: [
        {
          id: generateId(),
          order: 0,
          text: 'It was a dark and stormy night.',
          speakerId: null,
          status: 'idle',
          isCollapsed: false,
          generations: [],
          activeGenerationId: null
        }
      ]
    }
  ]
};

//#region Global Helper Components
/**
 * @name IconButton
 * @summary A simple small button consisting of a single SVG icon
 * @param icon The Lucide icon to use `icon={}`
 * @param onClick The onClick event handler callback
 * @param title The tooltip that will show on hover.
 * @param className Optional additional CSS class names to assign.
 * @param disabled Optional disable button
 * @returns <button><icon/></button>
 */
function IconButton({ icon: Icon, onClick, title, className = '', disabled = false }: any) {
  return (
    <button 
      onClick={(e) => { 
        e.preventDefault();
        e.stopPropagation(); 
        if (onClick) onClick(e); 
      }} 
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function getCombinedStyleInstructions(speaker: Speaker): string {
  if (speaker.style && speaker.style.trim()) {
    return speaker.style.trim();
  }
  return '';
}
//#endregion

export default function App() {
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [previewingSpeakerId, setPreviewingSpeakerId] = useState<string | null>(null);
  const [isExportingSidecar, setIsExportingSidecar] = useState(false);
  const [sidecarExportProgress, setSidecarExportProgress] = useState<string | null>(null);
  const [sidecarImportProgress, setSidecarImportProgress] = useState<StreamingImportProgress | null>(null);
  
  // Settings dialogue state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'project' | 'speakers' | 'scenes' | 'prompt' | 'logging'>('project');
  const [settingsAutoAddSpeaker, setSettingsAutoAddSpeaker] = useState(false);
  const [settingsAutoAddScene, setSettingsAutoAddScene] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => loadUserPreferences());

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  } | null>(null);

  /**
   * Opens the Project Settings Dialogue with a pre-configured active tab and optional auto-add triggers.
   * 
   * @param tab The target active tab to display upon dialogue opening.
   * @param autoAddSpeaker Whether to automatically append a new character speaker.
   * @param autoAddScene Whether to automatically append a new acoustic scene.
   */
  const openSettings = (
    tab: 'project' | 'speakers' | 'scenes' | 'prompt' | 'logging' = 'project',
    autoAddSpeaker = false,
    autoAddScene = false
  ) => {
    setSettingsDefaultTab(tab);
    setSettingsAutoAddSpeaker(autoAddSpeaker);
    setSettingsAutoAddScene(autoAddScene);
    setIsSettingsOpen(true);
  };
  // Active chapter state for single chapter view
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  // Selection states for bulk snippet actions
  const [selectedSnippetIds, setSelectedSnippetIds] = useState<Set<string>>(new Set());

  // Sidebar collapse states
  const [isChaptersCollapsed, setIsChaptersCollapsed] = useState(false);
  const [isScenesCollapsed, setIsScenesCollapsed] = useState(false);
  const [isSpeakersCollapsed, setIsSpeakersCollapsed] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  // Sidebar layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isDragging, setIsDragging] = useState(false);

  // Context-sensitive focus states
  const [focusedSnippetId, setFocusedSnippetId] = useState<string | null>(null);
  const [focusedChapterId, setFocusedChapterId] = useState<string | null>(null);

  // Hover states for UI interaction

  // Drag and drop state
  const [draggedSnippetId, setDraggedSnippetId] = useState<string | null>(null);
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);

  // Dynamically compute the validation status for bulk operations
  const currentSelectionValidation = (() => {
    if (selectedSnippetIds.size === 0) return { valid: true };
    const list = (Array.from(selectedSnippetIds) as string[])
      .map(id => {
        for (const c of project.chapters) {
          const s = c.snippets.find(x => x.id === id);
          if (s) return s;
        }
        return null;
      })
      .filter((s): s is Snippet => !!s)
      .sort((a, b) => a.order - b.order);
    return getGenerationValidationState(
      list,
      project.speakers,
      project.scenes || [],
      project.settings.concatenationOption || 'per-paragraph',
      1000
    );
  })();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const sidecarInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Auto-Save / Load ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [lastSavedProjectStr, setLastSavedProjectStr] = useState<string>('');

  //#region Initialization & Auto-Save
  useEffect(() => {
    const saved = localStorage.getItem('audiobook_project_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.chapters) {
          const sanitizedChapters = parsed.chapters.map((c: Chapter) => ({
            ...c,
            snippets: c.snippets.map((s: Snippet) => ({
              ...s,
              status: s.activeGenerationId ? 'done' : 'idle'
            }))
          }));
          setProject({ ...parsed, chapters: sanitizedChapters });
          setLastSavedProjectStr(JSON.stringify({ ...parsed, chapters: sanitizedChapters }));
          if (sanitizedChapters.length > 0) {
            setActiveChapterId(sanitizedChapters[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load auto-saved project", e);
      }
    } else if (INITIAL_PROJECT.chapters && INITIAL_PROJECT.chapters.length > 0) {
      setActiveChapterId(INITIAL_PROJECT.chapters[0].id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    const currentProjectStr = JSON.stringify(project);
    if (currentProjectStr === lastSavedProjectStr) return;

    const timer = setTimeout(() => {
      localStorage.setItem('audiobook_project_v3', currentProjectStr);
      setLastSavedProjectStr(currentProjectStr);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1000);
    }, 1500);

    return () => clearTimeout(timer);
  }, [project, isLoaded, lastSavedProjectStr]);
  //#endregion

  //#region Sidebar Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 250 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add('cursor-col-resize', 'select-none');
    } else {
      document.body.classList.remove('cursor-col-resize', 'select-none');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('cursor-col-resize', 'select-none');
    };
  }, [isDragging]);
  //#endregion

  //#region Focused Snippet Helpers
  const getFocusedSnippet = useCallback((): Snippet | null => {
    if (!focusedSnippetId || !focusedChapterId) return null;
    const chapter = project.chapters.find(c => c.id === focusedChapterId);
    return chapter?.snippets.find(s => s.id === focusedSnippetId) || null;
  }, [focusedSnippetId, focusedChapterId, project.chapters]);
  //#endregion

  //#region Project Export / Import
  const handleExportProject = () => {
    const exportData = {
      projectName: project.title,
      settings: project.settings,
      speakers: project.speakers.map(s => ({
        id: s.id,
        order: s.order,
        name: s.name,
        voice: s.voice,
        instructions: s.style,
        isNarrator: s.isNarrator
      })),
      scenes: (project.scenes || []).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        order: s.order
      })),
      chapters: project.chapters.map((c, i) => ({
        id: c.id,
        name: c.title,
        order: c.order,
        globalSpeaker: c.defaultSpeakerId,
        collapsed: c.isCollapsed,
        content: c.snippets.map((s, j) => ({
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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.title || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        const importedProject: Project = {
          title: data.projectName || 'Imported Project',
          settings: {
            model: data.settings?.model || GEMINI_MODELS[0],
            encoding: data.settings?.encoding || 'M4A',
            sampleRate: data.settings?.sampleRate || '24000',
            promptTemplate: data.settings?.promptTemplate || undefined
          } as any,
          speakers: (data.speakers || []).map((s: any, i: number) => ({
            id: s.id || generateId(),
            name: s.name || '',
            order: s.order ?? i,
            voice: s.voice || GEMINI_VOICES[0].id,
            style: s.instructions || '',
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
        
        setProject(importedProject);
        if (importedProject.chapters && importedProject.chapters.length > 0) {
          setActiveChapterId(importedProject.chapters[0].id);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse project file. Ensure it matches the correct JSON schema.");
      }
    };
    reader.readAsText(file);
    if (projectInputRef.current) projectInputRef.current.value = '';
  };
  //#endregion

  //#region Sidecar Export / Import
  const handleExportSidecar = async () => {
    setIsExportingSidecar(true);
    setSidecarExportProgress("Preparing export...");

    try {
      await exportSidecarStream(project, getAudio, (completed, total) => {
        if (total > 0) {
          setSidecarExportProgress(`${completed}/${total}`);
        }
      });
    }
    catch (err: any) {
      console.error("Sidecar export error:", err);
      alert(`Failed to export audio sidecar: ${err?.message || err}`);
    }
    finally {
      setIsExportingSidecar(false);
      setSidecarExportProgress(null);
    }
  };

  const handleImportSidecar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSidecarImportProgress({
        bytesProcessed: 0,
        totalBytes: file.size,
        percent: 0,
        processedCount: 0
      });

      const stream = file.stream();
      const result = await parseSidecarStream(stream, file.size, {
        onSaveAudio: async (id, data, mimeType) => {
          await saveAudio(id, data, mimeType);
        },
        onProgress: (progress) => {
          setSidecarImportProgress(progress);
        }
      });

      const importedGens = result.importedGenerations;
      const importedCount = importedGens.length;

      setProject(prev => {
        const updatedChapters = prev.chapters.map(chapter => {
          return {
            ...chapter,
            snippets: chapter.snippets.map(snippet => {
              const sidecarGensForSnippet = importedGens.filter((g: any) => {
                if (Array.isArray(g.snippetId)) {
                  return g.snippetId.includes(snippet.id);
                }
                return g.snippetId === snippet.id;
              });
              if (sidecarGensForSnippet.length === 0) return snippet;

              const existingGenIds = new Set(snippet.generations.map(g => g.id));
              const gensToAdd: Generation[] = [];

              for (const sg of sidecarGensForSnippet) {
                if (!existingGenIds.has(sg.id)) {
                  gensToAdd.push({
                    id: sg.id,
                    snippetId: snippet.id,
                    speakerId: sg.speakerId || snippet.speakerId || null,
                    timestamp: sg.timestamp || new Date().toISOString(),
                    model: sg.model || prev.settings.model.id || 'gemini-3.1-flash-tts-preview',
                    text: sg.text || snippet.text,
                    audioMimeType: sg.audioMimeType || 'audio/wav',
                    duration: sg.duration
                  });
                }
              }

              const mergedGenerations = [...snippet.generations, ...gensToAdd];
              mergedGenerations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              const activeGenerationId = snippet.activeGenerationId || (mergedGenerations.length > 0 ? mergedGenerations[0].id : null);

              return {
                ...snippet,
                generations: mergedGenerations,
                activeGenerationId,
                status: mergedGenerations.length > 0 ? 'done' : 'idle'
              };
            })
          };
        });

        return { ...prev, chapters: updatedChapters };
      });

      alert(`Successfully imported and restored ${importedCount} audio generations from sidecar file!`);
    } catch (err: any) {
      console.error('Sidecar import failed:', err);
      alert(`Failed to parse sidecar file: ${err?.message || String(err)}`);
    } finally {
      setSidecarImportProgress(null);
      if (sidecarInputRef.current) sidecarInputRef.current.value = '';
    }
  };
  //#endregion

  //#region Audio Playback Logic
  const handleStopAudio = useCallback(() => {
    stopAudio();
    setActivePlayingId(null);
    setPreviewingSpeakerId(null);
  }, []);

  const playSnippetAudioById = useCallback(async (generationId: string) => {
    handleStopAudio();
    setActivePlayingId(generationId);
    const audio = await getAudio(generationId);
    if (audio) {
      playAudio(audio.base64Data, audio.mimeType, () => setActivePlayingId(null));
    } else {
      setActivePlayingId(null);
      alert("Audio data not found in local database. Please regenerate.");
    }
  }, [handleStopAudio]);

  const playFromSnippetById = useCallback(async (chapterId: string, startSnippetId: string) => {
    handleStopAudio();
    const chapter = project.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const startIndex = chapter.snippets.findIndex(s => s.id === startSnippetId);
    if (startIndex === -1) return;

    const playbackItems: Array<{ targetId: string; generationId: string }> = [];
    let cursor = startIndex;
    while (cursor < chapter.snippets.length) {
      const current = chapter.snippets[cursor];
      if (current.activeGenerationId && current.generations.some(g => g.id === current.activeGenerationId)) {
        const activeGenId = current.activeGenerationId;
        playbackItems.push({ targetId: current.id, generationId: activeGenId });
        // Skip subsequent contiguous snippets sharing this same generation
        while (cursor < chapter.snippets.length && chapter.snippets[cursor].activeGenerationId === activeGenId) {
          cursor++;
        }
      }
      else {
        cursor++;
      }
    }

    if (playbackItems.length === 0) return;

    let currentIndex = 0;

    const playNext = async () => {
      if (currentIndex >= playbackItems.length) {
        setActivePlayingId(null);
        return;
      }
      
      const item = playbackItems[currentIndex];
      setActivePlayingId(item.targetId);
      const audio = await getAudio(item.generationId);
      if (audio) {
        playAudio(audio.base64Data, audio.mimeType, () => {
          currentIndex++;
          playNext();
        });
      }
      else {
        currentIndex++;
        playNext();
      }
    };

    playNext();
  }, [project, handleStopAudio]);

  const handleUpdateGenerationName = useCallback((chapterId: string, generationId: string, newName: string) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => {
        if (chapter.id !== chapterId) return chapter;
        return {
          ...chapter,
          snippets: chapter.snippets.map(snippet => ({
            ...snippet,
            generations: snippet.generations.map(gen => {
              if (gen.id === generationId) {
                return { ...gen, name: newName };
              }
              return gen;
            })
          }))
        };
      })
    }));
  }, []);

  const handleExportGroupAudio = useCallback(async (generation: Generation) => {
    const audio = await getAudio(generation.id);
    if (!audio) {
      alert("Audio data not found in local database. Please regenerate.");
      return;
    }

    const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
    const pName = sanitize(project.title) || 'project';
    const genName = sanitize(generation.name || generation.id);

    const binaryString = atob(audio.base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const sampleRate = parseInt(project.settings.sampleRate) || 24000;
    const blob = createWavBlob(bytes, sampleRate);
    const ext = 'wav';
    const filename = `${pName}-${genName}.${ext}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [project]);

  /**
   * Smoothly scrolls the active chapter editor container to the top.
   */
  const handleScrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const playSnippetAudio = useCallback((snippet: Snippet) => {
    if (!snippet.activeGenerationId || !snippet.generations.some(g => g.id === snippet.activeGenerationId)) return;
    playSnippetAudioById(snippet.activeGenerationId);
  }, [playSnippetAudioById]);

  const handleExportSnippetAudio = useCallback(async (chapterId: string, snippetId: string) => {
    const cIndex = project.chapters.findIndex(c => c.id === chapterId);
    const chapter = project.chapters[cIndex];
    if (!chapter) return;
    
    const sIndex = chapter.snippets.findIndex(s => s.id === snippetId);
    const snippet = chapter.snippets[sIndex];
    if (!snippet || !snippet.activeGenerationId || !snippet.generations.some(g => g.id === snippet.activeGenerationId)) return;

    const audio = await getAudio(snippet.activeGenerationId);
    if (!audio) {
      alert("Audio data not found in local database. Please regenerate.");
      return;
    }

    const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
    const pad = (num: number) => String(num).padStart(2, '0');
    
    const pName = sanitize(project.title) || 'project';
    const cName = sanitize(chapter.title) || 'chapter';
    
    const binaryString = atob(audio.base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const sampleRate = parseInt(project.settings.sampleRate) || 24000;
    const blob = createWavBlob(bytes, sampleRate);
    const ext = 'wav';

    const filename = `${pName}-C${pad(cIndex + 1)}-${cName}-S${pad(sIndex + 1)}.${ext}`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);
  //#endregion

  //#region Concatenation Exports
  /**
   * Concatenates and exports all generated audio snippets in a single chapter as a WAV file.
   * Skips contiguous generation duplicates sharing the same audio generation ID.
   * Validates that valid audio data exists before generating files.
   * 
   * @param chapterId The identifier of the chapter to export.
   */
  const handleExportChapterAudio = async (chapterId: string) => {
    const chapter = project.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    // Collect distinct active generation IDs in order, deduplicating contiguous snippets sharing the same generation
    const genIdsToExport: string[] = [];
    let cursor = 0;
    while (cursor < chapter.snippets.length) {
      const current = chapter.snippets[cursor];
      if (current.activeGenerationId && current.generations.some(g => g.id === current.activeGenerationId)) {
        const activeGenId = current.activeGenerationId;
        genIdsToExport.push(activeGenId);
        while (cursor < chapter.snippets.length && chapter.snippets[cursor].activeGenerationId === activeGenId) {
          cursor++;
        }
      }
      else {
        cursor++;
      }
    }

    if (genIdsToExport.length === 0) {
      alert("No generated audio found in this chapter.");
      return;
    }

    try {
      const base64Chunks: string[] = [];
      for (const genId of genIdsToExport) {
        const audio = await getAudio(genId);
        if (audio && audio.base64Data && audio.base64Data.trim().length > 0) {
          base64Chunks.push(audio.base64Data);
        }
      }

      if (base64Chunks.length === 0) {
        alert("Audio data not found in local database for this chapter. Please regenerate audio first.");
        return;
      }

      const sampleRate = parseInt(project.settings.sampleRate) || 24000;
      const wavBlob = concatenatePCMChunks(base64Chunks, sampleRate);

      const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
      const filename = `${sanitize(project.title)}-${sanitize(chapter.title)}.wav`;

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    catch (e) {
      console.error("Failed to concatenate chapter audio:", e);
      alert("Failed to export concatenated chapter audio.");
    }
  };

  /**
   * Concatenates and exports all generated audio snippets across all chapters in the project as a single WAV file.
   * Skips contiguous generation duplicates sharing the same audio generation ID.
   * Validates that valid audio data exists before generating files.
   */
  const handleExportFullProjectAudio = async () => {
    const genIdsToExport: string[] = [];
    for (const chapter of project.chapters) {
      let cursor = 0;
      while (cursor < chapter.snippets.length) {
        const current = chapter.snippets[cursor];
        if (current.activeGenerationId && current.generations.some(g => g.id === current.activeGenerationId)) {
          const activeGenId = current.activeGenerationId;
          genIdsToExport.push(activeGenId);
          while (cursor < chapter.snippets.length && chapter.snippets[cursor].activeGenerationId === activeGenId) {
            cursor++;
          }
        }
        else {
          cursor++;
        }
      }
    }

    if (genIdsToExport.length === 0) {
      alert("No generated audio found in the entire project.");
      return;
    }

    try {
      const base64Chunks: string[] = [];
      for (const genId of genIdsToExport) {
        const audio = await getAudio(genId);
        if (audio && audio.base64Data && audio.base64Data.trim().length > 0) {
          base64Chunks.push(audio.base64Data);
        }
      }

      if (base64Chunks.length === 0) {
        alert("Audio data not found in local database for the project. Please regenerate audio first.");
        return;
      }

      const sampleRate = parseInt(project.settings.sampleRate) || 24000;
      const wavBlob = concatenatePCMChunks(base64Chunks, sampleRate);

      const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
      const filename = `${sanitize(project.title)}_full_audiobook.wav`;

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    catch (e) {
      console.error("Failed to concatenate full project audio:", e);
      alert("Failed to export concatenated full project audio.");
    }
  };
  //#endregion

  //#region State Modifiers (Delegated to appStateModifiers)
  const updateProjectState = useCallback((updates: Partial<Project>) => {
    setProject(prev => ({ ...prev, ...updates }));
  }, []);

  const updateChapterState = useCallback((chapterId: string, updates: Partial<Chapter>) => {
    setProject(prev => StateModifiers.updateChapter(prev, chapterId, updates));
  }, []);

  const updateSnippetState = useCallback((chapterId: string, snippetId: string, updates: Partial<Snippet>) => {
    setProject(prev => StateModifiers.updateSnippet(prev, chapterId, snippetId, updates));
  }, []);

  const addChapterState = useCallback(() => {
    setProject(prev => StateModifiers.addChapter(prev));
  }, []);

  const moveChapterState = useCallback((index: number, direction: 'up' | 'down') => {
    setProject(prev => StateModifiers.moveChapter(prev, index, direction));
  }, []);

  const deleteChapterState = useCallback((chapterId: string) => {
    setProject(prev => StateModifiers.deleteChapter(prev, chapterId));
  }, []);

  const deleteSnippetState = useCallback((chapterId: string, snippetId: string) => {
    setProject(prev => StateModifiers.deleteSnippet(prev, chapterId, snippetId));
  }, []);

  const addSnippetState = useCallback((chapterId: string, index: number) => {
    setProject(prev => StateModifiers.addSnippet(prev, chapterId, index));
  }, []);

  const moveSnippetState = useCallback((chapterId: string, index: number, direction: 'up' | 'down') => {
    setProject(prev => StateModifiers.moveSnippet(prev, chapterId, index, direction));
  }, []);

  const splitSnippetState = useCallback((chapterId: string, snippetId: string, cursorPosition: number) => {
    setProject(prev => StateModifiers.splitSnippet(prev, chapterId, snippetId, cursorPosition));
  }, []);

  const joinSnippetWithNextState = useCallback((chapterId: string, snippetId: string) => {
    setProject(prev => StateModifiers.joinSnippetWithNext(prev, chapterId, snippetId));
  }, []);

  const addSpeakerState = useCallback(() => {
    setProject(prev => StateModifiers.addSpeaker(prev, GEMINI_VOICES));
  }, []);

  const updateSpeakerState = useCallback((speakerId: string, updates: Partial<Speaker>) => {
    setProject(prev => StateModifiers.updateSpeaker(prev, speakerId, updates));
  }, []);

  const deleteSpeakerState = useCallback((speakerId: string) => {
    setProject(prev => StateModifiers.deleteSpeaker(prev, speakerId));
  }, []);

  const moveSpeakerState = useCallback((index: number, direction: 'up' | 'down') => {
    setProject(prev => StateModifiers.moveSpeaker(prev, index, direction));
  }, []);

  const toggleAllSnippetsInChapter = useCallback((chapterId: string, collapse: boolean) => {
    setProject(prev => StateModifiers.toggleAllSnippetsInChapter(prev, chapterId, collapse));
  }, []);
  //#endregion

  //#region Generation History and Voice Preview Handlers
  const handleSelectGeneration = useCallback((gen: Generation) => {
    if (!focusedChapterId || !focusedSnippetId) return;
    updateSnippetState(focusedChapterId, focusedSnippetId, {
      activeGenerationId: gen.id,
      text: gen.text,
      speakerId: gen.speakerId
    });
  }, [focusedChapterId, focusedSnippetId, updateSnippetState]);

  const handleDeleteGeneration = useCallback(async (generationId: string) => {
    try {
      await deleteAudio(generationId);
      setProject(prev => {
        const updatedChapters = prev.chapters.map(c => {
          return {
            ...c,
            snippets: c.snippets.map(s => {
              if (!s.generations.some(g => g.id === generationId) && s.activeGenerationId !== generationId) return s;
              const nextGens = s.generations.filter(g => g.id !== generationId);
              let nextActiveId = s.activeGenerationId;
              if (nextActiveId === generationId) {
                nextActiveId = nextGens.length > 0 ? nextGens[0].id : null;
              }
              return {
                ...s,
                generations: nextGens,
                activeGenerationId: nextActiveId,
                status: nextGens.length > 0 ? 'done' : 'idle' as any
              };
            })
          };
        });
        return { ...prev, chapters: updatedChapters };
      });
    } catch (err: any) {
      console.error("Failed to delete generation:", err);
      alert("Failed to delete generation: " + (err.message || String(err)));
    }
  }, []);

  const handlePreviewVoice = useCallback(async (speaker: Speaker) => {
    handleStopAudio();
    setPreviewingSpeakerId(speaker.id);
    try {
      const previewText = `Hello! My name's ${speaker.voice} and I'll be playing the role of ${speaker.name}. The hungry purple dinosaur ate the kind, zingy fox, the jabbering crab, and the mad whale and started vending and quacking.`;
      const combinedStyle = getCombinedStyleInstructions(speaker);
      const { data, mimeType } = await generateTTS(
        previewText,
        speaker.voice,
        combinedStyle,
        project.settings.model.id,
        {
          textChars: previewText.length,
          textWords: previewText.split(/\s+/g).length
        }
      );
      playAudio(data, mimeType, () => setPreviewingSpeakerId(null));
    } catch (err: any) {
      console.error("Failed to preview voice:", err);
      alert("Failed to preview voice: " + (err.message || String(err)));
      setPreviewingSpeakerId(null);
    }
  }, [handleStopAudio, project.settings.model]);
  //#endregion

  //#region Drag and Drop Handlers
  const handleSnippetDragStart = (e: React.DragEvent, snippetId: string, chapterId: string) => {
    setDraggedSnippetId(snippetId);
    setDraggedChapterId(chapterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSnippetDragOver = (e: React.DragEvent, targetSnippetId: string, targetChapterId: string) => {
    e.preventDefault();
    if (!draggedSnippetId || draggedSnippetId === targetSnippetId) return;
  };

  const handleSnippetDrop = (e: React.DragEvent, targetSnippetId: string, targetChapterId: string) => {
    e.preventDefault();
    if (!draggedSnippetId || !draggedChapterId) return;

    setProject(prev => {
      const sourceChapter = prev.chapters.find(c => c.id === draggedChapterId);
      const targetChapter = prev.chapters.find(c => c.id === targetChapterId);
      if (!sourceChapter || !targetChapter) return prev;

      const sourceSnippetIndex = sourceChapter.snippets.findIndex(s => s.id === draggedSnippetId);
      const targetSnippetIndex = targetChapter.snippets.findIndex(s => s.id === targetSnippetId);
      if (sourceSnippetIndex === -1 || targetSnippetIndex === -1) return prev;

      const snippetToMove = sourceChapter.snippets[sourceSnippetIndex];

      const updatedChapters = prev.chapters.map(c => {
        if (c.id === draggedChapterId && c.id === targetChapterId) {
          const newSnippets = [...c.snippets];
          newSnippets.splice(sourceSnippetIndex, 1);
          newSnippets.splice(targetSnippetIndex, 0, snippetToMove);
          newSnippets.forEach((s, i) => s.order = i);
          return { ...c, snippets: newSnippets };
        } else if (c.id === draggedChapterId) {
          const newSnippets = c.snippets.filter(s => s.id !== draggedSnippetId);
          newSnippets.forEach((s, i) => s.order = i);
          return { ...c, snippets: newSnippets };
        } else if (c.id === targetChapterId) {
          const newSnippets = [...c.snippets];
          newSnippets.splice(targetSnippetIndex, 0, snippetToMove);
          newSnippets.forEach((s, i) => s.order = i);
          return { ...c, snippets: newSnippets };
        }
        return c;
      });

      return { ...prev, chapters: updatedChapters };
    });

    setDraggedSnippetId(null);
    setDraggedChapterId(null);
  };
  //#endregion

  //#region Generation Logic (Async)

  /**
   * Executes a batch of tasks with a max concurrency limit and a rate-limit sliding window.
   * - Max concurrent active tasks: 9
   * - Max tasks launched per 60-second window: 10
   */
  const runRateLimitedBatch = useCallback(async <T,>(
    items: T[],
    taskFn: (item: T) => Promise<void>,
    maxConcurrency = 9,
    maxPerMinute = 10
  ): Promise<void> => {
    if (items.length === 0) return;
    const launchTimestamps: number[] = [];
    let activeCount = 0;
    let index = 0;

    return new Promise((resolve) => {
      const launchNext = () => {
        if (index >= items.length && activeCount === 0) {
          resolve();
          return;
        }

        while (index < items.length && activeCount < maxConcurrency) {
          const now = Date.now();
          while (launchTimestamps.length > 0 && now - launchTimestamps[0] >= 60000) {
            launchTimestamps.shift();
          }

          if (launchTimestamps.length >= maxPerMinute) {
            const oldestTime = launchTimestamps[0];
            const delay = Math.max(100, 60000 - (now - oldestTime) + 100);
            setTimeout(launchNext, delay);
            return;
          }

          const currentItem = items[index++];
          activeCount++;
          launchTimestamps.push(Date.now());

          taskFn(currentItem)
            .catch(err => {
              console.error("Rate-limited batch task error:", err);
            })
            .finally(() => {
              activeCount--;
              launchNext();
            });
        }
      };

      launchNext();
    });
  }, []);

  const handleGenerateSnippetAsync = async (chapterId: string, snippetId: string) => {
    const chapter = project.chapters.find(c => c.id === chapterId);
    const snippet = chapter?.snippets.find(s => s.id === snippetId);
    if (!chapter || !snippet || !snippet.text.trim()) return;

    const effectiveSpeakerId = snippet.speakerId || chapter.defaultSpeakerId;
    const speaker = project.speakers.find(s => s.id === effectiveSpeakerId);
    
    if (!speaker) {
      alert("Please assign a speaker to this snippet or chapter before generating.");
      return;
    }

    updateSnippetState(chapterId, snippetId, { status: 'generating', errorMessage: undefined });

    try {
      const { prompt, uniqueSpeakers, targetSnippets } = compilePrompt({
        project,
        activeChapter: chapter,
        snippetsOverride: [snippet]
      });

      const modelId = project.settings.model.id;
      const combinedStyle = getCombinedStyleInstructions(speaker);
      
      // get raw snippet text counts and number of snippets
      const snippetCount = targetSnippets.length;
      const rawText = targetSnippets.map(s => {
        return s.text.trim();
      }).join('\n');

      const rawTextChars = rawText.length;
      const rawTextWords = rawText.split(/\s+/g).length;

      const ttsResult = await generateTTS(
        prompt,
        speaker.voice,
        combinedStyle,
        modelId,
        {
          speakers: uniqueSpeakers.map(sp => ({ name: sp.name, voice: sp.voice })),
          temperature: project.settings.temperature,
          useInteractionsAPI: project.settings.apiType === 'Interactions',
          snippetCount: snippetCount,
          textChars: rawTextChars,
          textWords: rawTextWords
        }
      );
      const { data, mimeType } = ttsResult;

      const duration = await getAudioDuration(data, mimeType);
      const generationId = generateId();

      // Save audio data to IndexedDB
      await saveAudio(generationId, data, mimeType, duration);

      const newGen: Generation = {
        id: generationId,
        snippetId: snippet.id,
        speakerId: speaker.id,
        timestamp: new Date().toISOString(),
        model: modelId,
        text: snippet.text,
        audioMimeType: mimeType,
        duration: duration,
        temperature: project.settings.temperature ?? 1.0
      };

      // Trigger asynchronous Google Sheets generation telemetry logging if configured
      if (userPreferences.sheetsLoggingEnabled && userPreferences.sheetsSpreadsheetId) {
        const snippetIndex = chapter.snippets.findIndex(s => s.id === snippetId);
        const approxSizeBytes = Math.round((data.length * 3) / 4);
        const payload = createLogPayloadFromGeneration({
          status: 200,
          statusMessage: 'OK',
          responseTimeMs: ttsResult.responseTime || 0,
          projectName: project.title,
          chapterName: chapter.title,
          speakers: uniqueSpeakers.map(sp => ({ name: sp.name, voice: sp.voice })),
          model: modelId,
          temperature: project.settings.temperature ?? 1.0,
          snippetStart: snippetIndex >= 0 ? snippetIndex : 0,
          snippetEnd: snippetIndex >= 0 ? snippetIndex : 0,
          rawText: rawText,
          promptText: prompt,
          audioDurationMs: Math.round(duration * 1000),
          audioSizeBytes: approxSizeBytes,
          promptTokens: ttsResult.promptTokens,
          responseTokens: ttsResult.responseTokens
        });

        logGenerationEvent(payload, userPreferences).catch(err => {
          console.warn("Async Sheets logging notification:", err);
        });
      }

      setProject(prev => ({
        ...prev,
        chapters: prev.chapters.map(c => {
          if (c.id !== chapterId) return c;
          return {
            ...c,
            snippets: c.snippets.map(s => {
              if (s.id !== snippetId) return s;
              return {
                ...s,
                status: 'done',
                generations: [newGen, ...s.generations],
                activeGenerationId: generationId
              };
            })
          };
        })
      }));

    } catch (error: any) {
      console.error("Failed to generate snippet:", error);
      updateSnippetState(chapterId, snippetId, { status: 'error', errorMessage: formatError(error) });
    }
  };

  const handleGenerateChapter = async (chapterId: string) => {
    const chapter = project.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const snippetsToGen = chapter.snippets.filter(s => s.generations.length === 0 && s.text.trim());
    if (snippetsToGen.length === 0) return;

    if (project.settings.generationOption === 'individual') {
      await runRateLimitedBatch(snippetsToGen, sn => handleGenerateSnippetAsync(chapterId, sn.id));
    } else {
      const chapterSnippetIds = new Set(snippetsToGen.map(s => s.id));
      setSelectedSnippetIds(chapterSnippetIds);
      await handleBulkGenerate();
    }
  };

  const handleGenerateAll = async () => {
    const allItems: { chapterId: string; snippetId: string }[] = [];
    for (const chapter of project.chapters) {
      for (const snippet of chapter.snippets) {
        if (snippet.generations.length === 0 && snippet.text.trim()) {
          allItems.push({ chapterId: chapter.id, snippetId: snippet.id });
        }
      }
    }

    if (allItems.length === 0) return;

    if (project.settings.generationOption === 'individual') {
      await runRateLimitedBatch(allItems, item => handleGenerateSnippetAsync(item.chapterId, item.snippetId));
    } else {
      for (const chapter of project.chapters) {
        await handleGenerateChapter(chapter.id);
      }
    }
  };

  // --- Bulk Snippet Operations ---
  const handleToggleSelectSnippet = (snippetId: string) => {
    setSelectedSnippetIds(prev => {
      const next = new Set(prev);
      if (next.has(snippetId)) {
        next.delete(snippetId);
      } else {
        next.add(snippetId);
      }
      return next;
    });
  };

  const handleSelectAllSnippets = (chapterId: string) => {
    const chapter = project.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const allIds = chapter.snippets.map(s => s.id);
    const allSelected = allIds.every(id => selectedSnippetIds.has(id));
    
    setSelectedSnippetIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach(id => next.delete(id));
      } else {
        allIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedSnippetIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedSnippetIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Selected Snippets",
      message: `Are you sure you want to delete the ${selectedSnippetIds.size} selected snippets? This will permanently delete their text and associated audio generations.`,
      confirmLabel: "Delete Snippets",
      isDangerous: true,
      onConfirm: () => {
        setProject(prev => {
          const updatedChapters = prev.chapters.map(c => {
            const remainingSnippets = c.snippets.filter(s => !selectedSnippetIds.has(s.id));
            remainingSnippets.forEach((s, idx) => s.order = idx);
            return {
              ...c,
              snippets: remainingSnippets.length > 0 
                ? remainingSnippets 
                : [{ id: generateId(), order: 0, text: '', speakerId: null, status: 'idle', isCollapsed: false, generations: [], activeGenerationId: null }]
            };
          });
          return { ...prev, chapters: updatedChapters };
        });
        setSelectedSnippetIds(new Set());
      }
    });
  };

  const handleBulkAssignSpeaker = (speakerId: string | null) => {
    if (selectedSnippetIds.size === 0) return;
    setProject(prev => {
      const updatedChapters = prev.chapters.map(c => ({
        ...c,
        snippets: c.snippets.map(s => selectedSnippetIds.has(s.id) ? { ...s, speakerId } : s)
      }));
      return { ...prev, chapters: updatedChapters };
    });
  };

  const handleBulkAssignScene = (sceneId: string | null) => {
    if (selectedSnippetIds.size === 0) return;
    setProject(prev => {
      const updatedChapters = prev.chapters.map(c => ({
        ...c,
        snippets: c.snippets.map(s => selectedSnippetIds.has(s.id) ? { ...s, sceneId: sceneId || undefined } : s)
      }));
      return { ...prev, chapters: updatedChapters };
    });
  };

  const handleBulkMoveToChapter = (targetChapterId: string) => {
    if (selectedSnippetIds.size === 0) return;
    const targetChapter = project.chapters.find(c => c.id === targetChapterId);
    if (!targetChapter) return;

    setProject(prev => {
      const selectedSnippets: Snippet[] = [];
      prev.chapters.forEach(c => {
        c.snippets.forEach(s => {
          if (selectedSnippetIds.has(s.id)) {
            selectedSnippets.push({ ...s });
          }
        });
      });

      const updatedChapters = prev.chapters.map(c => {
        if (c.id === targetChapterId) {
          const otherSnippets = c.snippets.filter(s => !selectedSnippetIds.has(s.id));
          const newSnippets = [...otherSnippets, ...selectedSnippets];
          newSnippets.forEach((s, idx) => s.order = idx);
          return { ...c, snippets: newSnippets };
        } else {
          const remainingSnippets = c.snippets.filter(s => !selectedSnippetIds.has(s.id));
          if (remainingSnippets.length === 0) {
            remainingSnippets.push({ id: generateId(), order: 0, text: '', speakerId: null, status: 'idle', isCollapsed: false, generations: [], activeGenerationId: null });
          }
          remainingSnippets.forEach((s, idx) => s.order = idx);
          return { ...c, snippets: remainingSnippets };
        }
      });

      return { ...prev, chapters: updatedChapters };
    });
    setSelectedSnippetIds(new Set());
  };

  const handleBulkGenerate = async () => {
    if (selectedSnippetIds.size === 0) return;

    const isMultiSpeakerMode = project.settings.generationOption === 'combined'
      || project.settings.concatenationOption === 'per-scene'
      || project.settings.concatenationOption === 'per-chapter'
      || (project.settings.generationOption !== 'individual' && selectedSnippetIds.size > 1);

    if (!isMultiSpeakerMode) {
      // Individual mode rate-limited parallel generation
      const selectedList = Array.from(selectedSnippetIds) as string[];
      const itemsToGen: { chapterId: string; snippetId: string }[] = [];

      for (const snippetId of selectedList) {
        for (const c of project.chapters) {
          if (c.snippets.some(s => s.id === snippetId)) {
            itemsToGen.push({ chapterId: c.id, snippetId });
            break;
          }
        }
      }

      await runRateLimitedBatch(itemsToGen, item => handleGenerateSnippetAsync(item.chapterId, item.snippetId));
      setSelectedSnippetIds(new Set<string>());
      return;
    }

    // Multi-speaker generation!
    const selectedSnippets = (Array.from(selectedSnippetIds) as string[])
      .map(id => {
        for (const c of project.chapters) {
          const s = c.snippets.find(x => x.id === id);
          if (s) return s;
        }
        return null;
      })
      .filter((s): s is Snippet => !!s)
      .sort((a, b) => a.order - b.order);

    const activeValidationMode = project.settings.generationOption === 'combined'
      ? 'per-scene'
      : (project.settings.concatenationOption || 'per-scene');

    const validation = getGenerationValidationState(
      selectedSnippets,
      project.speakers,
      project.scenes || [],
      activeValidationMode,
      1000
    );

    if (!validation.valid) {
      alert(validation.reason || "Validation failed for selected snippets.");
      return;
    }

    const activeChapter = project.chapters.find(c => c.snippets.some(s => s.id === selectedSnippets[0].id));
    if (!activeChapter) return;

    // Set all selected snippets to 'generating' status
    selectedSnippets.forEach(sn => {
      updateSnippetState(activeChapter.id, sn.id, { status: 'generating', errorMessage: undefined });
    });

    try {
      const { prompt, uniqueSpeakers } = compilePrompt({
        project,
        activeChapter,
        snippetsOverride: selectedSnippets
      });

      // 7. Format and interpolate transcript
      let rawText = "";
      if (selectedSnippets.length > 0) {
        rawText = selectedSnippets.map(s => {
          (s.text || "").trim();
        }).join('\n');
      }

      const modelId = project.settings.model.id;
      const primaryVoice = uniqueSpeakers[0]?.voice || "Puck";
      const ttsResult = await generateTTS(
        prompt,
        primaryVoice,
        undefined,
        modelId,
        {
          speakers: uniqueSpeakers.map(sp => ({ name: sp.name || "Narrator", voice: sp.voice || "Puck" })),
          temperature: project.settings.temperature,
          useInteractionsAPI: project.settings.apiType === 'Interactions',
          snippetCount: selectedSnippets.length,
          textChars: rawText.length,
          textWords: rawText.split(/\s+/g).length
        }
      );
      const { data, mimeType } = ttsResult;

      const duration = await getAudioDuration(data, mimeType);
      const generationId = generateId();

      // Save audio data to IndexedDB
      await saveAudio(generationId, data, mimeType, duration);

      // Trigger asynchronous Google Sheets generation telemetry logging if configured
      if (userPreferences.sheetsLoggingEnabled && userPreferences.sheetsSpreadsheetId) {
        const snippetIndices = selectedSnippets
          .map(s => activeChapter.snippets.findIndex(sn => sn.id === s.id))
          .filter(idx => idx >= 0);
        const snippetStart = snippetIndices.length > 0 ? Math.min(...snippetIndices) : 0;
        const snippetEnd = snippetIndices.length > 0 ? Math.max(...snippetIndices) : 0;
        const approxSizeBytes = Math.round((data.length * 3) / 4);

        const payload = createLogPayloadFromGeneration({
          status: 200,
          statusMessage: 'OK',
          responseTimeMs: ttsResult.responseTime || 0,
          projectName: project.title,
          chapterName: activeChapter.title,
          speakers: uniqueSpeakers.map(sp => ({ name: sp.name, voice: sp.voice })),
          model: modelId,
          temperature: project.settings.temperature ?? 1.0,
          snippetStart,
          snippetEnd,
          rawText: rawText,
          promptText: prompt,
          audioDurationMs: Math.round(duration * 1000),
          audioSizeBytes: approxSizeBytes,
          promptTokens: ttsResult.promptTokens,
          responseTokens: ttsResult.responseTokens
        });

        logGenerationEvent(payload, userPreferences).catch(err => {
          console.warn("Async Sheets logging notification:", err);
        });
      }

      // Save the multi-speaker generation to each selected snippet
      setProject(prev => {
        const updatedChapters = prev.chapters.map(c => {
          if (c.id !== activeChapter.id) return c;
          return {
            ...c,
            snippets: c.snippets.map(s => {
              if (!selectedSnippetIds.has(s.id)) return s;

              const newGen: Generation = {
                id: generationId,
                snippetId: s.id,
                speakerId: s.speakerId || c.defaultSpeakerId || '',
                timestamp: new Date().toISOString(),
                model: modelId,
                text: s.text,
                audioMimeType: mimeType,
                duration: duration,
                temperature: project.settings.temperature ?? 1.0
              };

              return {
                ...s,
                status: 'done',
                generations: [newGen, ...s.generations],
                activeGenerationId: generationId
              };
            })
          };
        });
        return { ...prev, chapters: updatedChapters };
      });

      setSelectedSnippetIds(new Set<string>());

    } catch (error: any) {
      console.error("Multi-speaker generation failed:", error);
      selectedSnippets.forEach(sn => {
        updateSnippetState(activeChapter.id, sn.id, { status: 'error', errorMessage: error.message || "Failed to generate multi-speaker audio." });
      });
    }
  };

  //#endregion

  //#region Markdown Import
  const handleMarkdownUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsedProject = parseMarkdown(text);
      setProject(parsedProject);
      if (parsedProject.chapters && parsedProject.chapters.length > 0) {
        setActiveChapterId(parsedProject.chapters[0].id);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  //#endregion

  if (!isLoaded) return null;

  const focusedSnippet = getFocusedSnippet();

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-300 font-sans overflow-hidden">
      
      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="min-h-[4rem] py-2 border-b border-slate-800 flex flex-wrap items-center justify-between px-4 sm:px-6 bg-slate-900/50 shrink-0 gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
              <Mic className="w-5 h-5 text-indigo-400" />
            </div>
            <input 
              type="text" 
              value={project.title}
              onChange={(e) => updateProjectState({ title: e.target.value })}
              className="bg-transparent text-xl font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-2 py-1 -ml-2 w-full max-w-md truncate"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            
            {/* Project File Actions */}
            <div className="flex items-center bg-slate-800 rounded-md p-1">
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={projectInputRef}
                onChange={handleImportProject}
              />
              <button 
                onClick={() => projectInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 rounded transition-colors"
                title="Load Project"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden lg:inline">Proj.</span>
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button 
                onClick={handleExportProject}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs font-medium rounded transition-all duration-1000 ease-out ${saveFlash ? 'bg-emerald-500/25 text-emerald-400 font-semibold scale-105 shadow-md shadow-emerald-500/10' : 'text-slate-300 hover:bg-slate-700'}`}
                title="Save Project"
              >
                <Save className="w-4 h-4" />
                <span className="hidden lg:inline">Proj.</span>
              </button>
            </div>

            {/* Sidecar Actions */}
            <div className="flex items-center bg-slate-800 rounded-md p-1">
              <input 
                type="file" 
                accept=".audio.json" 
                className="hidden" 
                ref={sidecarInputRef}
                onChange={handleImportSidecar}
              />
              <button 
                onClick={() => sidecarInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 rounded transition-colors"
                title="Load Audio Sidecar"
              >
                <FileAudio className="w-4 h-4" />
                <span className="hidden lg:inline">Audio</span>
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button 
                onClick={handleExportSidecar}
                disabled={isExportingSidecar}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-60 rounded transition-colors"
                title="Save Audio Sidecar"
              >
                <Download className={`w-4 h-4 ${isExportingSidecar ? 'animate-bounce text-indigo-400' : ''}`} />
                <span className="hidden lg:inline">
                  {isExportingSidecar ? (sidecarExportProgress ? `Exporting (${sidecarExportProgress})` : 'Exporting...') : 'Audio'}
                </span>
              </button>
            </div>

            <input 
              type="file" 
              accept=".md,.txt" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleMarkdownUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              title="Import Markdown"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">Parse</span>
            </button>
            <button 
              onClick={handleGenerateAll}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-lg shadow-indigo-500/20"
              title="Generate All Audio"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden lg:inline">Generate</span>
            </button>

            {/* Concatenate Full Project Audio */}
            <button 
              onClick={handleExportFullProjectAudio}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors shadow-lg shadow-emerald-500/20"
              title="Export Concatenated Audiobook"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Export</span>
            </button>

            <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>

            <button 
              onClick={() => openSettings('project')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              title="Open Settings Dialogue"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span className="hidden lg:inline">Settings</span>
            </button>

            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-md transition-colors ${isSidebarOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
              title="Toggle Settings Sidebar"
            >
              {isSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Chapters Scroll Area (Single Active Chapter) */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {(() => {
            const activeChapter = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];
            if (!activeChapter) {
              return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                  <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
                  <p className="text-slate-400 font-medium mb-3">No chapters in this project yet.</p>
                  <button 
                    onClick={addChapterState}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Your First Chapter
                  </button>
                </div>
              );
            }

            const chapterIndex = project.chapters.findIndex(c => c.id === activeChapter.id);
            const chapterWordCount = activeChapter.snippets.reduce((acc, s) => acc + (s.text.trim() ? s.text.trim().split(/\s+/).length : 0), 0);
            const chapterCharCount = activeChapter.snippets.reduce((acc, s) => acc + s.text.length, 0);
            const chapterTokenEstimate = Math.ceil(chapterCharCount / 4) || 0;
            const allSnippetsSelected = activeChapter.snippets.length > 0 && activeChapter.snippets.every(s => selectedSnippetIds.has(s.id));

            const selectedSnippets = activeChapter.snippets.filter(s => selectedSnippetIds.has(s.id));
            const isAnySelected = selectedSnippets.length > 0;

            const selCharCount = isAnySelected ? selectedSnippets.reduce((acc, s) => acc + s.text.length, 0) : chapterCharCount;
            const selWordCount = isAnySelected ? selectedSnippets.reduce((acc, s) => acc + (s.text.trim() ? s.text.trim().split(/\s+/).length : 0), 0) : chapterWordCount;

            const compiledRes = isAnySelected
              ? compilePrompt({ project, activeChapter, selectedSnippetIds })
              : compilePrompt({ project, activeChapter });

            const promptCharCount = compiledRes.prompt.length;
            const promptWordCount = compiledRes.prompt.trim() ? compiledRes.prompt.trim().split(/\s+/).length : 0;
            const overheadCharCount = promptCharCount - selCharCount;

            return (
              <div 
                key={activeChapter.id} 
                className="group/chapter bg-slate-900 rounded-xl border border-slate-800 shadow-sm transition-all flex flex-col"
              >
                {/* Unified Sticky Chapter Header with Dynamic Stats & Selection Controls */}
                <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shrink-0 shadow-md rounded-t-xl">
                  {/* Top Row: Chapter Information & Chapter Actions */}
                  <div className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                      <input 
                        type="checkbox" 
                        checked={allSnippetsSelected}
                        onChange={() => handleSelectAllSnippets(activeChapter.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 cursor-pointer shrink-0"
                        title="Select/Deselect All Snippets"
                      />
                      <IconButton 
                        icon={activeChapter.isCollapsed ? ChevronRight : ChevronDown} 
                        onClick={() => updateChapterState(activeChapter.id, { isCollapsed: !activeChapter.isCollapsed })} 
                        className="!p-1 text-slate-400 hover:text-slate-200" 
                        title={activeChapter.isCollapsed ? "Expand Chapter" : "Collapse Chapter"}
                      />
                      <div className="flex flex-col opacity-0 group-hover/chapter:opacity-100 transition-opacity mr-1 shrink-0">
                        <IconButton icon={ArrowUp} onClick={() => moveChapterState(chapterIndex, 'up')} className="!p-0" disabled={chapterIndex === 0} title="Move Chapter Up" />
                        <IconButton icon={ArrowDown} onClick={() => moveChapterState(chapterIndex, 'down')} className="!p-0" disabled={chapterIndex === project.chapters.length - 1} title="Move Chapter Down" />
                      </div>
                      <input 
                        type="text" 
                        value={activeChapter.title}
                        onChange={(e) => updateChapterState(activeChapter.id, { title: e.target.value })}
                        className="bg-transparent text-lg font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 flex-1 min-w-[140px] max-w-sm truncate"
                      />
                      
                      {/* Chapter Default Speaker */}
                      <div className="flex items-center gap-1.5 ml-2 min-w-[160px]">
                        <Users className="w-4 h-4 text-slate-500 shrink-0" />
                        <select 
                          value={activeChapter.defaultSpeakerId || ''}
                          onChange={(e) => updateChapterState(activeChapter.id, { defaultSpeakerId: e.target.value || null })}
                          className="bg-slate-950 border border-slate-700 text-xs rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-300 w-full"
                        >
                          <option value="">Default Speaker...</option>
                          {project.speakers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Collapse/Expand All Snippets Buttons */}
                      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/chapter:opacity-100 transition-opacity shrink-0">
                        <button 
                          onClick={() => toggleAllSnippetsInChapter(activeChapter.id, true)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold flex items-center gap-1"
                          title="Collapse All Snippets"
                        >
                          <Minimize2 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => toggleAllSnippetsInChapter(activeChapter.id, false)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold flex items-center gap-1"
                          title="Expand All Snippets"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Chapter Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <IconButton icon={Wand2} title="Generate Chapter Audio" onClick={() => handleGenerateChapter(activeChapter.id)} className="hover:text-indigo-400" />
                      <IconButton icon={Play} title="Play Chapter" onClick={() => playFromSnippetById(activeChapter.id, activeChapter.snippets[0]?.id)} />
                      <IconButton icon={Download} title="Export Concatenated Chapter Audio" onClick={() => handleExportChapterAudio(activeChapter.id)} className="hover:text-emerald-400" />
                      <IconButton icon={ArrowUp} title="Scroll to Top" onClick={handleScrollToTop} className="hover:text-slate-200" />
                      <IconButton 
                        icon={Trash2} 
                        title="Delete Chapter" 
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: "Delete Chapter",
                            message: `Are you sure you want to delete chapter "${activeChapter.title}"? This will permanently delete all associated text snippets and audio generations.`,
                            confirmLabel: "Delete Chapter",
                            isDangerous: true,
                            onConfirm: () => {
                              deleteChapterState(activeChapter.id);
                              if (project.chapters.length > 1) {
                                const nextIdx = chapterIndex === 0 ? 1 : chapterIndex - 1;
                                setActiveChapterId(project.chapters[nextIdx].id);
                              } else {
                                setActiveChapterId(null);
                              }
                            }
                          });
                        }} 
                        className="hover:text-red-400" 
                      />
                    </div>
                  </div>

                  {/* Sub-Row: Dynamic Stats Bar & Selection Operations */}
                  <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between flex-wrap gap-2.5">
                    {/* Dynamic Stats Section */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
                      <span className="flex items-center gap-1.5" title="Selected snippets out of chapter total">
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-slate-400 font-sans font-semibold">Selected Snippets</span>
                        <span className={isAnySelected ? "text-indigo-300 font-bold" : "text-slate-400"}>{selectedSnippets.length}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-400 font-sans font-semibold">Ch. Snippets</span>
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{activeChapter.snippets.length}</span>
                      </span>

                      <span className="text-slate-600">•</span>

                      <span className="flex items-center gap-1.5" title="Chars and Words">
                        <span className="text-slate-400 font-sans font-semibold">Chars</span>
                        <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{selCharCount}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-400 font-sans font-semibold">Words</span>
                        <span>{selWordCount}</span>
                      </span>

                      <span className="text-slate-600">•</span>

                      <span className="flex items-center gap-1.5" title="Prompt Chars and Prompt Words">
                        <span className="text-indigo-400 font-sans font-semibold">Prompt Chars</span>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{promptCharCount}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-indigo-400 font-sans font-semibold">Prompt Words</span>
                        <span>{promptWordCount}</span>
                      </span>

                      <span className="text-slate-600">•</span>

                      <span className="flex items-center gap-1" title="Overhead added by template and character definitions">
                        <span className="text-amber-400 font-sans font-semibold">Overhead:</span>
                        <span className="text-amber-300">{overheadCharCount >= 0 ? `+${overheadCharCount}` : overheadCharCount} chars</span>
                      </span>
                    </div>

                    {/* Selection Action Controls (when 1+ snippets selected) */}
                    {isAnySelected && (
                      <div className="flex items-center gap-2.5 flex-wrap ml-auto">
                        <button 
                          onClick={handleClearSelection}
                          className="text-xs text-slate-400 hover:text-slate-200 underline whitespace-nowrap"
                        >
                          Deselect All
                        </button>
                        
                        <div className="w-px h-4 bg-slate-800"></div>

                        {/* Move to Chapter */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400 font-medium whitespace-nowrap">Move:</span>
                          <select 
                            onChange={(e) => {
                              if (e.target.value) {
                                handleBulkMoveToChapter(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200"
                          >
                            <option value="">Move to chapter...</option>
                            {project.chapters.filter(c => c.id !== activeChapter.id).map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="w-px h-4 bg-slate-800"></div>

                        {/* Generate */}
                        <button 
                          onClick={handleBulkGenerate}
                          disabled={!currentSelectionValidation.valid}
                          title={currentSelectionValidation.valid ? "Generate" : currentSelectionValidation.reason}
                          className={`flex items-center gap-1.5 px-3 py-1 text-white rounded text-xs font-semibold transition-colors shadow-md whitespace-nowrap ${
                            currentSelectionValidation.valid 
                              ? "bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-indigo-500/20" 
                              : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <Wand2 className="w-3.5 h-3.5" /> Generate
                        </button>

                        {/* Delete */}
                        <button 
                          onClick={handleBulkDelete}
                          className="flex items-center gap-1.5 px-3 py-1 bg-red-600/20 hover:bg-red-500/35 text-red-400 rounded text-xs font-semibold transition-colors border border-red-500/20 whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsed Summary */}
                {activeChapter.isCollapsed && (
                  <div 
                    className="px-12 py-3 text-xs text-slate-500 italic bg-slate-900/30 cursor-pointer hover:bg-slate-800/30 transition-colors flex items-center gap-3"
                    onClick={() => updateChapterState(activeChapter.id, { isCollapsed: false })}
                  >
                    <span>{activeChapter.snippets.length} snippet{activeChapter.snippets.length !== 1 ? 's' : ''} hidden</span>
                    <span>•</span>
                    <span>{chapterWordCount} words</span>
                    <span>•</span>
                    <span>{chapterCharCount} characters</span>
                    <span>•</span>
                    <span>~{chapterTokenEstimate} tokens</span>
                  </div>
                )}

                {/* Snippets List */}
                {!activeChapter.isCollapsed && (
                  <div className="p-4 space-y-4">
                    {groupSnippetsByGeneration(activeChapter.snippets).map((group) => {
                      if (group.isGrouped && group.generation) {
                        const isGroupPlaying = activePlayingId !== null && (
                          activePlayingId === group.generation.id || 
                          group.snippets.some(s => s.id === activePlayingId)
                        );
                        const isGroupGenerating = group.snippets.some(s => s.status === 'generating');

                        return (
                          <GenerationGroupContainer
                            key={group.id}
                            group={group}
                            chapterNumber={chapterIndex + 1}
                            chapterId={activeChapter.id}
                            scenes={project.scenes || []}
                            speakers={project.speakers}
                            isPlaying={isGroupPlaying}
                            isGenerating={isGroupGenerating}
                            onUpdateGenerationName={(genId, newName) => {
                              handleUpdateGenerationName(activeChapter.id, genId, newName);
                            }}
                            onPlay={(gen) => playSnippetAudioById(gen.id)}
                            onPlayFromHere={(snipId) => playFromSnippetById(activeChapter.id, snipId)}
                            onStop={handleStopAudio}
                            onRegenerate={() => {
                              setSelectedSnippetIds(new Set(group.snippets.map(s => s.id)));
                              handleBulkGenerate();
                            }}
                            onExport={() => handleExportGroupAudio(group.generation!)}
                          >
                            {group.snippets.map((snippet) => {
                              const globalSnippetIndex = activeChapter.snippets.findIndex(s => s.id === snippet.id);
                              return (
                                <div 
                                  key={snippet.id}
                                  draggable
                                  onDragStart={(e) => handleSnippetDragStart(e, snippet.id, activeChapter.id)}
                                  onDragOver={(e) => handleSnippetDragOver(e, snippet.id, activeChapter.id)}
                                  onDrop={(e) => handleSnippetDrop(e, snippet.id, activeChapter.id)}
                                >
                                  <SnippetEditor 
                                    snippet={snippet}
                                    chapterId={activeChapter.id}
                                    index={globalSnippetIndex}
                                    totalSnippets={activeChapter.snippets.length}
                                    speakers={project.speakers}
                                    scenes={project.scenes || []}
                                    chapterDefaultSpeakerId={activeChapter.defaultSpeakerId}
                                    isPlaying={activePlayingId !== null && (activePlayingId === snippet.id || activePlayingId === snippet.activeGenerationId)}
                                    isFocused={focusedSnippetId === snippet.id}
                                    isSelected={selectedSnippetIds.has(snippet.id)}
                                    isInsideGroup={true}
                                    onToggleSelect={() => handleToggleSelectSnippet(snippet.id)}
                                    onFocus={() => {
                                      setFocusedSnippetId(snippet.id);
                                      setFocusedChapterId(activeChapter.id);
                                    }}
                                    onUpdate={(updates) => {
                                      updateSnippetState(activeChapter.id, snippet.id, updates);
                                    }}
                                    onDelete={() => deleteSnippetState(activeChapter.id, snippet.id)}
                                    onMove={(dir) => moveSnippetState(activeChapter.id, globalSnippetIndex, dir)}
                                    onSplit={(pos) => splitSnippetState(activeChapter.id, snippet.id, pos)}
                                    onJoinNext={() => joinSnippetWithNextState(activeChapter.id, snippet.id)}
                                    onAddNext={() => addSnippetState(activeChapter.id, globalSnippetIndex)}
                                    onGenerate={() => handleGenerateSnippetAsync(activeChapter.id, snippet.id)}
                                    onPlay={() => playSnippetAudio(snippet)}
                                    onPlayFromHere={() => playFromSnippetById(activeChapter.id, snippet.id)}
                                    onStop={handleStopAudio}
                                    onExport={() => handleExportSnippetAudio(activeChapter.id, snippet.id)}
                                  />
                                </div>
                              );
                            })}
                          </GenerationGroupContainer>
                        );
                      }

                      // Standalone snippet
                      const snippet = group.snippets[0];
                      const globalSnippetIndex = activeChapter.snippets.findIndex(s => s.id === snippet.id);
                      return (
                        <div 
                          key={snippet.id}
                          draggable
                          onDragStart={(e) => handleSnippetDragStart(e, snippet.id, activeChapter.id)}
                          onDragOver={(e) => handleSnippetDragOver(e, snippet.id, activeChapter.id)}
                          onDrop={(e) => handleSnippetDrop(e, snippet.id, activeChapter.id)}
                        >
                          <SnippetEditor 
                            snippet={snippet}
                            chapterId={activeChapter.id}
                            index={globalSnippetIndex}
                            totalSnippets={activeChapter.snippets.length}
                            speakers={project.speakers}
                            scenes={project.scenes || []}
                            chapterDefaultSpeakerId={activeChapter.defaultSpeakerId}
                            isPlaying={activePlayingId !== null && (activePlayingId === snippet.id || activePlayingId === snippet.activeGenerationId)}
                            isFocused={focusedSnippetId === snippet.id}
                            isSelected={selectedSnippetIds.has(snippet.id)}
                            isInsideGroup={false}
                            onToggleSelect={() => handleToggleSelectSnippet(snippet.id)}
                            onFocus={() => {
                              setFocusedSnippetId(snippet.id);
                              setFocusedChapterId(activeChapter.id);
                            }}
                            onUpdate={(updates) => {
                              updateSnippetState(activeChapter.id, snippet.id, updates);
                            }}
                            onDelete={() => deleteSnippetState(activeChapter.id, snippet.id)}
                            onMove={(dir) => moveSnippetState(activeChapter.id, globalSnippetIndex, dir)}
                            onSplit={(pos) => splitSnippetState(activeChapter.id, snippet.id, pos)}
                            onJoinNext={() => joinSnippetWithNextState(activeChapter.id, snippet.id)}
                            onAddNext={() => addSnippetState(activeChapter.id, globalSnippetIndex)}
                            onGenerate={() => handleGenerateSnippetAsync(activeChapter.id, snippet.id)}
                            onPlay={() => playSnippetAudio(snippet)}
                            onPlayFromHere={() => playFromSnippetById(activeChapter.id, snippet.id)}
                            onStop={handleStopAudio}
                            onExport={() => handleExportSnippetAudio(activeChapter.id, snippet.id)}
                          />
                        </div>
                      );
                    })}
                    
                    <button 
                      onClick={() => addSnippetState(activeChapter.id, activeChapter.snippets.length - 1)}
                      className="w-full py-3 border-2 border-dashed border-slate-800 rounded-lg text-slate-500 hover:text-slate-300 hover:border-slate-600 hover:bg-slate-800/30 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Snippet
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Bottom padding */}
          <div className="h-12"></div>
        </div>
      </div>

      {/* --- Sidebar Area --- */}
      {isSidebarOpen && (
        <>
          {/* Resizer Handle */}
          <div 
            className="w-1.5 cursor-col-resize bg-slate-800 hover:bg-indigo-500 transition-colors z-10 shrink-0 flex items-center justify-center group"
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
          >
            <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-indigo-300 rounded-full" />
          </div>

          {/* Sidebar Content */}
          <div 
            className="bg-slate-900 flex flex-col h-full shrink-0 border-l border-slate-800"
            style={{ width: sidebarWidth }}
          >
            {/* Sidebar Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 shrink-0">
              <h2 className="text-md font-semibold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Studio Panel</span>
              </h2>
              <button 
                onClick={() => openSettings('project')}
                className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                title="Full Settings Dialog"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Chapters List */}
              <section className="bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-slate-900/40 border-b border-slate-800/60">
                  <div 
                    onClick={() => setIsChaptersCollapsed(!isChaptersCollapsed)}
                    className="flex items-center gap-1.5 cursor-pointer select-none group/hdr"
                  >
                    <button type="button" className="p-0.5 text-slate-500 group-hover/hdr:text-slate-300 transition-colors">
                      {isChaptersCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <h3 className="text-xs font-semibold text-slate-400 group-hover/hdr:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Chapters
                    </h3>
                  </div>
                  <button 
                    onClick={addChapterState}
                    className="p-1 hover:bg-slate-800 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="Add Chapter"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!isChaptersCollapsed && (
                  <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
                    {project.chapters.map((chapter, index) => {
                      const isActive = chapter.id === activeChapterId || (!activeChapterId && index === 0);
                      const wordCount = chapter.snippets.reduce((acc, s) => acc + (s.text.trim() ? s.text.trim().split(/\s+/).length : 0), 0);
                      return (
                        <div 
                          key={chapter.id}
                          onClick={() => {
                            setActiveChapterId(chapter.id);
                            handleClearSelection();
                          }}
                          className={`group/chapter-row flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                            isActive 
                              ? 'bg-indigo-950/30 border-indigo-500/40 text-slate-100' 
                              : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-mono text-[10px] opacity-40 shrink-0">CH {index + 1}</span>
                            <span className="truncate font-medium">{chapter.title || "Untitled Chapter"}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] opacity-50 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded font-mono">
                              {wordCount}W
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/chapter-row:opacity-100 transition-opacity">
                              <IconButton 
                                icon={ArrowUp} 
                                onClick={(e) => { e.stopPropagation(); moveChapterState(index, 'up'); }} 
                                className="!p-0.5 text-slate-500 hover:text-slate-300" 
                                disabled={index === 0} 
                              />
                              <IconButton 
                                icon={ArrowDown} 
                                onClick={(e) => { e.stopPropagation(); moveChapterState(index, 'down'); }} 
                                className="!p-0.5 text-slate-500 hover:text-slate-300" 
                                disabled={index === project.chapters.length - 1} 
                              />
                              <IconButton 
                                icon={Trash2} 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Delete Chapter",
                                    message: `Are you sure you want to delete chapter "${chapter.title}"? This will permanently delete all associated text snippets and audio generations.`,
                                    confirmLabel: "Delete Chapter",
                                    isDangerous: true,
                                    onConfirm: () => {
                                      deleteChapterState(chapter.id);
                                      if (isActive) {
                                        if (project.chapters.length > 1) {
                                          const nextIdx = index === 0 ? 1 : index - 1;
                                          setActiveChapterId(project.chapters[nextIdx].id);
                                        } else {
                                          setActiveChapterId(null);
                                        }
                                      }
                                    }
                                  });
                                }} 
                                className="!p-0.5 text-slate-500 hover:text-red-400" 
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {project.chapters.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-600 italic">
                        No chapters defined.
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Scenes List */}
              <section className="bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between p-3 bg-slate-900/40 border-b border-slate-800/60">
                  <div 
                    onClick={() => setIsScenesCollapsed(!isScenesCollapsed)}
                    className="flex items-center gap-1.5 cursor-pointer select-none group/hdr"
                  >
                    <button type="button" className="p-0.5 text-slate-500 group-hover/hdr:text-slate-300 transition-colors">
                      {isScenesCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <h3 className="text-xs font-semibold text-slate-400 group-hover/hdr:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                      <Clapperboard className="w-3.5 h-3.5 text-indigo-400" /> Scenes
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => openSettings('scenes', false, true)}
                    className="p-1 hover:bg-slate-800 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="Manage Scenes in Settings"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!isScenesCollapsed && (
                  <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
                    {(project.scenes || []).map((scene) => {
                      const isFocSnippetMatching = focusedSnippetId && (() => {
                        const activeCh = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];
                        const sn = activeCh?.snippets.find(s => s.id === focusedSnippetId);
                        return sn && sn.sceneId === scene.id;
                      })();

                      return (
                        <div 
                          key={scene.id}
                          onClick={() => {
                            if (selectedSnippetIds.size > 0) {
                              handleBulkAssignScene(scene.id);
                            } else if (focusedSnippetId) {
                              const activeCh = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];
                              if (activeCh) {
                                updateSnippetState(activeCh.id, focusedSnippetId, { sceneId: scene.id });
                              }
                            }
                          }}
                          className={`group/scene-row flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                            isFocSnippetMatching 
                              ? 'bg-indigo-950/30 border-indigo-500/40 text-slate-100' 
                              : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                          title="Click to apply to selected or focused snippet"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">{scene.name}</div>
                            <div className="text-[10px] opacity-50 truncate">{scene.description || "No description."}</div>
                          </div>
                          {isFocSnippetMatching && (
                            <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 ml-2" />
                          )}
                        </div>
                      );
                    })}
                    {(!project.scenes || project.scenes.length === 0) && (
                      <div className="text-center py-4 text-xs text-slate-600 italic">
                        No scenes defined. Click + to add one.
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Speakers List */}
              <section className="bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-slate-900/40 border-b border-slate-800/60">
                  <div 
                    onClick={() => setIsSpeakersCollapsed(!isSpeakersCollapsed)}
                    className="flex items-center gap-1.5 cursor-pointer select-none group/hdr"
                  >
                    <button type="button" className="p-0.5 text-slate-500 group-hover/hdr:text-slate-300 transition-colors">
                      {isSpeakersCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <h3 className="text-xs font-semibold text-slate-400 group-hover/hdr:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                      <Users className="w-3.5 h-3.5 text-indigo-400" /> Speakers
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => openSettings('speakers', true)}
                    className="p-1 hover:bg-slate-800 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="Manage Speakers in Settings"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!isSpeakersCollapsed && (
                  <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
                    {project.speakers.map((speaker) => {
                      const speakerStyles = getSpeakerStyles(speaker.id, project.speakers);
                      const isFocSnippetMatching = focusedSnippetId && (() => {
                        const activeCh = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];
                        const sn = activeCh?.snippets.find(s => s.id === focusedSnippetId);
                        return sn && (sn.speakerId === speaker.id || (!sn.speakerId && activeCh.defaultSpeakerId === speaker.id));
                      })();

                      return (
                        <div 
                          key={speaker.id}
                          onClick={() => {
                            if (selectedSnippetIds.size > 0) {
                              handleBulkAssignSpeaker(speaker.id);
                            } else if (focusedSnippetId) {
                              const activeCh = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];
                              if (activeCh) {
                                updateSnippetState(activeCh.id, focusedSnippetId, { speakerId: speaker.id });
                              }
                            }
                          }}
                          className={`group/speaker-row flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                            isFocSnippetMatching 
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200' 
                              : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                          title="Click to apply to selected or focused snippet"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* Color Dot avatar */}
                            <div 
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                              style={{ 
                                backgroundColor: speakerStyles.customStyle.color || '#6366f1' 
                              }}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{speaker.name}</div>
                              <div className="text-[10px] opacity-50 truncate">{speaker.voice}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Play Preview button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (previewingSpeakerId === speaker.id) {
                                  handleStopAudio();
                                } else {
                                  handlePreviewVoice(speaker);
                                }
                              }}
                              className={`p-1 rounded text-xs border ${
                                previewingSpeakerId === speaker.id 
                                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' 
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50'
                              }`}
                              title="Preview Speaker Voice"
                            >
                              {previewingSpeakerId === speaker.id ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </button>

                            {/* "G" Trigger generation for speaker */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const activeCh = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];
                                if (!activeCh) return;
                                const matching = activeCh.snippets.filter(s => (s.speakerId || activeCh.defaultSpeakerId) === speaker.id);
                                if (matching.length === 0) {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "No Snippets Found",
                                    message: `There are no text snippets currently assigned to character "${speaker.name}" in this chapter.`,
                                    confirmLabel: "OK",
                                    onConfirm: () => {}
                                  });
                                  return;
                                }

                                setConfirmModal({
                                  isOpen: true,
                                  title: "Generate Character Audio",
                                  message: `Are you sure you want to generate multi-speaker audio for all ${matching.length} snippets assigned to ${speaker.name} in this chapter?`,
                                  confirmLabel: "Generate Audio",
                                  onConfirm: async () => {
                                    for (const sn of matching) {
                                      await handleGenerateSnippetAsync(activeCh.id, sn.id);
                                    }
                                  }
                                });
                              }}
                              className="p-1 rounded text-xs border bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-indigo-400 font-bold hover:text-indigo-300"
                              title="Generate All snippets for this speaker in active chapter"
                            >
                              G
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {project.speakers.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-600 italic">
                        No speakers defined.
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Context-Sensitive Generation History */}
              {focusedSnippetId && (() => {
                const activeCh = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];
                const focusedSnippet = activeCh?.snippets.find(s => s.id === focusedSnippetId);
                if (!focusedSnippet) return null;
                return (
                  <section className="bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                      className="w-full flex items-center justify-between p-3 bg-slate-900/40 hover:bg-slate-800/30 transition-colors"
                    >
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-indigo-400" /> Generation History
                      </h3>
                      {isHistoryCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                    
                    {!isHistoryCollapsed && (
                      <div className="p-2 space-y-2 border-t border-slate-800 max-h-60 overflow-y-auto">
                        {focusedSnippet.generations.length === 0 ? (
                          <div className="text-center py-4 text-[11px] text-slate-600 italic">
                            No generations yet for this snippet.
                          </div>
                        ) : (
                          focusedSnippet.generations.map((gen) => {
                            const isGenPlaying = activePlayingId === gen.id;
                            const isGenActive = focusedSnippet.activeGenerationId === gen.id;
                            return (
                              <div 
                                key={gen.id} 
                                onClick={() => handleSelectGeneration(gen)}
                                className={`p-2 rounded border text-[11px] transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                  isGenActive 
                                    ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200' 
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                                }`}
                              >
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-slate-300">
                                      {new Date(gen.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <span className="text-[9px] opacity-65">({(gen.model || 'unknown').replace('-tts', '')})</span>
                                    {gen.temperature !== undefined && (
                                      <span className="text-[9px] text-indigo-300/80 bg-indigo-950/60 px-1 rounded border border-indigo-800/40">T: {gen.temperature}</span>
                                    )}
                                  </div>
                                  <div className="truncate text-[10px] italic opacity-85">"{gen.text}"</div>
                                  <div className="text-[9px] opacity-65">Duration: {formatDuration(gen.duration)}</div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isGenPlaying) handleStopAudio();
                                      else playSnippetAudioById(gen.id);
                                    }}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                                  >
                                    {isGenPlaying ? <Square className="w-3.5 h-3.5 fill-current text-red-400" /> : <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />}
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteGeneration(gen.id);
                                    }}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </section>
                );
              })()}
            </div>
          </div>
        </>
      )}
      <WaveformPlayer 
        activePlayingId={activePlayingId} 
        project={project} 
        onStop={handleStopAudio} 
        isSidebarOpen={isSidebarOpen}
        sidebarWidth={sidebarWidth}
        onPlaySnippet={playSnippetAudioById}
      />
      <SettingsDialogue 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={project}
        onUpdateProject={updateProjectState}
        previewingSpeakerId={previewingSpeakerId}
        onPreviewVoice={handlePreviewVoice}
        onStopAudio={handleStopAudio}
        defaultTab={settingsDefaultTab}
        autoAddSpeaker={settingsAutoAddSpeaker}
        autoAddScene={settingsAutoAddScene}
        activeChapterId={activeChapterId}
        selectedSnippetIds={selectedSnippetIds}
        focusedSnippetId={focusedSnippetId}
        userPreferences={userPreferences}
        onUpdatePreferences={setUserPreferences}
      />

      {/* Sidecar Import Progress Indicator */}
      {sidecarImportProgress && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-lg">Importing Audio Sidecar</h3>
                <p className="text-xs text-slate-400">Streaming and saving audio data to IndexedDB...</p>
              </div>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div 
                className="bg-indigo-500 h-full transition-all duration-150 rounded-full"
                style={{ width: `${sidecarImportProgress.percent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>{sidecarImportProgress.percent}%</span>
              <span>
                {(sidecarImportProgress.bytesProcessed / (1024 * 1024)).toFixed(1)} MB / {(sidecarImportProgress.totalBytes / (1024 * 1024)).toFixed(1)} MB
              </span>
              <span>
                {sidecarImportProgress.processedCount} generations
              </span>
            </div>
          </div>
        </div>
      )}

      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-100">
            <h3 className="text-base font-bold text-slate-100">{confirmModal.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors shadow-lg ${
                  confirmModal.isDangerous 
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/10' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10'
                }`}
              >
                {confirmModal.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

interface SnippetEditorProps {
  snippet: Snippet;
  chapterId: string;
  index: number;
  totalSnippets: number;
  speakers: Speaker[];
  scenes?: Scene[];
  chapterDefaultSpeakerId?: string | null;
  isPlaying: boolean;
  isFocused: boolean;
  isSelected: boolean;
  isInsideGroup?: boolean;
  onToggleSelect: () => void;
  onFocus: () => void;
  onUpdate: (updates: Partial<Snippet>) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onSplit: (cursorPosition: number) => void;
  onJoinNext: () => void;
  onAddNext: () => void;
  onGenerate: () => void;
  onPlay: () => void;
  onPlayFromHere: () => void;
  onStop: () => void;
  onExport: () => void;
}

function SnippetEditor({
  snippet,
  index,
  totalSnippets,
  speakers,
  scenes = [],
  chapterDefaultSpeakerId,
  isPlaying,
  isFocused,
  isSelected,
  isInsideGroup = false,
  onToggleSelect,
  onFocus,
  onUpdate,
  onDelete,
  onMove,
  onSplit,
  onJoinNext,
  onAddNext,
  onGenerate,
  onPlay,
  onPlayFromHere,
  onStop,
  onExport
}: SnippetEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleSplit = () => {
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart;
      if (pos > 0 && pos < snippet.text.length) {
        onSplit(pos);
      }
    }
  };

  const adjustHeight = useCallback(() => {
    if (textareaRef.current && !snippet.isCollapsed) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [snippet.isCollapsed]);

  useEffect(() => {
    adjustHeight();
  }, [snippet.text, snippet.isCollapsed, adjustHeight]);

  useEffect(() => {
    const parentEl = textareaRef.current?.parentElement;
    if (!parentEl) return;

    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        adjustHeight();
      });
    });

    observer.observe(parentEl);
    window.addEventListener('resize', adjustHeight);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', adjustHeight);
    };
  }, [adjustHeight]);

  const effectiveSpeakerId = snippet.speakerId || chapterDefaultSpeakerId;
  const effectiveSpeaker = speakers.find(s => s.id === effectiveSpeakerId);
  const hasAudio = !isInsideGroup && !!(snippet.activeGenerationId && snippet.generations.some(g => g.id === snippet.activeGenerationId));
  const isGenerating = snippet.status === 'generating';

  const wordCount = snippet.text.trim() ? snippet.text.trim().split(/\s+/).length : 0;
  const charCount = snippet.text.length;
  const tokenEstimate = Math.ceil(charCount / 4) || 0;

  const speakerStyles = getSpeakerStyles(effectiveSpeakerId, speakers);
  
  const borderStyle = isFocused 
    ? 'border-sky-500 border-2' 
    : (effectiveSpeakerId ? 'border-transparent' : 'border-slate-800');

  const inlineStyle = effectiveSpeakerId ? {
    ...speakerStyles.customStyle,
    ...(isHovered ? speakerStyles.customHoverStyle : {}),
    borderWidth: isFocused ? '2px' : '1px',
    borderColor: isFocused ? 'hsla(199, 89%, 48%, 1)' : (isHovered ? `hsla(${(220 + speakers.findIndex(s => s.id === effectiveSpeakerId) * 36) % 360}, 25%, 20%, 1)` : `hsla(${(220 + speakers.findIndex(s => s.id === effectiveSpeakerId) * 36) % 360}, 25%, 15%, 1)`),
    transition: 'background-color 0.2s, border-color 0.2s'
  } : {};

  if (snippet.isCollapsed) {
    return (
      <div 
        style={inlineStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onFocus}
        className={`group flex items-center gap-3 p-2 rounded-lg border transition-colors ${borderStyle} ${isPlaying ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-950 hover:border-slate-700'}`}
      >
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer shrink-0"
          title="Select Snippet"
        />
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1 py-0.5 rounded shrink-0">
          {index + 1}/{totalSnippets}
        </span>
        <IconButton icon={ChevronRight} onClick={(e: any) => { e.stopPropagation(); onUpdate({ isCollapsed: false }); }} className="!p-0.5 text-slate-500" title="Expand Snippet" />
        
        <div 
          className="flex-1 flex items-center gap-3 overflow-hidden cursor-pointer" 
          onClick={() => onUpdate({ isCollapsed: false })}
        >
          <span 
            style={effectiveSpeakerId ? speakerStyles.customControlStyle : {}}
            className="text-[10px] font-medium uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0"
          >
            {effectiveSpeaker?.name || 'Inherit'}
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-wider shrink-0">
            W: {wordCount} | C: {charCount} | T: ~{tokenEstimate}
          </span>
          <span className="text-sm text-slate-400 truncate select-none">
            {snippet.text || <span className="text-slate-600 italic">Empty snippet</span>}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!isInsideGroup && (
            isGenerating ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin-slow" />
            ) : (
              <>
                {isPlaying ? (
                  <IconButton icon={Square} onClick={(e: any) => { e.preventDefault(); e.stopPropagation(); onStop(); }} className="text-red-400 hover:text-red-300" title="Stop" />
                ) : (
                  <IconButton icon={Play} onClick={(e: any) => { e.preventDefault(); e.stopPropagation(); onPlay(); }} disabled={!hasAudio} className={hasAudio ? "text-emerald-400 hover:text-emerald-300" : ""} title="Play" />
                )}
                <IconButton icon={Download} onClick={(e: any) => { e.preventDefault(); e.stopPropagation(); onExport(); }} disabled={!hasAudio} className={hasAudio ? "text-blue-400 hover:text-blue-300" : ""} title="Export" />
                <IconButton icon={hasAudio ? RefreshCw : Wand2} onClick={(e: any) => { e.preventDefault(); e.stopPropagation(); onGenerate(); }} className="text-indigo-400 hover:text-indigo-300" title={hasAudio ? "Regenerate Audio" : "Generate Audio"} />
              </>
            )
          )}
          <IconButton icon={Plus} title="Add snippet below" onClick={(e: any) => { e.stopPropagation(); onAddNext(); }} className="hover:text-indigo-400" />
          <div className="w-px h-4 bg-slate-800 mx-1"></div>
          <IconButton icon={Trash2} onClick={(e: any) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} className="hover:text-red-400" title="Delete snippet" />
        </div>
      </div>
    );
  }

  return (
    <div 
      style={inlineStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFocus}
      className={`group flex gap-3 p-3 rounded-lg border transition-colors ${borderStyle} ${isPlaying ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-950 hover:border-slate-700'}`}
    >
      
      {/* Left Action Bar */}
      <div className="flex flex-col items-center justify-start pt-1 gap-2">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
          title="Select Snippet"
        />
        <div className="cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        <IconButton icon={ChevronDown} onClick={() => onUpdate({ isCollapsed: true })} className="!p-0.5 text-slate-500" title="Collapse Snippet" />
        <div className="flex flex-col items-center opacity-20 group-hover:opacity-100 transition-opacity">
          <IconButton icon={ArrowUp} onClick={() => onMove('up')} className="!p-0" disabled={index === 0} title="Move Up" />
          <IconButton icon={ArrowDown} onClick={() => onMove('down')} className="!p-0" disabled={index === totalSnippets - 1} title="Move Down" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-2">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded shrink-0">
              {index + 1}/{totalSnippets}
            </span>

            <select 
              value={snippet.speakerId || ''}
              style={effectiveSpeakerId ? speakerStyles.customControlStyle : {}}
              onChange={(e) => onUpdate({ speakerId: e.target.value || null })}
              className={`text-xs rounded px-2 py-1 focus:outline-none border w-auto max-w-[200px] ${snippet.speakerId ? 'text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
            >
              <option value="">Inherit ({speakers.find(s => s.id === chapterDefaultSpeakerId)?.name || 'None'})</option>
              {speakers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            
            {/* Scene Selector */}
            {scenes && scenes.length > 0 && (
              <select 
                value={snippet.sceneId || ''}
                onChange={(e) => onUpdate({ sceneId: e.target.value || undefined })}
                className={`text-xs rounded px-2 py-1 focus:outline-none border w-auto max-w-[180px] ${snippet.sceneId ? 'bg-teal-950 text-teal-300 border-teal-800' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
              >
                <option value="">No Scene</option>
                {scenes.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-slate-500 font-medium tracking-wider">
              W: {wordCount} | C: {charCount} | T: ~{tokenEstimate}
            </span>
            <div className="w-px h-4 bg-slate-800"></div>
            <IconButton icon={SplitSquareVertical} title="Split at cursor" onClick={handleSplit} />
            <IconButton icon={Merge} title="Join with next" onClick={onJoinNext} disabled={index === totalSnippets - 1} />
            <IconButton icon={Plus} title="Add snippet below" onClick={onAddNext} className="hover:text-indigo-400" />
            <div className="w-px h-4 bg-slate-800 mx-1"></div>
            <IconButton icon={Trash2} title="Delete snippet" onClick={onDelete} className="hover:text-red-400" />
          </div>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={snippet.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          onBlur={() => onUpdate({ text: snippet.text.trim() })}
          onFocus={onFocus}
          disabled={isPlaying || isGenerating}
          placeholder="Enter text here..."
          className="w-full bg-transparent text-slate-300 focus:outline-none resize-none overflow-hidden leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
        />

        {/* Error Display */}
        {snippet.status === 'error' && snippet.errorMessage && (
          <div className="flex items-start gap-2 text-xs text-red-400 mt-2 bg-red-400/10 p-2.5 rounded border border-red-400/20 overflow-auto">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">Failed to Generate</span>
              <pre className="opacity-90 whitespace-pre-wrap font-mono text-[10px]">{snippet.errorMessage}</pre>
            </div>
          </div>
        )}

        {/* Bottom Actions - Hidden when inside a Generation Group Container */}
        {!isInsideGroup && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Play Button */}
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); isPlaying ? onStop() : onPlay(); }} 
                disabled={!hasAudio && !isPlaying}
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
                  isPlaying 
                    ? 'text-red-400 hover:text-red-300 bg-red-400/10' 
                    : hasAudio 
                      ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-400/10' 
                      : 'text-slate-600 bg-slate-800/50 cursor-not-allowed'
                }`}
              >
                {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                {isPlaying ? 'Stop' : 'Play'}
              </button>

              {/* Play From Here Button */}
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlayFromHere(); }} 
                disabled={!hasAudio}
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
                  hasAudio 
                    ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-400/10' 
                    : 'text-slate-600 bg-slate-800/50 cursor-not-allowed'
                }`}
                title="Play from here"
              >
                <ArrowDownToLine className="w-3 h-3" /> Play From Here
              </button>

              {/* Generate / Regenerate Button */}
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGenerate(); }} 
                disabled={isGenerating}
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
                  isGenerating
                    ? 'text-indigo-400 bg-indigo-400/10 cursor-not-allowed'
                    : hasAudio
                      ? 'text-slate-400 hover:text-indigo-300 bg-slate-800 hover:bg-indigo-500/20'
                      : 'text-indigo-400 hover:text-indigo-300 bg-indigo-400/10'
                }`}
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin-slow" /> : (hasAudio ? <RefreshCw className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />)}
                {isGenerating ? 'Generating...' : (hasAudio ? 'Regenerate' : 'Generate Audio')}
              </button>

              {/* Export Button */}
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onExport(); }} 
                disabled={!hasAudio}
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
                  hasAudio 
                    ? 'text-blue-400 hover:text-blue-300 bg-blue-400/10' 
                    : 'text-slate-600 bg-slate-800/50 cursor-not-allowed'
                }`}
                title="Export Audio"
              >
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

