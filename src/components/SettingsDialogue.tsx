import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, Settings, Users, Clapperboard, FileText, Plus, Trash2, 
  Volume2, Square, Search, Sparkles, Check, ChevronDown, HelpCircle, 
  AlertTriangle, RotateCcw, Table, ExternalLink, RefreshCw, CheckCircle2,
  Sliders
} from 'lucide-react';
import { Project, Speaker, Scene, VoiceProfile, UserPreferences, GEMINI_VOICES, GEMINI_MODELS } from '../types';
import { PROJECT_SETTINGS_SCHEMAS } from '../utils/settingsSchemas';
import { DynamicSettingsForm } from './DynamicSettingsForm';
import { generateId } from '../services/idService';
import { compilePrompt } from '../utils/promptCompiler';
import { requestGoogleAccessToken, isGoogleAuthenticated, clearGoogleToken } from '../services/googleAuthService';
import { createOrGetSpreadsheet, formatSpreadsheetTitle, formatMonthSheetName } from '../services/sheetsService';
import { loadUserPreferences, saveUserPreferences } from '../services/preferenceService';

export const DEFAULT_PROMPT_TEMPLATE = `# {project_title}
## {chapter_title}

## Speakers

### {speaker_name}
- Role: {speaker_role}
- Voice: {speaker_voice}

#### Style
{speaker_instructions}

## Scene Context: {scene_name}
{scene_context}

## TRANSCRIPT
{snippet_text}`;

interface SettingsDialogueProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  previewingSpeakerId: string | null;
  onPreviewVoice: (speaker: Speaker) => void;
  onStopAudio: () => void;
  defaultTab?: 'project' | 'speakers' | 'scenes' | 'prompt' | 'logging';
  autoAddSpeaker?: boolean;
  autoAddScene?: boolean;
  activeChapterId?: string | null;
  selectedSnippetIds?: Set<string>;
  focusedSnippetId?: string | null;
  userPreferences?: UserPreferences;
  onUpdatePreferences?: (preferences: UserPreferences) => void;
}

