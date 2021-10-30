import * as vscode from "vscode";
import { join } from "path";
import { fileURLToPath } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
    CompletionItem,
    createConnection,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind
} from "vscode-languageserver/node";
import { ParserFileDigraph } from "./lib/file";
import { File } from "./lib/types";
import { builtInCompletions, getCompletionsFromDefinitions, keywordsCompletions } from "./completion";
import { updateAndVaidateDocument } from "./util";

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
