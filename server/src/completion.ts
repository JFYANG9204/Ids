import * as charCodes from "./lib/util/charcodes";
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
    Hover,
    MarkupKind
} from 'vscode-languageserver-types';
import {
    distanceTo,
    positionAt,
    positionInWith
} from "./lib/file";
import {
    ArgumentDeclarator,
    ArrayDeclarator,
    ClassOrInterfaceDeclaration,
    Comment,
    DeclarationBase,
    File,
    FunctionDeclaration,
    MacroDeclaration,
    PreIncludeStatement,
    PropertyDeclaration,
    SingleVarDeclarator
} from "./lib/types";
import { isIdentifierChar } from "./lib/util/identifier";
import { builtInModule } from "./lib/util/declaration";
import { Scope } from "./lib/util/scope";


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

if (builtInModule) {
    setBuiltInCompletions(builtInModule.dims,      CompletionItemKind.Variable);
    setBuiltInCompletions(builtInModule.consts,    CompletionItemKind.Variable);
    setBuiltInCompletions(builtInModule.functions, CompletionItemKind.Function);
    setBuiltInCompletions(builtInModule.macros,    CompletionItemKind.Variable);
}

function setBuiltInCompletions(
    defs: Map<string, DeclarationBase>,
    kind: CompletionItemKind) {
    defs.forEach(def => {
        builtInCompletions.push({
            label: def.name.name,
            kind: kind,
            documentation: {
                kind: MarkupKind.Markdown,
                value: getDeclarationNote(def)
            }
        });
    });
}

function getCompletionTypeFromDeclare(dec: DeclarationBase): CompletionItemKind {
    switch (dec.type) {
        case "FunctionDeclaration":
            if ((dec as FunctionDeclaration).class) {
                return CompletionItemKind.Method;
            } else {
                return CompletionItemKind.Function;
            }
        case "PropertyDeclaration":          return CompletionItemKind.Property;
        case "ClassOrInterfaceDeclaration":
            if ((dec as ClassOrInterfaceDeclaration).defType === "class") {
                return CompletionItemKind.Class;
            } else {
                return CompletionItemKind.Interface;
            }
        case "NamespaceDeclaration":         return CompletionItemKind.Module;
        case "MacroDeclaration":             return CompletionItemKind.Variable;
        case "EnumItemDeclarator":           return CompletionItemKind.EnumMember;
        case "EnumDeclaration":              return CompletionItemKind.Enum;
        case "SingleVarDeclarator":          return CompletionItemKind.Variable;
        case "ArrayDeclarator":              return CompletionItemKind.Variable;
        default:                             return CompletionItemKind.Text;
    }
}

function getDeclarationNote(dec: DeclarationBase): string {
    if (dec.leadingComments.length > 0) {
        return mergeComments(dec.leadingComments);
    } else if (dec.innerComments.length > 0) {
        return mergeComments(dec.innerComments);
    } else {
        return getDefaultNote(dec);
    }
}

function mergeComments(comments: Array<Comment>) {
    let text = "";
    comments.forEach(comment => {
        text += comment.value;
    });
    return formatStatement(text);
}

function formatStatement(comment: string): string {
    const regexp = /\n\s*/gm;
    return comment.replace(regexp, "\n");
}

function getDefaultNote(dec: DeclarationBase): string {
    const name = dec.name.name;
    let text = "";
    let args = "";
    let value = "";

    if (!dec.declare) {
        const t = dec as SingleVarDeclarator;
        return "```ds\n(undefined variable) " + t.name.name +
            (t.valueType ? (": " + t.valueType) : "") + "\n```";
    }

    switch (dec.type) {
        case "FunctionDeclaration":
            if ((dec as FunctionDeclaration).class) {
                text += "(method) " + (dec as FunctionDeclaration).class?.name.name + ".";
            } else {
                text += "(function) ";
            }
            args = getArgumentNote((dec as FunctionDeclaration).params);
            value = (dec as FunctionDeclaration).returnType ?? "Void";
            return "```ds\n" + text + name + "(" + args + "): " + value + "\n```";

        case "PropertyDeclaration":
            const prop = dec as PropertyDeclaration;
            text = `(property) ${prop.class.name}.${name}`;
            if (prop.params.length > 0) {
                text += "(" + getArgumentNote(prop.params) + ")";
            }
            text += ": " + getDeclaratorNote(prop.returnType);
            return "```ds\n" + text + "\n```";

        case "SingleVarDeclarator":
            const dim = dec as SingleVarDeclarator;
            return "```ds\n" + `(variable) ${getDeclaratorNote(dim)}\n` + "```";

        case "ArrayDeclarator":
            const arr = dec as ArrayDeclarator;
            return "```ds\n" + `(variable) ${getDeclaratorNote(arr)}\n` + "```";

        case "MacroDeclaration":
            const macro = dec as MacroDeclaration;
            return "```ds\n(macro) " + macro.name.name +
                (macro.initValue ? " = " + macro.initValue : "") + "\n```";

        case "ClassOrInterfaceDeclaration":
            const classOrInterface = dec as ClassOrInterfaceDeclaration;
            if (classOrInterface.defType === "interface") {
                text += "(interface) ";
            } else {
                text += "(class) ";
            }
            return "```ds\n" + text + classOrInterface.name.name + "\n```";

        default:
            return "";
    }
}

