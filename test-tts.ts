import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";

const API_KEY = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Quick wrapper with timeout to keep diagnostic fast
async function voiceTest(voiceName: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: "Hello there." }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });
    clearTimeout(timeoutId);
    const parts = response.candidates?.[0]?.content?.parts;
    const data = parts?.[0]?.inlineData?.data;
    if (data) {
      return `SUCCESS (length ${data.length})`;
    } else {
      return `NO_DATA (parts structure: ${JSON.stringify(parts ? parts.map(p => Object.keys(p)) : 'none')})`;
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return `ERROR: ${err.message || err}`;
  }
}

async function run() {
  const logFile = "test-log.txt";
  fs.writeFileSync(logFile, "Starting fast parallel voice casing tests...\n");
  
  const voicesToTest = [
    "Kore", "kore",
    "Puck", "puck",
    "Charon", "charon",
    "Fenrir", "fenrir",
    "Zephyr", "zephyr"
  ];
  
  for (const voice of voicesToTest) {
    fs.appendFileSync(logFile, `Testing: "${voice}"...\n`);
    console.log(`Testing: "${voice}"...`);
    const result = await voiceTest(voice);
    fs.appendFileSync(logFile, `-> Result for "${voice}": ${result}\n`);
    console.log(`-> Result for "${voice}": ${result}`);
  }
  
  fs.appendFileSync(logFile, "Done testing.\n");
}

run();
