import { Node, mergeAttributes } from '@tiptap/core';

export interface ActionOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        action: {
            setAction: () => ReturnType;
            toggleAction: () => ReturnType;
        };
    }
}

export const Action = Node.create<ActionOptions>({
    name: 'action',
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
                tag: 'div[data-type="action"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'action',
                class: 'script-element action',
            }),
            0,
        ];
    },

    addCommands() {
        return {
            setAction:
                () =>
                    ({ commands }) => {
                        return commands.setNode(this.name);
                    },
            toggleAction:
                () =>
                    ({ commands }) => {
                        return commands.toggleNode(this.name, 'paragraph');
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-2': () => this.editor.commands.toggleAction(),
        };
    },
});

export default Action;
