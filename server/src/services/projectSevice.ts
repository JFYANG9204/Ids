import {
    CodeAction,
    CodeActionParams,
    ColorInformation,
    ColorPresentation,
    ColorPresentationParams,
    CompletionItem,
    CompletionList,
    CompletionParams,
    Definition,
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
    Location,
    SemanticTokens,
    SemanticTokensParams,
    SemanticTokensRangeParams,
    SignatureHelp,
    SymbolInformation,
    TextDocumentEdit,
    TextDocumentPositionParams,
    TextEdit
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";


export interface ProjectService {
    onDocumentFormatting(params: DocumentFormattingParams): Promise<TextEdit[]>;
    onCompletion(params: CompletionParams): Promise<CompletionList>;
    onCompletionResolve(item: CompletionItem): Promise<CompletionItem>;
    onHover(params: TextDocumentPositionParams): Promise<Hover>;
    onDocumentHighlight(params: TextDocumentPositionParams): Promise<DocumentHighlight[]>;
    onDefinition(params: TextDocumentPositionParams): Promise<Definition>;
    onReferences(params: TextDocumentPositionParams): Promise<Location[]>;
    onDocumentLinks(params: DocumentLinkParams): Promise<DocumentLink[]>;
    onDocumentSymbol(params: DocumentSymbolParams): Promise<SymbolInformation>;
    onDocumentColors(params: DocumentColorParams): Promise<ColorInformation[]>;
    onColorPresentations(params: ColorPresentationParams): Promise<ColorPresentation[]>;
    onSignatureHelp(params: TextDocumentPositionParams): Promise<SignatureHelp | null>;
    onFoldingRanges(params: FoldingRangeParams): Promise<FoldingRange[]>;
    onCodeAction(params: CodeActionParams): Promise<CodeAction[]>;
    onCodeActionResolve(action: CodeAction): Promise<CodeAction>;
    onWillRenameFile(fileRename: FileRename): Promise<TextDocumentEdit[]>;
    onSemanticTokens(params: SemanticTokensParams | SemanticTokensRangeParams): Promise<SemanticTokens>;
    doValidate(doc: TextDocument): Promise<Diagnostic[] | null>;
    dispose(): Promise<void>;
}

