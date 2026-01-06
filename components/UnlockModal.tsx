
import React, { useState } from 'react';
import { X, Lock, Smartphone, ArrowLeft, Loader2, Clock, Send, Mail, AlertCircle, Ticket, Zap, ShieldCheck } from 'lucide-react';
import { JGVersion } from '../App';
import { authService, dbService, UserProfile } from '../services/firebase';

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
    const [error, setError] = useState('');
    const [step, setStep] = useState<'info' | 'payment'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handleSubmit = async () => {
        if (utr.length < 10) { setError('Enter a valid 12-digit UTR/Ref ID.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const uid = authService.getCurrentUid();
            if (!uid) throw new Error("Session expired. Please re-login.");
            
            const profile = await dbService.getUserProfile(uid);
            const username = profile?.displayName || 'User';

            // Submit directly to the central ledger
            await dbService.submitPayment(uid, version, utr, username);
            
            setLocalSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to submit request.");
        } finally { setIsSubmitting(false); }
    };

    if (isPending || localSuccess) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                <div className="bg-jg-surface border border-jg-primary/30 rounded-[2rem] p-10 max-w-sm w-full shadow-2xl relative">
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="text-center mb-8">
                        <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                            <ShieldCheck className="w-10 h-10 text-emerald-500 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Verification Active</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Your payment submission is now in the **Command Feed**. The Admin will manually verify your UTR and authorize your access.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-black/40 p-5 rounded-2xl border border-white/5 text-center">
                            <span className="block text-[10px] uppercase font-black text-gray-600 mb-1 tracking-widest">Pending Version</span>
                            <span className="text-jg-primary font-black text-lg uppercase tracking-widest">{version}</span>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Usually verified within 1-12 hours. You will receive a system alert on your dashboard once approved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-jg-surface border border-white/10 rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden relative animate-in zoom-in duration-200">
                <div className="p-8 bg-gradient-to-r from-gray-900 to-jg-surface border-b border-white/5 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-white flex items-center gap-3 italic uppercase tracking-tighter">
                            {step === 'payment' && (
                                <button onClick={() => setStep('info')} className="mr-2 hover:text-jg-primary transition-colors">
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            )}
                            <Lock className="w-6 h-6 text-jg-primary" />
                            Unlock {getVersionName()}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-7 h-7" />
                    </button>
                </div>

                <div className="p-8">
                    {step === 'info' ? (
                        <div className="space-y-8">
                            <div className="text-center py-8 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                                <span className="text-gray-500 text-[10px] uppercase font-black tracking-[0.3em]">Foundational Access Fee</span>
                                <div className="text-5xl font-black text-white mt-3 italic tracking-tighter">₹{getNumericPrice()}</div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {!hasTrialed && getTrialText() && (
                                     <button 
                                        onClick={handleStartTrial}
                                        disabled={isTrialing}
                                        className="w-full py-4 bg-jg-primary/10 hover:bg-jg-primary/20 text-jg-primary font-black text-xs rounded-2xl border-2 border-jg-primary/30 flex items-center justify-center gap-3 transition-all uppercase tracking-widest"
                                    >
                                        {isTrialing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                        Activate {getTrialText()}
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => setStep('payment')}
                                    className="w-full py-5 bg-jg-primary hover:bg-blue-600 text-white font-black text-xs rounded-2xl shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 transition-all uppercase tracking-widest active:scale-[0.98]"
                                >
                                    <Smartphone className="w-5 h-5" /> Proceed to Manual Payment
                                </button>
                            </div>
                            
                            {hasTrialed && (
                                <div className="text-center flex items-center justify-center gap-2 text-gray-600">
                                    <AlertCircle className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Free trial consumed for this version</span>
                                </div>
                            )}
                            {error && <p className="text-xs text-red-400 text-center font-bold bg-red-500/10 p-2 rounded-lg">{error}</p>}
                        </div>
                    ) : (
                        <div className="space-y-8 flex flex-col items-center animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-white p-5 rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.1)] group relative">
                                <div className="absolute -inset-2 bg-gradient-to-br from-jg-primary to-jg-accent rounded-[2.5rem] opacity-20 blur-xl"></div>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${YOUR_FAMPAY_ID}&pn=${encodeURIComponent(YOUR_NAME)}&am=${getNumericPrice()}&tn=JG Unlock ${version}`)}`} 
                                    alt="QR" className="w-48 h-48 relative z-10 mix-blend-multiply" 
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Scan & Pay Any UPI</p>
                                <div className="px-4 py-2 bg-black/50 rounded-full border border-white/5 font-mono text-xs text-jg-primary font-bold">{YOUR_FAMPAY_ID}</div>
                            </div>
                            <div className="w-full space-y-4 pt-6 border-t border-white/5">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={utr}
                                        onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                                        placeholder="12-DIGIT UTR / REF ID"
                                        maxLength={12}
                                        className="w-full bg-black/60 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-lg font-mono text-center focus:border-jg-primary focus:outline-none transition-all placeholder:text-gray-700 font-bold"
                                    />
                                </div>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={utr.length < 10 || isSubmitting}
                                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Submit Request to Admin
                                </button>
                                {error && <p className="text-xs text-red-400 text-center font-bold bg-red-500/10 p-2 rounded-lg">{error}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
