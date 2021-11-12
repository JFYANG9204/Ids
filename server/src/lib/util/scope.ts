import { ErrorMessages } from "../parser/error-messages";
import { ErrorTemplate, ParsingError } from "../parser/errors";
import {
    ArrayDeclarator,
    ClassOrInterfaceDeclaration,
    DeclarationBase,
    EnumDeclaration,
    Expression,
    FunctionDeclaration,
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
}

export class ScopeHandler {

    store: Scope;
    stack: Array<Scope> = [];
    raise: RaiseFunction;

    constructor(
        raise: RaiseFunction,
        store?: Scope) {
        this.raise = raise;
        this.store = store ?? new Scope(ScopeFlags.program);
    }

    get inFunction() {
        return this.currentScope().flags === ScopeFlags.function;
    }

    get inWith() {
        return this.currentScope().withHeader.length === 0;
    }

    get inClassOrInterface() {
        return this.currentScope().flags === ScopeFlags.classOrInterface;
    }

    get inNameSpace() {
        return this.currentScope().flags === ScopeFlags.namespace;
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
                    this.inWith ? "With" : "Function或Sub"
                );
                return;
            }
            this.insertName(scope, name, node, "functions");
        } else if ((bindingType === BindTypes.var) &&
            (node instanceof SingleVarDeclarator || node instanceof ArrayDeclarator)) {
            if (node instanceof SingleVarDeclarator) {
                const variant = this.get("Variant")?.result;
                if (variant) {
                    this.insertName(scope, name, variant, "dims");
                }
            } else {
                const array = this.get("Array")?.result;
                if (array) {
                    this.insertName(scope, name, array, "dims");
                }
            }
        } else if ((bindingType === BindTypes.classOrInterface) &&
            node instanceof ClassOrInterfaceDeclaration) {
            this.insertName(scope, name, node, "classes");
        } else if ((bindingType === BindTypes.const)) {
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
        } else if ((bindingType === BindTypes.namespace) &&
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

    declareUndefined(name: string, type?: DeclarationBase) {
        if (!type) {
            const question = this.get("IQuestion")?.result;
            if (question) {
                this.currentScope().undefined.set(name.toLowerCase(), question);
            }
        } else {
            this.currentScope().undefined.set(name.toLowerCase(), type);
        }
    }

    checkRedeclarationInScope(
        scope: Scope,
        name: string,
        node: NodeBase
    ) {
        if (this.isRedeclared(scope, name)) {
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

    enterHeader(type: DeclarationBase) {
        this.currentScope().withHeader.push(type);
        this.currentScope().currentHeader = type;
    }

    exitHeader() {
        this.currentScope().withHeader.pop();
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
            if (typeof namespace === "string") {
                const field = this.store.namespaces.get(namespace.toLowerCase()) ||
                this.currentScope().namespaces.get(namespace.toLowerCase());
                if (!field) {
                    return undefined;
                }
                return this.searchInNamespace(field, name);
            } else {
                return this.searchInNamespace(namespace, name);
            }
        }
        return this.getName(this.store, name) ||
               this.getName(this.currentScope(), name);
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
        if (!exist) {
            this.raise(
                assignExpr,
                ErrorMessages["VarIsNotDeclared"],
                false,
                name);
            return;
        }
        if (exist.type === BindTypes.const) {
            this.raise(
                assignExpr,
                ErrorMessages["ConstVarCannotBeAssigned"],
                false,
            );
            return;
        }
        this.delete(name);
        this.declareName(name, newBindingType, newType);
    }

    updateUndefine(name: string, newType: DeclarationBase) {
        this.currentScope().undefined.set(name.toLowerCase(), newType);
    }

    joinScope(scope?: Scope) {
        if (!scope) {
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
        if (!this.inFunction && !this.inNameSpace) {
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

