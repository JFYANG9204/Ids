import {
    existsSync,
    readdirSync
} from "fs";
import {
    dirname,
    isAbsolute,
    join,
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
import { positionAt } from "./lib/file/util";
import { File } from "./lib/types";
import {
    DefinitionBase,
    InterfaceDefinition
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
    let label = `(${def.defType === "macro" ? "Macro" : "Variable"}) ${name}: ${def.name}`;
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

function getMemberCompletions(def: DefinitionBase) {
    let completions: CompletionItem[] = [];
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
    file: File, pos: number, filePath: string, triggerChar: string) {
    const completions: CompletionItem[] = [];
    let node = positionAt(file.program.body, pos);
    // #include
    if (node.treeParent &&
        node.treeParent.type === "PreIncludeStatement" &&
        node.type === "StringLiteral" &&
        (triggerChar === "\\" || triggerChar === "/")) {
        let incPath = resolve(join(dirname(filePath), node.extra["raw"]));
        return getPathCompletion(incPath);
    }
    let def = node.extra["definition"];
    if (def && triggerChar === ".") {
        return getMemberCompletions(def as InterfaceDefinition);
    }
    return completions;
}

export { keywordsCompletions, preKeywordsCompletions, builtInCompletions };

