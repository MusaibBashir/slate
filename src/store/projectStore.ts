import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
    email?: string;
    copyright?: string;
}

interface ProjectState {
    // Projects list
    projects: Project[];

    // Current editing state
    currentProject: Project | null;
    isDirty: boolean;

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
            currentProject: null,
            isDirty: false,

            createProject: (title: string, author?: string, email?: string) => {
                const newProject: Project = {
                    id: generateId(),
                    title: title || 'Untitled Screenplay',
                    // Start with empty Scene Heading
                    content: '<div data-type="scene-heading"></div>',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    author: author || 'Author Name',
                    email: email || 'email@example.com',
                };

                set((state) => ({
                    projects: [...state.projects, newProject],
                    currentProject: newProject,
                    isDirty: false,
                }));

                return newProject;
            },

            openProject: (id: string) => {
                const project = get().projects.find((p) => p.id === id);
                if (project) {
                    set({ currentProject: { ...project }, isDirty: false });
                }
            },

            closeProject: () => {
                // Save before closing if dirty
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
                const { currentProject, projects } = get();
                if (!currentProject) return;

                const updatedProject = {
                    ...currentProject,
                    updatedAt: new Date().toISOString(),
                };

                const projectIndex = projects.findIndex((p) => p.id === currentProject.id);

                if (projectIndex >= 0) {
                    // Update existing project
                    const newProjects = [...projects];
                    newProjects[projectIndex] = updatedProject;
                    set({ projects: newProjects, currentProject: updatedProject, isDirty: false });
                } else {
                    // Add new project
                    set({
                        projects: [...projects, updatedProject],
                        currentProject: updatedProject,
                        isDirty: false,
                    });
                }

                console.log('Project saved:', updatedProject.title);
            },

            deleteProject: (id: string) => {
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
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
                    };
                    set((state) => ({
                        projects: [...state.projects, newProject],
                    }));
                }
            },

            setDirty: (dirty: boolean) => {
                set({ isDirty: dirty });
            },

            getProject: (id: string) => {
                return get().projects.find((p) => p.id === id);
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
