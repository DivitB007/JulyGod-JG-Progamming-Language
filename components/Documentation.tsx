import React from 'react';
import { JGVersion } from '../App';
import { Book, Code, AlertTriangle, Lightbulb, Terminal, Layers } from 'lucide-react';

interface DocProps {
    jgVersion: JGVersion;
}

const Section: React.FC<{ title: string; icon?: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-2xl font-bold text-white mb-6 border-l-4 border-jg-primary pl-4 flex items-center gap-3">
            {Icon && <Icon className="w-6 h-6 text-jg-primary" />}
            {title}
        </h3>
        <div className="text-gray-300 space-y-6 leading-relaxed text-lg">
            {children}
        </div>
    </div>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-8 mb-6 p-6 bg-jg-surface/30 rounded-xl border border-gray-800">
        <h4 className="text-xl font-semibold text-jg-accent mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-jg-accent mr-3"></span>
            {title}
        </h4>
        <div className="text-gray-400 space-y-3">
            {children}
        </div>
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
    
    // Helper to determine render level
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

    // --- V0 CONTENT ---
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

                <SubSection title="Recursion (No Loops)">
                    <p>V0 does not have native <code>repeat</code> loops. Iteration must be done via recursion.</p>
                    <CodeBlock label="Recursion Example" note="Loops were added in V0.1">{`create function count_down takes n
    say n
    
    when n greater 0
        // Recursive call with parentheses
        count_down(n - 1) 
    end
end

count_down(5)`}</CodeBlock>
                </SubSection>
            </Section>
        </>
    );

    // --- V0.1 CONTENT ---
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
say user get "name"  // Output: Divit
say scores get 0     // Output: 95`}</CodeBlock>
                </SubSection>

                <SubSection title="Native Loops">
                    <p>Recursion is no longer necessary for basic iteration.</p>
                    <CodeBlock label="Loops">{`repeat 5 times
    say "Looping..."
end`}</CodeBlock>
                </SubSection>
            </Section>
        </>
    );

    // --- V1.0 CONTENT ---
    const renderV1Docs = () => (
        <>
            <Section title="V1.0: Object Oriented Architecture" icon={Layers}>
                <p>
                    <strong>Version 1.0 Stable</strong> transforms JG into a fully Object-Oriented language. 
                    It introduces Classes, Encapsulation (Public/Private), and Instantiation, making it suitable for complex system design.
                </p>
            </Section>

            <Section title="Class Syntax" icon={Code}>
                <SubSection title="Defining Classes">
                    <p>
                        Classes are defined using <code>Name is a class</code>. 
                        Properties must be explicitly marked as <code>public</code> or <code>private</code>.
                    </p>
                    <CodeBlock label="Class Structure">{`BankAccount is a class
    private balance
    public owner

    // Constructor (called on 'new')
    create function init takes owner_name and start_amount
        owner = owner_name
        balance = start_amount
    end

    create function deposit takes amount
        balance = balance + amount
        say "Deposited: " + amount
    end
end`}</CodeBlock>
                </SubSection>

                <SubSection title="Instantiation & Usage">
                    <p>Use the <code>new</code> keyword to create objects. Access properties with <code>get</code> and modify with <code>set</code>.</p>
                    <CodeBlock label="Objects in Action">{`start program
    // Create Object
    my_account = new BankAccount takes "Divit" and 500
    
    // Call Method
    call my_account deposit takes 100
    
    // Read Public Property
    say "Owner: " + my_account get owner
    
    // Private Access Error
    // say my_account get balance  <-- This would fail!
end program`}</CodeBlock>
                </SubSection>
            </Section>
        </>
    );

    // --- V1.1 CONTENT ---
    const renderV11Docs = () => (
        <>
            <Section title="V1.1: Interactive IO" icon={Terminal}>
                <p>
                    <strong>Version 1.1</strong> breaks the static nature of previous versions by introducing the <code>Input</code> library.
                    This allows programs to pause execution and accept user data at runtime.
                </p>
            </Section>

            <Section title="The Input Library" icon={Book}>
                <SubSection title="Importing & Usage">
                    <p>Libraries must be imported explicitly at the top of the file.</p>
                    <CodeBlock label="Imports">{`import library Input as In

start program
    say "System initialized."
    
    // Pause for text input
    name = In.ask "Enter your username:"
    
    // Pause for numeric input (validates automatically)
    age = In.ask number "Enter your age:"
    
    say "User " + name + " registered."
end program`}</CodeBlock>
                </SubSection>

                <SubSection title="Validation">
                    <p>The <code>ask number</code> command automatically ensures the user enters a valid number. If they enter text, the system throws a Type Error immediately.</p>
                </SubSection>
            </Section>
        </>
    );

    // --- V1.2 CONTENT ---
    const renderV12Docs = () => (
        <>
            <Section title="V1.2: Industrial Grade Strictness" icon={AlertTriangle}>
                <p>
                    <strong>Version 1.2 Final</strong> is the most rigorous version of JG. It introduces <strong>Static Typing</strong> primitives (`int`, `decimal`, `bool`) 
                    and strict Boolean logic (`True`/`False`). It is designed for mission-critical software where type errors must be caught early.
                </p>
            </Section>

            <Section title="Type System" icon={Code}>
                <SubSection title="Primitive Types">
                    <p>Variables can now be explicitly typed. The compiler enforces these types during assignment.</p>
                    <CodeBlock label="Explicit Typing">{`start program
    // Integer: Whole numbers only
    int users = 100
    
    // Decimal: Floating point numbers
    decimal price = 49.99
    
    // Boolean: Strict PascalCase
    bool is_active = True
    
    // Dynamic: Still supported if type omitted
    any_value = "Hello"
end program`}</CodeBlock>
                </SubSection>

                <SubSection title="Type Conversion">
                    <p>Implicit casting is banned. You must use the <code>convert</code> syntax to transform data types.</p>
                    <CodeBlock label="Casting" note="Prevents data loss accidents">{`start program
    decimal raw_score = 95.7
    
    // Explicitly cast to int (floors value)
    int final_score = convert raw_score to int
    
    say final_score  // Output: 95
end program`}</CodeBlock>
                </SubSection>

                 <SubSection title="Strict Booleans">
                    <p>In V1.2, <code>true</code> and <code>false</code> (lowercase) are illegal. You must use <code>True</code> and <code>False</code>.</p>
                     <CodeBlock label="Boolean Logic">{`bool ready = True

when ready equals True
    say "Go!"
end`}</CodeBlock>
                </SubSection>
            </Section>
        </>
    );

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-jg-dark animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto">
                {/* Dynamic Header */}
                <div className="mb-16 text-center">
                    <h2 className="text-5xl font-extrabold text-white mb-6 tracking-tight">Language Specification</h2>
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

                {/* Cumulative Rendering logic */}
                <div className="space-y-12">
                    {currentRank >= 0 && renderV0Docs()}
                    {currentRank >= 1 && renderV01Docs()}
                    {currentRank >= 2 && renderV1Docs()}
                    {currentRank >= 3 && renderV11Docs()}
                    {currentRank >= 4 && renderV12Docs()}
                </div>

                {/* Footer Note */}
                <div className="mt-20 border-t border-gray-800 pt-8 text-center text-gray-500">
                    <p className="flex items-center justify-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Tip: Documentation is cumulative. Higher versions include features from previous versions.
                    </p>
                </div>
            </div>
        </div>
    );
};