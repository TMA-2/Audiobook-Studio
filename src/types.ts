/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

//MARK: Can this be simplified or even removed in favor of something like...
//GEMINI_VOICES.ForEach('id')
export type VoiceName = 'Achernar' | 'Achird' | 'Algenib' | 'Algieba' | 'Alnilam' | 'Aoede' | 'Autonoe' | 
  'Callirrhoe' | 'Charon' | 'Despina' | 'Enceladus' | 'Erinome' | 'Fenrir' | 'Gacrux' | 'Iapetus' | 'Kore' | 
  'Laomedeia' | 'Leda' | 'Orus' | 'Puck' | 'Pulcherrima' | 'Rasalgethi' | 'Sadachbia' | 'Sadaltager' | 'Schedar' | 
  'Sulafat' | 'Umbriel' | 'Vindemiatrix' | 'Zephyr' | 'Zubenelgenubi';

export interface VoiceProfile {
  id: VoiceName;
  name: string;
  gender: 'Female' | 'Male' | 'Neutral';
  tone: string;
  pitch: string;
  description: string;
  avatarColor: string;
}

export const GEMINI_VOICES: VoiceProfile[] = [
  { id: 'Achernar', pitch: 'Higher', name: 'Achernar', description: 'Clear, bright, and highly articulate soprano voice', avatarColor: 'bg-rose-500 text-white', gender: 'Female', tone: 'Soft' },
  { id: 'Achird', pitch: 'Lower-middle', name: 'Achird', description: 'Crisp, energetic, and clean tenor suited for narration', avatarColor: 'bg-blue-600 text-white', gender: 'Male', tone: 'Friendly' },
  { id: 'Algenib', pitch: 'Lower', name: 'Algenib', description: 'Warm, baritone tone with gentle and persuasive pacing', avatarColor: 'bg-indigo-500 text-white', gender: 'Male', tone: 'Gravelly' },
  { id: 'Algieba', pitch: 'Lower', name: 'Algieba', description: 'Stately, classical narrator voice with clear theatrical resonance', avatarColor: 'bg-amber-700 text-white', gender: 'Male', tone: 'Smooth' },
  { id: 'Alnilam', pitch: 'Lower-middle', name: 'Alnilam', description: 'Smooth, modern, and engaging commercial-grade presentation voice', avatarColor: 'bg-emerald-600 text-white', gender: 'Male', tone: 'Firm' },
  { id: 'Aoede', pitch: 'Middle', name: 'Aoede', description: 'Breathy, melodious, and poetic voice with soft, flowing contours', avatarColor: 'bg-pink-500 text-white', gender: 'Female', tone: 'Breezy' },
  { id: 'Autonoe', pitch: 'Middle', name: 'Autonoe', description: 'Crisp, authoritative, and direct mid-range dramatic tone', avatarColor: 'bg-purple-600 text-white', gender: 'Female', tone: 'Bright' },
  { id: 'Callirrhoe', pitch: 'Middle', name: 'Callirrhoe', description: 'Deep, velvety, and dramatic alto with deliberate slow phrasing', avatarColor: 'bg-fuchsia-600 text-white', gender: 'Female', tone: 'Easy-going' },
  { id: 'Charon', pitch: 'Lower', name: 'Charon', description: 'Deep, resonant, dramatic, and scholarly tone', avatarColor: 'bg-amber-600 text-white', gender: 'Male', tone: 'Informative' },
  { id: 'Despina', pitch: 'Middle', name: 'Despina', description: 'Vibrant, friendly, and fast-paced conversational tone', avatarColor: 'bg-cyan-500 text-black', gender: 'Female', tone: 'Smooth' },
  { id: 'Enceladus', pitch: 'Lower', name: 'Enceladus', description: 'Rumbling, powerful, and thick baritone for dark or intense roles', avatarColor: 'bg-neutral-700 text-white', gender: 'Male', tone: 'Breathy' },
  { id: 'Erinome', pitch: 'Middle', name: 'Erinome', description: 'Gentle, whispered, and comforting maternal narrator voice', avatarColor: 'bg-teal-600 text-white', gender: 'Female', tone: 'Clear' },
  { id: 'Fenrir', pitch: 'Lower-middle', name: 'Fenrir', description: 'Bold, growly, intense, of high gravity', avatarColor: 'bg-indigo-600 text-white', gender: 'Male', tone: 'Excitable' },
  { id: 'Gacrux', pitch: 'Middle', name: 'Gacrux', description: 'Mature, sophisticated, and articulate educational voice', avatarColor: 'bg-violet-700 text-white', gender: 'Female', tone: 'Mature' },
  { id: 'Iapetus', pitch: 'Lower-middle', name: 'Iapetus', description: 'Gravelly, experienced storyteller with slow, seasoned pacing', avatarColor: 'bg-orange-600 text-white', gender: 'Male', tone: 'Clear' },
  { id: 'Kore', pitch: 'Middle', name: 'Kore', description: 'Energetic, cheerful, and clear narratives', avatarColor: 'bg-rose-500 text-white', gender: 'Female', tone: 'Firm' },
  { id: 'Laomedeia', pitch: 'Higher', name: 'Laomedeia', description: 'High, soft, and fairytale-like whimsical narrator', avatarColor: 'bg-yellow-500 text-black', gender: 'Female', tone: 'Upbeat' },
  { id: 'Leda', pitch: 'Higher', name: 'Leda', description: 'Serene, slow-tempo voice suited for ambient and documentary works', avatarColor: 'bg-lime-600 text-white', gender: 'Female', tone: 'Youthful' },
  { id: 'Orus', pitch: 'Lower-middle', name: 'Orus', description: 'Young adult, heroic, and crisp active protagonist tone', avatarColor: 'bg-sky-600 text-white', gender: 'Male', tone: 'Firm' },
  { id: 'Puck', pitch: 'Middle', name: 'Puck', description: 'Friendly, youthful, and vibrant story voice', avatarColor: 'bg-emerald-500 text-white', gender: 'Male', tone: 'Upbeat' },
  { id: 'Pulcherrima', pitch: 'Middle', name: 'Pulcherrima', description: 'Rich, highly expressive, and classically trained dramatic voice', avatarColor: 'bg-rose-600 text-white', gender: 'Female', tone: 'Forward' },
  { id: 'Rasalgethi', pitch: 'Middle', name: 'Rasalgethi', description: 'Aged, wise, and ancient counselor tone with a warm crackle', avatarColor: 'bg-stone-600 text-white', gender: 'Male', tone: 'Informative' },
  { id: 'Sadachbia', pitch: 'Lower', name: 'Sadachbia', description: 'Calm, neutral, and highly technical instructional speaker style', avatarColor: 'bg-slate-600 text-white', gender: 'Male', tone: 'Lively' },
  { id: 'Sadaltager', pitch: 'Middle', name: 'Sadaltager', description: 'Confident, upbeat, and highly energetic presentation voice', avatarColor: 'bg-sky-500 text-black', gender: 'Male', tone: 'Knowledgeable' },
  { id: 'Schedar', pitch: 'Lower-middle', name: 'Schedar', description: 'Commanding, clear, and powerful mid-range announcer style', avatarColor: 'bg-red-600 text-white', gender: 'Male', tone: 'Even' },
  { id: 'Sulafat', pitch: 'Middle', name: 'Sulafat', description: 'Husky, soulful, and introspective lower-register voice', avatarColor: 'bg-pink-600 text-white', gender: 'Female', tone: 'Warm' },
  { id: 'Umbriel', pitch: 'Lower-middle', name: 'Umbriel', description: 'Quiet, shadow-like, and mysterious whispers for suspense', avatarColor: 'bg-neutral-800 text-white', gender: 'Male', tone: 'Easy-going' },
  { id: 'Vindemiatrix', pitch: 'Middle', name: 'Vindemiatrix', description: 'Lively, expressive, and rapid-pacing character actor', avatarColor: 'bg-emerald-400 text-black', gender: 'Female', tone: 'Gentle' },
  { id: 'Zephyr', pitch: 'Highere', name: 'Zephyr', description: 'Warm, steady, comforting, and documentary-like', avatarColor: 'bg-teal-500 text-white', gender: 'Neutral', tone: 'Bright' },
  { id: 'Zubenelgenubi', pitch: 'Lower-middle', name: 'Zubenelgenubi', description: 'Smooth, jazz-like, deep, and slow resonant bass register', avatarColor: 'bg-violet-800 text-white', gender: 'Male', tone: 'Casual' },
];

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export const GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS (Preview)', description: 'Primary high-quality TTS model' },
  { id: 'gemini-2.5-flash-tts', name: 'Gemini 2.5 Flash TTS', description: 'Fast, balanced performance' },
  { id: 'gemini-2.5-pro-tts', name: 'Gemini 2.5 Pro TTS', description: 'High-intelligence, detailed generation' },
  { id: 'gemini-2.5-flash-lite-preview-tts', name: 'Gemini 2.5 Flash Lite TTS (Preview)', description: 'Lightweight, low latency' },
];

