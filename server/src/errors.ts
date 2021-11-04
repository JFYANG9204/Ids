import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver/node";
import { ParsingError } from "./lib/parser/errors";
import { File } from "./lib/types";


export function createDiagnosticError(
    textDocument: TextDocument,
    error: ParsingError, type?: DiagnosticSeverity): Diagnostic {
    return {
        severity: type ?? DiagnosticSeverity.Error,
        range: {
            start: textDocument.positionAt(error.start),
            end: textDocument.positionAt(error.pos)
        },
        message: error.message,
        source: error.code
    };
}

export function raiseErrors(textDocument: TextDocument, file: File) {
    const diagnostics: Diagnostic[] = [];
    file.errors.forEach(
        err => diagnostics.push(createDiagnosticError(textDocument, err))
    );
    file.warnings.forEach(
        warn => diagnostics.push(createDiagnosticError(textDocument, warn, DiagnosticSeverity.Warning))
    );
    return diagnostics;
}

