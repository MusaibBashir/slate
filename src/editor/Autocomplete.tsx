import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import './Autocomplete.css';

interface AutocompleteProps {
    editor: Editor;
}

interface Suggestion {
    label: string;
    value: string;
    category: 'location' | 'time' | 'character' | 'transition';
}

// Standard screenplay locations
const LOCATION_PREFIXES = ['INT.', 'EXT.', 'INT./EXT.', 'I/E.'];

const TIME_OF_DAY = [
    'DAY',
    'NIGHT',
    'MORNING',
    'AFTERNOON',
    'EVENING',
    'DAWN',
    'DUSK',
    'LATER',
    'CONTINUOUS',
    'MOMENTS LATER',
];

const COMMON_LOCATIONS = [
    'LIVING ROOM',
    'KITCHEN',
    'BEDROOM',
    'BATHROOM',
    'OFFICE',
    'STREET',
    'CAR',
    'RESTAURANT',
    'BAR',
    'HOSPITAL',
    'POLICE STATION',
    'COURTROOM',
    'HALLWAY',
    'LOBBY',
    'ELEVATOR',
    'ROOFTOP',
    'BASEMENT',
    'GARAGE',
    'PARK',
    'BEACH',
];

const TRANSITIONS = [
    'CUT TO:',
    'FADE IN:',
    'FADE OUT.',
    'FADE TO BLACK.',
    'DISSOLVE TO:',
    'SMASH CUT TO:',
    'MATCH CUT TO:',
    'JUMP CUT TO:',
    'WIPE TO:',
    'TIME CUT:',
    'INTERCUT WITH:',
    'BACK TO SCENE',
    'FLASHBACK:',
    'END FLASHBACK',
    'DREAM SEQUENCE:',
    'END DREAM SEQUENCE',
];

const CATEGORY_LABELS: Record<Suggestion['category'], string> = {
    location: 'LOC',
    time: 'TIME',
    character: 'CHAR',
    transition: 'TRANS',
};

export function Autocomplete({ editor }: AutocompleteProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const extractedCharactersRef = useRef<string[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    // Extract character names from the document
    const extractCharacters = useCallback(() => {
        if (!editor) return;

        const characters = new Set<string>();
        const doc = editor.state.doc;

        doc.descendants((node) => {
            if (node.type.name === 'character' && node.textContent.trim()) {
                characters.add(node.textContent.trim().toUpperCase());
            }
            return true;
        });

        extractedCharactersRef.current = Array.from(characters);
    }, [editor]);

    // Get suggestions based on current context
    const getSuggestions = useCallback((text: string, nodeType: string): Suggestion[] => {
        const trimmedText = text.trim().toUpperCase();
        const results: Suggestion[] = [];

        if (nodeType === 'sceneHeading') {
            if (trimmedText.length === 0) {
                LOCATION_PREFIXES.forEach((prefix) => {
                    results.push({ label: prefix, value: prefix + ' ', category: 'location' });
                });
            } else if (LOCATION_PREFIXES.some((p) => trimmedText.startsWith(p))) {
                const prefix = LOCATION_PREFIXES.find((p) => trimmedText.startsWith(p));
                const afterPrefix = trimmedText.slice(prefix!.length).trim();

                if (!afterPrefix.includes('-')) {
                    COMMON_LOCATIONS.filter((loc) =>
                        loc.startsWith(afterPrefix)
                    ).forEach((loc) => {
                        results.push({
                            label: loc,
                            value: `${prefix} ${loc} - `,
                            category: 'location',
                        });
                    });
                } else {
                    const parts = afterPrefix.split('-');
                    const timeText = parts[parts.length - 1].trim();

                    TIME_OF_DAY.filter((time) =>
                        time.startsWith(timeText)
                    ).forEach((time) => {
                        const locationPart = parts.slice(0, -1).join('-').trim();
                        results.push({
                            label: time,
                            value: `${prefix} ${locationPart} - ${time}`,
                            category: 'time',
                        });
                    });
                }
            } else {
                LOCATION_PREFIXES.filter((p) =>
                    p.startsWith(trimmedText)
                ).forEach((prefix) => {
                    results.push({ label: prefix, value: prefix + ' ', category: 'location' });
                });
            }
        } else if (nodeType === 'character') {
            extractedCharactersRef.current
                .filter((char) => char.startsWith(trimmedText) && char !== trimmedText)
                .forEach((char) => {
                    // Add base character name
                    results.push({ label: char, value: char, category: 'character' });
                    // Also add V.O. and O.S. variants if not already present
                    if (!char.includes('(V.O.)') && !char.includes('(O.S.)')) {
                        results.push({ label: `${char} (V.O.)`, value: `${char} (V.O.)`, category: 'character' });
                        results.push({ label: `${char} (O.S.)`, value: `${char} (O.S.)`, category: 'character' });
                    }
                });
        } else if (nodeType === 'transition') {
            TRANSITIONS.filter((t) =>
                t.startsWith(trimmedText)
            ).forEach((transition) => {
                results.push({ label: transition, value: transition, category: 'transition' });
            });
        }

        return results.slice(0, 8);
    }, []);

    // Update suggestions based on cursor position and content
    useEffect(() => {
        if (!editor) return;

        const updateSuggestions = () => {
            extractCharacters();

            const { selection } = editor.state;
            const { $from } = selection;
            const node = $from.parent;
            const nodeType = node.type.name;

            if (!['sceneHeading', 'character', 'transition'].includes(nodeType)) {
                setIsVisible(false);
                return;
            }

            const text = node.textContent;
            const newSuggestions = getSuggestions(text, nodeType);

            if (newSuggestions.length > 0) {
                const coords = editor.view.coordsAtPos($from.pos);
                setPosition({
                    top: coords.bottom + 5,
                    left: coords.left,
                });
                setSuggestions(newSuggestions);
                setSelectedIndex(0);
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        editor.on('update', updateSuggestions);
        editor.on('selectionUpdate', updateSuggestions);

        return () => {
            editor.off('update', updateSuggestions);
            editor.off('selectionUpdate', updateSuggestions);
        };
    }, [editor, getSuggestions, extractCharacters]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isVisible || !editor) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (suggestions.length > 0) {
                    e.preventDefault();
                    applySuggestion(suggestions[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                setIsVisible(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isVisible, suggestions, selectedIndex, editor]);

    const applySuggestion = (suggestion: Suggestion) => {
        if (!editor) return;

        const { selection } = editor.state;
        const { $from } = selection;
        const node = $from.parent;
        const start = $from.start();
        const end = start + node.content.size;

        editor.chain().focus().deleteRange({ from: start, to: end }).insertContent(suggestion.value).run();

        setIsVisible(false);
    };

    if (!isVisible || suggestions.length === 0) {
        return null;
    }

    return (
        <div
            ref={menuRef}
            className="autocomplete-menu"
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
            }}
        >
            {suggestions.map((suggestion, index) => (
                <div
                    key={suggestion.label}
                    className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => applySuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    <span className={`autocomplete-category ${suggestion.category}`}>
                        {CATEGORY_LABELS[suggestion.category]}
                    </span>
                    <span className="autocomplete-label">{suggestion.label}</span>
                </div>
            ))}
            <div className="autocomplete-hint">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
            </div>
        </div>
    );
}

export default Autocomplete;
