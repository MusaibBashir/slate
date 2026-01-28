import { Editor } from '@tiptap/react';
import './Toolbar.css';

interface ToolbarProps {
    editor: Editor;
    onSave: () => void;
    viewMode: 'page' | 'continuous';
    onToggleView: () => void;
}

interface ToolbarButton {
    label: string;
    shortcut: string;
    action: () => void;
    isActive: () => boolean;
}

export function Toolbar({ editor, onSave, viewMode, onToggleView }: ToolbarProps) {
    const elementButtons: ToolbarButton[] = [
        {
            label: 'Scene',
            shortcut: '⌘1',
            action: () => editor.chain().focus().toggleSceneHeading().run(),
            isActive: () => editor.isActive('sceneHeading'),
        },
        {
            label: 'Action',
            shortcut: '⌘2',
            action: () => editor.chain().focus().toggleAction().run(),
            isActive: () => editor.isActive('action'),
        },
        {
            label: 'Character',
            shortcut: '⌘3',
            action: () => editor.chain().focus().toggleCharacter().run(),
            isActive: () => editor.isActive('character'),
        },
        {
            label: 'Dialogue',
            shortcut: '⌘4',
            action: () => editor.chain().focus().toggleDialogue().run(),
            isActive: () => editor.isActive('dialogue'),
        },
        {
            label: 'Parenthetical',
            shortcut: '⌘5',
            action: () => editor.chain().focus().toggleParenthetical().run(),
            isActive: () => editor.isActive('parenthetical'),
        },
        {
            label: 'Transition',
            shortcut: '⌘6',
            action: () => editor.chain().focus().toggleTransition().run(),
            isActive: () => editor.isActive('transition'),
        },
        {
            label: 'Shot',
            shortcut: '⌘7',
            action: () => editor.chain().focus().toggleShot().run(),
            isActive: () => editor.isActive('shot'),
        },
        {
            label: 'Page Break',
            shortcut: '⌘Enter',
            action: () => editor.commands.setPageBreak(),
            isActive: () => false, // Action only, no state
        },
    ];

    return (
        <div className="toolbar">
            <div className="toolbar-group toolbar-elements">
                {elementButtons.map((button) => (
                    <button
                        key={button.label}
                        className={`toolbar-button ${button.isActive() ? 'active' : ''}`}
                        onClick={button.action}
                        title={`${button.label} (${button.shortcut})`}
                    >
                        {button.label === 'Page Break' ? (
                            <span className="toolbar-button-label">
                                <span style={{ fontSize: '10px', opacity: 0.7 }}>---</span> Break
                            </span>
                        ) : (
                            <span className="toolbar-button-label">{button.label}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group toolbar-history">
                <button
                    className="toolbar-button toolbar-button-icon"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (⌘Z)"
                    aria-label="Undo"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7v6h6" />
                        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                    </svg>
                </button>
                <button
                    className="toolbar-button toolbar-button-icon"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (⌘⇧Z)"
                    aria-label="Redo"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 7v6h-6" />
                        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                    </svg>
                </button>
            </div>

            <div className="toolbar-spacer" />

            <div className="toolbar-group toolbar-view-options">
                <button
                    className={`toolbar-button toolbar-button-icon ${viewMode === 'continuous' ? 'active' : ''}`}
                    onClick={onToggleView}
                    title={viewMode === 'page' ? "Switch to Continuous View" : "Switch to Page View"}
                >
                    {viewMode === 'page' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                            <line x1="9" y1="2" x2="9" y2="22"></line>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                    )}
                </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group toolbar-actions">
                <button
                    className="toolbar-button toolbar-button-primary"
                    onClick={onSave}
                    title="Save (⌘S)"
                >
                    Save
                </button>
            </div>
        </div>
    );
}

export default Toolbar;
