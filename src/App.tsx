/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  BookOpen, 
  AudioLines, 
  FolderPlus, 
  SlidersHorizontal, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  ExternalLink,
  BookMarked,
  HelpCircle,
  FileSpreadsheet,
  Users,
  Type,
  FileText,
  Cpu,
  RefreshCw,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Chapter, NarrationBlock, VoiceName, Speaker } from './types';
import WaveformPlayer from './components/WaveformPlayer';
import ScriptImporter, { ImportedBlock } from './components/ScriptImporter';
import VoiceCastingGuides from './components/VoiceCastingGuides';
import ChapterTimeline from './components/ChapterTimeline';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Sidebar resizing and collapsibility state
  const [sidebarWidth, setSidebarWidth] = useState<number>(288);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(true);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  
  // Custom Dialog Overlay State
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'prompt';
    title: string;
    message: string;
    value: string;
    onOk: (val?: string) => void;
    onCancel?: () => void;
  } | null>(null);

  const showCustomAlert = (title: string, message: string, onOk?: () => void) => {
    setDialog({
      isOpen: true,
      type: 'alert',
      title,
      message,
      value: '',
      onOk: () => {
        setDialog(null);
        if (onOk) onOk();
      }
    });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      value: '',
      onOk: () => {
        setDialog(null);
        onConfirm();
      },
      onCancel: () => {
        setDialog(null);
        if (onCancel) onCancel();
      }
    });
  };

  const showCustomPrompt = (title: string, message: string, defaultValue: string, onConfirm: (val: string) => void) => {
    setDialog({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      value: defaultValue,
      onOk: (val) => {
        setDialog(null);
        onConfirm(val || '');
      },
      onCancel: () => {
        setDialog(null);
      }
    });
  };

  const showCustomAlertRef = React.useRef(showCustomAlert);
  useEffect(() => {
    showCustomAlertRef.current = showCustomAlert;
  });

  useEffect(() => {
    window.alert = (message: string) => {
      showCustomAlertRef.current("Notification", message);
    };
  }, []);

  // API key configuration status indicators
  const [apiKeyConfirmed, setApiKeyConfirmed] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = (await res.json()) as Project[];
        setProjects(data);
        if (data.length > 0) {
          setActiveProjectId(data[0].id);
          if (data[0].chapters.length > 0) {
            setActiveChapterId(data[0].chapters[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load projects from server:", err);
      setApiKeyConfirmed(false);
    }
  };

  // Synchronize state with backend
  const syncWithServer = async (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProjects)
      });
    } catch (err) {
      console.warn("Express syncing unavailable.");
    }
  };

  // Find active elements safely
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const activeChapter = activeProject?.chapters.find(c => c.id === activeChapterId) || activeProject?.chapters[0];

  // Derive speakers with safe default fallback if project lacks them
  const activeSpeakers = React.useMemo<Speaker[]>(() => {
    if (!activeProject) return [];
    if (activeProject.speakers && activeProject.speakers.length > 0) {
      return activeProject.speakers;
    }
    // Safe default if none configured
    return [
      {
        id: "spk-default-narrator",
        name: "Narrator",
        isNarrator: true,
        voice: "Zephyr",
        model: "gemini-3.1-flash-tts-preview",
        pacing: "normal",
        pitch: "normal",
        emotion: "none",
        customInstructions: "Consistently warm, steady and comforting tone"
      }
    ];
  }, [activeProject]);

  // Global Project Operations
  const handleCreateProject = () => {
    showCustomPrompt(
      "Create Narration Project",
      "Enter the title for your new audiobook workbook:",
      "The Odyssey of Solitude",
      (pName) => {
        if (!pName.trim()) return;

        const timestamp = Date.now();
        const projectId = "project-" + timestamp;
        const chapterId = "chap-" + timestamp;
        const blockId = "block-" + timestamp;
        const narratorId = "spk-narrator-" + timestamp;

        const defaultSpeakers: Speaker[] = [
          {
            id: narratorId,
            name: "Narrator",
            isNarrator: true,
            voice: "Zephyr",
            model: "gemini-3.1-flash-tts-preview",
            pacing: "normal",
            pitch: "normal",
            emotion: "none",
            customInstructions: "Consistently warm, steady and comforting documentary tone"
          },
          {
            id: "spk-protagonist-" + timestamp,
            name: "Protagonist",
            isNarrator: false,
            voice: "Puck",
            model: "gemini-3.1-flash-tts-preview",
            pacing: "normal",
            pitch: "normal",
            emotion: "none",
            customInstructions: "Youthful and energetic protagonist"
          }
        ];

        const newProject: Project = {
          id: projectId,
          name: pName,
          description: "A gorgeous narration canvas containing customized voice layers.",
          createdAt: new Date().toISOString(),
          lastModifiedAt: new Date().toISOString(),
          speakers: defaultSpeakers,
          chapters: [
            {
              id: chapterId,
              projectId: projectId,
              title: "Chapter 1: Initial Draft",
              order: 1,
              blocks: [
                {
                  id: blockId,
                  chapterId: chapterId,
                  speakerId: narratorId,
                  text: "Begin your narration project here. Enter sentences, configure speakers in the Desk, and tap Synthesize.",
                  status: "idle",
                  audioData: null,
                  duration: null,
                  errorMessage: null
                }
              ]
            }
          ]
        };

        const nextProjects = [...projects, newProject];
        syncWithServer(nextProjects);
        setActiveProjectId(newProject.id);
        setActiveChapterId(newProject.chapters[0].id);
      }
    );
  };

  const handleDeleteProject = () => {
    if (projects.length <= 1) {
      showCustomAlert("Action Restricted", "At least one audio project must exist in the production deck.");
      return;
    }
    showCustomConfirm(
      "Confirm Deletion",
      `Are you certain you wish to delete the project: "${activeProject?.name}"? All recorded audio chunks will be purged permanently.`,
      () => {
        const nextProjects = projects.filter(p => p.id !== activeProjectId);
        syncWithServer(nextProjects);
        setActiveProjectId(nextProjects[0].id);
        setActiveChapterId(nextProjects[0].chapters[0]?.id || '');
      }
    );
  };

  // Global Chapter Operations
  const handleCreateChapter = () => {
    if (!activeProject) return;
    showCustomPrompt(
      "New Narration Chapter",
      "Enter Chapter Section Title:",
      `Chapter ${activeProject.chapters.length + 1}: The Rising Dawn`,
      (cTitle) => {
        if (!cTitle.trim()) return;

        const timestamp = Date.now();
        const chapterId = "chap-" + timestamp;
        const blockId = "block-" + timestamp;
        const firstSpeakerId = activeSpeakers[0]?.id || "spk-default-narrator";

        const newChapter: Chapter = {
          id: chapterId,
          projectId: activeProjectId,
          title: cTitle,
          order: activeProject.chapters.length + 1,
          blocks: [
            {
              id: blockId,
              chapterId: chapterId,
              speakerId: firstSpeakerId,
              text: "A silence hung heavy in the air, awaiting the voice of the speaker.",
              status: "idle",
              audioData: null,
              duration: null,
              errorMessage: null
            }
          ]
        };

        const nextProjects = projects.map(p => {
          if (p.id === activeProjectId) {
            return {
              ...p,
              chapters: [...p.chapters, newChapter],
              lastModifiedAt: new Date().toISOString()
            };
          }
          return p;
        });

        syncWithServer(nextProjects);
        setActiveChapterId(newChapter.id);
      }
    );
  };

  const handleDeleteChapter = (cId: string) => {
    if (activeProject.chapters.length <= 1) {
      showCustomAlert("Action Restricted", "An audiobook requires at least one narrative chapter.");
      return;
    }
    showCustomConfirm(
      "Confirm Deletion",
      "Are you sure you wish to delete this chapter? This will permanently erase all child blocks and audio voice logs.",
      () => {
        const nextProjects = projects.map(p => {
          if (p.id === activeProjectId) {
            const nextChaps = p.chapters.filter(c => c.id !== cId);
            return { ...p, chapters: nextChaps };
          }
          return p;
        });

        syncWithServer(nextProjects);
        
        // Pick first chapter
        const currentProj = nextProjects.find(p => p.id === activeProjectId);
        if (currentProj && currentProj.chapters.length > 0) {
          setActiveChapterId(currentProj.chapters[0].id);
        }
      }
    );
  };

  // Blocks CRUD Operation inside chapters
  const handleAddBlock = () => {
    if (!activeChapter) return;
    const defaultSpeakerId = activeChapter.blocks[activeChapter.blocks.length - 1]?.speakerId || activeSpeakers[0]?.id || 'spk-default-narrator';
    
    const newBlock: NarrationBlock = {
      id: "block-" + Date.now(),
      chapterId: activeChapterId,
      speakerId: defaultSpeakerId,
      text: "",
      status: "idle",
      audioData: null,
      duration: null,
      errorMessage: null
    };

    const nextProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        const nextChaps = p.chapters.map(c => {
          if (c.id === activeChapterId) {
            return { ...c, blocks: [...c.blocks, newBlock] };
          }
          return c;
        });
        return { ...p, chapters: nextChaps };
      }
      return p;
    });

    syncWithServer(nextProjects);
  };

  const handleUpdateBlockField = (blockId: string, field: keyof NarrationBlock, value: any) => {
    const nextProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        const nextChaps = p.chapters.map(c => {
          if (c.id === activeChapterId) {
            const nextBlks = c.blocks.map(b => {
              if (b.id === blockId) {
                // If speaker changes, invalidate synthesized status so they know to regenerate
                const invalidatedFields: (keyof NarrationBlock)[] = ['speakerId'];
                let statusUpdate = b.status;
                let audioDataUpdate = b.audioData;
                
                if (invalidatedFields.includes(field) && b.status === 'success') {
                  statusUpdate = 'idle';
                  audioDataUpdate = null;
                }

                return { ...b, [field]: value, status: statusUpdate, audioData: audioDataUpdate };
              }
              return b;
            });
            return { ...c, blocks: nextBlks };
          }
          return c;
        });
        return { ...p, chapters: nextChaps };
      }
      return p;
    });

    syncWithServer(nextProjects);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (activeChapter.blocks.length <= 1) {
      alert("Your chapter requires at least one structural paragraph.");
      return;
    }

    const nextProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        const nextChaps = p.chapters.map(c => {
          if (c.id === activeChapterId) {
            return { ...c, blocks: c.blocks.filter(b => b.id !== blockId) };
          }
          return c;
        });
        return { ...p, chapters: nextChaps };
      }
      return p;
    });

    syncWithServer(nextProjects);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!activeChapter) return;
    const blocksCopy = [...activeChapter.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= blocksCopy.length) return;

    // Swap
    const temp = blocksCopy[index];
    blocksCopy[index] = blocksCopy[targetIndex];
    blocksCopy[targetIndex] = temp;

    const nextProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        const nextChaps = p.chapters.map(c => {
          if (c.id === activeChapterId) {
            return { ...c, blocks: blocksCopy };
          }
          return c;
        });
        return { ...p, chapters: nextChaps };
      }
      return p;
    });

    syncWithServer(nextProjects);
  };

  // Speakers modifiers inside project
  const handleUpdateSpeakers = (updatedSpeakers: Speaker[]) => {
    // Determine if any speaker changed in a way that invalidates audio
    const nextProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        const changedSpeakerIds = updatedSpeakers.filter(nextS => {
          const prevS = p.speakers?.find(s => s.id === nextS.id);
          if (!prevS) return false;
          return prevS.voice !== nextS.voice ||
                 prevS.model !== nextS.model ||
                 prevS.pacing !== nextS.pacing ||
                 prevS.pitch !== nextS.pitch ||
                 prevS.emotion !== nextS.emotion ||
                 prevS.customInstructions !== nextS.customInstructions;
        }).map(s => s.id);

        const nextChaps = p.chapters.map(c => {
          const nextBlks = c.blocks.map(b => {
            if (changedSpeakerIds.includes(b.speakerId) && b.status === 'success') {
              return { ...b, status: 'idle' as const, audioData: null };
            }
            return b;
          });
          return { ...c, blocks: nextBlks };
        });

        return {
          ...p,
          speakers: updatedSpeakers,
          chapters: nextChaps,
          lastModifiedAt: new Date().toISOString()
        };
      }
      return p;
    });

    syncWithServer(nextProjects);
  };

  // Synthesize Trigger
  const handleSynthesizeBlock = async (block: NarrationBlock) => {
    if (!block.text.trim()) {
      alert("Cannot synthesize transcription. Text field is empty.");
      return;
    }

    // Set status to generating
    handleUpdateBlockField(block.id, 'status', 'generating');
    handleUpdateBlockField(block.id, 'errorMessage', null);

    try {
      const resolvedSpeaker = activeSpeakers.find(s => s.id === block.speakerId) || activeSpeakers[0];

      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: block.text,
          speaker: resolvedSpeaker.voice,
          pacing: resolvedSpeaker.pacing,
          pitch: resolvedSpeaker.pitch,
          emotion: resolvedSpeaker.emotion,
          customInstructions: resolvedSpeaker.customInstructions,
          model: resolvedSpeaker.model
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "The synthesize engine reported an internal error.");
      }

      const data = await res.json();
      if (data.audioData) {
        // Compute estimated duration based on raw bytes
        const binary = window.atob(data.audioData);
        const estimatedDuration = (binary.length / 2) / 24000; // 16-bit PCM mono 24kHz

        const nextProjects = projects.map(p => {
          if (p.id === activeProjectId) {
            const nextChaps = p.chapters.map(c => {
              if (c.id === activeChapterId) {
                const nextBlks = c.blocks.map(b => {
                  if (b.id === block.id) {
                    return {
                      ...b,
                      status: 'success' as const,
                      audioData: data.audioData,
                      duration: estimatedDuration,
                      errorMessage: null,
                      fallback: data.fallback
                    };
                  }
                  return b;
                });
                return { ...c, blocks: nextBlks };
              }
              return c;
            });
            return { ...p, chapters: nextChaps };
          }
          return p;
        });

        syncWithServer(nextProjects);
      } else {
        throw new Error("Missing synthesized audio block returned from the backend.");
      }

    } catch (err: any) {
      console.error("Synthesize breakdown:", err);
      
      const nextProjects = projects.map(p => {
        if (p.id === activeProjectId) {
          const nextChaps = p.chapters.map(c => {
            if (c.id === activeChapterId) {
              const nextBlks = c.blocks.map(b => {
                if (b.id === block.id) {
                  return {
                    ...b,
                    status: 'error' as const,
                    audioData: null,
                    duration: null,
                    errorMessage: err.message || "Synthesize disconnected. Verify API configuration."
                  };
                }
                return b;
              });
              return { ...c, blocks: nextBlks };
            }
            return c;
          });
          return { ...p, chapters: nextChaps };
        }
        return p;
      });

      syncWithServer(nextProjects);
      setApiKeyConfirmed(false);
      
      setStatusMessage({
        type: 'error',
        text: `Audio generation failed. Please add a valid GEMINI_API_KEY in Settings > Secrets to enable the live text-to-speech engine.`
      });
    }
  };

  // Batch import complete callback
  const handleScriptImportComplete = (imported: ImportedBlock[]) => {
    if (!activeProject || !activeChapter) return;

    let updatedSpeakers = [...activeSpeakers];
    const voiceNames: VoiceName[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

    const finalized: NarrationBlock[] = imported.map((item, index) => {
      // Find or create speaker matching name
      let existing = updatedSpeakers.find(s => s.name.toLowerCase() === item.speakerName.toLowerCase());
      if (!existing) {
        const lowerName = item.speakerName.toLowerCase();
        let assignedVoice: VoiceName = voiceNames[updatedSpeakers.length % voiceNames.length];
        
        if (lowerName.includes("kore") || lowerName.includes("girl") || lowerName.includes("woman") || lowerName.includes("female")) assignedVoice = "Kore";
        else if (lowerName.includes("puck") || lowerName.includes("child") || lowerName.includes("boy") || lowerName.includes("young")) assignedVoice = "Puck";
        else if (lowerName.includes("charon") || lowerName.includes("grave") || lowerName.includes("old") || lowerName.includes("man")) assignedVoice = "Charon";
        else if (lowerName.includes("fenrir") || lowerName.includes("dark") || lowerName.includes("villain") || lowerName.includes("wolf")) assignedVoice = "Fenrir";
        else if (lowerName.includes("zephyr") || lowerName.includes("narrator")) assignedVoice = "Zephyr";

        const newSpk: Speaker = {
          id: `spk-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
          name: item.speakerName,
          isNarrator: lowerName.includes("narrator") && !updatedSpeakers.some(s => s.isNarrator),
          voice: assignedVoice,
          model: 'gemini-3.1-flash-tts-preview',
          pacing: item.pacing || 'normal',
          pitch: item.pitch || 'normal',
          emotion: item.emotion || 'none',
          customInstructions: 'Imported via script analyzer'
        };
        updatedSpeakers.push(newSpk);
        existing = newSpk;
      }

      return {
        id: "block-" + (Date.now() + index),
        chapterId: activeChapterId,
        speakerId: existing.id,
        text: item.text,
        status: 'idle',
        audioData: null,
        duration: null,
        errorMessage: null
      };
    });

    const nextProjects = projects.map(p => {
      if (p.id === activeProjectId) {
        const nextChaps = p.chapters.map(c => {
          if (c.id === activeChapterId) {
            const original = c.blocks.filter(b => b.text.trim().length > 0);
            return { ...c, blocks: [...original, ...finalized] };
          }
          return c;
        });
        return {
          ...p,
          chapters: nextChaps,
          speakers: updatedSpeakers,
          lastModifiedAt: new Date().toISOString()
        };
      }
      return p;
    });

    syncWithServer(nextProjects);
    
    setStatusMessage({
      type: 'info',
      text: `Successfully imported ${finalized.length} narrative dialogues and configured ${updatedSpeakers.length} project roles!`
    });
  };

  return (
    <div className={`min-h-screen lg:h-screen bg-[#050505] text-[#D4D4D4] font-sans flex flex-col antialiased lg:overflow-hidden ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
      
      {/* Global Studio Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center shadow shadow-amber-500/5">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-sans font-bold tracking-tight text-white leading-tight">Cast Desk Audio Studio</h1>
            <p className="text-[10px] font-mono text-neutral-400">Gemini-Powered Audiobook Orchestrator</p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 border border-white/10 hover:border-amber-500/40 text-neutral-300 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            id="btn-trigger-importer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Screenplay Import</span>
          </button>

          <a 
            href="https://ai.google.dev/models/gemini" 
            target="_blank" 
            referrerPolicy="no-referrer"
            className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-300 font-mono"
          >
            <span>Model API documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden relative">
        
        {/* Sidebar Directory list */}
        <AnimatePresence initial={false}>
          {isSidebarVisible && (
            <motion.aside
              initial={isLargeScreen ? { width: 0, opacity: 0 } : { height: 0, opacity: 0 }}
              animate={{ 
                width: isLargeScreen ? sidebarWidth : "100%", 
                opacity: 1 
              }}
              exit={isLargeScreen ? { width: 0, opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={isLargeScreen ? { width: sidebarWidth } : {}}
              className="w-full bg-[#080808] border-r border-white/10 flex flex-col p-4 gap-6 shrink-0 lg:overflow-y-auto relative"
            >
              
              {/* Projects Select Module */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold">Audiobooks</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCreateProject}
                      className="p-1 hover:bg-white/5 text-amber-500 rounded transition-colors cursor-pointer"
                      title="New Project"
                      id="btn-sidebar-create"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDeleteProject}
                      className="p-1 hover:bg-white/5 text-neutral-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                      title="Delete active Project"
                      id="btn-sidebar-delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setActiveProjectId(proj.id);
                        if (proj.chapters.length > 0) {
                          setActiveChapterId(proj.chapters[0].id);
                        }
                      }}
                      className={`text-left p-3 rounded-xl border text-xs transition-all relative cursor-pointer ${
                        proj.id === activeProjectId
                          ? 'bg-amber-600/10 border-amber-500/30 text-white font-semibold'
                          : 'bg-transparent border-transparent hover:bg-white/5 text-neutral-400'
                      }`}
                      id={`btn-proj-${proj.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <BookMarked className={`w-3.5 h-3.5 shrink-0 ${proj.id === activeProjectId ? 'text-amber-500' : 'text-neutral-500'}`} />
                        <span className="truncate flex-1">{proj.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapters Select Module */}
              <div className="flex flex-col gap-2.5 border-t border-white/5 pt-5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold">Chapters</span>
                  {activeProject && (
                    <button
                      onClick={handleCreateChapter}
                      className="p-1 hover:bg-white/5 text-amber-500 rounded transition-colors cursor-pointer"
                      title="New Chapter"
                      id="btn-create-chapter"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {activeProject?.chapters.map((chap) => (
                    <div
                      key={chap.id}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        chap.id === activeChapterId
                          ? 'bg-[#121212] border-white/10 text-white font-semibold'
                          : 'bg-transparent border-transparent hover:bg-white/5 text-neutral-450'
                      }`}
                    >
                      <button
                        onClick={() => setActiveChapterId(chap.id)}
                        className="flex items-center gap-2 text-left truncate flex-1 cursor-pointer"
                        id={`btn-chap-${chap.id}`}
                      >
                        <BookOpen className={`w-3.5 h-3.5 shrink-0 ${chap.id === activeChapterId ? 'text-amber-500' : 'text-neutral-600'}`} />
                        <span className="truncate">{chap.title}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chap.id)}
                        className="p-1 hover:bg-red-500/10 text-neutral-600 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Remove Chapter"
                        id={`btn-delete-chap-${chap.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapse button at bottom */}
              <div className="mt-auto border-t border-white/5 pt-4">
                <button
                  onClick={() => setIsSidebarVisible(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-[10px] font-mono tracking-wider uppercase rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                  title="Collapse Sidebar"
                  id="btn-collapse-sidebar"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Collapse Panel</span>
                </button>
              </div>

              {/* Draggable handle for resizability */}
              {isLargeScreen && (
                <div
                  onMouseDown={startResizing}
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-amber-500/40 active:bg-amber-500 transition-colors z-30"
                  title="Drag to resize sidebar"
                />
              )}

            </motion.aside>
          )}
        </AnimatePresence>

        {/* Floating Expand Trigger when hidden */}
        {!isSidebarVisible && (
          <button
            onClick={() => setIsSidebarVisible(true)}
            className="fixed left-5 bottom-5 z-40 w-10 h-10 bg-amber-600 hover:bg-amber-500 text-black rounded-xl shadow-lg shadow-black/80 flex items-center justify-center cursor-pointer border border-amber-500/30 transition-all hover:scale-105 active:scale-95"
            title="Expand Sidebar"
            id="btn-expand-sidebar"
          >
            <ArrowRight className="w-5 h-5 text-black" />
          </button>
        )}

        {/* Main Work desk */}
        <main className="flex-1 bg-[#030303] flex flex-col p-4 overflow-y-auto gap-6">
          
          {/* Status Indicators Banner */}
          {statusMessage && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all animate-in slide-in-from-top-4 duration-300 ${
              statusMessage.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`} id="status-alert-box">
              <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${statusMessage.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`} />
              <div className="text-xs">
                {statusMessage.text}
                <button 
                  onClick={() => setStatusMessage(null)} 
                  className="font-bold underline ml-2 hover:opacity-85 block sm:inline-block mt-1 sm:mt-0 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {activeChapter ? (
            <div className="flex flex-col gap-6">
              
              {/* Active Chapter Details Card */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 w-full">
                  <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-bold">Workspace Section</span>
                  <input
                    type="text"
                    value={activeChapter.title}
                    onChange={(e) => {
                      const updated = projects.map(p => {
                        if (p.id === activeProjectId) {
                          const updatedChaps = p.chapters.map(c => {
                            if (c.id === activeChapterId) {
                              return { ...c, title: e.target.value };
                            }
                            return c;
                          });
                          return { ...p, chapters: updatedChaps };
                        }
                        return p;
                      });
                      syncWithServer(updated);
                    }}
                    className="text-lg font-sans font-semibold tracking-tight text-white border-b border-dashed border-transparent hover:border-neutral-700 focus:border-amber-500 focus:outline-none w-full pb-1 mt-1 transition-colors bg-transparent"
                    title="Click to rename this chapter"
                    id="chapter-rename-input"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Change chapter labels or refine continuous speaking sections below.</p>
                </div>
                
                <span className="text-xs font-mono bg-white/5 px-3 py-1.5 rounded border border-white/10 text-neutral-300 block shrink-0">
                  Total Lines: {activeChapter.blocks.length}
                </span>
              </div>

              {/* Character Casting & Auditions Deck */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-md shadow-black/35">
                <VoiceCastingGuides
                  speakers={activeSpeakers}
                  onUpdateSpeakers={handleUpdateSpeakers}
                  apiConfigured={apiKeyConfirmed}
                />
              </div>

              {/* Primary Narration Workspace Stack */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-sans font-bold text-sm text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-500" />
                    <span>Narration Script Flow</span>
                  </h3>
                  <button
                    onClick={handleAddBlock}
                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs py-2 px-4 rounded transition-all cursor-pointer shadow-md shadow-amber-950/40"
                    id="btn-add-block"
                  >
                    <Plus className="w-3.5 h-3.5 text-black font-bold" />
                    <span>Add Narration Block</span>
                  </button>
                </div>

                <div className="flex flex-col gap-4.5" id="blocks-flow-container">
                  <AnimatePresence initial={false}>
                    {activeChapter.blocks.map((block, index) => {
                      const isSpokenSpot = highlightedBlockId === block.id;
                      const resolvedSpeaker = activeSpeakers.find(s => s.id === block.speakerId) || activeSpeakers[0] || {
                        id: 'default',
                        name: 'Narrator',
                        voice: 'Zephyr',
                        isNarrator: true,
                        pacing: 'normal',
                        pitch: 'normal',
                        emotion: 'none'
                      };

                      const charCount = block.text.length;
                      const wordCount = block.text.trim() ? block.text.trim().split(/\s+/).length : 0;
                      const tokenEstimate = Math.ceil(charCount / 4) || 0;

                      return (
                        <motion.div
                          key={block.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className={`bg-[#0A0A0A] border rounded-2xl p-4 transition-all flex flex-col gap-4 relative ${
                            isSpokenSpot 
                              ? 'border-amber-500 ring-2 ring-amber-500/15 shadow-md shadow-black/50' 
                              : 'border-white/10 hover:border-white/15'
                          }`}
                          id={`block-card-${block.id}`}
                        >
                          {/* Block control strip */}
                          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2.5">
                              {/* Speaker Badge label */}
                              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Character Role:</span>
                              <select
                                value={block.speakerId}
                                onChange={(e) => handleUpdateBlockField(block.id, 'speakerId', e.target.value)}
                                className="font-sans font-bold text-xs text-white border bg-[#0D0D0D] border-white/10 rounded-lg px-2.5 py-1 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                                id={`select-speaker-${block.id}`}
                              >
                                {activeSpeakers.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} {s.isNarrator ? '(Narrator)' : ''}
                                  </option>
                                ))}
                              </select>

                              {/* Voice indicator description */}
                              <span className="text-[10px] font-mono text-neutral-500 bg-[#0D0D0D] px-2 py-1 rounded-md border border-white/5">
                                Base Voice: {resolvedSpeaker.voice} • {resolvedSpeaker.pacing} speed • {resolvedSpeaker.emotion !== 'none' ? `tone: ${resolvedSpeaker.emotion}` : 'neutral tone'}
                              </span>
                            </div>

                            {/* Utility operations: Reorder & Delete */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleMoveBlock(index, 'up')}
                                disabled={index === 0}
                                className="p-1 hover:bg-white/5 disabled:opacity-30 rounded text-neutral-450 hover:text-white transition-colors cursor-pointer"
                                title="Move up"
                                id={`btn-up-${block.id}`}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveBlock(index, 'down')}
                                disabled={index === activeChapter.blocks.length - 1}
                                className="p-1 hover:bg-white/5 disabled:opacity-30 rounded text-neutral-450 hover:text-white transition-colors cursor-pointer"
                                title="Move down"
                                id={`btn-down-${block.id}`}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-px h-4 bg-white/10 mx-1" />
                              <button
                                onClick={() => handleDeleteBlock(block.id)}
                                className="p-1.5 hover:bg-red-500/10 text-neutral-400 hover:text-red-450 rounded transition-colors cursor-pointer"
                                title="Delete this paragraph"
                                id={`btn-del-${block.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Sentence editing textfield */}
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={block.text}
                              onChange={(e) => handleUpdateBlockField(block.id, 'text', e.target.value)}
                              placeholder="Describe scene details or input dialogue words..."
                              className="w-full min-h-[50px] font-sans font-medium text-white placeholder-neutral-650 text-sm focus:outline-none resize-none bg-transparent leading-relaxed"
                              id={`textarea-block-${block.id}`}
                              rows={2}
                            />
                          </div>

                          {/* Fine-Tuning drawer and synthesizers */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-white/5">
                            {/* Live character, word, and token counts with tooltip description */}
                            <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 font-medium">
                              <div className="relative group/char flex items-center gap-1.5 cursor-help py-1">
                                <Type className="w-3.5 h-3.5 text-amber-500/80" />
                                <span>Chars: <strong className="text-neutral-200 font-mono">{charCount}</strong></span>
                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover/char:scale-100 transition-all duration-150 bg-neutral-950 border border-white/10 text-neutral-200 text-[10px] px-2.5 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none font-mono shadow-2xl">
                                  Total characters including spaces
                                </span>
                              </div>
                              <span className="text-neutral-800">•</span>
                              <div className="relative group/word flex items-center gap-1.5 cursor-help py-1">
                                <FileText className="w-3.5 h-3.5 text-amber-500/80" />
                                <span>Words: <strong className="text-neutral-200 font-mono">{wordCount}</strong></span>
                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover/word:scale-100 transition-all duration-150 bg-neutral-950 border border-white/10 text-neutral-200 text-[10px] px-2.5 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none font-mono shadow-2xl">
                                  Total words
                                </span>
                              </div>
                              <span className="text-neutral-800">•</span>
                              <div className="relative group/token flex items-center gap-1.5 cursor-help py-1">
                                <Cpu className="w-3.5 h-3.5 text-amber-500/80" />
                                <span>Tokens: <strong className="text-neutral-200 font-mono">~{tokenEstimate}</strong></span>
                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover/token:scale-100 transition-all duration-150 bg-neutral-950 border border-white/10 text-neutral-200 text-[10px] px-2.5 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none font-mono shadow-2xl">
                                  Estimated Gemini tokens (approx. 4 chars per token)
                                </span>
                              </div>
                            </div>

                            {/* Synthesis action bar */}
                            <div className="flex items-center justify-end shrink-0 gap-3">
                              {block.status === 'success' && block.audioData ? (
                                <div className="flex items-center gap-2">
                                  <WaveformPlayer
                                    base64Pcm={block.audioData}
                                    id={block.id}
                                    isFallback={block.fallback}
                                    text={block.text}
                                    speaker={resolvedSpeaker.voice}
                                    pacing={resolvedSpeaker.pacing}
                                    pitch={resolvedSpeaker.pitch}
                                    emotion={resolvedSpeaker.emotion}
                                  />
                                  <button
                                    onClick={() => handleSynthesizeBlock(block)}
                                    disabled={false}
                                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-lg hover:text-amber-400 transition-all cursor-pointer relative group/resynth flex items-center justify-center shrink-0 disabled:opacity-40"
                                    id={`btn-resynthesize-${block.id}`}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover/resynth:scale-100 transition-all duration-150 bg-neutral-950 border border-white/10 text-neutral-200 text-[10px] px-2.5 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none font-mono shadow-2xl">
                                      Re-synthesize
                                    </span>
                                  </button>
                                </div>
                              ) : (
                                <motion.button
                                  onClick={() => handleSynthesizeBlock(block)}
                                  disabled={block.status === 'generating'}
                                  animate={block.status === 'generating' ? {
                                    backgroundColor: ["#4b5563", "#b45309", "#4b5563"],
                                  } : {}}
                                  transition={block.status === 'generating' ? {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  } : {}}
                                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-80 disabled:text-neutral-200 text-black text-xs font-semibold rounded transition-all cursor-pointer shadow-md shadow-amber-950/20 active:scale-[0.98]"
                                  id={`btn-synthesize-${block.id}`}
                                >
                                  {block.status === 'generating' ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      <span>Synthesizing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <AudioLines className="w-3.5 h-3.5 text-black" />
                                      <span>Synthesize</span>
                                    </>
                                  )}
                                </motion.button>
                              )}
                            </div>
                          </div>

                          {/* Print error diagnostics */}
                          {block.status === 'error' && block.errorMessage && (
                            <div className="flex items-start gap-1.5 bg-red-950/35 text-red-300 text-[10.5px] p-2.5 rounded border border-red-900/30">
                              <AlertCircle className="w-3.5 h-3.5 m-0.5 text-red-500 shrink-0" />
                              <span>{block.errorMessage}</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Seamless Full Chapter Assembler */}
              <div className="mt-4">
                <ChapterTimeline
                  chapter={activeChapter}
                  speakers={activeSpeakers}
                  onBlockSpeakHighlight={(bId) => setHighlightedBlockId(bId)}
                />
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-lg text-center min-h-[340px]">
              <BookOpen className="w-12 h-12 text-neutral-700 mb-3.5 animate-bounce" />
              <h3 className="text-sm font-sans font-semibold text-white">No audiobook sheets active</h3>
              <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-5">Create a new narrative project or chapter on the left sidebar index to configure speech synthesizers.</p>
              <button
                onClick={handleCreateProject}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs rounded transition-all cursor-pointer shadow-md shadow-amber-950/20"
              >
                Create Project
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Script Screenplay Importer Modal */}
      {isImportModalOpen && (
        <ScriptImporter
          onImportComplete={handleScriptImportComplete}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {/* Custom Elegant Modals replacement for alert, confirm, prompt */}
      <AnimatePresence>
        {dialog && dialog.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#121212] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative top gold ridge */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-amber-700"></div>
              
              <h3 className="text-xs font-mono tracking-wider text-amber-500 uppercase font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>{dialog.title}</span>
              </h3>
              
              <p className="text-xs text-neutral-300 font-sans leading-relaxed mb-5">
                {dialog.message}
              </p>
              
              {dialog.type === 'prompt' && (
                <input
                  type="text"
                  value={dialog.value}
                  onChange={(e) => setDialog(prev => prev ? { ...prev, value: e.target.value } : null)}
                  className="w-full text-xs font-sans text-neutral-200 bg-[#0A0A0A] border border-white/10 rounded-xl px-3.5 py-2 mb-5 outline-none focus:border-amber-500/40 focus:bg-neutral-900/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      dialog.onOk(dialog.value);
                    }
                  }}
                />
              )}
              
              <div className="flex items-center justify-end gap-2.5">
                {dialog.type !== 'alert' && (
                  <button
                    onClick={() => {
                      if (dialog.onCancel) dialog.onCancel();
                      setDialog(null);
                    }}
                    className="px-4 py-2 border border-white/5 hover:bg-white/5 text-neutral-400 hover:text-white rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    dialog.onOk(dialog.value);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer shadow-md shadow-amber-950/20"
                >
                  {dialog.type === 'alert' ? 'OK' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Status Footer */}
      <footer className="bg-[#050505] border-t border-white/10 px-6 py-4.5 flex justify-between items-center text-[10px] text-neutral-500 font-mono">
        <span>Audiobook Production Workspace active</span>
        <span>UTC Clock: 2026-06-25</span>
      </footer>

    </div>
  );
}
