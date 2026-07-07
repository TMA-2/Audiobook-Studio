/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, Award, VolumeX, DownloadCloud, AlertTriangle, FileAudio } from 'lucide-react';
import { Chapter, NarrationBlock, Speaker } from '../types';
import { createWavBlobFromPcm } from './WaveformPlayer';
import { speakClientText } from '../utils/speech';

interface ChapterTimelineProps {
  chapter: Chapter;
  speakers: Speaker[];
  onBlockSpeakHighlight?: (blockId: string | null) => void;
}

export default function ChapterTimeline({ chapter, speakers, onBlockSpeakHighlight }: ChapterTimelineProps) {
  const [isPlayingSeq, setIsPlayingSeq] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [masterUrl, setMasterUrl] = useState<string>('');
  const [masterSize, setMasterSize] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechControllerRef = useRef<any>(null);

  const synthesizedBlocks = chapter.blocks.filter(b => b.status === 'success' && b.audioData);
  const percentComplete = Math.round((synthesizedBlocks.length / Math.max(1, chapter.blocks.length)) * 100);

  // Revoke previous master URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (masterUrl) URL.revokeObjectURL(masterUrl);
    };
  }, [masterUrl]);

  // Clean speaking on unmount
  useEffect(() => {
    return () => {
      if (speechControllerRef.current) {
        speechControllerRef.current.stop();
      }
    };
  }, []);

  // Sequenced playback handlers
  const startSequentialPlayback = () => {
    if (synthesizedBlocks.length === 0) {
      alert("Please synthesize at least one block first before starting continuous playback.");
      return;
    }
    setIsPlayingSeq(true);
    setCurrentIndex(0);
    playBlockSeq(0);
  };

  const stopSequentialPlayback = () => {
    setIsPlayingSeq(false);
    setCurrentIndex(-1);
    onBlockSpeakHighlight?.(null);
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
    }
    if (speechControllerRef.current) {
      speechControllerRef.current.stop();
    }
  };

  const playBlockSeq = (idx: number) => {
    const successBlocks = chapter.blocks.filter(b => b.status === 'success' && b.audioData);
    if (idx >= successBlocks.length) {
      // Reached the end
      stopSequentialPlayback();
      return;
    }

    const block = successBlocks[idx];
    onBlockSpeakHighlight?.(block.id);
    setCurrentIndex(idx);

    if (block.fallback) {
      if (speechControllerRef.current) {
        speechControllerRef.current.stop();
      }
      
      const resolvedSpeaker = speakers.find(s => s.id === block.speakerId);
      const voice = resolvedSpeaker?.voice || 'Zephyr';
      const pacing = resolvedSpeaker?.pacing || 'normal';
      const pitch = resolvedSpeaker?.pitch || 'normal';

      const controls = speakClientText(
        block.text,
        voice,
        pacing,
        pitch,
        undefined,
        () => {
          // Pause briefly (0.5s) to match standard audiobook pacing
          setTimeout(() => {
            playBlockSeq(idx + 1);
          }, 500);
        },
        (err) => {
          console.error("Local continuous speech finished with warning:", err);
          // Fallback to standard electronic wav file output
          playWavBlock(block, idx);
        }
      );
      speechControllerRef.current = controls;
      return;
    }

    playWavBlock(block, idx);
  };

  const playWavBlock = (block: NarrationBlock, idx: number) => {
    if (block.audioData) {
      const { url } = createWavBlobFromPcm(block.audioData);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => {
          playBlockSeq(idx + 1);
        };
        audioRef.current.play().catch(err => {
          console.error("Continuous playback failed:", err);
          stopSequentialPlayback();
        });
      }
    }
  };

  // Compile multiple PCM raw segments into a single unified continuous WAV
  const compileMasterAudio = () => {
    if (synthesizedBlocks.length === 0) {
      alert("No voice components available for master exporting.");
      return;
    }

    setIsCompiling(true);
    setMasterUrl('');

    setTimeout(() => {
      try {
        const sampleRate = 24000;
        const silenceDuration = 0.5; // seconds spacer between blocks
        const silenceSamplesCount = Math.floor(sampleRate * silenceDuration);
        const silenceBuffer = new Int16Array(silenceSamplesCount); // Zeroes represent silence
        
        // Accumulate decoded sample buffers
        const samplesList: Int16Array[] = [];
        let totalSamplesCount = 0;

        synthesizedBlocks.forEach((block, idx) => {
          if (!block.audioData) return;
          const binary = window.atob(block.audioData);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          
          // Safely strip the 44-byte WAV header from both Gemini and server fallback outputs
          let pcmBytes = bytes;
          const isWav = bytes.length > 44 &&
                        bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70;
          if (isWav) {
            pcmBytes = bytes.subarray(44);
          }

          const numSamples = Math.floor(pcmBytes.length / 2);
          const int16Samples = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, numSamples);
          samplesList.push(int16Samples);
          totalSamplesCount += int16Samples.length;

          // Append silence spacer if this is not the absolute final block
          if (idx < synthesizedBlocks.length - 1) {
            samplesList.push(silenceBuffer);
            totalSamplesCount += silenceSamplesCount;
          }
        });

        // Consolidate samples into a single continuous buffer
        const masterSamples = new Int16Array(totalSamplesCount);
        let offset = 0;
        samplesList.forEach(buf => {
          masterSamples.set(buf, offset);
          offset += buf.length;
        });

        // Build standard 44-byte WAV header container
        const wavBuffer = new ArrayBuffer(44 + masterSamples.length * 2);
        const view = new DataView(wavBuffer);
        
        const writeStr = (view: DataView, offset: number, str: string) => {
          for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
          }
        };

        writeStr(view, 0, 'RIFF');
        view.setUint32(4, 36 + masterSamples.length * 2, true);
        writeStr(view, 8, 'WAVE');
        writeStr(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // Linear PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(view, 36, 'data');
        view.setUint32(40, masterSamples.length * 2, true);

        // Copy samples into place
        let wavOffset = 44;
        for (let j = 0; j < masterSamples.length; j++, wavOffset += 2) {
          view.setInt16(wavOffset, masterSamples[j], true);
        }

        const masterBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        const masterBlobUrl = URL.createObjectURL(masterBlob);
        
        setMasterUrl(masterBlobUrl);
        setMasterSize((masterBlob.size / (1024 * 1024)).toFixed(2) + " MB");

      } catch (err) {
        console.error("Compilation error during master compile:", err);
        alert("Failed to stitch sound samples. Please try synthesizing fewer or shorter blocks.");
      } finally {
        setIsCompiling(false);
      }
    }, 800);
  };

  return (
    <div className="bg-gradient-to-tr from-[#050505] via-[#0D0D0D] to-[#0A0A0A] text-white rounded-2xl p-4 shadow-xl border border-white/10 relative overflow-hidden" id="timeline-card">
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Background ambient light */}
      <div className="absolute right-0 top-0 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="bg-amber-500/15 border border-amber-500/20 text-[9px] font-mono tracking-wider text-amber-500 px-2.5 py-0.5 rounded-full font-bold uppercase">
              Publishing Desk
            </span>
            <span className="text-xs text-neutral-400">Continuous Master Assembly</span>
          </div>
          <h3 className="text-base font-sans font-semibold tracking-tight">
            {chapter.title || "Untitled Chapter"} Audio Master
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">Stitch narrative segments with automatic 0.5s paragraph pauses for perfect audiobook flow.</p>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap items-center gap-3">
          {isPlayingSeq ? (
            <button
              onClick={stopSequentialPlayback}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded transition-all cursor-pointer"
              id="btn-seq-stop"
            >
              <VolumeX className="w-4 h-4" />
              <span>Stop Playback</span>
            </button>
          ) : (
            <button
              onClick={startSequentialPlayback}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-semibold rounded transition-all cursor-pointer"
              id="btn-seq-play"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Listen Chapter Play</span>
            </button>
          )}

          <button
            onClick={compileMasterAudio}
            disabled={isCompiling || synthesizedBlocks.length === 0}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-45 text-black text-xs font-bold rounded transition-all cursor-pointer"
            id="btn-master-compile"
          >
            {isCompiling ? (
              <>
                <div className="w-4 h-4 border-2 border-black/35 border-t-black rounded-full animate-spin" />
                <span>Assembling Master...</span>
              </>
            ) : (
              <>
                <FileAudio className="w-4 h-4" />
                <span>Build Chapter Master</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress status indicators */}
      <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4.5 relative z-10">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 block">Synthesis Completion</span>
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-amber-500 shrink-0">{percentComplete}%</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 block">Scene Segment Details</span>
          <span className="text-xs font-mono font-medium block mt-1 text-neutral-300">
            {synthesizedBlocks.length} synthesized / {chapter.blocks.length} total blocks
          </span>
        </div>

        <div className="md:border-l md:border-white/5 md:pl-5 flex flex-col justify-center">
          {masterUrl ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>Master Ready</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500">{masterSize}</span>
              </div>
              <a
                href={masterUrl}
                download={`${chapter.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-audio-master.wav`}
                className="flex items-center justify-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-3 rounded transition-colors"
                id="link-download-master"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Download Continuous Audiobook WAV</span>
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded text-[11px] text-neutral-400">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Compile master recording to export publication-ready files.</span>
            </div>
          )}
        </div>
      </div>

      {/* Sequenced voice player indicator */}
      {isPlayingSeq && (
        <div className="mt-4 p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center gap-2.5 text-xs text-amber-400 animate-pulse">
          <div className="flex gap-0.5 items-end justify-center h-3.5 w-3.5">
            <div className="w-0.5 bg-amber-500 h-1 animate-bounce duration-100" />
            <div className="w-0.5 bg-amber-500 h-3.5 animate-bounce duration-300" />
            <div className="w-0.5 bg-amber-500 h-2 animate-bounce duration-200" />
          </div>
          <span>Playing continuous sequence. Currently voicing block {currentIndex + 1} of {synthesizedBlocks.length}...</span>
        </div>
      )}
    </div>
  );
}
