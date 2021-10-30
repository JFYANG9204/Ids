/* eslint-disable curly */
/* eslint-disable @typescript-eslint/naming-convention */
import * as charCodes from "../util/charcodes";
import { Options } from "../options";
import { ErrorMessages } from "../parser/error-messages";
import { ErrorParser } from "../parser/errors";
import { Comment, Value } from "../types";
import { SourceLocation } from "../util/location";
import { isNewLine, isWhitespace, lineBreakG, skipWhiteSpace } from "../util/whitespace";
import { LookaheadState, State } from "./state";
import { keywords, Token, TokenType, types } from "./type";
import { isIdentifierChar, isIdentifierStart } from "../util/identifier";
import { BasicTypeDefinitions } from "../built-in/built-ins";
import { DefinitionBase } from "../util/definition";

const allowedNumberCharactor = {
    octal: [
        charCodes.digit0,
        charCodes.digit1,
        charCodes.digit2,
        charCodes.digit3,
        charCodes.digit4,
        charCodes.digit5,
        charCodes.digit6,
        charCodes.digit7,
    ],
    dec: [
        charCodes.digit0,
        charCodes.digit1,
        charCodes.digit2,
        charCodes.digit3,
        charCodes.digit4,
        charCodes.digit5,
        charCodes.digit6,
        charCodes.digit7,
        charCodes.digit8,
        charCodes.digit9,
    ],
    hex: [
        charCodes.digit0,
        charCodes.digit1,
        charCodes.digit2,
        charCodes.digit3,
        charCodes.digit4,
        charCodes.digit5,
        charCodes.digit6,
        charCodes.digit7,
        charCodes.digit8,
        charCodes.digit9,
        charCodes.uppercaseA,
        charCodes.uppercaseB,
        charCodes.uppercaseC,
        charCodes.uppercaseD,
        charCodes.uppercaseE,
        charCodes.uppercaseF,
        charCodes.lowercaseA,
        charCodes.lowercaseB,
        charCodes.lowercaseC,
        charCodes.lowercaseD,
        charCodes.lowercaseE,
        charCodes.lowercaseF
    ]
};


export class Tokenizer extends ErrorParser {

    isLookahead = false;
    tokens: Array<Token | Comment> = [];

    constructor(options: Options, input: string) {
        super();
        this.options = options;
        this.state = new State(options);
        this.input = input;
        this.length = input.length;
    }

    match(type: TokenType): boolean {
        return this.state.type === type;
    }

    matchOne(type: TokenType | Array<TokenType>): boolean {
        if (type instanceof Array) {
            for (let i = 0; i < type.length; i++) {
                const t = type[i];
                if (this.match(t)) {
                    return true;
                }
            }
            return false;
        } else {
            return this.match(type);
        }
    }

    eat(type: TokenType): boolean {
        if (this.match(type)) {
            this.next();
            return true;
        } else {
            return false;
        }
    }

    pushToken(token: Token | Comment): void {
        this.tokens.length = this.state.tokensLength;
        this.tokens.push(token);
        ++this.state.tokensLength;
    }

    createLookaheadState(state: State): LookaheadState {
        return {
            pos: state.pos,
            value: state.value,
            type: state.type,
            start: state.start,
            end: state.end
        };
    }

    lookahead(): LookaheadState {
        const old = this.state.copy();
        Object.assign(this.state, this.createLookaheadState(old));

        this.isLookahead = true;
        this.nextToken();
        this.isLookahead = false;

        const cur = this.state;
        this.state = old;
        return cur;
    }

    nextTokenStart(): number {
        skipWhiteSpace.lastIndex = this.state.pos;
        const skip = skipWhiteSpace.exec(this.input);
        if (skip) {
            return this.state.pos + skip[0].length;
        } else {
            return this.state.pos;
        }
    }

    lookaheadCharCode(): number {
        return this.input.charCodeAt(this.nextTokenStart());
    }

    // next

    nextToken() {
        this.skipSpace();
        this.state.start = this.state.pos;
        if (!this.isLookahead) this.state.startLoc = this.state.curPostion();
        const ch = this.input.codePointAt(this.state.pos);
        if (this.state.pos >= this.length || !ch) {
            this.finishToken(types.eof, { text: "" });
            return;
        }
        this.getTokenFromCode(ch);
    }

