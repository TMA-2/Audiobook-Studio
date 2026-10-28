/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { tr } from "motion/react-m";
import { generateId } from "./services/idService";

//MARK: Can this be simplified or even removed in favor of something like...
//GEMINI_VOICES.ForEach('id')
export type VoiceName = 'Achernar' | 'Achird' | 'Algenib' | 'Algieba' | 'Alnilam' | 'Aoede' | 'Autonoe' | 
  'Callirrhoe' | 'Charon' | 'Despina' | 'Enceladus' | 'Erinome' | 'Fenrir' | 'Gacrux' | 'Iapetus' | 'Kore' | 
  'Laomedeia' | 'Leda' | 'Orus' | 'Puck' | 'Pulcherrima' | 'Rasalgethi' | 'Sadachbia' | 'Sadaltager' | 'Schedar' | 
  'Sulafat' | 'Umbriel' | 'Vindemiatrix' | 'Zephyr' | 'Zubenelgenubi';

export type Gender = 'Male' | 'Female' | 'Neutral';

export interface VoiceProfile {
  id: VoiceName;
  name: string;
  // gender can match one or more types
  gender: Gender;
  tone: string;
  pitch: string;
  description: string;
  avatarColor: string;
}

// TODO: remove avatarColor. that should be determined by the theme's color palette, perhaps from 8 or 16-color, and if more are needed, repeating the hues but adding or subtracting saturation and/or value/lightness.
//  alternately, getting the next color hue from the mid-point between colors 1 and 2 in the set and so forth.
export const GEMINI_VOICES: VoiceProfile[] = [
  {
    id: "Achernar",
    pitch: "Higher",
    name: "Achernar",
    description: "Clear, bright, and highly articulate soprano voice",
    avatarColor: "bg-rose-500 text-white",
    gender: "Female",
    tone: "Soft",
  },
  {
    id: "Achird",
    pitch: "Lower-middle",
    name: "Achird",
    description: "Crisp, energetic, and clean tenor suited for narration",
    avatarColor: "bg-blue-600 text-white",
    gender: "Male",
    tone: "Friendly",
  },
  {
    id: "Algenib",
    pitch: "Lower",
    name: "Algenib",
    description: "Warm, baritone tone with gentle and persuasive pacing",
    avatarColor: "bg-indigo-500 text-white",
    gender: "Male",
    tone: "Gravelly",
  },
  {
    id: "Algieba",
    pitch: "Lower",
    name: "Algieba",
    description: "Stately, classical narrator voice with clear theatrical resonance",
    avatarColor: "bg-amber-700 text-white",
    gender: "Male",
    tone: "Smooth",
  },
  {
    id: "Alnilam",
    pitch: "Lower-middle",
    name: "Alnilam",
    description: "Smooth, modern, and engaging commercial-grade presentation voice",
    avatarColor: "bg-emerald-600 text-white",
    gender: "Male",
    tone: "Firm",
  },
  {
    id: "Aoede",
    pitch: "Middle",
    name: "Aoede",
    description: "Breathy, melodious, and poetic voice with soft, flowing contours",
    avatarColor: "bg-pink-500 text-white",
    gender: "Female",
    tone: "Breezy",
  },
  {
    id: "Autonoe",
    pitch: "Middle",
    name: "Autonoe",
    description: "Crisp, authoritative, and direct mid-range dramatic tone",
    avatarColor: "bg-purple-600 text-white",
    gender: "Female",
    tone: "Bright",
  },
  {
    id: "Callirrhoe",
    pitch: "Middle",
    name: "Callirrhoe",
    description: "Deep, velvety, and dramatic alto with deliberate slow phrasing",
    avatarColor: "bg-fuchsia-600 text-white",
    gender: "Female",
    tone: "Easy-going",
  },
  {
    id: "Charon",
    pitch: "Lower",
    name: "Charon",
    description: "Deep, resonant, dramatic, and scholarly tone",
    avatarColor: "bg-amber-600 text-white",
    gender: "Male",
    tone: "Informative",
  },
  {
    id: "Despina",
    pitch: "Middle",
    name: "Despina",
    description: "Vibrant, friendly, and fast-paced conversational tone",
    avatarColor: "bg-cyan-500 text-black",
    gender: "Female",
    tone: "Smooth",
  },
  {
    id: "Enceladus",
    pitch: "Lower",
    name: "Enceladus",
    description: "Rumbling, powerful, and thick baritone for dark or intense roles",
    avatarColor: "bg-neutral-700 text-white",
    gender: "Male",
    tone: "Breathy",
  },
  {
    id: "Erinome",
    pitch: "Middle",
    name: "Erinome",
    description: "Gentle, whispered, and comforting maternal narrator voice",
    avatarColor: "bg-teal-600 text-white",
    gender: "Female",
    tone: "Clear",
  },
  {
    id: "Fenrir",
    pitch: "Lower-middle",
    name: "Fenrir",
    description: "Bold, growly, intense, of high gravity",
    avatarColor: "bg-indigo-600 text-white",
    gender: "Male",
    tone: "Excitable",
  },
  {
    id: "Gacrux",
    pitch: "Middle",
    name: "Gacrux",
    description: "Mature, sophisticated, and articulate educational voice",
    avatarColor: "bg-violet-700 text-white",
    gender: "Female",
    tone: "Mature",
  },
  {
    id: "Iapetus",
    pitch: "Lower-middle",
    name: "Iapetus",
    description: "Gravelly, experienced storyteller with slow, seasoned pacing",
    avatarColor: "bg-orange-600 text-white",
    gender: "Male",
    tone: "Clear",
  },
  {
    id: "Kore",
    pitch: "Middle",
    name: "Kore",
    description: "Energetic, cheerful, and clear narratives",
    avatarColor: "bg-rose-500 text-white",
    gender: "Female",
    tone: "Firm",
  },
  {
    id: "Laomedeia",
    pitch: "Higher",
    name: "Laomedeia",
    description: "High, soft, and fairytale-like whimsical narrator",
    avatarColor: "bg-yellow-500 text-black",
    gender: "Female",
    tone: "Upbeat",
  },
  {
    id: "Leda",
    pitch: "Higher",
    name: "Leda",
    description: "Serene, slow-tempo voice suited for ambient and documentary works",
    avatarColor: "bg-lime-600 text-white",
    gender: "Female",
    tone: "Youthful",
  },
  {
    id: "Orus",
    pitch: "Lower-middle",
    name: "Orus",
    description: "Young adult, heroic, and crisp active protagonist tone",
    avatarColor: "bg-sky-600 text-white",
    gender: "Male",
    tone: "Firm",
  },
  {
    id: "Puck",
    pitch: "Middle",
    name: "Puck",
    description: "Friendly, youthful, and vibrant story voice",
    avatarColor: "bg-emerald-500 text-white",
    gender: "Male",
    tone: "Upbeat",
  },
  {
    id: "Pulcherrima",
    pitch: "Middle",
    name: "Pulcherrima",
    description: "Rich, highly expressive, and classically trained dramatic voice",
    avatarColor: "bg-rose-600 text-white",
    gender: "Female",
    tone: "Forward",
  },
  {
    id: "Rasalgethi",
    pitch: "Middle",
    name: "Rasalgethi",
    description: "Aged, wise, and ancient counselor tone with a warm crackle",
    avatarColor: "bg-stone-600 text-white",
    gender: "Male",
    tone: "Informative",
  },
  {
    id: "Sadachbia",
    pitch: "Lower",
    name: "Sadachbia",
    description: "Calm, neutral, and highly technical instructional speaker style",
    avatarColor: "bg-slate-600 text-white",
    gender: "Male",
    tone: "Lively",
  },
  {
    id: "Sadaltager",
    pitch: "Middle",
    name: "Sadaltager",
    description: "Confident, upbeat, and highly energetic presentation voice",
    avatarColor: "bg-sky-500 text-black",
    gender: "Male",
    tone: "Knowledgeable",
  },
  {
    id: "Schedar",
    pitch: "Lower-middle",
    name: "Schedar",
    description: "Commanding, clear, and powerful mid-range announcer style",
    avatarColor: "bg-red-600 text-white",
    gender: "Male",
    tone: "Even",
  },
  {
    id: "Sulafat",
    pitch: "Middle",
    name: "Sulafat",
    description: "Husky, soulful, and introspective lower-register voice",
    avatarColor: "bg-pink-600 text-white",
    gender: "Female",
    tone: "Warm",
  },
  {
    id: "Umbriel",
    pitch: "Lower-middle",
    name: "Umbriel",
    description: "Quiet, shadow-like, and mysterious whispers for suspense",
    avatarColor: "bg-neutral-800 text-white",
    gender: "Male",
    tone: "Easy-going",
  },
  {
    id: "Vindemiatrix",
    pitch: "Middle",
    name: "Vindemiatrix",
    description: "Lively, expressive, and rapid-pacing character actor",
    avatarColor: "bg-emerald-400 text-black",
    gender: "Female",
    tone: "Gentle",
  },
  {
    id: "Zephyr",
    pitch: "Highere",
    name: "Zephyr",
    description: "Warm, steady, comforting, and documentary-like",
    avatarColor: "bg-teal-500 text-white",
    gender: "Neutral",
    tone: "Bright",
  },
  {
    id: "Zubenelgenubi",
    pitch: "Lower-middle",
    name: "Zubenelgenubi",
    description: "Smooth, jazz-like, deep, and slow resonant bass register",
    avatarColor: "bg-violet-800 text-white",
    gender: "Male",
    tone: "Casual",
  },
];

