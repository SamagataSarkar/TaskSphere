import AuthLayout from '../components/AuthLayout';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react';
import { request } from '../lib/api';

export default function AcceptInvite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No invitation token found in the URL.');
        }
    }, [token]);

    const handleAccept = async () => {
        setStatus('loading');
        try {
            const response = await request('/projects/invitations/accept', 'POST', { token });
            setStatus('success');
            setMessage(response.message || 'You have successfully joined the project!');
        } catch (err) {
            setStatus('error');
            // If they get a 403 Forbidden, they aren't logged in.
            if (err.message.includes('403') || err.message.toLowerCase().includes('unauthorized')) {
                setMessage('You must be logged in to accept this invitation.');
            } else {
                setMessage(err.message || 'Failed to accept the invitation.');
            }
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-content">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center">
                        <Users className="w-8 h-8 text-brand-600" />
                    </div>
                </div>
                <h1 className="text-center text-2xl font-bold text-ink">Project Invitation</h1>
                <p className="mt-2 text-center text-sm text-muted">
                    You've been invited to collaborate on TaskSphere.
                </p>
            </div>

            <div className="auth-form-content">
                <div className="pt-8" aria-live="polite">
                    
                    {status === 'idle' && (
                        <div className="text-center">
                            <p className="text-muted mb-6">Click below to securely accept your invitation and join the workspace.</p>
                            <button
                                onClick={handleAccept}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                            >
                                Accept Invitation
                            </button>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-6">
                            <Loader2 role="status" aria-label="Loading" className="w-8 h-8 text-brand-600 animate-spin mb-4" />
                            <p className="text-muted font-medium">Validating your secure token...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-ink mb-2">Welcome Aboard!</h3>
                            <p className="text-emerald-700 bg-emerald-50 py-3 px-4 rounded-xl text-sm mb-6 border border-emerald-100">
                                {message}
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-elevated hover:bg-elevated transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-ink mb-2">Invitation Error</h3>
                            <p className="text-red-700 bg-red-50 py-3 px-4 rounded-xl text-sm mb-6 border border-red-100">
                                {message}
                            </p>
                            
                            {message.includes('logged in') ? (
                                <Link to="/login" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors">
                                    Log In to Accept
                                </Link>
                            ) : (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full flex justify-center py-3 px-4 border border-line rounded-xl shadow-sm text-sm font-semibold text-muted bg-panel hover:bg-elevated transition-colors"
                                >
                                    Return to Dashboard
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthLayout>
    );
}