export interface Speaker {
  id: string;
  name: string;
  isNarrator: boolean;
  voice: VoiceName | string;
  model?: ModelOption; // gemini-3.1-flash-tts-preview, gemini-2.5-flash-tts, gemini-2.5-pro-tts, etc.
  pacing?: 'slow' | 'normal' | 'fast' | string;
  pitch?: 'low' | 'normal' | 'high' | string;
  emotion?: string; // 'none', 'laughing', 'sad', 'excited', 'whispering', 'shouting', 'nominous', 'gasping'
  customInstructions?: string; // performance directives (old)
  order: number;
  style: string; // custom instructions / style guidelines
  role?: string; // character role (e.g., Protagonist, Sister)
  pace?: string; // character speed (e.g. Natural)
  accent?: string; // character accent (e.g., American Neutral)
}

export interface NarrationBlock {
  id: string;
  chapterId: string;
  speakerId: string; // references Speaker.id
  sceneId: string; // references scene.id
  text: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  audioData: string | null; // base64 string
  duration: number | null; // seconds
  errorMessage: string | null;
  fallback?: boolean;
}

// for testing Interactions API with response_format.mime_type
export type InteractionsMimeType = 'audio/mp3' | 'audio/ogg_opus' | 'audio/l16' | 'audio/wav' | 'audio/alaw' | 'audio/mulaw';

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
  sceneId?: string | null;
  status: 'idle' | 'generating' | 'done' | 'error';
  errorMessage?: string;
  generations: Generation[];
  activeGenerationId: string | null;
  // to be implemented: to test the Interactions API stateful mode 'previous_response_id' 
  responseId?: string;
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