// TODO: Add supported APIs (generateContent, Interactions)
// TODO: Add other properties like input/output formats, token limits, voice model compatibility, etc.
export interface ModelOption {
  id: string;
  name: string;
  description: string;
  deprecated?: boolean;
  supportsInteractionsAPI: boolean;
}

export type ModelName =
  | "gemini-3.8-flash-tts"
  | "gemini-3.8-flash-lite-tts"
  | "gemini-3.1-flash-tts-preview"
  | "gemini-2.5-flash-tts"
  | "gemini-2.5-pro-tts"
  | "gemini-2.5-flash-lite-preview-tts";

export const GEMINI_MODELS: ModelOption[] = [
  {
    id: "gemini-3.8-flash-tts",
    name: "Gemini 3.8 Flash TTS (Preview)",
    description: "Primary high-quality TTS model",
    deprecated: false,
    supportsInteractionsAPI: true,
  },
  {
    id: "gemini-3.8-flash-lite-tts",
    name: "Gemini 3.1 Flash-Lite TTS",
    description: "Primary high-quality TTS model",
    deprecated: false,
    supportsInteractionsAPI: true,
  },
  {
    id: "gemini-3.1-flash-tts-preview",
    name: "Gemini 3.1 Flash TTS (Preview)",
    description: "Primary high-quality TTS model",
    deprecated: false,
    supportsInteractionsAPI: true,
  },
  {
    id: "gemini-2.5-flash-tts",
    name: "Gemini 2.5 Flash TTS",
    description: "Fast, balanced performance",
    deprecated: true,
    supportsInteractionsAPI: false,
  },
  {
    id: "gemini-2.5-pro-tts",
    name: "Gemini 2.5 Pro TTS",
    description: "High-intelligence, detailed generation",
    deprecated: true,
    supportsInteractionsAPI: false,
  },
  {
    id: "gemini-2.5-flash-lite-preview-tts",
    name: "Gemini 2.5 Flash Lite TTS (Preview)",
    description: "Lightweight, low latency",
    deprecated: true,
    supportsInteractionsAPI: false,
  },
];

