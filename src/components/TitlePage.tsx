import { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import './TitlePage.css';

export function TitlePage() {
    const { currentProject, updateTitle, updateAuthor } = useProjectStore();

    // Local state for all editable fields
    const [localByline, setLocalByline] = useState('By-line');
    const [localEmail, setLocalEmail] = useState('email@example.com');
    const [localCopyright, setLocalCopyright] = useState('');

    // Initialize local state from project
    useEffect(() => {
        if (currentProject) {
            setLocalEmail(currentProject.email || 'email@example.com');
            const year = new Date(currentProject.createdAt).getFullYear();
            const authorName = currentProject.author || 'Author Name';
            setLocalCopyright(`© ${year} ${authorName}`);
        }
    }, [currentProject?.id, currentProject?.author]);

    if (!currentProject) return null;

    const date = new Date(currentProject.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).toUpperCase();

    const handleTitleChange = (e: React.FocusEvent<HTMLDivElement>) => {
        const newTitle = e.currentTarget.textContent?.trim() || 'Untitled Screenplay';
        updateTitle(newTitle);
    };

    const handleAuthorChange = (e: React.FocusEvent<HTMLDivElement>) => {
        const newAuthor = e.currentTarget.textContent?.trim() || 'Author Name';
        updateAuthor(newAuthor);
    };

    const handleBylineChange = (e: React.FocusEvent<HTMLDivElement>) => {
        const newByline = e.currentTarget.textContent?.trim() || 'By-line';
        setLocalByline(newByline);
    };

    const handleEmailChange = (e: React.FocusEvent<HTMLDivElement>) => {
        const newEmail = e.currentTarget.textContent?.trim() || 'email@example.com';
        setLocalEmail(newEmail);
    };

    const handleCopyrightChange = (e: React.FocusEvent<HTMLDivElement>) => {
        const newCopyright = e.currentTarget.textContent?.trim() || '';
        setLocalCopyright(newCopyright);
    };

    return (
        <div className="title-page-container">
            <div className="title-page">
                <div className="title-page-center">
                    <div
                        className="title-script editable-field"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleTitleChange}
                        data-placeholder="TITLE OF SCRIPT"
                    >
                        {currentProject.title || 'UNTITLED SCREENPLAY'}
                    </div>
                    <div
                        className="title-byline editable-field"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleBylineChange}
                        data-placeholder="By-line"
                    >
                        {localByline}
                    </div>
                    <div
                        className="title-author editable-field"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleAuthorChange}
                        data-placeholder="AUTHOR NAME"
                    >
                        {currentProject.author || 'Author Name'}
                    </div>
                    <div className="title-date">{date}</div>
                </div>
                <div className="title-page-footer">
                    <div
                        className="title-copyright editable-field"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleCopyrightChange}
                        data-placeholder="© Year Author"
                    >
                        {localCopyright}
                    </div>
                    <div
                        className="title-email editable-field"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleEmailChange}
                        data-placeholder="email@example.com"
                    >
                        {localEmail}
                    </div>
                </div>
            </div>

            <div className="page-divider">
                <span className="page-divider-label">Page 2</span>
            </div>
        </div>
    );
}

export default TitlePage;
