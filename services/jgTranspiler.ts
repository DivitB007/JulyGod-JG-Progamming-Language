
/**
 * JG Execution Engine & Transpiler
 * Supports Version 0, Version 0.1 Remastered, Version 1.0 (OOP), Version 1.1 (Input), and Version 1.2 (Strict Types)
 */

import { GoogleGenAI } from "@google/genai";

export interface JGCallbacks {
    onLog: (msg: string) => void;
    onError: (msg: string) => void;
    onInput: (prompt: string) => Promise<string>;
}

interface Variable {
  name: string;
  value: any;
  isFinal: boolean;
  type: string; // 'int' | 'decimal' | 'long decimal' | 'bool' | 'string' | 'object' | 'list' | 'map' | 'dynamic'
  lineDeclared?: number;
}

interface FunctionDef {
  name: string;
  params: string[];
  startLine: number; // 0-indexed relative to program start
  codeLines: string[];
}

interface ClassDef {
    name: string;
    parent: string | null;
    properties: Map<string, { visibility: 'public' | 'private' }>;
    methods: Map<string, FunctionDef>;
}

interface JGInstance {
    className: string;
    properties: Record<string, any>;
    id: string; // Unique ID for debugging
}

type Scope = Map<string, Variable>;
export type JGVersion = 'v0' | 'v0.1-remastered' | 'v1.0' | 'v1.1' | 'v1.2';

// --- Helpers ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const cleanLine = (line: string): string => {
  const commentIndex = line.indexOf('//');
  if (commentIndex !== -1) {
    return line.substring(0, commentIndex).trim();
  }
  return line.trim();
};

const formatError = (type: string, line: number, message: string, suggestion: string): string => {
    const linePrefix = line >= 0 ? `Line ${line + 1}: ` : '';
    return `❌ [${type} Error] ${linePrefix}${message}\n   💡 Tip: ${suggestion}`;
};

// --- String Masking ---
const maskStrings = (str: string): { masked: string, literals: string[] } => {
    const literals: string[] = [];
    const masked = str.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
        literals.push(match);
        return `__STR_${literals.length - 1}__`;
    });
    return { masked, literals };
};

const unmaskStrings = (str: string, literals: string[]): string => {
    return str.replace(/__STR_(\d+)__/g, (_, index) => literals[Number(index)]);
};

// --- Operator Mapping ---
const mapOperators = (expr: string, version: JGVersion): string => {
    // Use word boundaries \b to prevent accidental partial matches
    let processed = expr
        .replace(/\bgreater_equal\b/g, ' >= ')
        .replace(/\bless_equal\b/g, ' <= ')
        .replace(/\bnot_equals\b/g, ' !== ')
        .replace(/\bequals\b/g, ' === ')
        .replace(/\bgreater\b/g, ' > ')
        .replace(/\bless\b/g, ' < ')
        .replace(/\band\b/g, ' && ')
        .replace(/\bor\b/g, ' || ');

    if (version === 'v1.2') {
        processed = processed.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    } else {
        processed = processed.replace(/\btrue\b/g, ' true ').replace(/\bfalse\b/g, ' false ');
    }

    return processed;
};

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

