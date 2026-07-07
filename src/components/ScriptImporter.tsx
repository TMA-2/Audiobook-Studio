/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, X, HelpCircle } from 'lucide-react';

export interface ImportedBlock {
  speakerName: string;
  text: string;
  emotion: string;
  pacing: 'slow' | 'normal' | 'fast';
  pitch: 'low' | 'normal' | 'high';
}

interface ScriptImporterProps {
  onImportComplete: (blocks: ImportedBlock[]) => void;
  onClose: () => void;
}

const PRESET_SCRIPTS = [
  {
    title: "The Haunted Galleon (Drama Scene)",
    text: `[Zephyr] [ominous] The wooden ribs of the abandoned shipwreck creaked under the weight of the incoming tide.
[Fenrir] [shouting] "Show yourself, coward! I know you are hiding in the ballast!"
[Kore] [whispering] "Arthur, be silent... the sea-witch listens to every vibration in the timbers."
[Puck] [gasping] "Look at the deck! The water is turning black!"`
  },
  {
    title: "Classic Sci-Fi (Deep Space Dialogue)",
    text: `[Zephyr] Orbiting the dead pulsar, Horizon-4 was silent, its solar arrays dark.
[Charon] "Our fuel reserves have expired, Lieutenant. We have exactly six minutes of thermal life."
[Kore] [gasping] "Wait! The telemetry screen! There's an artificial signal pulsing from the core!"
[Puck] [excited] "I have locked onto it! It's a localized gravity shield... we can dock!"`
  }
];

export default function ScriptImporter({ onImportComplete, onClose }: ScriptImporterProps) {
  const [scriptText, setScriptText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApplyPreset = (text: string) => {
    setScriptText(text);
  };

  const handleParse = async (useAi: boolean) => {
    if (!scriptText.trim()) {
      setErrorMsg("Please paste some script dialog or book text first before trying to import.");
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);

    try {
      if (useAi) {
        // AI-powered structured parsing using Gemini 3.5-flash
        const res = await fetch("/api/project/import-parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenplayText: scriptText })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "The script processing endpoint encountered a problem.");
        }

        const data = await res.json();
        if (data.blocks && Array.isArray(data.blocks)) {
          const completedBlocks: ImportedBlock[] = data.blocks.map((b: any) => ({
            speakerName: b.speaker || 'Zephyr',
            text: b.text || '',
            pacing: b.pacing || 'normal',
            pitch: b.pitch || 'normal',
            emotion: b.emotion || 'none'
          }));
          onImportComplete(completedBlocks);
          onClose();
        } else {
          throw new Error("Invalid structure returned from parsing model. Attempting local rule-based parsing.");
        }

      } else {
        // Instant, high-performance regex parsing locally on client
        const lines = scriptText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        const parsedBlocks: ImportedBlock[] = [];
        
        lines.forEach((line, index) => {
          let speakerKey = "Zephyr";
          let blockText = line;
          let emotionVal = "none";
          
          // Match speaker headers: [Speaker] or Speaker:
          const speakerMatch = line.match(/^\[?([A-Za-z0-9\s_-]+)\]?:?\s*(.*)$/);
          if (speakerMatch && speakerMatch[1]) {
            const rawSpk = speakerMatch[1].trim();
            speakerKey = rawSpk;
            blockText = speakerMatch[2] || line;
          }

          // Match brackets emotion tags like [laughing] or [whispering]
          const emotionMatch = blockText.match(/\[([a-z]+)\]/i);
          if (emotionMatch && emotionMatch[1]) {
            const parsedE = emotionMatch[1].toLowerCase();
            if (['none', 'laughing', 'sad', 'excited', 'whispering', 'shouting', 'nominous', 'gasping'].includes(parsedE)) {
              emotionVal = parsedE;
            }
            blockText = blockText.replace(/\[.*?\]/g, "");
          }

          parsedBlocks.push({
            speakerName: speakerKey,
            text: blockText.replace(/"/g, "").trim(),
            pacing: 'normal',
            pitch: 'normal',
            emotion: emotionVal
          });
        });

        if (parsedBlocks.length === 0) {
          throw new Error("Could not parse any structured narration from script text lines.");
        }

        onImportComplete(parsedBlocks);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected parser halt occurred.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="script-importer-modal">
      <div className="bg-[#0A0A0A] rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform animate-in fade-in zoom-in-95 duration-250">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-sans font-semibold text-white leading-none">Smart Screenplay Importer</h3>
              <p className="text-xs text-neutral-500 mt-1">Automatic dialogue casting, emotion cues, and line trimming</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 text-neutral-500 hover:text-white rounded transition-colors cursor-pointer"
            id="close-importer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
          {errorMsg && (
            <div className="flex items-start gap-2.5 bg-red-950/30 text-red-300 p-3.5 rounded border border-red-900/30 text-sm animate-pulse" id="importer-error">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preset templates panel */}
          <div>
            <span className="text-xs font-mono text-neutral-500 block mb-2.5 uppercase tracking-wider">Casting Script Presets</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_SCRIPTS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handleApplyPreset(preset.text)}
                  className="text-left p-3.5 bg-[#0D0D0D] hover:bg-white/5 border border-white/10 hover:border-amber-500/40 rounded transition-all group cursor-pointer"
                  id={`preset-${i}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-neutral-300 font-sans font-medium text-xs group-hover:text-amber-500">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>{preset.title}</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 line-clamp-2 font-mono leading-tight">{preset.text}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Main textarea dialog text-input */}
          <div className="flex-1 flex flex-col gap-1.5 min-h-[220px]">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider block">Dialogue Draft Script</span>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder='[Narrator] The old clock tower struck midnight.&#10;[Kore] [whispering] "Arthur, did you see that?"&#10;[Arthur] "Yes! It is starting to materialize..."'
              className="flex-1 w-full bg-[#0D0D0D] border border-white/10 hover:border-neutral-700 focus:bg-neutral-900 focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/60 rounded p-4 text-xs font-mono text-neutral-200 outline-none leading-relaxed resize-none h-44"
              id="script-textarea"
            />
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-1">
              <HelpCircle className="w-3 h-3 text-neutral-500 shrink-0" />
              <span>Use <b>[VoiceName]</b> to assign cast and <b>[emotion]</b> tags to suggest acoustic styling.</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10 bg-[#050505] flex flex-col sm:flex-row gap-3 justify-end items-center">
          <button
            onClick={() => handleParse(false)}
            disabled={isParsing}
            className="w-full sm:w-auto px-4.5 py-2 hover:bg-white/5 text-neutral-300 disabled:opacity-50 text-xs font-medium border border-white/10 rounded transition-colors shrink-0 cursor-pointer"
            id="parse-local-btn"
          >
            Local Fast Parse
          </button>
          <button
            onClick={() => handleParse(true)}
            disabled={isParsing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-75 text-black text-xs font-semibold rounded shadow-md cursor-pointer transition-all"
            id="parse-ai-btn"
          >
            {isParsing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black/35 border-t-black rounded-full animate-spin" />
                <span>AI Storyboarding...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Gemini Smart Parse</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
