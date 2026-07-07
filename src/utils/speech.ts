/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VoiceName } from '../types';

interface SpeechControls {
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

// Maps our theater voices to standard browser speech synthesis characteristics
export function speakClientText(
  text: string,
  speaker: VoiceName,
  pacing: 'slow' | 'normal' | 'fast',
  pitch: 'low' | 'normal' | 'high',
  onBoundary?: (charIndex: number, charLength: number) => void,
  onEnd?: () => void,
  onError?: (err: string) => void
): SpeechControls {
  // Guard for server-side or unsupported environments
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onError?.("Speech synthesis not supported by host window context.");
    return { stop: () => {}, pause: () => {}, resume: () => {} };
  }

  // Cancel any ongoing speaking
  window.speechSynthesis.cancel();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);

  // Map pacing speed rates
  let rate = 1.0;
  if (pacing === 'fast') rate = 1.35;
  if (pacing === 'slow') rate = 0.75;
  utterance.rate = rate;

  // Map pitch profiles
  let pitchVal = 1.0;
  if (pitch === 'high') pitchVal = 1.30;
  if (pitch === 'low') pitchVal = 0.75;
  utterance.pitch = pitchVal;

  // Select voice dynamically based on speaker profile matching
  const voices = window.speechSynthesis.getVoices();
  
  // Find standard voices based on common name tags
  let selectedVoice = null;
  
  if (speaker === 'Kore') {
    // Bright Energetic Female
    selectedVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Zira') || 
      v.name.includes('Tessa') || 
      (v.name.includes('Google') && v.name.includes('Female')) ||
      v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
    );
  } else if (speaker === 'Puck') {
    // Youthful Energetic Male
    selectedVoice = voices.find(v => 
      v.name.includes('Daniel') || 
      v.name.includes('David') || 
      (v.name.includes('Google') && v.name.includes('Male')) ||
      v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
    );
  } else if (speaker === 'Charon') {
    // Deep Bass Scholarly Male
    selectedVoice = voices.find(v => 
      v.name.includes('Rishi') ||
      v.name.includes('Microsoft David') || 
      v.name.includes('George') ||
      v.lang.startsWith('en-GB')
    );
  } else if (speaker === 'Fenrir') {
    // Bold, intense growly male
    selectedVoice = voices.find(v => 
      v.name.includes('Microsoft David') || 
      v.name.includes('Alex') ||
      v.lang.startsWith('en-US')
    );
  } else if (speaker === 'Zephyr') {
    // Cozy standard documentary-like
    selectedVoice = voices.find(v => 
      v.name.includes('Google US English') ||
      v.name.includes('Samantha') ||
      v.lang.startsWith('en')
    );
  }

  // Backup Match
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Event Triggers
  utterance.onboundary = (event) => {
    onBoundary?.(event.charIndex, event.charLength || 0);
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (event) => {
    if (event.error !== 'interrupted') {
      onError?.(event.error);
    }
  };

  // Start synthesis
  window.speechSynthesis.speak(utterance);

  return {
    stop: () => {
      window.speechSynthesis.cancel();
    },
    pause: () => {
      window.speechSynthesis.pause();
    },
    resume: () => {
      window.speechSynthesis.resume();
    }
  };
}
