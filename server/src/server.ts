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
import {
    CallExpression,
    DeclarationBase,
    File,
    FunctionDeclaration,
} from "./lib/types";
import {
    builtInCompletions,
    getCompletionFromPosition,
    getCompletionsFromScope,
    getHoverFromDeclaration,
    getSignatureHelpFromFunction,
    keywordsCompletions,
    preKeywordsCompletions
} from "./completion";
import {
    updateAndVaidateDocument,
} from "./util";
import {
    positionAt,
} from "./lib/file/util";
import { builtInModule } from "./lib/util/declaration";

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
            signatureHelpProvider: {
                triggerCharacters: [ "(", "," ]
            }
        }
    };
    if (params.workspaceFolders) {
        folderPath = fileURLToPath(params.workspaceFolders[params.workspaceFolders.length - 1].uri);
        graph = new ParserFileDigraph(folderPath, builtInModule);
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
        let completions: CompletionItem[] = builtInCompletions.concat(
            keywordsCompletions);
        if (lastFile?.scope) {
            completions = completions.concat(getCompletionsFromScope(lastFile.scope));
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
    let dec: DeclarationBase | undefined = node.extra["declaration"];
    if (dec) {
        hover = getHoverFromDeclaration(dec);
    }
    return hover;
});

connection.onSignatureHelp(params => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) {
        return null;
    }
    const pos = doc.offsetAt(params.position);
    let curFile = current.get(fileURLToPath(params.textDocument.uri).toLowerCase());
    if (!curFile) {
        return null;
    }
    const node = positionAt(curFile.program.body, pos, false, 0);
    if (node.type === "CallExpression") {
        const func = node as CallExpression;
        return getSignatureHelpFromFunction(func);
    }
    return null;
});

documents.onDidChangeContent(change => {
    updateAndVaidateDocument(change.document, connection, current, last, graph);
});

documents.onDidOpen(listener => {
    updateAndVaidateDocument(listener.document, connection, current, last, graph);
});

documents.listen(connection);
connection.listen();
