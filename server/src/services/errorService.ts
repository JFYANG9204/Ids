import {
    Connection,
    Diagnostic
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { raiseErrors } from "../errors";
import { File } from "../lib/types";

export class ErrorService {

    private errMap: Map<string, Diagnostic[]> = new Map();
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    set(textDocument: TextDocument, file: File) {
        this.errMap.set(textDocument.uri, raiseErrors(textDocument, file));
    }

    delete(uri: string) {
        this.errMap.set(uri, []);
        this.connection.sendDiagnostics({ uri, diagnostics: [] });
    }

    raise() {
        for (const [ k, v ] of this.errMap) {
            this.connection.sendDiagnostics({ uri: k, diagnostics: v });
        }
    }

}
