import { Node, mergeAttributes } from '@tiptap/core';

export interface TransitionOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        transition: {
            setTransition: () => ReturnType;
            toggleTransition: () => ReturnType;
        };
    }
}

export const Transition = Node.create<TransitionOptions>({
    name: 'transition',
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
                tag: 'div[data-type="transition"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'transition',
                class: 'script-element transition',
            }),
            0,
        ];
    },

    addCommands() {
        return {
            setTransition:
                () =>
                    ({ commands }) => {
                        return commands.setNode(this.name);
                    },
            toggleTransition:
                () =>
                    ({ commands }) => {
                        return commands.toggleNode(this.name, 'paragraph');
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-6': () => this.editor.commands.toggleTransition(),
            // After transition, Enter creates a scene heading
            'Enter': () => {
                if (this.editor.isActive('transition')) {
                    return this.editor.chain()
                        .splitBlock()
                        .setSceneHeading()
                        .run();
                }
                return false;
            },
        };
    },
});

export default Transition;
