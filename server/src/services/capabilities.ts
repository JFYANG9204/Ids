import { existsSync, readdirSync } from "fs";
import { dirname, isAbsolute, resolve } from "path";
import {
    CodeAction,
    CodeActionContext,
    CodeActionKind,
    Command,
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    Definition,
    Diagnostic,
    DocumentLink,
    DocumentLinkParams,
    Hover,
    Location,
    MarkupKind,
    ParameterInformation,
    Position,
    Range,
    RenameParams,
    SignatureHelp,
    SignatureInformation,
    TextDocumentEdit,
    TextEdit,
    WorkspaceEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { builtInModule } from "../declaration";
import { getAllIncludeInFile } from "../fileHandler/load";
import { getFileFsPath, getFsPathToUri, normalizeFileNameResolve } from "../fileHandler/path";
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
    Identifier,
    MacroDeclaration,
    MemberExpression,
    MetadataBase,
    NamespaceDeclaration,
    NodeBase,
    PreIncludeStatement,
    PropertyDeclaration,
    SingleVarDeclarator
} from "../lib/types";
import {
    charCodes,
    isIdentifierChar,
    Scope
} from "../lib/util";
import { distanceTo, positionAtInfo } from "./position";





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


export {
    keywordsCompletions,
    preKeywordsCompletions,
    builtInCompletions
};

/////////////////////////


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

/**
 * ????????????????????????????????????
 *
 * + FunctionDeclaration     - Method / Function
 * + PropertyDeclaration     - Property
 * + ClassOrInterface        - Class / Interface
 * + NameSpace               - Module
 * + SingleVar/Arr/Arg/Macro - Variable
 * + EnumDeclaration         - Enum
 * + EnunItemDeclarator      - EnumMember
 * + Const                   - Constant
 *
 * @param dec ????????????
 * @returns ????????????
 */
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


/**
 * ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
 * ???????????????????????????
 *
 * @param dec ????????????
 * @param addHeader ???????????????????????????????????????
 * @returns
 */
