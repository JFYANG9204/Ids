import { join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import {
    AnnotatedTextEdit,
    CodeAction,
    CodeActionKind,
    Command,
    Position as Pos,
    Range,
    TextDocumentEdit,
    TextDocuments,
    TextEdit,
    WorkspaceEdit,
    _Connection
} from "vscode-languageserver";
import {
    Position,
    TextDocument
} from "vscode-languageserver-textdocument";
import { builtInModule, loadDecarationFiles } from "./declaration";
import { raiseErrors } from "./errors";
import {
    getAllUsefulFile,
    getCurrentParser,
    getFileTypeMark,
    ParserFileDigraph,
    positionAt,
    readFileAndConvertToUtf8
} from "./lib/file";
import { FileContent, positionIn } from "./lib/file/util";
import { createBasicOptions } from "./lib/options";
import { Parser } from "./lib/parser";
import { File, Identifier, NodeBase } from "./lib/types";
import { updateScope } from "./lib/util/scope";


export function loadBuiltInModule() {
    const folder = join(__dirname, "../../../src/lib/built_in_modules");
    const module = getAllUsefulFile(folder);
    return loadDecarationFiles(module);
}


export function updateAndVaidateDocument(
    textdocument: TextDocument,
    connection: _Connection,
    current: Map<string, File>,
    last: Map<string, File>,
    graph?: ParserFileDigraph,
) {
    const uri = textdocument.uri;
    const path = fileURLToPath(uri);
    const content = textdocument.getText();
    let file;
    let exist;
    if (graph && (exist = graph.getData(path))) {
        if (exist.filePath.endsWith(".d.mrs") &&
            exist.file) {
            let fileMap = new Map<string, FileContent>();
            fileMap.set(exist.filePath.toLowerCase(),
                { uri: exist.uri, content: exist.file.parser.input, path: exist.filePath });
            let declares = loadDecarationFiles(fileMap);
            if (declares.scope && graph.global) {
                updateScope(graph.global, declares.scope);
            }
        } else {
            graph.updateData(path, content);
            graph.setStart(path);
        }
        const start = graph.startParse();
        if (start) {
            if (start.path.toLowerCase() === path.toLowerCase()) {
                file = start;
            } else {
                file = getCurrentParser(start, path);
            }
        }
    }
    if (!file) {
        const parser = createSingleParser(path, content, uri);
        const typeMark = getFileTypeMark(content);
        if (typeMark) {
            parser.options.sourceType = typeMark;
        }
        file = parser.parse();
    }
    const cur = current.get(path.toLowerCase());
    if (cur) {
        last.set(path.toLowerCase(), cur);
    }
    current.set(path.toLowerCase(), file);
    raiseErrorsFromFile(connection, textdocument, file);
    return file;
}

export function raiseErrorsFromFile(connection: _Connection, doc: TextDocument, file?: File) {
    if (!file) {
        return;
    }
    const errs = raiseErrors(doc, file);
    connection.sendDiagnostics({
        uri: doc.uri,
        diagnostics: errs
    });
}

export function createSingleParser(path: string, content?: string, uri?: string, graph?: boolean) {
    let text = content;
    if (!text) {
        text = readFileAndConvertToUtf8(path);
    }
    return new Parser(createBasicOptions(path, false, uri, builtInModule.scope, graph), text);
}

export function getNodeFromDocPos(
    docmuents: TextDocuments<TextDocument>,
    uri: string,
    pos: Position,
    fileMap: Map<string, File>,
    untilId: boolean = false,
    additional?: (node: NodeBase) => void) {
    const doc = docmuents.get(uri);
    if (!doc) {
        return null;
    }
    const position = doc.offsetAt(pos);
    let curFile = fileMap.get(fileURLToPath(uri).toLowerCase());
    if (!curFile) {
        return null;
    }

    if (additional) {
        let node = curFile.program.body;
        positionIn(node, position, additional);
        return node;
    }

    return positionAt(curFile.program.body, position, untilId, 0);
}

export function createTextEdit(start: Position, end: Position, newText: string): TextEdit {
    return {
        newText,
        range: Range.create(start, end)
    };
}

export function createWorkspaceEditorNotReplace(uri: string, start: Position, end: Position, text: string) {
    let textEdit = createTextEdit(start, end ,text);
    let edit = TextDocumentEdit.create({ version: null, uri }, [ textEdit ]);
    let workspaceEdit: WorkspaceEdit = {
        changes: { uri: [ textEdit ] },
        documentChanges: [ edit ]
    };
    return workspaceEdit;
}

export function createWorkspaceEditorInsertContent(uri: string, start: Position, text: string) {
    return createWorkspaceEditorNotReplace(uri, start, start, text + "\n");
}

export function createCodeAction(uri: string, title: string, text: string) {
    return CodeAction.create(title, createWorkspaceEditorInsertContent(uri, Pos.create(0, 0), text), CodeActionKind.QuickFix);
}

export function createCodeActionByCommand(title: string, text: string, line: number) {
    return CodeAction.create(title, Command.create(title, "ids.insertTextAtPosition", text, line), CodeActionKind.QuickFix);
}

export function createRenameTextEdit(node: NodeBase, changes: {[uri: string]: TextEdit[]}) {
    let start = Pos.create(node.loc.start.line - 1, node.loc.start.column);
    let end = Pos.create(node.loc.end.line - 1, node.loc.end.column);
    let uri = pathToFileURL(node.loc.fileName).toString();
    let text = (node instanceof Identifier) ? node.name : "";
    let edit = createTextEdit(start, end ,text);
    if (changes[uri]) {
        changes[uri].push(edit);
    } else {
        changes[uri] = [ edit ];
    }
    let annotation: AnnotatedTextEdit = { annotationId: text, newText: text, range: Range.create(start, end) };
    return annotation;
}
