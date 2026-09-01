/**
 * Central auth context. Wraps Firebase's onAuthStateChanged listener (so the
 * whole app reacts to sign-in/out) and, once a Firebase user exists, fetches
 * (and auto-provisions, on first call) the matching backend profile via
 * GET /auth/me — exposed together as `{ firebaseUser, profile }`.
 *
 * Must be rendered INSIDE QueryProvider (it calls useQuery for the profile).
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from './firebase';
import { authApi } from '../api/endpoints/auth';
import type { User } from '../types/api';
import { ApiError } from '../api/client';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: User | undefined;
  /** True only while Firebase is determining the initial auth state on cold start. */
  isAuthLoading: boolean;
  /** True while the backend profile is being fetched for a signed-in user. */
  isProfileLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Fires immediately with the restored session (if any) on cold start,
    // then again on every sign-in/out — this IS the source of truth for
    // "is someone signed in", nothing else should track that separately.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthLoading(false);
      if (!user) {
        // Signed out: drop any cached profile/financial data so the next
        // account to sign in on this device never sees a stale flash of a
        // previous user's numbers.
        queryClient.clear();
      }
    });
    return unsubscribe;
  }, [queryClient]);

  const profileQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await authApi.getMe()).data,
    enabled: Boolean(firebaseUser),
    retry: (failureCount, error) => {
      // A 500 here usually means the backend's Firebase Admin credentials
      // aren't configured yet — retrying won't help, so don't loop on it.
      if (error instanceof ApiError && error.status >= 500) return false;
      return failureCount < 2;
    },
  });

  const value: AuthContextValue = {
    firebaseUser,
    profile: profileQuery.data,
    isAuthLoading,
    isProfileLoading: profileQuery.isLoading,

    signInWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },

    signUpWithEmail: async (email, password) => {
      await createUserWithEmailAndPassword(auth, email, password);
    },

    sendPasswordReset: async (email) => {
      await sendPasswordResetEmail(auth, email);
    },

    signOut: async () => {
      await firebaseSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
