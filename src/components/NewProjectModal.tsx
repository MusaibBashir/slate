import { useState } from 'react';
import { createPortal } from 'react-dom';
import './NewProjectModal.css';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (title: string, author: string, email: string) => void;
}

export function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [email, setEmail] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(title || 'Untitled Screenplay', author || 'Author Name', email || 'email@example.com');
        // Reset fields
        setTitle('');
        setAuthor('');
        setEmail('');
    };

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Screenplay</h2>
                    <button className="btn-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="project-title">Script Title</label>
                            <input
                                id="project-title"
                                type="text"
                                className="form-input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Untitled Screenplay"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="project-author">Author Name</label>
                            <input
                                id="project-author"
                                type="text"
                                className="form-input"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Author Name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="project-email">Email</label>
                            <input
                                id="project-email"
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Create Screenplay
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default NewProjectModal;
