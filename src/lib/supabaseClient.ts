import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Running in local-only mode.');
}

export const supabase = createClient(
    supabaseUrl || 'http://localhost',
    supabaseAnonKey || 'placeholder'
);

export default supabase;
