import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
}

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    initialize: () => Promise<void>;
    signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    error: null,

    initialize: async () => {
        try {
            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) throw error;

            if (session?.user) {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                set({
                    user: session.user,
                    session,
                    profile,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    set({
                        user: session.user,
                        session,
                        profile,
                    });
                } else if (event === 'SIGNED_OUT') {
                    set({
                        user: null,
                        session: null,
                        profile: null,
                    });
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ isLoading: false, error: 'Failed to initialize authentication' });
        }
    },

    signUp: async (email: string, password: string, displayName?: string) => {
        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName || email.split('@')[0],
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                set({ isLoading: false });
                return { success: true };
            }

            set({ isLoading: false });
            return { success: true }; // Email confirmation may be required
        } catch (error: any) {
            const message = error.message || 'Sign up failed';
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },

    signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                set({
                    user: data.user,
                    session: data.session,
                    profile,
                    isLoading: false,
                });

                return { success: true };
            }

            set({ isLoading: false });
            return { success: false, error: 'Login failed' };
        } catch (error: any) {
            const message = error.message || 'Sign in failed';
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },

    signOut: async () => {
        set({ isLoading: true });

        try {
            await supabase.auth.signOut();
            set({
                user: null,
                session: null,
                profile: null,
                isLoading: false,
            });
        } catch (error) {
            console.error('Sign out error:', error);
            set({ isLoading: false });
        }
    },

    resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            set({ isLoading: false });
            return { success: true };
        } catch (error: any) {
            const message = error.message || 'Password reset failed';
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },

    updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            set((state) => ({
                profile: state.profile ? { ...state.profile, ...updates } : null,
            }));
        } catch (error) {
            console.error('Profile update error:', error);
        }
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;
