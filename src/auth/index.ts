/**
 * Auth — public API.
 */
export { getSupabase, isSupabaseConfigured } from './supabase-client';
export { useAuth } from './useAuth';
export type { OAuthProvider, AuthState } from './useAuth';