    next() {
        if (this.options.tokens) {
            this.pushToken(new Token(this.state));
        }
        this.state.lastTokenEnd = this.state.end;
        this.state.lastTokenStart = this.state.start;
        this.state.lastTokenEndLoc = this.state.endLoc;
        this.state.lastTokenStartLoc = this.state.startLoc;
        this.nextToken();
    }

    // Skip Comments

    skipBlockComment() {
        let startLoc;
        if (!this.isLookahead) startLoc = this.state.curPostion();
        const start = this.state.pos;
        const end = this.input.indexOf("!'", this.state.pos + 2);
        if (end === -1) throw this.raise(start, ErrorMessages["UnterminatedComment"]);

        this.state.pos = end + 2;
        lineBreakG.lastIndex = start;
        let match;
        while (
            (match = lineBreakG.exec(this.input)) &&
            match.index < this.state.pos
        ) {
            ++this.state.curLine;
            this.state.lineStart = match.index + match[0].length;
        }

        if (this.isLookahead || !startLoc) return;

        const value = this.input.slice(start + 2, end);
        const comment: Comment = {
            type: "CommentBlock",
            value: value,
            start: start,
            end: end,
            loc: new SourceLocation(startLoc, this.state.curPostion())
        };
        if (this.options.tokens) this.pushToken(comment);
        return comment;
    }

    skipLineComment(startSkip: number) {
        const start = this.state.pos;
        const startLoc = this.state.curPostion();
        let ch = this.input.charCodeAt((this.state.pos += startSkip));
        if (this.state.pos < this.length) {
            while(!isNewLine(ch) && ++this.state.pos < this.length) {
                ch = this.input.charCodeAt(this.state.pos);
            }
        }
        if (this.isLookahead) return;
        const end = this.state.pos;
        const value = this.input.slice(start + startSkip, end);
        const comment: Comment = {
            type: "CommentLine",
            value: value,
            start: start,
            end: end,
            loc: new SourceLocation(startLoc, this.state.curPostion())
        };
        if (this.options.tokens) this.pushToken(comment);
        return comment;
    }

    skipSpace() {
        const start = this.state.pos;
        const comments: Array<Comment> = [];
        loop: while (this.state.pos < this.length) {
            const ch = this.input.charCodeAt(this.state.pos);
            let commentBlock, commentLine;
            switch (ch) {
                case charCodes.space:
                case charCodes.nonBreakingSpace:
                case charCodes.tab:
                    this.state.pos++;
                    break;

                case charCodes.apostrophe:
                    switch (this.input.charCodeAt(this.state.pos + 1)) {
                        case charCodes.exclamationMark:
                            commentBlock = this.skipBlockComment();
                            if (commentBlock) {
                                this.addComment(commentBlock);
                                comments.push(commentBlock);
                            }
                            break;
                        default:
                            commentLine = this.skipLineComment(1);
                            if (commentLine) {
                                this.addComment(commentLine);
                                comments.push(commentLine);
                            }
                            break;
                    }
                    break;

                //case charCodes.carriageReturn:
                //    if (this.input.charCodeAt(this.state.pos + 1) === charCodes.lineFeed) {
                //        this.state.pos++;
                //    } else {
                //        this.state.pos++;
                //        this.state.curLine++;
                //        this.state.lineStart = this.state.pos;
                //    }
                //    break;
                //case charCodes.lineFeed:
                //case charCodes.lineSeparator:
                //case charCodes.paragraphSeparator:
                //    this.state.pos++;
                //    this.state.curLine++;
                //    this.state.lineStart = this.state.pos;
                //    break;

                default:
                    if (isWhitespace(ch)) {
                        this.state.pos++;
                    } else {
                        break loop;
                    }
                    break;
            }
        }

        if (comments.length > 0) {
            const end = this.state.pos;
            const commentWS = {
                start: start,
                end,
                comments,
            };
            this.state.commentStack.push(commentWS);
        }
    }

    //

    finishToken(type: TokenType, val: Value) {
        this.state.end = this.state.pos;
        this.state.type = type;
        this.state.value = val;
        if (!this.isLookahead) {
            this.state.endLoc = this.state.curPostion();
        }
    }

    finishOp(type: TokenType, size: number) {
        const text = this.input.slice(this.state.pos, this.state.pos + size);
        this.state.pos += size;
        this.finishToken(type, { text: text });
    }

