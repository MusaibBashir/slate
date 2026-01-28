import { useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { usePropListStore } from '../store/propListStore';
import type { SceneProps, PropItem, PropStatus } from '../store/propListStore';
import { useShotlistStore } from '../store/shotlistStore';
import type { SceneShots } from '../store/shotlistStore';
import { parseScenes } from './ScriptViewer';
import { generateScreenplayPDF } from '../utils/pdfExport';
import './ExportModal.css';

interface ExportModalProps {
    type: 'props' | 'shots' | 'script';
    onClose: () => void;
}

interface StatusFilter {
    id: PropStatus;
    label: string;
    enabled: boolean;
}

export function ExportModal({ type, onClose }: ExportModalProps) {
    const { currentProject } = useProjectStore();
    const { getAllProjectProps } = usePropListStore();
    const { getAllProjectShots } = useShotlistStore();

    const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set());
    const [exportMode, setExportMode] = useState<'all' | 'selected'>('all');
    const [copySuccess, setCopySuccess] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'txt' | 'fountain'>('pdf');
    const [includeTitlePage, setIncludeTitlePage] = useState(true);

    // Status filters (only for props)
    const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([
        { id: 'pending', label: 'Yet to Obtain', enabled: true },
        { id: 'obtained', label: 'Obtained', enabled: true },
        { id: 'failed', label: 'Failed to Obtain', enabled: true },
    ]);

    // Get all scenes from the script
    const allScenes = useMemo(() => {
        if (!currentProject?.content) return [];
        return parseScenes(currentProject.content);
    }, [currentProject?.content]);

    // Create a map of scene ID to proper heading
    const sceneHeadingMap = useMemo(() => {
        const map = new Map<string, string>();
        allScenes.forEach((scene) => {
            map.set(scene.id, scene.heading);
        });
        return map;
    }, [allScenes]);

    // Get data based on type
    const data = useMemo(() => {
        if (!currentProject) return [];

        if (type === 'script') {
            return allScenes.map(scene => ({
                sceneId: scene.id,
                sceneHeading: scene.heading,
                content: scene.content
            }));
        }

        const rawData = type === 'props'
            ? getAllProjectProps(currentProject.id)
            : getAllProjectShots(currentProject.id);

        return rawData.map((item) => ({
            ...item,
            sceneHeading: sceneHeadingMap.get(item.sceneId) || item.sceneHeading || 'Unknown Scene',
        }));
    }, [currentProject, type, getAllProjectProps, getAllProjectShots, sceneHeadingMap, allScenes]);

    // Scenes that have data (or all scenes for script)
    const scenesWithData = useMemo(() => {
        return data.map(d => d.sceneId);
    }, [data]);

    const handleToggleScene = (sceneId: string) => {
        const newSelected = new Set(selectedScenes);
        if (newSelected.has(sceneId)) {
            newSelected.delete(sceneId);
        } else {
            newSelected.add(sceneId);
        }
        setSelectedScenes(newSelected);
    };

    const handleSelectAll = () => {
        setSelectedScenes(new Set(scenesWithData));
    };

    const handleSelectNone = () => {
        setSelectedScenes(new Set());
    };

    const handleToggleStatusFilter = (statusId: PropStatus) => {
        setStatusFilters(prev =>
            prev.map(f => f.id === statusId ? { ...f, enabled: !f.enabled } : f)
        );
    };

    // Get enabled status types
    const enabledStatuses = useMemo(() => {
        return statusFilters.filter(f => f.enabled).map(f => f.id);
    }, [statusFilters]);

    // Filter and sort props by status
    const filterPropsByStatus = (props: PropItem[]): PropItem[] => {
        const filtered = props.filter(p => {
            const status = p.status || 'pending';
            return enabledStatuses.includes(status);
        });

        const statusOrder: Record<PropStatus, number> = { pending: 0, obtained: 1, failed: 2 };
        return filtered.sort((a, b) => {
            const aStatus = a.status || 'pending';
            const bStatus = b.status || 'pending';
            return statusOrder[aStatus] - statusOrder[bStatus];
        });
    };

    const generateExportContent = (): string => {
        const linesToExport: string[] = [];
        const title = currentProject?.title || 'Untitled';

        if (type === 'script') {
            // Screenplay / Fountain Format
            if (includeTitlePage && exportFormat !== 'txt') { // TXT usually simplified, but let's include for Fountain
                linesToExport.push(`Title: ${title.toUpperCase()}`);
                linesToExport.push(`Author: ${currentProject?.author || 'Author Name'}`);
                if (currentProject?.email) linesToExport.push(`Contact: ${currentProject.email}`);
                linesToExport.push('');
            }

            const dataToExport = exportMode === 'all'
                ? data
                : data.filter(d => selectedScenes.has(d.sceneId));

            dataToExport.forEach((scene: any) => {
                // Approximate Fountain/Text format from HTML content
                // This is a simplified extraction. For robust Fountain, we'd parse the HTML nodes properly.
                // Assuming parseScenes returns raw HTML content per scene, we strip tags.
                // But parseScenes in ScriptViewer returns extracted text lines.
                // Let's rely on what parseScenes gives us. It gives { id, heading, content: string[] }

                linesToExport.push(scene.sceneHeading);
                linesToExport.push('');
                if (scene.content && Array.isArray(scene.content)) {
                    scene.content.forEach((line: string) => {
                        linesToExport.push(line);
                        linesToExport.push('');
                    });
                }
                linesToExport.push('');
            });
            return linesToExport.join('\n');
        }

        const typeLabel = type === 'props' ? 'PROP LIST' : 'SHOTLIST';

        linesToExport.push(`${title.toUpperCase()}`);
        linesToExport.push(`${typeLabel}`);
        linesToExport.push('='.repeat(40));
        linesToExport.push('');

        const dataToExport = exportMode === 'all'
            ? data
            : data.filter(d => selectedScenes.has(d.sceneId));

        dataToExport.forEach((sceneData) => {
            if (type === 'props') {
                const propsData = sceneData as SceneProps;
                const filteredProps = filterPropsByStatus(propsData.props);

                if (filteredProps.length === 0) return;

                linesToExport.push(sceneData.sceneHeading);
                linesToExport.push('-'.repeat(sceneData.sceneHeading.length));

                const pendingProps = filteredProps.filter(p => !p.status || p.status === 'pending');
                const obtainedProps = filteredProps.filter(p => p.status === 'obtained');
                const failedProps = filteredProps.filter(p => p.status === 'failed');

                if (pendingProps.length > 0 && enabledStatuses.includes('pending')) {
                    linesToExport.push('  [YET TO OBTAIN]');
                    pendingProps.forEach((prop) => {
                        const prefix = prop.priority === 'high' ? '**' : prop.priority === 'mid' ? '*' : '-';
                        linesToExport.push(`    ${prefix} ${prop.text}`);
                    });
                }

                if (obtainedProps.length > 0 && enabledStatuses.includes('obtained')) {
                    linesToExport.push('  [OBTAINED]');
                    obtainedProps.forEach((prop) => {
                        linesToExport.push(`    ✓ ${prop.text}`);
                    });
                }

                if (failedProps.length > 0 && enabledStatuses.includes('failed')) {
                    linesToExport.push('  [FAILED TO OBTAIN]');
                    failedProps.forEach((prop) => {
                        linesToExport.push(`    ✗ ${prop.text}`);
                    });
                }
            } else {
                linesToExport.push(sceneData.sceneHeading);
                linesToExport.push('-'.repeat(sceneData.sceneHeading.length));

                const shotsData = sceneData as SceneShots;
                shotsData.shots.forEach((shot, index) => {
                    const desc = shot.description ? ` - ${shot.description}` : '';
                    linesToExport.push(`  ${index + 1}. ${shot.shotType}${desc}`);
                });
            }

            linesToExport.push('');
        });

        return linesToExport.join('\n');
    };

    const handleDownload = () => {
        if (type === 'script' && exportFormat === 'pdf') {
            handleDownloadPdf();
            return;
        }

        const content = generateExportContent();
        const extension = type === 'script' && exportFormat === 'fountain' ? 'fountain' : 'txt';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProject?.title || 'export'}_${type}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        onClose();
    };

    const handleDownloadPdf = () => {
        // Script PDF export using jsPDF
        if (type === 'script') {
            if (!currentProject) {
                alert('No project to export');
                return;
            }

            generateScreenplayPDF(
                {
                    title: currentProject.title || 'Untitled Screenplay',
                    author: currentProject.author || 'Author Name',
                    email: currentProject.email || 'email@example.com',
                    createdAt: currentProject.createdAt,
                    content: currentProject.content || '',
                },
                includeTitlePage
            );

            onClose();
            return;
        }

        // Existing logic for Props/Shots PDF
        const title = currentProject?.title || 'Untitled';
        const typeLabel = type === 'props' ? 'Prop List' : 'Shotlist';

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to export PDF');
            return;
        }

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${title} - ${typeLabel}</title>
    <style>
        @page { margin: 1in; size: letter; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; line-height: 1.5; color: #000; max-width: 6.5in; margin: 0 auto; }
        h1 { font-size: 14pt; text-transform: uppercase; margin-bottom: 0.25em; }
        h2 { font-size: 12pt; text-transform: uppercase; margin-bottom: 1em; color: #666; }
        hr { border: none; border-top: 2px solid #000; margin: 0.5em 0 1.5em; }
        .scene-heading { font-weight: bold; text-transform: uppercase; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #999; padding-bottom: 0.25em; }
        .status-section { margin-left: 1em; margin-bottom: 0.5em; }
        .status-label { font-size: 10pt; font-weight: bold; color: #666; margin: 0.5em 0 0.25em; }
        .item { margin-left: 1em; margin-bottom: 0.25em; }
        .high { font-weight: bold; }
        .mid { font-style: italic; }
        .shot-type { font-weight: bold; color: #333; }
        .obtained { color: #22c55e; }
        .failed { color: #ef4444; text-decoration: line-through; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <h2>${typeLabel}</h2>
    <hr>
`;
        // ... (existing logic for bodyContent generation) ...
        // Re-using the generation logic for props/shots but we need to duplicate it or extract it.
        // For simplicity in this replacement, I'll copy the body generation logic here since I removed it above to insert this block.

        const dataToExport = exportMode === 'all'
            ? data
            : data.filter(d => selectedScenes.has(d.sceneId));

        let bodyContent = '';
        dataToExport.forEach((sceneData: any) => {
            if (type === 'props') {
                const propsData = sceneData as SceneProps;
                const filteredProps = filterPropsByStatus(propsData.props);
                if (filteredProps.length === 0) return;
                bodyContent += `<div class="scene-heading">${sceneData.sceneHeading}</div>\n`;
                const pendingProps = filteredProps.filter(p => !p.status || p.status === 'pending');
                const obtainedProps = filteredProps.filter(p => p.status === 'obtained');
                const failedProps = filteredProps.filter(p => p.status === 'failed');

                if (pendingProps.length > 0 && enabledStatuses.includes('pending')) {
                    bodyContent += '<div class="status-section"><div class="status-label">Yet to Obtain</div>';
                    pendingProps.forEach((prop) => {
                        const cssClass = prop.priority === 'high' ? 'high' : prop.priority === 'mid' ? 'mid' : '';
                        const prefix = prop.priority === 'high' ? '●' : prop.priority === 'mid' ? '○' : '•';
                        bodyContent += `<div class="item ${cssClass}">${prefix} ${prop.text}</div>\n`;
                    });
                    bodyContent += '</div>';
                }
                if (obtainedProps.length > 0 && enabledStatuses.includes('obtained')) {
                    bodyContent += '<div class="status-section"><div class="status-label">Obtained</div>';
                    obtainedProps.forEach((prop) => {
                        bodyContent += `<div class="item obtained">✓ ${prop.text}</div>\n`;
                    });
                    bodyContent += '</div>';
                }
                if (failedProps.length > 0 && enabledStatuses.includes('failed')) {
                    bodyContent += '<div class="status-section"><div class="status-label">Failed to Obtain</div>';
                    failedProps.forEach((prop) => {
                        bodyContent += `<div class="item failed">✗ ${prop.text}</div>\n`;
                    });
                    bodyContent += '</div>';
                }
            } else {
                bodyContent += `<div class="scene-heading">${sceneData.sceneHeading}</div>\n`;
                const shotsData = sceneData as SceneShots;
                shotsData.shots.forEach((shot, index) => {
                    const desc = shot.description ? ` — ${shot.description}` : '';
                    bodyContent += `<div class="item"><span class="shot-type">${index + 1}. ${shot.shotType}</span>${desc}</div>\n`;
                });
            }
        });

        printWindow.document.write(htmlContent + bodyContent + '</body></html>');
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const handleCopyToClipboard = async () => {
        const content = generateExportContent();
        await navigator.clipboard.writeText(content);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="export-modal-backdrop" onClick={onClose}>
            <div className="export-modal" onClick={(e) => e.stopPropagation()}>
                <div className="export-modal-header">
                    <h2>Export {type === 'props' ? 'Prop List' : type === 'shots' ? 'Shotlist' : 'Script'}</h2>
                    <button className="export-modal-close" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="export-modal-body">
                    {/* Script Export Options */}
                    {type === 'script' && (
                        <div className="export-options">
                            <div className="form-group">
                                <label>Format:</label>
                                <div className="export-mode-toggle">
                                    <button className={`export-mode-btn ${exportFormat === 'pdf' ? 'active' : ''}`} onClick={() => setExportFormat('pdf')}>PDF</button>
                                    <button className={`export-mode-btn ${exportFormat === 'fountain' ? 'active' : ''}`} onClick={() => setExportFormat('fountain')}>Fountain</button>
                                    <button className={`export-mode-btn ${exportFormat === 'txt' ? 'active' : ''}`} onClick={() => setExportFormat('txt')}>Text (.txt)</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={includeTitlePage} onChange={(e) => setIncludeTitlePage(e.target.checked)} />
                                    <span>Include Title Page</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Status Filters (Props only) */}
                    {type === 'props' && (
                        <div className="export-status-filters">
                            <span className="export-filter-label">Include Status:</span>
                            <div className="export-filter-group">
                                {statusFilters.map((filter) => (
                                    <label key={filter.id} className="export-filter-item">
                                        <input
                                            type="checkbox"
                                            checked={filter.enabled}
                                            onChange={() => handleToggleStatusFilter(filter.id)}
                                        />
                                        <span className={`export-filter-badge status-${filter.id}`}>
                                            {filter.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Export Mode Toggle (Scenes) */}
                    <div className="export-mode-toggle">
                        <button
                            className={`export-mode-btn ${exportMode === 'all' ? 'active' : ''}`}
                            onClick={() => setExportMode('all')}
                        >
                            All Scenes ({data.length})
                        </button>
                        <button
                            className={`export-mode-btn ${exportMode === 'selected' ? 'active' : ''}`}
                            onClick={() => setExportMode('selected')}
                        >
                            Select Scenes
                        </button>
                    </div>

                    {/* Scene Selection */}
                    {exportMode === 'selected' && (
                        <div className="export-scene-selection">
                            <div className="export-scene-actions">
                                <button onClick={handleSelectAll}>Select All</button>
                                <button onClick={handleSelectNone}>Clear</button>
                            </div>

                            <div className="export-scene-list">
                                {data.length === 0 ? (
                                    <div className="export-empty">
                                        No data available.
                                    </div>
                                ) : (
                                    data.map((sceneData) => (
                                        <label key={sceneData.sceneId} className="export-scene-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedScenes.has(sceneData.sceneId)}
                                                onChange={() => handleToggleScene(sceneData.sceneId)}
                                            />
                                            <span className="export-scene-heading">{sceneData.sceneHeading}</span>
                                            {type !== 'script' && (
                                                <span className="export-scene-count">
                                                    {type === 'props'
                                                        ? `${(sceneData as SceneProps).props.length} props`
                                                        : `${(sceneData as SceneShots).shots.length} shots`
                                                    }
                                                </span>
                                            )}
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    <div className="export-preview">
                        <div className="export-preview-label">Preview:</div>
                        <pre className="export-preview-content">
                            {generateExportContent() || 'No data to export.'}
                        </pre>
                    </div>
                </div>

                <div className="export-modal-footer">
                    <button
                        className={`btn btn-secondary ${copySuccess ? 'btn-success' : ''}`}
                        onClick={handleCopyToClipboard}
                    >
                        {copySuccess ? 'Copied!' : 'Copy Text'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleDownload}
                        disabled={data.length === 0 || (exportMode === 'selected' && selectedScenes.size === 0)}
                    >
                        {type === 'script' && exportFormat === 'pdf' ? 'Export PDF' : 'Download'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ExportModal;
