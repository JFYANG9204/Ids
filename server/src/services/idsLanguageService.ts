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
    DocumentLink,
    DocumentLinkParams,
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
    private workspaces: Map<string, { name: string, fsPath: string, refCount: number }>;
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
        await Promise.all(workspaceFolders.map(workspace => this.addWorkspace({ name: workspace.name, fsPath: getFileFsPath(workspace.uri), refCount: 1 })));
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
        this.connection.onDocumentLinks(this.onDocumentLinks.bind(this));
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
        if (this.projects.has(projectRoot)) {
            return this.projects.get(projectRoot);
        }
        if (this.loadingProjects.has(projectRoot)) {
            while (!this.projects.has(projectRoot)) {
                await new Promise(resolve => { setTimeout(resolve, 200); });
            }
            return this.projects.get(projectRoot);
        }
        this.loadingProjects.add(projectRoot);
        const workDoneProcess = await this.connection.window.createWorkDoneProgress();
        workDoneProcess.begin(`????????????: ${projectRoot}`);
        const project = await createProjectService(projectRoot, this.connection, this.documentService);
        this.projects.set(projectRoot, project);
        workDoneProcess.done();
        return project;
    }

    async onCompletion(params: CompletionParams): Promise<CompletionList> {
        const project = await this.getProjectService(params.textDocument.uri);
        return project?.onCompletion(params) ?? EMPTY_COMPLETIONLIST;
    }

    async onCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
        return item;
    }

    async onHover(params: HoverParams): Promise<Hover | null> {
        const project = await this.getProjectService(params.textDocument.uri);
        return project?.onHover(params) ?? EMPTYE_HOVER;
    }

    async onDefinition(params: DefinitionParams): Promise<Definition | null> {
        const project = await this.getProjectService(params.textDocument.uri);
        return project?.onDefinition(params) ?? [];
    }

    async onReferences(params: ReferenceParams): Promise<Location[] | null> {
        const project = await this.getProjectService(params.textDocument.uri);
        return project?.onReferences(params) ?? [];
    }

    async onSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | null> {
        const project = await this.getProjectService(params.textDocument.uri);
        return project?.onSignatureHelp(params) ?? null;
    }

    async onCodeAction(params: CodeActionParams): Promise<CodeAction[]> {
        const project = await this.getProjectService(params.textDocument.uri);
        return project?.onCodeAction(params) ?? [];
    }

    async onRenameRequest(params: RenameParams): Promise<WorkspaceEdit | null> {
        const project = await this.getProjectService(params.textDocument.uri);
        return project?.onRenameRequest(params) ?? null;
    }

    async onDocumentLinks(params: DocumentLinkParams): Promise<DocumentLink[]> {
        const project = await this.getProjectService(params.textDocument.uri);
        return project?.onDocumentLinks(params) ?? [];
    }

    async doValidate(doc: TextDocument) {
        const project = await this.getProjectService(doc.uri);
        return project?.doValidate(doc) ?? null;
    }

    async validateTextDocument(textDocument: TextDocument) {
        const diagnostics = await this.doValidate(textDocument);
        if (diagnostics) {
            this.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
        }
    }

    get capabilities(): ServerCapabilities {
        return {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            workspace: {
                workspaceFolders: { supported: true, changeNotifications: true },
                fileOperations: { willRename: { filters: [{ pattern: { glob: "**/*.{mrs,dms,ini,inc}" } }] } }
            },
            completionProvider: { resolveProvider: true, triggerCharacters: [".", "\\", "/", "#", "\""] },
            signatureHelpProvider: { triggerCharacters: [ "(" ] },
            codeActionProvider: {
                codeActionKinds: [
                    CodeActionKind.QuickFix
                ],
                resolveProvider: false
            },
            hoverProvider: true,
            renameProvider: true,
            definitionProvider: true,
            referencesProvider: true,
            documentLinkProvider: {
                resolveProvider: false
            }
        };
    }

    private async addWorkspace(workspace: { name: string, fsPath: string, refCount: number }) {
        if (!this.workspaces.has(workspace.fsPath)) {
            this.workspaces.set(workspace.fsPath, workspace);
        }
    }

    private setupWorkspaceListeners() {
        this.connection.onInitialized(() => {
            this.connection.workspace.onDidChangeWorkspaceFolders(async e => {
                await Promise.all(e.added.map(el => this.addWorkspace({ name: el.name, fsPath: getFileFsPath(el.uri), refCount: 1 })));
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
        this.documentService.onDidOpen(listener => {
            let fsPath = getFileFsPath(listener.document.uri);
            let root = this.getProjectRootPath(fsPath);
            let workspace = Array.from(this.workspaces.values()).find(ws => fsPath.startsWith(ws.fsPath));
            if (!workspace) {
                if (root) {
                    this.addWorkspace({ name: "", fsPath: root, refCount: 1 });
                }
            } else {
                workspace.refCount++;
                this.connection.console.log(`workspace increase by count ${workspace.refCount} at ${workspace.fsPath}`);
            }
        });
        this.documentService.onDidChangeContent(change => {
            this.validateTextDocument(change.document);
        });
        this.documentService.onDidClose(async listener => {
            this.connection.sendDiagnostics({ uri: listener.document.uri, diagnostics: [] });
            let fsPath = getFileFsPath(listener.document.uri);
            let workspace = Array.from(this.workspaces.values()).find(ws => fsPath.startsWith(ws.fsPath));
            if (workspace) {
                workspace.refCount--;
                this.connection.console.log(`workspace decrease by count ${workspace.refCount} at ${workspace.fsPath}`);
                if (workspace.refCount === 0) {
                    this.projects.get(workspace.fsPath)?.dispose();
                    this.projects.delete(workspace.fsPath);
                    this.workspaces.delete(workspace.fsPath);
                    this.connection.console.log(`uninstall project: ${workspace.fsPath}`);
                    this.loadingProjects.delete(workspace.fsPath);
                }
            }
        });
    }

}


