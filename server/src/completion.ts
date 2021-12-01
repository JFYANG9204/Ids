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
    MarkupKind,
    ParameterInformation,
    SignatureHelp,
    SignatureInformation,
} from 'vscode-languageserver-types';
import { builtInModule } from "./declaration";
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
    ConstDeclarator,
    DeclarationBase,
    EnumDeclaration,
    File,
    FunctionDeclaration,
    MacroDeclaration,
    MetadataBase,
    NamespaceDeclaration,
    PreIncludeStatement,
    PropertyDeclaration,
    SingleVarDeclarator,
} from "./lib/types";
import { charCodes } from "./lib/util";
import { isIdentifierChar } from "./lib/util/identifier";
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

const builtInVarCompletions: CompletionItem[] = [];
const builtInConstCompletions: CompletionItem[] = [];
const builtInFunctionCompletions: CompletionItem[] = [];

if (builtInModule.scope) {
    setBuiltInCompletions(builtInModule.scope.dims,      CompletionItemKind.Variable, builtInVarCompletions);
    setBuiltInCompletions(builtInModule.scope.consts,    CompletionItemKind.Constant, builtInConstCompletions);
    setBuiltInCompletions(builtInModule.scope.functions, CompletionItemKind.Function, builtInFunctionCompletions);
    setBuiltInCompletions(builtInModule.scope.macros,    CompletionItemKind.Variable, builtInConstCompletions);
}

const builtInCompletions = builtInConstCompletions.concat(
                                builtInVarCompletions,
                                builtInFunctionCompletions);

