/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI, GoogleGenAIOptions, Type, Modality, HarmCategory, HarmBlockThreshold, GenerateContentResponsePromptFeedback } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { VoiceName, InteractionsMimeType } from "./src/types";
import { parseMarkdown } from "./src/services/markdownParser";
import { getAudioDuration } from "./src/services/audioService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;
const DATA_DIR = path.join(__dirname, "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

const LOGS_DIR = path.join(__dirname, "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Log TTS request statistics to a daily JSONL file.
 */
function logTtsRequest(data: Record<string, any>) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const logFilePath = path.join(LOGS_DIR, `tts_requests_${today}.json`);
    const line = JSON.stringify({ timestamp: new Date().toISOString(), ...data }) + "\n";
    fs.appendFileSync(logFilePath, line, "utf8");
  } catch (err) {
    console.error("[Server] Failed to write to JSONL log:", err);
  }
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default demo project to showcase the audio visual experience
const SAMPLE_PROJECT: any[] = [
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
function loadProjects(): any[] {
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

function saveProjects(projects: any[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to write projects file:", err);
  }
}

// Clean quotes helper for environment variables
const cleanEnvVal = (val: string | undefined): string => {
  if (!val) return "";
  let trimmed = val.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.substring(1, trimmed.length - 1);
  }
  return trimmed.trim();
};

// Lazy load Gemini API
let geminiClientCache: GoogleGenAI | null = null;
function getGeminiClient(apiKeyOverride?: string) {
  if (apiKeyOverride && apiKeyOverride.trim()) {
    console.log("[Server] Initializing temporary GoogleGenAI with custom client API Key");
    return new GoogleGenAI({
      apiKey: apiKeyOverride.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-custom',
        }
      }
    });
  }

  // to be implemented
  const useInteractionsAPI = cleanEnvVal(process.env.USE_INTERACTIONS_API);
  const useVertexVal = cleanEnvVal(process.env.USE_VERTEX_AI);
  const isVertex = useVertexVal === "true";

  if (isVertex) {
    if (!geminiClientCache) {
      const gcpKey = cleanEnvVal(process.env.GCP_SERVICE_ACCOUNT_KEY);
      if (gcpKey) {
        try {
          const tempPath = path.join(process.cwd(), '.gcp-key.json');
          fs.writeFileSync(tempPath, gcpKey, 'utf-8');
          process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;
          console.log("[Server] Wrote GCP Service Account Key to", tempPath);
        } catch (err) {
          console.error("[Server] Failed to write service account key:", err);
        }
      }

      const project = cleanEnvVal(process.env.GCP_PROJECT_ID);
      const location = cleanEnvVal(process.env.GCP_LOCATION) || 'us-central1';

      console.log(`[Server] Initializing GoogleGenAI with Vertex API (Project: ${project}, Location: ${location})`);
      geminiClientCache = new GoogleGenAI({
        vertexai: true,
        project: project,
        location: location,
      });
    }
    return geminiClientCache;
  }

  // Fallback to Google AI Studio (API Key)
  const apiKey = cleanEnvVal(process.env.GEMINI_API_KEY);
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in the environment variables.");
    return null;
  }
  if (!geminiClientCache) {
    console.log("[Server] Initializing GoogleGenAI with AI Studio API Key");
    geminiClientCache = new GoogleGenAI({
      apiKey: apiKey,
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
  const projects = req.body as any[];
  saveProjects(projects);
  res.json({ success: true });
});

// Text-to-speech API route proxying to Gemini tts-preview
app.post("/api/tts/generate", async (req, res) => {
  const text = req.body.text;
  const requestSpeakers = req.body.speakers; // optional array of { name: string, voice: string }
  const speaker = req.body.speaker || req.body.voiceName || (requestSpeakers && requestSpeakers[0] ? requestSpeakers[0].voice : undefined);
  const interactionsAPI = req.body.useInteractionsAPI || false;
  const prevResponseId = req.body.responseId || '';
  const pacing = req.body.pacing;
  const pitch = req.body.pitch;
  const emotion = req.body.emotion;
  const customInstructions = req.body.customInstructions || req.body.styleInstruction;
  const model = req.body.modelId;
  const mimeType = req.body.mimeType || 'audio/l16';
  const apiKeyOverride = req.body.apiKey; // client override api key
  const temperature = req.body.temperature !== undefined ? parseFloat(req.body.temperature) : 1.0;
  const snippetCount = req.body.snippetCount;
  const rawTextChars = req.body.textChars;
  const rawTextWords = req.body.textWords;
  
  if (!text || (!speaker && (!requestSpeakers || requestSpeakers.length === 0))) {
    return res.status(400).json({ error: "Missing required parameters: text and speaker (or speakers array) are mandatory." });
  }

  let selectedModel = model || "gemini-3.1-flash-tts-preview";
  
  // Define style directions based on settings
  const styleNotes: string[] = [];

  if (customInstructions && customInstructions.trim()) {
    styleNotes.push(customInstructions.trim());
  }

  let formattedPrompt = text;
  if (styleNotes.length > 0 && !requestSpeakers) {
    formattedPrompt = `
      ${styleNotes.join(", ")}
      ${text.split("\n").join(" ")}
      `;
  }

  console.log(`[Server] Synthesizing Block with ${requestSpeakers} Speaker [${speaker || 'multi-speaker'}] using model [${selectedModel}] and temperature [${temperature ?? 'default'}]: "${formattedPrompt.substring(0, 100)}..."`);

  const ai = getGeminiClient(apiKeyOverride);
  if (!ai) {
    return res.status(500).json({ error: "Gemini API Client not configured. Please set the GEMINI_API_KEY environment variable." });
  }

  try {
    // track request time
    const start = performance.now();

    let audioData: string | null = null;
    let resMimeType: string | undefined = undefined;
    let responseId: string | undefined = undefined;
    let responseTime: number | undefined = undefined;
    let tokenCount: { prompt?: number; response?: number; total?: number } = {};

    if (interactionsAPI) {
      // Google's own fucking example
      /* const interaction = await client.interactions.create({
        model: "gemini-3.1-flash-tts-preview",
        input: "Say cheerfully: Have a wonderful day!",
        response_format: { type: 'audio' },
        generation_config: {
          speech_config: [
              { voice: 'Kore' }
          ]
        },
      }); */
      //#region interactionsAPI
      let response = await ai.interactions.create({
        model: selectedModel,
        response_modalities: [
          "audio"
        ],
        input: {
          type: "text",
          text: formattedPrompt
        },
        // previous_interaction_id: prevResponseId,
        response_format: {
          type: "audio",
          mime_type: mimeType,
        },
        /* safety_settings: [
          {
            type: "dangerous_content",
            threshold: "block_none"
          },
          {
            type: "sexually_explicit",
            threshold: "block_none"
          }
        ], */
        generation_config: {
          // temperature: temperature, // apparently this is NO LONGER SUPPORTED, WOW COOL, 8====D
          speech_config: (requestSpeakers && requestSpeakers.length > 1) ?
            requestSpeakers.map((s: any) => ({
              speaker: s.name,
              voice: s.voice
            })
          ) : [
            {
              voice: speaker
            }
          ]
        },
      });

      const interactionsRequestFullSample = {
        model: selectedModel,
        response_modalities: [
          "audio"
        ],
        input: {
          type: "text",
          text: formattedPrompt
        },
        previous_interaction_id: prevResponseId,
        response_format: {
          type: "audio",
          mime_type: mimeType,
        },
        safety_settings: [
          {
            type: "dangerous_content",
            threshold: "block_none"
          },
          {
            type: "sexually_explicit",
            threshold: "block_none"
          }
        ],
        generation_config: {
          temperature: temperature,
          speech_config: (requestSpeakers && requestSpeakers.length > 1) ?
            requestSpeakers.map((s: any) => ({
              speaker: s.name,
              voice: s.voice
            })
          ) : [
            {
              voice: speaker
            }
          ]
        },
      };

      // This should only show if it's running inside a browser where console.table() is available via devtools
      console.table(interactionsRequestFullSample);
      
      const httpStatus = response.sdkHttpResponse?.responseInternal?.status;
      const httpStatusText = response.sdkHttpResponse?.responseInternal?.statusText;
      
      if (httpStatus && httpStatus !== 200) {
        return res.status(httpStatus).json({ error: `HTTP Error ${httpStatus} received from API: ${httpStatusText}` });
      }

      audioData = response.output_audio?.data || null;
      resMimeType = response.output_audio?.mime_type || 'audio/l16';
      const finishReason = response.status; // success == "completed"
      
      responseId = response.id;
      if (response.updated && response.created) {
        responseTime = Date.parse(response.updated) - Date.parse(response.created);
      }

      tokenCount = {
        prompt: response.usage?.total_input_tokens,
        response: response.usage?.total_output_tokens,
        total: response.usage?.total_tokens,
      };

      if (!audioData) {
        const debugDetails: any = {
          status: finishReason,
          responseTime: responseTime,
          measuredTime: performance.now() - start,
          responseId: responseId,
          tokenCount: tokenCount,
        };

        console.warn("[Server.Interactions] Empty audio response debug details:", JSON.stringify(debugDetails, null, 2));
        const detailsStr = JSON.stringify(debugDetails);

        return res.status(500).json({ 
          error: `Interactions API returned an empty audio response. Details: ${detailsStr}`,
          details: debugDetails
        });
      }
      //endregion
    }
    else {
      //region generateContent
      let response = await ai.models.generateContent({
        model: selectedModel,
        contents: [{ role: "user", parts: [{ text: formattedPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          temperature: typeof temperature === 'number' && !isNaN(temperature) ? temperature : undefined,
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.OFF
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.OFF
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.OFF
            },
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.OFF
            }
          ],
          speechConfig: requestSpeakers && requestSpeakers.length > 1 ? {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: requestSpeakers.map((s: any) => ({
                speaker: s.name,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: s.voice }
                }
              }))
            }
          } : {
            // single-speaker config request
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: speaker },
            }
          },
        },
      });

      const httpStatus = response.sdkHttpResponse?.responseInternal?.status;
      const httpStatusText = response.sdkHttpResponse?.responseInternal?.statusText;
      
      if (httpStatus && httpStatus !== 200) {
        return res.status(httpStatus).json({ error: `HTTP Error ${httpStatus} received from API: ${httpStatusText}` });
      }

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      audioData = inlineData?.data || null;
      resMimeType = inlineData?.mimeType || 'audio/l16';

      responseId = response.responseId;
      if (response.createTime) {
        responseTime = Date.now() - Date.parse(response.createTime);
      }

      tokenCount = {
        prompt: response.usageMetadata?.promptTokenCount,
        response: response.usageMetadata?.candidatesTokenCount,
        total: response.usageMetadata?.totalTokenCount,
      };

      if (!audioData) {
        const firstCandidate = response.candidates?.[0];
        const finishReason = firstCandidate?.finishReason;
        const safetyRatings = firstCandidate?.safetyRatings;
        const promptFeedback = response.promptFeedback;
        const promptFeedbackReason = response.promptFeedback?.blockReason;
        const promptFeedbackMessage = response.promptFeedback?.blockReasonMessage;

        const debugDetails: any = {
          responseId: responseId,
          responseTime: responseTime,
          tokenCount: tokenCount
        };

        if (finishReason) {
          debugDetails.finishReason = finishReason;
        }
        if (safetyRatings && safetyRatings.length > 0) {
          debugDetails.candidateSafetyRatings = safetyRatings;
        }
        if (promptFeedback) {
          if (promptFeedbackReason === "PROHIBITED_CONTENT") {
            debugDetails.promptFeedback = `The model thought the prompt was too short or ambiguous, so it returned a finishReason of ${finishReason}, and a *false positive* PROHIBITED_CONTENT with the following message: ${promptFeedbackMessage}`;
          }
          else {
            debugDetails.promptFeedback = `${promptFeedbackReason}: ${promptFeedbackMessage}`;
          }
        }

        console.warn("[Server.generateContent] Empty audio response debug details:", JSON.stringify(debugDetails, null, 2));
        const detailsStr = JSON.stringify(debugDetails);

        return res.status(500).json({ 
          error: `generateContent API returned an empty audio response. Details: ${detailsStr}`,
          details: debugDetails
        });
      }
      //endregion
    }

    // log request time
    const elapsedMs = performance.now() - start;
    const elapsedSec = elapsedMs / 1000;

    const charCount = text.length;
    const wordCount = text.trim().split(/\s+/).length;
    const reqCharCount = formattedPrompt.length;
    const reqWordCount = formattedPrompt.split(/\s+/).length;

    try {
      var audioDuration = await getAudioDuration(audioData, resMimeType);
    }
    catch (err: any) {
      console.error(`Couldn't get audioDuration(audioData[${audioData.length}], ${resMimeType}) again. ${err.message}`)
    }
    
    // Write request statistics to daily JSONL log
    const logInfo = {
      apiType: interactionsAPI ? 'interactions' : 'generateContent',
      model: selectedModel,
      speaker: speaker || 'multi-speaker',
      rawTextChars,
      charCount,
      reqCharCount,
      rawTextWords,
      wordCount,
      reqWordCount,
      elapsedMs,
      snippetCount,
      promptTokens: tokenCount.prompt || 0,
      responseTokens: tokenCount.response || 0,
      totalTokens: tokenCount.total || 0,
      audioDuration: audioDuration,
      responseId: responseId || null
    };

    logTtsRequest(logInfo);

    // console.table(logInfo);

    console.info(`Response [${elapsedSec.toFixed(3)}s]: ${snippetCount} snippets, ${rawTextChars}->${charCount}->${reqCharCount} char; ${rawTextWords}->${wordCount}->${reqWordCount} words. Tokens: prompt=${tokenCount.prompt}, resp=${tokenCount.response}, total=${tokenCount.total}.`);
    console.debug(logInfo);
    
    return res.json({
      success: true,
      audioData: audioData,
      mimeType: resMimeType,
      compiledPrompt: formattedPrompt,
      responseId: responseId,
      responseTime: responseTime,
      promptTokens: tokenCount.prompt || 0,
      responseTokens: tokenCount.response || 0,
      totalTokens: tokenCount.total || 0,
      fallback: false
    });

  } catch (err: any) {
    const errMsg = err.message || JSON.stringify(err);
    console.error("Gemini Speech generation failed:", errMsg);
    return res.status(500).json({ error: `Gemini Speech generation failed: ${errMsg}` });
  }
});

