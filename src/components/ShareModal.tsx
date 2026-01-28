import { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { Collaborator } from '../store/projectStore';
import './ShareModal.css';

interface ShareModalProps {
    projectId: string;
    projectTitle: string;
    onClose: () => void;
}

export function ShareModal({ projectId, projectTitle, onClose }: ShareModalProps) {
    const { addCollaborator, removeCollaborator, getCollaborators } = useProjectStore();

    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'editor' | 'viewer'>('editor');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadCollaborators();
    }, [projectId]);

    const loadCollaborators = async () => {
        const collabs = await getCollaborators(projectId);
        setCollaborators(collabs);
    };

    const handleAddCollaborator = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Please enter an email address');
            return;
        }

        setIsLoading(true);
        const result = await addCollaborator(projectId, email.trim().toLowerCase(), role);
        setIsLoading(false);

        if (result.success) {
            setSuccess(`Invited ${email} as ${role}`);
            setEmail('');
            loadCollaborators();
        } else {
            setError(result.error || 'Failed to add collaborator');
        }
    };

    const handleRemoveCollaborator = async (collaborator: Collaborator) => {
        setIsLoading(true);
        await removeCollaborator(projectId, collaborator.id);
        setIsLoading(false);
        loadCollaborators();
    };

    const copyShareLink = () => {
        const shareUrl = `${window.location.origin}/project/${projectId}`;
        navigator.clipboard.writeText(shareUrl);
        setSuccess('Link copied to clipboard!');
        setTimeout(() => setSuccess(''), 2000);
    };

    return (
        <div className="share-modal-backdrop" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="share-modal-header">
                    <h2>Share "{projectTitle}"</h2>
                    <button className="share-modal-close" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form className="share-form" onSubmit={handleAddCollaborator}>
                    <div className="share-input-group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Add people by email"
                            disabled={isLoading}
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                            disabled={isLoading}
                        >
                            <option value="editor">Can edit</option>
                            <option value="viewer">Can view</option>
                        </select>
                        <button type="submit" disabled={isLoading || !email.trim()}>
                            {isLoading ? 'Adding...' : 'Invite'}
                        </button>
                    </div>

                    {error && <div className="share-error">{error}</div>}
                    {success && <div className="share-success">{success}</div>}
                </form>

                <div className="share-collaborators">
                    <h3>People with access</h3>

                    {collaborators.length === 0 ? (
                        <p className="share-empty">No collaborators yet. Invite someone above!</p>
                    ) : (
                        <ul className="share-list">
                            {collaborators.map((collab) => (
                                <li key={collab.id} className="share-item">
                                    <div className="share-avatar">
                                        {(collab.display_name || collab.email)[0].toUpperCase()}
                                    </div>
                                    <div className="share-info">
                                        <span className="share-name">
                                            {collab.display_name || collab.email.split('@')[0]}
                                        </span>
                                        <span className="share-email">{collab.email}</span>
                                    </div>
                                    <span className={`share-role role-${collab.role}`}>
                                        {collab.role === 'editor' ? 'Can edit' : 'Can view'}
                                    </span>
                                    <button
                                        className="share-remove"
                                        onClick={() => handleRemoveCollaborator(collab)}
                                        title="Remove access"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="share-link-section">
                    <button className="share-copy-link" onClick={copyShareLink}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        Copy link
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShareModal;
