import { ParserBase } from "../base";
import { ErrorMessages } from "../parser/error-messages";
import { ErrorTemplate, ParsingError } from "../parser/errors";
import {
    ArrayDeclarator,
    ClassOrInterfaceDeclaration,
    DeclarationBase,
    EnumDeclaration,
    Expression,
    FunctionDeclaration,
    Identifier,
    MacroDeclaration,
    NamespaceDeclaration,
    NodeBase,
    SingleVarDeclarator
} from "../types";

export type RaiseFunction = (node: NodeBase, template: ErrorTemplate, warning: boolean, ...params: any) => ParsingError;

export enum ScopeFlags {
    program,
    function,
    classOrInterface,
    namespace,
    event
}

export enum BindTypes {
    var,
    const,
    function,
    classOrInterface,
    namespace,
    undefined
}

export type ScopeSearchResult = {
    type: BindTypes,
    result?: DeclarationBase
};

export class Scope {

    flags: ScopeFlags;
    withHeader: Array<DeclarationBase> = [];
    currentHeader?: DeclarationBase;
    dims: Map<string, DeclarationBase> = new Map();
    consts: Map<string, DeclarationBase> = new Map();
    macros: Map<string, MacroDeclaration> = new Map();
    functions: Map<string, FunctionDeclaration> = new Map();
    classes: Map<string, ClassOrInterfaceDeclaration> = new Map();
    namespaces: Map<string, NamespaceDeclaration> = new Map();
    undefined: Map<string, DeclarationBase> = new Map();

    constructor(flags: ScopeFlags) {
        this.flags = flags;
    }

    get size() {
        return this.dims.size + this.consts.size +
               this.macros.size + this.functions.size +
               this.classes.size + this.namespaces.size;
    }
}

export class ScopeHandler {

    parser: ParserBase;
    global: Scope;
    store: Scope;
    stack: Array<Scope> = [];
    raise: RaiseFunction;

    constructor(
        parser: ParserBase,
        raise: RaiseFunction,
        global?: Scope,
        store?: Scope) {
        this.parser = parser;
        this.raise = raise;
        this.global = global ?? new Scope(ScopeFlags.program);
        this.store = store ?? new Scope(ScopeFlags.program);
    }

    get inFunction() {
        return this.currentScope().flags === ScopeFlags.function;
    }

    get inWith() {
        return this.currentScope().withHeader.length > 0;
    }

    get inClassOrInterface() {
        return this.currentScope().flags === ScopeFlags.classOrInterface;
    }

    get inNameSpace() {
        return this.currentScope().flags === ScopeFlags.namespace;
    }

    get inEvent() {
        return this.currentScope().flags === ScopeFlags.event;
    }

    enter(flags: ScopeFlags) {
        this.stack.push(new Scope(flags));
    }

    exit() {
        this.stack.pop();
    }

    declareName(
        name: string,
        bindingType: BindTypes,
        node: NodeBase,
        type?: DeclarationBase) {

        const scope = this.currentScope();
        this.checkRedeclarationInScope(scope, name, node);

        if ((bindingType === BindTypes.function) &&
            node instanceof FunctionDeclaration) {
            if (this.inFunction || this.inWith) {
                this.raise(
                    node.name,
                    ErrorMessages["DontAllowDeclareFunction"],
                    false,
                    (this.inWith ? "With" : "Function或Sub")
                );
                return;
            }
            this.insertName(scope, name, node, "functions");
            return;
        }

        if ((bindingType === BindTypes.var) && (
            node instanceof SingleVarDeclarator ||
            node instanceof ArrayDeclarator     ||
            node instanceof ClassOrInterfaceDeclaration)) {
            if (node instanceof SingleVarDeclarator) {
                node.bindingType = this.get(
                    typeof node.binding === "string" ?
                    node.binding : node.binding.name.name
                )?.result;
            }
            this.insertName(scope, name, node, "dims");
            return;
        }

        if ((bindingType === BindTypes.classOrInterface) &&
            node instanceof ClassOrInterfaceDeclaration) {
            this.insertName(scope, name, node, "classes");
            return;
        }

        if ((bindingType === BindTypes.const)) {
            if (node instanceof MacroDeclaration) {
                this.insertName(scope, name, node, "macros");
            } else if (node instanceof SingleVarDeclarator) {
                let variant;
                if (type) {
                    this.insertName(scope, name, type, "consts");
                } else if ((variant = this.get("Variant")?.result)) {
                    this.insertName(scope, name, variant, "consts");
                }
            } else if (node instanceof EnumDeclaration) {
                this.insertName(scope, name, node, "consts");
            }
            return;
        }

        if ((bindingType === BindTypes.namespace) &&
            node instanceof NamespaceDeclaration) {
            this.currentScope().namespaces.set(name.toLowerCase(), node);
            let exist: NamespaceDeclaration | undefined;
            for (const n of this.store.namespaces) {
                if (n[0].toLowerCase() === name.toLowerCase()) {
                    exist = n[1];
                    break;
                }
            }
            if (exist) {
                node.body.forEach(member => {
                    exist?.body.push(member);
                });
            } else {
                this.store.namespaces.set(name.toLowerCase(), node);
            }
        }
    }