    // Read

    readString() {
        let out = "";
        const chunckStart = ++this.state.pos;

        for (;;) {
            if (this.state.pos >= this.length) {
                throw this.raise(this.state.start, ErrorMessages["UnterminatedString"]);
            }
            const ch = this.input.charCodeAt(this.state.pos);
            if (ch === charCodes.quotationMark) {
                const next = this.input.charCodeAt(this.state.pos + 1);
                // "" 两个双引号为转义双引号
                if (next === charCodes.quotationMark) {
                    this.state.pos++;
                } else {
                    break;
                }
            }
            // 换行情况
            if (ch === charCodes.lineFeed ||
                ch === charCodes.lineSeparator ||
                ch === charCodes.paragraphSeparator) {
                ++this.state.curLine;
                this.state.lineStart = this.state.pos + 1;
                let lastChr;
                if (ch === charCodes.lineFeed &&
                    this.input.charCodeAt(this.state.pos - 1) === charCodes.carriageReturn) {
                    lastChr = this.input.charCodeAt(this.state.pos - 2);
                } else {
                    lastChr = this.input.charCodeAt(this.state.pos - 1);
                }
                if (lastChr !== charCodes.backslash &&
                    lastChr !== charCodes.underscore) {
                    this.raise(
                        this.state.pos - 1,
                        ErrorMessages["StringLineFeedNeedNewlineChar"]);
                }
            }
            this.state.pos++;
        }

        out = this.input.slice(chunckStart, this.state.pos++);
        this.finishToken(types.string, {
            text: out,
            definition: BasicTypeDefinitions.string,
            isBasic: true,
        });
    }

    readInt(radix: number, positive = true) {
        const allowed: number[] =
            radix === 16 ?
            allowedNumberCharactor.hex :
            radix === 8 ?
            allowedNumberCharactor.octal :
            allowedNumberCharactor.dec;
        const start = this.state.pos;

        let total = 0;
        for (let i = 0; i < Infinity; i++) {
            const code = this.input.charCodeAt(this.state.pos);
            let val;
            if (!allowed.includes(code)) {
                break;
            }

            if (code >= charCodes.lowercaseA) {
                val = code - charCodes.lowercaseA + charCodes.lineFeed;
            } else if (code >= charCodes.uppercaseA) {
                val = code - charCodes.uppercaseA + charCodes.lineFeed;
            } else if (charCodes.isDigit(code)) {
                val = code - charCodes.digit0;
            } else {
                val = Infinity;
            }

            if (val >= radix) {
                if (this.options.errorRecovery) {
                    val = 0;
                    this.raise(this.state.start + i + 2, ErrorMessages["InvalidDigit"], radix);
                } else {
                    break;
                }
            }
            ++this.state.pos;
            total = total * radix + val;
            if ((positive && total > 2147483647) ||
                (!positive && total > 2147483648)) {
                this.raise(this.state.pos, ErrorMessages["NumberIsTooLong"]);
            }
        }

        if (start === this.state.pos) return null;
        return total;
    }

    readRadixNumber() {
        const start = this.state.pos;
        const next = this.input.charCodeAt(this.state.pos + 1);
        // &H/ &h
        let val;
        if (next === charCodes.uppercaseH ||
            next === charCodes.lowercaseH) {
            this.state.pos += 2;
            val = this.readInt(16);
            if (val === null) {
                this.raise(start + 2, ErrorMessages["InvalidDigit"], 16);
            }
        } else if (next === charCodes.uppercaseO ||
                   next === charCodes.lowercaseO) {
            this.state.pos += 2;
            val = this.readInt(8);
            if (val === null) {
                this.raise(start + 2, ErrorMessages["InvalidDigit"], 8);
            }
        } else {
            throw this.raise(start + 2, ErrorMessages["InvalidNumberRadix"]);
        }

        if (isIdentifierStart(this.input.charCodeAt(this.state.pos))) {
            throw this.raise(this.state.pos, ErrorMessages["NumberIdentifier"]);
        }

        this.finishToken(types.number, {
            text: val ? val.toString() : "",
            isBasic: true,
            definition: BasicTypeDefinitions.long
        });
    }

