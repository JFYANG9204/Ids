import { ParserBase } from "../base";
import { ErrorMessages } from "../parser/error-messages";
import { ErrorTemplate } from "../parser/errors";
import {
    ArrayDeclarator,
    BindingDeclarator,
    ClassOrInterfaceDeclaration,
    DeclarationBase,
    EnumDeclaration,
    EventSection,
    Expression,
    FunctionDeclaration,
    Identifier,
    MacroDeclaration,
    MetadataBase,
    NamespaceDeclaration,
    NodeBase,
    SingleVarDeclarator
} from "../types";

export type RaiseFunction = (node: NodeBase, template: ErrorTemplate, warning: boolean, ...params: any) => void;

export enum ScopeFlags {
    program,
    function,
    enumerator,
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
    metadata,
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
    metadata: Map<string, MetadataBase> = new Map();

    constructor(flags: ScopeFlags) {
        this.flags = flags;
    }

    get size() {
        return this.dims.size + this.consts.size +
               this.macros.size + this.functions.size +
               this.classes.size + this.namespaces.size;
    }

    join(scope: Scope) {
        mergeScope(scope, this);
    }

    clear() {
        this.withHeader.splice(0);
        this.currentHeader = undefined;
        this.dims.clear();
        this.consts.clear();
        this.macros.clear();
        this.functions.clear();
        this.classes.clear();
        this.namespaces.clear();
        this.undefined.clear();
        this.metadata.clear();
    }
}

export class ScopeHandler {

    parser: ParserBase;
    global: Scope;
    store: Scope;
    stack: Array<Scope> = [];
    raise: RaiseFunction;

    currentEvent?: EventSection;

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

    get inWith() {
        return this.currentScope().withHeader.length > 0;
    }

    get inFunction() {
        return this.currentScope().flags === ScopeFlags.function;
    }

    get inClassOrInterface() {
        return this.currentScope().flags === ScopeFlags.classOrInterface;
    }

    get inEnumerator() {
        return this.currentScope().flags === ScopeFlags.enumerator;
    }

    get inNameSpace() {
        return this.currentScope().flags === ScopeFlags.namespace;
    }

    get inEvent() {
        return this.currentScope().flags === ScopeFlags.event;
    }

    inSpecialEvent(name: string) {
        if (!this.currentEvent) {
            return false;
        }
        return name.toLowerCase() === this.currentEvent.name.name.toLowerCase();
    }

    enter(flags: ScopeFlags, event?: EventSection) {
        this.stack.push(new Scope(flags));
        if (event) {
            this.currentEvent = event;
        }
    }

    exit(isEvent?: boolean) {
        this.stack.pop();
        if (isEvent) {
            this.currentEvent = undefined;
        }
    }

