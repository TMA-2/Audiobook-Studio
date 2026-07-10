/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VoiceName = 'Achernar' | 'Achird' | 'Algenib' | 'Algieba' | 'Alnilam' | 'Aoede' | 'Autonoe' | 
  'Callirrhoe' | 'Charon' | 'Despina' | 'Enceladus' | 'Erinome' | 'Fenrir' | 'Gacrux' | 'Iapetus' | 'Kore' | 
  'Laomedeia' | 'Leda' | 'Orus' | 'Puck' | 'Pulcherrima' | 'Rasalgethi' | 'Sadachbia' | 'Sadaltager' | 'Schedar' | 
  'Sulafat' | 'Umbriel' | 'Vindemiatrix' | 'Zephyr' | 'Zubenelgenubi';

export interface VoiceProfile {
  id: VoiceName;
  name: string;
  gender: 'Female' | 'Male' | 'Neutral';
  description: string;
  avatarColor: string;
}

export const SUPPORTED_VOICES: VoiceProfile[] = [
  { id: 'Achernar', name: 'Achernar', gender: 'Female', description: 'Clear, bright, and highly articulate soprano voice', avatarColor: 'bg-rose-500 text-white' },	
  { id: 'Achird', name: 'Achird', gender: 'Male', description: 'Crisp, energetic, and clean tenor suited for narration', avatarColor: 'bg-blue-600 text-white' },
  { id: 'Algenib', name: 'Algenib', gender: 'Male', description: 'Warm, baritone tone with gentle and persuasive pacing', avatarColor: 'bg-indigo-500 text-white' },	
  { id: 'Algieba', name: 'Algieba', gender: 'Male', description: 'Stately, classical narrator voice with clear theatrical resonance', avatarColor: 'bg-amber-700 text-white' },	
  { id: 'Alnilam', name: 'Alnilam', gender: 'Male', description: 'Smooth, modern, and engaging commercial-grade presentation voice', avatarColor: 'bg-emerald-600 text-white' },	
  { id: 'Aoede', name: 'Aoede', gender: 'Female', description: 'Breathy, melodious, and poetic voice with soft, flowing contours', avatarColor: 'bg-pink-500 text-white' },	
  { id: 'Autonoe', name: 'Autonoe', gender: 'Female', description: 'Crisp, authoritative, and direct mid-range dramatic tone', avatarColor: 'bg-purple-600 text-white' },	
  { id: 'Callirrhoe', name: 'Callirrhoe', gender: 'Female', description: 'Deep, velvety, and dramatic alto with deliberate slow phrasing', avatarColor: 'bg-fuchsia-600 text-white' },	
  { id: 'Charon', name: 'Charon', gender: 'Male', description: 'Deep, resonant, dramatic, and scholarly tone', avatarColor: 'bg-amber-600 text-white' },
  { id: 'Despina', name: 'Despina', gender: 'Female', description: 'Vibrant, friendly, and fast-paced conversational tone', avatarColor: 'bg-cyan-500 text-black' },	
  { id: 'Enceladus', name: 'Enceladus', gender: 'Male', description: 'Rumbling, powerful, and thick baritone for dark or intense roles', avatarColor: 'bg-neutral-700 text-white' },	
  { id: 'Erinome', name: 'Erinome', gender: 'Female', description: 'Gentle, whispered, and comforting maternal narrator voice', avatarColor: 'bg-teal-600 text-white' },	
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', description: 'Bold, growly, intense, of high gravity', avatarColor: 'bg-indigo-600 text-white' },
  { id: 'Gacrux', name: 'Gacrux', gender: 'Female', description: 'Mature, sophisticated, and articulate educational voice', avatarColor: 'bg-violet-700 text-white' },	
  { id: 'Iapetus', name: 'Iapetus', gender: 'Male', description: 'Gravelly, experienced storyteller with slow, seasoned pacing', avatarColor: 'bg-orange-600 text-white' },	
  { id: 'Kore', name: 'Kore', gender: 'Female', description: 'Energetic, cheerful, and clear narratives', avatarColor: 'bg-rose-500 text-white' },
  { id: 'Laomedeia', name: 'Laomedeia', gender: 'Female', description: 'High, soft, and fairytale-like whimsical narrator', avatarColor: 'bg-yellow-500 text-black' },	
  { id: 'Leda', name: 'Leda', gender: 'Female', description: 'Serene, slow-tempo voice suited for ambient and documentary works', avatarColor: 'bg-lime-600 text-white' },	
  { id: 'Orus', name: 'Orus', gender: 'Male', description: 'Young adult, heroic, and crisp active protagonist tone', avatarColor: 'bg-sky-600 text-white' },	
  { id: 'Puck', name: 'Puck', gender: 'Male', description: 'Friendly, youthful, and vibrant story voice', avatarColor: 'bg-emerald-500 text-white' },
  { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'Female', description: 'Rich, highly expressive, and classically trained dramatic voice', avatarColor: 'bg-rose-600 text-white' },	
  { id: 'Rasalgethi', name: 'Rasalgethi', gender: 'Male', description: 'Aged, wise, and ancient counselor tone with a warm crackle', avatarColor: 'bg-stone-600 text-white' },	
  { id: 'Sadachbia', name: 'Sadachbia', gender: 'Male', description: 'Calm, neutral, and highly technical instructional speaker style', avatarColor: 'bg-slate-600 text-white' },	
  { id: 'Sadaltager', name: 'Sadaltager', gender: 'Male', description: 'Confident, upbeat, and highly energetic presentation voice', avatarColor: 'bg-sky-500 text-black' },	
  { id: 'Schedar', name: 'Schedar', gender: 'Male', description: 'Commanding, clear, and powerful mid-range announcer style', avatarColor: 'bg-red-600 text-white' },	
  { id: 'Sulafat', name: 'Sulafat', gender: 'Female', description: 'Husky, soulful, and introspective lower-register voice', avatarColor: 'bg-pink-600 text-white' },	
  { id: 'Umbriel', name: 'Umbriel', gender: 'Male', description: 'Quiet, shadow-like, and mysterious whispers for suspense', avatarColor: 'bg-neutral-800 text-white' },	
  { id: 'Vindemiatrix', name: 'Vindemiatrix', gender: 'Female', description: 'Lively, expressive, and rapid-pacing character actor', avatarColor: 'bg-emerald-400 text-black' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Neutral', description: 'Warm, steady, comforting, and documentary-like', avatarColor: 'bg-teal-500 text-white' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', gender: 'Male', description: 'Smooth, jazz-like, deep, and slow resonant bass register', avatarColor: 'bg-violet-800 text-white' },
];

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export const SUPPORTED_MODELS: ModelOption[] = [
  { id: 'gemini-3.1-flash-tts-preview', name: '3.1 Flash (TTS Preview)', description: 'Primary high-quality TTS model' },
  { id: 'gemini-2.5-flash-tts', name: '2.5 Flash TTS', description: 'Fast, balanced performance' },
  { id: 'gemini-2.5-pro-tts', name: '2.5 Pro TTS', description: 'High-intelligence, detailed generation' },
  { id: 'gemini-2.5-flash-lite-preview-tts', name: '2.5 Flash Lite TTS (Preview)', description: 'Lightweight, low latency' },
];

