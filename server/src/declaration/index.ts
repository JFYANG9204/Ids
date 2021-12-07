import { join } from "path";
import { FileContent, getAllUsefulFile } from "../lib/file/util";
import { createBasicOptions } from "../lib/options";
import { Parser } from "../lib/parser";
import { DeclarationBase, File, SingleVarDeclarator } from "../lib/types";
import { Scope } from "../lib/util";

export interface DeclarationLoadResult {
    scope?: Scope,
    files: Map<string, File>,
    contents: Map<string, FileContent>
}

export function loadBuiltInModule() {
    const folder = join(__dirname, "../../src/declaration/built_in_modules");
    const module = getAllUsefulFile(folder);
    return loadDecarationFiles(module);
}

export function loadDecarationFiles(contents: Map<string, FileContent>): DeclarationLoadResult {
    let fileMap: Map<string, File> = new Map();
    let scope: Scope | undefined;
    contents.forEach((f, p) => {
        const parser = new Parser(createBasicOptions(f.path, false, f.uri), f.content);
        const file = parser.parse(scope ?? undefined);
        fileMap.set(p, file);
        if (file.scope) {
            scope = file.scope;
        }
    });
    return {
        scope,
        files: fileMap,
        contents
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