function setBuiltInCompletions(
    defs: Map<string, DeclarationBase>,
    kind: CompletionItemKind,
    target: CompletionItem[]) {
    defs.forEach(def => {
        target.push({
            label: def.name.name,
            kind: kind,
            detail: getDefaultNote(def, false),
            documentation: {
                kind: MarkupKind.Markdown,
                value: getDeclarationNote(def, false)
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
        case "ArgumentDeclarator":           return CompletionItemKind.Variable;
        case "ConstDeclaration":             return CompletionItemKind.Constant;
        default:
            if (dec instanceof MetadataBase) {
                return CompletionItemKind.Field;
            }
            return CompletionItemKind.Text;
    }
}

function getDeclarationNote(dec: DeclarationBase, addHeader: boolean = true): string {
    let header = "\n" + getDefaultNote(dec) + "\n";
    if (dec.innerComments.length > 0) {
        return (addHeader ? header : "") + mergeComments(dec.innerComments, dec);
    } else if (dec.leadingComments.length > 0) {
        return (addHeader ? header : "") + mergeComments(dec.leadingComments, dec);
    } else if (!addHeader) {
        return "";
    }
    return header;
}

function mergeComments(comments: Array<Comment>, dec: DeclarationBase) {
    if (comments[comments.length - 1].type === "CommentBlock") {
        return removeAheadSpace(comments[comments.length - 1].value);
    }

    let maybeFuncParams: string[] = [];
    if (dec instanceof FunctionDeclaration) {
        dec.params.forEach(param => maybeFuncParams.push(param.declarator.name.name));
    }

    let text = "";
    comments.forEach(comment => {
        text += formatStatement(comment.value, maybeFuncParams) + "\n";
    });

    return text;
}

function removeAheadSpace(comment: string) {
    const regexp = /\n\s*/gm;
    return comment.replace(regexp, "\n");
}

function formatStatement(comment: string, funcParams: string[]): string {

    let result = comment;

    while (result.startsWith("'") || result.startsWith(" ")) {
        result = result.slice(1);
    }

    if (funcParams.length > 0) {
        let param = funcParams.join("|") + "|return";
        let regex = new RegExp(`(${param})\s*.*?`, "i");
        if (regex.test(result)) {
            let paramReg = new RegExp(param, "i");
            result = result.replace(paramReg, word => { return "`" + word + "`"; });
            result = "+ " + result;
        }
    }

    return result;
}

function getBindingName(dec: BindingDeclarator | string) {
    if (typeof dec === "string") {
        return dec;
    }
    let namespace = "";
    if (dec.namespace) {
        if (typeof dec.namespace === "string") {
            namespace = dec.namespace + ".";
        } else {
            namespace = dec.namespace.name.name + ".";
        }
    }

    let generic = "";
    if (dec.generics) {
        generic = "<" + dec.generics + ">";
    }

    return namespace + dec.name.name + generic;
}

function getNamespaceText(ns: string | NamespaceDeclaration | undefined) {
    if (typeof ns === "string") {
        return ns + ".";
    } else if (ns) {
        return ns.name.name + ".";
    }
    return "";
}

function getDeclarationNamespace(dec: DeclarationBase) {

    let ns: string | NamespaceDeclaration | undefined;

    if (dec.type === "PropertyDeclaration") {
        ns = (dec as PropertyDeclaration).class.namespace;
    }

    if (dec.type === "FunctionDeclaration") {
        let func = dec as FunctionDeclaration;
        ns = func.class ? func.class.namespace : func.namespace;
    }

    if (dec.type === "EnumDeclaration") {
        let enumerator = dec as EnumDeclaration;
        ns = enumerator.namespace;
    }

    return getNamespaceText(ns);
}

function getDefaultNote(dec: DeclarationBase, appendMd: boolean = true): string {
    const name = dec.name.name;
    let text = "";
    let args = "";
    let value = "";

    if (dec instanceof MetadataBase) {
        text = dec.header.name.name;
    }

    let namespace = getDeclarationNamespace(dec);
    switch (dec.type) {
        case "FunctionDeclaration":
            if ((dec as FunctionDeclaration).class) {
                text += "(method) " + namespace + (dec as FunctionDeclaration).class?.name.name + ".";
            } else {
                text += "(function) " + namespace;
            }
            args = getArgumentNote((dec as FunctionDeclaration).params);
            let bind = (dec as FunctionDeclaration).binding;
            value = (bind ? getBindingName(bind) : undefined) ?? "Void";
            return appendMd ? ("```\n" + text + name + "(" + args + "): " + value + "\n```") :
                (text + name + "(" + args + "): " + value);

        case "PropertyDeclaration":
            const prop = dec as PropertyDeclaration;
            text = `(property) ${namespace}${prop.class.name.name}.${name}`;
            if (prop.params.length > 0) {
                text += "(" + getArgumentNote(prop.params) + ")";
            }
            text += ": " + getBindingName(prop.binding);
            return appendMd ? "```\n" + text + "\n```" : text;

        case "SingleVarDeclarator":
            const dim = dec as SingleVarDeclarator;

            let header = "variable";
            if (!dim.declare) {
                header = "undefined variable";
            }

            if (dec.treeParent?.type === "ArgumentDeclarator") {
                return appendMd ?
                    ("```\n" + `(parameter) ${getDeclaratorNote(dim)}\n` + "```") :
                    (`(parameter) ${getDeclaratorNote(dim)}`);
            }
            return appendMd ? ("```\n" + `(${header}) ${getDeclaratorNote(dim)}\n` + "```") :
                (`(${header}) ${getDeclaratorNote(dim)}`);

        case "ArrayDeclarator":
            const arr = dec as ArrayDeclarator;
            if (dec.treeParent?.type === "ArgumentDeclarator") {
                return appendMd ? ("```\n" + `(parameter) ${getDeclaratorNote(arr)}\n` + "```") :
                    (`(parameter) ${getDeclaratorNote(arr)}`);
            }
            return appendMd ? ("```\n" + `(variable) ${getDeclaratorNote(arr)}\n` + "```") :
                (`(variable) ${getDeclaratorNote(arr)}`);

        case "MacroDeclaration":
            const macro = dec as MacroDeclaration;
            return appendMd ? ("```\n(macro) " + macro.name.name +
                (macro.initValue ? " = " + macro.initValue : "") + "\n```") :
                ("(macro) " + macro.name.name +
                (macro.initValue ? " = " + macro.initValue : ""));

        case "ClassOrInterfaceDeclaration":
            const classOrInterface = dec as ClassOrInterfaceDeclaration;
            if (classOrInterface.defType === "interface") {
                text += "(interface) " + namespace;
            } else {
                text += "(class) " + namespace;
            }
            return appendMd ? ("```\n" + text + classOrInterface.name.name + "\n```") :
                (text + classOrInterface.name.name);

        case "ConstDeclarator":
            const constant = dec as ConstDeclarator;
            text += "(constant) ";
            if (constant.treeParent?.type === "ClassOrInterfaceDeclaration") {
                const parent = constant.treeParent as ClassOrInterfaceDeclaration;
                text += parent.name.name + ".";
            }
            text += constant.declarator.name.name;
            switch (constant.init.type) {
                case "StringLiteral":
                case "NumericLiteral":
                case "BooleanLiteral":
                case "DecimalLiteral":
                case "NullLiteral":
                    text += " = " + constant.init.extra["raw"];
                    break;
                default:
                    break;
            }
            return appendMd ? "```\n" + text + "\n```" : text;

        default:
            if (dec.type.startsWith("Metadata")) {
                text = getMetadataDeclarationNote(dec);
                return appendMd ? ("```\n" + text + "\n```") :
                    text;
            }
            return "";
    }
}

function getMetadataDeclarationNote(dec: DeclarationBase) {
    if (!(dec instanceof MetadataBase)) {
        return "";
    }

    let text = "(metadata) " + (dec as MetadataBase).header.name.name;

    switch (dec.type) {
        case "MetadataCategoricalVariable":       text += ": Categorical";      break;
        case "MetadataLongVariable":              text += ": Long";             break;
        case "MetadataDoubleVariable":            text += ": Double";           break;
        case "MetadataTextVariable":              text += ": Text";             break;
        case "MetadataDateVariable":              text += ": Date";             break;
        case "MetadataBooleanVariable":           text += ": Boolean";          break;
        case "MetadataInfoVariable":              text += ": Info";             break;
        case "MetadataCategoricalLoopVariable":   text += ": Categorical Loop"; break;
        case "MetadataNumericLoopVariable":       text += ": Numeric Loop";     break;
        case "MetadataGridVariable":              text += ": Grid";             break;
        case "MetadataBlockVariable":             text += ": Block";            break;
        case "MetadataPageVariable":              text += ": Page";             break;
        case "MetadataCompoundVariable":          text += ": Compound";         break;
        case "MetadataDataBaseNonLoopQuestion":
        case "MetadataDataBaseLoopQuestion":
            text += ": Database Questions";
            break;

        default:
            break;
    }

    return text;
}

function getDeclaratorNote(dec: SingleVarDeclarator | ArrayDeclarator | BindingDeclarator) {
    if (dec.type === "SingleVarDeclarator") {
        const single = dec as SingleVarDeclarator;
        return single.name.name + ": " +
            (single.bindingType ? getBindingName(single.bindingType) :
            (single.binding ? getBindingName(single.binding) : "Variant"));
    } else if (dec.type === "BindingDeclarator") {
        return getBindingName(dec as BindingDeclarator);
    } else {
        const arr = dec as ArrayDeclarator;
        let boundries = "";
        if (arr.dimensions === 1) {
            return arr.name.name + "[]: Array<" + (typeof arr.binding === "string" ?
            arr.binding : arr.binding.name.name) + ">";
        }
        for (let i = 0; i < arr.dimensions; i++) {
            if (arr.boundaries && (i < arr.boundaries.length)) {
                boundries += `[${arr.boundaries[i]}]`;
            } else {
                boundries += "[]";
            }
        }
        return arr.name.name + boundries + ": Array<" + (typeof arr.binding === "string" ?
            arr.binding : arr.binding.name.name) + ">";
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
        return declaredNamespace.body.get(lowerName);
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
    if (builtInModule.scope) {
        find = getDeclarationFromScope(builtInModule.scope, name, namespace);
    }
    if (!find && file.scope) {
        find = getDeclarationFromScope(file.scope, name, namespace);
    }
    return find;
}

function getDeclaratorName(declarator: DeclarationBase) {
    if (declarator.type === "ConstDeclarator") {
        return (declarator as ConstDeclarator).declarator.name.name;
    } else if (declarator instanceof MetadataBase) {
        return declarator.header.name.name;
    }
    return declarator.name.name;
}

function getCompletionFromDeclarationBase(
    dec: DeclarationBase, name?: string): CompletionItem {
    let type = getCompletionTypeFromDeclare(dec);
    return {
        label: name ?? getDeclaratorName(dec),
        kind: type,
        detail: getDefaultNote(dec, false),
        documentation: {
            kind: MarkupKind.Markdown,
            value: getDeclarationNote(dec, false)
        }
    };
}

function getMemberCompletions(dec: DeclarationBase, file: File): CompletionItem[] {
    let completions: CompletionItem[] = [];
    let bindingType: ClassOrInterfaceDeclaration | EnumDeclaration | undefined;
    let metadataType: string | undefined;

    if (dec.type !== "ClassOrInterfaceDeclaration" &&
        dec.type !== "EnumDeclaration") {
        let find: DeclarationBase | undefined;
        switch (dec.type) {
            case "SingleVarDeclarator":
                const single = dec as SingleVarDeclarator;
                if (!single.bindingType || !(
                    single.bindingType instanceof ClassOrInterfaceDeclaration ||
                    single.bindingType instanceof EnumDeclaration)) {
                    return [];
                } else {
                    bindingType = single.bindingType;
                    if (bindingType.name.name === "IMDMField") {
                        metadataType = "categorical";
                    }
                }
                break;

            case "PropertyDeclaration":
                const prop = dec as PropertyDeclaration;
                let bindingName = typeof prop.binding === "string" ?
                    prop.binding : prop.binding.name.name;
                find = getDeclarationFromFileOrBuiltIn(
                    file, bindingName,
                    ((prop.binding && typeof prop.binding !== "string") ?
                    prop.binding.namespace : undefined) ?? prop.class.namespace);
                if (!find || !(
                    find instanceof ClassOrInterfaceDeclaration ||
                    find instanceof EnumDeclaration)) {
                    return [];
                }
                bindingType = find;
                break;

            case "FunctionDeclaration":
                const func = dec as FunctionDeclaration;
                if (!func.binding) {
                    return [];
                }
                find = getDeclarationFromFileOrBuiltIn(file,
                    typeof func.binding === "string" ?
                    func.binding : func.binding.name.name,
                    ((func.binding && typeof func.binding !== "string") ?
                    func.binding.namespace : undefined) ?? func.class?.namespace);
                if (!find || !(
                    find instanceof ClassOrInterfaceDeclaration ||
                    find instanceof EnumDeclaration)) {
                    return [];
                }
                bindingType = find;
                break;

            case "ArrayDeclarator":
                if (!builtInModule.scope) {
                    return [];
                }
                let arr = getDeclarationFromScope(builtInModule.scope, "Array");
                if (!arr) {
                    return [];
                }
                bindingType = arr as ClassOrInterfaceDeclaration;
                break;

            case "MetadataCategoricalVariable":
                if (!builtInModule.scope) {
                    return [];
                }
                let field = getDeclarationFromScope(builtInModule.scope, "IMDMField", "MDMLib");
                if (!field) {
                    return [];
                }
                bindingType = field as ClassOrInterfaceDeclaration;
                metadataType = "categorical";
                break;

            default:
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
        bindingType.constants.forEach(constant => {
            completions.push(getCompletionFromDeclarationBase(constant));
        });
    } else {
        bindingType.enumItems.forEach(enumItem => {
            completions.push(getCompletionFromDeclarationBase(enumItem));
        });
    }

    if ((metadataType || bindingType.name.name === "IMDMField") && builtInModule.scope) {
        let categorical = getDeclarationFromScope(builtInModule.scope, "Categorical");
        (categorical as ClassOrInterfaceDeclaration).methods.forEach(method => {
            completions.push(getCompletionFromDeclarationBase(method));
        });
    }

    return completions;
}

export function getCompletionsFromDeclarations(decs: Map<string, DeclarationBase>): CompletionItem[] {
    const completions: CompletionItem[] = [];
    decs.forEach((value) => {
        completions.push(getCompletionFromDeclarationBase(value));
    });
    return completions;
}

export function getCompletionsFromScope(scope: Scope, inFunction = false) {
    let completions: CompletionItem[] = [];
    if (inFunction) {
        return completions.concat(
            getCompletionsFromDeclarations(scope.functions),
            getCompletionsFromDeclarations(scope.macros),
            getCompletionsFromDeclarations(scope.consts)
        );
    }
    completions = completions.concat(
        getCompletionsFromDeclarations(scope.dims),
        getCompletionsFromDeclarations(scope.consts),
        getCompletionsFromDeclarations(scope.macros),
        getCompletionsFromDeclarations(scope.functions),
        getCompletionsFromDeclarations(scope.undefined));
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
        let def: DeclarationBase = pre.extra["declaration"];
        if (def) {
            return getMemberCompletions(def, file);
        }
    }
    return completions;
}


export {
    keywordsCompletions,
    preKeywordsCompletions,
    builtInCompletions,
    builtInConstCompletions,
    builtInFunctionCompletions,
    builtInVarCompletions
};


export function getHoverFromDeclaration(dec: DeclarationBase): Hover {
    return {
        contents: {
            kind: MarkupKind.Markdown,
            value: getDeclarationNote(dec)
        }
    };
}


export function getSignatureHelp(func: FunctionDeclaration): SignatureInformation {
    let note = func.name.name + "(";
    let parameters: ParameterInformation[] = [];
    for (let i = 0; i < func.params.length; ++i) {
        const param = func.params[i];
        let argContent = (param.paramArray ? "..." : "") + getDeclaratorNote(param.declarator);
        if (param.optional) {
            argContent = "[" + argContent + "]";
        }
        parameters.push({ label: argContent });
        if (i === 0) {
            note += argContent;
        } else {
            note += ", " + argContent;
        }
    }
    note += "): " + (func.binding ?
        (typeof func.binding === "string" ? func.binding : func.binding.name.name) :
        "Void");
    return {
        label: note,
        documentation: {
            kind: MarkupKind.Markdown,
            value: getDeclarationNote(func, false)
        },
        parameters };
}

export function getSignatureHelpFromFunction(func: CallExpression) {
    const dec: DeclarationBase | undefined = func.callee.extra["declaration"];
    if (!dec || !(dec instanceof FunctionDeclaration)) {
        return null;
    }
    let signature = getSignatureHelp(dec);
    signature.activeParameter = func.arguments.length;
    const help: SignatureHelp = {
        signatures: [ signature ],
        activeParameter: null,
        activeSignature: null
    };
    return help;
}
