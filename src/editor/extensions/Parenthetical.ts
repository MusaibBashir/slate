import { Node, mergeAttributes } from '@tiptap/core';

export interface ParentheticalOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        parenthetical: {
            setParenthetical: () => ReturnType;
            toggleParenthetical: () => ReturnType;
        };
    }
}

export const Parenthetical = Node.create<ParentheticalOptions>({
    name: 'parenthetical',
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
                tag: 'div[data-type="parenthetical"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'parenthetical',
                class: 'script-element parenthetical',
            }),
            0,
        ];
    },

    addCommands() {
        return {
            setParenthetical:
                () =>
                    ({ commands }) => {
                        return commands.setNode(this.name);
                    },
            toggleParenthetical:
                () =>
                    ({ commands }) => {
                        return commands.toggleNode(this.name, 'paragraph');
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-5': () => this.editor.commands.toggleParenthetical(),
        };
    },
});

export default Parenthetical;
