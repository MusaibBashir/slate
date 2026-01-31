import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';


// Beat types for story outline
export interface BeatCard {
    id: string;
    title: string;
    synopsis: string;
    isExpanded: boolean;
}

export interface Act {
    id: string;
    name: string;
    beats: BeatCard[];
    isExpanded: boolean;
}

// Strip UI-only fields before saving to cloud (reduces JSON size)
const stripBeatsForStorage = (acts: Act[] | undefined) => {
    if (!acts) return null;
    return acts.map(act => ({
        id: act.id,
        name: act.name,
        beats: act.beats.map(beat => ({
            id: beat.id,
            title: beat.title,
            synopsis: beat.synopsis,
        })),
    }));
};

// Restore UI state when loading from cloud
const restoreBeatsFromStorage = (acts: any[] | undefined): Act[] | undefined => {
    if (!acts || !Array.isArray(acts)) return undefined;
    return acts.map(act => ({
        id: act.id,
        name: act.name,
        isExpanded: true, // Default to expanded
        beats: (act.beats || []).map((beat: any) => ({
            id: beat.id,
            title: beat.title,
            synopsis: beat.synopsis,
            isExpanded: true, // Default to expanded
        })),
    }));
};

export interface Project {
    id: string;
    title: string;
    content: string;
    beats?: Act[]; // Story outline beats
    createdAt: string;
    updatedAt: string;
    author?: string;
    email?: string;
    copyright?: string;
    // Cloud sync fields
    owner_id?: string;
    isCloudSynced?: boolean;
    isShared?: boolean;
    role?: 'owner' | 'editor' | 'viewer';
}

export interface Collaborator {
    id: string;
    user_id: string;
    email: string;
    display_name: string;
    role: 'owner' | 'editor' | 'viewer';
}

interface ProjectState {
    // Projects list
    projects: Project[];
    sharedProjects: Project[];

    // Current editing state
    currentProject: Project | null;
    isDirty: boolean;
    isSyncing: boolean;
    syncError: string | null;

    // Actions
    createProject: (title: string, author?: string, email?: string) => Project;
    openProject: (id: string) => void;
    closeProject: () => void;
    updateContent: (content: string) => void;
    updateTitle: (title: string) => void;
    updateAuthor: (author: string) => void;
    updateBeats: (beats: Act[]) => void;
    saveProject: () => void;
    deleteProject: (id: string) => void;
    duplicateProject: (id: string) => void;
    setDirty: (dirty: boolean) => void;

    // Cloud sync
    syncToCloud: (userId: string) => Promise<void>;
    fetchFromCloud: (userId: string) => Promise<void>;
    saveToCloud: (project: Project, userId: string) => Promise<void>;
    deleteFromCloud: (projectId: string) => Promise<void>;

    // Collaboration
    addCollaborator: (projectId: string, email: string, role: 'editor' | 'viewer') => Promise<{ success: boolean; error?: string }>;
    removeCollaborator: (projectId: string, collaboratorId: string) => Promise<void>;
    getCollaborators: (projectId: string) => Promise<Collaborator[]>;

    // Helpers
    getProject: (id: string) => Project | undefined;
}

