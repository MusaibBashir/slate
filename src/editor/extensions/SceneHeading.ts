import { Node, mergeAttributes } from '@tiptap/core';

export interface SceneHeadingOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        sceneHeading: {
            setSceneHeading: () => ReturnType;
            toggleSceneHeading: () => ReturnType;
        };
    }
}

export const SceneHeading = Node.create<SceneHeadingOptions>({
    name: 'sceneHeading',
    group: 'block',
    content: 'inline*',
    defining: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="scene-heading"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'scene-heading',
                class: 'script-element scene-heading',
            }),
            0,
        ];
    },

    addCommands() {
        return {
            setSceneHeading:
                () =>
                    ({ commands }) => {
                        return commands.setNode(this.name);
                    },
            toggleSceneHeading:
                () =>
                    ({ commands }) => {
                        return commands.toggleNode(this.name, 'paragraph');
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-1': () => this.editor.commands.toggleSceneHeading(),
            // After scene heading, Enter creates an action
            'Enter': () => {
                if (this.editor.isActive('sceneHeading')) {
                    return this.editor.chain()
                        .splitBlock()
                        .setAction()
                        .run();
                }
                return false;
            },
        };
    },
});

export default SceneHeading;
