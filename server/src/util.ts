import { fileURLToPath } from "url";
import { _Connection } from "vscode-languageserver";
import {
    TextDocument
} from "vscode-languageserver-textdocument";
import { raiseErrors } from "./errors";
import { ParserFileDigraph } from "./lib/file";
import {
    getCurrentParser,
    getFileTypeMark,
    readFileAndConvertToUtf8
} from "./lib/file/util";
import { createBasicOptions } from "./lib/options";
import { Parser } from "./lib/parser";
import { File } from "./lib/types";



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

export function createSingleParser(path: string, content?: string, uri?: string) {
    let text = content;
    if (!text) {
        text = readFileAndConvertToUtf8(path);
    }
    return new Parser(createBasicOptions(path, false, uri), text);
}
