import { join } from "path";
import { getAllUsefulFile } from "../file/util";
import { createBasicOptions } from "../options";
import { Parser } from "../parser";
import { Scope } from "./scope";

export function loadBuiltInModule() {
    const folder = join(__dirname, "../../../src/lib/built_in_modules");
    const module = getAllUsefulFile(folder);
    return loadDecarationFiles(module);
}

export function loadDecarationFiles(files: Map<string, string>) {
    let scope: Scope | undefined;
    files.forEach((f, p) => {
        const parser = new Parser(createBasicOptions(p, false), f);
        const file = parser.parse(scope ?? undefined);
        if (file.scope) {
            scope = file.scope;
        }
    });
    return scope;
}

export const builtInModule = loadBuiltInModule();
