import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  Gauge, 
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Snippet, Chapter, Speaker } from '../types';
import { getAudio } from '../services/dbService';
import { getCurrentAudio, getWaveformAmplitudes } from '../services/audioService';
import { formatDuration } from '../services/utils';

interface WaveformPlayerProps {
  activePlayingId: string | null;
  project: Project;
  onStop: () => void;
  isSidebarOpen: boolean;
  sidebarWidth: number;
  onPlaySnippet?: (id: string) => void;
}

export default function WaveformPlayer({ activePlayingId, project, onStop, isSidebarOpen, sidebarWidth, onPlaySnippet }: WaveformPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [isPlayerCollapsed, setIsPlayerCollapsed] = useState(true);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  // Auto-expand when active audio playback starts
  useEffect(() => {
    if (activePlayingId) {
      setIsPlayerCollapsed(false);
    }
  }, [activePlayingId]);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to find the first active generation ID in the project
  const findFirstActiveGenerationId = useCallback(() => {
    for (const chapter of project.chapters) {
      for (const snippet of chapter.snippets) {
        if (snippet.activeGenerationId) {
          return snippet.activeGenerationId;
        }
      }
    }
    return null;
  }, [project.chapters]);

  const [lastActiveId, setLastActiveId] = useState<string | null>(() => findFirstActiveGenerationId());

  useEffect(() => {
    if (activePlayingId) {
      setLastActiveId(activePlayingId);
    } else if (!lastActiveId) {
      const firstId = findFirstActiveGenerationId();
      if (firstId) {
        setLastActiveId(firstId);
      }
    }
  }, [activePlayingId, findFirstActiveGenerationId, lastActiveId]);

  const effectivePlayingId = activePlayingId || lastActiveId;

  // Find playing context details (Snippet, Chapter, Speaker)
  let playingSnippet: Snippet | null = null;
  let playingChapter: Chapter | null = null;
  let playingSpeaker: Speaker | null = null;

  if (effectivePlayingId) {
    for (const chapter of project.chapters) {
      for (const snippet of chapter.snippets) {
        // Match either the active generation ID or the snippet ID
        if (snippet.activeGenerationId === effectivePlayingId || snippet.id === effectivePlayingId || snippet.generations.some(g => g.id === effectivePlayingId)) {
          playingSnippet = snippet;
          playingChapter = chapter;
          const speakerId = snippet.speakerId || chapter.defaultSpeakerId;
          playingSpeaker = project.speakers.find(s => s.id === speakerId) || null;
          break;
        }
      }
      if (playingSnippet) break;
    }
  }

  // Determine active generation text and duration
  const activeGen = playingSnippet?.generations.find(g => g.id === effectivePlayingId) || 
                    (playingSnippet?.activeGenerationId ? playingSnippet.generations.find(g => g.id === playingSnippet.activeGenerationId) : null);

  const activeText = activeGen?.text || playingSnippet?.text || '';

  // Fetch real audio PCM binary and calculate true waveform amplitudes
  useEffect(() => {
    if (!effectivePlayingId) {
      setAmplitudes([]);
      return;
    }

    async function loadWaveform() {
      setIsLoadingAudio(true);
      try {
        const audioData = await getAudio(effectivePlayingId!);
        if (audioData?.base64Data) {
          const peaks = getWaveformAmplitudes(audioData.base64Data, 100);
          setAmplitudes(peaks);
        } else {
          // If no active generation found directly, check by snippet ID
          if (playingSnippet?.activeGenerationId) {
            const activeAudio = await getAudio(playingSnippet.activeGenerationId);
            if (activeAudio?.base64Data) {
              const peaks = getWaveformAmplitudes(activeAudio.base64Data, 100);
              setAmplitudes(peaks);
            }
          }
        }
      } catch (err) {
        console.error("Failed to generate waveform visual data", err);
        // Fallback: Generate generic smooth landscape wave
        const fallbackPeaks = Array.from({ length: 100 }, (_, i) => {
          return 0.15 + 0.35 * Math.sin(i * 0.1) + 0.1 * Math.sin(i * 0.5) + Math.random() * 0.1;
        });
        setAmplitudes(fallbackPeaks);
      } finally {
        setIsLoadingAudio(false);
      }
    }

    loadWaveform();
  }, [effectivePlayingId, playingSnippet]);

  // Handle active audio object synchronization and playback events
  useEffect(() => {
    let intervalId: any;

    const syncAudioElement = () => {
      const activeAudio = getCurrentAudio();
      audioRef.current = activeAudio;

      if (activeAudio) {
        setIsPlaying(!activeAudio.paused);
        setCurrentTime(activeAudio.currentTime);
        setDuration(activeAudio.duration || 0);
        setVolume(activeAudio.volume);
        setIsMuted(activeAudio.muted);
        setPlaybackSpeed(activeAudio.playbackRate);

        // Bind update handlers
        const handleTimeUpdate = () => {
          setCurrentTime(activeAudio.currentTime);
          setDuration(activeAudio.duration || 0);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        activeAudio.addEventListener('timeupdate', handleTimeUpdate);
        activeAudio.addEventListener('play', handlePlay);
        activeAudio.addEventListener('pause', handlePause);
        activeAudio.addEventListener('ended', handleEnded);

        return () => {
          activeAudio.removeEventListener('timeupdate', handleTimeUpdate);
          activeAudio.removeEventListener('play', handlePlay);
          activeAudio.removeEventListener('pause', handlePause);
          activeAudio.removeEventListener('ended', handleEnded);
        };
      }
    };

    // Poll a few times since audio loading is asynchronous
    syncAudioElement();
    intervalId = setInterval(syncAudioElement, 250);

    return () => {
      clearInterval(intervalId);
    };
  }, [activePlayingId]);

  // Action methods
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(err => console.error("Play aborted", err));
        setIsPlaying(true);
      }
    } else if (effectivePlayingId && onPlaySnippet) {
      onPlaySnippet(effectivePlayingId);
    }
  };

  const skipTime = (amount: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + amount));
    setCurrentTime(audio.currentTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (audio) {
      audio.volume = value;
      audio.muted = value === 0;
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.muted = nextMuted;
  };

  const changeSpeed = (speed: number) => {
    const audio = audioRef.current;
    setPlaybackSpeed(speed);
    setIsSpeedOpen(false);
    if (audio) {
      audio.playbackRate = speed;
    }
  };

  // Seek audio upon dragging or clicking waveform bars
  const handleSeek = (index: number) => {
    const audio = audioRef.current;
    if (!audio || amplitudes.length === 0) return;
    
    const calculatedDuration = audio.duration || duration || 0;
    if (calculatedDuration === 0) return;

    const ratio = index / amplitudes.length;
    audio.currentTime = ratio * calculatedDuration;
    setCurrentTime(audio.currentTime);
  };

  const handleWaveformClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const calculatedDuration = audio.duration || duration || 0;
    
    audio.currentTime = ratio * calculatedDuration;
    setCurrentTime(audio.currentTime);
  };

  const handleWaveformMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const audio = audioRef.current;
    if (!audio || amplitudes.length === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const calculatedDuration = audio.duration || duration || 0;
    setHoveredTime(ratio * calculatedDuration);
  };

  const handleWaveformMouseLeave = () => {
    setHoveredTime(null);
  };

  const hasSelectedSnippet = !!(effectivePlayingId && playingSnippet);

  const playbackPercent = duration > 0 ? (currentTime / duration) : 0;
  const hoveredPercent = hoveredTime !== null && duration > 0 ? (hoveredTime / duration) : 0;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 150, opacity: 0 }}
        animate={{ 
          y: isPlayerCollapsed ? "100%" : 0, 
          opacity: 1 
        }}
        exit={{ y: 150, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        className={`fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 shadow-2xl z-50 px-4 py-3 sm:px-6 flex flex-col gap-3 select-none ${isPlayerCollapsed ? 'pointer-events-none' : 'pointer-events-auto'}`}
      >
        {/* Floating Toggle Tab */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsPlayerCollapsed(!isPlayerCollapsed);
          }}
          style={{
            right: isSidebarOpen ? `${sidebarWidth - 48}px` : '16px',
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="absolute top-0 -translate-y-full bg-slate-900/98 backdrop-blur-md border-t border-l border-r border-slate-800 rounded-t-lg px-4 py-2 flex items-center gap-2 cursor-pointer shadow-lg hover:text-indigo-400 text-slate-300 transition-colors duration-200 pointer-events-auto"
          title={isPlayerCollapsed ? "Expand" : "Collapse"}
        >
          {isPlayerCollapsed ? (
            <ChevronUp className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="text-[10px] font-bold tracking-wider uppercase font-sans">Audio Player</span>
        </div>

        {/* Collapse and Title Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`p-1.5 rounded border shrink-0 ${hasSelectedSnippet ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
              <Sparkles className={`w-4 h-4 ${hasSelectedSnippet ? 'animate-pulse' : ''}`} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {hasSelectedSnippet ? (playingChapter?.title || 'Active Segment') : 'No Active Segment'}
                </span>
                {hasSelectedSnippet && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span className="text-xs font-medium text-indigo-300">
                      Speaker: {playingSpeaker?.name || 'Narrator'} ({playingSpeaker?.voice || 'Default'})
                    </span>
                  </>
                )}
              </div>
              <p className={`text-sm font-medium truncate mt-0.5 max-w-2xl ${hasSelectedSnippet ? 'text-slate-100 italic' : 'text-slate-500'}`}>
                {hasSelectedSnippet ? `"${activeText}"` : 'Select a snippet with generated audio and click play to listen.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Collapse toggle */}
            <button 
              onClick={() => setIsPlayerCollapsed(!isPlayerCollapsed)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition-colors"
              title={isPlayerCollapsed ? "Expand player" : "Minimize player"}
            >
              {isPlayerCollapsed ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <button 
              onClick={onStop}
              disabled={!hasSelectedSnippet}
              className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Stop playback"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* Playback Controls and Waveform */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Playback Controls (3 cols) */}
          <div className="md:col-span-3 flex items-center justify-center md:justify-start gap-4">
            <button 
              onClick={() => skipTime(-5)}
              disabled={!hasSelectedSnippet}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Rewind 5s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button 
              onClick={togglePlayPause}
              disabled={!hasSelectedSnippet}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center transform active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none disabled:pointer-events-none"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button 
              onClick={() => skipTime(5)}
              disabled={!hasSelectedSnippet}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Fast Forward 5s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="text-xs font-mono text-slate-400 ml-2">
              <span>{formatDuration(currentTime)}</span>
              <span className="mx-1 text-slate-600">/</span>
              <span>{formatDuration(hasSelectedSnippet ? (duration || activeGen?.duration || 0) : 0)}</span>
            </div>
          </div>

          {/* Interactive Visual Waveform (6 cols) */}
          <div className="md:col-span-6 flex flex-col gap-1 w-full position-relative">
            <div className="relative h-12 w-full bg-slate-950/40 rounded-lg border border-slate-800/40 px-2 flex items-center">
              {!hasSelectedSnippet ? (
                <div className="w-full flex items-center justify-center text-xs text-slate-600 italic">
                  No active audio loaded
                </div>
              ) : isLoadingAudio ? (
                <div className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 italic">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  Analyzing waveform...
                </div>
              ) : amplitudes.length > 0 ? (
                <svg 
                  className="w-full h-10 overflow-visible cursor-pointer"
                  onMouseMove={handleWaveformMouseMove}
                  onMouseLeave={handleWaveformMouseLeave}
                  onClick={handleWaveformClick}
                >
                  <g className="waveform-bars">
                    {amplitudes.map((amp, index) => {
                      const ratio = index / amplitudes.length;
                      const isPlayed = ratio <= playbackPercent;
                      const isHoveredPast = hoveredTime !== null && ratio <= hoveredPercent;
                      
                      let fill = "rgba(100, 116, 139, 0.25)"; // slate-500/25 default
                      if (isPlayed) {
                        fill = "rgba(99, 102, 241, 0.85)"; // indigo-500 playing
                      } else if (isHoveredPast) {
                        fill = "rgba(56, 189, 248, 0.5)"; // sky-400 hover
                      }

                      // Bar dimensions using raw percentage math - completely safe for SVG attributes!
                      const barWidthPercent = (100 / amplitudes.length) * 0.75;
                      const xPercent = (index / amplitudes.length) * 100;
                      const barHeight = Math.max(3, amp * 36);
                      const y = (36 - barHeight) / 2;

                      return (
                        <rect
                          key={index}
                          x={`${xPercent}%`}
                          y={y + 2}
                          width={`${barWidthPercent}%`}
                          height={barHeight}
                          rx={1}
                          fill={fill}
                          className="transition-colors duration-150 hover:fill-sky-400"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent double seek from SVG click
                            handleSeek(index);
                          }}
                        />
                      );
                    })}
                  </g>

                  {/* Current Playback Position Indicator Line */}
                  {duration > 0 && (
                    <g className="pointer-events-none">
                      {/* Glow overlay */}
                      <line
                        x1={`${playbackPercent * 100}%`}
                        y1="0"
                        x2={`${playbackPercent * 100}%`}
                        y2="40"
                        stroke="#00FFFF"
                        strokeWidth="5"
                        strokeOpacity="0.15"
                      />
                      <line
                        x1={`${playbackPercent * 100}%`}
                        y1="0"
                        x2={`${playbackPercent * 100}%`}
                        y2="40"
                        stroke="#00FFFF"
                        strokeWidth="3"
                        strokeOpacity="0.25"
                      />
                      {/* 1px Center Line with 40% opacity */}
                      <line
                        x1={`${playbackPercent * 100}%`}
                        y1="0"
                        x2={`${playbackPercent * 100}%`}
                        y2="40"
                        stroke="#00FFFF"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                      />
                    </g>
                  )}

                  {/* Hover Position Indicator Line (50% of current line's alpha) */}
                  {hoveredTime !== null && duration > 0 && (
                    <g className="pointer-events-none">
                      {/* Hover Glow */}
                      <line
                        x1={`${hoveredPercent * 100}%`}
                        y1="0"
                        x2={`${hoveredPercent * 100}%`}
                        y2="40"
                        stroke="#00FFFF"
                        strokeWidth="3"
                        strokeOpacity="0.08"
                      />
                      {/* Hover Center Line (50% of 40% = 20% opacity) */}
                      <line
                        x1={`${hoveredPercent * 100}%`}
                        y1="0"
                        x2={`${hoveredPercent * 100}%`}
                        y2="40"
                        stroke="#00FFFF"
                        strokeWidth="1"
                        strokeOpacity="0.2"
                      />
                    </g>
                  )}
                </svg>
              ) : (
                <div className="w-full h-1 bg-slate-800 rounded">
                  <div 
                    className="h-full bg-indigo-500 rounded" 
                    style={{ width: `${playbackPercent * 100}%` }}
                  />
                </div>
              )}

              {/* Hover time tooltip */}
              {hoveredTime !== null && duration > 0 && (
                <div 
                  className="absolute -top-7 transform -translate-x-1/2 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-400 shadow-md pointer-events-none z-10"
                  style={{ left: `calc(${hoveredPercent * 100}% + 8px)` }}
                >
                  {formatDuration(hoveredTime)}
                </div>
              )}
            </div>
          </div>

          {/* Volume & Playback Rate Controls (3 cols) */}
          <div className="md:col-span-3 flex items-center justify-center md:justify-end gap-4">
            
            {/* Playback speed selector */}
            <div className="relative">
              <button 
                onClick={() => setIsSpeedOpen(!isSpeedOpen)}
                disabled={!hasSelectedSnippet}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                title="Playback Speed"
              >
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span>{playbackSpeed}x</span>
              </button>
              
              {isSpeedOpen && (
                <div className="absolute bottom-10 right-0 bg-slate-950 border border-slate-800 rounded-lg shadow-xl py-1 w-24 z-50 text-xs">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 transition-colors ${playbackSpeed === speed ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(isMuted ? 0 : volume) * 100}%, #1e293b ${(isMuted ? 0 : volume) * 100}%, #1e293b 100%)`
                }}
              />
            </div>

          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
