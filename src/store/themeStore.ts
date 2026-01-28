import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'system',
            resolvedTheme: getSystemTheme(),

            setTheme: (theme: Theme) => {
                const resolved = theme === 'system' ? getSystemTheme() : theme;
                set({ theme, resolvedTheme: resolved });

                // Apply to document
                document.documentElement.setAttribute('data-theme', resolved);
            },
        }),
        {
            name: 'slate-theme',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    const resolved = state.theme === 'system' ? getSystemTheme() : state.theme;
                    state.resolvedTheme = resolved;
                    document.documentElement.setAttribute('data-theme', resolved);
                }
            },
        }
    )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const state = useThemeStore.getState();
        if (state.theme === 'system') {
            const resolved = e.matches ? 'dark' : 'light';
            useThemeStore.setState({ resolvedTheme: resolved });
            document.documentElement.setAttribute('data-theme', resolved);
        }
    });
}

export default useThemeStore;
