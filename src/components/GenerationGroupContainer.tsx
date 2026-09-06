import React, { useState } from 'react';
import { Play, Square, ArrowDownToLine, RefreshCw, Download, Edit2, Check, Sparkles, User, FileText, Layers, Hash } from 'lucide-react';
import { Snippet, Generation, Scene, Speaker } from '../types';
import { GenerationGroup, formatDefaultGenerationLabel, calculateGenerationStats } from '../utils/generationGrouping';

export interface GenerationGroupContainerProps {
  group: GenerationGroup;
  chapterNumber: number;
  chapterId: string;
  scenes: Scene[];
  speakers: Speaker[];
  isPlaying: boolean;
  isGenerating?: boolean;
  onUpdateGenerationName: (generationId: string, newName: string) => void;
  onPlay: (generation: Generation) => void;
  onPlayFromHere: (snippetId: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
  onExport: () => void;
  children: React.ReactNode;
}

/**
 * Material-style yellow enclosure component wrapping contiguous snippets that share an active generation.
 * Features an upper-left header badge with an editable label, cumulative stats, and vertical iconified playback flank controls.
 */
export const GenerationGroupContainer: React.FC<GenerationGroupContainerProps> = ({
  group,
  chapterNumber,
  chapterId,
  scenes,
  speakers,
  isPlaying,
  isGenerating,
  onUpdateGenerationName,
  onPlay,
  onPlayFromHere,
  onStop,
  onRegenerate,
  onExport,
  children
}) => {
  const { generation, snippets } = group;
  const [isEditingName, setIsEditingName] = useState(false);

  if (!generation) {
    return <div className="space-y-4">{children}</div>;
  }

  const primaryScene = scenes.find(s => s.id === (generation.sceneId || snippets[0]?.sceneId));
  const defaultLabel = formatDefaultGenerationLabel({
    generation,
    snippets,
    chapterNumber,
    sceneName: primaryScene?.name,
    customName: generation.name
  });

  const [nameInput, setNameInput] = useState(generation.name || defaultLabel);
  const stats = calculateGenerationStats(snippets, generation);

  const handleSaveName = () => {
    onUpdateGenerationName(generation.id, nameInput.trim());
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    }
    else if (e.key === 'Escape') {
      setNameInput(generation.name || defaultLabel);
      setIsEditingName(false);
    }
  };

  return (
    <div className="relative rounded-2xl border-2 border-yellow-500/80 bg-yellow-950/10 shadow-lg shadow-yellow-950/20 my-4 transition-all overflow-hidden">
      
      {/* Top Bar with Editable Title Pill & Cumulative Stats */}
      <div className="bg-slate-950/90 border-b border-yellow-500/40 p-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
        
        {/* Left Side: Generation Label */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-[220px] flex-1">
          {/* Label Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/60 text-yellow-400 font-mono text-xs w-full max-w-full">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 w-full min-w-[200px]">
                <input 
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="bg-slate-900 border border-yellow-500/80 rounded px-2 py-0.5 text-xs text-yellow-200 focus:outline-none w-full"
                />
                <button 
                  onClick={handleSaveName}
                  className="p-1 hover:bg-yellow-500/20 text-yellow-400 rounded shrink-0"
                  title="Save Label"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
                <span className="truncate font-semibold select-all" title={nameInput}>
                  {nameInput}
                </span>
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="p-0.5 hover:bg-yellow-500/20 text-yellow-400/80 hover:text-yellow-300 rounded shrink-0"
                  title="Edit Generation Name"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cumulative Stats */}
        <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-300 bg-slate-900/90 px-3 py-1 rounded-lg border border-yellow-500/30 shrink-0">
          <span title="Speakers involved" className="flex items-center gap-1">
            <User className="w-3 h-3 text-yellow-400" />
            <span>{stats.speakerCount} Spk</span>
          </span>
          <span className="text-yellow-500/40">•</span>
          <span title="Snippet Text: Characters, Words, Sentences">
            <span className="text-slate-400 mr-1">Txt:</span>
            {stats.totalChars}c / {stats.totalWords}w / {stats.totalSentences}s
          </span>
          <span className="text-yellow-500/40">•</span>
          <span title="Prompt Sent: Characters & Words">
            <span className="text-indigo-400 mr-1">Sent:</span>
            {stats.sentChars}c / {stats.sentWords}w
          </span>
          {(stats.totalTokens !== undefined || stats.promptTokens !== undefined) && (
            <>
              <span className="text-yellow-500/40">•</span>
              <span title="Tokens" className="text-amber-300">
                ~{stats.totalTokens || stats.promptTokens} tok
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Body with Vertical Left Flank Controls & Contained Snippets */}
      <div className="flex p-3 gap-3">
        
        {/* Vertical Iconified Left Flank */}
        <div className="flex flex-col items-center gap-2 pt-1 pr-1 border-r border-yellow-500/30 shrink-0">
          <button 
            onClick={() => isPlaying ? onStop() : onPlay(generation)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
            title={isPlaying ? "Stop" : "Play Generation"}
          >
            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button 
            onClick={() => onPlayFromHere(snippets[0]?.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:bg-teal-500/30 transition-all"
            title="Play continuous from here"
          >
            <ArrowDownToLine className="w-4 h-4" />
          </button>

          <button 
            onClick={onRegenerate}
            disabled={isGenerating}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/30 transition-all disabled:opacity-50"
            title="Regenerate"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>

          <button 
            onClick={onExport}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30 transition-all"
            title="Export Audio"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Snippets Container */}
        <div className="flex-1 space-y-3 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
