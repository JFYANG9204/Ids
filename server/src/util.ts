import { join } from "path";
import { fileURLToPath } from "url";
import { _Connection } from "vscode-languageserver";
import {
    TextDocument
} from "vscode-languageserver-textdocument";
import { raiseErrors } from "./errors";
import { ParserFileDigraph } from "./lib/file";
import {
    getAllUsefulFile,
    getCurrentParser,
    getFileTypeMark,
    readFileAndConvertToUtf8
} from "./lib/file/util";
import { createBasicOptions } from "./lib/options";
import { Parser } from "./lib/parser";
import { File } from "./lib/types";
import { Scope } from "./lib/util/scope";



export function updateAndVaidateDocument(
    textdocument: TextDocument,
    connection: _Connection,
    current: Map<string, File>,
    last: Map<string, File>,
    graph?: ParserFileDigraph,
) {
    const uri = textdocument.uri;
    const path = fileURLToPath(uri);
    const content = textdocument.getText();
    let file;
    if (graph && graph.getData(path)) {
        graph.updateData(path, content);
        graph.setStart(path);
        const start = graph.startParse();
        if (start) {
            if (start.path.toLowerCase() === path.toLowerCase()) {
                file = start;
            } else {
                file = getCurrentParser(start, path);
            }
        }
    }
    if (!file) {
        const parser = createSingleParser(path, content, uri);
        const typeMark = getFileTypeMark(content);
        if (typeMark) {
            parser.options.sourceType = typeMark;
        }
        file = parser.parse();
    }
    const cur = current.get(path.toLowerCase());
    if (cur) {
        last.set(path.toLowerCase(), cur);
    }
    current.set(path.toLowerCase(), file);
    raiseErrorsFromFile(connection, textdocument, file);
    return file;
}

export function raiseErrorsFromFile(connection: _Connection, doc: TextDocument, file?: File) {
    if (!file) {
        return;
    }
    const errs = raiseErrors(doc, file);
    connection.sendDiagnostics({
        uri: doc.uri,
        diagnostics: errs
    });
}

export function updateResultFromFile(file: File, data: Map<string, File>) {
    data.set(file.path.toLowerCase(), file);
    for (const inc of file.includes.values()) {
        data.set(inc.path.toLowerCase(), inc);
        updateResultFromFile(inc, data);
    }
}

export function updateMapFromMap(source: Map<string, File>, target: Map<string, File>) {
    source.forEach((file, path) => target.set(path, file));
}

export function createSingleParser(path: string, content?: string, uri?: string) {
    let text = content;
    if (!text) {
        text = readFileAndConvertToUtf8(path);
    }
    return new Parser(createBasicOptions(path, false, uri), text);
}

export function loadBuiltInModule() {
    const folder = join(__dirname, "../src/lib/built_in_modules");
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