export interface Scene {
  id: string;
  name: string;
  description: string;
  context?: string; // narrative or situational background/context
  order: number;
}

export interface Project {
  // New properties
  title: string;
  settings: {
    model: ModelOption;
    encoding: AudioEncoding;
    sampleRate: string;
    // Track 1 additional settings
    temperature?: number;
    apiType?: 'generateContent' | 'Interactions';
    generationOption?: 'individual' | 'combined';
    concatenationOption?: 'per-paragraph' | 'per-scene' | 'per-chapter' | 'full-project';
    bitRate?: string;
    apiKey?: string;
    audioExportFormat?: 'M4A' | 'OGG_OPUS' | 'MP3' | 'WAV' | 'FLAC' | 'M4B';
    promptTemplate?: string;
  };
  speakers: Speaker[];
  chapters: Chapter[];
  scenes?: Scene[];

  // Old properties (for compatibility)
  id?: string;
  name?: string;
  description?: string;
  createdAt?: string;
  lastModifiedAt?: string;
}

export type SettingFieldType = 'boolean' | 'string' | 'number' | 'enum' | 'text' | 'string[]';

export interface SettingFieldSchema {
  key: string;
  label: string;
  description?: string;
  type: SettingFieldType;
  options?: { value: string; label: string }[]; // for enum selection
  min?: number; // for numeric ranges
  max?: number;
  step?: number;
  placeholder?: string;
  category: 'generation' | 'export' | 'api' | 'editor';
}

export interface UserPreferences {
  apiKey?: string;
  theme?: 'dark' | 'light' | 'system';
  isDraggableSettingsEnabled?: boolean;
  keyboardShortcutsEnabled?: boolean;
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
