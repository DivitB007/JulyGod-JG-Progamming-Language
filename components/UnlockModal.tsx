import React, { useState } from 'react';
import { X, CreditCard, Lock, ShieldCheck, Loader2, CheckCircle, Wallet } from 'lucide-react';
import { JGVersion } from '../App';

interface UnlockModalProps {
    version: JGVersion;
    onClose: () => void;
    onUnlock: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ version, onClose, onUnlock }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const getPrice = () => {
        if (version === 'v0') return '₹20';
        if (version === 'v1.0') return '₹200'; // Updated V1.0 Price (after free limit)
        if (version === 'v1.1') return '₹800';
        if (version === 'v1.2') return '₹1400';
        return 'Free';
    };

    const getVersionName = () => {
        if (version === 'v0') return 'V0 Legacy';
        if (version === 'v1.0') return 'V1.0 Stable (Unlimited)';
        if (version === 'v1.1') return 'V1.1 Interactive';
        if (version === 'v1.2') return 'V1.2 Final';
        return '';
    };

    const handleAdminUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded for frontend demo purposes.
        if (password === 'Divit142637') {
            handleSuccess();
        } else {
            setError('Invalid Admin Password');
        }
    };

    const handlePurchase = () => {
        setIsProcessing(true);
        // Simulate Generic Payment Gateway Delay
        setTimeout(() => {
            setIsProcessing(false);
            handleSuccess();
        }, 2000);
    };

    const handleSuccess = () => {
        setIsSuccess(true);
        setTimeout(() => {
            onUnlock();
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-jg-surface border border-green-500/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
                    <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Unlocked!</h3>
                    <p className="text-gray-400">Access granted to {getVersionName()}.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-jg-surface border border-gray-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-gray-900 to-jg-surface border-b border-gray-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Lock className="w-5 h-5 text-jg-primary" />
                            Unlock {getVersionName()}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Premium Feature Access</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Price Tag */}
                    <div className="text-center py-4 bg-gray-800/50 rounded-xl border border-dashed border-gray-600">
                        <span className="text-gray-400 text-sm uppercase tracking-wide">One-time Purchase</span>
                        <div className="text-4xl font-extrabold text-white mt-1 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                            {getPrice()}
                        </div>
                    </div>

                    {/* Generic Payment Button (No Stripe Branding) */}
                    <button 
                        onClick={handlePurchase}
                        disabled={isProcessing}
                        className="w-full py-3 px-4 bg-gradient-to-r from-jg-primary to-jg-accent hover:from-blue-600 hover:to-violet-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Wallet className="w-5 h-5" />
                        )}
                        {isProcessing ? 'Processing...' : 'Complete Purchase'}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-700"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">Or Admin Access</span>
                        <div className="flex-grow border-t border-gray-700"></div>
                    </div>

                    {/* Admin Password */}
                    <form onSubmit={handleAdminUnlock} className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Admin Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-jg-primary focus:border-transparent transition-all"
                                placeholder="Enter secure key..."
                            />
                        </div>
                        {error && <p className="text-red-400 text-xs">{error}</p>}
                        
                        <button 
                            type="submit"
                            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors text-sm"
                        >
                            Unlock with Password
                        </button>
                    </form>
                </div>
                
                <div className="p-3 bg-gray-900/50 text-center border-t border-gray-800">
                    <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" />
                        Secure Payment Processing
                    </p>
                </div>
            </div>
        </div>
    );
};