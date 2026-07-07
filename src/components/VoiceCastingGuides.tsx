/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Sparkles, HelpCircle, User, Check, Mic, Volume2 } from 'lucide-react';
import { SUPPORTED_VOICES, SUPPORTED_MODELS, Speaker, VoiceName } from '../types';
import { createWavBlobFromPcm } from './WaveformPlayer';

interface VoiceCastingGuidesProps {
  speakers: Speaker[];
  onUpdateSpeakers: (speakers: Speaker[]) => void;
  apiConfigured: boolean;
}

const PREVIEW_SENTENCES: Partial<Record<VoiceName, string>> = {
  Kore: "Good day! I am Kore. I provide clear, bright, and vibrant narration.",
  Puck: "Hey there! I am Puck. I love lively action, adventure books, and fast dialogue!",
  Charon: "Greetings. I am Charon. My deep resonance brings dramatic epics to life.",
  Fenrir: "Watch your step. I am Fenrir. Intense and gritty novels are my battlefield.",
  Zephyr: "Welcome, reader. I am Zephyr. Consistent, tranquil, and comforting reading."
};

export default function VoiceCastingGuides({ speakers, onUpdateSpeakers, apiConfigured }: VoiceCastingGuidesProps) {
  const [playingSpeakerId, setPlayingSpeakerId] = useState<string | null>(null);
  const [loadingSpeakerId, setLoadingSpeakerId] = useState<string | null>(null);
  
  const activeAudioContext = useRef<AudioContext | null>(null);
  const activeSourceNode = useRef<AudioBufferSourceNode | null>(null);

  const stopPreview = () => {
    try {
      if (activeSourceNode.current) {
        activeSourceNode.current.stop();
        activeSourceNode.current = null;
      }
      if (activeAudioContext.current) {
        activeAudioContext.current.close();
        activeAudioContext.current = null;
      }
    } catch (e) {
      // No active playback
    }
    setPlayingSpeakerId(null);
  };

  useEffect(() => {
    return () => stopPreview();
  }, []);

  const handlePlayPreview = async (speaker: Speaker, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (playingSpeakerId === speaker.id) {
      stopPreview();
      return;
    }

    if (!apiConfigured) {
      alert("Real voice preview requires GEMINI_API_KEY. Please configure your key in the Secrets panel.");
      return;
    }

    stopPreview();
    setLoadingSpeakerId(speaker.id);

    try {
      const voiceIntro = PREVIEW_SENTENCES[speaker.voice] || `Hello! I am ${speaker.voice}, a dynamic voice ready to perform your script.`;
      const textToSpeak = `${voiceIntro} As ${speaker.name}, my performance directives are set to ${speaker.pacing} speed and ${speaker.pitch} pitch.`;
      
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          speaker: speaker.voice,
          pacing: speaker.pacing,
          pitch: speaker.pitch,
          emotion: speaker.emotion,
          customInstructions: speaker.customInstructions,
          model: speaker.model
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Preview generation failed.");
      }

      const data = await res.json();
      if (data.audioData) {
        await playPcm(data.audioData, speaker.id);
      } else {
        throw new Error("No audio data returned");
      }
    } catch (err: any) {
      console.error("Failed to fetch voice preview:", err);
      alert(`Synthesis failed: ${err.message || err}`);
    } finally {
      setLoadingSpeakerId(null);
    }
  };

  const playPcm = async (base64: string, speakerId: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const { blob } = createWavBlobFromPcm(base64);
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setPlayingSpeakerId(null);
      };

      source.start();
      
      activeAudioContext.current = audioCtx;
      activeSourceNode.current = source;
      setPlayingSpeakerId(speakerId);
    } catch (err) {
      console.error("Audio playback failure:", err);
      alert("Audio playback failed. Please check your browser's audio permissions or volume levels.");
    }
  };

  const handleAddSpeaker = () => {
    const timestamp = Date.now();
    const voiceOptions: VoiceName[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
    // Cycle voice profiles based on existing length
    const defaultVoice = voiceOptions[speakers.length % voiceOptions.length];
    
    const newSpeaker: Speaker = {
      id: `spk-${timestamp}`,
      name: `Role ${speakers.length + 1}`,
      isNarrator: speakers.length === 0, // default first to narrator
      voice: defaultVoice,
      model: 'gemini-3.1-flash-tts-preview',
      pacing: 'normal',
      pitch: 'normal',
      emotion: 'none',
      customInstructions: 'Speak clearly and match the role description'
    };

    onUpdateSpeakers([...speakers, newSpeaker]);
  };

  const handleUpdateField = <K extends keyof Speaker>(id: string, field: K, value: Speaker[K]) => {
    const updated = speakers.map(s => {
      if (s.id === id) {
        const nextSpeaker = { ...s, [field]: value };
        // If isNarrator is checked, we can optionally make other speakers false if user prefers exclusive narrator,
        // but let's allow multiple or keep it simple. Let's make isNarrator exclusive for clean audiobook logic!
        if (field === 'isNarrator' && value === true) {
          return nextSpeaker;
        }
        return nextSpeaker;
      }
      // If we made someone a narrator and want exclusive narrators:
      if (field === 'isNarrator' && value === true) {
        return { ...s, isNarrator: false };
      }
      return s;
    });
    onUpdateSpeakers(updated);
  };

  const handleDeleteSpeaker = (id: string) => {
    if (speakers.length <= 1) {
      alert("Your storyboard requires at least one speaker role.");
      return;
    }
    const target = speakers.find(s => s.id === id);
    if (target?.isNarrator) {
      alert("Please designate another speaker as the primary 'Narrator' first before deleting this one.");
      return;
    }
    const filtered = speakers.filter(s => s.id !== id);
    onUpdateSpeakers(filtered);
  };

  return (
    <div className="flex flex-col gap-4" id="casting-deck-container">
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
        <div>
          <h4 className="text-sm font-sans font-bold text-white flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Studio Cast Desk</span>
          </h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure custom character voices, underlying models, and performance directives.
          </p>
        </div>
        <button
          onClick={handleAddSpeaker}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-black text-xs font-semibold py-1.5 px-3.5 rounded transition-all cursor-pointer shadow"
          id="btn-add-speaker"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Cast Role</span>
        </button>
      </div>

      {/* Grid of custom speakers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {speakers.map((speaker) => {
          const matchedProfile = SUPPORTED_VOICES.find(v => v.id === speaker.voice) || SUPPORTED_VOICES[0];
          const isSpkPlaying = playingSpeakerId === speaker.id;
          const isSpkLoading = loadingSpeakerId === speaker.id;

          return (
            <div
              key={speaker.id}
              className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all bg-[#080808] ${
                speaker.isNarrator
                  ? 'border-amber-500/30 ring-1 ring-amber-500/5'
                  : 'border-white/10 hover:border-white/15'
              }`}
              id={`speaker-card-${speaker.id}`}
            >
              {/* Speaker Metadata Edit Bar */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans font-semibold text-xs text-black ${matchedProfile.avatarColor}`}>
                      {speaker.name ? speaker.name[0]?.toUpperCase() : '?'}
                    </div>
                    <input
                      type="text"
                      value={speaker.name}
                      onChange={(e) => handleUpdateField(speaker.id, 'name', e.target.value)}
                      placeholder="Character/Role Name"
                      className="font-sans font-bold text-sm text-white bg-transparent hover:bg-white/5 focus:bg-neutral-900 border-b border-dashed border-transparent focus:border-amber-500/50 outline-none px-1.5 py-0.5 rounded flex-1"
                      id={`input-name-${speaker.id}`}
                    />
                  </div>

                  {/* Actions column: play audition & delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handlePlayPreview(speaker, e)}
                      disabled={isSpkLoading}
                      className={`p-1.5 rounded border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                        isSpkPlaying
                          ? 'bg-rose-950/40 text-rose-400 border-rose-900/30 animate-pulse'
                          : 'bg-white/5 border-white/10 hover:border-amber-500/40 hover:text-amber-500 text-neutral-400'
                      }`}
                      id={`btn-audition-${speaker.id}`}
                      title="Audition Custom Role Settings"
                    >
                      {isSpkLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-neutral-700 border-t-amber-500 rounded-full animate-spin" />
                      ) : isSpkPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteSpeaker(speaker.id)}
                      className="p-1.5 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                      id={`btn-delete-spk-${speaker.id}`}
                      title="Remove Role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Checkbox Designation: Narrator */}
                <div className="flex items-center gap-2 py-1 px-2.5 bg-white/5 border border-white/5 rounded-xl w-fit">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-sans text-neutral-300">
                    <input
                      type="checkbox"
                      checked={speaker.isNarrator}
                      onChange={(e) => handleUpdateField(speaker.id, 'isNarrator', e.target.checked)}
                      className="accent-amber-500 rounded text-amber-500 bg-black cursor-pointer"
                      id={`checkbox-narrator-${speaker.id}`}
                    />
                    <span>Designate as Main Audiobook Narrator</span>
                  </label>
                </div>

                {/* Config grid */}
                <div className="grid grid-cols-2 gap-2.5 mt-1 text-[11px]">
                  {/* Assigned prebuilt Voice */}
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 font-mono">Gemini Base Voice</span>
                    <select
                      value={speaker.voice}
                      onChange={(e) => handleUpdateField(speaker.id, 'voice', e.target.value as VoiceName)}
                      className="bg-black border border-white/10 text-neutral-300 rounded px-2 py-1 outline-none focus:border-amber-500/50 cursor-pointer"
                      id={`select-voice-${speaker.id}`}
                    >
                      {SUPPORTED_VOICES.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
                      ))}
                    </select>
                  </div>

                  {/* Selectable Gemini Model */}
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 font-mono">Synthesizer Model</span>
                    <select
                      value={speaker.model}
                      onChange={(e) => handleUpdateField(speaker.id, 'model', e.target.value)}
                      className="bg-black border border-white/10 text-neutral-300 rounded px-2 py-1 outline-none focus:border-amber-500/50 cursor-pointer"
                      id={`select-model-${speaker.id}`}
                    >
                      {SUPPORTED_MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Performance Directives: Pacing */}
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 font-mono">Pacing Speed</span>
                    <select
                      value={speaker.pacing}
                      onChange={(e) => handleUpdateField(speaker.id, 'pacing', e.target.value as any)}
                      className="bg-black border border-white/10 text-neutral-300 rounded px-2 py-1 outline-none focus:border-amber-500/50 cursor-pointer"
                      id={`select-pacing-${speaker.id}`}
                    >
                      <option value="slow">Slow</option>
                      <option value="normal">Normal</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>

                  {/* Performance Directives: Pitch */}
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 font-mono">Vocal Pitch</span>
                    <select
                      value={speaker.pitch}
                      onChange={(e) => handleUpdateField(speaker.id, 'pitch', e.target.value as any)}
                      className="bg-black border border-white/10 text-neutral-300 rounded px-2 py-1 outline-none focus:border-amber-500/50 cursor-pointer"
                      id={`select-pitch-${speaker.id}`}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Tone / Emotion shortcuts list */}
                <div className="flex flex-col gap-1 mt-1 text-[11px]">
                  <span className="text-neutral-500 font-mono">Performance Tone (Acoustic Cue)</span>
                  <select
                    value={speaker.emotion}
                    onChange={(e) => handleUpdateField(speaker.id, 'emotion', e.target.value)}
                    className="bg-black border border-white/10 text-neutral-300 rounded px-2 py-1 outline-none focus:border-amber-500/50 cursor-pointer text-xs"
                    id={`select-emotion-${speaker.id}`}
                  >
                    <option value="none">Neutral Performance</option>
                    <option value="whispering">Whispering 🤫</option>
                    <option value="sad">Sorrowful 😢</option>
                    <option value="excited">Excited ✨</option>
                    <option value="laughing">Chuckle 😄</option>
                    <option value="shouting">Shout 🗣️</option>
                    <option value="nominous">Ominous 💀</option>
                    <option value="gasping">Panic 😨</option>
                  </select>
                </div>

                {/* Performance Directives / Custom instructions */}
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[11px] text-neutral-500 font-mono">Performance Directives / Custom Cues</span>
                  <textarea
                    rows={2}
                    value={speaker.customInstructions}
                    onChange={(e) => handleUpdateField(speaker.id, 'customInstructions', e.target.value)}
                    placeholder="Enter style directions (e.g., 'mysterious with dramatic pauses', 'bright friendly guide')"
                    className="bg-black border border-white/10 hover:border-neutral-700 focus:border-amber-500/50 rounded p-2 text-xs text-neutral-200 font-sans outline-none leading-relaxed resize-none"
                    id={`textarea-directives-${speaker.id}`}
                  />
                </div>
              </div>

              {/* Card Footer status info */}
              <div className="flex justify-between items-center pt-3 mt-4.5 border-t border-white/5 text-[10px] text-neutral-500 font-mono">
                <span>Core Profile: {matchedProfile.gender} / {speaker.voice}</span>
                {speaker.isNarrator && (
                  <span className="bg-amber-600/10 text-amber-500 text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold border border-amber-500/20">
                    Primary Narrator
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
