import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Priority = 'high' | 'mid' | 'low';
export type PropStatus = 'pending' | 'obtained' | 'failed';

export interface PropItem {
    id: string;
    text: string;
    priority: Priority;
    status: PropStatus;
}

export interface SceneProps {
    sceneId: string;
    sceneHeading: string;
    props: PropItem[];
}

interface PropListState {
    // Props organized by project then scene
    propsByProject: Record<string, Record<string, SceneProps>>;

    // Actions
    addProp: (projectId: string, sceneId: string, sceneHeading: string, text: string, priority: Priority) => void;
    updateProp: (projectId: string, sceneId: string, propId: string, updates: Partial<PropItem>) => void;
    setStatus: (projectId: string, sceneId: string, propId: string, status: PropStatus) => void;
    deleteProp: (projectId: string, sceneId: string, propId: string) => void;
    getSceneProps: (projectId: string, sceneId: string) => SceneProps | undefined;
    getAllProjectProps: (projectId: string) => SceneProps[];
}

const generateId = () => `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const usePropListStore = create<PropListState>()(
    persist(
        (set, get) => ({
            propsByProject: {},

            addProp: (projectId, sceneId, sceneHeading, text, priority) => {
                const newProp: PropItem = {
                    id: generateId(),
                    text,
                    priority,
                    status: 'pending',
                };

                set((state) => {
                    const projectProps = state.propsByProject[projectId] || {};
                    const sceneProps = projectProps[sceneId] || {
                        sceneId,
                        sceneHeading,
                        props: [],
                    };

                    return {
                        propsByProject: {
                            ...state.propsByProject,
                            [projectId]: {
                                ...projectProps,
                                [sceneId]: {
                                    ...sceneProps,
                                    sceneHeading,
                                    props: [...sceneProps.props, newProp],
                                },
                            },
                        },
                    };
                });
            },

            updateProp: (projectId, sceneId, propId, updates) => {
                set((state) => {
                    const projectProps = state.propsByProject[projectId];
                    if (!projectProps) return state;

                    const sceneProps = projectProps[sceneId];
                    if (!sceneProps) return state;

                    return {
                        propsByProject: {
                            ...state.propsByProject,
                            [projectId]: {
                                ...projectProps,
                                [sceneId]: {
                                    ...sceneProps,
                                    props: sceneProps.props.map((prop) =>
                                        prop.id === propId ? { ...prop, ...updates } : prop
                                    ),
                                },
                            },
                        },
                    };
                });
            },

            setStatus: (projectId, sceneId, propId, status) => {
                set((state) => {
                    const projectProps = state.propsByProject[projectId];
                    if (!projectProps) return state;

                    const sceneProps = projectProps[sceneId];
                    if (!sceneProps) return state;

                    return {
                        propsByProject: {
                            ...state.propsByProject,
                            [projectId]: {
                                ...projectProps,
                                [sceneId]: {
                                    ...sceneProps,
                                    props: sceneProps.props.map((prop) =>
                                        prop.id === propId ? { ...prop, status } : prop
                                    ),
                                },
                            },
                        },
                    };
                });
            },

            deleteProp: (projectId, sceneId, propId) => {
                set((state) => {
                    const projectProps = state.propsByProject[projectId];
                    if (!projectProps) return state;

                    const sceneProps = projectProps[sceneId];
                    if (!sceneProps) return state;

                    return {
                        propsByProject: {
                            ...state.propsByProject,
                            [projectId]: {
                                ...projectProps,
                                [sceneId]: {
                                    ...sceneProps,
                                    props: sceneProps.props.filter((prop) => prop.id !== propId),
                                },
                            },
                        },
                    };
                });
            },

            getSceneProps: (projectId, sceneId) => {
                return get().propsByProject[projectId]?.[sceneId];
            },

            getAllProjectProps: (projectId) => {
                const projectProps = get().propsByProject[projectId];
                if (!projectProps) return [];
                return Object.values(projectProps).filter((sp) => sp.props.length > 0);
            },
        }),
        {
            name: 'slate-props',
        }
    )
);

export default usePropListStore;
