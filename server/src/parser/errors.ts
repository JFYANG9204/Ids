

namespace ds {

    export type ParsingErrorType = "error" | "warning";

    export interface ParsingError extends SyntaxError {
        range: ReadonlyRange;
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

    const ERRORMESSAGES = {
        unexpectedToken: createErrorTemplate(1001, "意外的标识符,应为'%0'."),
    };

    function raiseParsingError(options: { range: ReadonlyRange, fsPath: string }, template: ErrorTemplate, ...params: any): ParsingError;
    function raiseParsingError(node: Node, template: ErrorTemplate, ...params: any): ParsingError;

    function raiseParsingError(options: { range: ReadonlyRange, fsPath: string } | Node, template: ErrorTemplate, ...params: any): ParsingError {
        const message = template.template.replace(/%(\d+)/g, (_, i: number) => params[i]);
        let range: Range;
        let fsPath: string;
        if (options["kind"]) {
            let node = options as Node;
            range = { start: node.start, end: node.end };
            fsPath = node.fsPath;
        } else {
            let option = options as { range: ReadonlyRange, fsPath: string };
            range = option.range;
            fsPath = options.fsPath;
        }
        return { range, code: template.code, message, fsPath, type: "error", name: "DS_SYNTAX_ERROR" };
    }

}