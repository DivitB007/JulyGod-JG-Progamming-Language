import React, { useState } from 'react';
import { X, Lock, CheckCircle, Smartphone, ArrowLeft, Loader2, Clock, Send, Mail, AlertCircle, Key, Ticket, Zap } from 'lucide-react';
import { JGVersion } from '../App';
import { authService, dbService, UserProfile } from '../services/firebase';
import { emailService } from '../services/emailService';

const YOUR_FAMPAY_ID = "divitbansal016@fam"; 
const YOUR_NAME = "Divit Bansal"; 
const ADMIN_EMAIL = "Divitbansal016@gmail.com";

interface UnlockModalProps {
    version: JGVersion;
    isPending: boolean;
    userProfile: UserProfile | null;
    onClose: () => void;
    onSubmitRequest: (utr: string) => Promise<void>;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ version, isPending, userProfile, onClose, onSubmitRequest }) => {
    const [utr, setUtr] = useState('');
    const [redeemCodeInput, setRedeemCodeInput] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'info' | 'payment'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [isTrialing, setIsTrialing] = useState(false);
    const [localSuccess, setLocalSuccess] = useState(false);

    const getNumericPrice = () => {
        if (version === 'v0') return 20;
        if (version === 'v1.0') return 200;
        if (version === 'v1.1') return 800;
        if (version === 'v1.2') return 1400;
        return 0;
    };

    const getVersionName = () => {
        if (version === 'v0') return 'V0 Legacy';
        if (version === 'v1.0') return 'V1.0 Stable';
        if (version === 'v1.1') return 'V1.1 Interactive';
        if (version === 'v1.2') return 'V1.2 Final';
        return '';
    };

    const getTrialText = () => {
        if (version === 'v0') return '1 Year Trial';
        if (version === 'v1.1') return '3 Months Trial';
        if (version === 'v1.2') return '1 Month Trial';
        return '';
    }

    const hasTrialed = userProfile?.trials?.[version];

    const handleStartTrial = async () => {
        setIsTrialing(true);
        setError('');
        try {
            const uid = authService.getCurrentUid();
            if (!uid) throw new Error("Login required.");
            await dbService.startTrial(uid, version);
            onClose();
        } catch (err: any) {
            setError(err.message || "Trial activation failed.");
        } finally {
            setIsTrialing(false);
        }
    };

    const handleRedeem = async () => {
        if (!redeemCodeInput.trim()) return;
        setIsRedeeming(true);
        setError('');
        try {
            const uid = authService.getCurrentUid();
            if (!uid) throw new Error("Auth required.");
            await dbService.redeemCode(uid, redeemCodeInput);
            onClose();
        } catch (err: any) {
            setError(err.message || "Invalid code.");
        } finally {
            setIsRedeeming(false);
        }
    };

    if (isPending || localSuccess) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-jg-surface border border-jg-primary/50 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="text-center mb-6">
                        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-jg-primary animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Payment Verification</h3>
                        <p className="text-xs text-gray-400">
                            Wait for Admin to mail your <strong>Redeem Code</strong> to your inbox.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-black/40 p-4 rounded-xl border border-gray-800">
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest">Paste Code to Unlock</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={redeemCodeInput}
                                    onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                                    placeholder="JG-XXXX-XXXX"
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:ring-1 focus:ring-jg-primary"
                                />
                                <button 
                                    onClick={handleRedeem}
                                    disabled={isRedeeming || !redeemCodeInput}
                                    className="px-3 bg-jg-primary hover:bg-blue-600 rounded-lg text-white disabled:opacity-50"
                                >
                                    {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-[10px] text-red-400 text-center">{error}</p>}

                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 mb-2">Haven't received the code?</p>
                            <a 
                                href={`mailto:${ADMIN_EMAIL}?subject=Payment Verification Request&body=UTR: ${utr}`}
                                className="text-[10px] text-jg-primary hover:underline flex items-center justify-center gap-1"
                            >
                                <Mail className="w-3 h-3" /> Remind Admin via Email
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (utr.length < 10) { setError('Enter valid UTR/Ref ID.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const uid = authService.getCurrentUid();
            if (!uid) throw new Error("Not logged in.");
            
            const profile = await dbService.getUserProfile(uid);
            const username = profile?.displayName || 'User';

            const { redeemCode } = await dbService.submitPayment(uid, version, utr, username);
            await emailService.sendUnlockRequest(
                username, uid, version, getNumericPrice().toString(), utr, redeemCode
            );

            setLocalSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to submit.");
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-jg-surface border border-gray-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-gradient-to-r from-gray-900 to-jg-surface border-b border-gray-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {step === 'payment' && (
                                <button onClick={() => setStep('info')} className="mr-2 hover:text-jg-primary transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <Lock className="w-5 h-5 text-jg-primary" />
                            Unlock {getVersionName()}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'info' ? (
                        <div className="space-y-6">
                            <div className="text-center py-6 bg-gray-800/30 rounded-xl border border-gray-700">
                                <span className="text-gray-500 text-xs uppercase font-bold tracking-widest">Flagship Access</span>
                                <div className="text-4xl font-black text-white mt-2">₹{getNumericPrice()}</div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {!hasTrialed && getTrialText() && (
                                     <button 
                                        onClick={handleStartTrial}
                                        disabled={isTrialing}
                                        className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-jg-primary font-bold rounded-xl border border-jg-primary/30 flex items-center justify-center gap-2 transition-all"
                                    >
                                        {isTrialing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                        Start {getTrialText()} (Free)
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => setStep('payment')}
                                    className="w-full py-4 bg-jg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Smartphone className="w-5 h-5" /> Buy Permanent Access
                                </button>
                            </div>
                            
                            {hasTrialed && (
                                <p className="text-[10px] text-center text-jg-muted">
                                    You have already used your free trial for this version.
                                </p>
                            )}
                            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                        </div>
                    ) : (
                        <div className="space-y-6 flex flex-col items-center">
                            <div className="bg-white p-3 rounded-2xl shadow-xl">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${YOUR_FAMPAY_ID}&pn=${encodeURIComponent(YOUR_NAME)}&am=${getNumericPrice()}&tn=JG Unlock ${version}`)}`} 
                                    alt="QR" className="w-40 h-40 mix-blend-multiply" 
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400">Scan with Fampay / Any UPI</p>
                                <p className="text-sm font-mono text-white mt-1">{YOUR_FAMPAY_ID}</p>
                            </div>
                            <div className="w-full space-y-3 pt-4 border-t border-gray-800">
                                <input
                                    type="text"
                                    value={utr}
                                    onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 12-digit UTR / Ref ID"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm font-mono text-center focus:ring-1 focus:ring-jg-primary"
                                />
                                <button 
                                    onClick={handleSubmit}
                                    disabled={utr.length < 10 || isSubmitting}
                                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Submit Transaction
                                </button>
                                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};