function getDeclaratorNote(dec: SingleVarDeclarator | ArrayDeclarator) {
    if (dec instanceof SingleVarDeclarator) {
        return dec.name.name + ": " + dec.valueType + (dec.generics ? "<" + dec.generics + ">" : "");
    } else {
        let boundries = "";
        if (dec.dimensions === 1) {
            return dec.name.name + "[]: Array";
        }
        for (let i = 0; i < dec.dimensions; i++) {
            if (dec.boundaries && (i < dec.boundaries.length)) {
                boundries += `[${dec.boundaries[i]}]`;
            } else {
                boundries += "[]";
            }
        }
        return dec.name.name + boundries + ": Array" + (dec.generics ? "<" + dec.generics + ">" : "");
    }
}

function getArgumentNote(args: Array<ArgumentDeclarator>) {
    let note = "";
    args.forEach((param, index) => {
        if (index > 0) { note += ", "; }
        if (param.optional) { note += "["; }
        note += getDeclaratorNote(param.declarator);
        if (param.optional) { note += "]"; }
    });
    return note;
}


function getCompletionFromDeclarationBase(
    dec: DeclarationBase, name?: string): CompletionItem {
    let type = getCompletionTypeFromDeclare(dec);
    return {
        label: name ?? dec.name.name,
        kind: type,
        documentation: {
            kind: MarkupKind.Markdown,
            value: getDeclarationNote(dec)
        }
    };
}

function getMemberCompletions(dec: DeclarationBase): CompletionItem[] {
    let completions: CompletionItem[] = [];
    if (dec.type !== "ClassOrInterfaceDeclaration") {
        return [];
    }
    const classOrInterface = dec as ClassOrInterfaceDeclaration;
    classOrInterface.properties.forEach(prop => {
        completions.push(getCompletionFromDeclarationBase(prop));
    });
    classOrInterface.methods.forEach(method => {
        completions.push(getCompletionFromDeclarationBase(method));
    });
    return completions;
}

function getCompletionsFromDeclarations(decs: Map<string, DeclarationBase>): CompletionItem[] {
    const completions: CompletionItem[] = [];
    decs.forEach((value) => {
        completions.push(getCompletionFromDeclarationBase(value));
    });
    return completions;
}

export function getCompletionsFromScope(scope: Scope) {
    let completions: CompletionItem[] = [];
    completions = completions.concat(
        getCompletionsFromDeclarations(scope.dims),
        getCompletionsFromDeclarations(scope.consts),
        getCompletionsFromDeclarations(scope.macros),
        getCompletionsFromDeclarations(scope.functions));
    return completions;
}

function checkIfDotStart(char: number) {
    return char !== charCodes.rightSquareBracket &&
           char !== charCodes.rightParenthesis   &&
           !isIdentifierChar(char);
}

export function getCompletionFromPosition(
    file: File, pos: number, triggerChar: string, lastChar: number) {
    let completions: CompletionItem[] = [];
    let pre = positionAt(file.program.body, pos, false, 0);
    // #include
    if (pre.type === "PreIncludeStatement") {
        if (distanceTo((pre as PreIncludeStatement).inc, pos) === 0 &&
            (pre as PreIncludeStatement).path &&
            (triggerChar === "\\" || triggerChar === "/")) {
            let incPath = (pre as PreIncludeStatement).path;
            try {
                return getPathCompletion(incPath);
            } catch (error) {
                return [];
            }
        }
        return [];
    }
    if (triggerChar === ".") {
        // with
        if (checkIfDotStart(lastChar)) {
            let maybeWith = positionInWith(file.program.body, pos);
            if (maybeWith) {
                const dec: DeclarationBase = maybeWith.extra["declaration"];
                if (dec) {
                    return getMemberCompletions(dec);
                }
            }
            return [];
        }
        //
        let ahead = positionAt(file.program.body, pos, false, 0);
        let def: DeclarationBase = ahead.extra["declaration"];
        if (def) {
            return getMemberCompletions(def);
        }
    }
    return completions;
}


export { keywordsCompletions, preKeywordsCompletions, builtInCompletions };


export function getHoverFromDeclaration(dec: DeclarationBase): Hover {
    return {
        contents: {
            kind: MarkupKind.Markdown,
            value: getDeclarationNote(dec)
        }
    };
}

