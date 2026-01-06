import React, { useState } from 'react';
import { X, Lock, ShieldCheck, CheckCircle, Smartphone, ArrowLeft, QrCode, ExternalLink, Loader2, Clock, Send, Mail } from 'lucide-react';
import { JGVersion } from '../App';
import { authService, dbService } from '../services/firebase';
import { emailService } from '../services/emailService';

// --- CONFIGURATION ---
const YOUR_FAMPAY_ID = "username@fam"; 
const YOUR_NAME = "JulyGod Admin"; 
const ADMIN_EMAIL = "Divitbansal016@gmail.com";

interface UnlockModalProps {
    version: JGVersion;
    isPending: boolean;
    onClose: () => void;
    onSubmitRequest: (utr: string) => Promise<void>;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ version, isPending, onClose, onSubmitRequest }) => {
    const [password, setPassword] = useState(''); // Kept for Admin backdoor if needed
    const [utr, setUtr] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'info' | 'payment'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Local success state ensures immediate feedback, even if DB listeners lag
    const [localSuccess, setLocalSuccess] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

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

    // If already pending (from DB) or just submitted successfully (local), show status
    if (isPending || localSuccess) {
        // Construct Mailto Link for manual fallback
        const subject = encodeURIComponent(`[JulyGod] Payment Verification: ${getVersionName()}`);
        const body = encodeURIComponent(`Hello Admin,\n\nI have submitted a payment request.\n\nVersion: ${getVersionName()}\nAmount: ₹${getNumericPrice()}\nUTR/Ref: ${utr || '(See Database)'}\n\nPlease verify and unlock my account.\n\nThanks.`);
        const mailtoLink = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-jg-surface border border-yellow-500/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Verification Pending</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6">
                        We have received your payment details. The admin is verifying the transaction ID <strong>(UTR)</strong>.
                    </p>
                    
                    <div className="space-y-3">
                         {emailSent ? (
                            <div className="w-full py-2 px-4 bg-green-900/30 border border-green-500/50 rounded-lg text-sm text-green-400 font-medium flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Email Sent Automatically
                            </div>
                         ) : (
                            <a 
                                href={mailtoLink}
                                className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-blue-400 font-medium flex items-center justify-center gap-2 transition-all hover:border-blue-500 hover:text-blue-300"
                            >
                                <Mail className="w-4 h-4" /> Send Verification Email Manually
                            </a>
                         )}
                        
                        <div className="bg-gray-900/50 rounded p-3 text-xs text-gray-500 border border-gray-800">
                            Estimated time: <span className="text-gray-300 font-semibold">1-2 hours</span>.
                            <br/>
                            This modal will close automatically when approved.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getPriceDisplay = () => `₹${getNumericPrice()}`;

    const generateUPILink = () => {
        const amount = getNumericPrice();
        const note = `Unlock ${version}`;
        return `upi://pay?pa=${YOUR_FAMPAY_ID}&pn=${encodeURIComponent(YOUR_NAME)}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;
    };

    const generateQRCodeURL = () => {
        const upiLink = generateUPILink();
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    };

    const handleSubmit = async () => {
        if (utr.length !== 12) {
            setError('Please enter a valid 12-digit UTR/Ref ID.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        
        try {
            // 1. Submit to Firestore
            await onSubmitRequest(utr);

            // 2. Try Automatic Email
            const uid = authService.getCurrentUid();
            let currentUser = null;
            if (uid) {
                currentUser = await dbService.getUserProfile(uid);
            }
            
            const username = currentUser?.displayName || 'Unknown User';
            
            const sent = await emailService.sendUnlockRequest(
                username, 
                uid || 'N/A', 
                version, 
                getNumericPrice().toString(), 
                utr
            );
            
            if (sent) setEmailSent(true);

            // 3. Mark success
            setLocalSuccess(true);
            setIsSubmitting(false);
            
        } catch (err: any) {
            console.error("Submission failed:", err);
            setIsSubmitting(false);
            setError(err.message || "Failed to submit request. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-jg-surface border border-gray-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
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
                        <p className="text-sm text-gray-400 mt-1">Premium Feature Access</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    
                    {step === 'info' ? (
                        <div className="space-y-6">
                            <div className="text-center py-4 bg-gray-800/50 rounded-xl border border-dashed border-gray-600">
                                <span className="text-gray-400 text-sm uppercase tracking-wide">One-time Purchase</span>
                                <div className="text-4xl font-extrabold text-white mt-1 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
                                    {getPriceDisplay()}
                                </div>
                            </div>

                            <button 
                                onClick={() => setStep('payment')}
                                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                            >
                                <Smartphone className="w-5 h-5" />
                                Pay via UPI / Fampay
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 flex flex-col items-center">
                            
                            {/* QR Code Section */}
                            <div className="bg-white p-3 rounded-xl shadow-inner relative">
                                <img 
                                    src={generateQRCodeURL()} 
                                    alt="UPI QR Code" 
                                    className="w-40 h-40 object-contain mix-blend-multiply"
                                />
                            </div>

                            <div className="text-center space-y-1">
                                <p className="text-sm text-gray-300">Scan with <span className="font-bold text-orange-400">Fampay</span> or any UPI App</p>
                                <p className="text-xs text-gray-500">Pay <span className="text-white font-mono">{getPriceDisplay()}</span> to <span className="text-white font-mono">{YOUR_FAMPAY_ID}</span></p>
                            </div>

                            <a 
                                href={generateUPILink()}
                                className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-center rounded-lg text-sm text-blue-400 flex items-center justify-center gap-2 transition-colors md:hidden"
                            >
                                <ExternalLink className="w-4 h-4" /> Open Payment App
                            </a>

                            <div className="w-full border-t border-gray-700 pt-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">
                                        Enter 12-digit UTR / Ref No.
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={12}
                                        value={utr}
                                        onChange={(e) => {
                                            setUtr(e.target.value.replace(/\D/g, ''));
                                            setError('');
                                        }}
                                        placeholder="e.g. 324189012345"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono tracking-widest text-center"
                                    />
                                </div>
                                
                                <button 
                                    onClick={handleSubmit}
                                    disabled={utr.length !== 12 || isSubmitting}
                                    className={`w-full py-3 px-4 font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                                        utr.length === 12 && !isSubmitting
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting Request...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Submit for Approval
                                        </>
                                    )}
                                </button>
                                
                                {error && step === 'payment' && (
                                    <p className="text-red-400 text-xs text-center animate-pulse">{error}</p>
                                )}
                                
                                <p className="text-[10px] text-gray-500 text-center">
                                    The Admin will verify the UTR and approve via email.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};