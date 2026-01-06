
import React from 'react';
import { JGVersion } from '../App';
import { Book, Code, AlertTriangle, Lightbulb, Terminal, Layers, ShieldCheck, FileText, Bookmark } from 'lucide-react';

interface DocProps {
    jgVersion: JGVersion;
}

const Section: React.FC<{ title: string; icon?: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        <h3 className="text-2xl font-bold text-white mb-6 border-l-4 border-jg-primary pl-4 flex items-center gap-3">
            {Icon && <Icon className="w-6 h-6 text-jg-primary" />}
            {title}
        </h3>
        <div className="text-gray-300 space-y-6 leading-relaxed text-lg">
            {children}
        </div>
    </div>
);

// Added note?: string to SubSection props to fix the error on line 95
const SubSection: React.FC<{ title: string; children: React.ReactNode; note?: string }> = ({ title, children, note }) => (
    <div className="mt-8 mb-6 p-6 bg-jg-surface/30 rounded-xl border border-gray-800 backdrop-blur-sm">
        <h4 className="text-xl font-semibold text-jg-accent mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-jg-accent mr-3 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span>
            {title}
        </h4>
        <div className="text-gray-400 space-y-3">
            {children}
        </div>
        {note && <div className="mt-4 px-4 py-2 bg-jg-accent/10 text-xs text-jg-accent border-l-2 border-jg-accent italic">💡 {note}</div>}
    </div>
);

const CodeBlock: React.FC<{ children: string; label?: string; note?: string }> = ({ children, label, note }) => (
    <div className="my-6 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117] shadow-lg group hover:border-jg-primary/50 transition-colors">
        <div className="flex justify-between items-center bg-gray-800/80 px-4 py-2 border-b border-gray-700">
             {label && <span className="text-xs text-gray-300 font-mono uppercase tracking-wider font-bold">{label}</span>}
             <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
             </div>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono text-blue-100 leading-relaxed custom-scrollbar">
            {children}
        </pre>
        {note && <div className="px-4 py-2 bg-blue-900/10 text-xs text-blue-300 border-t border-gray-800 italic">💡 {note}</div>}
    </div>
);

