import type { AppMode } from '../store/appStore';
import { useAppStore } from '../store/appStore';
import './Sidebar.css';

interface NavItem {
    id: AppMode;
    label: string;
    description: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'writing', label: 'Writing', description: 'Script Editor' },
    { id: 'proplist', label: 'Prop List', description: 'Production Props' },
    { id: 'shotlist', label: 'Shotlist', description: 'Camera Shots' },
];

// Icons
function PenIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
        </svg>
    );
}

function ListIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    );
}

function CameraIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
    );
}

function getIcon(mode: AppMode) {
    switch (mode) {
        case 'writing': return <PenIcon />;
        case 'proplist': return <ListIcon />;
        case 'shotlist': return <CameraIcon />;
    }
}

export function Sidebar() {
    const { sidebarOpen, activeMode, setActiveMode, setSidebarOpen } = useAppStore();

    const handleNavClick = (mode: AppMode) => {
        setActiveMode(mode);
    };

    return (
        <>
            {/* Backdrop */}
            {sidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <span className="sidebar-title">Modules</span>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            className={`sidebar-nav-item ${activeMode === item.id ? 'active' : ''}`}
                            onClick={() => handleNavClick(item.id)}
                        >
                            <span className="sidebar-nav-icon">{getIcon(item.id)}</span>
                            <div className="sidebar-nav-text">
                                <span className="sidebar-nav-label">{item.label}</span>
                                <span className="sidebar-nav-description">{item.description}</span>
                            </div>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-hint">
                        Press <kbd>Esc</kbd> to close
                    </div>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
