import { Speaker } from '../types';

//#region Formatting Utilities
/**
 * Formats a duration of time (in seconds) as `mm:ss`.
 * @param seconds A duration in seconds.
 * @returns `string` The formatted time. If null/undefined, returns `--:--`.
 */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Given an Error, returns its message or a JSON stringified version.
 * @param {any} err An Error object, ideally.
 * @returns {string} The Error's message property, or else a JSON-stringified version of its properties.
 */
export function formatError(err: any): string {
  if (err instanceof Error) {
    return `${err.message}`;
  }
  try {
    return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
  } catch (e) {
    return String(err);
  }
}
//#endregion

//#region Color Utilities

/**
 * Automatically retrieves / generates CSS background, border, and text colors for one or more speakers.
 * @param speakerId GUID representing a unique Speaker.
 * @param speakers A Speaker array to pull from.
 * @returns An object containing background, border, and text colors for the given speakers, contained in customStyle, customHoverStyle, and customControlStyle keys. The hue is incremented to generate maximum unique colors with pre-set . If the speakerId is not found, default colors are returned.
 */
export function getSpeakerStyles(speakerId: string | null, speakers: Speaker[]) {
  if (!speakerId) {
    return {
      bg: 'bg-slate-950',
      border: 'border-slate-800',
      text: 'text-slate-300',
      customStyle: {},
      customHoverStyle: {},
      customControlStyle: {}
    };
  }
  
  const index = speakers.findIndex(s => s.id === speakerId);
  if (index === -1) {
    return {
      bg: 'bg-slate-950',
      border: 'border-slate-800',
      text: 'text-slate-300',
      customStyle: {},
      customHoverStyle: {},
      customControlStyle: {}
    };
  }

  // deterministically unique colors each time
  const hue = (220 + index * 137.5) % 360;
  
  return {
    customStyle: {
      backgroundColor: `hsla(${hue}, 25%, 8%, 1)`,
      borderColor: `hsla(${hue}, 20%, 16%, 1)`,
      color: `hsla(${hue}, 15%, 85%, 1)`
    },
    customHoverStyle: {
      backgroundColor: `hsla(${hue}, 25%, 11%, 1)`,
      borderColor: `hsla(${hue}, 20%, 22%, 1)`
    },
    customControlStyle: {
      backgroundColor: `hsla(${hue}, 30%, 5%, 1)`,
      borderColor: `hsla(${hue}, 15%, 15%, 1)`,
      color: `hsla(${hue}, 20%, 80%, 1)`
    }
  };
}
//#endregion
