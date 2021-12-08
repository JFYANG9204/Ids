import {
    CodeAction,
    CodeActionKind,
    CodeActionParams,
    CompletionItem,
    CompletionList,
    CompletionParams,
    Connection,
    Definition,
    DefinitionParams,
    Hover,
    HoverParams,
    InitializeParams,
    Location,
    ReferenceParams,
    RenameParams,
    ServerCapabilities,
    SignatureHelp,
    SignatureHelpParams,
    TextDocumentSyncKind,
    WorkspaceEdit
} from "vscode-languageserver";
import { EMPTYE_HOVER, EMPTY_COMPLETIONLIST } from "./capabilities";
import { DocumentService } from "./documentService";
import { ProjectService } from "./projectSevice";
import { getFileFsPath } from "../fileHandler/path";


export class IdsService {

    private connection: Connection;
    private documentService: DocumentService;
    private projects: Map<string, ProjectService> = new Map();

    constructor(connection: Connection) {
        this.connection = connection;
        this.documentService = new DocumentService(connection);
    }

    async init(params: InitializeParams) {
        this.setupHandlers();
    }

    private setupHandlers() {
        this.connection.onCompletion(this.onCompletion.bind(this));
        this.connection.onCompletionResolve(this.onCompletionResolve.bind(this));
        this.connection.onHover(this.onHover.bind(this));
        this.connection.onDefinition(this.onDefinition.bind(this));
        this.connection.onReferences(this.onReferences.bind(this));
        this.connection.onSignatureHelp(this.onSignatureHelp.bind(this));
        this.connection.onCodeAction(this.onCodeAction.bind(this));
        this.connection.onRenameRequest(this.onRenameRequest.bind(this));
    }

    dispose() {
        this.projects.forEach(prj => {
            prj.dispose();
        });
    }

    listen() {
        this.connection.listen();
    }

    private async getProjectService(uri: string): Promise<ProjectService | undefined> {
        const fsPath = getFileFsPath(uri);
        const project = Array.from(this.projects.values()).
            find(prj => fsPath.startsWith(prj.getRootPath()));
        return project;
    }

    async onCompletion(params: CompletionParams): Promise<CompletionList> {
        let project = await this.getProjectService(params.textDocument.uri);
        return project?.onCompletion(params) ?? EMPTY_COMPLETIONLIST;
    }

    async onCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
        return item;
    }

    async onHover(params: HoverParams): Promise<Hover | null> {
        let project = await this.getProjectService(params.textDocument.uri);
        return project?.onHover(params) ?? EMPTYE_HOVER;
    }

    async onDefinition(params: DefinitionParams): Promise<Definition | null> {
        let project = await this.getProjectService(params.textDocument.uri);
        return project?.onDefinition(params) ?? [];
    }

    async onReferences(params: ReferenceParams): Promise<Location[] | null> {
        let project = await this.getProjectService(params.textDocument.uri);
        return project?.onReferences(params) ?? [];
    }

    async onSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | null> {
        let project = await this.getProjectService(params.textDocument.uri);
        return project?.onSignatureHelp(params) ?? null;
    }

    async onCodeAction(params: CodeActionParams): Promise<CodeAction[]> {
        let project = await this.getProjectService(params.textDocument.uri);
        return project?.onCodeAction(params) ?? [];
    }

    async onRenameRequest(params: RenameParams): Promise<WorkspaceEdit | null> {
        let project = await this.getProjectService(params.textDocument.uri);
        return project?.onRenameRequest(params) ?? null;
    }


    capabilities(): ServerCapabilities {
        return {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            workspace: {
                workspaceFolders: { supported: true, changeNotifications: true },
                fileOperations: { willRename: { filters: [{ pattern: { glob: "**/*.{mrs,dms,ini,inc}" } }] } }
            },
            completionProvider: { resolveProvider: true, triggerCharacters: [".", "\\", "/"] },
            signatureHelpProvider: { triggerCharacters: [ "(", "," ] },
            codeActionProvider: {
                codeActionKinds: [
                    CodeActionKind.QuickFix
                ],
                resolveProvider: true
            },
        };
    }

}


