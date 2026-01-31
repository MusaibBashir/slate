import { useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useAppStore } from '../store/appStore';
import './ContentNavigator.css';

// Icons
function ChevronIcon({ expanded }: { expanded: boolean }) {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        >
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}

function FilterIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}

function ListIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    );
}

function GridIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
        </svg>
    );
}

function InboxIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
    );
}

export interface SceneData {
    id: string;
    heading: string;
    type: 'INT' | 'EXT' | 'OTHER';
    location: string;
    time: string;
    content: string;
    startIndex: number;
}

export interface ActData {
    id: string;
    name: string;
    scenes: SceneData[];
}

// Parse HTML content to extract scenes
function parseScenes(htmlContent: string): SceneData[] {
    const scenes: SceneData[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const elements = doc.body.children;

    let currentScene: SceneData | null = null;
    let sceneIndex = 0;

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        if (el.getAttribute('data-type') === 'scene-heading') {
            if (currentScene) {
                scenes.push(currentScene);
            }

            const headingText = el.textContent || 'UNTITLED SCENE';

            // Parse INT/EXT, location, and time
            let type: 'INT' | 'EXT' | 'OTHER' = 'OTHER';
            let location = headingText;
            let time = '';

            const match = headingText.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*(.+?)(?:\s*-\s*(.+))?$/i);
            if (match) {
                type = match[1].toUpperCase().startsWith('INT') ? 'INT' : 'EXT';
                location = match[2]?.trim() || headingText;
                time = match[3]?.trim() || '';
            }

            currentScene = {
                id: `scene-${sceneIndex}`,
                heading: headingText,
                type,
                location,
                time,
                content: el.outerHTML,
                startIndex: i,
            };
            sceneIndex++;
        } else if (currentScene) {
            currentScene.content += el.outerHTML;
        } else {
            if (!currentScene) {
                currentScene = {
                    id: 'scene-0',
                    heading: 'OPENING',
                    type: 'OTHER',
                    location: 'OPENING',
                    time: '',
                    content: el.outerHTML,
                    startIndex: 0,
                };
            }
        }
    }

    if (currentScene) {
        scenes.push(currentScene);
    }

    return scenes;
}

interface ContentNavigatorProps {
    onSceneClick?: (sceneId: string) => void;
}

export function ContentNavigator({ onSceneClick }: ContentNavigatorProps) {
    const { currentProject } = useProjectStore();
    const { currentSceneId, setCurrentSceneId } = useAppStore();
    const [expandedActs, setExpandedActs] = useState<Record<string, boolean>>({ 'act-1': true, 'act-2': true, 'act-3': true });
    const [activeTab, setActiveTab] = useState<'contents' | 'inbox'>('contents');
    const [showNumbers, setShowNumbers] = useState(true);

    const scenes = useMemo(() => {
        if (!currentProject?.content) return [];
        return parseScenes(currentProject.content);
    }, [currentProject?.content]);

    // Group scenes by acts (auto-detect or use default 3-act structure)
    const acts = useMemo((): ActData[] => {
        if (scenes.length === 0) return [];

        // For now, distribute scenes across 3 acts
        const third = Math.ceil(scenes.length / 3);
        return [
            { id: 'act-1', name: 'Act 1', scenes: scenes.slice(0, third) },
            { id: 'act-2', name: 'Act 2', scenes: scenes.slice(third, third * 2) },
            { id: 'act-3', name: 'Act 3', scenes: scenes.slice(third * 2) },
        ].filter(act => act.scenes.length > 0);
    }, [scenes]);

    const handleSceneClick = (scene: SceneData) => {
        setCurrentSceneId(scene.id);
        onSceneClick?.(scene.id);
    };

    const toggleAct = (actId: string) => {
        setExpandedActs(prev => ({ ...prev, [actId]: !prev[actId] }));
    };

    const getSceneNumber = (actIndex: number, sceneIndex: number): string => {
        let globalIndex = 0;
        for (let i = 0; i < actIndex; i++) {
            globalIndex += acts[i].scenes.length;
        }
        return String(globalIndex + sceneIndex + 1);
    };

    return (
        <aside className="content-navigator">
            {/* Header Tabs */}
            <div className="content-nav-tabs">
                <button
                    className={`content-nav-tab ${activeTab === 'contents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contents')}
                >
                    Contents
                </button>
                <button
                    className={`content-nav-tab ${activeTab === 'inbox' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inbox')}
                >
                    Inbox <InboxIcon />
                </button>
            </div>

            {/* Toolbar */}
            <div className="content-nav-toolbar">
                <div className="content-nav-toolbar-left">
                    <button className="content-nav-tool-btn" title="View options">
                        <GridIcon />
                    </button>
                    <button className="content-nav-tool-btn" title="List view">
                        <ListIcon />
                    </button>
                    <button className="content-nav-tool-btn" title="Filter">
                        <FilterIcon />
                    </button>
                </div>
                <button
                    className={`content-nav-numbers-btn ${showNumbers ? 'active' : ''}`}
                    onClick={() => setShowNumbers(!showNumbers)}
                    title="Show scene numbers"
                >
                    Numbers...
                </button>
            </div>

            {/* Scene List */}
            <div className="content-nav-list">
                {activeTab === 'contents' && (
                    <>
                        {acts.length === 0 ? (
                            <div className="content-nav-empty">
                                <p>No scenes found</p>
                                <p className="content-nav-empty-hint">Add scene headings (Ctrl+1) to organize your script</p>
                            </div>
                        ) : (
                            acts.map((act, actIndex) => (
                                <div key={act.id} className="content-nav-act">
                                    <button
                                        className="content-nav-act-header"
                                        onClick={() => toggleAct(act.id)}
                                    >
                                        <ChevronIcon expanded={expandedActs[act.id]} />
                                        <span className="content-nav-act-name">{act.name}</span>
                                    </button>

                                    {expandedActs[act.id] && (
                                        <div className="content-nav-scenes">
                                            {act.scenes.map((scene, sceneIndex) => (
                                                <button
                                                    key={scene.id}
                                                    className={`content-nav-scene ${currentSceneId === scene.id ? 'active' : ''}`}
                                                    onClick={() => handleSceneClick(scene)}
                                                >
                                                    <span className="content-nav-scene-heading">
                                                        {scene.heading}
                                                    </span>
                                                    {showNumbers && (
                                                        <span className="content-nav-scene-number">
                                                            {getSceneNumber(actIndex, sceneIndex)}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'inbox' && (
                    <div className="content-nav-empty">
                        <p>No items in inbox</p>
                    </div>
                )}
            </div>

            {/* Footer with expand/collapse controls */}
            <div className="content-nav-footer">
                <button className="content-nav-footer-btn" title="Expand/collapse">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                </button>
                <button className="content-nav-footer-btn" title="Settings">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}

export default ContentNavigator;
