

namespace ds {

    const errors: ParsingError[] = [];
    const warinings: ParsingError[] = [];

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

    function raiseParsingErrorBase(options: { range: ReadonlyRange, fsPath: string } | Node, template: ErrorTemplate, type: ParsingErrorType, ...params: any): ParsingError {
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
        return { range, code: template.code, message, fsPath, type, name: "DS_SYNTAX_ERROR" };
    }

    function raiseError(options: { range: ReadonlyRange, fsPath: string }, template: ErrorTemplate, ...params: any): void;
    function raiseError(node: Node, template: ErrorTemplate, ...params: any): void;

    function raiseError(options: { range: ReadonlyRange, fsPath: string } | Node, template: ErrorTemplate, ...params: any) {
        errors.push(raiseParsingErrorBase(options, template, "error",...params));
    }

    function raiseWarning(options: { range: ReadonlyRange, fsPath: string }, template: ErrorTemplate, ...params: any): void;
    function raiseWarning(node: Node, template: ErrorTemplate, ...params: any): void;

    function raiseWarning(options: { range: ReadonlyRange, fsPath: string } | Node, template: ErrorTemplate, ...params: any) {
        warinings.push(raiseParsingErrorBase(options, template, "warning", ...params));
    }

    /**
     * 清除所有当前的错误和警告等提示信息
     */
    function clearErrorAndWarnings() {
        errors.splice(0);
        warinings.splice(0);
    }

}