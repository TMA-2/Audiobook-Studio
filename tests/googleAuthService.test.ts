import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isGoogleAuthenticated, getCachedGoogleToken, clearGoogleToken } from '../src/services/googleAuthService';

describe('googleAuthService', () => {
  beforeEach(() => {
    clearGoogleToken();
  });

  it('reports unauthenticated when no token is cached', () => {
    expect(isGoogleAuthenticated()).toBe(false);
    expect(getCachedGoogleToken()).toBeNull();
  });

  it('clears token cleanly on sign out / disconnect', () => {
    clearGoogleToken();
    expect(isGoogleAuthenticated()).toBe(false);
    expect(getCachedGoogleToken()).toBeNull();
  });
});