const generateId = () => {
    return `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            projects: [],
            sharedProjects: [],
            currentProject: null,
            isDirty: false,
            isSyncing: false,
            syncError: null,

            createProject: (title: string, author?: string, email?: string) => {
                const newProject: Project = {
                    id: generateId(),
                    title: title || 'Untitled Screenplay',
                    content: '<div data-type="scene-heading"></div>',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    author: author || 'Author Name',
                    email: email || 'email@example.com',
                    isCloudSynced: false,
                };

                set((state) => ({
                    projects: [...state.projects, newProject],
                    currentProject: newProject,
                    isDirty: false,
                }));

                return newProject;
            },

            openProject: (id: string) => {
                const { projects, sharedProjects } = get();
                const project = [...projects, ...sharedProjects].find((p) => p.id === id);
                if (project) {
                    console.log(`[Store] Opening project "${project.title}" from cache. Content size: ${project.content?.length}`);
                    set({ currentProject: { ...project }, isDirty: false });
                }
            },

            closeProject: () => {
                if (get().isDirty && get().currentProject) {
                    get().saveProject();
                }
                set({ currentProject: null, isDirty: false });
            },

            updateContent: (content: string) => {
                set((state) => ({
                    currentProject: state.currentProject
                        ? { ...state.currentProject, content }
                        : null,
                }));
            },

            updateTitle: (title: string) => {
                set((state) => ({
                    currentProject: state.currentProject
                        ? { ...state.currentProject, title }
                        : null,
                    isDirty: true,
                }));
            },

            updateAuthor: (author: string) => {
                set((state) => ({
                    currentProject: state.currentProject
                        ? { ...state.currentProject, author }
                        : null,
                    isDirty: true,
                }));
            },

            updateBeats: (beats: Act[]) => {
                set((state) => ({
                    currentProject: state.currentProject
                        ? { ...state.currentProject, beats }
                        : null,
                    isDirty: true,
                }));
            },

            saveProject: () => {
                const { currentProject, projects, sharedProjects } = get();
                if (!currentProject) return;

                const updatedProject = {
                    ...currentProject,
                    updatedAt: new Date().toISOString(),
                };

                // Check if it's a shared project
                const isShared = sharedProjects.some((p) => p.id === currentProject.id);

                if (isShared) {
                    const newSharedProjects = sharedProjects.map((p) =>
                        p.id === currentProject.id ? updatedProject : p
                    );
                    set({ sharedProjects: newSharedProjects, currentProject: updatedProject, isDirty: false });
                } else {
                    const projectIndex = projects.findIndex((p) => p.id === currentProject.id);
                    if (projectIndex >= 0) {
                        const newProjects = [...projects];
                        newProjects[projectIndex] = updatedProject;
                        set({ projects: newProjects, currentProject: updatedProject, isDirty: false });
                    } else {
                        set({
                            projects: [...projects, updatedProject],
                            currentProject: updatedProject,
                            isDirty: false,
                        });
                    }
                }

                console.log('Project saved:', updatedProject.title);
            },

            deleteProject: (id: string) => {
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                    sharedProjects: state.sharedProjects.filter((p) => p.id !== id),
                    currentProject: state.currentProject?.id === id ? null : state.currentProject,
                }));
            },

            duplicateProject: (id: string) => {
                const project = get().projects.find((p) => p.id === id);
                if (project) {
                    const newProject: Project = {
                        ...project,
                        id: generateId(),
                        title: `Copy of ${project.title}`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        isCloudSynced: false,
                    };
                    set((state) => ({
                        projects: [...state.projects, newProject],
                    }));
                }
            },

            setDirty: (dirty: boolean) => {
                set({ isDirty: dirty });
            },

            // Cloud sync methods
            syncToCloud: async (userId: string) => {
                set({ isSyncing: true, syncError: null });

                try {
                    const { projects } = get();

                    for (const project of projects) {
                        // Convert local project to cloud format
                        const cloudProject = {
                            id: project.id.startsWith('proj_') ? undefined : project.id,
                            title: project.title,
                            content: project.content,
                            // Strip UI-only fields to reduce JSON size
                            beats: stripBeatsForStorage(project.beats),
                            author: project.author,
                            email: project.email,
                            owner_id: userId,
                            created_at: project.createdAt,
                            updated_at: project.updatedAt,
                        };

                        const { error } = await supabase
                            .from('projects')
                            .upsert(cloudProject, { onConflict: 'id' });

                        if (error) {
                            console.error('Sync error for project:', project.title, error);
                        }
                    }

                    // Fetch back to get cloud IDs
                    await get().fetchFromCloud(userId);

                    set({ isSyncing: false });
                } catch (error: any) {
                    console.error('Sync to cloud failed:', error);
                    set({ isSyncing: false, syncError: error.message });
                }
            },

            fetchFromCloud: async (userId: string) => {
                set({ isSyncing: true, syncError: null });

                try {
                    // 1. Fetch Owned Projects - Explicit Selection

                    // Add timeout race
                    const fetchOwnedPromise = supabase
                        .from('projects')
                        .select('id, title, content, beats, author, email, owner_id, created_at, updated_at, is_deleted')
                        .eq('owner_id', userId);

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Database request timed out')), 10000)
                    );

                    const { data: ownedProjects, error: ownedError } = await Promise.race([
                        fetchOwnedPromise.then(res => res as any),
                        timeoutPromise
                    ]) as any;

                    if (ownedError) {
                        console.error('Error fetching owned projects:', ownedError);
                        throw ownedError;
                    }

                    // 2. Fetch Shared Projects
                    const { data: collaborations, error: collabError } = await supabase
                        .from('collaborators')
                        .select(`
                            role,
                            projects (
                                id, title, content, beats, author, email, owner_id, created_at, updated_at, is_deleted
                            )
                        `)
                        .eq('user_id', userId);

                    if (collabError) {
                        console.error('Error fetching shared projects:', collabError);
                        throw collabError;
                    }

                    // Helper to safely parse projects
                    const parseProject = (p: any, role: 'owner' | 'editor' | 'viewer', isShared: boolean): Project | null => {
                        try {
                            if (!p) return null;
                            if (p.is_deleted === true) return null; // Explicit check for true

                            // Safely restore beats
                            let beats: Act[] | undefined;
                            try {
                                beats = restoreBeatsFromStorage(p.beats);
                            } catch (e) {
                                // Fail silently for beats parsing
                                beats = [];
                            }

                            return {
                                id: p.id,
                                title: p.title || 'Untitled',
                                content: p.content || '',
                                beats: beats,
                                createdAt: p.created_at,
                                updatedAt: p.updated_at,
                                author: p.author,
                                email: p.email,
                                owner_id: p.owner_id,
                                isShared: isShared,
                                isCloudSynced: true,
                                role: role,
                            };
                        } catch (e) {
                            return null;
                        }
                    };

                    // Process results
                    const validOwned = (ownedProjects || [])
                        .map(p => parseProject(p, 'owner', false))
                        .filter((p): p is Project => p !== null);

                    const validShared = (collaborations || [])
                        .map((c: any) => parseProject(c.projects, c.role as any, true))
                        .filter((p): p is Project => p !== null);

                    // 4. Merge Strategies
                    // Cloud always wins conflict with local cache to ensure consistency
                    const cloudMap = new Map<string, Project>();
                    [...validOwned, ...validShared].forEach(p => cloudMap.set(p.id, p));

                    // Keep local-only projects (that haven't been synced yet)
                    const { projects: currentLocal } = get();
                    const localOnly = currentLocal.filter(
                        p => p.id.startsWith('proj_') && !p.isCloudSynced
                    );

                    // Final list is Cloud Projects + Local New Projects
                    const finalProjects = [...Array.from(cloudMap.values()), ...localOnly];

                    set({
                        projects: finalProjects,
                        sharedProjects: validShared,
                        isSyncing: false
                    });

                } catch (error: any) {
                    console.error('Fatal error during fetch:', error);
                    set({ isSyncing: false, syncError: error.message });
                }
            },

            saveToCloud: async (project: Project, userId: string) => {
                const state = get();

                // If already syncing, queue this save (simplified: just ignore for now to prevent race conds)
                if (state.isSyncing) {
                    return;
                }

                set({ isSyncing: true });

                try {
                    const isNewProject = project.id.startsWith('proj_');

                    if (isNewProject) {
                        // INSERT logic
                        const { data, error } = await supabase
                            .from('projects')
                            .insert({
                                title: project.title,
                                content: project.content,
                                beats: stripBeatsForStorage(project.beats),
                                author: project.author,
                                email: project.email,
                                owner_id: userId,
                            })
                            .select()
                            .single();

                        if (error) throw error;

                        if (data) {
                            // AUTO-FIX: detailed RLS policies often require the owner to be in the collaborators table
                            try {
                                await supabase
                                    .from('collaborators')
                                    .insert({
                                        project_id: data.id,
                                        user_id: userId,
                                        role: 'owner'
                                    });
                            } catch (e) {
                                console.warn('Auto-add owner to collaborators failed (non-critical):', e);
                            }

                            set((state) => ({
                                projects: state.projects.map((p) =>
                                    p.id === project.id
                                        ? { ...p, id: data.id, owner_id: userId, isCloudSynced: true }
                                        : p
                                ),
                                currentProject: state.currentProject?.id === project.id
                                    ? { ...state.currentProject, id: data.id, owner_id: userId, isCloudSynced: true }
                                    : state.currentProject,
                                // isSyncing handled in finally
                            }));
                        }
                    } else {
                        // UPDATE logic

                        const updateData = {
                            title: project.title,
                            content: project.content,
                            beats: stripBeatsForStorage(project.beats),
                            author: project.author,
                            email: project.email,
                            updated_at: new Date().toISOString(),
                        };

                        const updatePromise = supabase
                            .from('projects')
                            .update(updateData, { count: 'exact' })
                            .eq('id', project.id);

                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Save request timed out')), 5000)
                        );

                        const { count, error } = await Promise.race([
                            updatePromise,
                            timeoutPromise
                        ]) as any;

                        if (error) throw error;

                        // RLS CHECK: If no rows were updated (count === 0), it might be due to missing collaborator entry
                        if (count === 0) {
                            // Attempt to add self as collaborator
                            const { error: collabError } = await supabase
                                .from('collaborators')
                                .insert({
                                    project_id: project.id,
                                    user_id: userId,
                                    role: 'owner'
                                });

                            if (!collabError) {
                                // Retry once
                                await supabase
                                    .from('projects')
                                    .update(updateData)
                                    .eq('id', project.id);
                            }
                        }

                        set((state) => ({
                            projects: state.projects.map((p) =>
                                p.id === project.id ? { ...p, isCloudSynced: true } : p
                            ),
                            currentProject: state.currentProject?.id === project.id
                                ? { ...state.currentProject, isCloudSynced: true }
                                : state.currentProject,
                            // isSyncing handled in finally
                        }));
                    }
                } catch (error: any) {
                    console.error('Save to cloud failed:', error);
                    set({ syncError: error.message });
                } finally {
                    set({ isSyncing: false });
                }
            },

            deleteFromCloud: async (projectId: string) => {
                try {
                    // Soft delete
                    const { error } = await supabase
                        .from('projects')
                        .update({ is_deleted: true })
                        .eq('id', projectId);

                    if (error) throw error;
                } catch (error: any) {
                    console.error('Delete from cloud failed:', error);
                }
            },

            // Collaboration methods
            addCollaborator: async (projectId: string, email: string, role: 'editor' | 'viewer') => {
                try {
                    // Find user by email
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, email, display_name')
                        .eq('email', email.toLowerCase())
                        .single();

                    if (profileError || !profile) {
                        return { success: false, error: 'User not found with that email' };
                    }

                    // Add collaborator
                    const { error } = await supabase
                        .from('collaborators')
                        .insert({
                            project_id: projectId,
                            user_id: profile.id,
                            role,
                        });

                    if (error) {
                        if (error.code === '23505') {
                            return { success: false, error: 'User is already a collaborator' };
                        }
                        throw error;
                    }

                    return { success: true };
                } catch (error: any) {
                    console.error('Add collaborator failed:', error);
                    return { success: false, error: error.message };
                }
            },

            removeCollaborator: async (projectId: string, collaboratorId: string) => {
                try {
                    const { error } = await supabase
                        .from('collaborators')
                        .delete()
                        .eq('id', collaboratorId)
                        .eq('project_id', projectId);

                    if (error) throw error;
                } catch (error: any) {
                    console.error('Remove collaborator failed:', error);
                }
            },

            getCollaborators: async (projectId: string) => {
                try {
                    const { data, error } = await supabase
                        .from('collaborators')
                        .select(`
                            id,
                            user_id,
                            role,
                            profiles (email, display_name)
                        `)
                        .eq('project_id', projectId);

                    if (error) throw error;

                    return (data || []).map((c: any) => ({
                        id: c.id,
                        user_id: c.user_id,
                        email: c.profiles?.email || '',
                        display_name: c.profiles?.display_name || '',
                        role: c.role,
                    }));
                } catch (error: any) {
                    console.error('Get collaborators failed:', error);
                    return [];
                }
            },

            getProject: (id: string) => {
                const { projects, sharedProjects } = get();
                return [...projects, ...sharedProjects].find((p) => p.id === id);
            },
        }),
        {
            name: 'slate-projects',
            partialize: (state) => ({
                projects: state.projects,
            }),
        }
    )
);

export default useProjectStore;
