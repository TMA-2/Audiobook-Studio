import { SettingFieldSchema } from '../types';

// This should eventually be re-worked to literally use a JSON schema layout, so...
export const PROJECT_SETTINGS_SCHEMAS: SettingFieldSchema[] = [
  // Generation Category
  {
    key: 'model',
    label: 'Model',
    description: 'The Gemini voice model to use for synthesis.',
    type: 'enum',
    options: [
      { value: 'gemini-3.1-flash-tts-preview', label: '3.1 Flash (TTS Preview) - Best Quality' },
      { value: 'gemini-2.5-flash-tts', label: '2.5 Flash TTS' },
      { value: 'gemini-2.5-pro-tts', label: '2.5 Pro TTS - Creative & Intelligent' },
      { value: 'gemini-2.5-flash-lite-preview-tts', label: '2.5 Flash Lite TTS' }
    ],
    category: 'generation'
  },
  {
    key: 'temperature',
    label: 'Temperature',
    description: 'Controls randomness/creativity of performance expression. Lower values are more consistent.',
    type: 'number',
    min: 0.0,
    max: 2.0,
    step: 0.1,
    placeholder: '1.0',
    category: 'generation'
  },
  {
    key: 'encoding',
    label: 'Audio Encoding',
    description: 'The format of the synthesized audio clips.',
    type: 'enum',
    options: [
      { value: 'M4A', label: 'M4A' },
      { value: 'OGG_OPUS', label: 'OGG OPUS' },
      { value: 'MP3', label: 'MP3' },
      { value: 'WAV', label: 'WAV (Linear16)' }
    ],
    category: 'generation'
  },
  {
    key: 'sampleRate',
    label: 'Sample Rate',
    description: 'Audio frequency in Hz.',
    type: 'enum',
    options: [
      { value: '16000', label: '16 kHz' },
      { value: '24000', label: '24 kHz' },
      { value: '44100', label: '44.1 kHz' },
      { value: '48000', label: '48 kHz' }
    ],
    category: 'generation'
  },
  {
    key: 'generationOption',
    label: 'Audio Generation Strategy',
    description: 'Defines how API requests are structured for audio synthesis. Combined mode batches multi-speaker requests (Max 2 speakers / 8KB payload per request).',
    type: 'enum',
    options: [
      { value: 'individual', label: 'Individual snippet generation (1 API request per snippet)' },
      { value: 'combined', label: 'Combined multi-speaker generation (Max 2 speakers / 8KB)' }
    ],
    category: 'generation'
  },

  // Export Category
  {
    key: 'audioExportFormat',
    label: 'Audio Export Format',
    description: 'Preferred container format for project and chapter compilation exports.',
    type: 'enum',
    options: [
      { value: 'M4A', label: 'M4A (AAC)' },
      { value: 'M4B', label: 'M4B (Audiobook with Metadata)' },
      { value: 'MP3', label: 'MP3 (MPEG-Audio)' },
      { value: 'OGG_OPUS', label: 'OGG OPUS' },
      { value: 'WAV', label: 'WAV' },
      { value: 'FLAC', label: 'FLAC (Lossless)' }
    ],
    category: 'export'
  },
  {
    key: 'concatenationOption',
    label: 'Concatenation Strategy',
    description: 'Define how exported audio is structured and compiled.',
    type: 'enum',
    options: [
      { value: 'per-paragraph', label: 'Separate file per text snippet' },
      { value: 'per-scene', label: 'Separate file per scene' },
      { value: 'per-chapter', label: 'Single consolidated file per chapter' },
      { value: 'full-project', label: 'Compile full audiobook to one file' }
    ],
    category: 'export'
  },
  {
    key: 'bitRate',
    label: 'Export Bit Rate',
    description: 'Audio bit rate for compressed exports.',
    type: 'enum',
    options: [
      { value: '64kbps', label: '64 kbps (Low)' },
      { value: '128kbps', label: '128 kbps (Standard)' },
      { value: '192kbps', label: '192 kbps (High)' },
      { value: '320kbps', label: '320 kbps (Ultra)' }
    ],
    category: 'export'
  },

  // API Category
  {
    key: 'apiType',
    label: 'API Execution Method',
    description: 'Choose between the modern generateContent API or the new speech-generation Interactions API.',
    type: 'enum',
    options: [
      { value: 'generateContent', label: 'Standard generateContent' },
      { value: 'Interactions', label: 'Interactions API' }
    ],
    category: 'api'
  },
  {
    key: 'apiKey',
    label: 'API Key (Optional Override)',
    description: 'Provide an alternative API key to override the system key. Stored locally in your browser.',
    type: 'string',
    placeholder: 'AIzaSy...',
    category: 'api'
  }
];
