import { join } from "path";
import { FileNode } from "../fileHandler/fileNode";
import { readAllUsefulFileInFolderSync } from "../fileHandler/load";
import { createBasicOptions } from "../lib/options";
import { Parser } from "../lib/parser";
import { DeclarationBase, SingleVarDeclarator } from "../lib/types";
import { Scope, ScopeFlags } from "../lib/util";

export interface DeclarationLoadResult {
    scope: Scope,
    nodes: Map<string, FileNode>
}

export function loadBuiltInModule() {
    const folder = join(__dirname, "../../src/declaration/built_in_modules");
    const module = readAllUsefulFileInFolderSync(folder);
    return loadDecarationFiles(module);
}

export function loadDecarationFiles(
    nodes: Map<string, FileNode>): DeclarationLoadResult {

    let scope: Scope | undefined;
    nodes.forEach(f => {
        const parser = new Parser(createBasicOptions(f.fsPath, false, f.uri), f.content);
        const file = parser.parse(scope ?? undefined);
        f.file = file;
        f.parser = parser;
        if (file.scope) {
            scope = file.scope;
        }
    });
    return {
        scope: scope ?? new Scope(ScopeFlags.program),
        nodes
    };
}

const builtInModule = loadBuiltInModule();

if (builtInModule.scope) {
    correctVarInScope(builtInModule.scope, builtInModule.scope.consts);
    correctVarInScope(builtInModule.scope, builtInModule.scope.dims);
}

function correctVarInScope(scope: Scope, vars: Map<string, DeclarationBase>) {
    vars.forEach(dim => {
        if (dim instanceof SingleVarDeclarator) {
            if (typeof dim.binding === "string") {
                dim.bindingType = scope.classes.get(dim.binding.toLowerCase());
            } else {
                let name = dim.binding.name.name.toLowerCase();
                if (dim.binding.namespace) {
                    let ns = dim.binding.namespace;
                    if (typeof ns === "string") {
                        dim.bindingType = scope.namespaces.get(ns.toLowerCase())?.body.get(name);
                    } else {
                        dim.bindingType = ns.body.get(name);
                    }
                } else {
                    dim.bindingType = scope.classes.get(name);
                }
            }
        }
    });
}


export { builtInModule };
