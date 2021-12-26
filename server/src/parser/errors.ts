import { Range } from "vscode-languageserver";

export type ParsingErrorType = "error" | "warning";

export interface ParsingError extends SyntaxError {
    range: Range;
    code: number;
    fsPath: string;
    type: ParsingErrorType;
}

export interface ErrorTemplate {
    code: number;
    template: string;
}

function createErrorTemplate(code: number, template: string): ErrorTemplate {
    return { code, template };
}

export const ERRORMESSAGES = {
    unexpected        : createErrorTemplate(1001, "意外的标识符,应为'%0'."),
};

