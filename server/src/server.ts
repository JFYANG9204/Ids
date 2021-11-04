import { fileURLToPath } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
    CompletionItem,
    createConnection,
    Definition,
    Hover,
    InitializeResult,
    LocationLink,
    ProposedFeatures,
    Range,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind
} from "vscode-languageserver/node";
import { ParserFileDigraph } from "./lib/file";
import {
    CallExpression,
    File,
    FunctionDeclaration,
    Identifier,
    MemberExpression
} from "./lib/types";
import {
    builtInCompletions,
    getCompletionFromPosition,
    getCompletionsFromDefinitions,
    keywordsCompletions,
    preKeywordsCompletions
} from "./completion";
import {
    updateAndVaidateDocument,
} from "./util";
import {
    getHoverContentFromNode,
    positionAt,
} from "./lib/file/util";
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
            hoverProvider: true,
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
        let path = fileURLToPath(textDocumentPosition.textDocument.uri);
        if (text.endsWith("#")) {
            return preKeywordsCompletions;
        };
        let lastFile = last.get(path.toLowerCase());
        if (lastFile && (
            text.endsWith(".") ||
            text.endsWith("/") ||
            text.endsWith("\\"))) {
            return getCompletionFromPosition(
                lastFile,
                pos - 1,
                text.slice(pos - 1, pos),
                text.charCodeAt(pos - 2)
            );
        }
        let completions: CompletionItem[] = builtInCompletions.concat(keywordsCompletions);
        let currentFile = current.get(path.toLowerCase());
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
    let currentFile = current.get(fileURLToPath(params.textDocument.uri).toLowerCase());
    if (!currentFile) {
        return hover;
    }
    const pos = document.offsetAt(params.position);
    const node = positionAt(currentFile.program.body, pos, true, 0);
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
    updateAndVaidateDocument(change.document, connection, current, last, graph);
});

documents.onDidOpen(listener => {
    updateAndVaidateDocument(listener.document, connection, current, last, graph);
});

documents.listen(connection);
connection.listen();