    declareName(
        name: string,
        bindingType: BindTypes,
        node: DeclarationBase,
        type?: DeclarationBase) {

        const scope = this.currentScope();
        if(this.checkRedeclarationInScope(scope, name, node)) {
            return;
        };

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
                if (typeof node.binding === "string") {
                    node.bindingType = this.get(node.binding)?.result;
                }
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
            } else if (node instanceof ClassOrInterfaceDeclaration &&
                    node.constants.size > 0) {
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
                    exist?.body.set(member.name.name.toLowerCase(), member);
                });
            } else {
                this.store.namespaces.set(name.toLowerCase(), node);
            }
        }

        if (bindingType === BindTypes.metadata &&
            node instanceof MetadataBase) {
            this.store.metadata.set(name.toLowerCase(), node);
        }
    }

    private createBindingTypeFromId(id: Identifier, type?: string, ns?: NamespaceDeclaration | string) {
        let declare = new BindingDeclarator(this.parser, id.start, id.loc.start);
        // 新建Id
        let bindName = new Identifier(this.parser, id.start, id.loc.start);
        bindName.end = id.end;
        bindName.loc.end = id.loc.end;
        bindName.name = type ?? "IMDMField";
        //
        declare.name = bindName;
        declare.namespace = ns;
        declare.end = id.end;
        declare.loc.end = id.loc.end;
        return declare;
    }

    declareUndefined(name: Identifier, type?: DeclarationBase) {
        let declare = new SingleVarDeclarator(this.parser, this.parser.state.pos, this.parser.state.curPostion());
        declare.name = name;
        if (!type) {
            declare.bindingType = this.get("IMDMField", "MDMLib")?.result;
            declare.binding = this.createBindingTypeFromId(name, "IMDMField", "MDMLib");
        } else {
            declare.bindingType = type;
            declare.binding = type.name.name;
        }
        declare.declare = undefined;
        declare.end = name.end;
        declare.loc.end = name.loc.end;
        this.currentScope().undefined.set(name.name.toLowerCase(), declare);
        return declare;
    }

    checkRedeclarationInScope(
        scope: Scope,
        name: string,
        node: DeclarationBase
    ) {
        if (node instanceof MetadataBase) {
            if (this.isRedeclared(scope, name, true)) {
                this.raise(node.name, ErrorMessages["VarRedeclaration"], false, name);
                return true;
            }
            return false;
        }
        if (this.inClassOrInterface ||
            this.inEnumerator       ||
            this.inFunction) {
            if (this.isRedeclared(scope, name)) {
                this.raise(node.name, ErrorMessages["VarRedeclaration"], false, name);
                return true;
            }
            return false;
        }
        if (this.isRedeclared(scope, name) ||
            this.isRedeclared(this.global, name) ||
            this.isRedeclared(this.store, name)) {
            this.raise(node.name, ErrorMessages["VarRedeclaration"], false, name);
            return true;
        }
        return false;
    }

    isRedeclared(scope: Scope, name: string, metadata = false) {
        const checkName = name.toLowerCase();
        if (metadata) {
            return scope.metadata.has(checkName);
        }
        return scope.consts.has(checkName)    ||
               scope.dims.has(checkName)      ||
               scope.macros.has(checkName);
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
        } else {
            this.currentScope().currentHeader = undefined;
        }
    }

    private getFromMap(
        map: Map<string, DeclarationBase>,
        name: string,
        type: BindTypes): ScopeSearchResult | undefined {
        let result = map.get(name.toLowerCase());
        if (result) {
            return { type, result };
        }
        return undefined;
    }

    private getName(
        scope: Scope,
        name: string): ScopeSearchResult | undefined {

        const lowerName = name.toLowerCase();

        return this.getFromMap(scope.dims,       lowerName, BindTypes.var)              ||
               this.getFromMap(scope.consts,     lowerName, BindTypes.const)            ||
               this.getFromMap(scope.macros,     lowerName, BindTypes.const)            ||
               this.getFromMap(scope.classes,    lowerName, BindTypes.classOrInterface) ||
               this.getFromMap(scope.functions,  lowerName, BindTypes.function)         ||
               this.getFromMap(scope.namespaces, lowerName, BindTypes.namespace)        ||
               this.getFromMap(scope.undefined,  lowerName, BindTypes.var);
    }

    get(name: string,
        namespace?: string | NamespaceDeclaration,
        isFunction?: boolean):
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

        if (isFunction) {
            return this.getFromMap(this.global.functions, name, BindTypes.function)  ||
                   this.getFromMap(this.store.functions,  name, BindTypes.function)  ||
                   this.getFromMap(this.currentScope().functions, name, BindTypes.function);
        }

        if (this.inFunction) {
            return this.getName(this.currentScope(),      name)                             ||
                   this.getFromMap(this.store.consts,     name, BindTypes.const)            ||
                   this.getFromMap(this.store.macros,     name, BindTypes.const)            ||
                   this.getFromMap(this.store.functions,  name, BindTypes.function)         ||
                   this.getFromMap(this.global.consts,    name, BindTypes.const)            ||
                   this.getFromMap(this.global.macros,    name, BindTypes.const)            ||
                   this.getFromMap(this.global.functions, name, BindTypes.function)         ||
                   this.getFromMap(this.global.classes,   name, BindTypes.classOrInterface) ||
                   this.getFromMap(this.global.namespaces,name, BindTypes.namespace);
        }

        return this.getName(this.store, name)          ||
               this.getName(this.currentScope(), name) ||
               this.getName(this.global, name)         || (
               this.inSpecialEvent("OnNextCase") ?
               this.getFromMap(this.store.metadata, name, BindTypes.metadata) :
               undefined);
    }

    getUndefined(name: string) {
        return this.currentScope().undefined.get(name.toLowerCase());
    }

    private deleteName(scope: Scope, name: string) {
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
                if (newType instanceof BindingDeclarator) {
                    exist.result.binding = newType;
                    exist.result.bindingType = this.get(newType.name.name)?.result;
                } else {
                    exist.result.binding = newType.name.name;
                    exist.result.bindingType = newType;
                }
            } else if (exist.result instanceof ArrayDeclarator) {
                if (!exist.result.binding) {
                    exist.result.binding = newType.name.name;
                    exist.result.bindingType = newType;
                } else {
                    exist.result.binding = "Variant";
                    exist.result.bindingType = this.get("Variant")?.result;
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
        mergeScope(scope, this.inEvent ? this.currentScope() : this.store);
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
        let child = namespace.body.get(name.toLowerCase());
        if (child) {
            let type = child.type === "ClassOrInterfaceDeclaration" ?
            BindTypes.classOrInterface : BindTypes.function;
            return {
                type: type,
                result: child
            };
        }
        return undefined;
    }

}

export function mergeSingleNamespace(
    source: NamespaceDeclaration,
    map: NamespaceDeclaration) {
    source.body.forEach(member => {
        map.body.set(member.name.name.toLowerCase(), member);
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
    mergeMap(scope.metadata,  target.metadata);
    mergeNamespace(scope.namespaces, target.namespaces);
}

function mergeMap<K, V>(source: Map<K, V>, target: Map<K, V>) {
    source.forEach((value, key) => {
        target.set(key, value);
    });
}

export function updateScope(scope: Scope, target: Scope) {
    updateMap(scope.dims, target.dims);
    updateMap(scope.consts, target.consts);
    updateMap(scope.classes, target.classes);
    updateMap(scope.functions, target.functions);
    updateMap(scope.macros, target.macros);
    scope.namespaces.forEach((ns, n) => {
        let exist = target.namespaces.get(n);
        if (exist) {
            ns.body.forEach((child, name) => exist?.body.set(name, child));
        } else {
            target.namespaces.set(n, ns);
        }
    });
}

/**
 * 将source内的数据更新到target数据中
 * @param source 原始对象
 * @param target 更新对象
 */
function updateMap<K, V>(source: Map<K, V>, target: Map<K, V>) {
    source.forEach((v, k) => {
        target.set(k, v);
    });
}
