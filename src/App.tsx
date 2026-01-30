import { useState, useEffect } from 'react';
import { ScriptEditor } from './editor';
import { Sidebar } from './components/Sidebar';
import { ExportModal } from './components/ExportModal';
import { NewProjectModal } from './components/NewProjectModal';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { PropListView } from './modules/proplist';
import { ShotlistView } from './modules/shotlist';
import { useProjectStore } from './store/projectStore';
import { useThemeStore } from './store/themeStore';
import { useAppStore } from './store/appStore';
import { useAuthStore } from './store/authStore';
import './App.css';

// Icons as components
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

const MODE_LABELS = {
  writing: 'Writing',
  proplist: 'Prop List',
  shotlist: 'Shotlist',
};

function App() {
  const {
    projects,
    sharedProjects,
    currentProject,
    createProject,
    openProject,
    closeProject,
    updateTitle,
    deleteProject,
    duplicateProject,
    saveProject,
    isDirty,
    isSyncing,
    fetchFromCloud,
    saveToCloud,
    deleteFromCloud,
  } = useProjectStore();

  const { user, profile, isLoading: authLoading, initialize: initAuth, signOut } = useAuthStore();
  const { resolvedTheme, setTheme } = useThemeStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen, activeMode, setActiveMode } = useAppStore();

  const [showProjectBrowser, setShowProjectBrowser] = useState(!currentProject);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [shareModalProject, setShareModalProject] = useState<{ id: string; title: string } | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [exportModal, setExportModal] = useState<'props' | 'shots' | 'script' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Fetch projects from cloud when user logs in
  useEffect(() => {
    if (user) {
      fetchFromCloud(user.id);
    }
  }, [user, fetchFromCloud]);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  // Handle Escape key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Auto-save effect (local + cloud)
  useEffect(() => {
    if (isDirty && currentProject) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        saveProject();
        // Also save to cloud if logged in
        // Get fresh state to ensure we have the latest content
        if (user) {
          const freshProject = useProjectStore.getState().currentProject;
          if (freshProject) {
            saveToCloud(freshProject, user.id);
          }
        }
        setIsSaving(false);
      }, 3000); // Reduced to 3 seconds for better UX

      return () => clearTimeout(timer);
    }
  }, [isDirty, currentProject, saveProject, user, saveToCloud]);

  const handleCreateProject = async (title: string, author: string, email: string) => {
    const newProject = createProject(title, author, email);
    setIsNewProjectModalOpen(false);
    setShowProjectBrowser(false);

    // Immediately sync to cloud if logged in
    if (user) {
      await saveToCloud(newProject, user.id);
    }
  };

  const handleDuplicateProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateProject(id);
  };

  const handleOpenProject = (id: string) => {
    openProject(id);
    setShowProjectBrowser(false);
  };

  const handleCloseProject = () => {
    closeProject();
    setShowProjectBrowser(true);
    setActiveMode('writing');
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
      if (user) {
        await deleteFromCloud(id);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowProjectBrowser(true);
  };

  // All projects combined (owned + shared)
  const allProjects = [...projects, ...sharedProjects];

  // Show loading screen while auth initializes
  if (authLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Project Browser View
  if (showProjectBrowser) {
    return (
      <div className="app">
        <div className="project-browser">
          <header className="project-browser-header">
            <div className="header-auth-section">
              {user ? (
                <div className="user-menu">
                  <span className="user-email">{profile?.display_name || user.email}</span>
                  <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAuthModal(true)}
                >
                  <UserIcon /> Sign In
                </button>
              )}
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>

            <div className="logo">
              <h1>Slate</h1>
            </div>
            <p className="tagline">Professional Screenwriting Software</p>
            {isSyncing && (
              <div className="sync-indicator">
                <CloudIcon /> Syncing...
              </div>
            )}
          </header>

          <section className="new-project-section">
            <div className="project-browser-controls">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="search-input"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary new-project-btn"
                onClick={() => setIsNewProjectModalOpen(true)}
              >
                New Project
              </button>
            </div>
          </section>

          {allProjects.length > 0 && (
            <section className="projects-section">
              <h2>
                {user ? 'Your Projects' : 'Local Projects'}
                {!user && <span className="login-hint"> (Sign in to sync across devices)</span>}
              </h2>
              <div className="projects-grid">
                {allProjects
                  .filter(p => p.title.toLowerCase().includes(projectSearchQuery.toLowerCase()))
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((project) => (
                    <div
                      key={project.id}
                      className={`project-card ${project.isShared ? 'shared' : ''}`}
                      onClick={() => handleOpenProject(project.id)}
                    >
                      <div className="project-card-content">
                        <h3>
                          {project.title}
                          {project.isShared && <span className="shared-badge">Shared</span>}
                          {project.isCloudSynced && !project.isShared && <CloudIcon />}
                        </h3>
                        <p className="project-author">{project.author}</p>
                        <p className="project-date">
                          {new Date(project.updatedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="project-card-actions">
                        {/* Share button - only for owned projects when logged in */}
                        {user && !project.isShared && (
                          <button
                            className="project-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareModalProject({ id: project.id, title: project.title });
                            }}
                            title="Share project"
                          >
                            <ShareIcon />
                          </button>
                        )}
                        <button
                          className="project-action-btn"
                          onClick={(e) => handleDuplicateProject(project.id, e)}
                          title="Duplicate project"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                        {/* Delete only for owned projects */}
                        {!project.isShared && (
                          <button
                            className="project-delete-btn"
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            title="Delete project"
                            aria-label="Delete project"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {allProjects.length === 0 && (
            <section className="projects-section empty-state">
              <div className="empty-state-content">
                <h3>No projects yet</h3>
                <p>Create your first screenplay to get started!</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsNewProjectModalOpen(true)}
                >
                  Create Project
                </button>
              </div>
            </section>
          )}

          <footer className="project-browser-footer">
            <div className="shortcuts-info">
              <h3>Keyboard Shortcuts</h3>
              <div className="shortcuts-grid">
                <div className="shortcut"><kbd>Ctrl+1</kbd> Scene Heading</div>
                <div className="shortcut"><kbd>Ctrl+2</kbd> Action</div>
                <div className="shortcut"><kbd>Ctrl+3</kbd> Character</div>
                <div className="shortcut"><kbd>Ctrl+4</kbd> Dialogue</div>
                <div className="shortcut"><kbd>Ctrl+5</kbd> Parenthetical</div>
                <div className="shortcut"><kbd>Ctrl+6</kbd> Transition</div>
                <div className="shortcut"><kbd>Ctrl+S</kbd> Save</div>
                <div className="shortcut"><kbd>Ctrl+Z</kbd> Undo</div>
              </div>
            </div>
          </footer>
        </div>

        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreate={handleCreateProject}
        />

        {showAuthModal && (
          <AuthModal
            allowClose={true}
            onClose={() => setShowAuthModal(false)}
          />
        )}

        {shareModalProject && (
          <ShareModal
            projectId={shareModalProject.id}
            projectTitle={shareModalProject.title}
            onClose={() => setShareModalProject(null)}
          />
        )}
      </div>
    );
  }

  // Render active module
  const renderModule = () => {
    switch (activeMode) {
      case 'writing':
        return <ScriptEditor />;
      case 'proplist':
        return <PropListView />;
      case 'shotlist':
        return <ShotlistView />;
      default:
        return <ScriptEditor />;
    }
  };

  // Editor View with Modules
  return (
    <div className="app">
      <Sidebar />

      <header className="app-header">
        <div className="app-header-left">
          <button
            className="btn btn-ghost hamburger-btn"
            onClick={toggleSidebar}
            title="Open menu"
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </button>
          <div className="header-divider" />
          <button
            className="btn btn-ghost"
            onClick={handleCloseProject}
            title="Back to projects"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="btn-label-desktop">Projects</span>
          </button>
          <div className="header-divider" />
          <div className="project-title-wrapper">
            <input
              type="text"
              className="project-title-input"
              value={currentProject?.title || ''}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Untitled Screenplay"
            />
            {currentProject?.isCloudSynced && <CloudIcon />}
            {isDirty && !isSaving && <span className="unsaved-indicator" title="Unsaved changes" />}
            {isSaving && <span className="saving-indicator">Saving...</span>}
          </div>
          <div className="mode-indicator">
            <span className="mode-badge">{MODE_LABELS[activeMode]}</span>
          </div>
        </div>
        <div className="app-header-right">
          {/* Share button when in editor */}
          {user && currentProject && !currentProject.isShared && (
            <button
              className="btn btn-ghost"
              onClick={() => setShareModalProject({ id: currentProject.id, title: currentProject.title })}
              title="Share project"
            >
              <ShareIcon />
            </button>
          )}

          <button
            className="btn btn-ghost theme-toggle-header"
            onClick={toggleTheme}
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Export buttons - show based on mode */}
          {activeMode === 'proplist' && (
            <button
              className="btn btn-secondary"
              onClick={() => setExportModal('props')}
            >
              Export Props
            </button>
          )}
          {activeMode === 'shotlist' && (
            <button
              className="btn btn-secondary"
              onClick={() => setExportModal('shots')}
            >
              Export Shots
            </button>
          )}
          {activeMode === 'writing' && (
            <button
              className="btn btn-secondary"
              onClick={() => setExportModal('script')}
            >
              Export Script
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {renderModule()}
      </main>

      {/* Export Modal */}
      {exportModal && (
        <ExportModal
          type={exportModal}
          onClose={() => setExportModal(null)}
        />
      )}

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      {shareModalProject && (
        <ShareModal
          projectId={shareModalProject.id}
          projectTitle={shareModalProject.title}
          onClose={() => setShareModalProject(null)}
        />
      )}
    </div>
  );
}

export default App;
