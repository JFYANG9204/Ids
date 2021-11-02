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
import { CallExpression, File, MemberExpression } from "./lib/types";
import {
    builtInCompletions,
    getCompletionFromPosition,
    getCompletionsFromDefinitions,
    keywordsCompletions,
    preKeywordsCompletions
} from "./completion";
import { updateAndVaidateDocument } from "./util";
import { getHoverContentFromNode, positionAt } from "./lib/file/util";
import { DefinitionBase } from "./lib/util/definition";

let connection = createConnection(ProposedFeatures.all);
let documents = new TextDocuments(TextDocument);
let current: Map<string, File> = new Map();
let last: Map<string, File> = new Map();
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
        let lastFile = last.get(textDocumentPosition.textDocument.uri.toLowerCase());
        if (lastFile && (
            text.endsWith(".") ||
            text.endsWith("/") ||
            text.endsWith("\\"))) {
            let find = getCompletionFromPosition(
                lastFile,
                pos - 1,
                text.slice(pos - 1, pos)
            );
            const node = positionAt(lastFile.program.body, pos - 1);
            connection.console.log(node.type + "   " + node.extra["definition"]);
            return find;
        }
        let completions: CompletionItem[] = builtInCompletions.concat(keywordsCompletions);
        let currentFile = current.get(textDocumentPosition.textDocument.uri.toLowerCase());
        if (currentFile && currentFile.definitions) {
            let defs = getCompletionsFromDefinitions(currentFile.definitions);
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
    let currentFile = current.get(params.textDocument.uri.toLowerCase());
    if (!currentFile) {
        return hover;
    }
    const pos = document.offsetAt(params.position);
    const node = positionAt(currentFile.program.body, pos);
    let def: DefinitionBase;
    if (node instanceof MemberExpression) {
        def = node.property.extra["definition"];
    } else if (node instanceof CallExpression) {
        def = node.callee.extra["definition"];
    } else {
        def = node.extra["definition"];
    }
    if (def) {
        hover = { contents: getHoverContentFromNode(node, def) };
    }
    return hover;
});

documents.onDidChangeContent(change => {
    let file = updateAndVaidateDocument(change.document, graph, connection);
    if (file) {
        let currentFile = current.get(change.document.uri.toLowerCase());
        if (currentFile) {
            last.set(change.document.uri.toLowerCase(), currentFile);
        }
        current.set(change.document.uri.toLowerCase(), file);
    }
});

documents.listen(connection);
connection.listen();
