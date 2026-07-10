/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates text-to-speech audio by proxying the request through the server backend.
 * This ensures the API keys and configurations are handled securely server-side.
 */
export async function generateTTS(
  text: string, 
  voiceName: string, 
  styleInstruction: string | undefined, 
  modelName: string
): Promise<{data: string, mimeType: string}> {
  if (!text.trim()) {
    throw new Error("Text is empty");
  }

  try {
    console.info(`[Client] Requesting TTS. Model: ${modelName}, Voice: ${voiceName}`);
    
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
      }),
    });

    if (!response.ok) {
      let errorMsg = `Server error ${response.status}`;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch (e) {
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
