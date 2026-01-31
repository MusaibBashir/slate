import { useState, useEffect, useRef } from 'react';
import { useProjectStore, type Act } from '../store/projectStore';
import './BeatsView.css';

interface BeatTemplate {
    id: string;
    name: string;
    acts: { name: string; beats: { title: string; synopsis: string }[] }[];
}

// Story structure templates
const BEAT_TEMPLATES: BeatTemplate[] = [
    {
        id: 'basic-3-act',
        name: 'Basic 3-act',
        acts: [
            {
                name: 'Act 1', beats: [
                    { title: 'Setup', synopsis: 'Introduce your protagonist and their world' },
                    { title: 'Inciting Incident', synopsis: 'The event that disrupts the status quo' },
                ]
            },
            {
                name: 'Act 2', beats: [
                    { title: 'Rising Action', synopsis: 'Protagonist faces obstacles and challenges' },
                    { title: 'Midpoint', synopsis: 'Major revelation or shift in the story' },
                    { title: 'Complications', synopsis: 'Stakes are raised, things get harder' },
                ]
            },
            {
                name: 'Act 3', beats: [
                    { title: 'Climax', synopsis: 'The final confrontation' },
                    { title: 'Resolution', synopsis: 'The new normal is established' },
                ]
            },
        ],
    },
    {
        id: '3-act-midpoint',
        name: '3-act with midpoint break',
        acts: [
            {
                name: 'Act 1', beats: [
                    { title: 'Opening Image', synopsis: 'Visual that sets the tone' },
                    { title: 'Theme Stated', synopsis: 'Hint at what this story is about' },
                    { title: 'Setup', synopsis: 'Establish the world and characters' },
                    { title: 'Catalyst', synopsis: 'Inciting incident' },
                ]
            },
            {
                name: 'Act 2', beats: [
                    { title: 'B Story', synopsis: 'Subplot begins' },
                    { title: 'Fun and Games', synopsis: 'The promise of the premise' },
                    { title: 'Midpoint', synopsis: 'False victory or defeat' },
                    { title: 'Bad Guys Close In', synopsis: 'Antagonist forces regroup' },
                    { title: 'All Is Lost', synopsis: 'The lowest point' },
                ]
            },
            {
                name: 'Act 3', beats: [
                    { title: 'Dark Night of the Soul', synopsis: 'Protagonist reflects' },
                    { title: 'Break Into Three', synopsis: 'Solution is found' },
                    { title: 'Finale', synopsis: 'Climax and resolution' },
                    { title: 'Final Image', synopsis: 'Mirror of opening' },
                ]
            },
        ],
    },
    {
        id: '5-act-tv',
        name: '5-act TV',
        acts: [
            { name: 'Teaser', beats: [{ title: 'Cold Open', synopsis: 'Hook the audience' }] },
            { name: 'Act 1', beats: [{ title: 'Setup', synopsis: 'Establish the episode premise' }] },
            { name: 'Act 2', beats: [{ title: 'Rising Action', synopsis: 'Complications arise' }] },
            { name: 'Act 3', beats: [{ title: 'Midpoint Twist', synopsis: 'Major shift' }] },
            { name: 'Act 4', beats: [{ title: 'Escalation', synopsis: 'Race to the finish' }] },
            {
                name: 'Act 5', beats: [
                    { title: 'Climax', synopsis: 'Resolution of conflict' },
                    { title: 'Tag', synopsis: 'Button/epilogue' },
                ]
            },
        ],
    },
    {
        id: 'syd-field',
        name: "Syd Field's Paradigm",
        acts: [
            {
                name: 'Act 1 - Setup', beats: [
                    { title: 'Opening', synopsis: 'First 10 pages - hook the reader' },
                    { title: 'Plot Point I', synopsis: 'Ends Act I, spins story' },
                ]
            },
            {
                name: 'Act 2 - Confrontation', beats: [
                    { title: 'Pinch 1', synopsis: 'First major obstacle' },
                    { title: 'Midpoint', synopsis: 'Major event changes direction' },
                    { title: 'Pinch 2', synopsis: 'Second major obstacle' },
                    { title: 'Plot Point II', synopsis: 'Propels into resolution' },
                ]
            },
            {
                name: 'Act 3 - Resolution', beats: [
                    { title: 'Climax', synopsis: 'Final confrontation' },
                    { title: 'Ending', synopsis: 'Resolution and closure' },
                ]
            },
        ],
    },
    {
        id: 'save-the-cat',
        name: 'Save the Cat!',
        acts: [
            {
                name: 'Act 1', beats: [
                    { title: 'Opening Image', synopsis: 'A visual representing the struggle' },
                    { title: 'Theme Stated', synopsis: 'What the movie is about' },
                    { title: 'Set-Up', synopsis: 'Introduce hero and world' },
                    { title: 'Catalyst', synopsis: 'The life-changing moment' },
                    { title: 'Debate', synopsis: 'Hero questions the journey' },
                ]
            },
            {
                name: 'Act 2', beats: [
                    { title: 'Break Into Two', synopsis: 'Hero decides to act' },
                    { title: 'B Story', synopsis: 'Love story/helper character' },
                    { title: 'Fun and Games', synopsis: 'Promise of the premise' },
                    { title: 'Midpoint', synopsis: 'Stakes are raised' },
                    { title: 'Bad Guys Close In', synopsis: 'Pressure mounts' },
                    { title: 'All Is Lost', synopsis: 'The lowest point' },
                    { title: 'Dark Night of Soul', synopsis: 'Hero in hopelessness' },
                ]
            },
            {
                name: 'Act 3', beats: [
                    { title: 'Break Into Three', synopsis: 'Solution found' },
                    { title: 'Finale', synopsis: 'The climax' },
                    { title: 'Final Image', synopsis: 'Opposite of opening' },
                ]
            },
        ],
    },
    {
        id: 'truby-22',
        name: "John Truby's 22 Steps",
        acts: [
            {
                name: 'Beginning', beats: [
                    { title: 'Self-Revelation Need', synopsis: 'What hero needs vs wants' },
                    { title: 'Ghost/Backstory', synopsis: 'Past trauma' },
                    { title: 'Weakness', synopsis: "Hero's fatal flaw" },
                    { title: 'Inciting Event', synopsis: 'The trigger' },
                    { title: 'Desire', synopsis: 'What hero wants' },
                ]
            },
            {
                name: 'Middle', beats: [
                    { title: 'Ally', synopsis: 'Helper characters enter' },
                    { title: 'Opponent', synopsis: 'Main antagonist revealed' },
                    { title: 'Fake-Ally', synopsis: 'Betrayer character' },
                    { title: 'First Revelation', synopsis: 'New information' },
                    { title: 'Plan', synopsis: 'Hero forms strategy' },
                    { title: "Opponent's Plan", synopsis: 'Counter-strategy' },
                    { title: 'Drive', synopsis: 'Actions toward goal' },
                    { title: 'Attack by Ally', synopsis: 'Ally criticizes hero' },
                    { title: 'Apparent Defeat', synopsis: 'All seems lost' },
                ]
            },
            {
                name: 'End', beats: [
                    { title: 'Second Revelation', synopsis: 'Key info revealed' },
                    { title: 'Audience Revelation', synopsis: 'We learn before hero' },
                    { title: 'Third Revelation', synopsis: 'Final puzzle piece' },
                    { title: 'Gate/Gauntlet', synopsis: 'Hero faces mortality' },
                    { title: 'Battle', synopsis: 'Final confrontation' },
                    { title: 'Self-Revelation', synopsis: 'Hero learns need' },
                    { title: 'Moral Decision', synopsis: 'Proves change' },
                    { title: 'New Equilibrium', synopsis: 'New normal' },
                ]
            },
        ],
    },
];

