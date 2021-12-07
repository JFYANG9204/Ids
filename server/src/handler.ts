import { Diagnostic, _Connection } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { builtInModule } from "./declaration";
import { raiseErrors } from "./errors";
import { ParserFileDigraph } from "./lib/file";
import { File } from "./lib/types";

export class ErrorHandler {

    private errMap: Map<string, Diagnostic[]> = new Map();
    private connection: _Connection;

    constructor(connection: _Connection) {
        this.connection = connection;
    }

    set(textDocument: TextDocument, file: File) {
        this.errMap.set(textDocument.uri, raiseErrors(textDocument, file));
    }

    delete(uri: string) {
        this.errMap.delete(uri);
    }

    raise() {
        for (const [ k, v ] of this.errMap) {
            this.connection.sendDiagnostics({ uri: k, diagnostics: v });
        }
    }

}

export class IdsServices {

    errorHandler: ErrorHandler;
    connection: _Connection;

    constructor(connection: _Connection) {
        this.connection = connection;
        this.errorHandler = new ErrorHandler(connection);
    }

    async init() {
    }

}