    readNumber(startWithDot: boolean) {
        const start = this.state.pos;
        let isDecimal = false;

        if (!startWithDot && this.readInt(10) === null) {
            this.raise(start, ErrorMessages["InvalidNumber"]);
        }

        const next = this.input.charCodeAt(this.state.pos);
        if (next === charCodes.dot) {
            ++this.state.pos;
            this.readInt(10);
            isDecimal = true;
        }

        if (isIdentifierStart(this.input.charCodeAt(this.state.pos))) {
            throw this.raise(this.state.pos, ErrorMessages["NumberIdentifier"]);
        }
        const text = this.input.slice(start, this.state.pos);
        this.finishToken(
            isDecimal ? types.decimal : types.number,
            {
                text: text,
                isBasic: true,
                definition: isDecimal ?
                BasicTypeDefinitions.double :
                BasicTypeDefinitions.long
        });
    }

    readIdentifier(firstCode?: number): string {
        const chunckStart = this.state.pos;
        if (firstCode) {
            this.state.pos += firstCode <= 0xffff ? 1 : 2;
        }

        while (this.state.pos < this.length) {
            const ch = this.input.codePointAt(this.state.pos);
            if (!ch) {
                break;
            }
            if (isIdentifierChar(ch)) {
                this.state.pos += ch <= 0xffff ? 1 : 2;
            } else {
                break;
            }
        }

        return this.input.slice(chunckStart, this.state.pos);
    }

    readWord(firstCode?: number) {
        const word = this.readIdentifier(firstCode);
        let type = keywords.get(word.toLowerCase());
        if (!type) {
            type = types.identifier;
        }
        this.finishToken(type, { text: word });
    }

    readToken_numberSign() {
        this.state.pos ++;
        this.state.pos = this.nextTokenStart();
        const kw = this.readIdentifier(this.input.charCodeAt(this.state.pos));
        switch (kw) {
            case "include":
                this.finishToken(types.pre_include, { text: "include" });
                return;
            case "define":
                this.finishToken(types.pre_define, { text: "define" });
                return;
            case "undef":
                this.finishToken(types.pre_undef, { text: "undef" });
                return;
            case "if":
                this.finishToken(types.pre_if, { text: "if" });
                return;
            case "elif":
                this.finishToken(types.pre_elif, { text: "elif" });
                return;
            case "else":
                this.finishToken(types.pre_else, { text: "else" });
                return;
            case "endif":
                this.finishToken(types.pre_endif, { text: "endif" });
                return;
            case "error":
                this.finishToken(types.pre_error, { text: "error" });
                return;
            case "line":
                this.finishToken(types.pre_line, { text: "line" });
                return;

            default:
                throw this.raise(this.state.pos, ErrorMessages["InvalidOrUnexpectedToken"]);
        }
    }

    readToken_dot() {
        const next = this.input.charCodeAt(this.state.pos + 1);
        if (charCodes.isDigit(next)) {
            this.readNumber(true);
            return;
        }
        ++this.state.pos;
        this.finishToken(types.dot, { text: "." });
    }

    readToken_lt_gt(code: number) {
        const next = this.input.charCodeAt(this.state.pos + 1);
        let size = 1;
        // <>
        if (next === charCodes.equalsTo || (
            code === charCodes.lessThan && next === charCodes.greaterThan
        )) {
            size = 2;
        }
        this.finishOp(types.relational, size);
    }

    readToken_plus_min() {
        const start = this.state.pos;
        //const next = this.input.charCodeAt(this.state.pos + 1);
        this.state.pos++;
        //if (charCodes.isDigit(next)) {
        //    this.readNumber(false);
        //    let val = this.input.slice(start, this.state.pos);
        //    this.finishToken(types.number, { text: val });
        //    return;
        //}
        this.finishToken(types.plusMin, { text: this.input.slice(start, this.state.pos) });
    }

