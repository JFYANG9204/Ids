import { join } from "path";
import { FileContent, getAllUsefulFile } from "../lib/file/util";
import { createBasicOptions } from "../lib/options";
import { Parser } from "../lib/parser";
import { File } from "../lib/types";
import { Scope } from "../lib/util";

export interface DeclarationLoadResult {
    scope?: Scope,
    files: Map<string, File>,
    contents: Map<string, FileContent>
}

export function loadBuiltInModule() {
    const folder = join(__dirname, "../../src/lib/built_in_modules");
    const module = getAllUsefulFile(folder);
    return loadDecarationFiles(module);
}

export function loadDecarationFiles(contents: Map<string, FileContent>): DeclarationLoadResult {
    let fileMap: Map<string, File> = new Map();
    let scope: Scope | undefined;
    contents.forEach((f, p) => {
        const parser = new Parser(createBasicOptions(p, false, f.uri), f.content);
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

export { builtInModule };
