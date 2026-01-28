import { jsPDF } from 'jspdf';

// Page dimensions in points (1 inch = 72 points)
const PAGE_WIDTH = 612; // 8.5 inches
const PAGE_HEIGHT = 792; // 11 inches
const MARGIN_TOP = 54; // 0.75 inch (slightly larger top margin)
const MARGIN_BOTTOM = 36; // 0.5 inch
const MARGIN_LEFT = 72; // 1 inch
const MARGIN_RIGHT = 72; // 1 inch
const PRINTABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 468pt = 6.5 inches
const PRINTABLE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 702pt = 9.75 inches

// Export for editor sync (convert points to pixels at 96dpi: 1pt = 1.333px)
export const PDF_PRINTABLE_HEIGHT_PX = Math.floor(PRINTABLE_HEIGHT * (96 / 72)); // ~936px

// Typography
const FONT_SIZE = 12;
const LINE_HEIGHT = 14; // points

// Element-specific margins (from left edge of page)
// Editor has 1in left margin, then element-specific indents
const ELEMENT_MARGINS = {
    sceneHeading: MARGIN_LEFT,      // 72pt (1in)
    action: MARGIN_LEFT,            // 72pt (1in)
    character: 252,                 // 72 + 180 = 252pt (1in + 2.5in = 3.5in)
    dialogue: 180,                  // 72 + 108 = 180pt (1in + 1.5in = 2.5in)
    parenthetical: 216,             // 72 + 144 = 216pt (1in + 2in = 3in)
    transition: MARGIN_LEFT,        // Will be right-aligned
    shot: MARGIN_LEFT,
    paragraph: MARGIN_LEFT,         // Default paragraphs
};

// Element widths (how wide the text block can be)
const ELEMENT_WIDTHS = {
    sceneHeading: PRINTABLE_WIDTH,  // 468pt (6.5in)
    action: PRINTABLE_WIDTH,        // 468pt (6.5in)
    character: 180,                 // ~2.5 inches centered
    dialogue: 216,                  // ~3 inches (matches editor 1.5in each side = 3in)
    parenthetical: 144,             // ~2 inches
    transition: PRINTABLE_WIDTH,
    shot: PRINTABLE_WIDTH,
    paragraph: PRINTABLE_WIDTH,
};

interface ScriptElement {
    type: 'sceneHeading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot' | 'pageBreak' | 'paragraph';
    text: string;
}

interface ProjectData {
    title: string;
    author: string;
    email?: string;
    createdAt?: string | number;
    content: string;
}

/**
 * Parse HTML content into structured screenplay elements
 */
function parseHTMLContent(html: string): ScriptElement[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements: ScriptElement[] = [];

    const nodes = doc.body.querySelectorAll('[data-type], p');

    nodes.forEach((node) => {
        const dataType = node.getAttribute('data-type');
        const text = node.textContent?.trim() || '';

        if (!text && dataType !== 'page-break') return;

        switch (dataType) {
            case 'scene-heading':
                elements.push({ type: 'sceneHeading', text });
                break;
            case 'action':
                elements.push({ type: 'action', text });
                break;
            case 'character':
                elements.push({ type: 'character', text });
                break;
            case 'dialogue':
                elements.push({ type: 'dialogue', text });
                break;
            case 'parenthetical':
                elements.push({ type: 'parenthetical', text: `(${text})` });
                break;
            case 'transition':
                elements.push({ type: 'transition', text });
                break;
            case 'shot':
                elements.push({ type: 'shot', text });
                break;
            case 'page-break':
                elements.push({ type: 'pageBreak', text: '' });
                break;
            default:
                // Regular paragraph
                if (text) {
                    elements.push({ type: 'paragraph', text });
                }
        }
    });

    return elements;
}

/**
 * Wrap text to fit within a given width
 */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = doc.getTextWidth(testLine);

        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

/**
 * Generate title page
 */