    getTokenFromCode(code: number) {
        switch (code) {
            // 符号
            case charCodes.leftParenthesis:
                ++this.state.pos;
                this.finishToken(types.braceL, { text: "(" });
                return;
            case charCodes.rightParenthesis:
                ++this.state.pos;
                this.finishToken(types.braceR, { text: ")" });
                return;
            case charCodes.semicolon:
                ++this.state.pos;
                this.finishToken(types.semi, { text: ";" });
                return;
            case charCodes.comma:
                ++this.state.pos;
                this.finishToken(types.comma, { text: "," });
                return;
            case charCodes.leftSquareBracket:
                ++this.state.pos;
                this.finishToken(types.bracketL, { text: "[" });
                return;
            case charCodes.rightSquareBracket:
                ++this.state.pos;
                this.finishToken(types.bracketR, { text: "]" });
                return;
            case charCodes.leftCurlyBrace:
                ++this.state.pos;
                this.finishToken(types.curlyL, { text: "{" });
                return;
            case charCodes.rightCurlyBrace:
                ++this.state.pos;
                this.finishToken(types.curlyR, { text: "}" });
                return;
            case charCodes.colon:
                ++this.state.pos;
                this.finishToken(types.colon, { text: ":" });
                return;
            case charCodes.slash:
                ++this.state.pos;
                this.finishToken(types.slash, { text: "/" });
                return;
            case charCodes.asterisk:
                ++this.state.pos;
                this.finishToken(types.star, { text: "*" });
                return;
            case charCodes.equalsTo:
                ++this.state.pos;
                // #if 预处理 ==
                if (this.input.charCodeAt(this.state.pos) === charCodes.equalsTo) {
                    ++this.state.pos;
                    this.finishToken(types.pre_logical, { text: "==" });
                    return;
                }
                this.finishToken(types.equal, { text: "=" });
                return;
            // .
            case charCodes.dot:
                this.readToken_dot();
                return;
            // ^
            case charCodes.caret:
                this.finishToken(types.caret, { text: "^" });
                return;
            // </ >
            case charCodes.lessThan:
            case charCodes.greaterThan:
                this.readToken_lt_gt(code);
                return;
            // #
            case charCodes.numberSign:
                this.readToken_numberSign();
                return;
            // +/-
            case charCodes.plusSign:
            case charCodes.dash:
                this.readToken_plus_min();
                return;

            // & 8进制和16进制数字
            case charCodes.ampersand:
                // #if 预处理语法 &&
                if (this.input.charCodeAt(this.state.pos + 1) === charCodes.ampersand) {
                    this.state.pos += 2;
                    this.finishToken(types.pre_logical, { text: "&&" });
                    return;
                }
                this.readRadixNumber();
                return;
            // 10进制数字和小数
            case charCodes.digit0:
            case charCodes.digit1:
            case charCodes.digit2:
            case charCodes.digit3:
            case charCodes.digit4:
            case charCodes.digit5:
            case charCodes.digit6:
            case charCodes.digit7:
            case charCodes.digit8:
            case charCodes.digit9:
                this.readNumber(false);
                return;
            // 字符串
            case charCodes.quotationMark:
                this.readString();
                return;
            // 换行符
            case charCodes.carriageReturn:
                if (this.input.charCodeAt(this.state.pos + 1) === charCodes.lineFeed) {
                    this.state.pos += 2;
                } else {
                    this.state.pos += 1;
                }
                this.state.curLine++;
                this.state.lineStart = this.state.pos;
                this.finishToken(types.newLine, { text: "newLine" });
                return;
            case charCodes.lineFeed:
            case charCodes.lineSeparator:
            case charCodes.paragraphSeparator:
                this.state.pos++;
                this.finishToken(types.newLine, { text: "newLine" });
                this.state.curLine++;
                this.state.lineStart = this.state.pos;
                return;
            // #if 预处理 !=
            case charCodes.exclamationMark:
                if (this.input.charCodeAt(this.state.pos + 1) === charCodes.equalsTo) {
                    this.state.pos += 2;
                    this.finishToken(types.pre_logical, { text: "!=" });
                    return;
                }
                break;
            // #if 预处理 ||
            case charCodes.verticalBar:
                if (this.input.charCodeAt(this.state.pos + 1) === charCodes.verticalBar) {
                    this.state.pos += 2;
                    this.finishToken(types.pre_logical, { text: "||" });
                    return;
                }
                break;

            default:
                if (isIdentifierStart(code)) {
                    this.readWord(code);
                    return;
                }
        }
        throw this.raise(this.state.pos, ErrorMessages["InvalidOrUnexpectedToken"]);
    }

    updateValue(val: Value, option: { def?: DefinitionBase, isBasic?: boolean }) {
        val.definition = option.def;
        val.isBasic = option.isBasic;
    }

}

