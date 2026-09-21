import AuthLayout from '../components/AuthLayout';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { request } from '../lib/api';

export default function Register() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState(''); // ADDED: Username state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        
        setIsLoading(true);
        try {
            await request('/auth/register', 'POST', {
                name,
                username, // ADDED: Include username in the payload
                email,
                password
            });
            
            alert("Registration successful! Please log in.");
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-content">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-ink">Create your account</h1>
                    <p className="mt-2 text-sm text-muted">Join TaskSphere to manage your projects</p>
                </div>

                {error && (
                    <div role="alert" id="register-error" className="flex items-center p-4 mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                        <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label htmlFor="register-field-1" className="block mb-2 text-sm font-medium text-muted">Full Name</label>
                        <input id="register-field-1"
                            type="text"
                            required
                            aria-describedby={error ? "register-error" : undefined}
                                autoComplete="name"
                                value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* ADDED: Username Input Field */}
                    <div>
                        <label htmlFor="register-field-2" className="block mb-2 text-sm font-medium text-muted">Username</label>
                        <input id="register-field-2"
                            type="text"
                            required
                            aria-describedby={error ? "register-error" : undefined}
                                autoComplete="username"
                                value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                            className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            placeholder="johndoe99"
                        />
                    </div>

                    <div>
                        <label htmlFor="register-field-3" className="block mb-2 text-sm font-medium text-muted">Email Address</label>
                        <input id="register-field-3"
                            type="email"
                            required
                            aria-describedby={error ? "register-error" : undefined}
                                autoComplete="email"
                                value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            placeholder="name@company.com"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="register-field-4" className="block mb-2 text-sm font-medium text-muted">Password</label>
                        <div className="relative">
                            <input id="register-field-4"
                                type={showPassword ? "text" : "password"}
                                required
                                aria-describedby={error ? "register-error" : undefined}
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 text-sm transition-colors border rounded-xl border-line focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                placeholder="••••••••"
                                minLength={8}
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
                        {isLoading ? <Loader2 role="status" aria-label="Loading" className="w-5 h-5 animate-spin" /> : 'Register Account'}
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted">
                        Already have an account?{' '}
                        <button onClick={() => navigate('/login')} className="font-medium text-brand-600 hover:text-brand-500">
                            Sign in instead
                        </button>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
