import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace scope for Google Sheets
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// In-memory token cache (strictly adhering to memory-only storage rules)
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;
let isSigningIn = false;

// Listen for auth state changes
onAuthStateChanged(auth, (user: User | null) => {
  if (!user && !isSigningIn) {
    cachedToken = null;
    tokenExpiryTime = 0;
  }
});

/**
 * Checks if the user is currently authenticated with a valid in-memory token.
 */
export function isGoogleAuthenticated(): boolean {
  if (!cachedToken) return false;
  return Date.now() < tokenExpiryTime;
}

/**
 * Returns currently cached Google access token if valid.
 */
export function getCachedGoogleToken(): string | null {
  if (isGoogleAuthenticated()) {
    return cachedToken;
  }
  return null;
}

/**
 * Clears current in-memory token and signs out of Firebase Auth.
 */
export function clearGoogleToken(): void {
  cachedToken = null;
  tokenExpiryTime = 0;
  try {
    signOut(auth).catch(() => {});
  }
  catch {
    // Ignore signout error if already signed out
  }
}

/**
 * Requests a Google OAuth access token using Firebase Auth GoogleAuthProvider popup.
 *
 * @param _scopes Array of requested OAuth scopes (spreadsheets scope is already added).
 */
export async function requestGoogleAccessToken(
  _scopes: string[] = ['https://www.googleapis.com/auth/spreadsheets']
): Promise<string> {
  if (isGoogleAuthenticated() && cachedToken) {
    return cachedToken;
  }

  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google sign-in succeeded, but no OAuth access token was returned.');
    }

    cachedToken = credential.accessToken;
    // Set expiry buffer to 50 minutes
    tokenExpiryTime = Date.now() + (50 * 60 * 1000);
    return credential.accessToken;
  }
  finally {
    isSigningIn = false;
  }
}
