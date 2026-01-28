import { create } from 'zustand';

export type AppMode = 'writing' | 'proplist' | 'shotlist';

interface AppState {
    // Sidebar
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // Active mode
    activeMode: AppMode;
    setActiveMode: (mode: AppMode) => void;

    // Current scene tracking (for prop list and shotlist)
    currentSceneId: string | null;
    setCurrentSceneId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Sidebar
    sidebarOpen: false,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    // Active mode
    activeMode: 'writing',
    setActiveMode: (mode) => set({ activeMode: mode, sidebarOpen: false }),

    // Current scene tracking
    currentSceneId: null,
    setCurrentSceneId: (id) => set({ currentSceneId: id }),
}));

export default useAppStore;
