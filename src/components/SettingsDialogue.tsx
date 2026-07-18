import React, { useState, useMemo } from 'react';
import { 
  X, Settings, Users, Clapperboard, FileText, Plus, Trash2, 
  Volume2, Square, Search, Sparkles, Check, ChevronDown, HelpCircle, 
  AlertTriangle, RotateCcw
} from 'lucide-react';
import { Project, Speaker, Scene, VoiceProfile, GEMINI_VOICES, GEMINI_MODELS } from '../types';
import { PROJECT_SETTINGS_SCHEMAS } from '../utils/settingsSchemas';
import { DynamicSettingsForm } from './DynamicSettingsForm';
import { generateId } from '../services/idService';

interface SettingsDialogueProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  previewingSpeakerId: string | null;
  onPreviewVoice: (speaker: Speaker) => void;
  onStopAudio: () => void;
}

export const SettingsDialogue: React.FC<SettingsDialogueProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  previewingSpeakerId,
  onPreviewVoice,
  onStopAudio,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'speakers' | 'scenes' | 'prompt'>('project');
  
  // Temporary state for edits (committed on Save/OK, discarded on Cancel)
  const [tempSettings, setTempSettings] = useState(() => ({ ...project.settings }));
  const [tempSpeakers, setTempSpeakers] = useState<Speaker[]>(() => [...project.speakers]);
  const [tempScenes, setTempScenes] = useState<Scene[]>(() => [...(project.scenes || [])]);
  const [tempPromptTemplate, setTempPromptTemplate] = useState<string>(() => {
    // If not set, let's use a nice default template
    return (project.settings as any).promptTemplate || `## CHARACTER IDENTITY: {speaker_name}
### VOICE SPECIFICATIONS
- Voice Profile: {speaker_voice}
- Acting Persona / Style Guidelines: {speaker_style}

## SCENE DESCRIPTION
{scene_description}

## TRANSCRIBED TRANSCRIPT (ACTING GUIDANCE)
{snippet_text}`;
  });

  // Track currently selected speaker to edit in Speakers tab
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(() => {
    return tempSpeakers[0]?.id || null;
  });

  // Voice Search / Filter State in Speakers Tab
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male' | 'Neutral'>('All');
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);

  // Track currently selected scene to edit in Scenes tab
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(() => {
    return tempScenes[0]?.id || null;
  });

  if (!isOpen) return null;

  // Active elements
  const activeSpeaker = tempSpeakers.find(s => s.id === selectedSpeakerId) || tempSpeakers[0];
  const activeScene = tempScenes.find(s => s.id === selectedSceneId) || tempScenes[0];

  // Save edits back to project
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

  // Basic markdown to JSX previewer helper
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-slate-300 font-sans text-sm selection:bg-indigo-500/30">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('## ')) {
            return <h3 key={idx} className="text-base font-bold text-indigo-400 mt-4 pb-1 border-b border-slate-800">{trimmed.substring(3)}</h3>;
          }
          if (trimmed.startsWith('### ')) {
            return <h4 key={idx} className="text-sm font-semibold text-teal-400 mt-3">{trimmed.substring(4)}</h4>;
          }
          if (trimmed.startsWith('# ')) {
            return <h2 key={idx} className="text-lg font-black text-slate-100 mt-5 pb-2 border-b border-slate-700">{trimmed.substring(2)}</h2>;
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

                    {/* Narrator Checkbox */}
                    <div className="flex items-center pt-6 pl-2">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!activeSpeaker.isNarrator}
                          onChange={(e) => {
                            // Turn off narrator on all other speakers first if checking this
                            if (e.target.checked) {
                              setTempSpeakers(prev => prev.map(s => s.id === activeSpeaker.id ? { ...s, isNarrator: true } : { ...s, isNarrator: false }));
                            } else {
                              handleUpdateSpeaker(activeSpeaker.id, { isNarrator: false });
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2"
                        />
                        <span className="text-xs font-semibold text-slate-300">Set as Default Narrator</span>
                      </label>
                    </div>
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
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl shadow-black/80 z-50 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* Search Query Inputs */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
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
                          {filteredVoices.map((voice) => (
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
                                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-100'
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
                  <button 
                    onClick={() => {
                      if (confirm("Reset prompt template to factory default layout?")) {
                        setTempPromptTemplate(`## CHARACTER IDENTITY: {speaker_name}
### VOICE SPECIFICATIONS
- Voice Profile: {speaker_voice}
- Acting Persona / Style Guidelines: {speaker_style}

## SCENE DESCRIPTION
{scene_description}

## TRANSCRIBED TRANSCRIPT (ACTING GUIDANCE)
{snippet_text}`);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Default
                  </button>
                </div>
                <textarea
                  value={tempPromptTemplate}
                  onChange={(e) => setTempPromptTemplate(e.target.value)}
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  placeholder="Enter markdown templates..."
                />
                <div className="text-[10px] text-slate-500 flex gap-4 font-semibold font-mono pl-1">
                  <span>Variables:</span>
                  <span>{`{speaker_name}`}</span>
                  <span>{`{speaker_voice}`}</span>
                  <span>{`{speaker_style}`}</span>
                  <span>{`{scene_description}`}</span>
                  <span>{`{snippet_text}`}</span>
                </div>
              </div>

              {/* Right Column: Pre-Rendered Assembly Preview */}
              <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/40 flex flex-col h-full">
                <div className="border-b border-slate-800 pb-2 mb-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Assembled Markdown Output Preview</span>
                  <p className="text-[10px] text-slate-500">Live preview compiled using active Character & environmental variables</p>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  {renderMarkdownPreview(
                    tempPromptTemplate
                      .replace('{speaker_name}', activeSpeaker?.name || 'Amelia Z.')
                      .replace('{speaker_voice}', activeSpeaker?.voice || 'Zephyr')
                      .replace('{speaker_style}', activeSpeaker?.style || 'Croydon Estuary accent, upbeat energy')
                      .replace('{scene_description}', activeScene?.description || 'London Overlooking skyline Studio. Neon tally lights.')
                      .replace('{snippet_text}', '"Yes, massive vibes in the studio! Let\'s go!"')
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-800 bg-slate-950/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Changes made here persist within local project state on Apply.</span>
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
              className="px-5 py-2 rounded-lg text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Save & Apply
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
