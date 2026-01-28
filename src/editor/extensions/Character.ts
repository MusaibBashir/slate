import { Node, mergeAttributes } from '@tiptap/core';

export interface CharacterOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        character: {
            setCharacter: () => ReturnType;
            toggleCharacter: () => ReturnType;
        };
    }
}

export const Character = Node.create<CharacterOptions>({
    name: 'character',
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
                tag: 'div[data-type="character"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'character',
                class: 'script-element character',
            }),
            0,
        ];
    },

    addCommands() {
        return {
            setCharacter:
                () =>
                    ({ commands }) => {
                        return commands.setNode(this.name);
                    },
            toggleCharacter:
                () =>
                    ({ commands }) => {
                        return commands.toggleNode(this.name, 'paragraph');
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-3': () => this.editor.commands.toggleCharacter(),
            // After character, Enter creates dialogue
            'Enter': () => {
                if (this.editor.isActive('character')) {
                    return this.editor.chain()
                        .splitBlock()
                        .setDialogue()
                        .run();
                }
                return false;
            },
        };
    },
});

export default Character;
