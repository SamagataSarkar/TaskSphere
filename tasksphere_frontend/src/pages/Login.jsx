import AuthLayout from '../components/AuthLayout';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // CHANGED: Imported Link
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { request } from '../lib/api';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        setIsLoading(true);
        try {
            const response = await request('/auth/login', 'POST', {
                identifier, 
                password
            });
            
            localStorage.setItem('token', response.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-content">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
                    <p className="mt-2 text-sm text-muted">Your next step forward starts here.</p>
                </div>

                {error && (
                    <div role="alert" id="login-error" className="flex items-center p-4 mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                        <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label htmlFor="login-field-1" className="block mb-2 text-sm font-medium text-muted">Email or Username</label>
                        <input id="login-field-1"
                            type="text" 
                            required
                            aria-describedby={error ? "login-error" : undefined}
                                autoComplete="username"
                                value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            placeholder="johndoe or name@company.com"
                        />
                    </div>
                    
                    <div>
                        {/* CHANGED: Flex container to align label and Forgot Password link */}
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="login-field-2" className="block text-sm font-medium text-muted">Password</label>
                            <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-500">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input id="login-field-2"
                                type={showPassword ? "text" : "password"}
                                required
                                aria-describedby={error ? "login-error" : undefined}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button aria-live="polite"
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 mt-4 text-sm font-semibold text-white transition-colors bg-brand-600 rounded-xl hover:bg-brand-700 flex justify-center items-center disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 role="status" aria-label="Loading" className="w-5 h-5 animate-spin" /> : 'Sign In'}
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted">
                        Don't have an account?{' '}
                        <button onClick={() => navigate('/register')} className="font-medium text-brand-600 hover:text-brand-500">
                            Create workspace
                        </button>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