// GET /api/tts/stats - returns summary of today's TTS activity
app.get("/api/tts/stats", (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const logFilePath = path.join(LOGS_DIR, `tts_requests_${today}.jsonl`);
    if (!fs.existsSync(logFilePath)) {
      return res.json({
        todayRequests: 0,
        totalChars: 0,
        totalTokens: 0,
        lastRequestTime: null,
      });
    }

    const lines = fs.readFileSync(logFilePath, "utf8").trim().split("\n").filter(Boolean);
    let totalChars = 0;
    let totalTokens = 0;
    let lastRequestTime: string | null = null;

    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        totalChars += item.reqCharCount || item.charCount || 0;
        totalTokens += item.totalTokens || 0;
        lastRequestTime = item.timestamp;
      } catch {}
    }

    return res.json({
      todayRequests: lines.length,
      totalChars,
      totalTokens,
      lastRequestTime,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/count-tokens - counts tokens for a text prompt using Gemini countTokens API
app.post("/api/count-tokens", async (req, res) => {
  try {
    const { text, modelId } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text' property" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const estimated = Math.ceil(text.length / 4);
      return res.json({ totalTokens: estimated, estimated: true });
    }

    const model = modelId || "gemini-3.1-flash-tts-preview";
    const result = await ai.models.countTokens({
      model: model,
      contents: [{ role: "user", parts: [{ text }] }]
    });

    return res.json({
      totalTokens: result.totalTokens ?? Math.ceil(text.length / 4),
      estimated: false
    });
  }
  catch (err: any) {
    console.warn("[Server] countTokens failed, using fallback estimate:", err?.message);
    const estimated = Math.ceil((req.body?.text || "").length / 4);
    return res.json({ totalTokens: estimated, estimated: true });
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
    // If no AI client available, error
    console.warn("No key found, parsing script using markdown importer");
    const fallbackProject = parseMarkdown(screenplayText);
    return res.json({ blocks: fallbackProject });
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
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    const httpStatus = response.sdkHttpResponse?.responseInternal?.status;
    const httpStatusText = response.sdkHttpResponse?.responseInternal?.statusText;
    
    if (httpStatus && httpStatus !== 200) {
      throw new Error(`HTTP Error ${httpStatus} received from API: ${httpStatusText}`);
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
    const errMsg = err.message || JSON.stringify(err);
    console.error("Script parsing with AI failed. Import Markdown text manually.", errMsg);
    return res.status(500).json({ error: `Script parsing with AI failed: ${errMsg}` });
  }
});

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
