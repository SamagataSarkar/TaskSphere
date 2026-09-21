import AuthLayout from '../components/AuthLayout';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { request } from '../lib/api';

export default function ForgotPassword() {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await request('/auth/forgot-password', 'POST', { identifier });
            setStatus('success');
            setMessage(res.message || 'If an account exists, a reset link has been sent.');
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-content">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-brand-50 text-brand-600">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-ink">Forgot Password?</h1>
                    <p className="mt-2 text-sm text-muted">
                        Enter your email or username and we'll send you a link to reset your password.
                    </p>
                </div>

                {status === 'success' ? (
                    <div role="status" className="p-6 text-center rounded-2xl bg-emerald-50">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
                        <p className="text-sm font-medium text-emerald-800">{message}</p>
                        <p className="mt-2 text-xs text-emerald-600">Please check your inbox (and spam folder).</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {status === 'error' && (
                            <div role="alert" id="forgotpassword-error" className="flex items-center p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                                <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                                {message}
                            </div>
                        )}

                        <div>
                            <label htmlFor="forgotpassword-field-1" className="block mb-2 text-sm font-medium text-muted">Email or Username</label>
                            <input id="forgotpassword-field-1"
                                type="text"
                                required
                                autoFocus
                                aria-describedby={status === 'error' ? "forgotpassword-error" : undefined}
                                autoComplete="username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                placeholder="name@company.com or johndoe"
                            />
                        </div>

                        <button aria-live="polite" 
                            type="submit" 
                            disabled={status === 'loading'} 
                            className="w-full flex items-center justify-center py-3 text-sm font-semibold text-white transition-all bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-70"
                        >
                            {status === 'loading' ? <Loader2 role="status" aria-label="Loading" className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted hover:text-brand-600">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to log in
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}