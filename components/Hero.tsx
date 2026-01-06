import React, { useState } from 'react';
import { ArrowRight, BookOpen, Lock, AlertCircle, Layers, Key, Mail } from 'lucide-react';
import { FEATURES } from '../constants';
import { ApiKeyModal } from './ApiKeyModal';

interface HeroProps {
    onGetStarted: () => void;
    onReadDocs: () => void;
    onOpenEmailConfig?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onReadDocs, onOpenEmailConfig }) => {
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    // Icon mapping
    const getIcon = (name: string) => {
        switch (name) {
            case 'BookOpen': return <BookOpen className="w-6 h-6" />;
            case 'Lock': return <Lock className="w-6 h-6" />;
            case 'AlertCircle': return <AlertCircle className="w-6 h-6" />;
            case 'Layers': return <Layers className="w-6 h-6" />;
            default: return <BookOpen className="w-6 h-6" />;
        }
    };

    return (
        <div className="relative pt-12 pb-12 lg:pt-32 lg:pb-24 overflow-hidden px-4">
            {showApiKeyModal && <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />}
            
            <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
                
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-jg-surface border border-jg-primary/20 text-jg-primary text-xs font-semibold uppercase tracking-wide mb-8 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-jg-primary mr-2 animate-pulse"></span>
                    AI Transpilation powered by Google Gemini
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                    Readable First. <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-jg-primary to-jg-accent">
                        Powerful Always.
                    </span>
                </h1>

                <p className="max-w-2xl text-base sm:text-lg lg:text-xl text-jg-muted mb-10 leading-relaxed px-2">
                    JulyGod (JG) is a new programming language designed for engineers who demand ultra-clean, readable, and low-noise code. 
                    No braces. No semicolons. Just logic.
                </p>

                <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-4 justify-center">
                    <button
                        onClick={onGetStarted}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-jg-primary hover:bg-blue-600 transition-colors shadow-lg shadow-jg-primary/25 active:scale-95 transform duration-150"
                    >
                        Run Code
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                    <button
                        onClick={onReadDocs}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-jg-surface text-base font-medium rounded-lg text-jg-muted bg-jg-surface hover:bg-gray-700 hover:text-white transition-colors active:scale-95 transform duration-150"
                    >
                        Read Specification
                    </button>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <button
                        onClick={() => setShowApiKeyModal(true)}
                        className="group inline-flex items-center px-6 py-2 text-sm font-medium rounded-full text-jg-muted bg-gray-900/50 border border-gray-700 hover:border-jg-accent hover:text-white hover:bg-gray-800 transition-all duration-300 backdrop-blur-sm"
                    >
                        <Key className="w-4 h-4 mr-2 text-jg-accent group-hover:text-white transition-colors" />
                        Configure Gemini API
                    </button>
                    
                    {onOpenEmailConfig && (
                        <button
                            onClick={onOpenEmailConfig}
                            className="group inline-flex items-center px-6 py-2 text-sm font-medium rounded-full text-jg-muted bg-gray-900/50 border border-gray-700 hover:border-purple-500 hover:text-white hover:bg-gray-800 transition-all duration-300 backdrop-blur-sm"
                        >
                            <Mail className="w-4 h-4 mr-2 text-purple-500 group-hover:text-white transition-colors" />
                            Setup Email
                        </button>
                    )}
                </div>

                {/* Features Grid */}
                <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
                    {FEATURES.map((feature, idx) => (
                        <div key={idx} className="p-6 rounded-xl bg-jg-surface/50 border border-white/5 hover:border-jg-primary/50 transition-colors duration-300">
                            <div className="w-12 h-12 rounded-lg bg-jg-dark flex items-center justify-center text-jg-primary mb-4 shadow-inner">
                                {getIcon(feature.icon)}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-jg-muted leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-20">
                 <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-jg-primary rounded-full blur-[128px]"></div>
                 <div className="absolute bottom-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-jg-accent rounded-full blur-[128px]"></div>
            </div>
        </div>
    );
};