// Icons
function ChevronIcon({ expanded }: { expanded: boolean }) {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function MoreIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
        </svg>
    );
}

export function BeatsView() {
    const { currentProject, updateBeats, saveProject } = useProjectStore();

    // Initialize acts from store - run on every mount
    const initialActs = currentProject?.beats && currentProject.beats.length > 0
        ? currentProject.beats
        : [];

    const [acts, setActs] = useState<Act[]>(initialActs);
    const [showTemplateSelector, setShowTemplateSelector] = useState(initialActs.length === 0);

    // Use ref to track current acts for cleanup (avoids stale closure)
    const actsRef = useRef<Act[]>(acts);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasChanges = useRef(false);

    // Keep ref in sync with state
    useEffect(() => {
        actsRef.current = acts;
    }, [acts]);

    // Manual save function for the save button
    const handleManualSave = () => {
        if (actsRef.current.length > 0) {
            updateBeats(actsRef.current);
            saveProject();
            hasChanges.current = false;
        }
    };

    // Save beats to store with 5-second debounce
    useEffect(() => {
        // Only save if we have changes and acts
        if (acts.length > 0 && hasChanges.current) {
            // Clear any existing timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Debounce: save after 5 seconds of inactivity
            saveTimeoutRef.current = setTimeout(() => {
                updateBeats(acts);
                hasChanges.current = false;
            }, 5000);
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [acts, updateBeats]);

    // Save on unmount using ref (avoids stale closure)
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Use ref to get current acts value
            if (actsRef.current.length > 0 && hasChanges.current) {
                updateBeats(actsRef.current);
            }
        };
    }, [updateBeats]);

    // Mark as changed when acts are modified
    const updateActs = (newActs: Act[]) => {
        hasChanges.current = true;
        setActs(newActs);
    };

    // Generate unique ID
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize with template
    const handleTemplateClick = (template: BeatTemplate) => {
        const newActs: Act[] = template.acts.map((actTemplate) => ({
            id: generateId(),
            name: actTemplate.name,
            isExpanded: true,
            beats: actTemplate.beats.map((beat) => ({
                id: generateId(),
                title: beat.title,
                synopsis: beat.synopsis,
                isExpanded: true,
            })),
        }));
        updateActs(newActs);
        setShowTemplateSelector(false);
    };

    // Add first beat manually
    const handleAddFirstBeat = () => {
        updateActs([
            {
                id: generateId(),
                name: 'Act 1',
                isExpanded: true,
                beats: [{
                    id: generateId(),
                    title: 'Introduction',
                    synopsis: 'I will setup the world and introduce the main character here',
                    isExpanded: true,
                }],
            },
            {
                id: generateId(),
                name: 'Act 2',
                isExpanded: true,
                beats: [],
            },
            {
                id: generateId(),
                name: 'Act 3',
                isExpanded: true,
                beats: [],
            },
        ]);
        setShowTemplateSelector(false);
    };

    // Add new act
    const addAct = () => {
        updateActs([...acts, {
            id: generateId(),
            name: `Act ${acts.length + 1}`,
            isExpanded: true,
            beats: [],
        }]);
    };

    // Toggle act expansion
    const toggleAct = (actId: string) => {
        setActs(acts.map(act =>
            act.id === actId ? { ...act, isExpanded: !act.isExpanded } : act
        ));
    };

    // Add beat to act
    const addBeat = (actId: string) => {
        updateActs(acts.map(act =>
            act.id === actId ? {
                ...act,
                beats: [...act.beats, {
                    id: generateId(),
                    title: 'Untitled beat',
                    synopsis: 'Synopsis...',
                    isExpanded: true,
                }],
            } : act
        ));
    };

    // Update beat title
    const updateBeatTitle = (actId: string, beatId: string, title: string) => {
        updateActs(acts.map(act =>
            act.id === actId ? {
                ...act,
                beats: act.beats.map(beat =>
                    beat.id === beatId ? { ...beat, title } : beat
                ),
            } : act
        ));
    };

    // Update beat synopsis
    const updateBeatSynopsis = (actId: string, beatId: string, synopsis: string) => {
        updateActs(acts.map(act =>
            act.id === actId ? {
                ...act,
                beats: act.beats.map(beat =>
                    beat.id === beatId ? { ...beat, synopsis } : beat
                ),
            } : act
        ));
    };

    // Toggle beat expansion
    const toggleBeat = (actId: string, beatId: string) => {
        setActs(acts.map(act =>
            act.id === actId ? {
                ...act,
                beats: act.beats.map(beat =>
                    beat.id === beatId ? { ...beat, isExpanded: !beat.isExpanded } : beat
                ),
            } : act
        ));
    };

    // Delete beat
    const deleteBeat = (actId: string, beatId: string) => {
        setActs(acts.map(act =>
            act.id === actId ? {
                ...act,
                beats: act.beats.filter(beat => beat.id !== beatId),
            } : act
        ));
    };

    // Show template selector when no acts
    if (showTemplateSelector && acts.length === 0) {
        return (
            <div className="beats-view-empty">
                <div className="beats-template-container">
                    <h2 className="beats-template-title">Start your beat outline</h2>

                    <button className="beats-add-first-btn" onClick={handleAddFirstBeat}>
                        Add first beat
                    </button>

                    <p className="beats-template-divider">or choose a template</p>

                    <div className="beats-template-grid">
                        {BEAT_TEMPLATES.map((template) => (
                            <button
                                key={template.id}
                                className="beats-template-btn"
                                onClick={() => handleTemplateClick(template)}
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Beat board with act columns
    return (
        <div className="beats-board">
            {/* Beats Toolbar */}
            <div className="beats-toolbar">
                <button
                    className="beats-save-btn"
                    onClick={handleManualSave}
                    title="Save beats to cloud"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save
                </button>
            </div>
            <div className="beats-board-columns">
                {acts.map((act) => (
                    <div key={act.id} className="beats-act-column">
                        {/* Act Header */}
                        <div className="beats-act-header">
                            <button
                                className="beats-act-toggle"
                                onClick={() => toggleAct(act.id)}
                            >
                                <ChevronIcon expanded={act.isExpanded} />
                                <span className="beats-act-name">{act.name}</span>
                            </button>
                            <div className="beats-act-actions">
                                <button className="beats-icon-btn" title="More options">
                                    <MoreIcon />
                                </button>
                                <button
                                    className="beats-icon-btn"
                                    title="Add beat"
                                    onClick={() => addBeat(act.id)}
                                >
                                    <PlusIcon />
                                </button>
                            </div>
                        </div>

                        {/* Act Content */}
                        {act.isExpanded && (
                            <div className="beats-act-content">
                                {act.beats.map((beat) => (
                                    <div key={beat.id} className="beat-card-editable">
                                        {/* Beat Header */}
                                        <div className="beat-card-header">
                                            <span className="beat-card-icon">📝</span>
                                            <input
                                                type="text"
                                                className="beat-title-input"
                                                value={beat.title}
                                                onChange={(e) => updateBeatTitle(act.id, beat.id, e.target.value)}
                                                placeholder="Untitled beat"
                                            />
                                            <div className="beat-card-actions">
                                                <button className="beats-icon-btn" title="More">
                                                    <MoreIcon />
                                                </button>
                                                <button
                                                    className="beats-icon-btn"
                                                    onClick={() => toggleBeat(act.id, beat.id)}
                                                >
                                                    <ChevronIcon expanded={beat.isExpanded} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Beat Synopsis */}
                                        {beat.isExpanded && (
                                            <textarea
                                                className="beat-synopsis-input"
                                                value={beat.synopsis}
                                                onChange={(e) => updateBeatSynopsis(act.id, beat.id, e.target.value)}
                                                placeholder="Synopsis..."
                                                rows={3}
                                            />
                                        )}

                                        {/* Beat Footer */}
                                        <div className="beat-card-footer">
                                            <div className="beat-card-icons">
                                                <button className="beats-icon-btn-sm" title="Comments">💬</button>
                                                <button className="beats-icon-btn-sm" title="Images">🖼️</button>
                                                <button className="beats-icon-btn-sm" title="Links">📎</button>
                                            </div>
                                            <div className="beat-card-icons">
                                                <button className="beats-icon-btn-sm" title="Settings">⚙️</button>
                                                <button className="beats-icon-btn-sm" title="Favorite">⭐</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Beat Button */}
                                <button
                                    className="beats-add-beat-btn"
                                    onClick={() => addBeat(act.id)}
                                >
                                    <PlusIcon />
                                    <span>Add beat</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Act Button */}
                <button className="beats-add-act-btn" onClick={addAct}>
                    <PlusIcon />
                </button>
            </div>
        </div>
    );
}

export default BeatsView;
