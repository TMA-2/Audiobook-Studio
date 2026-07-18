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
  BookOpen
} from 'lucide-react';
import { Project, Chapter, Snippet, Speaker, AudioEncoding, Generation, Scene, GEMINI_VOICES, GEMINI_MODELS } from './types';
import { generateTTS } from './services/geminiService';
import { playAudio, stopAudio, createWavBlob, getAudioDuration, concatenatePCMChunks } from './services/audioService';
import { generateId } from './services/idService';
import { parseMarkdown } from './services/markdownParser';
import { saveAudio, getAudio, deleteAudio } from './services/dbService';
import { formatDuration, formatError, getSpeakerStyles } from './services/utils';
import * as StateModifiers from './services/appStateModifiers';
import WaveformPlayer from './components/WaveformPlayer';
import { SettingsDialogue } from './components/SettingsDialogue';

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
  
  // Settings dialogue state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Active chapter state for single chapter view
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  // Selection states for bulk snippet actions
  const [selectedSnippetIds, setSelectedSnippetIds] = useState<Set<string>>(new Set());

  // Sidebar collapse states
  const [isGenerationCollapsed, setIsGenerationCollapsed] = useState(false);
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const sidecarInputRef = useRef<HTMLInputElement>(null);

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
      chapters: project.chapters.map((c, i) => ({
        id: c.id,
        name: c.title,
        order: c.order,
        globalSpeaker: c.defaultSpeakerId,
        collapsed: c.isCollapsed,
        content: c.snippets.map((s, j) => ({
          id: s.id,
          speaker: s.speakerId,
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
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project'}.json`;
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
            sampleRate: data.settings?.sampleRate || '24000'
          },
          speakers: (data.speakers || []).map((s: any, i: number) => ({
            id: s.id || generateId(),
            name: s.name || '',
            order: s.order ?? i,
            voice: s.voice || GEMINI_VOICES[0].id,
            style: s.instructions || '',
            isNarrator: !!s.isNarrator
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
    const generationsList: any[] = [];

    for (const chapter of project.chapters) {
      for (const snippet of chapter.snippets) {
        for (const gen of snippet.generations) {
          const audio = await getAudio(gen.id);
          if (audio) {
            generationsList.push({
              id: gen.id,
              snippetId: gen.snippetId,
              speakerId: gen.speakerId,
              timestamp: gen.timestamp,
              model: gen.model,
              text: gen.text,
              audioMimeType: gen.audioMimeType,
              duration: gen.duration,
              data: audio.base64Data
            });
          }
        }
      }
    }

    const sidecarData = {
      projectName: project.title,
      lastUpdate: new Date().toISOString(),
      generations: generationsList
    };

    const blob = new Blob([JSON.stringify(sidecarData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project'}.audio.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSidecar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.generations || !Array.isArray(data.generations)) {
          throw new Error("Invalid sidecar format: missing generations array.");
        }

        let importedCount = 0;
        for (const gen of data.generations) {
          if (gen.id && gen.data) {
            await saveAudio(gen.id, gen.data, gen.audioMimeType || 'audio/wav', gen.duration);
            importedCount++;
          }
        }

        setProject(prev => {
          const updatedChapters = prev.chapters.map(chapter => {
            return {
              ...chapter,
              snippets: chapter.snippets.map(snippet => {
                const sidecarGensForSnippet = data.generations.filter((g: any) => g.snippetId === snippet.id);
                if (sidecarGensForSnippet.length === 0) return snippet;

                const existingGenIds = new Set(snippet.generations.map(g => g.id));
                const gensToAdd: Generation[] = [];

                for (const sg of sidecarGensForSnippet) {
                  if (!existingGenIds.has(sg.id)) {
                    gensToAdd.push({
                      id: sg.id,
                      snippetId: sg.snippetId,
                      speakerId: sg.speakerId,
                      timestamp: sg.timestamp,
                      model: sg.model,
                      text: sg.text,
                      audioMimeType: sg.audioMimeType,
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
        console.error(err);
        alert(`Failed to parse sidecar file: ${err.message || String(err)}`);
      }
    };
    reader.readAsText(file);
    if (sidecarInputRef.current) sidecarInputRef.current.value = '';
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

    const snippetsToPlay = chapter.snippets.slice(startIndex).filter(s => s.activeGenerationId);
    if (snippetsToPlay.length === 0) return;

    let currentIndex = 0;

    const playNext = async () => {
      if (currentIndex >= snippetsToPlay.length) {
        setActivePlayingId(null);
        return;
      }
      
      const snippet = snippetsToPlay[currentIndex];
      if (snippet.activeGenerationId) {
        setActivePlayingId(snippet.id);
        const audio = await getAudio(snippet.activeGenerationId);
        if (audio) {
          playAudio(audio.base64Data, audio.mimeType, () => {
            currentIndex++;
            playNext();
          });
        } else {
          currentIndex++;
          playNext();
        }
      } else {
        currentIndex++;
        playNext();
      }
    };

    playNext();
  }, [project, handleStopAudio]);

  const playSnippetAudio = useCallback((snippet: Snippet) => {
    if (!snippet.activeGenerationId) return;
    playSnippetAudioById(snippet.activeGenerationId);
  }, [playSnippetAudioById]);

  const handleExportSnippetAudio = useCallback(async (chapterId: string, snippetId: string) => {
    const cIndex = project.chapters.findIndex(c => c.id === chapterId);
    const chapter = project.chapters[cIndex];
    if (!chapter) return;
    
    const sIndex = chapter.snippets.findIndex(s => s.id === snippetId);
    const snippet = chapter.snippets[sIndex];
    if (!snippet || !snippet.activeGenerationId) return;

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
  const handleExportChapterAudio = async (chapterId: string) => {
    const chapter = project.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const activeGens = chapter.snippets
      .map(s => s.activeGenerationId)
      .filter((id): id is string => id !== null);

    if (activeGens.length === 0) {
      alert("No generated audio found in this chapter.");
      return;
    }

    try {
      const base64Chunks: string[] = [];
      for (const genId of activeGens) {
        const audio = await getAudio(genId);
        if (audio) {
          base64Chunks.push(audio.base64Data);
        }
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
    } catch (e) {
      console.error("Failed to concatenate chapter audio:", e);
      alert("Failed to export concatenated chapter audio.");
    }
  };

  const handleExportFullProjectAudio = async () => {
    const activeGens: string[] = [];
    for (const chapter of project.chapters) {
      for (const snippet of chapter.snippets) {
        if (snippet.activeGenerationId) {
          activeGens.push(snippet.activeGenerationId);
        }
      }
    }

    if (activeGens.length === 0) {
      alert("No generated audio found in the entire project.");
      return;
    }

    try {
      const base64Chunks: string[] = [];
      for (const genId of activeGens) {
        const audio = await getAudio(genId);
        if (audio) {
          base64Chunks.push(audio.base64Data);
        }
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
    } catch (e) {
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
    if (!focusedChapterId || !focusedSnippetId) return;
    try {
      await deleteAudio(generationId);
      setProject(prev => {
        const updatedChapters = prev.chapters.map(c => {
          if (c.id !== focusedChapterId) return c;
          return {
            ...c,
            snippets: c.snippets.map(s => {
              if (s.id !== focusedSnippetId) return s;
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
  }, [focusedChapterId, focusedSnippetId]);

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
        project.settings.model.name
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
      const combinedStyle = getCombinedStyleInstructions(speaker);
      const { data, mimeType } = await generateTTS(
        snippet.text, 
        speaker.voice, 
        combinedStyle, 
        project.settings.model.name
      );

      const duration = await getAudioDuration(data, mimeType);
      const generationId = generateId();

      // Save audio data to IndexedDB
      await saveAudio(generationId, data, mimeType, duration);

      const newGen: Generation = {
        id: generationId,
        snippetId: snippet.id,
        speakerId: speaker.id,
        timestamp: new Date().toISOString(),
        model: project.settings.model.name,
        text: snippet.text,
        audioMimeType: mimeType,
        duration: duration
      };

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

    for (const snippet of chapter.snippets) {
      if (snippet.generations.length === 0 && snippet.text.trim()) {
        await handleGenerateSnippetAsync(chapterId, snippet.id);
      }
    }
  };

  const handleGenerateAll = async () => {
    for (const chapter of project.chapters) {
      await handleGenerateChapter(chapter.id);
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
    if (!window.confirm(`Are you sure you want to delete the ${selectedSnippetIds.size} selected snippets?`)) return;
    
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
    const selectedList = Array.from(selectedSnippetIds);
    for (const snippetId of selectedList) {
      let foundChapterId: string | null = null;
      for (const c of project.chapters) {
        if (c.snippets.some(s => s.id === snippetId)) {
          foundChapterId = c.id;
          break;
        }
      }
      if (foundChapterId) {
        await handleGenerateSnippetAsync(foundChapterId, snippetId as string);
      }
    }
    setSelectedSnippetIds(new Set<string>());
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
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 rounded transition-colors"
                title="Save Audio Sidecar"
              >
                <Download className="w-4 h-4" />
                <span className="hidden lg:inline">Audio</span>
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
              onClick={() => setIsSettingsOpen(true)}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
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
            const allSnippetsSelected = activeChapter.snippets.every(s => selectedSnippetIds.has(s.id));

            return (
              <div 
                key={activeChapter.id} 
                className="group/chapter bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden transition-all flex flex-col"
              >
                {/* Chapter Header */}
                <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
                  <div className="flex items-center gap-3 flex-1 min-w-[300px]">
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
                      className="bg-transparent text-lg font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 w-1/3 min-w-[120px] truncate"
                    />
                    <div className="flex items-center gap-2 ml-2 text-xs text-slate-500 font-medium">
                      <span title="Words">{chapterWordCount}W</span>
                      <span>•</span>
                      <span title="Characters">{chapterCharCount}C</span>
                      <span>•</span>
                      <span title="Tokens">~{chapterTokenEstimate}T</span>
                    </div>
                    
                    {/* Chapter Default Speaker */}
                    <div className="flex items-center gap-2 ml-4">
                      <Users className="w-4 h-4 text-slate-500" />
                      <select 
                        value={activeChapter.defaultSpeakerId || ''}
                        onChange={(e) => updateChapterState(activeChapter.id, { defaultSpeakerId: e.target.value || null })}
                        className="bg-slate-950 border border-slate-700 text-xs rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-300"
                      >
                        <option value="">Default Speaker...</option>
                        {project.speakers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Collapse/Expand All Snippets Buttons */}
                    <div className="flex items-center gap-1 ml-4 opacity-0 group-hover/chapter:opacity-100 transition-opacity">
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
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover/chapter:opacity-100 transition-opacity shrink-0">
                    <IconButton icon={Wand2} title="Generate Chapter Audio" onClick={() => handleGenerateChapter(activeChapter.id)} className="hover:text-indigo-400" />
                    <IconButton icon={Play} title="Play Chapter" onClick={() => playFromSnippetById(activeChapter.id, activeChapter.snippets[0]?.id)} />
                    <IconButton icon={Download} title="Export Concatenated Chapter Audio" onClick={() => handleExportChapterAudio(activeChapter.id)} className="hover:text-emerald-400" />
                    <IconButton icon={Trash2} title="Delete Chapter" onClick={() => {
                      if (window.confirm("Are you sure you want to delete this chapter?")) {
                        deleteChapterState(activeChapter.id);
                        if (project.chapters.length > 1) {
                          const nextIdx = chapterIndex === 0 ? 1 : chapterIndex - 1;
                          setActiveChapterId(project.chapters[nextIdx].id);
                        } else {
                          setActiveChapterId(null);
                        }
                      }
                    }} className="hover:text-red-400" />
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
                    {/* Bulk Operations Sticky Ribbon */}
                    {selectedSnippetIds.size > 0 && (
                      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 animate-fade-in shrink-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-indigo-300">
                            {selectedSnippetIds.size} snippet{selectedSnippetIds.size > 1 ? 's' : ''} selected
                          </span>
                          <button 
                            onClick={handleClearSelection}
                            className="text-xs text-slate-400 hover:text-slate-200 underline"
                          >
                            Deselect All
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Bulk Assign Speaker */}
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400 font-medium">Speaker:</span>
                            <select 
                              onChange={(e) => {
                                handleBulkAssignSpeaker(e.target.value || null);
                                e.target.value = '';
                              }}
                              className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200"
                            >
                              <option value="">Assign Speaker...</option>
                              {project.speakers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Bulk Assign Scene */}
                          {project.scenes && project.scenes.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-400 font-medium">Scene:</span>
                              <select 
                                onChange={(e) => {
                                  handleBulkAssignScene(e.target.value || null);
                                  e.target.value = '';
                                }}
                                className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500 text-slate-200"
                              >
                                <option value="">Assign Scene...</option>
                                {project.scenes.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Bulk Move Chapter */}
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400 font-medium">Move:</span>
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

                          <div className="w-px h-5 bg-slate-800 mx-1"></div>

                          {/* Bulk Generate */}
                          <button 
                            onClick={handleBulkGenerate}
                            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition-colors shadow-md shadow-indigo-500/20"
                          >
                            <Wand2 className="w-3.5 h-3.5" /> Generate Selected
                          </button>

                          {/* Bulk Delete */}
                          <button 
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 px-3 py-1 bg-red-600/20 hover:bg-red-500/35 text-red-400 rounded text-xs font-semibold transition-colors border border-red-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                          </button>
                        </div>
                      </div>
                    )}

                    {activeChapter.snippets.map((snippet, snippetIndex) => (
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
                          index={snippetIndex}
                          totalSnippets={activeChapter.snippets.length}
                          speakers={project.speakers}
                          scenes={project.scenes || []}
                          chapterDefaultSpeakerId={activeChapter.defaultSpeakerId}
                          isPlaying={activePlayingId !== null && (activePlayingId === snippet.id || activePlayingId === snippet.activeGenerationId)}
                          isFocused={focusedSnippetId === snippet.id}
                          isSelected={selectedSnippetIds.has(snippet.id)}
                          onToggleSelect={() => handleToggleSelectSnippet(snippet.id)}
                          onFocus={() => {
                            setFocusedSnippetId(snippet.id);
                            setFocusedChapterId(activeChapter.id);
                          }}
                          onUpdate={(updates) => {
                            updateSnippetState(activeChapter.id, snippet.id, updates);
                          }}
                          onDelete={() => deleteSnippetState(activeChapter.id, snippet.id)}
                          onMove={(dir) => moveSnippetState(activeChapter.id, snippetIndex, dir)}
                          onSplit={(pos) => splitSnippetState(activeChapter.id, snippet.id, pos)}
                          onJoinNext={() => joinSnippetWithNextState(activeChapter.id, snippet.id)}
                          onAddNext={() => addSnippetState(activeChapter.id, snippetIndex)}
                          onGenerate={() => handleGenerateSnippetAsync(activeChapter.id, snippet.id)}
                          onPlay={() => playSnippetAudio(snippet)}
                          onPlayFromHere={() => playFromSnippetById(activeChapter.id, snippet.id)}
                          onStop={handleStopAudio}
                          onExport={() => handleExportSnippetAudio(activeChapter.id, snippet.id)}
                        />
                      </div>
                    ))}
                    
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
                onClick={() => setIsSettingsOpen(true)}
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
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Chapters
                  </h3>
                  <button 
                    onClick={addChapterState}
                    className="p-1 hover:bg-slate-800 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="Add Chapter"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

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
                                if (window.confirm("Delete chapter?")) {
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
              </section>

              {/* Speakers List */}
              <section className="bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-slate-900/40 border-b border-slate-800/60">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Speakers
                  </h3>
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1 hover:bg-slate-800 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="Manage Speakers in Settings"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

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
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Generate audio for all snippets of ${speaker.name} in this chapter?`)) {
                                const activeCh = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];
                                if (!activeCh) return;
                                const matching = activeCh.snippets.filter(s => (s.speakerId || activeCh.defaultSpeakerId) === speaker.id);
                                if (matching.length === 0) {
                                  alert("No snippets found with this speaker.");
                                  return;
                                }
                                for (const sn of matching) {
                                  await handleGenerateSnippetAsync(activeCh.id, sn.id);
                                }
                              }
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
                                    <span className="text-[9px] opacity-65">({gen.model.replace('-tts', '')})</span>
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
  chapterDefaultSpeakerId: string | null;
  isPlaying: boolean;
  isFocused: boolean;
  isSelected: boolean;
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
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [adjustHeight]);

  const effectiveSpeakerId = snippet.speakerId || chapterDefaultSpeakerId;
  const effectiveSpeaker = speakers.find(s => s.id === effectiveSpeakerId);
  const hasAudio = !!snippet.activeGenerationId;
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
          {isGenerating ? (
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
          )}
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
          <div className="flex items-center gap-2">
            <select 
              value={snippet.speakerId || ''}
              style={effectiveSpeakerId ? speakerStyles.customControlStyle : {}}
              onChange={(e) => onUpdate({ speakerId: e.target.value || null })}
              className={`text-xs rounded px-2 py-1 focus:outline-none border ${snippet.speakerId ? 'text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
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
                className={`text-xs rounded px-2 py-1 focus:outline-none border ${snippet.sceneId ? 'bg-teal-950 text-teal-300 border-teal-800' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
              >
                <option value="">No Scene</option>
                {scenes.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            
            {effectiveSpeaker && (
              <span 
                style={speakerStyles.customControlStyle}
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border"
              >
                {effectiveSpeaker.voice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-slate-500 font-medium tracking-wider">
              W: {wordCount} | C: {charCount} | T: ~{tokenEstimate}
            </span>
            <div className="w-px h-4 bg-slate-800"></div>
            <IconButton icon={SplitSquareVertical} title="Split at cursor" onClick={handleSplit} />
            <IconButton icon={Merge} title="Join with next" onClick={onJoinNext} disabled={index === totalSnippets - 1} />
            <div className="w-px h-4 bg-slate-800 mx-1"></div>
            <IconButton icon={Trash2} title="Delete snippet" onClick={onDelete} className="hover:text-red-400" />
          </div>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={snippet.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
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

        {/* Bottom Actions */}
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
          
          <button onClick={onAddNext} className="text-xs text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add below
          </button>
        </div>
      </div>
    </div>
  );
}
