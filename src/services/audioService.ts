let currentAudio: HTMLAudioElement | null = null;

export function createWavBlob(pcmData: Uint8Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Calculates duration of raw 16-bit mono PCM data.
 * Gemini TTS models (including 2.5 and 3.1) return raw 16-bit mono PCM.
 * Formula: bytes / (sampleRate * channels * bytesPerSample)
 */
export function getAudioDurationFallback(bytes: Uint8Array, sampleRate: number = 24000): number {
  const bytesPerSample = 2; // 16-bit
  const channels = 1; // Mono
  return bytes.length / (sampleRate * channels * bytesPerSample);
}

export function getAudioDuration(base64: string, mimeType: string, sampleRateStr: string = '24000'): Promise<number> {
  return new Promise((resolve) => {
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const sampleRate = parseInt(sampleRateStr) || 24000;

      // If raw PCM or WAV, calculate directly to avoid browser metadata loading issues
      if (mimeType.includes('pcm') || mimeType.includes('wav') || !mimeType) {
        const duration = getAudioDurationFallback(bytes, sampleRate);
        resolve(duration);
        return;
      }

      // Fallback to browser Audio element metadata loading for compressed formats
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve(getAudioDurationFallback(bytes, sampleRate));
      }, 1000);

      audio.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout);
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        const resolvedDuration = isNaN(duration) || !isFinite(duration) ? getAudioDurationFallback(bytes, sampleRate) : duration;
        resolve(resolvedDuration);
      });

      audio.addEventListener('error', () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        resolve(getAudioDurationFallback(bytes, sampleRate));
      });
    } catch (e) {
      console.error("Error parsing audio duration:", e);
      resolve(0);
    }
  });
}

/**
 * Concatenates multiple base64 raw PCM audio chunks into a single WAV Blob.
 */
export function concatenatePCMChunks(base64Chunks: string[], sampleRate: number): Blob {
  let totalLength = 0;
  const byteArrays = base64Chunks.map(chunk => {
    const binaryString = atob(chunk);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    totalLength += bytes.length;
    return bytes;
  });

  const concatenatedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of byteArrays) {
    concatenatedBytes.set(arr, offset);
    offset += arr.length;
  }

  return createWavBlob(concatenatedBytes, sampleRate);
}

export async function playAudio(base64: string, mimeType: string, onEnd?: () => void) {
  stopAudio();
  
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let blob: Blob;
    
    // Check for common headers to determine actual format
    const isRiff = bytes.length > 4 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70;
    const isId3 = bytes.length > 3 && bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51;
    const isOgg = bytes.length > 4 && bytes[0] === 79 && bytes[1] === 103 && bytes[2] === 103 && bytes[3] === 83;
    const isFtyp = bytes.length > 8 && bytes[4] === 102 && bytes[5] === 116 && bytes[6] === 121 && bytes[7] === 112;

    if (isId3 || mimeType.includes('mp3')) {
      blob = new Blob([bytes], { type: 'audio/mp3' });
    } else if (isOgg || mimeType.includes('ogg')) {
      blob = new Blob([bytes], { type: 'audio/ogg' });
    } else if (isFtyp || mimeType.includes('mp4') || mimeType.includes('m4a')) {
      blob = new Blob([bytes], { type: 'audio/mp4' });
    } else {
      if (!isRiff) {
        // It's raw PCM, wrap it in a WAV header
        blob = createWavBlob(bytes, 24000);
      } else {
        blob = new Blob([bytes], { type: 'audio/wav' });
      }
    }

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (onEnd) onEnd();
    };
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      URL.revokeObjectURL(url);
      alert(`Audio Playback Error: Could not play audio.`);
      if (onEnd) onEnd();
    };
    
    try {
      await audio.play();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Actual playback failure", error);
        alert(`Playback failed!\n${error?.message || String(error)}`);
      }
    }
  } catch (error: any) {
    console.error("Error playing audio:", error);
    alert(`Audio Playback Error:\n${error?.message || String(error)}`);
    if (onEnd) onEnd();
  }
}

export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

//#region Audio Analysis & Playback Helpers
/**
 * Returns the currently playing HTMLAudioElement instance.
 */
export function getCurrentAudio(): HTMLAudioElement | null {
  return currentAudio;
}

/**
 * Direct PCM / WAV base64 decoding to extract amplitude visual peaks.
 * Divides the decoded 16-bit PCM samples into a set number of bins and computes peak amplitudes.
 */
export function getWaveformAmplitudes(base64: string, numBars: number = 80): number[] {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    
    // Detect WAV RIFF header to offset past metadata (44 bytes standard header)
    const isWav = binaryString.startsWith('RIFF');
    const startOffset = isWav ? 44 : 0;
    const pcmBytes = len - startOffset;
    
    if (pcmBytes <= 0) {
      return Array(numBars).fill(0.1);
    }
    
    // Read 16-bit signed PCM samples (2 bytes per sample)
    const numSamples = Math.floor(pcmBytes / 2);
    const buffer = new ArrayBuffer(pcmBytes);
    const view = new DataView(buffer);
    
    // Copy binary characters into DataView bytes
    for (let i = 0; i < pcmBytes; i++) {
      view.setUint8(i, binaryString.charCodeAt(startOffset + i));
    }
    
    const samples = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      // little-endian 16-bit signed PCM
      samples[i] = view.getInt16(i * 2, true);
    }
    
    // Partition sample space into equal-sized frequency bins
    const binSize = Math.floor(numSamples / numBars);
    const amplitudes: number[] = [];
    
    for (let i = 0; i < numBars; i++) {
      const start = i * binSize;
      const end = Math.min(start + binSize, numSamples);
      let maxVal = 0;
      
      for (let j = start; j < end; j++) {
        const abs = Math.abs(samples[j]);
        if (abs > maxVal) maxVal = abs;
      }
      
      // Normalize values relative to 16-bit integer boundary (32768)
      const normalized = maxVal / 32768;
      // Clamp values and ensure a tiny baseline so the bars remain visible
      amplitudes.push(Math.max(0.1, Math.min(1.0, normalized)));
    }
    
    return amplitudes;
  } catch (e) {
    console.error("Failed to generate waveform amplitudes:", e);
    // Graceful fallback with slightly animated random peaks if parsing fails
    return Array(numBars).fill(0.1).map(() => 0.1 + Math.random() * 0.4);
  }
}
//#endregion
