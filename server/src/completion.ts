import {
    existsSync,
    readdirSync
} from "fs";
import {
    isAbsolute,
    resolve
} from "path";
import {
    CompletionItem,
    CompletionItemKind,
    MarkupKind
} from 'vscode-languageserver-types';
import {
    BasicTypeDefinitions,
    builtInAggregateDefinitions,
    builtInFunctionDefinitions,
    builtInObjectDefinitions
} from "./lib/built-in/built-ins";
import { distanceTo, positionAt, positionInWith } from "./lib/file/util";
import { CallExpression, File, PreIncludeStatement } from "./lib/types";
import {
    DefinitionBase,
    FunctionDefinition,
    InterfaceDefinition,
    ObjectDefinition
} from "./lib/util/definition";


export function getPathCompletion(uri: string): CompletionItem[] {
    const completion: CompletionItem[] = [];
    if (!isAbsolute(uri)) {
        return completion;
    }
    if (!existsSync(uri)) {
        return [];
    }
    const fileNames = readdirSync(resolve(uri), { withFileTypes: true });
    fileNames.forEach(item => {
        if (item.isDirectory()) {
            completion.push({
                label: item.name,
                kind: CompletionItemKind.Folder
            });
        } else if (item.isFile()) {
            completion.push({
                label: item.name,
                kind: CompletionItemKind.File
            });
        }
    });
    return completion;
}

const keywords = [
    "And",
    "Case",
    "Const",
    "Dim",
    "Do",
    "Each",
    "Else",
    "ElseIf",
    "End",
    "Error",
    "Exit",
    "Explicit",
    "False",
    "For",
    "Function",
    "GlobalVariables",
    "GoTo",
    "If",
    "Implicit",
    "In",
    "Is",
    "Like",
    "Loop",
    "Mod",
    "Next",
    "Not",
    "Null",
    "On",
    "Option",
    "Or",
    "Paper",
    "Resume",
    "Section",
    "Select",
    "Set",
    "Step",
    "Sub",
    "Then",
    "To",
    "True",
    "Until",
    "While",
    "With",
    "Xor"
];

const keywordsCompletions: CompletionItem[] = [];

keywords.forEach(kw => {
    keywordsCompletions.push({
        label: kw,
        kind: CompletionItemKind.Keyword
    });
});

const preKeywords = [ "include", "define", "if", "undef", "elif", "else", "endif", "error", "line" ];

const preKeywordsCompletions: CompletionItem[] = [];

preKeywords.forEach(kw => {
    preKeywordsCompletions.push({
        label: kw,
        kind: CompletionItemKind.Keyword
    });
});

const builtInCompletions: CompletionItem[] = [];

function setBuiltInCompletions(
    defs: Map<string, DefinitionBase>,
    kind: CompletionItemKind) {
    defs.forEach(def => {
        builtInCompletions.push({
            label: def.name,
            kind: kind,
            documentation: {
                kind: MarkupKind.Markdown,
                value: def.getNote()
            }
        });
    });
}

setBuiltInCompletions(builtInObjectDefinitions, CompletionItemKind.Module);
setBuiltInCompletions(builtInFunctionDefinitions, CompletionItemKind.Function);
setBuiltInCompletions(builtInAggregateDefinitions, CompletionItemKind.Function);

function getCompletionTypeFromDefinition(def: DefinitionBase): CompletionItemKind {
    if (def === BasicTypeDefinitions.string ||
        def === BasicTypeDefinitions.categorical) {
        return CompletionItemKind.Variable;
    }
    switch (def.defType) {
        case "object":     return CompletionItemKind.Module;
        case "constant":   return CompletionItemKind.Constant;
        case "property":   return CompletionItemKind.Property;
        case "method":     return CompletionItemKind.Method;
        case "enum":       return CompletionItemKind.Enum;
        case "function":   return CompletionItemKind.Function;
        case "variant":    return CompletionItemKind.Variable;
        case "macro":      return CompletionItemKind.Variable;
        case "literal":    return CompletionItemKind.Variable;
        case "interface":  return CompletionItemKind.Interface;
        case "array":      return CompletionItemKind.Variable;
        default:           return CompletionItemKind.Text;
    }
}

