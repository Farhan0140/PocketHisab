/**
 * Firebase app + Auth singleton, initialized once for the whole app.
 *
 * Uses `initializeAuth` (not the web-oriented `getAuth`) with
 * `getReactNativePersistence(AsyncStorage)` so a signed-in session survives
 * an app restart — without this, Firebase Auth falls back to in-memory
 * persistence on React Native and every cold start would require signing in
 * again. See metro.config.js for why `unstable_enablePackageExports` had to
 * be disabled for this import to resolve to the correct React Native build.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, type Auth } from 'firebase/auth';
// getReactNativePersistence is only available in firebase/auth's React
// Native build (resolved at runtime via Metro's "react-native" main field —
// see metro.config.js) but is missing from firebase's published type
// declarations, which is a known upstream gap, not a real type error.
// @ts-expect-error - see comment above
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../config/env';

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
};

// Guard against Metro's fast-refresh re-running this module and calling
// initializeApp()/initializeAuth() twice, which Firebase throws on.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  // initializeAuth throws "already-initialized" on fast-refresh reloads —
  // fall back to importing getAuth lazily to reuse the existing instance.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  auth = require('firebase/auth').getAuth(app);
}

export { app, auth };