export interface Speaker {
  id: string;
  name: string;
  isNarrator: boolean;
  voice: VoiceName | string;
  model?: string; // gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts, gemini-2.5-pro-tts, etc.
  pacing?: 'slow' | 'normal' | 'fast' | string;
  pitch?: 'low' | 'normal' | 'high' | string;
  emotion?: string; // 'none', 'laughing', 'sad', 'excited', 'whispering', 'shouting', 'nominous', 'gasping'
  customInstructions?: string; // performance directives (old)
  
  // New properties for Audiobook Studio App2
  order: number;
  style: string; // custom instructions / style guidelines
}

export interface NarrationBlock {
  id: string;
  chapterId: string;
  speakerId: string; // references Speaker.id
  text: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  audioData: string | null; // base64 string
  duration: number | null; // seconds
  errorMessage: string | null;
  fallback?: boolean;
}

export type AudioEncoding = 'M4A' | 'OGG_OPUS' | 'MP3' | 'WAV';

export interface Generation {
  id: string;
  snippetId: string;
  speakerId: string | null;
  timestamp: string | number;
  model: string;
  text: string;
  audioMimeType: string;
  duration: number;
}

export interface Snippet {
  id: string;
  order: number;
  text: string;
  speakerId: string | null;
  status: 'idle' | 'generating' | 'done' | 'error';
  errorMessage?: string;
  generations: Generation[];
  activeGenerationId: string | null;
  isCollapsed?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;

  // New properties
  defaultSpeakerId: string | null;
  isCollapsed: boolean;
  snippets: Snippet[];

  // Old properties (for compatibility)
  projectId?: string;
  blocks?: NarrationBlock[];
}

export interface Project {
  // New properties
  title: string;
  settings: {
    model: string;
    encoding: AudioEncoding;
    sampleRate: string;
  };
  speakers: Speaker[];
  chapters: Chapter[];

  // Old properties (for compatibility)
  id?: string;
  name?: string;
  description?: string;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface GenerationRequest {
  text: string;
  speaker: VoiceName;
  pacing: 'slow' | 'normal' | 'fast';
  pitch: 'low' | 'normal' | 'high';
  emotion: string;
  customInstructions: string;
  model?: string;
}
