import { TextDocument } from "vscode-languageserver-textdocument";
import {
    createConnection,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind
} from "vscode-languageserver/node";

let connection = createConnection(ProposedFeatures.all);
let documents = new TextDocuments(TextDocument);

connection.onInitialize(() => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: [ "#", ".", "\\", "/" ]
            }
        }
    };
    return result;
});





documents.listen(connection);
connection.listen();
