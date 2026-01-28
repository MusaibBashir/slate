import { Node, mergeAttributes } from '@tiptap/core';

export interface DialogueOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        dialogue: {
            setDialogue: () => ReturnType;
            toggleDialogue: () => ReturnType;
        };
    }
}

export const Dialogue = Node.create<DialogueOptions>({
    name: 'dialogue',
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
                tag: 'div[data-type="dialogue"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'dialogue',
                class: 'script-element dialogue',
            }),
            0,
        ];
    },

    addCommands() {
        return {
            setDialogue:
                () =>
                    ({ commands }) => {
                        return commands.setNode(this.name);
                    },
            toggleDialogue:
                () =>
                    ({ commands }) => {
                        return commands.toggleNode(this.name, 'paragraph');
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-4': () => this.editor.commands.toggleDialogue(),
            // After dialogue, Enter creates another character
            'Enter': () => {
                if (this.editor.isActive('dialogue')) {
                    return this.editor.chain()
                        .splitBlock()
                        .setCharacter()
                        .run();
                }
                return false;
            },
        };
    },
});

export default Dialogue;