// --- Evaluation Engine ---
const evaluateExpressionAsync = async (
    rawExpr: string, 
    scopeChain: Scope[], 
    version: JGVersion, 
    instanceCtx?: JGInstance, 
    libraries?: Map<string, any>
): Promise<any> => {
  
  const context: Record<string, any> = {};
  
  for (const scope of scopeChain) {
    for (const [key, val] of scope.entries()) {
      context[key] = val.value;
    }
  }

  if ((version === 'v1.1' || version === 'v1.2') && libraries) {
      for (const [alias, libObj] of libraries.entries()) {
          context[alias] = libObj;
      }
  }
  
  if ((version === 'v1.0' || version === 'v1.1' || version === 'v1.2') && instanceCtx) {
      for (const [key, val] of Object.entries(instanceCtx.properties)) {
          if (!(key in context)) {
              context[key] = val;
          }
      }
  }

  const { masked, literals } = maskStrings(rawExpr);
  let jsExpr = masked;

  if (version === 'v1.2') {
      if (/\btrue\b/.test(jsExpr) || /\bfalse\b/.test(jsExpr)) {
          throw new Error("SYNTAX_ERROR|'true' and 'false' are banned in V1.2. Use 'True' and 'False'.");
      }
  }

  if (version === 'v1.1' || version === 'v1.2') {
       jsExpr = jsExpr.replace(/(\w+)\.ask\s+number\s+(__STR_\d+__)/g, 'await $1.askNumber($2)');
       jsExpr = jsExpr.replace(/(\w+)\.ask\s+(__STR_\d+__)/g, 'await $1.ask($2)');
       jsExpr = jsExpr.replace(/(\w+)\.read\s+number/g, 'await $1.readNumber()');
       jsExpr = jsExpr.replace(/(\w+)\.read/g, 'await $1.read()');
  }

  if (version === 'v1.2') {
      jsExpr = jsExpr.replace(/convert\s+(.+?)\s+to\s+(int|long decimal|decimal|bool)/g, (match, val, type) => {
          switch(type) {
              case 'int': return `Math.floor(Number(${val}))`;
              case 'decimal': 
              case 'long decimal': return `Number(${val})`;
              case 'bool': return `Boolean(${val})`;
              default: return match;
          }
      });
  }

  if (version !== 'v0' && version !== 'v0.1-remastered') {
      jsExpr = jsExpr.replace(/([a-zA-Z_]\w*)\s+get\s+([a-zA-Z_]\w*)/g, '$1.properties.$2');
  } 
  
  if (version === 'v0.1-remastered') {
      jsExpr = jsExpr.replace(/([a-zA-Z_]\w*)\s+get\s+((?:__STR_\d+__)|[a-zA-Z_]\w*|\d+)/g, '$1[$2]');
  }

  jsExpr = mapOperators(jsExpr, version);
  jsExpr = unmaskStrings(jsExpr, literals);

  try {
    const func = new AsyncFunction(...Object.keys(context), `return ${jsExpr};`);
    const result = await func(...Object.values(context));
    return result;

  } catch (e: any) {
    if (e.name === 'ReferenceError') {
        const varName = e.message.split(' ')[0];
        throw new Error(`REFERENCE_ERROR|Unknown variable or object '${varName}'. Did you define it?`);
    }
    if (e.message.includes('properties')) {
        throw new Error(`ACCESS_ERROR|Attempted to access a property on an empty or invalid object.`);
    }
    if (e.message.includes('is not a function')) {
        throw new Error(`TYPE_ERROR|Attempted to call something that is not a function.`);
    }
    if (e.message.includes('|')) throw e;
    throw new Error(`MATH_ERROR|${e.message}`);
  }
};

// --- CORE: Async Interpreter ---