export const Documentation: React.FC<DocProps> = ({ jgVersion }) => {
    
    const getVersionRank = (v: JGVersion): number => {
        switch(v) {
            case 'v0': return 0;
            case 'v0.1-remastered': return 1;
            case 'v1.0': return 2;
            case 'v1.1': return 3;
            case 'v1.2': return 4;
            default: return 0;
        }
    };

    const currentRank = getVersionRank(jgVersion);

    const renderV0Docs = () => (
        <>
            <Section title="V0: The Legacy Script" icon={Terminal}>
                <p>
                    <strong>Version 0</strong> represents the genesis of JulyGod. It is a loose, script-oriented language designed for quick calculations and simple logic. 
                    Unlike later versions, it does not require a program entry point and uses a more C-like function call syntax (parentheses).
                </p>
                <SubSection title="Core Philosophy">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Global Scope:</strong> Variables declared outside functions are global.</li>
                        <li><strong>Parentheses Allowed:</strong> This is the <em>only</em> version where `func(arg)` is valid syntax.</li>
                        <li><strong>No Main Block:</strong> Code executes linearly from top to bottom.</li>
                    </ul>
                </SubSection>
            </Section>

            <Section title="Syntax Guide" icon={Code}>
                <SubSection title="Variables & Logic">
                    <p>Variables are dynamically typed. Use <code>final</code> for constants.</p>
                    <CodeBlock label="Scripting">{`// Global constant
final PI = 3.14159

// Dynamic variable
radius = 10
area = PI * radius * radius

say "Area is: " + area`}</CodeBlock>
                </SubSection>

                <SubSection title="Function Calls" note="In V0, calls are simple.">
                    <p>Execute logic by name with optional arguments in parentheses.</p>
                    <CodeBlock label="V0 Calls">{`create function check_access takes age
    when age greater_equal 18
        say "Access Granted"
    end
end

check_access(21) // Valid only in V0`}</CodeBlock>
                </SubSection>
            </Section>
        </>
    );

    const renderV01Docs = () => (
        <>
            <Section title="V0.1: The Remastered Standard" icon={Layers}>
                <p>
                    <strong>Version 0.1 Remastered</strong> introduces the strict structural rules that define modern JG. 
                    It eliminates parentheses for function calls, requires a main program block, and introduces collection types.
                </p>
            </Section>

            <Section title="Structural Changes" icon={AlertTriangle}>
                <SubSection title="The Program Block">
                    <p>Code must now live inside <code>start program</code>. Orphaned code is illegal.</p>
                    <CodeBlock label="Structure">{`use library original

start program
    call main
end program

create function main
    say "Hello World"
end`}</CodeBlock>
                </SubSection>

                <SubSection title="The 'call' Keyword">
                    <p>Parentheses <code>()</code> are banned for function calls. You must use <code>call</code> and <code>takes</code>.</p>
                    <CodeBlock label="Function Calls">{`// OLD (V0): add(1, 2)
// NEW (V0.1):
result = call add takes 1 and 2`}</CodeBlock>
                </SubSection>
            </Section>

            <Section title="New Features" icon={Code}>
                <SubSection title="Collections: Lists & Maps">
                    <p>V0.1 adds primitive data structures for handling groups of data.</p>
                    <CodeBlock label="Collections">{`// Lists
final scores = list contains 95 and 80 and 100

// Maps (Key-Value)
final user = map has name as "Divit" and role as "Admin"

// Accessing Data
say user get "name"
say scores get 0`}</CodeBlock>
                </SubSection>
            </Section>
        </>
    );

    const renderV1Docs = () => (
        <>
            <Section title="V1.0: Object Oriented Architecture" icon={Layers}>
                <p>
                    <strong>Version 1.0 Stable</strong> transforms JG into a fully Object-Oriented language. 
                    It introduces Classes, Encapsulation, and Instantiation.
                </p>
            </Section>

            <Section title="Class Syntax" icon={Code}>
                <SubSection title="Defining Classes">
                    <p>Classes are defined using <code>Name is a class</code>. Properties must be marked <code>public</code> or <code>private</code>.</p>
                    <CodeBlock label="Class Structure">{`BankAccount is a class
    private balance
    public owner

    create function init takes owner_name and start_amount
        owner = owner_name
        balance = start_amount
    end
end`}</CodeBlock>
                </SubSection>
            </Section>
        </>
    );

    const renderV11Docs = () => (
        <>
            <Section title="V1.1: Interactive IO" icon={Terminal}>
                <p><strong>Version 1.1</strong> introduces the <code>Input</code> library for runtime data collection.</p>
            </Section>
            <Section title="The Input Library" icon={Book}>
                <CodeBlock label="Imports">{`import library Input as In

start program
    name = In.ask "Enter your username:"
    say "User " + name + " registered."
end program`}</CodeBlock>
            </Section>
        </>
    );

    const renderV12Docs = () => (
        <>
            <Section title="V1.2: Industrial Grade Strictness" icon={AlertTriangle}>
                <p><strong>Version 1.2 Final</strong> introduces <strong>Static Typing</strong> primitives and strict Boolean logic.</p>
            </Section>
            <Section title="Type System" icon={Code}>
                <SubSection title="Primitive Types">
                    <CodeBlock label="Explicit Typing">{`start program
    int users = 100
    decimal price = 49.99
    bool is_active = True
end program`}</CodeBlock>
                </SubSection>
            </Section>
        </>
    );

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-jg-dark animate-in fade-in duration-500 relative overflow-hidden">
            {/* Blueprint Grid Background */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:100px_100px]"></div>
            
            <div className="max-w-5xl mx-auto relative z-10">
                {/* Foundational Specification Badge */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-[0.2em]">
                        <ShieldCheck className="w-3.5 h-3.5" /> Foundational Specification v0.1-Baseline
                    </div>
                </div>

                <div className="mb-16 text-center">
                    <h2 className="text-5xl font-extrabold text-white mb-6 tracking-tight flex items-center justify-center gap-4">
                        <FileText className="w-12 h-12 text-jg-primary" />
                        Language Specification
                    </h2>
                    <div className="inline-flex items-center px-6 py-3 rounded-full bg-jg-surface border border-jg-surfaceHighlight shadow-2xl">
                         <span className={`w-3 h-3 rounded-full mr-3 animate-pulse ${
                             jgVersion === 'v1.2' ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' :
                             jgVersion === 'v1.1' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 
                             jgVersion === 'v1.0' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 
                             jgVersion === 'v0.1-remastered' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-500'
                         }`}></span>
                         <span className="text-lg font-mono text-gray-300">
                             Active Spec: <span className={`font-bold ${
                                 jgVersion === 'v1.2' ? 'text-pink-400' :
                                 jgVersion === 'v1.1' ? 'text-indigo-400' : 
                                 jgVersion === 'v1.0' ? 'text-blue-400' : 
                                 jgVersion === 'v0.1-remastered' ? 'text-green-400' : 'text-gray-400'
                             }`}>{jgVersion.toUpperCase()}</span>
                         </span>
                    </div>
                </div>

                {/* Core Philosophy Section - Interjected for Spec Baseline */}
                <div className="mb-20 p-8 rounded-2xl bg-gradient-to-br from-jg-surface to-jg-dark border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Bookmark className="w-32 h-32 text-jg-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <Lightbulb className="w-6 h-6 text-yellow-400" />
                        Guiding Principles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-400 text-base">
                        <div className="space-y-3">
                            <p><strong>1. Maximum Legibility:</strong> JulyGod is optimized for reading, not just writing. Code should resemble technical documentation.</p>
                            <p><strong>2. Low Cognitive Load:</strong> By removing braces and semicolons, we eliminate common syntax errors that plague beginners and slow down pros.</p>
                        </div>
                        <div className="space-y-3">
                            <p><strong>3. Educational Diagnostics:</strong> Error messages in JG are designed to teach language mechanics, not just report failures.</p>
                            <p><strong>4. Cross-Platform First:</strong> JG targets Python, C++, and Bytecode to ensure logic is portable across the stack.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-12">
                    {currentRank >= 0 && renderV0Docs()}
                    {currentRank >= 1 && renderV01Docs()}
                    {currentRank >= 2 && renderV1Docs()}
                    {currentRank >= 3 && renderV11Docs()}
                    {currentRank >= 4 && renderV12Docs()}
                </div>

                <div className="mt-20 border-t border-gray-800 pt-8 text-center text-gray-500">
                    <p className="flex items-center justify-center gap-2">
                        <Bookmark className="w-4 h-4" />
                        This document serves as the Baseline Specification for JulyGod Development.
                    </p>
                </div>
            </div>
        </div>
    );
};
