
import React, { useState, useEffect, useRef } from 'react';
// Added AlertCircle to imports
import { Play, Copy, RefreshCw, Check, Terminal as TerminalIcon, ArrowRight, FileCode, Loader2, Keyboard, SendHorizontal, Lock, Zap, Clock, Timer, Sparkles, AlertCircle } from 'lucide-react';
import { executeJGAsync, transpileJGtoPython, JGVersion } from '../services/jgTranspiler';
import { V0_EXAMPLE, V01_EXAMPLE, V1_EXAMPLE, V1_1_EXAMPLE, V1_2_EXAMPLE } from '../constants';
import { UserProfile } from '../services/firebase';

interface PlaygroundProps {
    jgVersion: JGVersion;
    userProfile: UserProfile | null;
    isUnlocked: boolean;
    onRequestUnlock: () => void;
}

const highlightJG = (code: string, version: JGVersion) => {
    const tokens = code.split(/(".*?"|\/\/.*$|\b\d+\b|[\{\}\(\)\[\]]|[ \t\n]+)/gm);

    return tokens.map((token, i) => {
        if (!token) return null;
        if (token.startsWith('"')) return <span key={i} className="text-green-400">{token}</span>;
        if (token.startsWith('//')) return <span key={i} className="text-gray-500 italic">{token}</span>;
        if (/^\d+$/.test(token)) return <span key={i} className="text-orange-400">{token}</span>;

        const commonKeywords = ['create', 'function', 'say', 'print', 'log', 'when', 'otherwise', 'end', 'takes', 'give', 'final', 'and', 'or', 'greater', 'less', 'equals', 'true', 'false'];
        const v01Keywords = ['call', 'repeat', 'times', 'list', 'map', 'contains', 'unique', 'has', 'as', 'get', 'use', 'library', 'do', 'until', 'stop', 'skip', 'start', 'program'];
        const v1Keywords = ['class', 'is', 'a', 'extends', 'new', 'public', 'private', 'override', 'set', 'to', 'init'];
        const v11Keywords = ['import', 'Input'];
        const v12Keywords = ['int', 'decimal', 'long', 'bool', 'convert', 'True', 'False'];

        let activeKeywords: string[] = [...commonKeywords];
        if (version !== 'v0') activeKeywords = [...activeKeywords, ...v01Keywords];
        if (['v1.0', 'v1.1', 'v1.2'].includes(version)) activeKeywords = [...activeKeywords, ...v1Keywords];
        if (['v1.1', 'v1.2'].includes(version)) activeKeywords = [...activeKeywords, ...v11Keywords];
        if (version === 'v1.2') activeKeywords = [...activeKeywords, ...v12Keywords];
        
        const trimmed = token.trim();
        if (activeKeywords.includes(trimmed)) {
            if (v12Keywords.includes(trimmed)) return <span key={i} className="text-pink-400 font-bold">{token}</span>;
            if (v1Keywords.includes(trimmed) || v11Keywords.includes(trimmed)) return <span key={i} className="text-purple-400 font-bold">{token}</span>;
            if (['when', 'otherwise', 'end', 'repeat', 'stop', 'skip'].includes(trimmed)) return <span key={i} className="text-jg-accent font-bold">{token}</span>;
            return <span key={i} className="text-blue-400 font-bold">{token}</span>;
        }
        return <span key={i} className="text-gray-200">{token}</span>;
    });
};

const TrialCountdown = ({ expiryDate }: { expiryDate: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTime = () => {
            const diff = new Date(expiryDate).getTime() - new Date().getTime();
            if (diff <= 0) return 'Expired';
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            
            return `${days}d ${hours}h ${minutes}m`;
        };

        const timer = setInterval(() => setTimeLeft(calculateTime()), 60000);
        setTimeLeft(calculateTime());
        return () => clearInterval(timer);
    }, [expiryDate]);

    return (
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] md:text-xs text-blue-400 font-bold">
            <Timer className="w-3 h-3 md:w-4 h-4 animate-pulse" />
            TRIAL ENDS IN: {timeLeft}
        </div>
    );
};

