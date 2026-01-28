import { ReactNode } from 'react';
import './SplitPane.css';

interface SplitPaneProps {
    left: ReactNode;
    right: ReactNode;
    leftTitle?: string;
    rightTitle?: string;
}

export function SplitPane({ left, right, leftTitle, rightTitle }: SplitPaneProps) {
    return (
        <div className="split-pane">
            <div className="split-pane-left">
                {leftTitle && (
                    <div className="split-pane-header">
                        <span className="split-pane-title">{leftTitle}</span>
                    </div>
                )}
                <div className="split-pane-content">
                    {left}
                </div>
            </div>

            <div className="split-pane-divider" />

            <div className="split-pane-right">
                {rightTitle && (
                    <div className="split-pane-header">
                        <span className="split-pane-title">{rightTitle}</span>
                    </div>
                )}
                <div className="split-pane-content">
                    {right}
                </div>
            </div>
        </div>
    );
}

export default SplitPane;
