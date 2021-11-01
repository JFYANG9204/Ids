import { fileURLToPath } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
    CompletionItem,
    createConnection,
    Hover,
    InitializeResult,
    ProposedFeatures,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind
} from "vscode-languageserver/node";
import { ParserFileDigraph } from "./lib/file";
import { File } from "./lib/types";
import {
    builtInCompletions,
    getCompletionFromPosition,
    getCompletionsFromDefinitions,
    keywordsCompletions,
    preKeywordsCompletions
} from "./completion";
import { updateAndVaidateDocument } from "./util";
import { positionAt } from "./lib/file/util";
import { DefinitionBase } from "./lib/util/definition";

let connection = createConnection(ProposedFeatures.all);
let documents = new TextDocuments(TextDocument);
let current: File;
let last: File;
let graph: ParserFileDigraph;
let folderPath: string;

connection.onInitialize((params) => {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: [ "#", ".", "\\", "/" ]
            },
            hoverProvider: true
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
        if (text.endsWith("#")) {
            return preKeywordsCompletions;
        };
        if (last && (
            text.endsWith(".") ||
            text.endsWith("/") ||
            text.endsWith("\\"))) {
            let find = getCompletionFromPosition(
                last,
                pos - 1,
                text.slice(pos - 1, pos)
            );
            const node = positionAt(last.program.body, pos - 1);
            connection.console.log(node.type + "   " + node.extra["definition"]);
            return find;
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

connection.onHover(params => {
    let hover: Hover | undefined = undefined;
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return hover;
    }
    const pos = document.offsetAt(params.position);
    const node = positionAt(current.program.body, pos, true);
    if (node.extra["definition"]) {
        const def: DefinitionBase = node.extra["definition"];
        hover = { contents: def.getNote() };
    }
    return hover;
});

documents.onDidChangeContent(change => {
    let file = updateAndVaidateDocument(change.document, graph, connection);
    if (file) {
        last = current;
        current = file;
    }
});

documents.listen(connection);
connection.listen();