    declareUndefined(name: Identifier, type?: DeclarationBase) {
        let declare = new SingleVarDeclarator(this.parser, this.parser.state.pos, this.parser.state.curPostion());
        declare.name = name;
        if (!type) {
            declare.bindingType = this.get("IQuestion")?.result;
            declare.binding = "IQuestion";
        } else {
            declare.bindingType = type;
            declare.binding = type.name.name;
        }
        declare.declare = undefined;
        this.currentScope().undefined.set(name.name.toLowerCase(), declare);
        return declare;
    }

    checkRedeclarationInScope(
        scope: Scope,
        name: string,
        node: NodeBase
    ) {
        if (this.isRedeclared(scope, name) ||
            this.isRedeclared(this.global, name) ||
            this.isRedeclared(this.store, name)) {
            this.raise(node, ErrorMessages["VarRedeclaration"], false, name);
        }
    }

    isRedeclared(scope: Scope, name: string) {
        const checkName = name.toLowerCase();
        return scope.classes.has(checkName)   ||
               scope.consts.has(checkName)    ||
               scope.dims.has(checkName)      ||
               scope.functions.has(checkName) ||
               scope.macros.has(checkName)    ||
               scope.namespaces.has(checkName);
    }

    isConst(name: string) {
        return this.currentScope().consts.has(name.toLowerCase());
    }

    isUndefine(name: string) {
        return this.currentScope().undefined.has(name.toLowerCase());
    }

    currentScope() {
        return this.stack[this.stack.length - 1];
    }

    currentWith() {
        return this.currentScope().withHeader[this.currentScope().withHeader.length - 1];
    }

    enterHeader(type?: DeclarationBase) {
        if (type) {
            this.currentScope().withHeader.push(type);
        }
        this.currentScope().currentHeader = type;
    }

    exitHeader() {
        if (this.currentScope().currentHeader) {
            this.currentScope().withHeader.pop();
        }
        if (this.currentScope().withHeader.length > 0) {
            this.currentScope().currentHeader =
                this.currentScope().withHeader[this.currentScope().withHeader.length - 1];
        }
    }

    getName(scope: Scope, name: string): ScopeSearchResult | undefined {
        const lowerName = name.toLowerCase();
        let result;
        if ((result = scope.dims.get(lowerName))) {
            return {
                type: BindTypes.var,
                result: result
            };
        }
        if ((result = scope.consts.get(lowerName)) ||
            (result = scope.macros.get(lowerName))) {
            return {
                type: BindTypes.const,
                result: result
            };
        }
        if ((result = scope.classes.get(lowerName))) {
            return {
                type: BindTypes.classOrInterface,
                result: result
            };
        }
        if ((result = scope.functions.get(lowerName))) {
            return {
                type: BindTypes.function,
                result: result
            };
        }
        if ((result = scope.namespaces.get(lowerName))) {
            return {
                type: BindTypes.classOrInterface,
                result: result
            };
        }
    }

    get(name: string,
        namespace?: string | NamespaceDeclaration):
        ScopeSearchResult | undefined {
        if (namespace) {
            let field;
            let filedName = (typeof namespace === "string" ? namespace :
                namespace.name.name).toLowerCase();
            field = this.global.namespaces.get(filedName) ||
            this.store.namespaces.get(filedName) ||
            this.currentScope().namespaces.get(filedName);
            if (!field) {
                return undefined;
            }
            return this.searchInNamespace(field, name);
        }
        return this.getName(this.store, name) ||
               this.getName(this.currentScope(), name) ||
               this.getName(this.global, name);
    }

    getUndefined(name: string) {
        return this.currentScope().undefined.get(name.toLowerCase());
    }

