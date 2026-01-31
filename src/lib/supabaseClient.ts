import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Running in local-only mode.');
}

export const supabase = createClient(
    supabaseUrl || 'http://localhost',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        global: {
            headers: { 'x-application-name': 'slate' },
        },
        db: {
            schema: 'public',
        },
        // Request timeout configuration (if supported by version, otherwise purely client-side handle)
    }
);

export default supabase;
