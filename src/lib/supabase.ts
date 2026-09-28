import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/env';

const url = env.SUPABASE_URL as string | undefined;
const key = env.SUPABASE_ANON_KEY as string | undefined;

// With no keys the app runs on seeded preview data in this browser.
export const isConfigured = Boolean(url && key);

// PKCE: the magic link comes back as ?code=…, which leaves the hash router's #/ path alone.
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url!, key!, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
    })
  : null;

export const magicLinkReturnUrl = () => `${location.origin}${location.pathname}#/librarian`;