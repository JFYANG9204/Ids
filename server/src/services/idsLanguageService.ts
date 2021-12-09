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
import { createProjectService, ProjectService } from "./projectSevice";
import { getFileFsPath } from "../fileHandler/path";
import { dirname } from "path";
import { TextDocument } from "vscode-languageserver-textdocument";


export class IdsLanguageService {

    private connection: Connection;
    private workspaces: Map<string, { name: string, fsPath: string }>;
    private documentService: DocumentService;
    private projects: Map<string, ProjectService>;
    private loadingProjects: Set<string>;

    constructor(connection: Connection) {
        this.connection = connection;
        this.documentService = new DocumentService(connection);
        this.workspaces = new Map();
        this.projects = new Map();
        this.loadingProjects = new Set();
    }

    async init(params: InitializeParams) {
        const workspaceFolders = params.workspaceFolders ?? [];
        if (params.capabilities.workspace?.workspaceFolders) {
            this.setupWorkspaceListeners();
        }
        await Promise.all(workspaceFolders.map(workspace => this.addWorkspace({ name: workspace.name, fsPath: getFileFsPath(workspace.uri) })));
        this.setupHandlers();
        this.setupFileChangeListeners();
        this.connection.onShutdown(() => {
            this.dispose();
        });
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

    private getAllWorkspaceRoot() {
        return Array.from(this.workspaces.keys());
    }

    private async getProjectService(uri: string): Promise<ProjectService | undefined> {
        const fsPath = getFileFsPath(uri);
        const workspaceRoots = this.getAllWorkspaceRoot();
        let projectRoot = workspaceRoots.find(root => fsPath.startsWith(root)) ?? this.getProjectRootPath(fsPath);
        if (!projectRoot) {
            return undefined;
        }
        if (this.loadingProjects.has(projectRoot)) {
            while (!this.projects.has(projectRoot)) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            return this.projects.get(fsPath);
        }
        this.loadingProjects.add(projectRoot);
        const workDoneProgress = await this.connection.window.createWorkDoneProgress();
        workDoneProgress.begin(`载入项目: ${projectRoot}`);
        const project = await createProjectService(projectRoot, this.connection, this.documentService);
        this.projects.set(projectRoot, project);
        workDoneProgress.done();
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

    async validateTextDocument(textDocument: TextDocument) {
        let project = await this.getProjectService(textDocument.uri);
        project?.doValidate(textDocument);
    }

    get capabilities(): ServerCapabilities {
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

    private async addWorkspace(workspace: { name: string, fsPath: string }) {
        if (!this.workspaces.has(workspace.fsPath)) {
            this.workspaces.set(workspace.fsPath, workspace);
        }
    }

    private setupWorkspaceListeners() {
        this.connection.onInitialized(() => {
            this.connection.workspace.onDidChangeWorkspaceFolders(async e => {
                await Promise.all(e.added.map(el => this.addWorkspace({ name: el.name, fsPath: getFileFsPath(el.uri) })));
            });
        });
    }

    private getProjectRootPath(path: string) {
        let fsPath = path;
        while (!(fsPath = dirname(fsPath)).toLowerCase().endsWith("dpgm")) {
            if (fsPath.endsWith("\\") || fsPath.endsWith("/") || fsPath === ".") {
                return undefined;
            }
        }
        return fsPath;
    }

    private setupFileChangeListeners() {
        this.documentService.onDidChangeContent(change => {
            this.validateTextDocument(change.document);
        });
        this.documentService.onDidClose(async listener => {
            let project = await this.getProjectService(listener.document.uri);
            if (project) {
                project.errorService.delete(listener.document.uri);
            }
        });
    }

}


