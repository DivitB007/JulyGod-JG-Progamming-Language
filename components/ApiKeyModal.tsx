import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, CheckCircle, Loader2, Zap } from 'lucide-react';

interface ApiKeyModalProps {
    onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose }) => {
    const [hasKey, setHasKey] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkKey();
    }, []);

    const checkKey = async () => {
        if ((window as any).aistudio?.hasSelectedApiKey) {
            const has = await (window as any).aistudio.hasSelectedApiKey();
            setHasKey(has);
        }
    };

    const handleSelectKey = async () => {
        setLoading(true);
        try {
            if ((window as any).aistudio?.openSelectKey) {
                await (window as any).aistudio.openSelectKey();
                // Assume success after interaction (mitigates race condition)
                setHasKey(true);
            } else {
                console.warn("AI Studio interface not found");
            }
        } catch (e) {
            console.error("Failed to select key:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-jg-surface border border-jg-primary/30 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative">
                
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-gray-900 to-jg-surface border-b border-gray-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-jg-accent" />
                            AI Transpilation Setup
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200">
                        <p>
                            JulyGod uses <strong>Gemini 3 Pro</strong> to intelligently transpile your code into Python. 
                            You need to connect your Google Cloud Project to enable this feature.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">How to connect:</h4>
                        <ol className="list-decimal list-inside text-gray-400 space-y-2 text-sm">
                            <li>Click the <strong>Select API Key</strong> button below.</li>
                            <li>Choose a Google Cloud Project with billing enabled.</li>
                            <li>Wait for the confirmation.</li>
                        </ol>
                    </div>

                    <div className="pt-2">
                        {hasKey ? (
                            <button 
                                disabled
                                className="w-full py-3 px-4 bg-green-500/20 border border-green-500/50 text-green-400 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-default"
                            >
                                <CheckCircle className="w-5 h-5" />
                                API Key Configured
                            </button>
                        ) : (
                            <button 
                                onClick={handleSelectKey}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-jg-primary hover:bg-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                                {loading ? 'Waiting for selection...' : 'Select API Key'}
                            </button>
                        )}
                    </div>

                    <div className="text-center">
                        <a 
                            href="https://ai.google.dev/gemini-api/docs/billing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-jg-primary flex items-center justify-center gap-1 transition-colors"
                        >
                            Learn about Gemini API billing <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};