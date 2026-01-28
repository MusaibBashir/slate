import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShotItem {
    id: string;
    shotType: string;
    description: string;
}

export interface SceneShots {
    sceneId: string;
    sceneHeading: string;
    shots: ShotItem[];
}

interface ShotlistState {
    // Shots organized by project then scene
    shotsByProject: Record<string, Record<string, SceneShots>>;

    // Actions
    addShot: (projectId: string, sceneId: string, sceneHeading: string, shotType: string, description?: string) => void;
    updateShot: (projectId: string, sceneId: string, shotId: string, updates: Partial<ShotItem>) => void;
    deleteShot: (projectId: string, sceneId: string, shotId: string) => void;
    getSceneShots: (projectId: string, sceneId: string) => SceneShots | undefined;
    getAllProjectShots: (projectId: string) => SceneShots[];
}

const generateId = () => `shot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const useShotlistStore = create<ShotlistState>()(
    persist(
        (set, get) => ({
            shotsByProject: {},

            addShot: (projectId, sceneId, sceneHeading, shotType, description = '') => {
                const newShot: ShotItem = {
                    id: generateId(),
                    shotType,
                    description,
                };

                set((state) => {
                    const projectShots = state.shotsByProject[projectId] || {};
                    const sceneShots = projectShots[sceneId] || {
                        sceneId,
                        sceneHeading,
                        shots: [],
                    };

                    return {
                        shotsByProject: {
                            ...state.shotsByProject,
                            [projectId]: {
                                ...projectShots,
                                [sceneId]: {
                                    ...sceneShots,
                                    sceneHeading,
                                    shots: [...sceneShots.shots, newShot],
                                },
                            },
                        },
                    };
                });
            },

            updateShot: (projectId, sceneId, shotId, updates) => {
                set((state) => {
                    const projectShots = state.shotsByProject[projectId];
                    if (!projectShots) return state;

                    const sceneShots = projectShots[sceneId];
                    if (!sceneShots) return state;

                    return {
                        shotsByProject: {
                            ...state.shotsByProject,
                            [projectId]: {
                                ...projectShots,
                                [sceneId]: {
                                    ...sceneShots,
                                    shots: sceneShots.shots.map((shot) =>
                                        shot.id === shotId ? { ...shot, ...updates } : shot
                                    ),
                                },
                            },
                        },
                    };
                });
            },

            deleteShot: (projectId, sceneId, shotId) => {
                set((state) => {
                    const projectShots = state.shotsByProject[projectId];
                    if (!projectShots) return state;

                    const sceneShots = projectShots[sceneId];
                    if (!sceneShots) return state;

                    return {
                        shotsByProject: {
                            ...state.shotsByProject,
                            [projectId]: {
                                ...projectShots,
                                [sceneId]: {
                                    ...sceneShots,
                                    shots: sceneShots.shots.filter((shot) => shot.id !== shotId),
                                },
                            },
                        },
                    };
                });
            },

            getSceneShots: (projectId, sceneId) => {
                return get().shotsByProject[projectId]?.[sceneId];
            },

            getAllProjectShots: (projectId) => {
                const projectShots = get().shotsByProject[projectId];
                if (!projectShots) return [];
                return Object.values(projectShots).filter((ss) => ss.shots.length > 0);
            },
        }),
        {
            name: 'slate-shots',
        }
    )
);

export default useShotlistStore;
