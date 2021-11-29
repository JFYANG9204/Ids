import { join } from "path";
import {
    workspace,
    ExtensionContext,
    window,
    commands,
    WorkspaceEdit,
    Position
} from "vscode";
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    let serverModule = context.asAbsolutePath(join('server', 'out', 'server.js'));
    let debugOptions = { execArgv: [ '--nolazy', '--inspect=6009' ] };
    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };

    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'ds' }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        }
    };

    function createWorkspaceEdit(text: string) {
        let uri = window.activeTextEditor?.document.uri;
        if (!uri) {
            return undefined;
        }
        let edit = new WorkspaceEdit();
        edit.insert(uri, new Position(0, 0), "'" + text + "\n");
        return edit;
    }

    function addTextAtBegining(text: string) {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        let edit = createWorkspaceEdit(text);
        if (!edit) {
            return;
        }
        workspace.applyEdit(edit);
    }

    const executeIgnoreTypeError = () => {
        addTextAtBegining("ignore-type-error");
    };

    const executeIgnorePathError = () => {
        addTextAtBegining("ignore-path-error");
    };

    const insertTextAtPosition = (text: string, line: number) => {
        let activeDoc = window.activeTextEditor?.document;
        if (!activeDoc) {
            return;
        }
        let textLine = activeDoc.lineAt(line);
        let start = textLine.range.start.character + textLine.firstNonWhitespaceCharacterIndex;
        let edit = new WorkspaceEdit();
        let leadingWs = " ".repeat(textLine.firstNonWhitespaceCharacterIndex);
        edit.insert(activeDoc.uri, new Position(line, start), "'" + text + "\n" + leadingWs);
        workspace.applyEdit(edit);
    };

    context.subscriptions.push(
        commands.registerCommand("ids.executeIgnoreTypeError", executeIgnoreTypeError),
        commands.registerCommand("ids.executeIgnorePathError", executeIgnorePathError),
        commands.registerCommand("ids.insertTextAtPosition", insertTextAtPosition)
    );

    client = new LanguageClient(
        'dsLanguageServer',
        'Ds Lanugage Server',
        serverOptions,
        clientOptions
    );

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