export const executeJGAsync = async (input: string, version: JGVersion, callbacks: JGCallbacks): Promise<boolean> => {
  const lines = input.split('\n');
  const functions = new Map<string, FunctionDef>();
  const classes = new Map<string, ClassDef>();
  const globalScope = new Map<string, Variable>();
  const loadedLibraries = new Map<string, any>(); 

  let hasError = false;
  let useLibraryOriginalFound = false;
  const logError = (type: string, line: number, msg: string, sugg: string) => {
      if (hasError) return;
      callbacks.onError(formatError(type, line, msg, sugg));
      hasError = true;
  }

  // --- PASS 1: Structure Parsing ---
  const blockStack: { type: string, startLine: number }[] = [];
  let mainProgramStart = -1;
  let mainProgramEnd = -1;
  let currentClass: ClassDef | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = cleanLine(rawLine);
    const lineNum = i;

    if (!line) continue;

    if (line === 'use library original') {
        useLibraryOriginalFound = true;
        continue;
    }

    if ((version === 'v1.1' || version === 'v1.2') && line.startsWith('import library')) {
        const match = line.match(/^import\s+library\s+([a-zA-Z_]\w*)\s+as\s+([a-zA-Z_]\w*)$/);
        if (match) {
            const libName = match[1];
            const alias = match[2];
            
            if (libName === 'Input') {
                loadedLibraries.set(alias, {
                    read: async () => await callbacks.onInput(""),
                    readNumber: async () => {
                        const val = await callbacks.onInput("");
                        const num = Number(val);
                        if (isNaN(num)) { throw new Error(`TYPE_ERROR|Expected a number but got text: '${val}'`); }
                        return num;
                    },
                    ask: async (msg: string) => await callbacks.onInput(msg),
                    askNumber: async (msg: string) => {
                        const val = await callbacks.onInput(msg);
                        const num = Number(val);
                        if (isNaN(num)) { throw new Error(`TYPE_ERROR|Expected a number but got text: '${val}'`); }
                        return num;
                    }
                });
            } else {
                 logError("Import", lineNum, `Library '${libName}' not found.`, "Only 'Input' is supported currently.");
            }
        } else {
             logError("Syntax", lineNum, "Invalid import statement.", "Format: import library Name as Alias");
        }
    }
    else if (line === 'start program') {
        if (version === 'v0') { logError("Syntax", lineNum, "'start program' is not used in V0.", "Remove it or upgrade version."); continue; }
        if (mainProgramStart !== -1) { logError("Structure", lineNum, "Multiple 'start program' blocks defined.", "You can only have one entry point."); continue; }
        mainProgramStart = i;
        blockStack.push({ type: 'program', startLine: i });
    }
    else if (line === 'end program') {
        if (blockStack.length > 0 && blockStack[blockStack.length-1].type === 'program') {
            blockStack.pop();
            mainProgramEnd = i;
        } else {
            logError("Structure", lineNum, "Unexpected 'end program'.", "Check your block nesting.");
        }
    }
    else if (version !== 'v0' && version !== 'v0.1-remastered' && line.includes(' is a class')) {
        const match = line.match(/^([a-zA-Z_]\w*)\s+is\s+a\s+class(?:\s+extends\s+([a-zA-Z_]\w*))?$/);
        if (match) {
            const className = match[1];
            if (classes.has(className)) { logError("Duplicate", lineNum, `Class '${className}' already defined.`, "Choose a unique name."); continue; }
            currentClass = { name: className, parent: match[2] || null, properties: new Map(), methods: new Map() };
            classes.set(className, currentClass);
            blockStack.push({ type: 'class', startLine: i });
        } else {
            logError("Syntax", lineNum, "Invalid class declaration.", "Format: Name is a class [extends Parent]");
        }
    }
    else if (line.includes('create function')) {
        const match = line.match(/^(?:override\s+)?create\s+function\s+([a-zA-Z_]\w*)\s*(?:takes\s+(.*))?$/);
        if (match) {
            blockStack.push({ type: 'function', startLine: i });
        } else {
            logError("Syntax", lineNum, "Invalid function declaration.", "Format: create function Name [takes param1 and param2]");
        }
    }
    else if (line === 'end') {
        if (blockStack.length === 0) {
            logError("Structure", lineNum, "Unexpected 'end' keyword.", "You might have extra ends.");
        } else {
            const block = blockStack.pop()!;
            if (block.type === 'class') {
                currentClass = null;
            } else if (block.type === 'function') {
                const header = cleanLine(lines[block.startLine]);
                const match = header.match(/^(?:override\s+)?create\s+function\s+([a-zA-Z_]\w*)\s*(?:takes\s+(.*))?$/);
                if (match) {
                    const name = match[1];
                    const paramsStr = match[2] || '';
                    const params = paramsStr ? paramsStr.split(/\s+and\s+/).map(p => p.trim()) : [];
                    const funcDef: FunctionDef = {
                        name,
                        params,
                        startLine: block.startLine,
                        codeLines: lines.slice(block.startLine + 1, i)
                    };

                    if (currentClass) {
                        currentClass.methods.set(name, funcDef);
                    } else {
                        functions.set(name, funcDef);
                    }
                }
            }
        }
    }
    else if (version !== 'v0' && version !== 'v0.1-remastered' && currentClass && (line.startsWith('public ') || line.startsWith('private '))) {
        const parts = line.split(/\s+/);
        if (parts.length < 2) { logError("Syntax", lineNum, "Invalid property definition.", "Format: public/private name"); continue; }
        currentClass.properties.set(parts[1], { visibility: parts[0] as 'public'|'private' });
    }
    else if (line.startsWith('when ') || line.startsWith('repeat ') || line === 'do') {
        blockStack.push({ type: 'control', startLine: i });
    }
    else if (line.startsWith('until ')) {
         if (blockStack.length > 0 && blockStack[blockStack.length-1].type === 'control') {
             blockStack.pop(); 
         }
    }
  }

  // --- Strict Library Check ---
  if ((version === 'v0.1-remastered' || version === 'v1.0') && !useLibraryOriginalFound) {
      logError("Syntax", 0, "'use library original' is mandatory for this version.", "Add it to the top of your code.");
      return false;
  }

  if (blockStack.length > 0) {
      logError("Structure", blockStack[0].startLine, "Unclosed block detected.", "Add 'end' keywords to close your blocks.");
      return false;
  }
  if (hasError) return false;

  // --- PASS 2: Runtime Execution ---
  const scopeStack: Scope[] = [globalScope];
  let callStackDepth = 0;
  const MAX_DEPTH = 500;
  let steps = 0;
  const MAX_STEPS = 50000;

  const findMethod = (clsName: string, methodName: string): FunctionDef | null => {
      let ptr: ClassDef | undefined = classes.get(clsName);
      while (ptr) {
          if (ptr.methods.has(methodName)) return ptr.methods.get(methodName)!;
          if (!ptr.parent) break;
          ptr = classes.get(ptr.parent);
      }
      return null;
  };

  const extractBlock = (lines: string[], startIndex: number): { block: string[], elseBlock: string[], nextIndex: number } => {
      const block: string[] = [];
      const elseBlock: string[] = [];
      let depth = 1;
      let captureElse = false;
      let k = startIndex + 1;

      while (k < lines.length && depth > 0) {
          const raw = lines[k];
          const l = cleanLine(raw);
          
          if (l.startsWith('when ') || l.startsWith('repeat ') || l === 'do') depth++;
          if (l === 'end') depth--;
          if (l.startsWith('until ')) depth--;

          if (depth === 1 && l === 'otherwise' && !captureElse) {
              captureElse = true;
              k++;
              continue;
          }

          if (depth > 0) {
              if (captureElse) elseBlock.push(raw); 
              else block.push(raw);
          }
          k++;
      }
      return { block, elseBlock, nextIndex: k - 1 };
  };

  const runLines = async (codeLines: string[], currentScope: Scope, instanceCtx?: JGInstance, lineOffset: number = 0): Promise<any> => {
      
      for (let j = 0; j < codeLines.length; j++) {
          steps++;
          if (steps > MAX_STEPS) return "__ERR:TIMEOUT__";

          const rawLine = codeLines[j];
          const line = cleanLine(rawLine);
          const currentLineNum = lineOffset + j; 

          if (!line) continue;
          if (line.startsWith('//')) continue;
          if (line === 'use library original') continue;

          if (line.includes('create function') || line.includes('is a class')) {
              const { nextIndex } = extractBlock(codeLines, j);
              j = nextIndex;
              continue;
          }

          if (line === 'stop') return "__CMD:STOP__";
          if (line === 'skip') return "__CMD:SKIP__";

          const printMatch = line.match(/^(say|print|log)\s+(.+)$/);
          if (printMatch) {
              try {
                  const val = await evaluateExpressionAsync(printMatch[2], scopeStack, version, instanceCtx, loadedLibraries);
                  const display = (val === null) ? 'null' : (typeof val === 'object' && val.properties) ? `[Object ${val.className}]` : String(val);
                  callbacks.onLog(display);
              } catch (e: any) {
                  logError("Runtime", currentLineNum, e.message.split('|')[1] || e.message, "Check variable names and types.");
                  return "__ERR__";
              }
              continue;
          }

          const newMatch = (version !== 'v0' && version !== 'v0.1-remastered') ? line.match(/^(final\s+)?([a-zA-Z_]\w*)\s*=\s*new\s+([a-zA-Z_]\w*)(?:\s+takes\s+(.+))?$/) : null;
          if (newMatch) {
               const name = newMatch[2];
               const clsName = newMatch[3];
               const argsRaw = newMatch[4];

               const cls = classes.get(clsName);
               if (!cls) { logError("Reference", currentLineNum, `Class '${clsName}' not found.`, "Check spelling or define the class."); return "__ERR__"; }

               const newObj: JGInstance = { className: clsName, properties: {}, id: generateId() };
               
               let ptr: ClassDef | undefined | null = cls;
               while(ptr) {
                   ptr.properties.forEach((_, k) => newObj.properties[k] = null);
                   if (!ptr.parent) break;
                   ptr = classes.get(ptr.parent);
               }

               const initMethod = findMethod(clsName, 'init');
               if (initMethod) {
                   const argVals = argsRaw ? await Promise.all(argsRaw.split(/\sand\s/).map(a => evaluateExpressionAsync(a.trim(), scopeStack, version, instanceCtx, loadedLibraries))) : [];
                   
                   if (argVals.length !== initMethod.params.length) {
                       logError("Type", currentLineNum, `Constructor expects ${initMethod.params.length} arguments, got ${argVals.length}.`, "Check 'takes' clause.");
                       return "__ERR__";
                   }

                   const localScope = new Map<string, Variable>();
                   initMethod.params.forEach((p, idx) => localScope.set(p, { name: p, value: argVals[idx], isFinal: false, type: 'any', lineDeclared: -1 }));
                   
                   scopeStack.push(localScope);
                   callStackDepth++;
                   await runLines(initMethod.codeLines, localScope, newObj, initMethod.startLine + 1);
                   callStackDepth--;
                   scopeStack.pop();
               }

               currentScope.set(name, { name, value: newObj, isFinal: !!newMatch[1], type: 'object', lineDeclared: currentLineNum });
               continue;
          }

          if (!line.startsWith('when') && !line.startsWith('set') && line.includes('=')) {
              const assignMatch = line.match(/^(?:(final)\s+)?(?:(int|long decimal|decimal|bool)\s+)?([a-zA-Z_]\w*)\s*=\s*(.+)$/);
              
              if (assignMatch) {
                  const isFinal = !!assignMatch[1];
                  const explicitType = assignMatch[2]; 
                  const name = assignMatch[3];
                  const expr = assignMatch[4];
                  
                  try {
                      let val: any;
                      if (expr.startsWith('list contains')) {
                           const content = expr.replace('list contains', '').trim();
                           val = content ? await Promise.all(content.split(/\sand\s/).map(x => evaluateExpressionAsync(x.trim(), scopeStack, version, instanceCtx, loadedLibraries))) : [];
                      } else if (expr.includes(' has ') && (expr.startsWith('map ') || version === 'v0.1-remastered')) {
                           val = {}; 
                           const content = expr.replace(/^(map\s+)?has\s+/, '');
                           const pairs = content.split(/\sas\s/);
                           for (const p of pairs) {
                               const [k, v] = p.split(/\sas\s/);
                               val[k.replace(/"/g, '').trim()] = await evaluateExpressionAsync(v.trim(), scopeStack, version, instanceCtx, loadedLibraries);
                           }
                      } else {
                          val = await evaluateExpressionAsync(expr, scopeStack, version, instanceCtx, loadedLibraries);
                      }

                      let inferredType = 'dynamic';
                      if (explicitType && version === 'v1.2') {
                          inferredType = explicitType;
                          if (explicitType === 'int') {
                              if (typeof val !== 'number' || !Number.isInteger(val)) {
                                  logError("Type", currentLineNum, `Value assigned to 'int ${name}' must be a whole number.`, `Got: ${val}.`);
                                  return "__ERR__";
                              }
                          } else if (explicitType === 'decimal' || explicitType === 'long decimal') {
                              if (typeof val !== 'number') {
                                  logError("Type", currentLineNum, `Value assigned to '${explicitType} ${name}' must be a number.`, `Got: ${typeof val}.`);
                                  return "__ERR__";
                              }
                          } else if (explicitType === 'bool') {
                              if (typeof val !== 'boolean') {
                                  logError("Type", currentLineNum, `Value assigned to 'bool ${name}' must be True or False.`, `Got: ${val}.`);
                                  return "__ERR__";
                              }
                          }
                      }

                      if (instanceCtx && instanceCtx.properties.hasOwnProperty(name)) {
                           instanceCtx.properties[name] = val;
                      } 
                      else {
                          let defined = false;
                          for (let s = scopeStack.length - 1; s >= 0; s--) {
                              if (scopeStack[s].has(name)) {
                                  const vDef = scopeStack[s].get(name)!;
                                  if (vDef.isFinal) {
                                      logError("Logic", currentLineNum, `Cannot reassign final variable '${name}'.`, "Remove 'final' if it needs to change.");
                                      return "__ERR__";
                                  }
                                  if (version === 'v1.2' && vDef.type !== 'dynamic') {
                                      if (vDef.type === 'int' && !Number.isInteger(val)) {
                                          logError("Type", currentLineNum, `Cannot assign non-integer to int '${name}'.`, "");
                                          return "__ERR__";
                                      }
                                      if (vDef.type === 'bool' && typeof val !== 'boolean') {
                                          logError("Type", currentLineNum, `Cannot assign non-boolean to bool '${name}'.`, "");
                                          return "__ERR__";
                                      }
                                  }

                                  vDef.value = val;
                                  defined = true;
                                  break;
                              }
                          }
                          if (!defined) {
                              currentScope.set(name, { name, value: val, isFinal, type: inferredType, lineDeclared: currentLineNum });
                          }
                      }

                  } catch (e: any) {
                      logError("Runtime", currentLineNum, e.message.split('|')[1] || "Expression Error", "Check the assignment value.");
                      return "__ERR__";
                  }
                  continue;
              }
          }

          if (version !== 'v0' && version !== 'v0.1-remastered' && line.startsWith('call ')) {
               const objCall = line.match(/^call\s+([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)(?:\s+takes\s+(.+))?$/);
               
               let isObjectMethod = false;
               let objInstance: JGInstance | null = null;
               
               if (objCall) {
                   const varName = objCall[1];
                   for (let s = scopeStack.length - 1; s >= 0; s--) {
                       if (scopeStack[s].has(varName)) {
                           const val = scopeStack[s].get(varName)!.value;
                           if (val && val.className) {
                               isObjectMethod = true;
                               objInstance = val;
                           }
                           break;
                       }
                   }
               }

               if (isObjectMethod && objInstance && objCall) {
                   const methodName = objCall[2];
                   const argsRaw = objCall[3];
                   
                   const method = findMethod(objInstance.className, methodName);
                   if (!method) {
                       const avail = Array.from(classes.get(objInstance.className)?.methods.keys() || []).join(", ");
                       logError("Reference", currentLineNum, `Method '${methodName}' not found on object of type '${objInstance.className}'.`, `Available: ${avail || 'None'}`);
                       return "__ERR__";
                   }

                   const argVals = argsRaw ? await Promise.all(argsRaw.split(/\sand\s/).map(a => evaluateExpressionAsync(a.trim(), scopeStack, version, instanceCtx, loadedLibraries))) : [];
                   
                   if (argVals.length !== method.params.length) {
                       logError("Type", currentLineNum, `Method '${methodName}' expects ${method.params.length} args, got ${argVals.length}.`, "");
                       return "__ERR__";
                   }

                   const localScope = new Map<string, Variable>();
                   method.params.forEach((p, idx) => localScope.set(p, { name: p, value: argVals[idx], isFinal: false, type: 'any', lineDeclared: -1 }));

                   scopeStack.push(localScope);
                   callStackDepth++;
                   if (callStackDepth > MAX_DEPTH) return "__ERR:STACK_OVERFLOW__";
                   await runLines(method.codeLines, localScope, objInstance, method.startLine + 1);
                   callStackDepth--;
                   scopeStack.pop();
                   continue;
               }
          }

          // --- V0 & General Function Call ---
          const isV0Call = version === 'v0' && /^([a-zA-Z_]\w*)\s*\((.*)\)$/.test(line);
          const isCallKeyword = line.startsWith('call ');

          if (isCallKeyword || isV0Call) {
              let funcName = "";
              let argsRaw = "";

              if (isV0Call) {
                  const m = line.match(/^([a-zA-Z_]\w*)\s*\((.*)\)$/);
                  if (m) { funcName = m[1]; argsRaw = m[2]; }
              } else {
                  const m = line.match(/^call\s+([a-zA-Z_]\w*)(?:\s+takes\s+(.+))?$/);
                  if (m) { funcName = m[1]; argsRaw = m[2]; }
              }
              
              if (funcName) {
                  if (!functions.has(funcName)) {
                      logError("Reference", currentLineNum, `Function '${funcName}' is not defined.`, "Check spelling.");
                      return "__ERR__";
                  }

                  const func = functions.get(funcName)!;
                  const argVals = argsRaw ? await Promise.all(argsRaw.split((isV0Call ? ',' : /\sand\s/)).map(a => evaluateExpressionAsync(a.trim(), scopeStack, version, instanceCtx, loadedLibraries))) : [];

                  if (argVals.length !== func.params.length) {
                      logError("Type", currentLineNum, `Function '${funcName}' expects ${func.params.length} arguments, got ${argVals.length}.`, "");
                      return "__ERR__";
                  }

                  const localScope = new Map<string, Variable>();
                  func.params.forEach((p, idx) => localScope.set(p, { name: p, value: argVals[idx], isFinal: false, type: 'any', lineDeclared: -1 }));

                  scopeStack.push(localScope);
                  callStackDepth++;
                  await runLines(func.codeLines, localScope, undefined, func.startLine + 1);
                  callStackDepth--;
                  scopeStack.pop();
                  continue;
              } else if (isCallKeyword) {
                  logError("Syntax", currentLineNum, "Invalid function call format.", "Format: call FunctionName [takes args]");
                  return "__ERR__";
              }
          }

          if (version !== 'v0' && version !== 'v0.1-remastered' && line.startsWith('set ')) {
              const setMatch = line.match(/^set\s+([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)\s+to\s+(.+)$/);
              if (setMatch) {
                  const objName = setMatch[1];
                  const propName = setMatch[2];
                  const valExpr = setMatch[3];

                  let obj: JGInstance | null = null;
                   for (let s = scopeStack.length - 1; s >= 0; s--) {
                       if (scopeStack[s].has(objName)) {
                           obj = scopeStack[s].get(objName)!.value;
                           break;
                       }
                   }

                   if (!obj || !obj.className) {
                       logError("Type", currentLineNum, `'${objName}' is not a valid object.`, "Instantiate it first.");
                       return "__ERR__";
                   }

                   let defClass: ClassDef | undefined | null = classes.get(obj.className);
                   let visibility = 'public';
                   
                   while(defClass) {
                       if (defClass.properties.has(propName)) {
                           visibility = defClass.properties.get(propName)!.visibility;
                           break;
                       }
                       if (!defClass.parent) break;
                       defClass = classes.get(defClass.parent);
                   }

                   if (visibility === 'private' && instanceCtx !== obj) {
                       logError("Access", currentLineNum, `Property '${propName}' is private.`, "Use a public method (setter) to change it.");
                       return "__ERR__";
                   }

                   try {
                       obj.properties[propName] = await evaluateExpressionAsync(valExpr, scopeStack, version, instanceCtx, loadedLibraries);
                   } catch (e: any) {
                       logError("Runtime", currentLineNum, "Failed to set value.", e.message);
                       return "__ERR__";
                   }
                   continue;
              }
          }

          if (line.startsWith('when ')) {
              const condMatch = line.match(/^when\s+(.+)$/);
              if (condMatch) {
                  let truthy = false;
                  try {
                      truthy = Boolean(await evaluateExpressionAsync(condMatch[1], scopeStack, version, instanceCtx, loadedLibraries));
                  } catch (e: any) {
                       logError("Logic", currentLineNum, "Invalid condition.", e.message.split('|')[1]);
                       return "__ERR__";
                  }

                  const { block, elseBlock, nextIndex } = extractBlock(codeLines, j);
                  j = nextIndex;

                  if (truthy) {
                      const res = await runLines(block, currentScope, instanceCtx, currentLineNum + 1);
                      if (res === "__CMD:STOP__" || res === "__CMD:SKIP__" || res === "__ERR__") return res;
                  } else if (elseBlock.length > 0) {
                      const res = await runLines(elseBlock, currentScope, instanceCtx, currentLineNum + 1 + block.length + 1); 
                       if (res === "__CMD:STOP__" || res === "__CMD:SKIP__" || res === "__ERR__") return res;
                  }
                  continue;
              }
          }

          if (line.startsWith('repeat ') || line === 'do') {
               const { block, nextIndex } = extractBlock(codeLines, j);
               
               const timesMatch = line.match(/^repeat\s+(\d+|[a-zA-Z_]\w*)\s+times$/);
               const untilMatch = line.match(/^repeat\s+until\s+(.+)$/);
               
               j = nextIndex; 

               if (timesMatch) {
                   const n = Number(await evaluateExpressionAsync(timesMatch[1], scopeStack, version, instanceCtx, loadedLibraries));
                   for (let k = 0; k < n; k++) {
                       const res = await runLines(block, currentScope, instanceCtx, currentLineNum + 1);
                       if (res === "__CMD:STOP__") break;
                       if (res === "__ERR__") return "__ERR__";
                       if (res === "__CMD:SKIP__") continue;
                   }
               }
               else if (untilMatch) {
                   const condStr = untilMatch[1];
                   let loops = 0;
                   while(true) {
                       loops++;
                       if (loops > 10000) { logError("Runtime", currentLineNum, "Infinite Loop Detected.", "Check your logic."); return "__ERR__"; }
                       
                       const cond = Boolean(await evaluateExpressionAsync(condStr, scopeStack, version, instanceCtx, loadedLibraries));
                       if (cond) break;

                       const res = await runLines(block, currentScope, instanceCtx, currentLineNum + 1);
                       if (res === "__CMD:STOP__") break;
                       if (res === "__ERR__") return "__ERR__";
                   }
               }
               continue;
          }
          
          if (line.startsWith('give ')) {
              const resMatch = line.match(/^give\s+(.+)$/);
              if (resMatch) {
                  try {
                      return await evaluateExpressionAsync(resMatch[1], scopeStack, version, instanceCtx, loadedLibraries);
                  } catch(e) { return "__ERR__"; }
              }
          }
      }
      return null;
  };

  // --- START EXECUTION ---
  try {
      if (version === 'v0') {
          await runLines(lines, globalScope, undefined, 0);
      } else {
          if (mainProgramStart !== -1 && mainProgramEnd !== -1) {
              const mainBody = lines.slice(mainProgramStart + 1, mainProgramEnd);
              await runLines(mainBody, globalScope, undefined, mainProgramStart + 1);
          } else {
              logError("Structure", 0, "No 'start program' block found.", "Wrap your main code.");
          }
      }
  } catch (e: any) {
      if (!hasError) logError("System", 0, "Critical Failure", e.message);
  }

  return !hasError;
};

export const executeJG = (input: string, version: JGVersion = 'v0', stdIn: string = ""): any => {
    throw new Error("Use executeJGAsync");
};

export const transpileJGtoPython = async (input: string, version: JGVersion): Promise<string> => {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        return "# API Key Missing. Please ensure the process.env.API_KEY environment variable is configured.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following JulyGod (JG) source code into Python 3.
            
            VERSION: ${version}
            
            SOURCE CODE:
            ${input}`,
            config: {
                systemInstruction: `You are the compiler for JulyGod (JG).
                Convert JG code to clean, executable Python 3 code.
                
                SYNTAX MAPPING (V1.1 UPDATE):
                - 'import library Input as In' -> 'import input_lib as In' (Simulate a library or use native input)
                - 'val = In.ask "Prompt"' -> 'val = input("Prompt")'
                
                SYNTAX MAPPING (V1.2 UPDATE):
                - 'int x = 10' -> 'x: int = 10'
                - 'decimal y = 10.5' -> 'y: float = 10.5'
                - 'convert x to int' -> 'int(x)'
                
                GENERAL RULES:
                1. 'use library original' -> mandatory for V0.1 and V1.0. Error if missing in these versions.
                2. 'start program' ... 'end program' -> 'if __name__ == "__main__":'
                3. 'repeat N times' -> 'for _ in range(N):'
                4. 'say "msg"' -> 'print("msg")'
                
                IMPORTANT:
                - Output ONLY valid Python code.
                - Do not include Markdown.`,
            }
        });

        let text = response.text || "";
        text = text.replace(/^```python\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '');
        return text;

    } catch (e: any) {
        if (e.message && e.message.includes('429')) {
             return `# Transpilation failed: Rate limit exceeded (429). Please try again in a few moments or use a paid API key.`;
        }
        return `# Transpilation failed: ${e.message || e}`;
    }
}
