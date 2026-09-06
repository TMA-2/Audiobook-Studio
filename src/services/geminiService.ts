/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Speaker, InteractionsMimeType} from "../types";

export interface TTSResult {
  data: string;
  mimeType: string;
  responseTime?: number;
  promptTokens?: number;
  responseTokens?: number;
  totalTokens?: number;
  compiledPrompt?: string;
}

/**
 * Generates text-to-speech audio by proxying the request through the server backend.
 * This ensures the API keys and configurations are handled securely server-side.
 */
export async function generateTTS(
  text: string, 
  voiceName: string,
  styleInstruction: string | undefined, 
  modelId: string,
  options?: {
    // NOTE: the Interactions API only supports Gemini 3.1 Flash TTS, not any of the 2.5 models, so there should probably be a chcek in the interface that if Interactions is selected, it forces 3.5 and disables the control
    useInteractionsAPI?: boolean | false;
    apiKey?: string;
    mimeType?: InteractionsMimeType | 'audio/l16'; 
    temperature?: number | 1.0;
    speakers?: Array<{ name: string, voice: string }>;
    snippetCount?: number | 1;
    textChars?: number;
    textWords?: number;
  }
): Promise<TTSResult> {
  if (!text.trim()) {
    throw new Error("Text is empty");
  }

  try {
    // update 
    console.info(`[Client] Requesting TTS. Model: ${modelId}, Voice: ${voiceName || 'multi'}, Temp: ${options?.temperature ?? 'default'}`);    
    const response = await fetch("/api/tts/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voiceName,
        styleInstruction,
        modelId,
        mimeType: options?.mimeType,
        useInteractionsAPI: options?.useInteractionsAPI,
        apiKey: options?.apiKey,
        temperature: options?.temperature,
        speakers: options?.speakers,
        snippetCount: options?.snippetCount,
        textChars: options?.textChars,
        textWords: options?.textWords
      }),
    });

    if (!response.ok) {
      let errorMsg = `Server error ${response.status}`;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      }
      catch (e) {
        try {
          const textStatus = await response.text();
          if (textStatus) errorMsg = textStatus;
        } catch (_) {}
      }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    if (!result.success || !result.audioData) {
      throw new Error(result.error || "Failed to generate text-to-speech audio.");
    }

    return { 
      data: result.audioData, 
      mimeType: result.mimeType || "audio/pcm",
      responseTime: result.responseTime,
      promptTokens: result.promptTokens,
      responseTokens: result.responseTokens,
      totalTokens: result.totalTokens,
      compiledPrompt: result.compiledPrompt
    };
  }
  catch (error: any) {
    console.error("[Client] TTS Generation Error:", error);
    throw error;
  }
}

/**
 * Queries the Gemini countTokens endpoint or fallback estimator to get prompt token count.
 * @param text The input prompt or transcript text to evaluate
 * @param modelId Model ID to count tokens against
 * @returns Total token count
 */
export async function getTokenCount(text: string, modelId: string = 'gemini-3.1-flash-tts-preview'): Promise<number> {
  if (!text || !text.trim()) {
    return 0;
  }
  try {
    const res = await fetch("/api/count-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, modelId })
    });
    if (!res.ok) {
      return Math.ceil(text.length / 4);
    }
    const data = await res.json();
    return data.totalTokens || Math.ceil(text.length / 4);
  }
  catch (err) {
    console.warn("[Client] getTokenCount request failed, using estimate:", err);
    return Math.ceil(text.length / 4);
  }
}

