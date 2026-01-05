import React, { useState, useEffect, useRef } from 'react';
import { Play, Copy, RefreshCw, Check, Terminal as TerminalIcon, ArrowRight, FileCode, Loader2, Keyboard, SendHorizontal } from 'lucide-react';
import { executeJGAsync, transpileJGtoPython, JGVersion } from '../services/jgTranspiler';
import { V0_EXAMPLE, V01_EXAMPLE, V1_EXAMPLE, V1_1_EXAMPLE, V1_2_EXAMPLE } from '../constants';

interface PlaygroundProps {
    jgVersion: JGVersion;
    isUnlocked: boolean; // For V1.0/V0 checking
    onRequestUnlock: () => void;
}

// Enhanced highlighter that supports version-specific keywords
const highlightJG = (code: string, version: JGVersion) => {
    // Pattern: Strings OR Comments OR Numbers OR Brackets OR Whitespace OR Identifiers
    const tokens = code.split(/(".*?"|\/\/.*$|\b\d+\b|[\{\}\(\)\[\]]|[ \t\n]+)/gm);

    return tokens.map((token, i) => {
        if (!token) return null;
        
        // Strings
        if (token.startsWith('"')) return <span key={i} className="text-green-400">{token}</span>;
        
        // Comments
        if (token.startsWith('//')) return <span key={i} className="text-gray-500 italic">{token}</span>;
        
        // Numbers
        if (/^\d+$/.test(token)) return <span key={i} className="text-orange-400">{token}</span>;

        // --- Version Specific Keywords ---
        const commonKeywords = [
            'create', 'function', 'say', 'print', 'log', 
            'when', 'otherwise', 'end', 'takes', 'give', 'final',
            'and', 'or', 'greater', 'less', 'equals', 'true', 'false'
        ];

        const v01Keywords = [
             'call', 'repeat', 'times', 'list', 'map', 'contains', 'unique', 'has', 'as', 'get', 
             'use', 'library', 'do', 'until', 'stop', 'skip', 'start', 'program'
        ];

        const v1Keywords = [
            'class', 'is', 'a', 'extends', 'new', 'public', 'private', 
            'override', 'set', 'to', 'init'
        ];

        const v11Keywords = [
            'import', 'Input'
        ];

        const v12Keywords = [
            'int', 'decimal', 'long', 'bool', 'convert', 'True', 'False'
        ];

        let activeKeywords: string[] = [...commonKeywords];
        
        if (version !== 'v0') {
            activeKeywords = [...activeKeywords, ...v01Keywords];
        }
        if (version === 'v1.0' || version === 'v1.1' || version === 'v1.2') {
            activeKeywords = [...activeKeywords, ...v1Keywords];
        }
        if (version === 'v1.1' || version === 'v1.2') {
            activeKeywords = [...activeKeywords, ...v11Keywords];
        }
        if (version === 'v1.2') {
            activeKeywords = [...activeKeywords, ...v12Keywords];
        }
        
        const trimmed = token.trim();
        if (activeKeywords.includes(trimmed)) {
            if (v12Keywords.includes(trimmed)) {
                 return <span key={i} className="text-pink-400 font-bold">{token}</span>;
            }
            if (v1Keywords.includes(trimmed) || v11Keywords.includes(trimmed)) {
                return <span key={i} className="text-purple-400 font-bold">{token}</span>;
            }
            if (['when', 'otherwise', 'end', 'repeat', 'stop', 'skip'].includes(trimmed)) {
                return <span key={i} className="text-jg-accent font-bold">{token}</span>;
            }
            return <span key={i} className="text-blue-400 font-bold">{token}</span>;
        }
        
        return <span key={i} className="text-gray-200">{token}</span>;
    });
};

