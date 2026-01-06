import React, { useState, useEffect, useRef } from 'react';
import { Play, Copy, RefreshCw, Check, Terminal as TerminalIcon, ArrowRight, FileCode, Loader2, Keyboard, SendHorizontal, Lock, Zap, Clock, Timer } from 'lucide-react';
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
            case 'v1.2': return "Static Typing. Use 'int', 'decimal', 'bool'. No conversions.";
            case 'v1.1': return "Interactive Mode. Use 'In.ask' for user input.";
            case 'v1.0': return "OOP Support. Use 'new' for objects.";
            case 'v0.1-remastered': return "Strict mode. 'call' required.";
            case 'v0': return "Legacy script mode.";
        }
    }

    return (
        <div className="lg:h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] h-auto pt-4 pb-4 md:pt-8 md:pb-6 px-3 sm:px-6 lg:px-8 bg-jg-dark flex flex-col relative">
            <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col">
                <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl md:text-2xl font-bold text-white flex flex-wrap items-center gap-2 md:gap-3">
                            JG Playground 
                            <span className={`text-xs md:text-sm px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                jgVersion === 'v1.2' ? 'border-pink-500/30 bg-pink-500/10 text-pink-400' :
                                jgVersion === 'v1.1' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 
                                jgVersion === 'v1.0' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 
                                'border-gray-500/30 bg-gray-500/10 text-gray-400'
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
                            className={`flex-1 md:flex-none justify-center inline-flex items-center px-6 py-2.5 md:py-2 border border-transparent text-sm font-bold tracking-wide rounded shadow-lg text-white transition-all transform active:scale-95 ${
                                isLockedView 
                                ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                                : 'bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                            }`}
                        >
                            {isLockedView ? <><Lock className="w-4 h-4 mr-2" /> LOCKED</> : <>{isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}{isRunning ? 'RUNNING...' : 'RUN CODE'}</>}
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
                                <p className="text-gray-400 mb-8">Access expired or locked. Start a free trial or purchase permanent access to continue.</p>
                                <button
                                    onClick={onRequestUnlock}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-jg-primary to-jg-accent hover:from-blue-600 hover:to-violet-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02]"
                                >
                                    Unlock Options
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col bg-jg-surface rounded-lg overflow-hidden border border-gray-700 shadow-2xl relative h-[60vh] lg:h-full">
                        <div className="px-4 py-2 bg-gray-800/80 backdrop-blur border-b border-gray-700 flex items-center justify-between z-20">
                            <div className="flex items-center space-x-2">
                                <FileCode className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-mono text-gray-300">source.jg</span>
                            </div>
                            <button onClick={() => setInputCode(jgVersion === 'v1.2' ? V1_2_EXAMPLE : jgVersion === 'v1.1' ? V1_1_EXAMPLE : jgVersion === 'v1.0' ? V1_EXAMPLE : jgVersion === 'v0.1-remastered' ? V01_EXAMPLE : V0_EXAMPLE)} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="relative flex-1 bg-[#0d1117] overflow-hidden">
                            <pre ref={preRef} className="absolute inset-0 w-full h-full p-4 font-mono text-sm md:text-base pointer-events-none whitespace-pre-wrap break-words overflow-hidden leading-relaxed opacity-80">
                                {highlightJG(inputCode, jgVersion)}
                            </pre>
                            <textarea ref={textareaRef} value={inputCode} onChange={(e) => {setInputCode(e.target.value); setIsFinished(false);}} onScroll={handleScroll} disabled={isLockedView} className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white font-mono text-sm md:text-base resize-none focus:outline-none whitespace-pre-wrap break-words overflow-auto code-scroll leading-relaxed z-10 disabled:cursor-not-allowed" spellCheck={false} placeholder="// Start typing your JulyGod code here..." />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 h-full min-h-0">
                        <div className="flex flex-col rounded-lg overflow-hidden border border-gray-700 shadow-2xl bg-black h-[50vh] lg:h-auto lg:flex-1 min-h-0">
                            <div className="px-4 py-2 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center space-x-2">
                                    <TerminalIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-mono font-bold text-gray-300">TERMINAL</span>
                                </div>
                                {showPython && <button onClick={() => setShowPython(false)} className="text-xs text-blue-400 hover:text-blue-300 underline">Back to Terminal</button>}
                            </div>
                            <div className="relative flex-1 bg-black p-4 font-mono text-xs md:text-sm overflow-auto code-scroll flex flex-col">
                                {showPython ? (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                                            <span className="text-green-500 font-bold flex items-center"><FileCode className="w-4 h-4 mr-2" />Python Source</span>
                                            <button onClick={handleCopyPython} className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800 text-gray-400 text-xs font-medium transition-colors">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}<span>{copied ? 'Copied' : 'Copy'}</span></button>
                                        </div>
                                        <pre className="text-blue-100 whitespace-pre-wrap">{pythonCode}</pre>
                                    </div>
                                ) : (
                                    <div className="space-y-1 pb-4">
                                        <div className="text-gray-500 mb-2 border-b border-gray-800 pb-2">JulyGod Environment [{jgVersion}] initialized...</div>
                                        {errors.map((err, idx) => <div key={`err-${idx}`} className="text-red-400 whitespace-pre-wrap border-l-2 border-red-900 pl-4 py-2 mb-2 bg-red-900/10 rounded-r">{err}</div>)}
                                        {terminalOutput.map((log, idx) => <div key={`log-${idx}`} className="font-medium font-mono animate-in slide-in-from-left-2 duration-100 break-words">{log.startsWith('>') ? <span className="text-gray-500 ml-2">{log}</span> : <span className="text-green-400"><span className="text-gray-600 mr-2">$</span>{log}</span>}</div>)}
                                        {isWaitingForInput && <div className="flex items-center gap-2 mt-2"><div className="w-2 h-4 bg-purple-500 animate-pulse"></div><span className="text-gray-500 italic text-xs">Waiting for user input...</span></div>}
                                        {isFinished && errors.length === 0 && (
                                            <div className="mt-6 pt-4 border-t border-gray-800">
                                                <button onClick={handleConvertToPython} disabled={isTranslating} className="group flex items-center text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isTranslating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <span className="underline decoration-gray-600 group-hover:decoration-white underline-offset-4">Convert logic to Python</span>}{!isTranslating && <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />}</button>
                                            </div>
                                        )}
                                        <div ref={terminalBottomRef} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <form onSubmit={submitInput} className={`flex flex-col rounded-lg overflow-hidden border border-purple-500/50 shadow-2xl bg-black transition-all duration-300 flex-shrink-0 ${isWaitingForInput ? 'h-auto opacity-100 translate-y-0' : 'h-0 opacity-0 translate-y-4 overflow-hidden border-0'}`}>
                            <div className="px-4 py-2 bg-purple-900/20 border-b border-purple-500/30 flex items-center justify-between">
                                <div className="flex items-center space-x-2"><Keyboard className="w-4 h-4 text-purple-400 animate-pulse" /><span className="text-xs font-mono font-bold text-gray-300">USER INPUT REQUIRED</span></div>
                                <span className="text-[10px] text-gray-500">Press Enter to submit</span>
                            </div>
                            <div className="p-3 flex gap-2 items-center bg-black">
                                <span className="text-purple-400 font-mono text-lg">{'>'}</span>
                                <input ref={inputFieldRef} type="text" value={userInputValue} onChange={(e) => setUserInputValue(e.target.value)} className="flex-1 bg-transparent font-mono text-sm text-white focus:outline-none placeholder-gray-700" placeholder={inputPrompt ? `Answer to: ${inputPrompt}` : "Type input here..."} autoComplete="off" />
                                <button type="submit" className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"><SendHorizontal className="w-4 h-4" /></button>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="mt-2 text-center flex-shrink-0">
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">{getVersionNote()}</p>
                </div>
            </div>
        </div>
    );
};