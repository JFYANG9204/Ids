import { fileURLToPath, pathToFileURL } from "url";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
    CodeAction,
    CompletionItem,
    createConnection,
    Hover,
    InitializeResult,
    Location,
    Position,
    ProposedFeatures,
    Range,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { ParserFileDigraph, positionInFunction } from "./lib/file";
import {
    CallExpression,
    DeclarationBase,
    File,
    PreIncludeStatement,
} from "./lib/types";
import {
    builtInCompletions,
    builtInConstCompletions,
    builtInFunctionCompletions,
    getCompletionFromPosition,
    getCompletionsFromDeclarations,
    getCompletionsFromScope,
    getHoverFromDeclaration,
    getSignatureHelpFromFunction,
    keywordsCompletions,
    preKeywordsCompletions
} from "./completion";
import {
    createCodeAction,
    createCodeActionByCommand,
    getNodeFromDocPos,
    updateAndVaidateDocument,
} from "./util";
import { builtInModule } from "./declaration";
import { actionMessages } from "./messages";
import { positionInEvent } from "./lib/file/util";

let connection = createConnection(ProposedFeatures.all);
let documents = new TextDocuments(TextDocument);
let current: Map<string, File> = new Map();
let last: Map<string, File> = new Map();
let graph: ParserFileDigraph;
let folderPath: string;
let currentCompletions: CompletionItem[] = [];

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
            referencesProvider: true,
            codeActionProvider: true
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
            return;
        }

        let pos = doc.offsetAt(textDocumentPosition.position);
        let text = doc.getText().substring(0, pos);
        let path = fileURLToPath(textDocumentPosition.textDocument.uri);

        if (text.endsWith("#")) {
            return { isIncomplete: false, items: preKeywordsCompletions };
        };

        let lastFile = last.get(path.toLowerCase());
        if (lastFile) {

            if (text.endsWith(".") ||
                text.endsWith("/") ||
                text.endsWith("\\")) {
                return getCompletionFromPosition(
                    lastFile,
                    pos - 1,
                    text.slice(pos - 1, pos),
                    text.charCodeAt(pos - 2)
                );
            }

            let func = positionInFunction(lastFile.program.body, pos);
            if (func) {
                let funcCompletions = getCompletionsFromScope(func.scope);
                funcCompletions = funcCompletions.concat(keywordsCompletions,
                    builtInFunctionCompletions,
                    builtInConstCompletions,
                    getCompletionsFromScope(lastFile.scope, true));
                return { isIncomplete: true, items: funcCompletions };
            }

            let event = positionInEvent(lastFile.program.body, pos);
            if (event && event.scope) {
                let eventCompletions = getCompletionsFromScope(event.scope);
                if (event.name.name.toLowerCase() === "onnextcase") {
                    eventCompletions = eventCompletions.concat(
                        getCompletionsFromDeclarations(lastFile.scope.metadata));
                }
                eventCompletions = eventCompletions.concat(keywordsCompletions,
                    builtInFunctionCompletions,
                    builtInConstCompletions);
                return { isIncomplete: true, items: eventCompletions };
            }
        }

        let completions: CompletionItem[] = builtInCompletions.concat(
            keywordsCompletions);
        if (lastFile?.scope) {
            completions = completions.concat(currentCompletions);
        }

        return { isIncomplete: true, items: completions };
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
    let node: CallExpression | undefined;
    getNodeFromDocPos(documents,
        params.textDocument.uri,
        params.position,
        current,
        false,
        sub => {
            if (sub.type === "CallExpression") {
                node = sub as CallExpression;
            }
        });
    if (!node) {
        return null;
    }

    return getSignatureHelpFromFunction(node);
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

connection.onReferences(param => {

    const node = getNodeFromDocPos(documents,
        param.textDocument.uri,
        param.position,
        current,
        true);

    if (!node) {
        return null;
    }

    const dec: DeclarationBase | undefined = node.extra["declaration"];

    if (!dec) {
        return null;
    }

    let referenced: Location[] = [];
    for (let i = 0; i < dec.referenced.length; ++i) {
        const cur = dec.referenced[i];
        const uri = pathToFileURL(cur.loc.fileName).toString();
        referenced.push(Location.create(uri,
            Range.create(
                Position.create(cur.loc.start.line - 1, cur.start),
                Position.create(cur.loc.end.line - 1, cur.end))));
    }
    return referenced;
});

connection.onCodeAction(params => {
    const diags = params.context.diagnostics;
    const uri = params.textDocument.uri;
    const actions: CodeAction[] = [];

    let ignoreAllErrorAction = createCodeAction(
        uri,
        actionMessages.ignoreTypeError,
        "'ignore-type-error");

    let ignoreAllPathErrorAction = createCodeAction(
        uri,
        actionMessages.ignorePathError,
        "'ignore-path-error");

    diags.forEach(diag => {
        ignoreAllErrorAction.diagnostics?.push(diag);
        ignoreAllPathErrorAction.diagnostics?.push(diag);
        actions.push(
            createCodeActionByCommand(actionMessages.ignoreThisPathError, "ignore-path-error", diag.range.start.line),
            createCodeActionByCommand(actionMessages.ignoreThisTypeError, "ignore-type-error", diag.range.start.line)
        );
    });

    actions.push(ignoreAllErrorAction, ignoreAllPathErrorAction);
    return actions;
});

documents.onDidChangeContent(change => {
    updateAndVaidateDocument(change.document, connection, current, last, graph);
    let path = fileURLToPath(change.document.uri).toLowerCase();
    let lastFile = last.get(path);
    if (lastFile) {
        currentCompletions = getCompletionsFromScope(lastFile.scope);
    }
});

documents.listen(connection);
connection.listen();
