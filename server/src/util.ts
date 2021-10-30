import { fileURLToPath } from "url";
import { _Connection } from "vscode-languageserver";
import {
    TextDocument
} from "vscode-languageserver-textdocument";
import { raiseErrors } from "./errors";
import { ParserFileDigraph } from "./lib/file";
import { getCurrentParser } from "./lib/file/util";



export function updateAndVaidateDocument(
    textdocument: TextDocument,
    graph: ParserFileDigraph,
    connection: _Connection
) {
    const uri = textdocument.uri;
    const path = fileURLToPath(uri);
    const content = textdocument.getText();
    let file;
    if (graph.getData(path)) {
        graph.updateData(path, content);
        graph.setStart(path);
        const start = graph.startParse();
        if (start) {
            file = getCurrentParser(start, path);
        }
    } else {
        file = graph.startParse(path, content);
    }
    if (file) {
        const errs = raiseErrors(textdocument, file);
        connection.sendDiagnostics({
            uri: uri,
            diagnostics: errs
        });
    }
    return file;
}

