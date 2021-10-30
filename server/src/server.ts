import { fileURLToPath } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
    CompletionItem,
    createConnection,
    InitializeResult,
    ProposedFeatures,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind
} from "vscode-languageserver/node";
import { ParserFileDigraph } from "./lib/file";
import { File } from "./lib/types";
import { builtInCompletions, getCompletionFromPosition, getCompletionsFromDefinitions, keywordsCompletions } from "./completion";
import { updateAndVaidateDocument } from "./util";
import { positionAt } from "./lib/file/util";

let connection = createConnection(ProposedFeatures.all);
let documents = new TextDocuments(TextDocument);
let current: File;
let graph: ParserFileDigraph;
let folderPath: string;

connection.onInitialize((params) => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: [ "#", ".", "\\", "/" ]
            }
        }
    };
    if (params.workspaceFolders) {
        folderPath = fileURLToPath(params.workspaceFolders[params.workspaceFolders.length - 1].uri);
        graph = new ParserFileDigraph(folderPath);
        graph.init();
    }
    return result;
});

connection.onCompletion(
    (textDocumentPosition: TextDocumentPositionParams) => {
        let doc = documents.get(textDocumentPosition.textDocument.uri);
        if (!doc) {
            return [];
        }
        let pos = doc.offsetAt(textDocumentPosition.position);
        let text = doc.getText().substring(0, pos);
        if (current) {
            let find = getCompletionFromPosition(
                current,
                pos,
                fileURLToPath(textDocumentPosition.textDocument.uri),
                text.slice(pos - 1, pos)
            );
            const node = positionAt(current.program.body, pos);
            connection.window.showInformationMessage(node.type);
            if (find.length > 0) {
                return find;
            }
        }
        let completions: CompletionItem[] = builtInCompletions.concat(keywordsCompletions);
        if (current && current.definitions) {
            let defs = getCompletionsFromDefinitions(current.definitions);
            if (defs) {
                completions = completions.concat(defs);
            }
        }
        return completions;
    }
);


connection.onCompletionResolve(
    (item: CompletionItem) => {
        return item;
    }
);

documents.onDidChangeContent(change => {
    let file = updateAndVaidateDocument(change.document, graph, connection);
    if (file) {
        current = file;
    }
});

documents.listen(connection);
connection.listen();