export const Playground: React.FC<PlaygroundProps> = ({ jgVersion, userProfile, isUnlocked, onRequestUnlock }) => {
    const [inputCode, setInputCode] = useState(V1_2_EXAMPLE);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [showPython, setShowPython] = useState(false);
    const [pythonCode, setPythonCode] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [copied, setCopied] = useState(false);

    const [isWaitingForInput, setIsWaitingForInput] = useState(false);
    const [inputPrompt, setInputPrompt] = useState("");
    const [userInputValue, setUserInputValue] = useState("");
    const inputResolverRef = useRef<((value: string) => void) | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const inputFieldRef = useRef<HTMLInputElement>(null);
    const terminalBottomRef = useRef<HTMLDivElement>(null);

    const isLockedView = !isUnlocked;
    const activeTrialExpiry = userProfile?.trials?.[jgVersion];
    const isPermanent = userProfile?.unlockedVersions?.includes(jgVersion) || jgVersion === 'v1.0' || jgVersion === 'v0.1-remastered';

    useEffect(() => {
        if (jgVersion === 'v0') setInputCode(V0_EXAMPLE);
        else if (jgVersion === 'v0.1-remastered') setInputCode(V01_EXAMPLE);
        else if (jgVersion === 'v1.0') setInputCode(V1_EXAMPLE);
        else if (jgVersion === 'v1.1') setInputCode(V1_1_EXAMPLE);
        else setInputCode(V1_2_EXAMPLE);
    }, [jgVersion]);

    useEffect(() => {
        if (isWaitingForInput && inputFieldRef.current) inputFieldRef.current.focus();
    }, [isWaitingForInput]);

    useEffect(() => {
        if (terminalBottomRef.current) terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }, [terminalOutput, errors, isWaitingForInput]);

    const handleRun = async () => {
        if (isLockedView) {
            onRequestUnlock();
            return;
        }
        setIsRunning(true);
        setIsFinished(false);
        setShowPython(false);
        setTerminalOutput([]);
        setErrors([]);
        setIsWaitingForInput(false);

        await executeJGAsync(inputCode, jgVersion, {
            onLog: (msg) => setTerminalOutput(prev => [...prev, msg]),
            onError: (msg) => setErrors(prev => [...prev, msg]),
            onInput: (prompt) => new Promise((resolve) => {
                if (prompt) setTerminalOutput(prev => [...prev, prompt]);
                setInputPrompt(prompt);
                setIsWaitingForInput(true);
                inputResolverRef.current = resolve;
            })
        });

        setIsRunning(false);
        setIsFinished(true);
        setIsWaitingForInput(false);
    };

    const submitInput = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (inputResolverRef.current) {
            const val = userInputValue;
            setTerminalOutput(prev => [...prev, `> ${val}`]); 
            inputResolverRef.current(val);
            setUserInputValue("");
            setIsWaitingForInput(false);
            inputResolverRef.current = null;
        }
    };

    const handleConvertToPython = async () => {
        setIsTranslating(true);
        try {
            const py = await transpileJGtoPython(inputCode, jgVersion);
            setPythonCode(py);
            setShowPython(true);
        } catch (e) {
            setPythonCode("# Fatal error in translation service");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleCopyPython = () => {
        navigator.clipboard.writeText(pythonCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    const getVersionNote = () => {
        switch(jgVersion) {
            case 'v1.2': return "Industrial Spec. Static Typing Active.";
            case 'v1.1': return "Interactive Kernel. Standard Input Support.";
            case 'v1.0': return "OOP Draft. Encapsulation & Inheritance enabled.";
            case 'v0.1-remastered': return "Structured Mode. Program blocks required.";
            case 'v0': return "Legacy Baseline. loose script execution.";
        }
    }

    return (
        <div className="lg:h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] h-auto pt-4 pb-4 md:pt-8 md:pb-6 px-3 sm:px-6 lg:px-8 bg-jg-dark flex flex-col relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-jg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

            <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col z-10">
                <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl md:text-2xl font-bold text-white flex flex-wrap items-center gap-2 md:gap-3">
                            JG Playground 
                            <span className={`text-xs md:text-sm px-3 py-1 rounded-full border-2 whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.5)] font-black tracking-tighter ${
                                jgVersion === 'v1.2' ? 'border-pink-500/50 bg-pink-500/10 text-pink-400' :
                                jgVersion === 'v1.1' ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 
                                jgVersion === 'v1.0' ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 
                                'border-gray-500/50 bg-gray-500/10 text-gray-400'
                            }`}>
                                {jgVersion.toUpperCase()}
                            </span>
                        </h2>
                        {!isLockedView && !isPermanent && activeTrialExpiry && (
                            <TrialCountdown expiryDate={activeTrialExpiry} />
                        )}
                    </div>
                    <div className="flex space-x-3 w-full md:w-auto">
                         <button
                            onClick={handleRun}
                            disabled={isRunning || isTranslating || isWaitingForInput || isLockedView}
                            className={`flex-1 md:flex-none justify-center inline-flex items-center px-8 py-3 md:py-2.5 border border-transparent text-sm font-black tracking-widest rounded-xl shadow-2xl text-white transition-all transform active:scale-95 ${
                                isLockedView 
                                ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-green-900/40'
                            }`}
                        >
                            {isLockedView ? <><Lock className="w-4 h-4 mr-2" /> LOCKED</> : <>{isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}{isRunning ? 'RUNNING...' : 'EXECUTE'}</>}
                        </button>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 relative">
                    {isLockedView && (
                        <div className="absolute inset-0 z-50 rounded-lg bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 border border-gray-700/50">
                            <div className="bg-jg-surface p-8 rounded-2xl border border-jg-primary/30 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Clock className="w-8 h-8 text-jg-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Access JG {jgVersion.toUpperCase()}</h3>
                                <p className="text-gray-400 mb-8">Baseline access for this version is currently restricted. Upgrade or activate trial to proceed.</p>
                                <button
                                    onClick={onRequestUnlock}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-jg-primary to-jg-accent hover:from-blue-600 hover:to-violet-600 text-white font-bold rounded-xl shadow-xl shadow-blue-500/25 transition-all transform hover:scale-[1.02]"
                                >
                                    Unlock Baseline Access
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Code Editor */}
                    <div className="flex flex-col bg-jg-surface/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative h-[60vh] lg:h-full group">
                        <div className="px-4 py-2.5 bg-white/5 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-20">
                            <div className="flex items-center space-x-2">
                                <div className="flex gap-1.5 mr-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                </div>
                                <FileCode className="w-4 h-4 text-jg-primary" />
                                <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Source Kernel</span>
                            </div>
                            <button onClick={() => setInputCode(jgVersion === 'v1.2' ? V1_2_EXAMPLE : jgVersion === 'v1.1' ? V1_1_EXAMPLE : jgVersion === 'v1.0' ? V1_EXAMPLE : jgVersion === 'v0.1-remastered' ? V01_EXAMPLE : V0_EXAMPLE)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all active:rotate-180 duration-500">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="relative flex-1 bg-[#0d1117]/80 overflow-hidden">
                            <pre ref={preRef} className="absolute inset-0 w-full h-full p-6 font-mono text-sm md:text-base pointer-events-none whitespace-pre-wrap break-words overflow-hidden leading-relaxed opacity-90">
                                {highlightJG(inputCode, jgVersion)}
                            </pre>
                            <textarea ref={textareaRef} value={inputCode} onChange={(e) => {setInputCode(e.target.value); setIsFinished(false);}} onScroll={handleScroll} disabled={isLockedView} className="absolute inset-0 w-full h-full p-6 bg-transparent text-transparent caret-jg-primary font-mono text-sm md:text-base resize-none focus:outline-none whitespace-pre-wrap break-words overflow-auto code-scroll leading-relaxed z-10 disabled:cursor-not-allowed" spellCheck={false} placeholder="// Entry point..." />
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="flex flex-col gap-4 h-full min-h-0">
                        <div className="flex flex-col rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-black h-[50vh] lg:h-auto lg:flex-1 min-h-0">
                            <div className="px-4 py-2.5 bg-[#1e1e1e]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center space-x-2">
                                    <TerminalIcon className="w-4 h-4 text-jg-accent" />
                                    <span className="text-xs font-mono font-bold text-gray-400 tracking-widest uppercase">Kernel Monitor</span>
                                </div>
                                {showPython && <button onClick={() => setShowPython(false)} className="text-xs text-blue-400 hover:text-blue-300 font-bold hover:underline underline-offset-4 transition-all">TERMINAL</button>}
                            </div>
                            <div className="relative flex-1 bg-black/95 p-6 font-mono text-xs md:text-sm overflow-auto code-scroll flex flex-col scroll-smooth">
                                {showPython ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
                                            <span className="text-emerald-400 font-bold flex items-center text-xs tracking-widest uppercase"><Sparkles className="w-4 h-4 mr-2" />Python Export</span>
                                            <button onClick={handleCopyPython} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all border border-white/5">{copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}<span>{copied ? 'COPIED' : 'COPY'}</span></button>
                                        </div>
                                        <pre className="text-blue-100/80 whitespace-pre-wrap leading-relaxed">{pythonCode}</pre>
                                    </div>
                                ) : (
                                    <div className="space-y-2 pb-4">
                                        <div className="text-gray-600 mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            JG Core Runtime [{jgVersion}] initialized...
                                        </div>
                                        {errors.map((err, idx) => (
                                            <div key={`err-${idx}`} className="text-red-400 whitespace-pre-wrap border-l-4 border-red-500/50 pl-4 py-3 mb-4 bg-red-500/5 rounded-r-xl animate-in slide-in-from-right-4">
                                                <div className="font-bold text-red-500 mb-1 flex items-center gap-2 uppercase text-[10px] tracking-widest"><AlertCircle className="w-3 h-3" /> Runtime Error</div>
                                                {err}
                                            </div>
                                        ))}
                                        {terminalOutput.map((log, idx) => (
                                            <div key={`log-${idx}`} className="font-medium font-mono animate-in slide-in-from-left-2 duration-150 break-words leading-relaxed py-0.5">
                                                {log.startsWith('>') ? (
                                                    <span className="text-gray-500 ml-4 flex items-center gap-2 italic">
                                                        <ArrowRight className="w-3 h-3" /> {log.substring(1).trim()}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-200">
                                                        <span className="text-jg-primary/50 mr-3 font-black">λ</span>
                                                        {log}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {isWaitingForInput && (
                                            <div className="flex items-center gap-3 mt-4 px-3 py-2 bg-jg-accent/10 border border-jg-accent/20 rounded-lg animate-pulse">
                                                <Keyboard className="w-4 h-4 text-jg-accent" />
                                                <span className="text-jg-accent font-bold text-[10px] uppercase tracking-[0.2em]">Input Required...</span>
                                            </div>
                                        )}
                                        {isFinished && errors.length === 0 && (
                                            <div className="mt-8 pt-6 border-t border-white/5">
                                                <button onClick={handleConvertToPython} disabled={isTranslating} className="group flex items-center text-sm font-bold text-gray-500 hover:text-emerald-400 transition-all disabled:opacity-50">
                                                    {isTranslating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                                    <span className="tracking-widest uppercase text-[10px]">Transpile to Python</span>
                                                    {!isTranslating && <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />}
                                                </button>
                                            </div>
                                        )}
                                        <div ref={terminalBottomRef} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Input Field with Premium Glow */}
                        <form onSubmit={submitInput} className={`flex flex-col rounded-2xl overflow-hidden border-2 shadow-[0_0_30px_rgba(139,92,246,0.15)] bg-black/40 backdrop-blur-xl transition-all duration-500 flex-shrink-0 relative ${isWaitingForInput ? 'h-auto opacity-100 translate-y-0 border-jg-accent/50' : 'h-0 opacity-0 translate-y-4 overflow-hidden border-transparent'}`}>
                            <div className="absolute inset-0 bg-jg-accent/5 pointer-events-none"></div>
                            <div className="px-4 py-2.5 bg-jg-accent/10 border-b border-jg-accent/20 flex items-center justify-between relative z-10">
                                <div className="flex items-center space-x-2">
                                    <Keyboard className="w-4 h-4 text-jg-accent animate-bounce" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-jg-accent">Standard Input</span>
                                </div>
                                <span className="text-[9px] text-jg-accent/60 font-mono">Press ENTER to commit</span>
                            </div>
                            <div className="p-4 flex gap-4 items-center bg-transparent relative z-10">
                                <span className="text-jg-accent font-mono text-xl animate-pulse">❯</span>
                                <input 
                                    ref={inputFieldRef} 
                                    type="text" 
                                    value={userInputValue} 
                                    onChange={(e) => setUserInputValue(e.target.value)} 
                                    className="flex-1 bg-transparent font-mono text-sm text-white focus:outline-none placeholder-jg-accent/20" 
                                    placeholder={inputPrompt ? `Input prompt: ${inputPrompt}` : "Awaiting input..."} 
                                    autoComplete="off" 
                                />
                                <button type="submit" className="p-2.5 bg-jg-accent hover:bg-violet-400 text-white rounded-xl transition-all shadow-lg shadow-jg-accent/30 active:scale-90">
                                    <SendHorizontal className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="mt-4 text-center flex-shrink-0">
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] opacity-50">{getVersionNote()}</p>
                </div>
            </div>
        </div>
    );
};
