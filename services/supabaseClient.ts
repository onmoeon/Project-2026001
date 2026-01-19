import { createClient } from "@supabase/supabase-js";

// TODO: REPLACE THESE WITH YOUR ACTUAL SUPABASE VALUES
// You get these from your Supabase Project Settings -> API
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
