

export const HERO_EXAMPLE = `// JG V1.2 Final
import library Input as In

start program
    int age = In.ask number "Age?"
    bool is_adult = convert age greater 18 to bool
    
    when is_adult equals True
        say "Access Granted"
    end
end program`;

export const V0_EXAMPLE = `// JulyGod V0 Example

create function check_access takes age
    final limit = 18
    
    when age greater_equal limit
        say "Access Granted"
    otherwise
        say "Access Denied"
    end
end

final user_age = 20
check_access(user_age) // Parentheses allowed in V0`;

export const V01_EXAMPLE = `// JulyGod V0.1 - Strict & Powerful
use library original

start program
    call main
end program

create function main
    // 1. Loops
    repeat 3 times
        say "Loading..."
    end

    // 2. Collections
    final numbers = list contains 10 and 20 and 30
    final settings = map has theme as "dark" and version as 0.1

    // 3. New Call Syntax (No parentheses)
    call process_data takes numbers
    
    say "Current Theme: " + settings get "theme"
end

create function process_data takes data
    say "Processing " + data
end`;

export const V1_EXAMPLE = `// JulyGod V1.0 - OOP Specification
use library original

start program
    // Create Object with constructor
    p = new Person takes "Divit" and 16
    
    // Call method (implicit self)
    call p greet
    
    // Explicit property access
    say "Age is: " + p get age
    
    // Setter
    set p age to 17
    say "New age is: " + p get age
end program

// Class Definition
Person is a class
    private name
    public age

    // Constructor
    create function init takes n and a
        name = n
        age = a
    end

    create function greet
        say "Hi, I am " + name
    end
end`;

export const V1_1_EXAMPLE = `// JulyGod V1.1 - Interactive Input
// Run this code! A popup will ask for input.

import library Input as In

start program
    // Execution will pause here until you answer
    name = In.ask "What is your name?"
    
    say "Hello, " + name + "!"
    
    // Type-safe number input
    age = In.ask number "What is your age?"
    
    when age greater 18
        say "Status: Adult"
    otherwise
        say "Status: Minor"
    end
end program`;

export const V1_2_EXAMPLE = `// JulyGod V1.2 - Final & Strict
// Features: Primitive Types, Strict Booleans, Conversion

start program
    // 1. Explicit Typing
    int count = 10
    decimal price = 99.99
    
    // 2. Strict Booleans (True/False only)
    bool is_valid = True
    
    // 3. Type Conversion
    decimal input_val = 15.75
    int rounded = convert input_val to int
    
    say "Original: " + input_val
    say "Converted to Int: " + rounded
    
    // 4. Validation
    // Uncommenting below will cause a Type Error!
    // int bad = 10.5
end program`;

export const FEATURES = [
    {
        title: "Readable First",
        description: "Code reads like structured English. No braces, no semicolons, no noise.",
        icon: "BookOpen"
    },
    {
        title: "Explicit Typing (V1.2)",
        description: "New primitive types (int, decimal, bool) ensure data integrity without complex syntax.",
        icon: "Lock"
    },
    {
        title: "Educational Errors",
        description: "Errors that teach, not confuse. Plain English explanations with suggested fixes.",
        icon: "AlertCircle"
    },
    {
        title: "One Source, Many Targets",
        description: "Write in JG, run anywhere. Compiles to Bytecode, Native Machine Code, or Python.",
        icon: "Layers"
    }
];