function getDeclarationNote(dec: DeclarationBase, addHeader: boolean = true): string {

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

/**
 * ???????????????????????????????????????
 *
 * + ?????????????????????????????????????????????????????????
 * + ??????`BindingDeclarator`?????????`namespace.class(<generic>)?`???????????????
 *
 * @param dec ????????????
 * @returns
 */
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

/**
 * ?????????????????????`Namespace`????????????????????????????????????
 * @param dec ????????????
 * @returns
 */
function getDeclarationNamespace(dec: DeclarationBase) {
    let ns: string | NamespaceDeclaration | undefined;
    switch (dec.type) {
        case "PropertyDeclaration":
            ns = (dec as PropertyDeclaration).class.namespace;
            break;
        case "FunctionDeclaration":
            let func = dec as FunctionDeclaration;
            ns = func.class ? func.class.namespace : func.namespace;
            break;
        case "EnumDeclaration":
            let enumerator = dec as EnumDeclaration;
            ns = enumerator.namespace;
            break;
        default:
            break;
    }
    if (typeof ns === "string") {
        return ns + ".";
    } else if (ns) {
        return ns.name.name + ".";
    }
    return "";
}

/**
 * ??????`Metadata`?????????????????????????????? ??????`Metadata`?????????????????????
 *
 * + MetadataCategoricalVariable        - Categorical
 * + MetadataLongVariable               - Long
 * + MetadataDoubleVariable             - Categorical
 * + MetadataTextVariable               - Long
 * + MetadataDateVariable               - Double
 * + MetadataBooleanVariable            - Text
 * + MetadataInfoVariable               - Date
 * + MetadataCategoricalLoopVariable    - Boolean
 * + MetadataNumericLoopVariable        - Info
 * + MetadataGridVariable               - Categorical Loop
 * + MetadataBlockVariable              - Numeric Loop
 * + MetadataPageVariable               - Grid
 * + MetadataCompoundVariable           - Block
 * + MetadataDataBaseNonLoopQuestion    - Page
 * + MetadataDataBaseLoopQuestion       - Compound
 *
 *
 * @param dec
 * @returns
 */
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

/**
 * ??????`DeclarationBase`???????????????`Completion`??????
 * @param dec ????????????
 * @param name ???????????????????????????????????????????????????
 * @returns
 */
function getCompletionFromDeclarationBase(
    dec: DeclarationBase, name?: string): CompletionItem {

    function getDeclaratorName(declarator: DeclarationBase) {
        if (declarator.type === "ConstDeclarator") {
            return (declarator as ConstDeclarator).declarator.name.name;
        } else if (declarator instanceof MetadataBase) {
            return declarator.header.name.name;
        }
        return declarator.name.name;
    }

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

/**
 * ??????`SingleVarDeclaration`,`ArrayDeclaration`,`BindingDeclarator`???????????????????????????
 * ???????????????????????????
 *
 * @param dec ????????????
 * @param isOptionalParam ??????????????????????????????
 * @returns
 */
function getDeclaratorNote(
    dec: SingleVarDeclarator | ArrayDeclarator | BindingDeclarator,
    isOptionalParam = false) {
    if (dec.type === "SingleVarDeclarator") {
        const single = dec as SingleVarDeclarator;
        return single.name.name + (isOptionalParam ? "?" : "") + ": " +
            (single.bindingType ? getBindingName(single.bindingType) :
            (single.binding ? getBindingName(single.binding) : "Variant"));
    } else if (dec.type === "BindingDeclarator") {
        return getBindingName(dec as BindingDeclarator);
    } else {
        const arr = dec as ArrayDeclarator;
        let boundries = "";
        if (arr.dimensions === 1) {
            return arr.name.name + "[]" + (isOptionalParam ? "?" : "") + ": Array<" + (typeof arr.binding === "string" ?
            arr.binding : arr.binding.name.name) + ">";
        }
        for (let i = 0; i < arr.dimensions; i++) {
            if (arr.boundaries && (i < arr.boundaries.length)) {
                boundries += `[${arr.boundaries[i]}]`;
            } else {
                boundries += "[]";
            }
        }
        return arr.name.name + boundries + (isOptionalParam ? "?" : "") + ": Array<" + (typeof arr.binding === "string" ?
            arr.binding : arr.binding.name.name) + ">";
    }
}

/**
 * ??????`DeclarationBase`???????????????????????????????????????,
 * ?????????`(function) name(params?: type): type`
 *
 *
 * @param dec ????????????
 * @param appendMd ????????????????????????```
 * @returns
 */
function getDefaultNote(dec: DeclarationBase, appendMd: boolean = true): string {
    const name = dec.name.name;
    let text = "";
    let args = "";
    let value = "";

    if (dec instanceof MetadataBase) {
        text = dec.header.name.name;
    }

    function getArgumentNote(args: Array<ArgumentDeclarator>) {
        let note = "";
        args.forEach((param, index) => {
            if (index > 0) { note += ", "; }
            note += getDeclaratorNote(param.declarator, param.optional);
        });
        return note;
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
            return appendMd ? ("```ts\n" + text + name + "(" + args + "): " + value + "\n```") :
                (text + name + "(" + args + "): " + value);

        case "PropertyDeclaration":
            const prop = dec as PropertyDeclaration;
            text = `(property) ${namespace}${prop.class.name.name}.${name}`;
            if (prop.params.length > 0) {
                text += "(" + getArgumentNote(prop.params) + ")";
            }
            text += ": " + getBindingName(prop.binding);
            return appendMd ? "```ts\n" + text + "\n```" : text;

        case "SingleVarDeclarator":
            const dim = dec as SingleVarDeclarator;

            let header = "variable";
            if (!dim.declare) {
                header = "undefined variable";
            }

            if (dec.treeParent?.type === "ArgumentDeclarator") {
                return appendMd ?
                    ("```ts\n" + `(parameter) ${getDeclaratorNote(dim)}\n` + "```") :
                    (`(parameter) ${getDeclaratorNote(dim)}`);
            } else if (dec.treeParent?.type === "ConstDeclarator") {
                return appendMd ?
                    ("```ts\n" + `(const) ${getDeclaratorNote(dim)}\n` + "```") :
                    (`(const) ${getDeclaratorNote(dim)}`);
            }
            return appendMd ? ("```ts\n" + `(${header}) ${getDeclaratorNote(dim)}\n` + "```") :
                (`(${header}) ${getDeclaratorNote(dim)}`);

        case "ArrayDeclarator":
            const arr = dec as ArrayDeclarator;
            if (dec.treeParent?.type === "ArgumentDeclarator") {
                return appendMd ? ("```ts\n" + `(parameter) ${getDeclaratorNote(arr)}\n` + "```") :
                    (`(parameter) ${getDeclaratorNote(arr)}`);
            }
            return appendMd ? ("```ts\n" + `(variable) ${getDeclaratorNote(arr)}\n` + "```") :
                (`(variable) ${getDeclaratorNote(arr)}`);

        case "MacroDeclaration":
            const macro = dec as MacroDeclaration;
            return appendMd ? ("```ts\n(macro) " + macro.name.name +
                (macro.initValue ? " = " + macro.initValue : "") + "\n```") :
                ("(macro) " + macro.name.name +
                (macro.initValue ? " = " + macro.initValue : ""));

        case "ClassOrInterfaceDeclaration":
            const classOrInterface = dec as ClassOrInterfaceDeclaration;
            if (classOrInterface.name.name === "Variant") {
                return appendMd ? ("```ts\nany\n```") : "any";
            }
            if (classOrInterface.defType === "interface") {
                text += "(interface) " + namespace;
            } else {
                text += "(class) " + namespace;
            }
            return appendMd ? ("```ts\n" + text + classOrInterface.name.name + "\n```") :
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
            return appendMd ? "```ts\n" + text + "\n```" : text;

        default:
            if (dec.type.startsWith("Metadata")) {
                text = getMetadataDeclarationNote(dec);
                return appendMd ? ("```ts\n" + text + "\n```") :
                    text;
            }
            return "";
    }
}

/**
 * ???`Scope`??????????????????????????????????????????????????????Scope????????????????????????`Scope.dim`
 * ????????????????????????`Scope.undefined`
 *
 * @param scope
 * @param inFunction
 * @returns
 */
function getCompletionsFromScope(scope: Scope, inFunction = false) {

    function getCompletionsFromDeclarations(decs: Map<string, DeclarationBase>): CompletionItem[] {
        const completions: CompletionItem[] = [];
        decs.forEach((value) => {
            completions.push(getCompletionFromDeclarationBase(value));
        });
        return completions;
    }

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

/**
 * ??????`DeclarationBase`???????????????????????????
 *
 * + ???????????????`PropertyDeclaration`??????`FunctionDeclartion`??????????????????????????????????????????
 *
 * @param dec ???????????????????????????
 * @param file ????????????????????????
 * @returns
 */
function getMemberCompletions(dec: DeclarationBase, file: File): CompletionItem[] {
    let completions: CompletionItem[] = [];
    let bindingType: ClassOrInterfaceDeclaration | EnumDeclaration | undefined;
    let metadataType: string | undefined;

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
        let find = getDeclarationFromScope(builtInModule.scope, name, namespace);
        if (!find) {
            find = getDeclarationFromScope(file.scope, name, namespace);
        }
        return find;
    }

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
                let arr = getDeclarationFromScope(builtInModule.scope, "Array");
                if (!arr) {
                    return [];
                }
                bindingType = arr as ClassOrInterfaceDeclaration;
                break;

            case "MetadataCategoricalVariable":
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

const EMPTY_COMPLETIONLIST = CompletionList.create([], true);

export { EMPTY_COMPLETIONLIST };

async function getCompletionAtPostion(position: Position,
    textDocument?: TextDocument,
    file?: File) : Promise<CompletionList> {

    if (!file || !textDocument) {
        return EMPTY_COMPLETIONLIST;
    }

    let pos = textDocument.offsetAt(position);
    let text = textDocument.getText();
    let triggerChar = text.charCodeAt(pos - 1);
    let lastChar = text.charCodeAt(pos - 2);

    if (triggerChar === charCodes.numberSign) {
        return CompletionList.create(preKeywordsCompletions, false);
    }

    let info = positionAtInfo(file.program.body, pos - 1);
    if (info.rejectCompletion) {
        return EMPTY_COMPLETIONLIST;
    }

    // #include "path"
    if (info.preInclude){
        if (distanceTo(info.preInclude.inc, pos - 1) === 0) {
            if (triggerChar === charCodes.backslash || triggerChar === charCodes.slash) {
                return CompletionList.create(getPathCompletion(info.preInclude.path), false);
            }
            if (triggerChar === charCodes.quotationMark) {
                return CompletionList.create(getPathCompletion(dirname(info.preInclude.loc.fileName)));
            }
        }
        return EMPTY_COMPLETIONLIST;
    }

    if (triggerChar === charCodes.quotationMark) {
        return EMPTY_COMPLETIONLIST;
    }

    if (triggerChar === charCodes.dot) {
        // with ???
        if (lastChar !== charCodes.rightParenthesis   &&
            lastChar !== charCodes.rightSquareBracket &&
            !isIdentifierChar(lastChar)) {

            if (info.withNode) {
                let withDec: DeclarationBase = info.withNode.extra["declaration"];
                if (withDec) {
                    return CompletionList.create(getMemberCompletions(withDec, file), false);
                }
            }
            return EMPTY_COMPLETIONLIST;

        }
        // identifier.
        if (info.id && !(info.id.treeParent instanceof MemberExpression)) {
            let dec: DeclarationBase = info.id.extra["declaration"];
            if (dec) {
                return CompletionList.create(getMemberCompletions(dec, file), false);
            }
        }
        // object.member. ??? object.method(). ??? function(). ??? object.member[]. ??? array[].
        if (info.caller) {
            let dec: DeclarationBase = info.caller.extra["declaration"];
            if (dec) {
                return CompletionList.create(getMemberCompletions(dec, file), false);
            }
        }

        return EMPTY_COMPLETIONLIST;
    }

    let completions: CompletionItem[] = [];
    let inFunction = false;
    if (info.funcNode) {
        completions.push(...getCompletionsFromScope(info.funcNode.scope));
        inFunction = true;
    }
    if (info.eventNode) {
        completions.push(...getCompletionsFromScope(info.eventNode.scope, inFunction));
    }
    completions.push(...getCompletionsFromScope(file.scope, inFunction));

    if (!inFunction) {
        completions.push(...builtInVarCompletions);
    }
    completions.push(...builtInConstCompletions);
    completions.push(...builtInFunctionCompletions);
    completions.push(...keywordsCompletions);
    return CompletionList.create(completions, true);
}

export { getCompletionAtPostion };

const EMPTYE_HOVER: Hover = { contents: [] };

export { EMPTYE_HOVER };

async function getHoverAtPosition(position: Position,
    textDocument?: TextDocument,
    file?: File
): Promise<Hover | null> {

    if (!file || !textDocument) {
        return null;
    }

    let pos = textDocument.offsetAt(position);
    let info = positionAtInfo(file.program.body, pos);
    if (!info.id) {
        return null;
    }
    let dec: DeclarationBase = info.id.extra["declaration"];
    if (dec) {
        return {
            contents: {
                kind: MarkupKind.Markdown,
                value: getDeclarationNote(dec)
            }
        };
    }
    return null;
}

export { getHoverAtPosition };

async function getSignatureHelpAtPostion(position: Position,
    textDocument?: TextDocument, file?: File
): Promise<SignatureHelp | null> {

    if (!file || !textDocument) {
        return null;
    }

    let pos = textDocument.offsetAt(position);
    let info = positionAtInfo(file.program.body, pos);
    let func: DeclarationBase;
    if (info.caller instanceof CallExpression &&
        ((func = info.caller.callee.extra["declaration"]) instanceof FunctionDeclaration)) {

        let note = func.name.name + "(";
        let paramInfo: ParameterInformation[] = [];
        for (let i = 0; i < func.params.length; ++i) {
            const param = func.params[i];
            let argContent = (param.paramArray ? "..." : "") + getDeclaratorNote(param.declarator, param.optional);
            paramInfo.push({ label: argContent });
            if (i === 0) {
                note += argContent;
            } else {
                note += ", " + argContent;
            }
        }
        note += "): " + (func.binding ?
            (typeof func.binding === "string" ? func.binding : func.binding.name.name) :
            "Void");
        let signatureInfo: SignatureInformation = {
            label: note,
            documentation: {
                kind: MarkupKind.Markdown,
                value: getDeclarationNote(func, false)
            },
            parameters: paramInfo
        };
        let callByDot = info.caller.callee.extra["callByDot"];
        signatureInfo.activeParameter = callByDot ? info.caller.arguments.length + 1 : info.caller.arguments.length;
        return {
            signatures: [ signatureInfo ],
            activeParameter: null,
            activeSignature: null
        };
    }
    return null;
}

export { getSignatureHelpAtPostion };

async function getReferenceAtPosition(position: Position,
    textDocument?: TextDocument,
    file?: File
): Promise<Location[] | null> {

    if (!file || !textDocument) {
        return null;
    }

    let pos = textDocument.offsetAt(position);
    let info = positionAtInfo(file.program.body, pos - 1);

    let dec: DeclarationBase;
    if (!info.id || !(dec = info.id.extra["declaration"])) {
        return null;
    }

    let ref: Location[] = [];
    for (let i = 0; i < dec.referenced.length; ++i) {
        const cur = dec.referenced[i];
        const uri = getFsPathToUri(cur.loc.fileName);
        ref.push(Location.create(uri,
            Range.create(
                Position.create(cur.loc.start.line - 1, cur.loc.start.column),
                Position.create(cur.loc.end.line - 1, cur.loc.end.column))));
    }
    return ref;
}

export { getReferenceAtPosition };

async function getDefinitionAtPosition(position: Position,
    textDocument?: TextDocument, file?: File
): Promise<Definition | null> {

    if (!file || !textDocument) {
        return null;
    }
    let pos = textDocument.offsetAt(position);
    let info = positionAtInfo(file.program.body, pos);

    let dec: DeclarationBase;
    if (!info.id || !(dec = info.id.extra["declaration"])) {
        return null;
    }

    const uri = getFsPathToUri(dec.loc.fileName);
    let start = Position.create(dec.loc.start.line - 1, dec.loc.start.column);
    let end = Position.create(dec.loc.end.line - 1, dec.loc.end.column);
    return { uri, range: { start, end } };
}

export { getDefinitionAtPosition };

const actionMessages = {
    ignoreTypeError:     "????????????????????????????????????",
    ignorePathError:     "????????????????????????????????????",
    ignoreThisTypeError: "?????????????????????",
    ignoreThisPathError: "?????????????????????",
    setFileAsMetadata:   "?????????????????????Metadata"
};

function createTextEdit(start: Position, end: Position, newText: string): TextEdit {
    return {
        newText,
        range: Range.create(start, end)
    };
}

function createWorkspaceEditorNotReplace(uri: string, start: Position, end: Position, text: string) {
    let textEdit = createTextEdit(start, end ,text);
    let edit = TextDocumentEdit.create({ version: null, uri }, [ textEdit ]);
    let workspaceEdit: WorkspaceEdit = {
        changes: { uri: [ textEdit ] },
        documentChanges: [ edit ]
    };
    return workspaceEdit;
}

function createWorkspaceEditorInsertContent(uri: string, start: Position, text: string) {
    return createWorkspaceEditorNotReplace(uri, start, start, text + "\n");
}

function createCodeAction(uri: string, title: string, text: string) {
    return CodeAction.create(title, createWorkspaceEditorInsertContent(uri, Position.create(0, 0), text), CodeActionKind.QuickFix);
}

function createCodeActionByCommand(title: string, text: string, line: number) {
    return CodeAction.create(title, Command.create(title, "ids.insertTextAtPosition", text, line), CodeActionKind.QuickFix);
}

function createRenameTextEdit(node: NodeBase,
    changes: {[uri: string]: TextEdit[]}, newText: string) {
    let start = Position.create(node.loc.start.line - 1, node.loc.start.column);
    let end = Position.create(node.loc.end.line - 1, node.loc.end.column);
    let uri = getFsPathToUri(node.loc.fileName);
    let edit = createTextEdit(start, end ,newText);
    if (changes[uri]) {
        changes[uri].push(edit);
    } else {
        changes[uri] = [ edit ];
    }
}

async function getCodeAction(context: CodeActionContext,
    uri: string
): Promise<CodeAction[]> {

    const diags = context.diagnostics;
    const actions: CodeAction[] = [];

    let ignoreAllErrorAction = createCodeAction(
        uri,
        actionMessages.ignoreTypeError,
        "'ignore-type-error");

    let ignoreAllPathErrorAction = createCodeAction(
        uri,
        actionMessages.ignorePathError,
        "'ignore-path-error");

    let setFileAsMetadata = createCodeAction(
        uri,
        actionMessages.setFileAsMetadata,
        "'metadata");

    function isEqualRange(r1: Range, r2: Range) {
        return  r1.start.character === r2.start.character &&
                r1.start.line      === r2.start.line      &&
                r1.end.character   === r2.end.character   &&
                r1.end.line        === r2.end.line;
    }

    let filteredArr: Diagnostic[] = [];
    diags.forEach(diag => {
        if (!filteredArr.find(err => isEqualRange(err.range, diag.range))) {
            actions.push(
                createCodeActionByCommand(actionMessages.ignoreThisPathError, "ignore-path-error", diag.range.start.line),
                createCodeActionByCommand(actionMessages.ignoreThisTypeError, "ignore-type-error", diag.range.start.line),
            );
            filteredArr.push(diag);
        }
    });

    actions.push(ignoreAllErrorAction, ignoreAllPathErrorAction, setFileAsMetadata);
    return actions;
}

export { getCodeAction };

async function getRenameLocation(params: RenameParams,
    textDocument?: TextDocument, file?: File
): Promise<WorkspaceEdit | null> {

    if (!file || !textDocument) {
        return null;
    }

    let pos = textDocument.offsetAt(params.position);
    let info = positionAtInfo(file.program.body, pos);

    let def: DeclarationBase | undefined;
    if (!info.id || !(def = info.id.extra["declaration"])) {
        return null;
    }

    let changes: {[uri: string]: TextEdit[]} = {};
    let textEdits: TextDocumentEdit[] = [];
    def.referenced.forEach(ref => createRenameTextEdit(ref, changes, params.newName));

    Object.keys(changes).forEach(k => {
        let change = changes[k];
        textEdits.push(TextDocumentEdit.create({ uri: k, version: null }, change));
    });

    return { changes, documentChanges: textEdits };

}

export { getRenameLocation };

async function getDocumentLinks(document?: TextDocument, file?: File) {
    const links: DocumentLink[] = [];
    if (!document || !file) {
        return links;
    }
    Array.from(file.includes.values()).forEach(inc => {
        let preIncNode;
        if (inc.treeParent && ((preIncNode = inc.treeParent) instanceof PreIncludeStatement) &&
            preIncNode.path !== "" && existsSync(preIncNode.path)) {
            links.push({
                range: {
                    start: {
                        line: preIncNode.inc.loc.start.line - 1,
                        character: preIncNode.inc.loc.start.column
                    },
                    end: {
                        line: preIncNode.inc.loc.end.line - 1,
                        character: preIncNode.inc.loc.end.column
                    }
                },
                target: getFsPathToUri(preIncNode.path)
            });
        }
    });
    return links;
}

export { getDocumentLinks };