export const Playground: React.FC<PlaygroundProps> = ({ jgVersion, isUnlocked, onRequestUnlock }) => {
    const [inputCode, setInputCode] = useState(V1_2_EXAMPLE);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [showPython, setShowPython] = useState(false);
    const [pythonCode, setPythonCode] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [copied, setCopied] = useState(false);

    // Interactive Input State
    const [isWaitingForInput, setIsWaitingForInput] = useState(false);
    const [inputPrompt, setInputPrompt] = useState("");
    const [userInputValue, setUserInputValue] = useState("");
    const inputResolverRef = useRef<((value: string) => void) | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const inputFieldRef = useRef<HTMLInputElement>(null);
    const terminalBottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (jgVersion === 'v0') setInputCode(V0_EXAMPLE);
        else if (jgVersion === 'v0.1-remastered') setInputCode(V01_EXAMPLE);
        else if (jgVersion === 'v1.0') setInputCode(V1_EXAMPLE);
        else if (jgVersion === 'v1.1') setInputCode(V1_1_EXAMPLE);
        else setInputCode(V1_2_EXAMPLE);
    }, [jgVersion]);

    useEffect(() => {
        if (isWaitingForInput && inputFieldRef.current) {
            inputFieldRef.current.focus();
        }
    }, [isWaitingForInput]);

    useEffect(() => {
        if (terminalBottomRef.current) {
            terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [terminalOutput, errors, isWaitingForInput]);

    const checkDailyLimit = () => {
        if (jgVersion !== 'v1.0' || isUnlocked) return true; // Only V1.0 has limits if locked

        const today = new Date().toDateString();
        const stored = localStorage.getItem('jg_v1_limit');
        let data = stored ? JSON.parse(stored) : { date: today, count: 0 };

        if (data.date !== today) {
            data = { date: today, count: 0 };
        }

        if (data.count >= 3) {
            setErrors(["⚠️ Free Limit Reached for V1.0 (3/3). Please unlock full access."]);
            onRequestUnlock();
            return false;
        }

        data.count += 1;
        localStorage.setItem('jg_v1_limit', JSON.stringify(data));
        return true;
    };

    const handleRun = async () => {
        if (!checkDailyLimit()) return;

        setIsRunning(true);
        setIsFinished(false);
        setShowPython(false);
        setTerminalOutput([]);
        setErrors([]);
        setIsWaitingForInput(false);
        inputResolverRef.current = null;

        await executeJGAsync(inputCode, jgVersion, {
            onLog: (msg) => {
                setTerminalOutput(prev => [...prev, msg]);
            },
            onError: (msg) => {
                setErrors(prev => [...prev, msg]);
            },
            onInput: (prompt) => {
                return new Promise((resolve) => {
                    if (prompt) {
                        setTerminalOutput(prev => [...prev, prompt]);
                    }
                    setInputPrompt(prompt);
                    setIsWaitingForInput(true);
                    inputResolverRef.current = resolve;
                });
            }
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
            case 'v1.2': return "Strict Typing & Types. Use 'int', 'decimal', 'bool'. No implicit conversions.";
            case 'v1.1': return "Interactive Mode. Use 'In.ask' to pause execution and request user input via the UI.";
            case 'v1.0': return "Full OOP Support. Use 'new' to create objects and 'call obj method' for interactions.";
            case 'v0.1-remastered': return "Strict mode. Highlighting active. 'call' required. Parentheses illegal.";
            case 'v0': return "Legacy script mode.";
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-jg-dark">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white">JG Playground 
                            <span className={`text-lg ml-2 ${
                                jgVersion === 'v1.2' ? 'text-pink-500' :
                                jgVersion === 'v1.1' ? 'text-indigo-400' : 
                                jgVersion === 'v1.0' ? 'text-blue-400' : 'text-gray-400'
                            }`}>
                                {jgVersion === 'v1.2' ? 'V1.2 FINAL' : (jgVersion === 'v1.1' ? 'V1.1 INTERACTIVE' : (jgVersion === 'v1.0' ? 'V1.0 STABLE' : (jgVersion === 'v0.1-remastered' ? 'V0.1 REMASTERED' : 'V0 LEGACY')))}
                            </span>
                        </h2>
                        <p className="text-jg-muted mt-2">
                            {getVersionNote()}
                        </p>
                    </div>
                    <div className="flex space-x-3">
                         <button
                            onClick={handleRun}
                            disabled={isRunning || isTranslating || isWaitingForInput}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                            {isRunning ? 'Running...' : 'Run Code'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px] lg:h-[700px]">
                    {/* Input Panel with Custom Editor */}
                    <div className="flex flex-col bg-jg-surface rounded-xl overflow-hidden border border-gray-700 shadow-2xl relative">
                        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between z-20 relative">
                            <div className="flex items-center space-x-2">
                                <div className="flex space-x-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                </div>
                                <span className="ml-3 text-xs font-mono text-gray-400">source.jg</span>
                            </div>
                            <button 
                                onClick={() => {
                                     if (jgVersion === 'v1.2') setInputCode(V1_2_EXAMPLE);
                                     else if (jgVersion === 'v1.1') setInputCode(V1_1_EXAMPLE);
                                     else if (jgVersion === 'v1.0') setInputCode(V1_EXAMPLE);
                                     else if (jgVersion === 'v0.1-remastered') setInputCode(V01_EXAMPLE);
                                     else setInputCode(V0_EXAMPLE);
                                }}
                                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                                title="Reset Code"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="relative flex-1 bg-[#1e293b] overflow-hidden">
                            <pre 
                                ref={preRef}
                                className="absolute inset-0 w-full h-full p-4 font-mono text-sm pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
                                aria-hidden="true"
                            >
                                {highlightJG(inputCode, jgVersion)}
                            </pre>
                            
                            <textarea
                                ref={textareaRef}
                                value={inputCode}
                                onChange={(e) => {
                                    setInputCode(e.target.value);
                                    setIsFinished(false);
                                }}
                                onScroll={handleScroll}
                                className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white font-mono text-sm resize-none focus:outline-none whitespace-pre-wrap break-words overflow-auto code-scroll leading-normal z-10"
                                spellCheck={false}
                                placeholder="// Start typing your JulyGod code here..."
                            />
                        </div>
                    </div>

                    {/* Right Column: Output & Input */}
                    <div className="flex flex-col gap-4 h-full">
                        {/* Output / Terminal Panel */}
                        <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-gray-700 shadow-2xl bg-black min-h-0">
                            <div className="px-4 py-3 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <TerminalIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-mono font-bold text-gray-300">
                                        TERMINAL
                                    </span>
                                </div>
                                {showPython && (
                                    <button
                                        onClick={() => setShowPython(false)}
                                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                                    >
                                        Back to Terminal
                                    </button>
                                )}
                            </div>
                            
                            <div className="relative flex-1 bg-black p-4 font-mono text-sm overflow-auto code-scroll flex flex-col">
                                {showPython ? (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                                            <span className="text-green-500 font-bold flex items-center">
                                                <FileCode className="w-4 h-4 mr-2" />
                                                Python Source
                                            </span>
                                            <button
                                                onClick={handleCopyPython}
                                                className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800 text-gray-400 text-xs font-medium transition-colors"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>{copied ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </div>
                                        <pre className="text-blue-100 whitespace-pre-wrap">{pythonCode}</pre>
                                    </div>
                                ) : (
                                    <div className="space-y-1 pb-4">
                                        <div className="text-gray-500 mb-2">
                                            JulyGod {jgVersion} Interactive Shell
                                        </div>
                                        
                                        {!isRunning && !isFinished && !errors.length && (
                                            <div className="text-gray-600 italic">Waiting for input... Click 'Run Code' to execute.</div>
                                        )}

                                        {errors.map((err, idx) => (
                                            <div key={`err-${idx}`} className="text-red-400 whitespace-pre-wrap border-l-2 border-red-900 pl-4 py-2 mb-2 bg-red-900/10 rounded-r">
                                                {err}
                                            </div>
                                        ))}

                                        {terminalOutput.map((log, idx) => (
                                            <div key={`log-${idx}`} className="font-medium font-mono animate-in slide-in-from-left-2 duration-100">
                                                {log.startsWith('>') ? (
                                                    <span className="text-gray-500 ml-2">{log}</span>
                                                ) : (
                                                    <span className="text-green-400"><span className="text-gray-600 mr-2">$</span>{log}</span>
                                                )}
                                            </div>
                                        ))}

                                        {isWaitingForInput && (
                                             <div className="flex items-center gap-2 mt-2">
                                                <div className="w-2 h-4 bg-purple-500 animate-pulse"></div>
                                                <span className="text-gray-500 italic text-xs">Waiting for user input...</span>
                                             </div>
                                        )}

                                        {isFinished && errors.length === 0 && (
                                            <div className="mt-6 pt-4 border-t border-gray-800">
                                                <div className="text-blue-400 text-xs mb-2">Execution finished successfully.</div>
                                                <button
                                                    onClick={handleConvertToPython}
                                                    disabled={isTranslating}
                                                    className="group flex items-center text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isTranslating ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <span className="underline decoration-gray-600 group-hover:decoration-white underline-offset-4">
                                                            Convert logic to Python
                                                        </span>
                                                    )}
                                                    {!isTranslating && <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />}
                                                </button>
                                            </div>
                                        )}
                                        {/* Invisible div for scrolling */}
                                        <div ref={terminalBottomRef} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Interactive Input Prompt (Visible only when waiting) */}
                        <form 
                            onSubmit={submitInput}
                            className={`flex flex-col rounded-xl overflow-hidden border border-purple-500/50 shadow-2xl bg-black transition-all duration-300 ${isWaitingForInput ? 'h-auto opacity-100 translate-y-0' : 'h-0 opacity-0 translate-y-4 overflow-hidden border-0'}`}
                        >
                            <div className="px-4 py-2 bg-purple-900/20 border-b border-purple-500/30 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Keyboard className="w-4 h-4 text-purple-400 animate-pulse" />
                                    <span className="text-xs font-mono font-bold text-gray-300">
                                        USER INPUT REQUIRED
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500">Press Enter to submit</span>
                            </div>
                            <div className="p-3 flex gap-2 items-center bg-black">
                                <span className="text-purple-400 font-mono text-lg">{'>'}</span>
                                <input
                                    ref={inputFieldRef}
                                    type="text"
                                    value={userInputValue}
                                    onChange={(e) => setUserInputValue(e.target.value)}
                                    className="flex-1 bg-transparent font-mono text-sm text-white focus:outline-none placeholder-gray-700"
                                    placeholder={inputPrompt ? `Answer to: ${inputPrompt}` : "Type input here..."}
                                    autoComplete="off"
                                />
                                <button 
                                    type="submit"
                                    className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                                >
                                    <SendHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                 <div className="mt-8 p-4 rounded-lg bg-jg-surface/50 border border-gray-700 text-sm text-gray-400">
                    <span className="text-jg-primary font-bold">Current Version: {jgVersion === 'v1.2' ? 'V1.2 Final' : (jgVersion === 'v1.1' ? 'V1.1 Interactive' : (jgVersion === 'v1.0' ? 'V1.0 Stable' : (jgVersion === 'v0.1-remastered' ? 'V0.1 Remastered' : 'V0')))}</span>
                    <span className="mx-2 text-gray-600">|</span>
                    {getVersionNote()}
                </div>
            </div>
        </div>
    );
};