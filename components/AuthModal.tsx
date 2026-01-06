
import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, AlertCircle, Database, ExternalLink, ArrowRight } from 'lucide-react';
import { authService } from '../services/firebase';

interface AuthModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface AuthError {
    message: string;
    type: 'error' | 'warning';
    action?: {
        label: string;
        onClick?: () => void;
        link?: string;
    };
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AuthError | null>(null);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                if (!name || !name.trim()) throw new Error("Name is required");
                await authService.signUp(email, password, name.trim());
            } else {
                await authService.signIn(email, password);
            }
            onSuccess();
        } catch (err: any) {
            console.error("Auth Error Full:", err);
            
            let msg = "Authentication failed. Check credentials.";
            let type: 'error' | 'warning' = 'error';
            let action = undefined;

            const errCode = err.code || '';
            const errMsg = err.message || '';

            // 1. Custom Validation
            if (errMsg === "Name is required") {
                msg = "Please enter a username to continue.";
            }
            
            // 2. Email Already Exists
            else if (errCode === 'auth/email-already-in-use') {
                msg = "This email is already registered.";
                type = 'warning';
                action = {
                    label: "Switch to Sign In",
                    onClick: () => {
                        setIsSignUp(false);
                        setError(null);
                    }
                };
            }

            // 3. Invalid Credentials (Generic in new Firebase Auth v10+)
            else if (errCode === 'auth/invalid-credential' || errMsg.includes('auth/invalid-credential')) {
                if (isSignUp) {
                    msg = "We couldn't create your account with these credentials. Please check your email format or try a different email.";
                } else {
                    msg = "Incorrect email or password. Please try again or create a new account.";
                    type = 'warning';
                    action = {
                        label: "Create new account instead",
                        onClick: () => {
                            setIsSignUp(true);
                            setError(null);
                        }
                    };
                }
            }

            // 4. Other specific codes
            else if (errCode === 'auth/user-not-found' || errCode === 'auth/wrong-password') {
                msg = "Invalid email or password. Don't have an account yet?";
                type = 'warning';
                action = {
                    label: "Create new account instead",
                    onClick: () => {
                        setIsSignUp(true);
                        setError(null);
                    }
                };
            }

            // 5. Firestore API Disabled -> Link to GCP Console
            else if (errCode === 'permission-denied' || errMsg.includes('Firestore API')) {
                msg = "Database access is currently disabled. Please contact the administrator.";
                type = 'error';
                action = {
                    label: "View Status",
                    link: "https://console.firebase.google.com"
                };
            }
            
            // 6. Firebase Auth Not Enabled -> Link to Firebase Console
            else if (errCode === 'auth/configuration-not-found' || errCode === 'auth/operation-not-allowed') {
                msg = "Authentication is not enabled for this project.";
                type = 'warning';
                action = {
                    label: "Open Firebase Console",
                    link: "https://console.firebase.google.com"
                };
            }

            // 7. Standard Errors / Fallback
            else if (errCode === 'auth/weak-password') {
                msg = "Password is too weak. Use at least 6 characters.";
            } else if (errMsg) {
                // Cleaner raw error parsing
                msg = errMsg
                    .replace('Firebase: ', '')
                    .replace(/Error \(auth\/(.+?)\)\.?/, '$1')
                    .replace(/-/g, ' ');
                
                // Capitalize first letter
                msg = msg.charAt(0).toUpperCase() + msg.slice(1);
            }

            setError({ message: msg, type, action });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-jg-surface border border-jg-primary/30 rounded-2xl max-sm:max-w-xs max-w-sm w-full shadow-2xl overflow-hidden relative">
                
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-gray-900 to-jg-surface border-b border-gray-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {isSignUp ? 'Join the JulyGod ecosystem.' : 'Sign in to access your dashboard.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {authService.isDemo() ? (
                        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs p-3 rounded flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <strong>Setup Required:</strong> Firebase Keys missing.
                                <br/>
                                Data will be saved locally (Demo Mode).
                            </div>
                        </div>
                    ) : (
                         <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-2 rounded flex items-center gap-2">
                            <Database className="w-3 h-3" />
                            <strong>Connected:</strong> Cloud Environment Active.
                        </div>
                    )}

                    {isSignUp && (
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-medium ml-1">Username <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:ring-2 focus:ring-jg-primary focus:outline-none"
                                    placeholder="Engineer_01"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-medium ml-1">Email <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:ring-2 focus:ring-jg-primary focus:outline-none"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-medium ml-1">Password <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:ring-2 focus:ring-jg-primary focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={`flex items-start gap-2 text-xs p-3 rounded animate-in slide-in-from-top-2 duration-200 ${error.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="leading-tight font-medium">{error.message}</p>
                                
                                {error.action && (
                                    <div className="mt-2">
                                        {error.action.link ? (
                                             <a 
                                                href={error.action.link}
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 font-bold underline hover:text-white transition-colors"
                                             >
                                                {error.action.label} <ExternalLink className="w-3 h-3" />
                                             </a>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={error.action.onClick}
                                                className="inline-flex items-center gap-1 font-bold underline hover:text-white transition-colors"
                                            >
                                                {error.action.label} <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-jg-primary hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                    
                    <div className="text-center pt-2">
                        <button 
                            type="button"
                            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
