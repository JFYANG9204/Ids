import { connect } from "http2";
import { fileURLToPath } from "url";
import { _Connection } from "vscode-languageserver";
import {
    TextDocument
} from "vscode-languageserver-textdocument";
import { raiseErrors } from "./errors";
import { ParserFileDigraph } from "./lib/file";
import { getCurrentParser, readFileAndConvertToUtf8 } from "./lib/file/util";
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
        graph.setStart(path);
        const start = graph.startParse();
        if (start) {
            if (start.path.toLowerCase() === path.toLowerCase()) {
                file = start;
            } else {
                file = getCurrentParser(start, path);
            }
        }
    } else {
        file = createSingleParser(path, content, uri).parse();
    }
    if (file) {
        let cur = current.get(path.toLowerCase());
        if (cur) {
            last.set(path.toLowerCase(), cur);
        }
        current.set(path.toLowerCase(), file);
    }
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
    file.includes.forEach(inc => {
        data.set(inc.path.toLowerCase(), inc);
        updateResultFromFile(inc, data);
    });
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

