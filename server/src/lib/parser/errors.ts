import { NodeBase } from "../types";
import { getLineInfo, Position } from "../util/location";
import { CommentParser } from "./comment";

export type ErrorCode =
    | "DATACOLLECTION_SCRIPT_PARSER_SYNTAX_ERROR"
    | "DATACOLLECTION_SCRIPT_PARSER_SYNTAX_WARNING";

export type ErrorContext = {
    pos: number,
    loc: Position,
    code?: string,
    reasonCode?: string,
};

export type ParsingError = {
    start: number,
    pos: number,
    loc: Position,
    fileName: string,
    code?: string,
    reasonCode?: string,
} & SyntaxError;

export type ErrorTemplate = {
    code: ErrorCode,
    template: string,
    reasonCode: string,
};

export type ErrorTemplates = {
    [key: string]: ErrorTemplate
};

export function makeErrorTemplates(
    message: { [key: string]: string },
    code: ErrorCode
): ErrorTemplates {
    const templates: {[key: string]: ErrorTemplate} = {};
    Object.keys(message).forEach(reasonCode => {
        templates[reasonCode] = Object.freeze({
            code,
            reasonCode,
            template: message[reasonCode]
        });
    });
    return Object.freeze(templates);
}

export class ErrorParser extends CommentParser {

    raiseAtLocation(start: number, end: number, template: ErrorTemplate, warning: boolean, ...param: any) {
        const loc = getLineInfo(this.input, start);
        const message =
            template.template.replace(/%(\d+)/g, (_, i: number) => param[i])
            + `[${loc.line}, ${loc.column}]`;
        const err: ParsingError = {
            name: template.code,
            start: start,
            pos: end,
            loc: loc,
            message: message,
            fileName: this.fileName,
        };
        if (this.options.errorRecovery) {
            if (warning) {
                this.state.warnings.push(err);
            } else {
                this.state.errors.push(err);
            }
            return err;
        } else {
            throw err;
        }
    }

    raiseAtNode(node: NodeBase, template: ErrorTemplate, warning: boolean, ...params: any) {
        return this.raiseAtLocation(node.start, node.end, template, warning, ...params);
    }

    raise(pos: number, template: ErrorTemplate, ...params: any) {
        const loc = getLineInfo(this.input, pos);
        const message =
            template.template.replace(/%(\d+)/g, (_, i: number) => params[i])
            + `[${loc.line}, ${loc.column}]`;
        return this._raise({
            pos: pos,
            loc: loc,
            code: template.code,
            reasonCode: template.reasonCode,
        }, message, template.code);
    }

    raiseOverwirte(pos: number, template: ErrorTemplate, ...params: any) {
        const loc = getLineInfo(this.input, pos);
        const message =
            template.template.replace(/%(\d+)/g, (_, i: number) => params[i])
            + `[${loc.line}, ${loc.column}]`;
        if (this.options.errorRecovery) {
            const errors = this.state.errors;
            for (let i = errors.length - 1; i >=0; i--) {
                const err = errors[i];
                if (err.pos === pos) {
                    return Object.assign(err, { message });
                } else if (err.pos < pos) {
                    break;
                }
            }
        }
    }

    _raise(context: ErrorContext, message: string, name: string): ParsingError {
        const err: ParsingError = {
            name: name,
            start: this.state.start,
            pos: context.pos,
            loc: context.loc,
            message: message,
            fileName: this.fileName,
        };
        if (this.options.errorRecovery) {
            this.state.errors.push(err);
            return err;
        } else {
            throw err;
        }
    }

}



