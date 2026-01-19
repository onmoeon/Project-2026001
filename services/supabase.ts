import { createClient } from '@supabase/supabase-js';

// In Vite projects, environment variables are exposed on import.meta.env
// They must be prefixed with VITE_ to be exposed to the client
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase environment variables are missing! Make sure your .env file is correct and you have restarted the dev server.");
}

export const supabase = createClient(
    SUPABASE_URL || '', 
    SUPABASE_ANON_KEY || ''
);