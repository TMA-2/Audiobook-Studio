import { UserPreferences } from '../types';

const PREFS_KEY = 'abps_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  isDraggableSettingsEnabled: false,
  keyboardShortcutsEnabled: true,
};

export function loadUserPreferences(): UserPreferences {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (!saved) return DEFAULT_PREFERENCES;
    
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    };
  } catch (err) {
    console.warn('Failed to load user preferences from localStorage:', err);
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('Failed to save user preferences to localStorage:', err);
  }
}
