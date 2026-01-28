import { useState, useMemo } from 'react';
import { SplitPane } from '../../components/SplitPane';
import { ScriptViewer, parseScenes } from '../../components/ScriptViewer';
import type { SceneData } from '../../components/ScriptViewer';
import { useProjectStore } from '../../store/projectStore';
import { useAppStore } from '../../store/appStore';
import { usePropListStore } from '../../store/propListStore';
import type { Priority, PropStatus, PropItem } from '../../store/propListStore';
import './PropListView.css';

const PRIORITY_OPTIONS: { value: Priority; label: string; style: string }[] = [
    { value: 'high', label: 'High', style: 'bold' },
    { value: 'mid', label: 'Mid', style: 'italic' },
    { value: 'low', label: 'Low', style: 'normal' },
];

export function PropListView() {
    const { currentProject } = useProjectStore();
    const { currentSceneId, setCurrentSceneId } = useAppStore();
    const { addProp, deleteProp, updateProp, setStatus, getSceneProps } = usePropListStore();

    const [newPropText, setNewPropText] = useState('');
    const [selectedPriority, setSelectedPriority] = useState<Priority>('mid');
    const [showScript, setShowScript] = useState(true);

    // Parse scenes from script
    const scenes = useMemo(() => {
        if (!currentProject?.content) return [];
        return parseScenes(currentProject.content);
    }, [currentProject?.content]);

    // Get current scene data
    const currentScene = useMemo(() => {
        if (!currentSceneId && scenes.length > 0) {
            return scenes[0];
        }
        return scenes.find((s) => s.id === currentSceneId);
    }, [currentSceneId, scenes]);

    // Get props for current scene
    const sceneProps = currentProject && currentScene
        ? getSceneProps(currentProject.id, currentScene.id)
        : undefined;

    // Group props by status
    const groupedProps = useMemo(() => {
        if (!sceneProps?.props) return { obtained: [], pending: [], failed: [] };

        const obtained: PropItem[] = [];
        const pending: PropItem[] = [];
        const failed: PropItem[] = [];

        sceneProps.props.forEach((prop) => {
            // Handle legacy props without status
            const status = prop.status || 'pending';
            if (status === 'obtained') obtained.push(prop);
            else if (status === 'failed') failed.push(prop);
            else pending.push(prop);
        });

        return { obtained, pending, failed };
    }, [sceneProps?.props]);

    const handleSceneClick = (scene: SceneData) => {
        setCurrentSceneId(scene.id);
    };

    const handleAddProp = () => {
        if (!newPropText.trim() || !currentProject || !currentScene) return;

        addProp(
            currentProject.id,
            currentScene.id,
            currentScene.heading,
            newPropText.trim(),
            selectedPriority
        );

        setNewPropText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddProp();
        }
    };

    const handleDeleteProp = (propId: string) => {
        if (!currentProject || !currentScene) return;
        deleteProp(currentProject.id, currentScene.id, propId);
    };

    const handleSetStatus = (propId: string, status: PropStatus) => {
        if (!currentProject || !currentScene) return;
        setStatus(currentProject.id, currentScene.id, propId, status);
    };

    const handleTogglePriority = (propId: string, currentPriority: Priority) => {
        if (!currentProject || !currentScene) return;
        const priorities: Priority[] = ['high', 'mid', 'low'];
        const nextIndex = (priorities.indexOf(currentPriority) + 1) % priorities.length;
        updateProp(currentProject.id, currentScene.id, propId, { priority: priorities[nextIndex] });
    };

    // Render a prop item with hover actions
    const renderPropItem = (prop: PropItem) => (
        <div key={prop.id} className={`proplist-item status-${prop.status || 'pending'}`}>
            <button
                className={`proplist-item-priority priority-${prop.priority}`}
                onClick={() => handleTogglePriority(prop.id, prop.priority)}
                title="Click to change priority"
            >
                {prop.priority.charAt(0).toUpperCase()}
            </button>
            <span className={`proplist-item-text priority-${prop.priority}`}>
                {prop.text}
            </span>
            <div className="proplist-item-actions">
                <button
                    className={`proplist-action-btn obtained ${prop.status === 'obtained' ? 'active' : ''}`}
                    onClick={() => handleSetStatus(prop.id, prop.status === 'obtained' ? 'pending' : 'obtained')}
                    title="Mark as obtained"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </button>
                <button
                    className={`proplist-action-btn failed ${prop.status === 'failed' ? 'active' : ''}`}
                    onClick={() => handleSetStatus(prop.id, prop.status === 'failed' ? 'pending' : 'failed')}
                    title="Mark as failed to obtain"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
                <button
                    className="proplist-action-btn delete"
                    onClick={() => handleDeleteProp(prop.id)}
                    title="Delete prop"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                </button>
            </div>
        </div>
    );

    // Prop list content
    const propListContent = (
        <div className={`proplist-editor ${!showScript ? 'fullscreen' : ''}`}>
            {/* Toggle script visibility */}
            <div className="proplist-header-row">
                <button
                    className={`proplist-toggle-btn ${!showScript ? 'active' : ''}`}
                    onClick={() => setShowScript(!showScript)}
                    title={showScript ? 'Hide script' : 'Show script'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {showScript ? (
                            <>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="9" y1="3" x2="9" y2="21" />
                            </>
                        ) : (
                            <>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            </>
                        )}
                    </svg>
                    <span>{showScript ? 'Hide Script' : 'Show Script'}</span>
                </button>
            </div>

            {currentScene ? (
                <>
                    <div className="proplist-scene-indicator">
                        <span className="proplist-scene-label">Adding props for:</span>
                        <span className="proplist-scene-heading">{currentScene.heading}</span>
                    </div>

                    {/* Priority Toolbar */}
                    <div className="proplist-toolbar">
                        <span className="proplist-toolbar-label">Priority:</span>
                        <div className="proplist-priority-group">
                            {PRIORITY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`proplist-priority-btn ${selectedPriority === opt.value ? 'active' : ''}`}
                                    onClick={() => setSelectedPriority(opt.value)}
                                    title={`${opt.label} Priority (renders as ${opt.style})`}
                                >
                                    <span className={`priority-preview priority-${opt.value}`}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add Prop Input */}
                    <div className="proplist-input-row">
                        <input
                            type="text"
                            className="proplist-input"
                            value={newPropText}
                            onChange={(e) => setNewPropText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter prop item..."
                        />
                        <button
                            className="proplist-add-btn"
                            onClick={handleAddProp}
                            disabled={!newPropText.trim()}
                        >
                            Add
                        </button>
                    </div>

                    {/* Props List - Grouped by Status */}
                    <div className="proplist-sections">
                        {/* Pending Section */}
                        {groupedProps.pending.length > 0 && (
                            <div className="proplist-section">
                                <div className="proplist-section-header pending">
                                    <span className="proplist-section-title">Yet to Obtain</span>
                                    <span className="proplist-section-count">{groupedProps.pending.length}</span>
                                </div>
                                <div className="proplist-items">
                                    {groupedProps.pending.map(renderPropItem)}
                                </div>
                            </div>
                        )}

                        {/* Obtained Section */}
                        {groupedProps.obtained.length > 0 && (
                            <div className="proplist-section">
                                <div className="proplist-section-header obtained">
                                    <span className="proplist-section-title">Obtained</span>
                                    <span className="proplist-section-count">{groupedProps.obtained.length}</span>
                                </div>
                                <div className="proplist-items">
                                    {groupedProps.obtained.map(renderPropItem)}
                                </div>
                            </div>
                        )}

                        {/* Failed Section */}
                        {groupedProps.failed.length > 0 && (
                            <div className="proplist-section">
                                <div className="proplist-section-header failed">
                                    <span className="proplist-section-title">Failed to Obtain</span>
                                    <span className="proplist-section-count">{groupedProps.failed.length}</span>
                                </div>
                                <div className="proplist-items">
                                    {groupedProps.failed.map(renderPropItem)}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {sceneProps?.props.length === 0 && (
                            <div className="proplist-empty">
                                No props added for this scene yet.
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="proplist-no-scene">
                    <p>Select a scene from the script to add props.</p>
                </div>
            )}
        </div>
    );

    // Fullscreen mode - just show prop list
    if (!showScript) {
        return propListContent;
    }

    // Split view with script
    return (
        <SplitPane
            left={<ScriptViewer onSceneClick={handleSceneClick} />}
            right={propListContent}
            leftTitle="Script (Read Only)"
            rightTitle="Prop List"
        />
    );
}

export default PropListView;