function getCompletionFromDefinitionBase(def: DefinitionBase, name?: string): CompletionItem {
    let type = getCompletionTypeFromDefinition(def);
    return {
        label: name ?? def.name,
        kind: type,
        documentation: {
            kind: MarkupKind.Markdown,
            value: def.getNote()
        }
    };
}

function getVariableCompletion(name: string, def: DefinitionBase): CompletionItem {
    let label = `(${def.defType === "macro" ? "macro" : "variable"}) ${name}: ${def.name}`;
    let type = getCompletionTypeFromDefinition(def);
    return {
        label: name,
        kind: type,
        documentation: {
            kind: MarkupKind.Markdown,
            value: "```ds\n" + label + "\n```"
        }
    };
}

function getMemberCompletions(def: DefinitionBase): CompletionItem[] {
    let completions: CompletionItem[] = [];
    if (def instanceof ObjectDefinition && def.return) {
        return getMemberCompletions(def.return);
    }
    if (def instanceof InterfaceDefinition) {
        def.methods.forEach(method => {
            completions.push(getCompletionFromDefinitionBase(method));
        });
        def.properties.forEach(prop => {
            completions.push(getCompletionFromDefinitionBase(prop));
        });
    }
    return completions;
}

export function getCompletionsFromDefinitions(defs: Map<string, DefinitionBase>): CompletionItem[] {
    const completions: CompletionItem[] = [];
    defs.forEach((def, name) => {
        if (def.defType === "function") {
            completions.push(getCompletionFromDefinitionBase(def));
        } else {
            completions.push(getVariableCompletion(name, def));
        }
    });
    return completions;
}

export function getCompletionFromPosition(
    file: File, pos: number, triggerChar: string) {
    const completions: CompletionItem[] = [];
    let node = positionAt(file.program.body, pos);
    // #include
    if (node.type === "PreIncludeStatement") {
        if (distanceTo((node as PreIncludeStatement).inc, pos) === 0 &&
            (node as PreIncludeStatement).path &&
            (triggerChar === "\\" || triggerChar === "/")) {
            let incPath = (node as PreIncludeStatement).path;
            try {
                return getPathCompletion(incPath);
            } catch (error) {
                return [];
            }
        }
        return [];
    }
    let ahead = positionAt(file.program.body, pos, false, 1);
    // with
    if (!["CallExpression", "MemberExpression", "Identifier"].includes(ahead.type) &&
        triggerChar === ".") {
        let maybeWith = positionInWith(file.program.body, pos);
        if (maybeWith) {
            const def: DefinitionBase = maybeWith.extra["definition"];
            if (def) {
                return getMemberCompletions(def);
            }
            return [];
        } else {
            return [];
        }
    }
    //
    let def: DefinitionBase = ahead.extra["definition"];
    if (def && triggerChar === ".") {
        return getMemberCompletions(def as InterfaceDefinition);
    }
    return completions;
}

function getFunctionParamText(def: FunctionDefinition, index: number) {
    let text = def.name;
    let argTexts: string[] = [];
    def.arguments.forEach((arg, ndx) => {
        let typeText = "";
        if (arg.type instanceof Array) {
            let textArr: string[] = [];
            arg.type.forEach(t => textArr.push(t.name));
            typeText = textArr.join(" | ");
        } else {
            typeText = arg.type.name;
        }
        let argText = `${arg.name}: ${typeText}`;
        if (arg.isOptional) {
            argText = "[" + argText + "]";
        }
        if (ndx === index) {
            argTexts.push(`__${argText}__`);
        } else {
            argTexts.push(argText);
        }
    });
    if (argTexts.length > 0) {
        text += argTexts.join(", ");
    }
    text += "): " + def.return ? def.return?.name : "Void";
    return text;
}


export function getFunctionParamCompletion(
    file: File, pos: number): CompletionItem[] {
    const node = positionAt(file.program.body, pos);
    if (node &&
        node instanceof CallExpression &&
        node.callee.extra["definition"] instanceof FunctionDefinition) {
        let def: FunctionDefinition = node.callee.extra["definition"];
        return [{
            label: getFunctionParamText(def, node.arguments.length),
            kind: CompletionItemKind.Function,
        }];
    } else {
        return [];
    }
}


export { keywordsCompletions, preKeywordsCompletions, builtInCompletions };

