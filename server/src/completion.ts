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
    MarkupContent,
    MarkupKind,
    SignatureHelp
} from 'vscode-languageserver-types';
import {
    distanceTo,
    positionAt,
    positionInWith
} from "./lib/file";
import {
    ArgumentDeclarator,
    ArrayDeclarator,
    BindingDeclarator,
    CallExpression,
    ClassOrInterfaceDeclaration,
    Comment,
    DeclarationBase,
    EnumDeclaration,
    File,
    FunctionDeclaration,
    MacroDeclaration,
    NamespaceDeclaration,
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

function getDeclarationNote(dec: DeclarationBase, addHeader: boolean = true): string {
    let header = "\n" + getDefaultNote(dec) + "\n";
    if (dec.innerComments.length > 0) {
        return (addHeader ? header : "") + mergeComments(dec.innerComments);
    } else if (dec.leadingComments.length > 0) {
        return (addHeader ? header : "") + mergeComments(dec.leadingComments);
    }
    return header;
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

function getBindingName(dec: BindingDeclarator | string) {
    if (typeof dec === "string") {
        return dec;
    }
    return (dec.namespace ? ((
        typeof dec.namespace === "string" ?
        dec.namespace :
        dec.namespace.name.name) + ".") : "") + dec.name.name + (dec.generics ? ("<" + dec.generics + ">") : "");
}

function getDefaultNote(dec: DeclarationBase): string {
    const name = dec.name.name;
    let text = "";
    let args = "";
    let value = "";

    if (!dec.declare) {
        const t = dec as SingleVarDeclarator;
        return "```ds\n(undefined variable) " + t.name.name +
            (t.binding ? (": " + getBindingName(t.binding)) : "") + "\n```";
    }

    switch (dec.type) {
        case "FunctionDeclaration":
            if ((dec as FunctionDeclaration).class) {
                text += "(method) " + (dec as FunctionDeclaration).class?.name.name + ".";
            } else {
                text += "(function) ";
            }
            args = getArgumentNote((dec as FunctionDeclaration).params);
            let bind = (dec as FunctionDeclaration).binding;
            value = (bind ? getBindingName(bind) : undefined) ?? "Void";
            return "```ds\n" + text + name + "(" + args + "): " + value + "\n```";

        case "PropertyDeclaration":
            const prop = dec as PropertyDeclaration;
            text = `(property) ${prop.class.name.name}.${name}`;
            if (prop.params.length > 0) {
                text += "(" + getArgumentNote(prop.params) + ")";
            }
            text += ": " + getBindingName(prop.binding);
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

function getDeclaratorNote(dec: SingleVarDeclarator | ArrayDeclarator | BindingDeclarator) {
    if (dec instanceof SingleVarDeclarator) {
        return dec.name.name + ": " + (dec.binding ? getBindingName(dec.binding) : "Variant");
    } else if (dec instanceof BindingDeclarator) {
        return getBindingName(dec);
    } else {
        let boundries = "";
        if (dec.dimensions === 1) {
            return dec.name.name + "[]: Array<" + (typeof dec.binding === "string" ?
                dec.binding : dec.binding.name.name) + ">";
        }
        for (let i = 0; i < dec.dimensions; i++) {
            if (dec.boundaries && (i < dec.boundaries.length)) {
                boundries += `[${dec.boundaries[i]}]`;
            } else {
                boundries += "[]";
            }
        }
        return dec.name.name + boundries + ": Array<" + (typeof dec.binding === "string" ?
            dec.binding : dec.binding.name.name) + ">";
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

function getDeclarationFromScope(scope: Scope,
    name: string, namespace?: string | NamespaceDeclaration) {
    let declaredNamespace;
    const lowerName = name.toLowerCase();
    if (namespace && (
        declaredNamespace = scope.namespaces.get(
            typeof namespace === "string" ? namespace.toLowerCase() :
            namespace.name.name.toLowerCase()))) {
        for (const child of declaredNamespace.body) {
            if (child.name.name.toLowerCase() === lowerName) {
                return child;
            }
        }
    }
    return scope.classes.get(lowerName) ||
        scope.consts.get(lowerName)     ||
        scope.dims.get(lowerName)       ||
        scope.macros.get(lowerName)     ||
        scope.functions.get(lowerName)  ||
        scope.namespaces.get(lowerName);
}

function getDeclarationFromFileOrBuiltIn(
    file: File,
    name: string,
    namespace?: string | NamespaceDeclaration) {
    let find: DeclarationBase | undefined;
    if (builtInModule) {
        find = getDeclarationFromScope(builtInModule, name, namespace);
    }
    if (!find && file.scope) {
        find = getDeclarationFromScope(file.scope, name, namespace);
    }
    return find;
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

function getMemberCompletions(dec: DeclarationBase, file: File): CompletionItem[] {
    let completions: CompletionItem[] = [];
    let bindingType: ClassOrInterfaceDeclaration | EnumDeclaration | undefined;

    if (dec.type !== "ClassOrInterfaceDeclaration" &&
        dec.type !== "EnumDeclaration") {
        if (dec.type === "SingleVarDeclarator") {
            const single = dec as SingleVarDeclarator;
            if (!single.bindingType || !(
                single.bindingType instanceof ClassOrInterfaceDeclaration ||
                single.bindingType instanceof EnumDeclaration)) {
                return [];
            } else {
                bindingType = single.bindingType;
            }
        } else if (dec.type === "PropertyDeclaration") {
            const prop = dec as PropertyDeclaration;
            let bindingName = typeof prop.binding === "string" ?
                prop.binding : prop.binding.name.name;
            let find = getDeclarationFromFileOrBuiltIn(
                file, bindingName,
                (typeof prop.binding !== "string" ?
                prop.binding.namespace : undefined) ?? prop.class.namespace);
            if (!find || !(
                find instanceof ClassOrInterfaceDeclaration ||
                find instanceof EnumDeclaration)) {
                return [];
            }
            bindingType = find;
        } else if (dec.type === "FunctionDeclaration") {
            const func = dec as FunctionDeclaration;
            if (!func.binding) {
                return [];
            }
            let find = getDeclarationFromFileOrBuiltIn(file,
                typeof func.binding === "string" ?
                func.binding : func.binding.name.name,
                (typeof func.binding !== "string" ?
                func.binding.namespace : undefined) ?? func.class?.namespace);
            if (!find || !(
                find instanceof ClassOrInterfaceDeclaration ||
                find instanceof EnumDeclaration)) {
                return [];
            }
            bindingType = find;
        } else if (dec.type === "ArrayDeclarator") {
            if (!builtInModule) {
                return [];
            }
            let arr = getDeclarationFromScope(builtInModule, "Array");
            if (!arr) {
                return [];
            }
            bindingType = arr as ClassOrInterfaceDeclaration;
        } else {
            return [];
        }
    } else {
        bindingType = dec.type === "ClassOrInterfaceDeclaration" ?
            dec as ClassOrInterfaceDeclaration :
            dec as EnumDeclaration;
    }

    if (!bindingType) {
        return [];
    }

    // Member
    if (bindingType instanceof ClassOrInterfaceDeclaration) {
        bindingType.properties.forEach(prop => {
            completions.push(getCompletionFromDeclarationBase(prop));
        });
        bindingType.methods.forEach(method => {
            completions.push(getCompletionFromDeclarationBase(method));
        });
    } else {
        bindingType.enumItems.forEach(enumItem => {
            completions.push(getCompletionFromDeclarationBase(enumItem));
        });
    }
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
                    return getMemberCompletions(dec, file);
                }
            }
            return [];
        }
        //
        let ahead = positionAt(file.program.body, pos, false, 0);
        let def: DeclarationBase = ahead.extra["declaration"];
        if (def) {
            return getMemberCompletions(def, file);
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


export function getSignatureHelp(func: FunctionDeclaration, curCount: number, otherNote?: string) {
    let note = func.name.name + "(";
    for (let i = 0; i < func.params.length; ++i) {
        const param = func.params[i];
        let argContent = (param.paramArray ? "..." : "") + getDeclaratorNote(param.declarator);
        if (param.optional) {
            argContent = "[" + argContent + "]";
        }
        if (curCount === i) {
            argContent = "**" + argContent + "**";
        }
        if (i === 0) {
            note += argContent;
        } else {
            note += ", " + argContent;
        }
    }
    note += "): " + (func.binding ?
        (typeof func.binding === "string" ? func.binding : func.binding.name.name) :
        "Void");
    return note + (otherNote ?? "");
}

export function getSignatureHelpFromFunction(func: CallExpression) {
    const dec: FunctionDeclaration | undefined = func.callee.extra["declaration"];
    if (!dec) {
        return null;
    }
    let label = getSignatureHelp(dec, func.arguments.length);
    let documents: MarkupContent = {
        kind: MarkupKind.Markdown,
        value: getDeclarationNote(dec, false)
    };
    const help: SignatureHelp = {
        signatures: [
            {
                label: label,
                documentation: documents
            }
        ],
        activeParameter: null,
        activeSignature: null
    };
    return help;
}
