import { useState, useEffect } from 'react';
import { ScriptEditor } from './editor';
import { Sidebar } from './components/Sidebar';
import { ExportModal } from './components/ExportModal';
import { NewProjectModal } from './components/NewProjectModal';
import { PropListView } from './modules/proplist';
import { ShotlistView } from './modules/shotlist';
import { useProjectStore } from './store/projectStore';
import { useThemeStore } from './store/themeStore';
import { useAppStore } from './store/appStore';
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

const MODE_LABELS = {
  writing: 'Writing',
  proplist: 'Prop List',
  shotlist: 'Shotlist',
};

function App() {
  const {
    projects,
    currentProject,
    createProject,
    openProject,
    closeProject,
    updateTitle,
    deleteProject,
    duplicateProject,
    saveProject,
    isDirty
  } = useProjectStore();

  const { resolvedTheme, setTheme } = useThemeStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen, activeMode, setActiveMode } = useAppStore();

  const [showProjectBrowser, setShowProjectBrowser] = useState(!currentProject);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [exportModal, setExportModal] = useState<'props' | 'shots' | 'script' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  // Auto-save effect
  useEffect(() => {
    if (isDirty && currentProject) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        saveProject();
        setIsSaving(false);
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [isDirty, currentProject, saveProject]);

  const handleCreateProject = (title: string, author: string, email: string) => {
    createProject(title, author, email);
    setIsNewProjectModalOpen(false);
    setShowProjectBrowser(false);
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

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };

  // Export PDF moved to ExportModal component

  // Project Browser View
  if (showProjectBrowser) {
    return (
      <div className="app">
        <div className="project-browser">
          <header className="project-browser-header">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            <div className="logo">
              <h1>Slate</h1>
            </div>
            <p className="tagline">Professional Screenwriting Software</p>
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

          {projects.length > 0 && (
            <section className="projects-section">
              <h2>Recent Projects</h2>
              <div className="projects-grid">
                {projects
                  .filter(p => p.title.toLowerCase().includes(projectSearchQuery.toLowerCase()))
                  .map((project) => (
                    <div
                      key={project.id}
                      className="project-card"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      <div className="project-card-content">
                        <h3>{project.title}</h3>
                        <p className="project-date">
                          {new Date(project.updatedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="project-card-actions">
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
                      </div>
                    </div>
                  ))}
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
            {isDirty && !isSaving && <span className="unsaved-indicator" title="Unsaved changes" />}
            {isSaving && <span className="saving-indicator">Saving...</span>}
          </div>
          <div className="mode-indicator">
            <span className="mode-badge">{MODE_LABELS[activeMode]}</span>
          </div>
        </div>
        <div className="app-header-right">
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
    </div>
  );
}

export default App;
