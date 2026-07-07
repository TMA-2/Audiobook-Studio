/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Project, Chapter, NarrationBlock, VoiceName } from "./src/types.js";

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default demo project to showcase the audio visual experience
const SAMPLE_PROJECT: Project[] = [
  {
    id: "whispering-shadows",
    name: "The Whispering Shadows",
    description: "A short gothic dialogue scene demonstrating pre-configured Speakers/Roles, global performance directives, and dynamic model selection.",
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    speakers: [
      {
        id: "spk-zephyr",
        name: "Narrator (Zephyr)",
        isNarrator: true,
        voice: "Zephyr",
        model: "gemini-3.1-flash-tts-preview",
        pacing: "slow",
        pitch: "normal",
        emotion: "nominous",
        customInstructions: "In a sweeping, atmospheric documentary voice"
      },
      {
        id: "spk-kore",
        name: "Elizabeth (Kore)",
        isNarrator: false,
        voice: "Kore",
        model: "gemini-3.1-flash-tts-preview",
        pacing: "slow",
        pitch: "normal",
        emotion: "whispering",
        customInstructions: "Trembling with subtle, creeping fear, hushed voice"
      },
      {
        id: "spk-puck",
        name: "Arthur (Puck)",
        isNarrator: false,
        voice: "Puck",
        model: "gemini-3.1-flash-tts-preview",
        pacing: "normal",
        pitch: "normal",
        emotion: "excited",
        customInstructions: "Reassuring yet youthful and energetic"
      },
      {
        id: "spk-charon",
        name: "Stranger (Charon)",
        isNarrator: false,
        voice: "Charon",
        model: "gemini-3.1-flash-tts-preview",
        pacing: "slow",
        pitch: "low",
        emotion: "none",
        customInstructions: "Gentlemanly, smooth, incredibly deep, with a haunting chilling undertone"
      }
    ],
    chapters: [
      {
        id: "chap-1",
        projectId: "whispering-shadows",
        title: "Chapter 1: An Unexpected Visitor",
        order: 1,
        blocks: [
          {
            id: "block-1",
            chapterId: "chap-1",
            speakerId: "spk-zephyr",
            text: "The wind howled outside the old manor, throwing sheets of icy rain against the leaded glass windows. Inside, the limestone fireplace had dwindled to a heap of dying embers, casting long, shivering shadows across the floor.",
            status: "idle",
            audioData: null,
            duration: null,
            errorMessage: null
          },
          {
            id: "block-2",
            chapterId: "chap-1",
            speakerId: "spk-kore",
            text: "Did you hear that Arthur? I swore there was someone, or some thing, tapping against the mahogany glass at the balcony.",
            status: "idle",
            audioData: null,
            duration: null,
            errorMessage: null
          },
          {
            id: "block-3",
            chapterId: "chap-1",
            speakerId: "spk-puck",
            text: "Elizabeth, you must calm down. It is only the birch branches caught in the gables. Look, the tea is still warm—there is nothing to fear!",
            status: "idle",
            audioData: null,
            duration: null,
            errorMessage: null
          },
          {
            id: "block-4",
            chapterId: "chap-1",
            speakerId: "spk-charon",
            text: "A carriage breakdown on the low cliff is a terrible fate, wouldn't you say? I must apologize for invading your cozy retreat, but your lock was quite fragile.",
            status: "idle",
            audioData: null,
            duration: null,
            errorMessage: null
          },
          {
            id: "block-5",
            chapterId: "chap-1",
            speakerId: "spk-kore",
            text: "Arthur, get behind me! Who are you? How did you bypass the outer iron gates?",
            status: "idle",
            audioData: null,
            duration: null,
            errorMessage: null
          }
        ]
      }
    ]
  }
];

// Initialize local project cache with default sample if needed
function loadProjects(): Project[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read projects file:", err);
  }
  // Fallback to sample, and write it
  saveProjects(SAMPLE_PROJECT);
  return SAMPLE_PROJECT;
}

function saveProjects(projects: Project[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to write projects file:", err);
  }
}

// Lazy load Gemini API
let geminiClientCache: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not defined in the environment variables.");
    return null;
  }
  if (!geminiClientCache) {
    geminiClientCache = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClientCache;
}

// ---------------------- API ROUTES ----------------------

// Get existing projects
app.get("/api/projects", (req, res) => {
  const projects = loadProjects();
  res.json(projects);
});

// Update standard projects database
app.post("/api/projects", (req, res) => {
  const projects = req.body as Project[];
  saveProjects(projects);
  res.json({ success: true });
});

