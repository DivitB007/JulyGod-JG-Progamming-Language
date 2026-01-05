import React from 'react';
import { JGVersion } from '../App';

interface DocProps {
    jgVersion: JGVersion;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-12">
        <h3 className="text-2xl font-bold text-white mb-6 border-l-4 border-jg-primary pl-4">{title}</h3>
        <div className="text-gray-300 space-y-6 leading-relaxed text-lg">
            {children}
        </div>
    </div>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-8 mb-4">
        <h4 className="text-xl font-semibold text-jg-primary mb-3">{title}</h4>
        <div className="text-gray-400 space-y-3">
            {children}
        </div>
    </div>
);

const CodeBlock: React.FC<{ children: string; label?: string }> = ({ children, label }) => (
    <div className="my-6 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117] shadow-lg">
        {label && <div className="px-4 py-2 bg-gray-800 text-xs text-gray-400 font-mono border-b border-gray-700 uppercase tracking-wider">{label}</div>}
        <pre className="p-4 overflow-x-auto text-sm font-mono text-blue-100 leading-relaxed">
            {children}
        </pre>
    </div>
);

export const Documentation: React.FC<DocProps> = ({ jgVersion }) => {
    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-jg-dark">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-16 text-center">
                    <h2 className="text-5xl font-extrabold text-white mb-6">Language Specification</h2>
                    <div className="inline-flex items-center px-6 py-2 rounded-full bg-jg-surface border border-jg-primary/30">
                         <span className={`w-3 h-3 rounded-full mr-3 ${
                             jgVersion === 'v1.2' ? 'bg-pink-500' :
                             jgVersion === 'v1.1' ? 'bg-purple-500' : 
                             jgVersion === 'v1.0' ? 'bg-blue-500' : 
                             jgVersion === 'v0.1-remastered' ? 'bg-green-500' : 'bg-gray-500'
                         }`}></span>
                         <span className="text-base font-mono text-gray-300">Active Spec: <span className="text-white font-bold">{jgVersion === 'v1.2' ? 'V1.2 FINAL' : (jgVersion === 'v1.1' ? 'V1.1 INTERACTIVE' : (jgVersion === 'v1.0' ? 'V1.0 STABLE' : (jgVersion === 'v0.1-remastered' ? 'V0.1 REMASTERED' : 'V0 LEGACY')))}</span></span>
                    </div>
                </div>

                {/* 1. Philosophy */}
                <Section title="1. Identity & Philosophy">
                    <p>
                        <strong>JulyGod (JG)</strong> is a language built for engineers who value clarity over brevity. 
                        It rejects the notion that code should be cryptic. In JG, if code can be read aloud as an English sentence, it is likely correct.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-400">
                        <li><strong>Keyword-Driven:</strong> No braces <code>{`{}`}</code> or semicolons <code>;</code>. Logic is defined by words.</li>
                        <li><strong>Explicit Behavior:</strong> No magic type coercion. No hidden control flow.</li>
                        <li><strong>Educational Errors:</strong> Errors explain <em>why</em> something failed and suggest <em>how</em> to fix it.</li>
                    </ul>
                </Section>

                {/* V1.2 Specific Types Section */}
                {jgVersion === 'v1.2' && (
                    <Section title="2. Primitive Data Types (V1.2)">
                        <p>V1.2 introduces explicit types for data integrity.</p>
                        <SubSection title="Integer (int)">
                            <p>Stores whole numbers only. Decimal values are not allowed.</p>
                            <CodeBlock>{`int count = 10\nint error = 10.5  // ERROR: Must be a whole number`}</CodeBlock>
                        </SubSection>
                        <SubSection title="Decimal (decimal)">
                            <p>Stores fractional numbers for precise calculations.</p>
                            <CodeBlock>{`decimal price = 19.99`}</CodeBlock>
                        </SubSection>
                         <SubSection title="Boolean (bool)">
                            <p>Stores logical states. V1.2 strictly enforces <code>True</code> and <code>False</code> (case-sensitive).</p>
                            <CodeBlock>{`bool active = True\nbool invalid = true  // ERROR: Use 'True'`}</CodeBlock>
                        </SubSection>
                        <SubSection title="Type Conversion">
                            <p>Use the <code>convert</code> syntax to safely change types.</p>
                            <CodeBlock>{`decimal d = 9.99\nint i = convert d to int  // Result: 9`}</CodeBlock>
                        </SubSection>
                    </Section>
                )}

                {/* 2. Program Structure */}
                <Section title={`${jgVersion === 'v1.2' ? '3' : '2'}. Structure & Execution`}>
                    {jgVersion === 'v0' ? (
                        <>
                            <p>
                                <strong>Version 0</strong> follows a linear script execution model. Code is executed from top to bottom. 
                                There is no required entry point, making it ideal for simple scripts.
                            </p>
                            <CodeBlock label="V0 Script Structure">{`// Globals
final pi = 3.14

// Function Definitions
create function area takes r
   give pi * r * r
end

// Execution
say area(10)`}</CodeBlock>
                        </>
                    ) : (
                        <>
                            <p>
                                <strong>{jgVersion}</strong> requires code to be encapsulated within a <code>start program</code> block. Orphaned code at the top level is illegal.
                            </p>
                            
                            {(jgVersion === 'v1.1' || jgVersion === 'v1.2') && (
                                <SubSection title="Library Imports">
                                    <p>Standard libraries must be imported explicitly.</p>
                                    <CodeBlock>{`import library Input as In`}</CodeBlock>
                                </SubSection>
                            )}
                            
                            <SubSection title="Entry Point">
                                <p>Execution begins inside the program block.</p>
                                <CodeBlock label="Strict Structure">{`start program
    call main
end program

create function main
    say "System Online"
end`}</CodeBlock>
                            </SubSection>
                        </>
                    )}
                </Section>

                {/* 4. Functions */}
                <Section title={`${jgVersion === 'v1.2' ? '4' : '3'}. Functions`}>
                    <p>Functions are declared using the <code>create function</code> keyword.</p>
                    <CodeBlock label="Declaration">{`create function add takes a and b
    give a + b
end`}</CodeBlock>
                    
                    <SubSection title="Invoking Functions">
                        {jgVersion === 'v0' ? (
                            <>
                                <p>In <strong>V0</strong>, use standard parentheses.</p>
                                <CodeBlock>{`result = add(10, 20)`}</CodeBlock>
                            </>
                        ) : (
                            <>
                                <p>In <strong>{jgVersion}</strong>, use the <code>call</code> keyword.</p>
                                <CodeBlock>{`result = call add takes 10 and 20`}</CodeBlock>
                            </>
                        )}
                    </SubSection>
                </Section>

                {/* 5. Control Flow */}
                <Section title={`${jgVersion === 'v1.2' ? '5' : '4'}. Control Flow`}>
                    <SubSection title="Conditionals">
                        <p>Readable <code>when</code> blocks replace traditional <code>if/else</code>.</p>
                        <CodeBlock>{`when x greater 10
    say "High"
otherwise
    say "Low"
end`}</CodeBlock>
                    </SubSection>

                    <SubSection title="Loops">
                         {jgVersion === 'v0' ? (
                            <p className="text-orange-400 italic">V0 does not support native loops. Use recursion for iteration.</p>
                        ) : (
                            <>
                                <p>JG supports readable loop constructs.</p>
                                <CodeBlock label="Count-based">{`repeat 5 times
    say "Iterating..."
end`}</CodeBlock>
                            </>
                        )}
                    </SubSection>
                </Section>

                {/* 7. OOP (V1.0+) */}
                {(jgVersion === 'v1.0' || jgVersion === 'v1.1' || jgVersion === 'v1.2') && (
                    <Section title={`${jgVersion === 'v1.2' ? '6' : '5'}. Object Oriented Programming`}>
                        <p>V1.0 introduced a robust Class system designed for modularity without the syntax bloat.</p>
                        
                        <SubSection title="Class Definition">
                            <p>Classes encapsulate data and behavior. Visibility modifiers <code>public</code> and <code>private</code> are mandatory.</p>
                            <CodeBlock label="Defining a Class">{`Person is a class
    private name
    public age

    // Constructor matches 'new' arguments
    create function init takes n and a
        name = n
        age = a
    end
end`}</CodeBlock>
                        </SubSection>

                        <SubSection title="Usage">
                            <p>Objects are instantiated with <code>new</code>.</p>
                            <CodeBlock label="Object Interaction">{`// Instantiate
s = new Person takes "Alex" and 20

// Property Access
say s get age       // Read public property
set s age to 21     // Write public property`}</CodeBlock>
                        </SubSection>
                    </Section>
                )}
            </div>
        </div>
    );
};