import AuthLayout from '../components/AuthLayout';
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { request } from '../lib/api';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // Extracts token from URL
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setStatus('error');
            setMessage('Missing reset token. Please request a new link.');
            return;
        }

        setStatus('loading');
        try {
            await request('/auth/reset-password', 'POST', { token, newPassword });
            setStatus('success');
            setMessage('Password successfully reset. You can now log in.');
            
            // Redirect to login after 3 seconds
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Invalid or expired token. Please request a new one.');
        }
    };

    if (status === 'success') {
        return (
            <AuthLayout>
                <div className="auth-form-content">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                    <h1 className="text-2xl font-bold text-ink mb-2">Password Reset!</h1>
                    <p className="text-sm text-muted mb-6">{message}</p>
                    <Link to="/login" className="inline-block w-full py-3 text-sm font-semibold text-white transition-colors bg-brand-600 rounded-xl hover:bg-brand-700">
                        Go to Login
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="auth-form-content">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-brand-50 text-brand-600">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-ink">Create New Password</h1>
                    <p className="mt-2 text-sm text-muted">Please enter a strong password for your account.</p>
                </div>

                {!token && <p role="alert" className="notice">This reset link is incomplete. <Link to="/forgot-password" className="underline">Request a new link</Link>.</p>}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {status === 'error' && (
                        <div role="alert" id="resetpassword-error" className="flex items-center p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                            <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                            {message}
                        </div>
                    )}

                    <div>
                        <label htmlFor="resetpassword-field-1" className="block mb-2 text-sm font-medium text-muted">New Password</label>
                        <div className="relative">
                            <input id="resetpassword-field-1"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                aria-describedby={status === 'error' ? "resetpassword-error" : undefined}
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-subtle hover:text-muted"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button aria-live="polite" 
                        type="submit" 
                        disabled={status === 'loading' || !token} 
                        className="w-full flex items-center justify-center py-3 text-sm font-semibold text-white transition-all bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-70"
                    >
                        {status === 'loading' ? <Loader2 role="status" aria-label="Loading" className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
}
