import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import './AuthModal.css';

interface AuthModalProps {
    onClose?: () => void;
    allowClose?: boolean;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export function AuthModal({ onClose, allowClose = false }: AuthModalProps) {
    const { signIn, signUp, resetPassword, isLoading, error, clearError } = useAuthStore();

    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');
        clearError();

        if (mode === 'signup') {
            if (password !== confirmPassword) {
                setLocalError('Passwords do not match');
                return;
            }
            if (password.length < 6) {
                setLocalError('Password must be at least 6 characters');
                return;
            }
            const result = await signUp(email, password, displayName);
            if (result.success) {
                setSuccessMessage('Account created! Please check your email to confirm.');
            }
        } else if (mode === 'signin') {
            const result = await signIn(email, password);
            if (result.success && onClose) {
                onClose();
            }
        } else if (mode === 'reset') {
            const result = await resetPassword(email);
            if (result.success) {
                setSuccessMessage('Password reset email sent! Check your inbox.');
            }
        }
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setLocalError('');
        setSuccessMessage('');
        clearError();
    };

    const displayError = localError || error;

    return (
        <div className="auth-modal-backdrop">
            <div className="auth-modal">
                {allowClose && (
                    <button className="auth-modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}

                <div className="auth-modal-header">
                    <div className="auth-logo">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </div>
                    <h2>
                        {mode === 'signin' && 'Welcome Back'}
                        {mode === 'signup' && 'Create Account'}
                        {mode === 'reset' && 'Reset Password'}
                    </h2>
                    <p className="auth-subtitle">
                        {mode === 'signin' && 'Sign in to sync your projects across devices'}
                        {mode === 'signup' && 'Join Slate to save and collaborate on screenplays'}
                        {mode === 'reset' && 'Enter your email to receive a reset link'}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div className="auth-field">
                            <label htmlFor="displayName">Display Name</label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                autoComplete="name"
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    {mode !== 'reset' && (
                        <div className="auth-field">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                            />
                        </div>
                    )}

                    {mode === 'signup' && (
                        <div className="auth-field">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    {displayError && (
                        <div className="auth-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {displayError}
                        </div>
                    )}

                    {successMessage && (
                        <div className="auth-success">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            {successMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="auth-spinner" />
                        ) : (
                            <>
                                {mode === 'signin' && 'Sign In'}
                                {mode === 'signup' && 'Create Account'}
                                {mode === 'reset' && 'Send Reset Link'}
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    {mode === 'signin' && (
                        <>
                            <button
                                type="button"
                                className="auth-link"
                                onClick={() => switchMode('reset')}
                            >
                                Forgot password?
                            </button>
                            <span className="auth-divider">•</span>
                            <span>
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    className="auth-link"
                                    onClick={() => switchMode('signup')}
                                >
                                    Sign up
                                </button>
                            </span>
                        </>
                    )}
                    {mode === 'signup' && (
                        <span>
                            Already have an account?{' '}
                            <button
                                type="button"
                                className="auth-link"
                                onClick={() => switchMode('signin')}
                            >
                                Sign in
                            </button>
                        </span>
                    )}
                    {mode === 'reset' && (
                        <button
                            type="button"
                            className="auth-link"
                            onClick={() => switchMode('signin')}
                        >
                            Back to sign in
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthModal;
