import { useState, useMemo } from 'react';
import { SplitPane } from '../../components/SplitPane';
import { ScriptViewer, parseScenes } from '../../components/ScriptViewer';
import type { SceneData } from '../../components/ScriptViewer';
import { useProjectStore } from '../../store/projectStore';
import { useAppStore } from '../../store/appStore';
import { useShotlistStore } from '../../store/shotlistStore';
import './ShotlistView.css';

// Common shot types for quick add
const SHOT_TYPES = [
    { code: 'WS', name: 'Wide Shot' },
    { code: 'MS', name: 'Medium Shot' },
    { code: 'MCU', name: 'Medium Close-Up' },
    { code: 'CU', name: 'Close-Up' },
    { code: 'ECU', name: 'Extreme Close-Up' },
    { code: 'POV', name: 'Point of View' },
    { code: 'OTS', name: 'Over the Shoulder' },
    { code: 'TRACK', name: 'Tracking Shot' },
    { code: 'DOLLY', name: 'Dolly Shot' },
    { code: 'CRANE', name: 'Crane Shot' },
    { code: '2-SHOT', name: 'Two Shot' },
    { code: 'INSERT', name: 'Insert Shot' },
];

export function ShotlistView() {
    const { currentProject } = useProjectStore();
    const { currentSceneId, setCurrentSceneId } = useAppStore();
    const { addShot, deleteShot, updateShot, getSceneShots } = useShotlistStore();

    const [description, setDescription] = useState('');

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

    // Get shots for current scene
    const sceneShots = currentProject && currentScene
        ? getSceneShots(currentProject.id, currentScene.id)
        : undefined;

    const handleSceneClick = (scene: SceneData) => {
        setCurrentSceneId(scene.id);
    };

    const handleQuickAdd = (shotType: string) => {
        if (!currentProject || !currentScene) return;

        addShot(
            currentProject.id,
            currentScene.id,
            currentScene.heading,
            shotType,
            description.trim()
        );

        setDescription('');
    };

    const handleDeleteShot = (shotId: string) => {
        if (!currentProject || !currentScene) return;
        deleteShot(currentProject.id, currentScene.id, shotId);
    };

    const handleUpdateDescription = (shotId: string, newDescription: string) => {
        if (!currentProject || !currentScene) return;
        updateShot(currentProject.id, currentScene.id, shotId, { description: newDescription });
    };

    // Right pane - Shotlist entry
    const rightPane = (
        <div className="shotlist-editor">
            {currentScene ? (
                <>
                    <div className="shotlist-scene-indicator">
                        <span className="shotlist-scene-label">Adding shots for:</span>
                        <span className="shotlist-scene-heading">{currentScene.heading}</span>
                    </div>

                    {/* Quick Add Toolbar */}
                    <div className="shotlist-toolbar">
                        <span className="shotlist-toolbar-label">Quick Add:</span>
                        <div className="shotlist-quickadd-grid">
                            {SHOT_TYPES.map((type) => (
                                <button
                                    key={type.code}
                                    className="shotlist-quickadd-btn"
                                    onClick={() => handleQuickAdd(type.code)}
                                    title={type.name}
                                >
                                    {type.code}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optional Description Input */}
                    <div className="shotlist-description-row">
                        <input
                            type="text"
                            className="shotlist-description-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional: Add description before clicking shot type..."
                        />
                    </div>

                    {/* Shots List */}
                    <div className="shotlist-items">
                        {sceneShots?.shots.length ? (
                            sceneShots.shots.map((shot, index) => (
                                <div key={shot.id} className="shotlist-item">
                                    <span className="shotlist-item-number">{index + 1}</span>
                                    <span className="shotlist-item-type">{shot.shotType}</span>
                                    <input
                                        type="text"
                                        className="shotlist-item-description"
                                        value={shot.description}
                                        onChange={(e) => handleUpdateDescription(shot.id, e.target.value)}
                                        placeholder="Add description..."
                                    />
                                    <button
                                        className="shotlist-item-delete"
                                        onClick={() => handleDeleteShot(shot.id)}
                                        title="Delete shot"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="shotlist-empty">
                                No shots added for this scene yet.
                                <br />
                                <span className="shotlist-hint">Click a shot type above to add.</span>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="shotlist-no-scene">
                    <p>Select a scene from the script to add shots.</p>
                </div>
            )}
        </div>
    );

    return (
        <SplitPane
            left={<ScriptViewer onSceneClick={handleSceneClick} />}
            right={rightPane}
            leftTitle="Script (Read Only)"
            rightTitle="Shotlist"
        />
    );
}

export default ShotlistView;
