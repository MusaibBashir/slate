import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
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
import { useAuthStore } from '../store/authStore';
import { SupabaseProvider, generateUserColor } from '../lib/SupabaseProvider';
import './ScriptEditor.css';

interface ScriptEditorProps {
    className?: string;
}

interface CollaboratorPresence {
    userId: string;
    userName: string;
    userColor: string;
    cursor?: { from: number; to: number };
}

export function ScriptEditor({ className = '' }: ScriptEditorProps) {
    const { currentProject, updateContent, setDirty } = useProjectStore();
    const { user, profile } = useAuthStore();
    const editorAreaRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<'page' | 'continuous'>('page');
    const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);

    // Create Yjs document
    const ydoc = useMemo(() => new Y.Doc(), [currentProject?.id]);

    // Supabase provider for real-time sync
    const providerRef = useRef<SupabaseProvider | null>(null);

    // User color for cursor (stored in session)
    const userColor = useMemo(() => {
        const stored = sessionStorage.getItem('slate-user-color');
        if (stored) return stored;
        const color = generateUserColor();
        sessionStorage.setItem('slate-user-color', color);
        return color;
    }, []);

    // Check if collaboration is enabled (user logged in + cloud synced project)
    const isCollaborative = !!(user && currentProject && currentProject.isCloudSynced);

    // Initialize Supabase provider for real-time sync
    useEffect(() => {
        if (!isCollaborative || !user || !currentProject) {
            return;
        }

        // Create provider
        providerRef.current = new SupabaseProvider(ydoc, {
            projectId: currentProject.id,
            userId: user.id,
            userName: profile?.display_name || user.email || 'Anonymous',
            userColor,
        });

        // Listen for awareness changes
        const unsubscribe = providerRef.current.onAwarenessChange((states) => {
            const collabs: CollaboratorPresence[] = [];
            states.forEach((state, id) => {
                if (id !== user.id) {
                    collabs.push({
                        userId: id,
                        userName: state.userName || 'Anonymous',
                        userColor: state.userColor || '#888',
                        cursor: state.cursor,
                    });
                }
            });
            setCollaborators(collabs);
        });

        return () => {
            unsubscribe();
            providerRef.current?.destroy();
            providerRef.current = null;
        };
    }, [isCollaborative, user, currentProject?.id, userColor, profile, ydoc]);

    // Build editor extensions
    const extensions = useMemo(() => {
        const baseExtensions: any[] = [
            StarterKit.configure({
                heading: false,
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'sceneHeading') return 'INT./EXT. LOCATION - DAY/NIGHT';
                    if (node.type.name === 'character') return 'CHARACTER NAME';
                    if (node.type.name === 'dialogue') return 'Dialogue...';
                    if (node.type.name === 'parenthetical') return '(acting direction)';
                    if (node.type.name === 'transition') return 'CUT TO:';
                    if (node.type.name === 'shot') return 'SHOT DESCRIPTION';
                    if (node.type.name === 'action') return 'Action/description...';
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
        ];

        // Add collaboration extensions if enabled
        if (isCollaborative && providerRef.current) {
            baseExtensions.push(
                Collaboration.configure({
                    document: ydoc,
                }),
                CollaborationCursor.configure({
                    provider: providerRef.current as any,
                    user: {
                        name: profile?.display_name || user?.email || 'Anonymous',
                        color: userColor,
                    },
                })
            );
        }

        return baseExtensions;
    }, [isCollaborative, ydoc, userColor, profile, user]);

    const editor = useEditor({
        extensions,
        content: isCollaborative ? undefined : (currentProject?.content || ''),
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
    }, [extensions]);

    // Auto-pagination logic
    const paginationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const checkPagination = useCallback(() => {
        if (!editor || viewMode === 'continuous') return;

        const { view } = editor;
        const dom = view.dom;
        const children = Array.from(dom.children);

        let currentHeight = 0;
        const PAGE_HEIGHT_LIMIT = 936;

        for (let i = 0; i < children.length; i++) {
            const child = children[i] as HTMLElement;

            if (child.getAttribute('data-type') === 'page-break') {
                currentHeight = 0;
                continue;
            }

            const height = child.offsetHeight;
            const style = window.getComputedStyle(child);
            const marginTop = parseInt(style.marginTop) || 0;
            const marginBottom = parseInt(style.marginBottom) || 0;
            const totalNodeHeight = height + marginTop + marginBottom;

            if (currentHeight + totalNodeHeight > PAGE_HEIGHT_LIMIT) {
                const prevChild = children[i - 1];
                const isPrevBreak = prevChild && prevChild.getAttribute('data-type') === 'page-break';

                if (!isPrevBreak) {
                    try {
                        const pos = view.posAtDOM(child, 0);
                        if (pos >= 0) {
                            console.log('Auto-paginating at height:', currentHeight + totalNodeHeight);
                            editor.chain().insertContentAt(pos, { type: 'pageBreak' }).run();
                            return;
                        }
                    } catch (e) {
                        console.warn('Pagination calc error:', e);
                    }
                }
                currentHeight = totalNodeHeight;
            } else {
                currentHeight += totalNodeHeight;
            }
        }
    }, [editor, viewMode]);

    // Update editor content when project changes (non-collaborative mode)
    useEffect(() => {
        if (editor && !isCollaborative && currentProject?.content !== undefined) {
            const currentContent = editor.getHTML();
            if (currentContent !== currentProject.content) {
                editor.commands.setContent(currentProject.content || '');
            }
        }
    }, [editor, currentProject?.id, isCollaborative]);

    // Initialize Yjs doc with existing content (collaborative mode)
    useEffect(() => {
        if (isCollaborative && currentProject?.content && ydoc) {
            // Only initialize if doc is empty
            const fragment = ydoc.getXmlFragment('prosemirror');
            if (fragment.length === 0 && currentProject.content) {
                // The editor will handle initial content via Collaboration extension
            }
        }
    }, [isCollaborative, currentProject?.content, ydoc]);

    const handleSave = useCallback(() => {
        if (editor) {
            const content = editor.getHTML();
            updateContent(content);
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
            }, 1000);
        };

        editor.on('update', handleUpdate);
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

            {/* Collaborator presence indicator */}
            {isCollaborative && collaborators.length > 0 && (
                <div className="collaborators-bar">
                    <span className="collaborators-label">Editing with you:</span>
                    {collaborators.map((c) => (
                        <div
                            key={c.userId}
                            className="collaborator-badge"
                            style={{ backgroundColor: c.userColor }}
                            title={c.userName}
                        >
                            {c.userName[0].toUpperCase()}
                        </div>
                    ))}
                </div>
            )}

            <div className={`script-editor-wrapper ${viewMode === 'continuous' ? 'continuous-mode' : ''}`}>
                <Autocomplete editor={editor} />
                <TitlePage />
                <div ref={editorAreaRef} className="script-editor-page">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}

export default ScriptEditor;
