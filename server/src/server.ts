import { fileURLToPath, pathToFileURL } from "url";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
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
    PreIncludeStatement,
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
    getNodeFromDocPos,
    raiseErrorsFromFile,
    updateAndVaidateDocument,
} from "./util";
import { builtInModule } from "./declaration";

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
            },
            definitionProvider: true,
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
    const node = getNodeFromDocPos(documents,
        params.textDocument.uri,
        params.position,
        current,
        true);
    if (node === null) {
        return hover;
    }
    let dec: DeclarationBase | undefined = node.extra["declaration"];
    if (dec) {
        hover = getHoverFromDeclaration(dec);
    }
    return hover;
});

connection.onSignatureHelp(params => {
    const node = getNodeFromDocPos(documents,
        params.textDocument.uri,
        params.position,
        current);
    if (!node) {
        return null;
    }
    if (node.type === "CallExpression") {
        const func = node as CallExpression;
        return getSignatureHelpFromFunction(func);
    }
    return null;
});

connection.onDefinition(params => {
    const node = getNodeFromDocPos(documents,
        params.textDocument.uri,
        params.position,
        current,
        true);
    if (!node) {
        return null;
    }
    let uri;
    if (node.type === "PreIncludeStatement") {
        const pre = node as PreIncludeStatement;
        uri = pathToFileURL(pre.path).toString();
        let start: Position = { line: 0, character: 0 };
        let end : Position = { line: 0, character: 0 };
        return { uri, range: { start, end } };
    }
    const dec: DeclarationBase | undefined = node.extra["declaration"];
    if (!dec || !dec.loc.fileName) {
        return null;
    }
    uri = pathToFileURL(dec.loc.fileName).toString();
    let start: Position = { line: dec.name.loc.start.line - 1, character: dec.name.start };
    let end: Position = { line: dec.name.loc.end.line - 1, character: dec.name.end };
    return { uri, range: { start, end } };
});

documents.onDidChangeContent(change => {
    updateAndVaidateDocument(change.document, connection, current, last, graph);
});

documents.onDidOpen(listener => {
    let path = fileURLToPath(listener.document.uri).toLowerCase();
    let exist;
    if (graph && (exist = graph.getData(path))) {
        raiseErrorsFromFile(connection, listener.document, exist.file);
    } else {
        updateAndVaidateDocument(listener.document, connection, current, last, graph);
    }
});

documents.listen(connection);
connection.listen();
