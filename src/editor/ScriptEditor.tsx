import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
    SceneHeading,
    Action,
    Character,
    Dialogue,
    Parenthetical,
    Transition,
    Shot,
    PageBreak,
} from './extensions';
import { Toolbar } from './Toolbar';
import { Autocomplete } from './Autocomplete';
import { TitlePage } from '../components/TitlePage';
import { useProjectStore } from '../store/projectStore';
import { useEffect, useCallback, useRef, useState } from 'react';
import './ScriptEditor.css';

interface ScriptEditorProps {
    className?: string;
}

export function ScriptEditor({ className = '' }: ScriptEditorProps) {
    const { currentProject, updateContent, setDirty } = useProjectStore();
    const editorAreaRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<'page' | 'continuous'>('page');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Disable default heading as we use our custom SceneHeading
                heading: false,
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'sceneHeading') {
                        return 'INT./EXT. LOCATION - DAY/NIGHT';
                    }
                    if (node.type.name === 'character') {
                        return 'CHARACTER NAME';
                    }
                    if (node.type.name === 'dialogue') {
                        return 'Dialogue...';
                    }
                    if (node.type.name === 'parenthetical') {
                        return '(acting direction)';
                    }
                    if (node.type.name === 'transition') {
                        return 'CUT TO:';
                    }
                    if (node.type.name === 'shot') {
                        return 'SHOT DESCRIPTION';
                    }
                    if (node.type.name === 'action') {
                        return 'Action/description...';
                    }
                    return 'Start writing your screenplay...';
                },
            }),
            SceneHeading,
            Action,
            Character,
            Dialogue,
            Parenthetical,
            Transition,
            Shot,
            PageBreak,
        ],
        content: currentProject?.content || '',
        onUpdate: ({ editor }) => {
            const content = editor.getHTML();
            updateContent(content);
            setDirty(true);
        },
        editorProps: {
            attributes: {
                class: 'script-editor-content',
                spellcheck: 'true',
            },
        },
    });

    // Auto-pagination logic
    const paginationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const checkPagination = useCallback(() => {
        if (!editor || viewMode === 'continuous') return;

        // Use a slight delay to ensure DOM is updated
        const { view } = editor;
        const dom = view.dom;
        const children = Array.from(dom.children);

        let currentHeight = 0;

        // Use the same printable height as PDF export for consistency
        // PDF: 702pt printable = ~936px at 96dpi
        const PAGE_HEIGHT_LIMIT = 936;

        for (let i = 0; i < children.length; i++) {
            const child = children[i] as HTMLElement;

            // If it's a page break, reset height
            if (child.getAttribute('data-type') === 'page-break') {
                currentHeight = 0;
                continue;
            }

            const height = child.offsetHeight;
            const style = window.getComputedStyle(child);
            const marginTop = parseInt(style.marginTop) || 0;
            const marginBottom = parseInt(style.marginBottom) || 0;
            const totalNodeHeight = height + marginTop + marginBottom;

            // Check if this node pushes us over the limit
            if (currentHeight + totalNodeHeight > PAGE_HEIGHT_LIMIT) {
                // If the previous sibling is NOT a page break (avoid double breaks)
                const prevChild = children[i - 1];
                const isPrevBreak = prevChild && prevChild.getAttribute('data-type') === 'page-break';

                if (!isPrevBreak) {
                    try {
                        const pos = view.posAtDOM(child, 0);
                        if (pos >= 0) {
                            // Insert page break before this node
                            // We use queueMicrotask or setTimeout to avoid synchronous update loops if caught in one
                            console.log('Auto-paginating at height:', currentHeight + totalNodeHeight);
                            editor.chain().insertContentAt(pos, { type: 'pageBreak' }).run();
                            return; // Stop after one insertion to let React/Tiptap settle
                        }
                    } catch (e) {
                        console.warn('Pagination calc error:', e);
                    }
                }
                // Even if we inserted (or didn't), effectively this node starts a new page context
                // But if we inserted, the loop ends. If we didn't (because prev was break), reset.
                currentHeight = totalNodeHeight;
            } else {
                currentHeight += totalNodeHeight;
            }
        }
    }, [editor, viewMode]);

    // Update editor content when project changes
    useEffect(() => {
        if (editor && currentProject?.content !== undefined) {
            const currentContent = editor.getHTML();
            if (currentContent !== currentProject.content) {
                editor.commands.setContent(currentProject.content || '');
            }
        }
    }, [editor, currentProject?.id]);

    const handleSave = useCallback(() => {
        if (editor) {
            const content = editor.getHTML();
            updateContent(content);
            // Trigger save logic
            console.log('Saving project...');
        }
    }, [editor, updateContent]);

    // Keyboard shortcut for save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    // Hook up pagination to updates
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            if (paginationTimeoutRef.current) {
                clearTimeout(paginationTimeoutRef.current);
            }
            paginationTimeoutRef.current = setTimeout(() => {
                checkPagination();
            }, 1000); // 1s debounce to avoid interrupting typing
        };

        editor.on('update', handleUpdate);

        // Also run once on mount/content change to paginate existing content
        handleUpdate();

        return () => {
            editor.off('update', handleUpdate);
            if (paginationTimeoutRef.current) {
                clearTimeout(paginationTimeoutRef.current);
            }
        };
    }, [editor, checkPagination]);

    if (!editor) {
        return <div className="script-editor-loading">Loading editor...</div>;
    }

    return (
        <div className={`script-editor ${className}`}>
            <Toolbar
                editor={editor}
                onSave={handleSave}
                viewMode={viewMode}
                onToggleView={() => setViewMode(v => v === 'page' ? 'continuous' : 'page')}
            />
            <div className={`script-editor-wrapper ${viewMode === 'continuous' ? 'continuous-mode' : ''}`}>
                <Autocomplete editor={editor} />

                {/* Title Page - rendered as React component for correct styling */}
                <TitlePage />

                {/* Main Editor Area */}
                <div ref={editorAreaRef} className="script-editor-page">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}

export default ScriptEditor;
