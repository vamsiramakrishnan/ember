/**
 * useAuth — manages authentication state via Supabase Auth.
 * Supports OAuth with Google, Apple, GitHub, X (Twitter), and Facebook.
 * Falls back to local-only mode when Supabase is not configured.
 */
import { useState, useEffect, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from './supabase-client';
import type { User, Session } from '@supabase/supabase-js';

export type OAuthProvider = 'google' | 'apple' | 'github' | 'twitter' | 'facebook';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    isConfigured: isSupabaseConfigured(),
  });

  // Listen for auth state changes
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: Boolean(session),
        isConfigured: true,
      });
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          isAuthenticated: Boolean(session),
          isConfigured: true,
        });
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error(`[Ember] OAuth sign-in error (${provider}):`, error);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Ember] Sign-out error:', error);
    }
  }, []);

  return {
    ...state,
    signInWithOAuth,
    signOut,
  };
}