// TODO: This will obviously need an optional voice_id... or else a new VoiceProfile interface will be needed which Speakers can optionally use in place of other settings. TBD.
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

export type AudioEncoding = "MP3" | "OGG_OPUS" | "L16" | "WAV" | "M4A" | "M4B" | "OGG_OPUS" | "ALAW" | "MULAW" | "FLAC";

// for testing Interactions API with response_format.mime_type
export type InteractionsMimeType = 'audio/mp3' | 'audio/ogg_opus' | 'audio/l16' | 'audio/wav' | 'audio/alaw' | 'audio/mulaw';

export interface Generation {
  id: string;
  snippetId: string | string[];
  speakerId: string | null;
  sceneId?: string | null;
  timestamp: string | number;
  model: string;
  text: string;
  audioMimeType: string;
  duration: number;
  temperature?: number;
  name?: string;
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
}

/*
  "id": "5b9c6970-8b30-4514-9948-dff4ffdb6334",
  "snippetId": "24fb5b3f-5ab8-4515-b410-dd2599813f5e",
  "speakerId": "a5f49cc4-ccf4-441e-b7ae-90fc20a161a1",
  "timestamp": "2026-08-07T11:21:31.707Z",
  "text": "I… may have implied, just a little, that… his eyes and teeth might go from… inside his head… to outside his head. On the condition that, uh… he looked at you the wrong way. Or at all. *Ahem*.",
  "audioMimeType": "audio/l16; rate=24000; channels=1",
  "duration": 72.4,
  "data": "b64"
*/

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
    model: ModelName;
    encoding: AudioEncoding;
    sampleRate: string;
    // Track 1 additional settings
    temperature?: number;
    apiType?: 'generateContent' | 'Interactions';
    generationOption?: 'individual' | 'combined';
    concatenationOption?: 'per-paragraph' | 'per-scene' | 'per-chapter' | 'full-project';
    bitRate?: string;
    apiKey?: string;
    audioExportFormat?: AudioEncoding;
    promptTemplate?: string;
    sheetsLoggingEnabled?: boolean;
    sheetsLoggingSpreadsheetId?: string;
    sheetsLoggingSpreadsheetUrl?: string;
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
  sheetsLoggingEnabled?: boolean;
  sheetsSpreadsheetId?: string;
  sheetsSpreadsheetUrl?: string;
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

