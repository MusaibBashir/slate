import { Node, mergeAttributes } from '@tiptap/core';

export interface PageBreakOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        pageBreak: {
            setPageBreak: () => ReturnType;
            addPageBreak: () => ReturnType;
        };
    }
}

export const PageBreak = Node.create<PageBreakOptions>({
    name: 'pageBreak',
    group: 'block',
    atom: true,
    selectable: false,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="page-break"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'page-break',
                class: 'page-break',
            }),
        ];
    },

    addCommands() {
        return {
            setPageBreak:
                () =>
                    ({ chain }) => {
                        return chain()
                            .insertContent({ type: this.name })
                            .focus()
                            .run();
                    },
            addPageBreak:
                () =>
                    ({ chain }) => {
                        return chain()
                            .insertContent({ type: this.name })
                            .focus()
                            .run();
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-Enter': () => this.editor.commands.setPageBreak(),
        };
    },
});

export default PageBreak;
