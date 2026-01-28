import { Node, mergeAttributes } from '@tiptap/core';

export interface ShotOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        shot: {
            setShot: () => ReturnType;
            toggleShot: () => ReturnType;
        };
    }
}

export const Shot = Node.create<ShotOptions>({
    name: 'shot',
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
                tag: 'div[data-type="shot"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'shot',
                class: 'script-element shot',
            }),
            0,
        ];
    },

    addCommands() {
        return {
            setShot:
                () =>
                    ({ commands }) => {
                        return commands.setNode(this.name);
                    },
            toggleShot:
                () =>
                    ({ commands }) => {
                        return commands.toggleNode(this.name, 'paragraph');
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-7': () => this.editor.commands.toggleShot(),
            // After shot, Enter creates action
            'Enter': () => {
                if (this.editor.isActive('shot')) {
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

export default Shot;