// Text-to-speech API route proxying to Gemini tts-preview
app.post("/api/tts/generate", async (req, res) => {
  const { text, speaker, pacing, pitch, emotion, customInstructions, model } = req.body;
  
  if (!text || !speaker) {
    return res.status(400).json({ error: "Missing required parameters: text and speaker are mandatory." });
  }

  const selectedModel = model || "gemini-3.1-flash-tts-preview";
  
  // Define style directions based on settings
  const styleNotes: string[] = [];
  if (pacing === 'slow') {
    styleNotes.push("speak slowly, with significant pauses between sentences and emotional gravity");
  } else if (pacing === 'fast') {
    styleNotes.push("speak fast, in a hurried, rapid pacing with minimal pause");
  }

  if (pitch === 'low') {
    styleNotes.push("use a low pitch and deep resonant register");
  } else if (pitch === 'high') {
    styleNotes.push("use a high pitch, higher vocal range");
  }

  switch (emotion) {
    case 'laughing':
      styleNotes.push("giggle occasionally, amused, say with a chuckle in the words");
      break;
    case 'sad':
      styleNotes.push("sadly, with a breaking voice, tearful, choking up");
      break;
    case 'excited':
      styleNotes.push("extremely enthusiastic, bright, cheerful and highly energetic");
      break;
    case 'whispering':
      styleNotes.push("whisper very quietly, hush, conspiratorial tone, strictly whisper");
      break;
    case 'shouting':
      styleNotes.push("speak in a dramatic, shouting, strong powerful voice");
      break;
    case 'nominous':
      styleNotes.push("spooky, dark, slow warning whisper tone, ominous, cinematic mystery narrator style");
      break;
    case 'gasping':
      styleNotes.push("panicked, gasping for breath between words, short quick breathing sounds");
      break;
    default:
      break;
  }

  if (customInstructions && customInstructions.trim()) {
    styleNotes.push(customInstructions.trim());
  }

  let formattedPrompt = text;
  if (styleNotes.length > 0) {
    formattedPrompt = `[Voice performance cue: ${styleNotes.join(", ")}]\n\n${text}`;
  }

  console.log(`Synthesizing Block with Speaker [${speaker}] using model [${selectedModel}]: "${formattedPrompt}"`);

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(500).json({ error: "Gemini API Client not configured. Please set the GEMINI_API_KEY environment variable." });
  }

  try {
    // Try standard UPPERCASE responseModalities first
    let response = await ai.models.generateContent({
      model: selectedModel,
      contents: [{ parts: [{ text: formattedPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE
          }
        ],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: speaker },
          },
        },
      },
    });

    const httpStatus = response.sdkHttpResponse.responseInternal.status;
    const httpStatusText = response.sdkHttpResponse.responseInternal.statusText;
    
    if(httpStatus != 400) {
      return res.status(httpStatus).json({error: `HTTP Error ${httpStatus} received from API: ${httpStatusText}`})
    }

    let audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

    if (!audioData) {
      const responseID = response.responseId;
      const responseFeedback = response.promptFeedback;
      return res.status(500).json({ error: `Gemini API returned an empty audio response. Response ID: ${responseID}; Feedback: ${responseFeedback}` });
    }

    const tokenCount = response.usageMetadata.totalTokenCount;
    console.info("Response token usage: ", tokenCount);
    
    return res.json({
      success: true,
      audioData: audioData,
      compiledPrompt: formattedPrompt,
      fallback: false
    });

  } catch (err: any) {
    const errMsg = err.message || JSON.stringify(err);
    console.error("Gemini Speech generation failed:", errMsg);
    return res.status(500).json({ error: `Gemini Speech generation failed: ${errMsg}` });
  }
});

