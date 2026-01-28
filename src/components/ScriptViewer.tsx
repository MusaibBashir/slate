import { useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useAppStore } from '../store/appStore';
import './ScriptViewer.css';

export interface SceneData {
    id: string;
    heading: string;
    content: string;
    startIndex: number;
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
            // Save previous scene
            if (currentScene) {
                scenes.push(currentScene);
            }

            // Start new scene
            currentScene = {
                id: `scene-${sceneIndex}`,
                heading: el.textContent || 'UNTITLED SCENE',
                content: el.outerHTML,
                startIndex: i,
            };
            sceneIndex++;
        } else if (currentScene) {
            // Add content to current scene
            currentScene.content += el.outerHTML;
        } else {
            // Content before first scene heading
            if (!currentScene) {
                currentScene = {
                    id: 'scene-0',
                    heading: 'OPENING',
                    content: el.outerHTML,
                    startIndex: 0,
                };
            }
        }
    }

    // Push last scene
    if (currentScene) {
        scenes.push(currentScene);
    }

    return scenes;
}

interface ScriptViewerProps {
    onSceneClick?: (scene: SceneData) => void;
}

export function ScriptViewer({ onSceneClick }: ScriptViewerProps) {
    const { currentProject } = useProjectStore();
    const { currentSceneId, setCurrentSceneId } = useAppStore();

    // Track which scene is expanded (null = show all in compact mode)
    const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);

    const scenes = useMemo(() => {
        if (!currentProject?.content) return [];
        return parseScenes(currentProject.content);
    }, [currentProject?.content]);

    const handleSceneClick = (scene: SceneData) => {
        // Expand this scene and select it
        setExpandedSceneId(scene.id);
        setCurrentSceneId(scene.id);
        onSceneClick?.(scene);
    };

    const handleBackClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedSceneId(null);
    };

    if (!currentProject?.content) {
        return (
            <div className="script-viewer-empty">
                <p>No script content available.</p>
                <p className="script-viewer-hint">Switch to Writing mode to create your screenplay.</p>
            </div>
        );
    }

    if (scenes.length === 0) {
        return (
            <div className="script-viewer-empty">
                <p>No scenes found.</p>
                <p className="script-viewer-hint">Add scene headings (Ctrl+1) to organize your script.</p>
            </div>
        );
    }

    // Expanded view - show single scene with full content
    if (expandedSceneId) {
        const expandedScene = scenes.find(s => s.id === expandedSceneId);

        if (!expandedScene) {
            setExpandedSceneId(null);
            return null;
        }

        return (
            <div className="script-viewer script-viewer-expanded">
                <div className="script-viewer-scene expanded active">
                    <div className="script-viewer-scene-header">
                        <span className="script-viewer-scene-number">
                            {expandedScene.id.replace('scene-', 'Scene ')}
                        </span>
                        <button
                            className="script-viewer-back-btn"
                            onClick={handleBackClick}
                            title="Back to all scenes"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            <span>All Scenes</span>
                        </button>
                    </div>
                    <div
                        className="script-viewer-scene-content expanded"
                        dangerouslySetInnerHTML={{ __html: expandedScene.content }}
                    />
                </div>
            </div>
        );
    }

    // Compact view - show all scenes
    return (
        <div className="script-viewer">
            {scenes.map((scene) => (
                <div
                    key={scene.id}
                    className={`script-viewer-scene ${currentSceneId === scene.id ? 'active' : ''}`}
                    onClick={() => handleSceneClick(scene)}
                >
                    <div className="script-viewer-scene-header">
                        <span className="script-viewer-scene-number">
                            {scene.id.replace('scene-', 'Scene ')}
                        </span>
                    </div>
                    <div
                        className="script-viewer-scene-content"
                        dangerouslySetInnerHTML={{ __html: scene.content }}
                    />
                </div>
            ))}
        </div>
    );
}

// Export the parse function for other components
export { parseScenes };
export default ScriptViewer;