export const INITIAL_PROJECT: Project = {
  title: "Big Tiddy Goth Lesbians",
  settings: {
    model: "gemini-3.1-flash-tts-preview",
    temperature: 1.0,
    encoding: "L16",
    audioExportFormat: "M4B",
    sampleRate: "24000",
  },
  speakers: [
    {
      id: "01a0adad-e9bc-7d72-b5d2-3b2e58c534f9",
      order: 0,
      name: "Evangeline",
      voice: "Pulcherrima",
      style:
        "You're a Big Tiddy Goth/Punk Lesbian (actually, your tiddy is average) and you're seen as a delinquent at school, especially by Catty Mean Girl Prep Tiffani who gives you grief at school, while she's secretly crushing on you. However, you practice 'radical ownership' and are able to defuse most of her comments by 'yes, and'-ing them, turning them back on her by becoming extremely flirtatious and forward while invading her physical space, causing her to retreat or go on the defensive, blushing and stammering. You are \"a bit\" of a tease (actually you're kind of sadistic), and you enjoy making her squirm... in multiple ways. You are confident, assertive, and unapologetically yourself. You have a dark sense of humor and a sharp wit, which you'll use to your advantage along with the aforementioned aspects to capture Tiffani's heart. Your voice is 100% mid-2000s goth/alt-girl depiction. Think Angelina Jolie in Hackers or Neve Campbell in Wild Things but with more leather jackets and ripped stockings and NO Matt Dillon.",
      role: "Big tiddy goth/punk lesbian",
      model: {
        supportsInteractionsAPI: false,
        name: "gemini-3.1-flash-tts-preview",
        id: "gemini-3.1-flash-tts-preview",
        description: "Gemini 3.1 Flash TTS Preview",
      },
      isNarrator: true,
    },
    {
      id: "01a0b1f3-5998-7313-8cff-72836b7524e7",
      order: 1,
      name: "Tiffani",
      voice: "Autonoe",
      style:
        "You're a Catty Mean Girl Prep, the queen bee, and also somewhat closeted lesbian. Your natural enemy (and secret crush) is Evangeline the Big Tiddy Goth/Punk Lesbian. You always try to bully her at school, almost always turning into a self-own as soon as she deflects it and flashes her big beautiful smile at you and gets very close, causing you to blush and stammer. You are a bit of a flirt, but you don't know how to handle it when Evangeline turns the tables on you and starts teasing you back, making you squirm and blush even more. You have a sharp tongue and a quick wit, but you're also insecure and unsure of how to express your feelings for Evangeline. Your voice is 100% 90s or mid-2000s preppy girl. Think Alicia Silverstone in Clueless or Denise Richards in Wild Things if you were less of a murderous piece of shit, and in love with Neve Campbell's character. Your warlots of short tartan skirts, argyle sweater-vests, kneesocks, white blouses, and ponytails.",
      role: "Catty Mean Girl Prep",
      model: {
        supportsInteractionsAPI: false,
        name: "gemini-3.1-flash-tts-preview",
        id: "gemini-3.1-flash-tts-preview",
        description: "Gemini 3.1 Flash TTS Preview",
      },
      isNarrator: true,
    },
  ],
  scenes: [
    {
      id: "01a0adab-02b0-7292-8727-da86dc535627",
      name: "A Gothic Mansion",
      order: 0,
      description:
        "Imagine a grand, old mansion perched atop a hill, shrouded in mist. The architecture is ornate, with towering spires and intricate stonework. The windows are tall and arched, some cracked and weathered by time. The front door is massive, made of dark wood with iron accents, slightly ajar as if inviting the brave to enter. The surrounding grounds are overgrown with wild ivy and twisted trees, their branches reaching out like skeletal fingers. A faint light flickers from within, casting eerie shadows that dance across the foggy landscape. The air is thick with the scent of damp earth and the distant sound of thunder echoes through the night.\nInside, a 'bad girl' goth lesbian and her preppy cheerleader classmate have been sent on a dare to explore it. The goth is less bothered by the surroundings and takes every opportunity to tease and flirt with the cheerleader, who is visibly nervous and on edge. The tension between them is palpable, with the goth's dark allure contrasting sharply against the cheerleader's bright and anxious demeanor. As they navigate the creaking hallways and shadowy corners, their interactions are charged with a mix of fear, excitement, and thick, sweaty sexual chemistry. Suddenly, they come across the master bedroom...",
    },
  ],
  chapters: [
    {
      id: "c1d2e3f4-5678-90ab-cdef-1234567890ab",
      order: 0,
      title: "Chapter 1",
      defaultSpeakerId: null,
      isCollapsed: false,
      snippets: [
        {
          id: generateId(),
          order: 0,
          text: "It was a dark and stormy night.",
          speakerId: "01a0adad-e9bc-7d72-b5d2-3b2e58c534f9",
          sceneId: "01a0adab-02b0-7292-8727-da86dc535627",
          status: "idle",
          isCollapsed: false,
          generations: [],
          activeGenerationId: null,
        },
      ],
    },
  ],
};
