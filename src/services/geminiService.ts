/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Speaker, InteractionsMimeType} from "../types";

/**
 * Generates text-to-speech audio by proxying the request through the server backend.
 * This ensures the API keys and configurations are handled securely server-side.
 */
export async function generateTTS(
  text: string, 
  voiceName: string,
  styleInstruction: string | undefined, 
  modelName: string,
  options?: {
    // NOTE: the Interactions API only supports Gemini 3.1 Flash TTS, not any of the 2.5 models, so there should probably be a chcek in the interface that if Interactions is selected, it forces 3.5 and disables the control
    useInteractionsAPI?: boolean | false;
    apiKey?: string;
    temperature?: number | 1.0;
    speakers?: Array<{ name: string, voice: string }>;
  }
):Promise<{data: string, mimeType: string}> {
  if (!text.trim()) {
    throw new Error("Text is empty");
  }

  try {
    // update 
    console.info(`[Client] Requesting TTS. Model: ${modelName}, Voice: ${voiceName || 'multi'}, Temp: ${options?.temperature ?? 'default'}`);    
    const response = await fetch("/api/tts/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voiceName,
        styleInstruction,
        modelName,
        useInteractionsAPI: options?.useInteractionsAPI,
        apiKey: options?.apiKey,
        temperature: options?.temperature,
        speakers: options?.speakers,
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
      mimeType: result.mimeType || "audio/pcm" 
    };
  } catch (error: any) {
    console.error("[Client] TTS Generation Error:", error);
    throw error;
  }
}
