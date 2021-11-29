import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import {
    workspace,
    ExtensionContext,
    window,
    commands
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

    const executeIgnoreTypeError = () => {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        const path = fileURLToPath(activeEditor.document.uri.toString());
        const text = readFileSync(path).toString();
        let updateText = "'ignore-type-error\n" + text;
        writeFileSync(path, updateText);
    };

    context.subscriptions.push(
        commands.registerCommand("ids.executeIgnoreTypeError", executeIgnoreTypeError)
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

