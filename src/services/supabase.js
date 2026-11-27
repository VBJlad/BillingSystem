/**
 * Supabase client placeholder.
 * Backend integration (Supabase Auth + PostgreSQL + RLS) will be connected in the backend phase.
 * Currently, all service modules run against the local reactive mock store with localStorage persistence.
 */
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  isConfigured: Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ),
};

export const supabase = null;
