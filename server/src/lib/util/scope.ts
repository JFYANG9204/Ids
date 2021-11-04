import {
    BasicTypeDefinitions,
    searchAggregate,
    searchBuiltIn,
    searchEnumerator,
    searchFunction
} from "../built-in/built-ins";
import { ErrorMessages } from "../parser/error-messages";
import { ErrorTemplate } from "../parser/errors";
import {
    EventSection,
    FunctionDeclaration,
    NodeBase
} from "../types";
import {
    DefinitionBase,
    DefSection,
} from "./definition";
import { File } from "../types";

class SymbolTable {

    store: boolean;
    storeMap?: Map<string, DefinitionBase>;
    table: Map<string, DefinitionBase> = new Map();
    section: NodeBase;
    headerType: Array<DefinitionBase | undefined> = [];
    unDefined: Map<string, DefinitionBase> = new Map();
    raise: (node: NodeBase, template: ErrorTemplate, warning: boolean, ...params: any) => void;

    constructor(
        section: NodeBase,
        raiseFunction: (node: NodeBase, template: ErrorTemplate, ...params: any) => void,
        store?: boolean,
        storeMap?: Map<string, DefinitionBase>) {
        this.section = section;
        this.raise = raiseFunction;
        this.store = store ?? false;
        this.storeMap = storeMap;
    }

    insert(name: string, node: NodeBase, def: DefinitionBase) {
        if (this.table.has(name.toLowerCase()) || (
            !this.isFunction && searchBuiltIn(name)
        )) {
            this.raise(
                node,
                ErrorMessages["VarRedeclaration"],
                false,
                name
            );
        } else if (!this.canDeclareFunction &&
            node.type === "FunctionDeclaration") {
            this.raise(
                node,
                ErrorMessages["DontAllowDeclareFunction"],
                false,
                node.type
            );
        } else {
            def.node = node;
            this.table.set(
                name.toLowerCase(),
                def
            );
            if (this.store && this.storeMap) {
                this.storeMap.set(
                    name.toLowerCase(),
                    def
                );
            }
        }
    }

    get(name: string) {
        if (this.isFunction) {
            return searchFunction(name) ||
                searchAggregate(name) ||
                searchEnumerator(name) ||
                this.table.get(name.toLowerCase());
        } else {
            return searchBuiltIn(name) ||
                this.table.get(name.toLowerCase());
        }
    }

    isUndefine(name: string) {
        return this.unDefined.get(name.toLowerCase());
    }

    setUndef(name: string, def?: DefinitionBase) {
        if (!this.unDefined.has(name.toLowerCase())) {
            this.unDefined.set(
                name.toLowerCase(),
                def ?? BasicTypeDefinitions.variant
            );
        }
    }

    updateUndef(name: string, def: DefinitionBase) {
        if (this.isUndefine(name)) {
            this.unDefined.set(name.toLowerCase(), def);
        }
    }

    remove(name: string) {
        const exist = this.table.get(name.toLowerCase());
        if (exist) {
            this.table.delete(name);
        }
    }

    get isFunction() {
        return this.section.type === "FunctionDeclaration";
    }

    get isDmsSection() {
        return this.section.type === "EventSection";
    }

    get isWith() {
        return this.section.type === "WithStatement";
    }

    get isLoop() {
        return this.section.type === "WhileStatement"   ||
               this.section.type === "DoWhileStatement" ||
               this.section.type === "ForEachStatement" ||
               this.section.type === "ForStatement";
    }

    get isEvent() {
        return this.section instanceof EventSection;
    }

    get inIf() {
        return this.section.type === "IfStatement";
    }

    get canDeclareFunction() {
        return !this.isLoop &&
            !this.isWith &&
            !this.isFunction &&
            !this.inIf;
    }

    updateType(name: string, def: DefinitionBase) {
        if (this.table.has(name.toLowerCase())) {
            this.table.set(name.toLowerCase(), def);
            if (this.storeMap && this.store) {
                this.storeMap.set(name.toLowerCase(), def);
            }
        }
    }

    join(file: File) {
        file.definitions?.forEach((value, key) => {
            if (!this.get(key)) {
                this.table.set(key, value);
            }
            if (this.store && this.storeMap && !this.storeMap.has(key)) {
                this.storeMap.set(key, value);
            }
        });
    }

    joinMap(defMap: Map<string, DefinitionBase>) {
        defMap.forEach((value, key) => {
            if (!this.table.get(key)) {
                this.table.set(key, value);
            }
            if (this.store && this.storeMap && !this.storeMap.has(key)) {
                this.storeMap.set(key, value);
            }
        });
    }

    enterHeader(def: DefinitionBase | undefined) {
        this.headerType.push(def);
    }

    exitHeader() {
        this.headerType.pop();
    }

    currentHeader() {
        if (this.headerType.length > 0) {
            return this.headerType[this.headerType.length - 1];
        }
        return undefined;
    }

}

export class ScopeHandler {

    storeMap: Map<string, DefinitionBase>;
    stack: Array<SymbolTable> = [];
    raise: (node: NodeBase, template: ErrorTemplate, ...params: any) => void;

    constructor(
        raise: (node: NodeBase, template: ErrorTemplate, ...params: any) => void,
        storeMap: Map<string, DefinitionBase>) {
        this.raise = raise;
        this.storeMap = storeMap;
    }

    enter(node: NodeBase, store?: boolean) {
        this.stack.push(new SymbolTable(node, this.raise, store, this.storeMap));
    }

    exit() {
        this.stack.pop();
    }

    currentScope() {
        return this.stack[this.stack.length - 1];
    }

    declareName(name: string, node: NodeBase, def: DefinitionBase) {
        const scope = this.currentScope();
        scope.insert(name, node, def);
    }

    currentSection(): DefSection {
        const global: DefSection = {
            name: "Program",
            type: "global"
        };
        const cur = this.currentScope().section;
        if (cur instanceof FunctionDeclaration) {
            return {
                name: cur.id.name,
                type: "function"
            };
        }
        if (cur instanceof EventSection) {
            return {
                name: cur.name.name,
                type: "event"
            };
        }
        return global;
    }

}


