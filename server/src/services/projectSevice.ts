import {
    CodeAction,
    CodeActionParams,
    ColorInformation,
    ColorPresentation,
    ColorPresentationParams,
    CompletionItem,
    CompletionList,
    CompletionParams,
    Connection,
    Definition,
    DefinitionParams,
    Diagnostic,
    DocumentColorParams,
    DocumentFormattingParams,
    DocumentHighlight,
    DocumentLink,
    DocumentLinkParams,
    DocumentSymbolParams,
    FileRename,
    FoldingRange,
    FoldingRangeParams,
    Hover,
    HoverParams,
    Location,
    ReferenceParams,
    RenameParams,
    SemanticTokens,
    SemanticTokensParams,
    SemanticTokensRangeParams,
    SignatureHelp,
    SignatureHelpParams,
    SymbolInformation,
    TextDocumentEdit,
    TextDocumentPositionParams,
    TextEdit,
    WorkspaceEdit
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { FileHandler } from "../fileHandler";
import {
    getCodeAction,
    getCompletionAtPostion,
    getDefinitionAtPosition,
    getHoverAtPosition,
    getReferenceAtPosition,
    getRenameLocation,
    getSignatureHelpAtPostion
} from "./capabilities";
import { DocumentService } from "./documentService";
import { ErrorService } from "./errorService";


export interface ProjectService {
    errorService: ErrorService,
    fileHandler: FileHandler;
    getRootPath(): string,
    onCompletion(params: CompletionParams): Promise<CompletionList>;
    onHover(params: HoverParams): Promise<Hover | null>;
    onDefinition(params: TextDocumentPositionParams): Promise<Definition | null>;
    onReferences(params: ReferenceParams): Promise<Location[] | null>;
    onSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | null>;
    onCodeAction(params: CodeActionParams): Promise<CodeAction[]>;
    onRenameRequest(params: RenameParams): Promise<WorkspaceEdit | null>;
    dispose(): Promise<void>;
}

export async function createProjectService(
    folder: string,
    connection: Connection,
    documentService: DocumentService
): Promise<ProjectService> {
    const fileHandler = new FileHandler(folder);
    const errorService = new ErrorService(connection);
    return {
        fileHandler,
        errorService,
        getRootPath() {
            return fileHandler.folderPath;
        },
        async onCompletion({ textDocument, position }) {
            let file = fileHandler.getCurrent(textDocument.uri);
            let document = documentService.getDocument(textDocument.uri);
            return await getCompletionAtPostion(position, document, file);
        },
        async onHover({ textDocument, position }) {
            let file = fileHandler.getCurrent(textDocument.uri);
            let document = documentService.getDocument(textDocument.uri);
            return await getHoverAtPosition(position, document, file);
        },
        async onDefinition({ textDocument, position }) {
            let file = fileHandler.getCurrent(textDocument.uri);
            let document = documentService.getDocument(textDocument.uri);
            return await getDefinitionAtPosition(position, document, file);
        },
        async onReferences({ textDocument, position }) {
            let file = fileHandler.getCurrent(textDocument.uri);
            let document = documentService.getDocument(textDocument.uri)!;
            return await getReferenceAtPosition(position, document, file);
        },
        async onSignatureHelp({ textDocument, position }) {
            let file = fileHandler.getCurrent(textDocument.uri);
            let document = documentService.getDocument(textDocument.uri);
            return await getSignatureHelpAtPostion(position, document, file);
        },
        async onCodeAction({ context, textDocument }) {
            return await getCodeAction(context, textDocument.uri);
        },
        async onRenameRequest(params: RenameParams) {
            let file = fileHandler.getCurrent(params.textDocument.uri);
            let document = documentService.getDocument(params.textDocument.uri);
            return await getRenameLocation(params, document, file);
        },
        async dispose() {
            fileHandler.dispose();
        }
    };
}

