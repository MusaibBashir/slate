import { Editor } from '@tiptap/react';
import './FloatingToolbar.css';

interface FloatingToolbarProps {
    editor: Editor;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
    return (
        <div className="floating-toolbar">
            <div className="floating-toolbar-inner">
                {/* Undo */}
                <button
                    className="floating-toolbar-btn"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (Ctrl+Z)"
                    aria-label="Undo"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7v6h6" />
                        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                    </svg>
                </button>

                {/* Redo */}
                <button
                    className="floating-toolbar-btn"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (Ctrl+Shift+Z)"
                    aria-label="Redo"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 7v6h-6" />
                        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                    </svg>
                </button>

                <span className="floating-toolbar-divider" />

                {/* Bold */}
                <button
                    className={`floating-toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold (Ctrl+B)"
                    aria-label="Bold"
                >
                    <strong>B</strong>
                </button>

                {/* Italic */}
                <button
                    className={`floating-toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic (Ctrl+I)"
                    aria-label="Italic"
                >
                    <em>I</em>
                </button>

                {/* Underline */}
                <button
                    className={`floating-toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Underline (Ctrl+U)"
                    aria-label="Underline"
                >
                    <span style={{ textDecoration: 'underline' }}>U</span>
                </button>

                {/* Strikethrough */}
                <button
                    className={`floating-toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Strikethrough"
                    aria-label="Strikethrough"
                >
                    <span style={{ textDecoration: 'line-through' }}>S</span>
                </button>

                <span className="floating-toolbar-divider" />

                {/* Font Size / Text Options */}
                <button
                    className="floating-toolbar-btn"
                    onClick={() => {
                        // Font size functionality - could open a dropdown
                        console.log('Font size options');
                    }}
                    title="Text Options"
                    aria-label="Text Options"
                >
                    <span className="floating-toolbar-text-icon">Aa</span>
                </button>

                {/* Highlight / Clear Formatting */}
                <button
                    className="floating-toolbar-btn"
                    onClick={() => editor.chain().focus().unsetAllMarks().run()}
                    title="Clear Formatting"
                    aria-label="Clear Formatting"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                    </svg>
                </button>

                <span className="floating-toolbar-divider" />

                {/* Comment */}
                <button
                    className="floating-toolbar-btn"
                    onClick={() => {
                        // Comment functionality
                        console.log('Add comment');
                    }}
                    title="Add Comment"
                    aria-label="Add Comment"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default FloatingToolbar;