// Import Screenplay screenplay parsing endpoint using Gemini 3.5-flash
app.post("/api/project/import-parse", async (req, res) => {
  const { screenplayText } = req.body;
  if (!screenplayText || !screenplayText.trim()) {
    return res.status(400).json({ error: "No screenplay text was provided." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // If no AI client available, fallback parsing with custom JS parser
    console.log("No key found, parsing script using local text-rules");
    const fallbackList = fallbackScriptParser(screenplayText);
    return res.json({ blocks: fallbackList });
  }

  try {
    const prompt = `You are a script parsing utility for Audiobook Production Studio.
Take the following raw book translation draft or scripted theater text and segment it neatly into individual, continuous narrative blocks (maximum 15 blocks total to make a demo-safe preview).

For each block, determine:
1. The most appropriate voice profile based on text structure. Map to one of our prebuilt voice names exactly:
   - "Zephyr" (Ideal for neutral narrators, ambient scene description)
   - "Kore" (Female characters, energetic, vocal and clear lines)
   - "Puck" (Youthful/friendly characters, vibrant and lively)
   - "Charon" (Older/deep/grave/scholarly males, deep pitch)
   - "Fenrir" (Gritty, bold, dark, intense characters)
2. Determine if the text specifies any emotional cues (such as [coughing], [sad], (whispering), or shouting triggers), and map to one of: "none", "laughing", "sad", "excited", "whispering", "shouting", "nominous", "gasping"
3. Clean the raw text by removing bracketed stage directions so that it reads cleanly as an audiobook sentence.
4. Estimate if pacing should be "slow", "normal", or "fast" based on drama.
5. Provide a short custom voice direction instruction string (e.g., "reassuringly", "gothic dread", "curious").

Return the result STRICTLY as a JSON array with this structure:
[
  {
    "speaker": "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr",
    "text": "cleaned narrative string",
    "pacing": "slow" | "normal" | "fast",
    "pitch": "low" | "normal" | "high",
    "emotion": "none" | "laughing" | "sad" | "excited" | "whispering" | "shouting" | "nominous" | "gasping",
    "customInstructions": "Short context description"
  }
]

Do not return any markdown markup outside the JSON. Return only a raw, valid JSON block.

RAW TEXT:
${screenplayText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    const httpStatus = response.sdkHttpResponse.responseInternal.status;
    const httpStatusText = response.sdkHttpResponse.responseInternal.statusText;
    
    if(httpStatus != 400) {
      throw new Error(`HTTP Error ${httpStatus} received from API: ${httpStatusText}`)
    }

    if (!text) {
      const responseID = response.responseId;
      const responseFeedback = response.promptFeedback;
      throw new Error(`No response text from parsing model. Response ID: ${responseID}; Feedback: ${responseFeedback}`);
    }

    const tokenCount = response.usageMetadata.totalTokenCount;
    console.info("Response token usage: ", tokenCount)

    const blocks = JSON.parse(text);
    res.json({ blocks });

  } catch (err: any) {
    console.warn("Script parsing with AI failed, invoking local fallback rules:", err);
    const fallbackList = fallbackScriptParser(screenplayText);
    res.json({ blocks: fallbackList });
  }
});

// Helper parsing when no AI acts
function fallbackScriptParser(text: string): any[] {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const blocks: any[] = [];
  
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    
    // Check if format is Speaker: "Dialogue" or similar
    let speaker: VoiceName = "Zephyr";
    let blockText = line;
    let emotion = "none";
    
    // Try to extract Speaker name
    const match = line.match(/^\[?([A-Za-z]+)\]?:?\s*(.*)$/);
    if (match && match[1]) {
      const parsedSpeaker = match[1].toLowerCase();
      if (parsedSpeaker.includes("narrator") || parsedSpeaker.includes("zephyr")) {
        speaker = "Zephyr";
      } else if (parsedSpeaker.includes("kore") || parsedSpeaker.includes("elizabeth") || parsedSpeaker.includes("jane") || parsedSpeaker.includes("woman")) {
        speaker = "Kore";
      } else if (parsedSpeaker.includes("puck") || parsedSpeaker.includes("arthur") || parsedSpeaker.includes("boy")) {
        speaker = "Puck";
      } else if (parsedSpeaker.includes("charon") || parsedSpeaker.includes("father") || parsedSpeaker.includes("man")) {
        speaker = "Charon";
      } else if (parsedSpeaker.includes("fenrir") || parsedSpeaker.includes("wolf") || parsedSpeaker.includes("guard")) {
        speaker = "Fenrir";
      } else {
        // Assign cyclically for fun
        const voices: VoiceName[] = ["Kore", "Puck", "Charon", "Fenrir"];
        speaker = voices[i % voices.length];
      }
      blockText = match[2] || line;
    }

    // Try to extract stage directions like [whispering]
    const emotionMatch = blockText.match(/\[([a-z]+)\]/i);
    if (emotionMatch && emotionMatch[1]) {
      const e = emotionMatch[1].toLowerCase();
      if (["laughing", "sad", "excited", "whispering", "shouting", "gasping"].includes(e)) {
        emotion = e;
      }
      blockText = blockText.replace(/\[.*?\]/g, "");
    }
    
    blocks.push({
      speaker,
      text: blockText.replace(/"/g, "").trim(),
      pacing: "normal",
      pitch: "normal",
      emotion: emotion,
      customInstructions: "Imported via local script parsing rules"
    });
  }
  
  return blocks;
}

// ---------------------- VITE SERVING ----------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Audiobook Production Studio backend active on http://localhost:${PORT}`);
  });
}

startServer();
