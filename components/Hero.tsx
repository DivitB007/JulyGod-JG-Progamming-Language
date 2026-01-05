import React from 'react';
import { ArrowRight, BookOpen, Lock, AlertCircle, Layers } from 'lucide-react';
import { FEATURES } from '../constants';

interface HeroProps {
    onGetStarted: () => void;
    onReadDocs: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onReadDocs }) => {
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
        <div className="relative pt-20 pb-12 lg:pt-32 lg:pb-24 overflow-hidden">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-jg-surface border border-jg-primary/20 text-jg-primary text-xs font-semibold uppercase tracking-wide mb-8">
                    <span className="w-2 h-2 rounded-full bg-jg-primary mr-2 animate-pulse"></span>
                    AI Transpilation powered by Google Gemini
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
                    Readable First. <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-jg-primary to-jg-accent">
                        Powerful Always.
                    </span>
                </h1>

                <p className="max-w-2xl text-lg sm:text-xl text-jg-muted mb-10 leading-relaxed">
                    JulyGod (JG) is a new programming language designed for engineers who demand ultra-clean, readable, and low-noise code. 
                    No braces. No semicolons. Just logic.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                        onClick={onGetStarted}
                        className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-jg-primary hover:bg-blue-600 transition-colors shadow-lg shadow-jg-primary/25"
                    >
                        Run Code
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                    <button
                        onClick={onReadDocs}
                        className="inline-flex items-center justify-center px-8 py-4 border border-jg-surface text-base font-medium rounded-lg text-jg-muted bg-jg-surface hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        Read Specification
                    </button>
                </div>

                {/* Features Grid */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full text-left">
                    {FEATURES.map((feature, idx) => (
                        <div key={idx} className="p-6 rounded-xl bg-jg-surface/50 border border-white/5 hover:border-jg-primary/50 transition-colors duration-300">
                            <div className="w-12 h-12 rounded-lg bg-jg-dark flex items-center justify-center text-jg-primary mb-4">
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
                 <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-jg-primary rounded-full blur-[128px]"></div>
                 <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-jg-accent rounded-full blur-[128px]"></div>
            </div>
        </div>
    );
};