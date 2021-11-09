/* eslint-disable curly */
import { Tokenizer } from "../tokenizer";
import { TokenType, types as tt } from "../tokenizer/type";
import { LineMark, NodeBase } from "../types";
import { lineBreak } from "../util/whitespace";
import { ErrorMessages } from "./error-messages";
import { ErrorTemplate } from "./errors";




export class UtilParser extends Tokenizer {

    addExtra(node: NodeBase, key: string, val: any) {
        if (!node) return;
        node.extra[key] = val;
    }

    expect(type: TokenType, pos?: number) {
        this.eat(type) || this.unexpected(pos, undefined, type);
    }

    unexpected(pos?: number, template?: ErrorTemplate, tokenType?: TokenType, throwError = true) {
        const errTemplate: ErrorTemplate = template ? template : {
            code: "DATACOLLECTION_SCRIPT_PARSER_SYNTAX_ERROR",
            reasonCode: "UnexpectedToken",
            template: tokenType ? `期望外的标识符. 应为"${tokenType.label}"` :
                `期望外的标识符 '${this.state.value}'.`
        };
        const err = this.raise(pos ? pos : this.state.start, errTemplate);
        if (throwError) {
            throw err;
        }
    }

    expectString(text: string) {
        if (!(this.match(tt.identifier) &&
            this.state.value.toLowerCase() === text.toLowerCase())) {
            this.raise(
                this.state.pos,
                ErrorMessages["ExpectToken"],
                text
            );
        }
    }

    isRelational(op: "<" | ">"): boolean {
        return this.match(tt.relational) && this.state.value === op;
    }

    expectRelational(op: "<" | ">") {
        if (this.isRelational(op)) {
            this.next();
        } else {
            this.unexpected(undefined, undefined, tt.relational);
        }
    }

    hasPrecedingLineBreak(): boolean {
        return lineBreak.test(this.input.slice(this.state.lastTokenEnd, this.state.start));
    }

    hasFollowingLineBreak(): boolean {
        return lineBreak.test(this.input.slice(this.state.end, this.nextTokenStart()));
    }

    existLineMark(line: LineMark): boolean {
        if (this.state.lineMarks.length === 0) {
            return false;
        }
        for (let i = 0; i < this.state.lineMarks.length; ++i) {
            const ele = this.state.lineMarks[i];
            if (ele.value && line.value &&
                ele.value.toString().toLowerCase() === line.value.toString().toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    setNodePropValue<T>(node: NodeBase, key: string, value: T) {
        for (const prop in node) {
            if (prop.toLowerCase() === key.toLowerCase()) {
                node[prop] = value;
                return;
            }
        }
    }

}