    deleteName(scope: Scope, name: string) {
        const lowerName = name.toLowerCase();
        if (scope.dims.has(lowerName)) {
            scope.dims.delete(lowerName);
        } else if (scope.consts.has(lowerName)) {
            scope.consts.delete(lowerName);
        } else if (scope.functions.has(lowerName)) {
            scope.functions.delete(lowerName);
        } else if (scope.macros.has(lowerName)) {
            scope.macros.delete(lowerName);
        }
    }

    delete(name: string) {
        this.deleteName(this.currentScope(), name);
        this.deleteName(this.store, name);
    }

    update(
        name: string,
        newBindingType: BindTypes,
        newType: DeclarationBase,
        assignExpr: Expression) {

        let exist = this.get(name);

        // 检查是否已经声明
        if (!exist?.result) {
            this.raise(
                assignExpr,
                ErrorMessages["VarIsNotDeclared"],
                false,
                name);
            return;
        }

        // 检查是否为Const类型
        if (exist.type === BindTypes.const) {
            this.raise(
                assignExpr,
                ErrorMessages["ConstVarCannotBeAssigned"],
                false,
            );
            return;
        }

        // 检查是否为本地定义，如果为本地定义，则更新Decarator内的ValueType属性和bindingType属性
        if (exist.type === BindTypes.var) {
            if (exist.result instanceof SingleVarDeclarator) {
                exist.result.binding = newType.name.name;
                exist.result.bindingType = newType;
            } else if (exist.result instanceof ArrayDeclarator) {
                if (!exist.result.binding) {
                    exist.result.binding = newType.name.name;
                } else {
                    exist.result.binding = "Variant";
                }
            }
            return;
        }

        this.delete(name);
        this.declareName(name, newBindingType, newType);
    }

    updateGeneric(name: string, genericType: string) {
        let find = this.get(name)?.result;
        if (!find || find.type !== "ArrayDeclarator") {
            return;
        }
        let arr = find as ArrayDeclarator;
        let bind = typeof arr.binding === "string" ? arr.binding : arr.binding.name.name;
        if (arr.bindingType &&
            bind.toLowerCase() !== genericType.toLowerCase()) {
            arr.binding = "Variant";
            arr.bindingType = this.get("Variant")?.result;
        } else {
            arr.binding = genericType;
            arr.bindingType = this.get(genericType)?.result;
        }
    }

    updateUndefine(name: string, newType: DeclarationBase) {
        this.currentScope().undefined.set(name.toLowerCase(), newType);
    }

    joinScope(scope?: Scope) {
        if (!scope) {
            return;
        }
        if (this.store.size === 0) {
            this.store = scope;
            return;
        }
        mergeScope(scope, this.store);
    }

    private insertName(
        scope: Scope,
        name: string,
        type: DeclarationBase,
        key: string) {
        scope[key].set(name.toLowerCase(), type);
        if (!this.inFunction         &&
            !this.inNameSpace        &&
            !this.inClassOrInterface &&
            !this.inEvent) {
            this.store[key].set(name.toLowerCase(), type);
        }
    }

    private searchInNamespace(
        namespace: NamespaceDeclaration,
        name: string): ScopeSearchResult | undefined {
        for (const child of namespace.body) {
            if (name.toLowerCase() === child.name.name.toLowerCase()) {
                let type = child.type === "ClassOrInterfaceDeclaration" ?
                        BindTypes.classOrInterface : BindTypes.function;
                return {
                    type: type,
                    result: child
                };
            }
        }
        return undefined;
    }

}

export function mergeSingleNamespace(
    source: NamespaceDeclaration,
    map: NamespaceDeclaration) {
    source.body.forEach(member => {
        map.body.push(member);
    });
}

export function mergeNamespace(
    source: Map<string, NamespaceDeclaration>,
    map: Map<string, NamespaceDeclaration>) {
    source.forEach((value, key) => {
        let exist = map.get(key);
        if (exist) {
            mergeSingleNamespace(value, exist);
        } else {
            map.set(key, value);
        }
    });
}

export function mergeScope(scope: Scope, target: Scope) {
    mergeMap(scope.dims,      target.dims);
    mergeMap(scope.consts,    target.consts);
    mergeMap(scope.macros,    target.macros);
    mergeMap(scope.functions, target.functions);
    mergeMap(scope.classes,   target.classes);
    mergeNamespace(scope.namespaces, target.namespaces);
}

function mergeMap<K, V>(source: Map<K, V>, target: Map<K, V>) {
    source.forEach((value, key) => {
        target.set(key, value);
    });
}