function generateTitlePage(doc: jsPDF, project: ProjectData): void {
    const centerX = PAGE_WIDTH / 2;

    // Title - centered, larger, bold, uppercase
    doc.setFontSize(24);
    doc.setFont('Courier', 'bold');
    const title = project.title.toUpperCase();
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, centerX - titleWidth / 2, PAGE_HEIGHT * 0.35);

    // "by" or "By-line"
    doc.setFontSize(12);
    doc.setFont('Courier', 'normal');
    const byline = 'By-line';
    const bylineWidth = doc.getTextWidth(byline);
    doc.text(byline, centerX - bylineWidth / 2, PAGE_HEIGHT * 0.35 + 24);

    // Author name - uppercase
    const author = project.author.toUpperCase();
    const authorWidth = doc.getTextWidth(author);
    doc.text(author, centerX - authorWidth / 2, PAGE_HEIGHT * 0.35 + 42);

    // Date
    const date = new Date(project.createdAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).toUpperCase();
    const dateWidth = doc.getTextWidth(date);
    doc.text(date, centerX - dateWidth / 2, PAGE_HEIGHT * 0.35 + 72);

    // Footer - Copyright (left) and Email (right)
    doc.setFontSize(10);
    const year = new Date(project.createdAt || Date.now()).getFullYear();
    const copyright = `© ${year} ${project.author}`.toUpperCase();
    doc.text(copyright, MARGIN_LEFT, PAGE_HEIGHT - MARGIN_BOTTOM);

    if (project.email) {
        const emailWidth = doc.getTextWidth(project.email);
        doc.text(project.email, PAGE_WIDTH - MARGIN_RIGHT - emailWidth, PAGE_HEIGHT - MARGIN_BOTTOM);
    }

    // Add new page for content
    doc.addPage();
}

/**
 * Main PDF generation function
 */
export function generateScreenplayPDF(project: ProjectData, includeTitlePage: boolean = true): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter',
    });

    // Set default font
    doc.setFont('Courier', 'normal');
    doc.setFontSize(FONT_SIZE);

    // Generate title page if requested
    if (includeTitlePage) {
        generateTitlePage(doc, project);
    }

    // Parse content
    const elements = parseHTMLContent(project.content);

    let currentY = MARGIN_TOP;
    let prevElementType: string | null = null;

    // Helper to check if we need a new page
    const checkPageBreak = (linesNeeded: number = 1): void => {
        const spaceNeeded = linesNeeded * LINE_HEIGHT;
        if (currentY + spaceNeeded > PAGE_HEIGHT - MARGIN_BOTTOM) {
            doc.addPage();
            currentY = MARGIN_TOP;
        }
    };

    // Helper to add vertical spacing based on element type
    const addSpacing = (elementType: string): void => {
        if (!prevElementType) return;

        // Scene headings get extra space before them
        if (elementType === 'sceneHeading') {
            currentY += LINE_HEIGHT * 2;
        }
        // Characters get space before
        else if (elementType === 'character') {
            currentY += LINE_HEIGHT;
        }
        // Transitions get space before and after
        else if (elementType === 'transition' || prevElementType === 'transition') {
            currentY += LINE_HEIGHT;
        }
        // Standard spacing
        else if (prevElementType !== 'character' && prevElementType !== 'parenthetical') {
            currentY += LINE_HEIGHT * 0.5;
        }
    };

    elements.forEach((element) => {
        if (element.type === 'pageBreak') {
            doc.addPage();
            currentY = MARGIN_TOP;
            prevElementType = null;
            return;
        }

        addSpacing(element.type);
        checkPageBreak();

        const leftMargin = ELEMENT_MARGINS[element.type as keyof typeof ELEMENT_MARGINS] || MARGIN_LEFT;
        const maxWidth = ELEMENT_WIDTHS[element.type as keyof typeof ELEMENT_WIDTHS] || PRINTABLE_WIDTH;

        // Set font style based on element type
        switch (element.type) {
            case 'sceneHeading':
                doc.setFont('Courier', 'bold');
                break;
            case 'parenthetical':
                doc.setFont('Courier', 'italic');
                break;
            default:
                doc.setFont('Courier', 'normal');
        }

        // Prepare text
        let text = element.text;
        if (element.type === 'sceneHeading' || element.type === 'character' || element.type === 'transition' || element.type === 'shot') {
            text = text.toUpperCase();
        }

        // Wrap text
        const lines = wrapText(doc, text, maxWidth);

        // Check if all lines fit on current page
        checkPageBreak(lines.length);

        // Render lines
        lines.forEach((line) => {
            let x = leftMargin;

            // Right-align transitions
            if (element.type === 'transition') {
                const lineWidth = doc.getTextWidth(line);
                x = PAGE_WIDTH - MARGIN_RIGHT - lineWidth;
            }

            doc.text(line, x, currentY);
            currentY += LINE_HEIGHT;
        });

        prevElementType = element.type;
    });

    // Save the PDF
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(filename);
}

export default generateScreenplayPDF;
