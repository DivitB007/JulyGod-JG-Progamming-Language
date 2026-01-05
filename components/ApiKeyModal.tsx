import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, CheckCircle, Save, Zap, Trash2 } from 'lucide-react';

interface ApiKeyModalProps {
    onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('jg_gemini_api_key');
        if (stored) {
            setSavedKey(stored);
            setApiKey(stored);
        }
    }, []);

    const handleSave = () => {
        if (!apiKey.trim()) return;
        localStorage.setItem('jg_gemini_api_key', apiKey.trim());
        setSavedKey(apiKey.trim());
    };

    const handleClear = () => {
        localStorage.removeItem('jg_gemini_api_key');
        setSavedKey('');
        setApiKey('');
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
                            Please enter your Google Gemini API Key below.
                        </p>
                    </div>

                    <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">API KEY</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-jg-primary focus:border-transparent transition-all font-mono text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        {savedKey ? (
                             <button 
                                onClick={handleClear}
                                className="flex-1 py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                                <Trash2 className="w-4 h-4" /> Remove
                            </button>
                        ) : null}
                        
                        <button 
                            onClick={handleSave}
                            disabled={!apiKey.trim() || apiKey === savedKey}
                            className={`flex-1 py-3 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg ${
                                savedKey && apiKey === savedKey 
                                ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-default shadow-none hover:scale-100' 
                                : 'bg-jg-primary hover:bg-blue-600 text-white shadow-blue-500/20'
                            }`}
                        >
                            {savedKey && apiKey === savedKey ? (
                                <>
                                    <CheckCircle className="w-5 h-5" /> Saved
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" /> Save Key
                                </>
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-jg-primary flex items-center justify-center gap-1 transition-colors"
                        >
                            Get a free API key from Google AI Studio <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};