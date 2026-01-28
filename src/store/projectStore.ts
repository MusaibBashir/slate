import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

export interface Project {
    id: string;
    title: string;
    content: string;
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
                    // Fetch owned projects
                    const { data: ownedProjects, error: ownedError } = await supabase
                        .from('projects')
                        .select('*')
                        .eq('owner_id', userId)
                        .eq('is_deleted', false);

                    if (ownedError) throw ownedError;

                    // Fetch shared projects (where user is a collaborator)
                    const { data: collaborations, error: collabError } = await supabase
                        .from('collaborators')
                        .select(`
                            role,
                            projects (*)
                        `)
                        .eq('user_id', userId);

                    if (collabError) throw collabError;

                    // Transform owned projects
                    const owned: Project[] = (ownedProjects || []).map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        content: p.content || '',
                        createdAt: p.created_at,
                        updatedAt: p.updated_at,
                        author: p.author,
                        email: p.email,
                        owner_id: p.owner_id,
                        isCloudSynced: true,
                        role: 'owner' as const,
                    }));

                    // Transform shared projects
                    const shared: Project[] = (collaborations || [])
                        .filter((c: any) => c.projects && !c.projects.is_deleted)
                        .map((c: any) => ({
                            id: c.projects.id,
                            title: c.projects.title,
                            content: c.projects.content || '',
                            createdAt: c.projects.created_at,
                            updatedAt: c.projects.updated_at,
                            author: c.projects.author,
                            email: c.projects.email,
                            owner_id: c.projects.owner_id,
                            isCloudSynced: true,
                            isShared: true,
                            role: c.role as 'editor' | 'viewer',
                        }));

                    set({
                        projects: owned,
                        sharedProjects: shared,
                        isSyncing: false,
                    });
                } catch (error: any) {
                    console.error('Fetch from cloud failed:', error);
                    set({ isSyncing: false, syncError: error.message });
                }
            },

            saveToCloud: async (project: Project, userId: string) => {
                try {
                    const isNewProject = project.id.startsWith('proj_');

                    if (isNewProject) {
                        // INSERT new project (let Supabase generate UUID)
                        const { data, error } = await supabase
                            .from('projects')
                            .insert({
                                title: project.title,
                                content: project.content,
                                author: project.author,
                                email: project.email,
                                owner_id: userId,
                            })
                            .select()
                            .single();

                        if (error) throw error;

                        // Update local project with cloud ID
                        if (data) {
                            set((state) => ({
                                projects: state.projects.map((p) =>
                                    p.id === project.id
                                        ? { ...p, id: data.id, owner_id: userId, isCloudSynced: true }
                                        : p
                                ),
                                currentProject: state.currentProject?.id === project.id
                                    ? { ...state.currentProject, id: data.id, owner_id: userId, isCloudSynced: true }
                                    : state.currentProject,
                            }));
                        }
                    } else {
                        // UPDATE existing project
                        const { error } = await supabase
                            .from('projects')
                            .update({
                                title: project.title,
                                content: project.content,
                                author: project.author,
                                email: project.email,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', project.id);

                        if (error) throw error;

                        // Mark as synced
                        set((state) => ({
                            projects: state.projects.map((p) =>
                                p.id === project.id ? { ...p, isCloudSynced: true } : p
                            ),
                            currentProject: state.currentProject?.id === project.id
                                ? { ...state.currentProject, isCloudSynced: true }
                                : state.currentProject,
                        }));
                    }
                } catch (error: any) {
                    console.error('Save to cloud failed:', error);
                    set({ syncError: error.message });
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
