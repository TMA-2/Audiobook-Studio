/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, Volume2, RefreshCw } from 'lucide-react';
import { speakClientText } from '../utils/speech';

interface WaveformPlayerProps {
  base64Pcm: string;
  id: string;
  onPlayStateChange?: (playing: boolean) => void;
  isFallback?: boolean;
  text?: string;
  speaker?: string;
  pacing?: 'slow' | 'normal' | 'fast';
  pitch?: 'low' | 'normal' | 'high';
  emotion?: string;
}

// Convert base64 PCM 24000Hz or standard audio container (WAV/MP3) to standard audio Blob
export function createWavBlobFromPcm(base64: string, sampleRate = 24000): { blob: Blob; url: string; duration: number } {
  try {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Auto-detect if this is already a complete, formatted audio file container (e.g. standard RIFF WAV or ID3 MP3)
    const isWav = bytes.length > 12 && 
                  bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70; // 'RIFF' signature
                  
    const isMp3 = bytes.length > 3 && 
                  ((bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) || // 'ID3' signature
                   (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0));       // MP3 frame sync bytes
                   
    if (isWav || isMp3) {
      const mimeType = isWav ? 'audio/wav' : 'audio/mpeg';
      // Compute accurate duration based on stream byte length
      let duration = 0;
      if (isWav) {
        // Mono 16-bit 24kHz WAV has a standard byte rate of 48000 bytes/sec
        duration = Math.max(0.1, (bytes.length - 44) / 48000);
      } else {
        // Default estimate for low bit-rate speech MP3 (around 64kbps / 8000 bytes/sec)
        duration = Math.max(0.1, bytes.length / 8000);
      }
      
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      return { blob, url, duration };
    }
    
    // Fallback: If it is indeed raw 16-bit PCM, execute manual WAV container construction
    const numSamples = Math.floor(bytes.length / 2);
    // Align ArrayBuffer offset properly to 16-bit boundaries
    const int16Samples = new Int16Array(bytes.buffer, 0, numSamples);
    const duration = int16Samples.length / sampleRate;

    // Create 44-byte WAV header
    const buffer = new ArrayBuffer(44 + int16Samples.length * 2);
    const view = new DataView(buffer);
    
    const writeStr = (view: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeStr(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Samples.length * 2, true);
    writeStr(view, 8, 'WAVE');
    writeStr(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // Linear PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate (24000 * 2)
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeStr(view, 36, 'data');
    view.setUint32(40, int16Samples.length * 2, true);

    // Copy Int16 samples
    let offset = 44;
    for (let i = 0; i < int16Samples.length; i++, offset += 2) {
      view.setInt16(offset, int16Samples[i], true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    return { blob, url, duration };
  } catch (error) {
    console.error("Failed to compile WAV container:", error);
    return { blob: new Blob([]), url: '', duration: 0 };
  }
}

export default function WaveformPlayer({ 
  base64Pcm, 
  id, 
  onPlayStateChange,
  isFallback = false,
  text = '',
  speaker = 'Zephyr',
  pacing = 'normal',
  pitch = 'normal',
  emotion = 'none'
}: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechControllerRef = useRef<any>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.85);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (base64Pcm) {
      const { url, duration: computedDuration } = createWavBlobFromPcm(base64Pcm);
      setAudioUrl(url);
      setDuration(computedDuration);

      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }
  }, [base64Pcm]);

  // Clean speaking on unmount
  useEffect(() => {
    return () => {
      if (speechControllerRef.current) {
        speechControllerRef.current.stop();
      }
    };
  }, []);

  // Sync isPlaying state back to parent if requested
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
    if (!isPlaying && speechControllerRef.current) {
      speechControllerRef.current.stop();
    }
  }, [isPlaying, onPlayStateChange]);

  // Audio lifecycle hooks
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Render static or dynamic waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Generate bar heights based on a deterministic hash of the ID
    const barsCount = 38;
    const barWidth = 3;
    const gap = 2;
    const startX = (width - (barsCount * (barWidth + gap))) / 2;

    const seedString = id + base64Pcm.substring(100, 200);
    let hash = 0;
    for (let j = 0; j < seedString.length; j++) {
      hash = seedString.charCodeAt(j) + ((hash << 5) - hash);
    }

    const drawWave = () => {
      ctx.clearRect(0, 0, width, height);
      const activeBarIndex = (currentTime / (duration || 1)) * barsCount;

      for (let i = 0; i < barsCount; i++) {
        const x = startX + i * (barWidth + gap);
        // Deterministic pseudo-random heights
        const amplitudeMod = Math.sin((i * 0.15) + (hash * 0.01)) * 0.4 + 0.6;
        const heightMultiplier = (hash % (i + 5)) / (i + 5);
        const barHeight = Math.max(4, (heightMultiplier * height * 0.7 + height * 0.15) * amplitudeMod);

        const isActive = i <= activeBarIndex;
        const isCurrentRange = isPlaying && Math.abs(i - activeBarIndex) < 1.2;

        if (isCurrentRange) {
          // Bouncing animate effect for playing spot
          const bounce = Math.sin(Date.now() * 0.015) * 3;
          ctx.fillStyle = '#f59e0b'; // amber-500 active bounce
          ctx.fillRect(x, (height - (barHeight + bounce)) / 2, barWidth, barHeight + bounce);
        } else if (isActive) {
          ctx.fillStyle = '#b45309'; // warm deep gold played
          ctx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
        } else {
          ctx.fillStyle = '#262626'; // dark neutral-800 unplayed
          ctx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
        }
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawWave);
      }
    };

    drawWave();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [id, base64Pcm, isPlaying, currentTime, duration]);

  const togglePlay = () => {
    if (isFallback && text) {
      if (isPlaying) {
        if (speechControllerRef.current) {
          speechControllerRef.current.stop();
        }
        setIsPlaying(false);
        setCurrentTime(0);
      } else {
        const controls = speakClientText(
          text,
          (speaker as any) || 'Zephyr',
          pacing || 'normal',
          pitch || 'normal',
          (charIndex) => {
            if (text && duration > 0) {
              const fraction = charIndex / text.length;
              setCurrentTime(fraction * duration);
            }
          },
          () => {
            setIsPlaying(false);
            setCurrentTime(0);
          },
          (err) => {
            console.error("Local client speech failed, falling back to local generated wave file.", err);
            // Audio tag fallback
            const audio = audioRef.current;
            if (audio) {
              audio.play().catch(e => console.error("PCM playback failed:", e));
              setIsPlaying(true);
            }
          }
        );
        speechControllerRef.current = controls;
        setIsPlaying(true);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => console.error("Playback failed:", err));
      setIsPlaying(true);
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const rates = [0.8, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const nextRate = rates[nextIndex];
    
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-[#0D0D0D] border border-white/10 p-3 rounded-2xl w-full" id={`wp-container-${id}`}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          style={{ display: 'none' }}
        />
      )}

      {/* Play/Pause round button */}
      <button
        onClick={togglePlay}
        className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 transform active:scale-95 cursor-pointer ${
          isPlaying ? 'bg-amber-600 text-black hover:bg-amber-500' : 'bg-[#1A1A1A] border border-white/10 hover:bg-[#222] text-neutral-300'
        } shadow-sm`}
        id={`wp-btn-toggle-${id}`}
        title={isPlaying ? "Pause" : "Play Narration"}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Details & Waveform area */}
      <div className="flex-1 w-full flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="relative h-11 w-full flex items-center bg-[#050505] border border-white/5 rounded-lg p-1">
          <canvas
            ref={canvasRef}
            width={320}
            height={44}
            onClick={handleScrub}
            className="w-full h-full cursor-pointer rounded"
            title="Click to jump timeline"
          />
        </div>
      </div>

      {/* Dynamic Voice modifier dials */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {/* Speed modifier trigger */}
        <button
          onClick={handleSpeedChange}
          className="flex items-center gap-1 text-[11px] font-mono font-medium text-neutral-400 hover:text-white bg-[#1A1A1A] border border-white/10 px-2 py-1 rounded cursor-pointer"
          id={`wp-speed-${id}`}
          title="Adjust speed"
        >
          <RefreshCw className="w-3 h-3 hover:rotate-45 transition-transform" />
          <span>{playbackRate.toFixed(2)}x</span>
        </button>

        {/* Volume slider control */}
        <div className="flex items-center gap-1.5 text-neutral-500">
          <Volume2 className="w-3.5 h-3.5" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            id={`wp-vol-${id}`}
            title="Volume"
          />
        </div>

        {/* Download WAV button */}
        <a
          href={audioUrl}
          download={`audiobook_narration_${id}.wav`}
          className="flex items-center justify-center w-8 h-8 rounded bg-[#1A1A1A] border border-white/10 hover:bg-neutral-800 text-neutral-400 hover:text-amber-500 transition-colors"
          title="Download WAV voice segment"
          id={`wp-download-${id}`}
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