export const SettingsDialogue: React.FC<SettingsDialogueProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  previewingSpeakerId,
  onPreviewVoice,
  onStopAudio,
  defaultTab = 'project',
  autoAddSpeaker = false,
  autoAddScene = false,
  activeChapterId = null,
  selectedSnippetIds = new Set<string>(),
  focusedSnippetId = null,
  userPreferences: externalPreferences,
  onUpdatePreferences,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'speakers' | 'scenes' | 'prompt' | 'logging'>('project');
  
  // Temporary state for edits (committed on Save/OK, discarded on Cancel)
  const [tempSettings, setTempSettings] = useState(() => ({ ...project.settings }));
  const [tempSpeakers, setTempSpeakers] = useState<Speaker[]>(() => [...project.speakers]);
  const [tempScenes, setTempScenes] = useState<Scene[]>(() => [...(project.scenes || [])]);
  const [tempPromptTemplate, setTempPromptTemplate] = useState<string>(() => {
    return (project.settings as any).promptTemplate || DEFAULT_PROMPT_TEMPLATE;
  });

  // User preferences temporary state
  const [tempPreferences, setTempPreferences] = useState<UserPreferences>(() => {
    return externalPreferences || loadUserPreferences();
  });

  // Google Sheets Auth and Setup State
  const [isAuthenticatingGoogle, setIsAuthenticatingGoogle] = useState(false);
  const [isCreatingSpreadsheet, setIsCreatingSpreadsheet] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [googleSuccessMessage, setGoogleSuccessMessage] = useState<string | null>(null);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(() => isGoogleAuthenticated());

  // Track currently selected speaker to edit in Speakers tab
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(() => {
    return tempSpeakers[0]?.id || null;
  });

  // Voice Search / Filter State in Speakers Tab
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male' | 'Neutral'>('All');
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [highlightedVoiceIndex, setHighlightedVoiceIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track currently selected scene to edit in Scenes tab
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(() => {
    return tempScenes[0]?.id || null;
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Synchronize internal form state with parent project state whenever the dialogue is opened
  useEffect(() => {
    if (isOpen) {
      setTempSettings({ ...project.settings });
      setTempPromptTemplate((project.settings as any).promptTemplate || DEFAULT_PROMPT_TEMPLATE);
      setTempPreferences(externalPreferences || loadUserPreferences());
      setHasGoogleAuth(isGoogleAuthenticated());
      setGoogleAuthError(null);
      setGoogleSuccessMessage(null);
      setShowResetConfirm(false);
      
      const currentSpeakers = [...project.speakers];
      const currentScenes = [...(project.scenes || [])];
      
      let nextSpeakers = currentSpeakers;
      let nextScenes = currentScenes;
      let nextSelectedSpeakerId = selectedSpeakerId;
      let nextSelectedSceneId = selectedSceneId;

      if (autoAddSpeaker) {
        const newId = generateId();
        const newSpeaker: Speaker = {
          id: newId,
          name: `Character ${currentSpeakers.length + 1}`,
          voice: 'Zephyr',
          style: 'Normal pacing, warm conversational tone.',
          isNarrator: false,
          order: currentSpeakers.length,
        };
        nextSpeakers = [...currentSpeakers, newSpeaker];
        nextSelectedSpeakerId = newId;
      } else {
        nextSelectedSpeakerId = currentSpeakers[0]?.id || null;
      }

      if (autoAddScene) {
        const newId = generateId();
        const newScene: Scene = {
          id: newId,
          name: `Scene ${currentScenes.length + 1}`,
          description: 'It is a cold evening. Faint raindrops tap against the glass window...',
          order: currentScenes.length
        };
        nextScenes = [...currentScenes, newScene];
        nextSelectedSceneId = newId;
      } else {
        nextSelectedSceneId = currentScenes[0]?.id || null;
      }

      setTempSpeakers(nextSpeakers);
      setTempScenes(nextScenes);
      setSelectedSpeakerId(nextSelectedSpeakerId);
      setSelectedSceneId(nextSelectedSceneId);
      
      if (defaultTab) {
        setActiveTab(defaultTab);
      }
    }
  }, [isOpen]);

  // Active elements
  const activeSpeaker = tempSpeakers.find(s => s.id === selectedSpeakerId) || tempSpeakers[0];
  const activeScene = tempScenes.find(s => s.id === selectedSceneId) || tempScenes[0];

  // Google Sheets OAuth and Initialization handlers
  const handleConnectGoogle = async () => {
    setIsAuthenticatingGoogle(true);
    setGoogleAuthError(null);
    setGoogleSuccessMessage(null);
    try {
      await requestGoogleAccessToken();
      setHasGoogleAuth(true);
      setGoogleSuccessMessage("Google Account connected successfully.");
    }
    catch (err: any) {
      console.error("Google authentication failed:", err);
      setGoogleAuthError(err?.message || "Failed to authenticate with Google.");
    }
    finally {
      setIsAuthenticatingGoogle(false);
    }
  };

  const handleDisconnectGoogle = () => {
    clearGoogleToken();
    setHasGoogleAuth(false);
    setGoogleSuccessMessage("Google Account disconnected.");
  };

  const handleCreateNewSpreadsheet = async () => {
    setIsCreatingSpreadsheet(true);
    setGoogleAuthError(null);
    setGoogleSuccessMessage(null);

    try {
      const token = await requestGoogleAccessToken();
      setHasGoogleAuth(true);
      const res = await createOrGetSpreadsheet(token);
      setTempPreferences(prev => ({
        ...prev,
        sheetsSpreadsheetId: res.spreadsheetId,
        sheetsSpreadsheetUrl: res.spreadsheetUrl,
        sheetsLoggingEnabled: true
      }));
      setGoogleSuccessMessage(`Created new spreadsheet: ${res.spreadsheetId}`);
    }
    catch (err: any) {
      console.error("Failed to create log spreadsheet:", err);
      setGoogleAuthError(err?.message || "Failed to create Google Spreadsheet.");
    }
    finally {
      setIsCreatingSpreadsheet(false);
    }
  };

  // Save edits back to project and user preferences
  const handleSave = () => {
    onUpdateProject({
      settings: {
        ...project.settings,
        ...tempSettings,
        promptTemplate: tempPromptTemplate
      } as any,
      speakers: tempSpeakers,
      scenes: tempScenes
    });

    saveUserPreferences(tempPreferences);
    if (onUpdatePreferences) {
      onUpdatePreferences(tempPreferences);
    }

    onClose();
  };

  // Speakers tab operations
  const handleAddSpeaker = () => {
    const newId = generateId();
    const newSpeaker: Speaker = {
      id: newId,
      name: `Character ${tempSpeakers.length + 1}`,
      voice: 'Zephyr',
      style: 'Normal pacing, warm conversational tone.',
      isNarrator: false,
      order: tempSpeakers.length,
    };
    setTempSpeakers([...tempSpeakers, newSpeaker]);
    setSelectedSpeakerId(newId);
  };

  const handleDeleteSpeaker = (id: string) => {
    if (tempSpeakers.length <= 1) {
      alert("At least one speaker must be kept.");
      return;
    }
    const filtered = tempSpeakers.filter(s => s.id !== id);
    setTempSpeakers(filtered);
    if (selectedSpeakerId === id) {
      setSelectedSpeakerId(filtered[0].id);
    }
  };

  const handleUpdateSpeaker = (id: string, updates: Partial<Speaker>) => {
    setTempSpeakers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Scenes tab operations
  const handleAddScene = () => {
    const newId = generateId();
    const newScene: Scene = {
      id: newId,
      name: `Scene ${tempScenes.length + 1}`,
      description: 'It is a cold evening. Faint raindrops tap against the glass window...',
      order: tempScenes.length
    };
    setTempScenes([...tempScenes, newScene]);
    setSelectedSceneId(newId);
  };

  const handleDeleteScene = (id: string) => {
    const filtered = tempScenes.filter(s => s.id !== id);
    setTempScenes(filtered);
    if (selectedSceneId === id) {
      setSelectedSceneId(filtered[0]?.id || null);
    }
  };

  const handleUpdateScene = (id: string, updates: Partial<Scene>) => {
    setTempScenes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Filtered Voices for search
  const filteredVoices = GEMINI_VOICES.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
                          voice.description.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
                          voice.tone.toLowerCase().includes(voiceSearchQuery.toLowerCase());
    const matchesGender = genderFilter === 'All' || voice.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Synchronize index when dropdown is opened/search updated
  useEffect(() => {
    if (voiceDropdownOpen) {
      setHighlightedVoiceIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [voiceDropdownOpen]);

  useEffect(() => {
    setHighlightedVoiceIndex(0);
  }, [voiceSearchQuery, genderFilter]);

  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!voiceDropdownOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedVoiceIndex(prev => 
        prev < filteredVoices.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedVoiceIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredVoices.length === 1) {
        handleUpdateSpeaker(activeSpeaker?.id || '', { voice: filteredVoices[0].id });
        setVoiceDropdownOpen(false);
        setVoiceSearchQuery('');
      }
      else if (highlightedVoiceIndex >= 0 && highlightedVoiceIndex < filteredVoices.length) {
        handleUpdateSpeaker(activeSpeaker?.id || '', { voice: filteredVoices[highlightedVoiceIndex].id });
        setVoiceDropdownOpen(false);
        setVoiceSearchQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setVoiceDropdownOpen(false);
      setVoiceSearchQuery('');
    } else {
      // Focus search box back if alphanumeric/backspace pressed
      if (document.activeElement !== searchInputRef.current) {
        if (e.key.length === 1 || e.key === 'Backspace') {
          searchInputRef.current?.focus();
        }
      }
    }
  };

  /**
   * Validates that the provided prompt template contains all mandatory variables.
   * 
   * @param template The template string to validate.
   * @returns An array of error message strings, empty if template is valid.
   */
  const getTemplateValidationErrors = (template: string): string[] => {
    const errors: string[] = [];
    if (!template.includes('{speaker_name}')) {
      errors.push("Missing required variable: {speaker_name}");
    }
    if (!template.includes('{speaker_voice}')) {
      errors.push("Missing required variable: {speaker_voice}");
    }
    if (!template.includes('{speaker_instructions}') && !template.includes('{speaker_style}')) {
      errors.push("Missing required variable: {speaker_instructions} (or {speaker_style})");
    }
    if (!template.includes('{snippet_text}')) {
      errors.push("Missing required variable: {snippet_text}");
    }
    return errors;
  };

  const templateErrors = useMemo(() => getTemplateValidationErrors(tempPromptTemplate), [tempPromptTemplate]);

  /**
   * Compiles the markdown prompt template using the unified compilePrompt utility.
   * 
   * @param template The template string containing placeholders.
   * @returns The fully interpolated markdown string.
   */
  const getCompiledPreview = (template: string) => {
    const activeChapter = project.chapters.find(c => c.id === activeChapterId) || project.chapters[0];
    const { prompt } = compilePrompt({
      project: {
        ...project,
        settings: tempSettings
      },
      activeChapter,
      selectedSnippetIds,
      focusedSnippetId,
      templateOverride: template
    });
    return prompt;
  };

  // Basic markdown to JSX previewer helper
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-slate-300 font-sans text-sm selection:bg-indigo-500/30">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            return <h1 key={idx} className="text-lg font-black text-slate-100 mt-5 pb-2 border-b border-slate-700">{trimmed.substring(2)}</h1>;
          }
          if (trimmed.startsWith('## ')) {
            return <h2 key={idx} className="text-base font-bold text-indigo-400 mt-4 pb-1 border-b border-slate-800">{trimmed.substring(3)}</h2>;
          }
          if (trimmed.startsWith('### ')) {
            return <h3 key={idx} className="text-sm font-semibold text-teal-400 mt-3">{trimmed.substring(4)}</h3>;
          }
          if (trimmed.startsWith('#### ')) {
            return <h4 key={idx} className="text-sm font-semibold fg-onedark-purple mt-3">{trimmed.substring(5)}</h4>;
          }
          if (trimmed.startsWith('##### ')) {
            return <h5 key={idx} className="text-sm font-semibold fg-onedark-cyan mt-3">{trimmed.substring(6)}</h5>;
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return <li key={idx} className="ml-4 list-disc pl-1 text-slate-300">{trimmed.substring(2)}</li>;
          }
          if (trimmed.startsWith('> ')) {
            return <blockquote key={idx} className="border-l-4 border-indigo-500 bg-slate-950/40 p-2.5 rounded text-slate-400 italic font-serif my-2">{trimmed.substring(2)}</blockquote>;
          }
          if (!trimmed) {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx} className="leading-relaxed">{line}</p>;
        })}
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Dialogue Window Frame */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/95 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Title Bar & Draggable Indicator */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight">Project Settings Hub</h2>
              <p className="text-xs text-slate-400 leading-normal">Configure characters, acoustic scenes, and engine parameters</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/30 px-6 py-2">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('project')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
                activeTab === 'project' 
                  ? 'bg-slate-800 text-slate-100 shadow border border-slate-700/80' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Project Settings
            </button>
            <button
              onClick={() => setActiveTab('speakers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
                activeTab === 'speakers' 
                  ? 'bg-slate-800 text-slate-100 shadow border border-slate-700/80' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Speakers (Casting)
            </button>
            <button
              onClick={() => setActiveTab('scenes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
                activeTab === 'scenes' 
                  ? 'bg-slate-800 text-slate-100 shadow border border-slate-700/80' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              Scenes (Environment)
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
                activeTab === 'prompt' 
                  ? 'bg-slate-800 text-slate-100 shadow border border-slate-700/80' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Prompt Editor
            </button>
            <button
              onClick={() => setActiveTab('logging')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
                activeTab === 'logging' 
                  ? 'bg-slate-800 text-slate-100 shadow border border-slate-700/80' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Google Sheets Logging
            </button>
          </div>
        </div>

        {/* Dynamic Modal Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/40">
          
          {/* TAB 1: PROJECT SETTINGS */}
          {activeTab === 'project' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Acoustic Generation</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Define speech-synthesis model preferences & parameters</p>
                </div>
                <DynamicSettingsForm 
                  schemas={PROJECT_SETTINGS_SCHEMAS}
                  values={tempSettings}
                  onChange={(k, v) => setTempSettings(prev => ({ ...prev, [k]: v }))}
                  filterCategory="generation"
                />
                
                <div className="border-b border-slate-800 pt-4 pb-2">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">API Authentication</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Control execution endpoints and key overrides</p>
                </div>
                <DynamicSettingsForm 
                  schemas={PROJECT_SETTINGS_SCHEMAS}
                  values={tempSettings}
                  onChange={(k, v) => setTempSettings(prev => ({ ...prev, [k]: v }))}
                  filterCategory="api"
                />
              </div>

              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Export Format Configuration</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">Set parameters for high-fidelity master output exports</p>
                </div>
                <DynamicSettingsForm 
                  schemas={PROJECT_SETTINGS_SCHEMAS}
                  values={tempSettings}
                  onChange={(k, v) => setTempSettings(prev => ({ ...prev, [k]: v }))}
                  filterCategory="export"
                />

                <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/20 space-y-3 mt-6">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Adaptive Processing</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    By storing settings programmatically via dynamic schemas, audiobook exports automatically match desired formats (e.g., M4B metadata injection or high-bitrate MP3 chapters) dynamically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPEAKERS (CASTING) */}
          {activeTab === 'speakers' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[50vh]">
              
              {/* Speakers Roster Left Column */}
              <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 flex flex-col h-full max-h-[55vh]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Characters</span>
                  <button
                    onClick={handleAddSpeaker}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Speaker
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {tempSpeakers.map((speaker) => {
                    const profile = GEMINI_VOICES.find(v => v.id === speaker.voice);
                    return (
                      <div
                        key={speaker.id}
                        onClick={() => setSelectedSpeakerId(speaker.id)}
                        className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                          selectedSpeakerId === speaker.id
                            ? 'bg-slate-800 border-indigo-500/50 text-slate-100 shadow-md'
                            : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            profile?.avatarColor || 'bg-slate-700 text-slate-300'
                          }`}>
                            {speaker.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-semibold block truncate max-w-[120px]">
                              {speaker.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {speaker.voice} {speaker.isNarrator && '• (Narrator)'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSpeaker(speaker.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-all"
                          title="Delete Speaker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Speaker Customizations Right Area */}
              {activeSpeaker ? (
                <div className="md:col-span-2 border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-5 overflow-y-auto max-h-[55vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Speaker Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Character Name
                      </label>
                      <input
                        type="text"
                        value={activeSpeaker.name}
                        onChange={(e) => handleUpdateSpeaker(activeSpeaker.id, { name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 outline-none text-sm transition-all"
                      />
                    </div>

                    {/* Speaker Role */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Character Role
                      </label>
                      <input
                        type="text"
                        value={activeSpeaker.role || ''}
                        onChange={(e) => handleUpdateSpeaker(activeSpeaker.id, { role: e.target.value })}
                        placeholder="e.g. Protagonist, Narrator, Sister"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Narrator Checkbox */}
                  <div className="flex items-center pl-1">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!activeSpeaker.isNarrator}
                        onChange={(e) => {
                          // Turn off narrator on all other speakers first if checking this
                          if (e.target.checked) {
                            setTempSpeakers(prev => prev.map(s => s.id === activeSpeaker.id ? { ...s, isNarrator: true, role: s.role || 'Narrator' } : { ...s, isNarrator: false }));
                          } else {
                            handleUpdateSpeaker(activeSpeaker.id, { isNarrator: false });
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2"
                      />
                      <span className="text-xs font-semibold text-slate-300">Set as Default Narrator</span>
                    </label>
                  </div>

                  {/* Customizable Voice Profile Selector */}
                  <div className="space-y-2 relative">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Assigned Voice Model (TTS Voice)
                    </label>
                    
                    {/* Combobox Toggle Anchor */}
                    <div 
                      onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus-within:border-indigo-500 rounded px-3 py-2.5 text-slate-100 text-sm flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-400 font-mono">
                          {activeSpeaker.voice}
                        </span>
                        <span className="text-xs text-slate-500">
                          — {GEMINI_VOICES.find(v => v.id === activeSpeaker.voice)?.description || ''}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${voiceDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Combobox Search Panel Dropdown */}
                    {voiceDropdownOpen && (
                      <div 
                        onKeyDown={handleDropdownKeyDown}
                        className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl shadow-black/80 z-50 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
                      >
                        {/* Search Query Inputs */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              value={voiceSearchQuery}
                              onChange={(e) => setVoiceSearchQuery(e.target.value)}
                              placeholder="Fuzzy search voice profile name, tone, genre..."
                              className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500 placeholder-slate-500"
                              onClick={(e) => e.stopPropagation()} // don't close dropdown on click
                            />
                          </div>
                          <select
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value as any)}
                            className="bg-slate-900 border border-slate-800 rounded text-xs px-2 text-slate-300 outline-none focus:border-indigo-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="All">All Genders</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Neutral">Neutral</option>
                          </select>
                        </div>

                        {/* List items */}
                        <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
                          {filteredVoices.map((voice, voiceIdx) => (
                            <div
                              key={voice.id}
                              onClick={() => {
                                handleUpdateSpeaker(activeSpeaker.id, { voice: voice.id });
                                setVoiceDropdownOpen(false);
                                setVoiceSearchQuery('');
                              }}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs ${
                                activeSpeaker.voice === voice.id
                                  ? 'bg-indigo-600 text-white'
                                  : voiceIdx === highlightedVoiceIndex
                                  ? 'bg-slate-800 text-slate-100'
                                  : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-100'
                              }`}
                            >
                              <div>
                                <span className="font-semibold font-mono">{voice.name}</span>
                                <span className={`ml-2 px-1 rounded text-[10px] uppercase font-bold ${
                                  voice.gender === 'Female' ? 'bg-pink-500/10 text-pink-400' :
                                  voice.gender === 'Male' ? 'bg-blue-500/10 text-blue-400' : 'bg-teal-500/10 text-teal-400'
                                }`}>
                                  {voice.gender}
                                </span>
                                <span className="ml-2 text-slate-500 text-[11px] font-sans">
                                  {voice.tone} ({voice.pitch})
                                </span>
                              </div>
                              {activeSpeaker.voice === voice.id && (
                                <Check className="w-3.5 h-3.5 text-white" />
                              )}
                            </div>
                          ))}
                          {filteredVoices.length === 0 && (
                            <div className="text-xs text-slate-600 italic py-2 text-center">
                              No voice profiles match criteria
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acting guidelines & performance directives */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Acting guidelines & style guidelines
                    </label>
                    <textarea
                      value={activeSpeaker.style || ''}
                      onChange={(e) => handleUpdateSpeaker(activeSpeaker.id, { style: e.target.value })}
                      rows={3}
                      placeholder="e.g. Infectious enthusiasm, whispering, dramatic pauses, or Croydon English accent."
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 outline-none text-sm transition-all"
                    />
                  </div>

                  {/* Character preview trigger */}
                  <div className="flex items-center justify-between bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="w-4 h-4 text-indigo-400" />
                      <div className="text-left">
                        <span className="text-xs font-semibold text-slate-200 block">Preview Voice Tuning</span>
                        <span className="text-[10px] text-slate-500">Synthesizes a short greeting using character specs</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (previewingSpeakerId === activeSpeaker.id) {
                          onStopAudio();
                        } else {
                          onPreviewVoice(activeSpeaker);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-white transition-all text-xs font-bold text-slate-300 border border-slate-700/80"
                    >
                      {previewingSpeakerId === activeSpeaker.id ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current text-red-400 animate-pulse" />
                          Stop Preview
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          Preview Acoustic Profile
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="md:col-span-2 flex items-center justify-center text-xs text-slate-500 italic">
                  Select or add a character speaker to configure
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCENES */}
          {activeTab === 'scenes' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[50vh]">
              {/* Scene Roster list Column */}
              <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 flex flex-col h-full max-h-[55vh]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acoustic Scenes</span>
                  <button
                    onClick={handleAddScene}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Scene
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {tempScenes.map((scene) => (
                    <div
                      key={scene.id}
                      onClick={() => setSelectedSceneId(scene.id)}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                        selectedSceneId === scene.id
                          ? 'bg-slate-800 border-indigo-500/50 text-slate-100 shadow-md'
                          : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {scene.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-semibold block truncate max-w-[120px]">
                            {scene.name}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(scene.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-all"
                        title="Delete Scene"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {tempScenes.length === 0 && (
                    <div className="text-xs text-slate-600 italic py-6 text-center">
                      No scenes defined yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Scene configuration detail */}
              {activeScene ? (
                <div className="md:col-span-2 border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-5 overflow-y-auto max-h-[55vh]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Scene Title / Context Name
                    </label>
                    <input
                      type="text"
                      value={activeScene.name}
                      onChange={(e) => handleUpdateScene(activeScene.id, { name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Environmental & Acoustic Instructions
                    </label>
                    <textarea
                      value={activeScene.description}
                      onChange={(e) => handleUpdateScene(activeScene.id, { description: e.target.value })}
                      rows={6}
                      placeholder="Provide highly descriptive context guiding the atmosphere and pacing (e.g. Blinding bright morning show studio overlooking London's skyline. Fast energetic morning vibe...)"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 outline-none text-sm font-mono text-xs transition-all leading-relaxed"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 space-y-2">
                    <div className="flex items-center gap-2 text-amber-500">
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">How to use Scenes</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Scenes establish ambient acting backdrops which ground speech synthesis in an organic context. When a contiguous range of snippets are generated with the same scene instructions, Gemini models maintain uniform voice continuity, pacing, and tone.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="md:col-span-2 flex items-center justify-center text-xs text-slate-500 italic">
                  Select or create an acoustic scene to start editing
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROMPT EDITOR */}
          {activeTab === 'prompt' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[50vh] max-h-[55vh]">
              {/* Left Column: Markdown Editor */}
              <div className="flex flex-col h-full space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Template Source Markup</span>
                  {showResetConfirm ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                      <span className="text-[10px] text-amber-400 font-medium">Are you sure?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempPromptTemplate(DEFAULT_PROMPT_TEMPLATE);
                          setShowResetConfirm(false);
                        }}
                        className="px-1.5 py-0.5 text-[9px] bg-red-950/40 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded font-bold transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded font-bold transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowResetConfirm(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Default
                    </button>
                  )}
                </div>

                {/* Variables Chip list */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/40 rounded-lg border border-slate-800 text-[10px] font-mono leading-normal text-slate-400">
                  <span className="text-slate-500 font-bold select-none pr-1">Variables:</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-400">{`{project_title}`}</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-400">{`{chapter_title}`}</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-400">{`{speaker_name}`}</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-400">{`{speaker_role}`}</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-400">{`{speaker_voice}`}</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-400">{`{speaker_instructions}`}</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-400">{`{scene_name}`}</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-400">{`{scene_context}`}</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-400">{`{snippet_text}`}</span>
                </div>

                {/* Real-time Template Validation Feedback */}
                {templateErrors.length > 0 && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Template Validation Errors
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {templateErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                <textarea
                  value={tempPromptTemplate}
                  onChange={(e) => setTempPromptTemplate(e.target.value)}
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  placeholder="Enter markdown templates..."
                />
              </div>

              {/* Right Column: Pre-Rendered Assembly Preview */}
              <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/40 flex flex-col h-full">
                <div className="border-b border-slate-800 pb-2 mb-3">
                   <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Assembled Markdown Output Preview</span>
                   <p className="text-[10px] text-slate-500">Live preview compiled using active Character & environmental variables</p>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                   {renderMarkdownPreview(getCompiledPreview(tempPromptTemplate))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GOOGLE SHEETS LOGGING */}
          {activeTab === 'logging' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  Google Sheets Generation Telemetry
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Automatically log generation parameters, token usage, durations, model statistics, and timestamps to a dedicated annual Google Spreadsheet with monthly tabs (<code className="text-indigo-300 font-mono text-[11px]">{formatSpreadsheetTitle()}</code> &rarr; <code className="text-indigo-300 font-mono text-[11px]">{formatMonthSheetName()}</code>).
                </p>
              </div>

              {/* Status & Error Alerts */}
              {googleAuthError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Authentication or API Notice</strong>
                    <span>{googleAuthError}</span>
                  </div>
                </div>
              )}

              {googleSuccessMessage && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{googleSuccessMessage}</span>
                </div>
              )}

              {/* Section 1: Account Connection */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Google Workspace Authorization</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Authorizes the client to create and append rows to your Google Sheets directly.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasGoogleAuth ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                          <Check className="w-3 h-3" /> Connected
                        </span>
                        <button
                          type="button"
                          onClick={handleDisconnectGoogle}
                          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectGoogle}
                        disabled={isAuthenticatingGoogle}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-all disabled:opacity-50"
                      >
                        {isAuthenticatingGoogle ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>Connect Google Account</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Logging Toggle */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label htmlFor="sheets-logging-toggle" className="text-xs font-bold uppercase tracking-wider text-slate-200 cursor-pointer">
                      Automatic Generation Logging
                    </label>
                    <p className="text-[11px] text-slate-500">Record a new row for every single-speaker or multi-speaker TTS generation.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="sheets-logging-toggle"
                      type="checkbox"
                      checked={!!tempPreferences.sheetsLoggingEnabled}
                      onChange={(e) => setTempPreferences(prev => ({ ...prev, sheetsLoggingEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Spreadsheet Destination Settings */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Target Spreadsheet ID or URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempPreferences.sheetsSpreadsheetId || ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        // Extract spreadsheetId if user pasted a full URL
                        const match = val.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                        const id = match ? match[1] : val;
                        setTempPreferences(prev => ({
                          ...prev,
                          sheetsSpreadsheetId: id,
                          sheetsSpreadsheetUrl: id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : undefined
                        }));
                      }}
                      placeholder="1BxiMVs0XR..."
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 outline-none text-xs font-mono transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewSpreadsheet}
                      disabled={isCreatingSpreadsheet}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isCreatingSpreadsheet ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Create New Log Spreadsheet
                        </>
                      )}
                    </button>
                  </div>

                  {tempPreferences.sheetsSpreadsheetId && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span>Destination:</span>
                      <a
                        href={tempPreferences.sheetsSpreadsheetUrl || `https://docs.google.com/spreadsheets/d/${tempPreferences.sheetsSpreadsheetId}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline font-mono"
                      >
                        Open Spreadsheet <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Information / Schema Breakdown */}
              <div className="bg-slate-950/20 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Logged Telemetry Data Fields
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Logged fields include: <code className="text-slate-400">Timestamp</code>, <code className="text-slate-400">Status</code>, <code className="text-slate-400">Response Time (ms)</code>, <code className="text-slate-400">Project / Chapter</code>, <code className="text-slate-400">Speaker(s) & Voice(s)</code>, <code className="text-slate-400">Model & Temperature</code>, <code className="text-slate-400">Snippet Indices</code>, <code className="text-slate-400">Text Chars & Words</code>, <code className="text-slate-400">Prompt Chars & Words</code>, <code className="text-slate-400">Request & Response Tokens</code>, <code className="text-slate-400">Audio Duration & Size (Bytes)</code>.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-800 bg-slate-950/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            {templateErrors.length > 0 ? (
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Please fix the prompt template errors before applying.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Changes made here persist within local project state on Apply.</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 border border-slate-700/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={templateErrors.length > 0}
              className={`px-5 py-2 rounded-lg text-xs font-black shadow-lg transition-all ${
                templateErrors.length === 0
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60"
              }`}
            >
              Save & Apply
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
