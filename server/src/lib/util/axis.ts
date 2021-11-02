import * as charCodes from "../util/charcodes";
import { BasicTypes, searchEnumerator } from "../built-in/built-ins";
import { ErrorMessages } from "../parser/error-messages";
import { ErrorTemplate, ParsingError } from "../parser/errors";
import { ValueType } from "./definition";
import { isIdentifierChar, isIdentifierName } from "./identifier";
import { isWhitespace } from "./whitespace";
import { StringLiteral } from "../types";

export type AxisArgment = {
    type: ValueType;
    option?: true;
    list?: true;
};

export class AxisElementType {
    label: string;
    arguments?: AxisArgment[];

    constructor(label: string, args?: AxisArgment[]) {
        this.label = label;
        this.arguments = args;
    }
}

export const axisElementTypes: { [key: string]: AxisElementType } = {
    all                  : new AxisElementType(".."),
    category             : new AxisElementType("category"),
    base                 : new AxisElementType("base", [ { type: BasicTypes.string, option: true } ]),
    tablestatistic       : new AxisElementType("tablestatistic"),
    effectivebase        : new AxisElementType("effectivebase"),
    sumweightssquared    : new AxisElementType("sumweightssquared"),
    sumn                 : new AxisElementType("sumn"),
    sumx                 : new AxisElementType("sumx"),
    sumxsquared          : new AxisElementType("sumxsquared"),
    sumunweightedN       : new AxisElementType("sumunweightedn"),
    mean                 : new AxisElementType("mean",      [ { type: BasicTypes.variant, option: true }, { type: BasicTypes.string, option: true } ]),
    stddev               : new AxisElementType("stddev",    [ { type: BasicTypes.variant, option: true }, { type: BasicTypes.string, option: true } ]),
    stderr               : new AxisElementType("stderr",    [ { type: BasicTypes.variant, option: true }, { type: BasicTypes.string, option: true } ]),
    samplevar            : new AxisElementType("samplevar", [ { type: BasicTypes.variant, option: true }, { type: BasicTypes.string, option: true } ]),
    total                : new AxisElementType("total"),
    subtotal             : new AxisElementType("subtotal"),
    text                 : new AxisElementType("text"),
    netdiffs             : new AxisElementType("ntd"),
    pairedpref           : new AxisElementType("ppt"),
    minimum              : new AxisElementType("min", [ { type: BasicTypes.variant }, { type: BasicTypes.string, option: true } ]),
    maximum              : new AxisElementType("max", [ { type: BasicTypes.variant }, { type: BasicTypes.string, option: true } ]),
    otherderived         : new AxisElementType("otherderived"),
    net                  : new AxisElementType("net",     [ { type: BasicTypes.variant, list: true } ]),
    combine              : new AxisElementType("combine", [ { type: BasicTypes.variant, list: true } ]),
    expression           : new AxisElementType("expression", [ { type: BasicTypes.string } ]),
    unweightedbase       : new AxisElementType("unweightedbase", [ { type: BasicTypes.string, option: true } ]),
    numeric              : new AxisElementType("numeric", [ { type: BasicTypes.variant }, { type: BasicTypes.string, option: true } ]),
    derived              : new AxisElementType("derived", [ { type: BasicTypes.string } ]),
    sum                  : new AxisElementType("sum", [ { type: BasicTypes.variant }, { type: BasicTypes.string, option: true } ]),
    median               : new AxisElementType("median", [ { type: BasicTypes.variant }, { type: BasicTypes.string, option: true } ]),
    percentile           : new AxisElementType("percentile", [ { type: BasicTypes.variant }, { type: BasicTypes.variant }, { type: BasicTypes.string, option: true } ]),
    mode                 : new AxisElementType("mode", [ { type: BasicTypes.variant }, { type: BasicTypes.string, option: true } ]),
    profile              : new AxisElementType("profile"),
    profileresult        : new AxisElementType("profileresult"),
    tvalue               : new AxisElementType("tvalue"),
    tprob                : new AxisElementType("tprob"),
};


export class AxisPropertyType {
    label: string;
    type: ValueType;

    constructor(label: string, type: ValueType | string) {
        this.label = label;
        if (typeof type === "string") {
            const find = searchEnumerator(type);
            this.type = {
                label: type,
                defType: "enum",
                definition: find
            };
        } else {
            this.type = type;
        }
    }
}

export const axisPropertyTypes: { [key: string]: AxisPropertyType } = {
    caculationscope    : new AxisPropertyType("CaculationScope", "CalculationScopeType"),
    countsonly         : new AxisPropertyType("CountsOnly", BasicTypes.boolean),
    decimals           : new AxisPropertyType("Decimals", BasicTypes.long),
    factor             : new AxisPropertyType("Factor", BasicTypes.double),
    isfixed            : new AxisPropertyType("IsFixed", BasicTypes.boolean),
    ishidden           : new AxisPropertyType("IsHidden", BasicTypes.boolean),
    ishiddenwhencolumn : new AxisPropertyType("IsHiddenWhenColumn", BasicTypes.boolean),
    ishiddenwhenrow    : new AxisPropertyType("IsHiddenWhenRow", BasicTypes.boolean),
    includeinbase      : new AxisPropertyType("IncludeInBase", BasicTypes.boolean),
    isunweighted       : new AxisPropertyType("IsUnweighted", BasicTypes.boolean),
    multiplier         : new AxisPropertyType("Multiplier", BasicTypes.variant),
    weight             : new AxisPropertyType("Weight", BasicTypes.variant),
};

export class AxisProperty {
    type: AxisPropertyType;
    value: string | number | boolean;
    constructor(type: AxisPropertyType, value: string | number | boolean) {
        this.type = type;
        this.value = value;
    }
}

export class AxisElement {
    type?: AxisElementType;
    properties?: AxisProperty | AxisProperty[];
    name: string;
    label = "";
    start = 0;
    end = 0;
    constructor(name: string, type?: AxisElementType, start?: number, end?: number, label?: string) {
        this.name = name;
        this.type = type;
        this.label = label ?? "";
        this.start = start ?? 0;
        this.end = end ?? 0;
    }
}

export type AxisTokenType =
    | "all"
    | "string"
    | "categorical"
    | "id"
    | "eof"
    | "comma"
    | "leftbracket"
    | "rightbracket"
    | "leftparen"
    | "rightparen"
    | "leftcurly"
    | "rightcurly"
    | "equal"
    | "undercore"
    | "slash"
    | "backslash"
    | "plusmin"
    | "newline"
    | "number"
    | "binary"
    | "boolean"
    | "equal"
    | "dot"
    | "asterisk";

export type AxisToken = {
    start: number,
    end: number,
    type: AxisTokenType,
    value: string
};

function isBoolean(text: string) {
    const val = text.toLowerCase();
    return val === "true" || val === "false";
}

export class AxisParser {

    elements: AxisElement[] = [];
    useFunction: boolean;

    raiseError: (start: number,
                 end: number,
                 template: ErrorTemplate,
                 ...param: any) => ParsingError;
    node: StringLiteral;
    input: string;
    length: number;

    start: number;
    end: number;
    pos: number;

    current: AxisToken = { start: 0, end: 0, type: "eof", value: "" };
    last: AxisToken = { start: 0, end: 0, type: "eof", value: "" };

    constructor(
        node: StringLiteral,
        raise: (start: number,
                end: number,
                template: ErrorTemplate,
                ...param: any) => ParsingError
        ) {
        this.raiseError = raise;
        this.node = node;
        this.pos = 0;
        this.start = node.start;
        this.end = node.end;
        this.useFunction = false;
        let val: string = node.extra["raw"];
        if (val.startsWith('"')) {
            val = val.slice(1, val.length);
            this.start++;
        }
        if (val.endsWith('"')) {
            val = val.slice(0, val.length - 1);
            this.end--;
        }
        this.input = val;
        this.length = val.length;
    }

    raise(start: number, end: number, template: ErrorTemplate, ...params: any) {
        return this.raiseError(
            this.start + start,
            this.start + end,
            template,
            params
        );
    }

    exist(name: string): boolean {
        for (let i = 0; i < this.elements.length; i++) {
            const element = this.elements[i];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    matchType(token: AxisToken, require: ValueType) {
        let err = false;
        if (require === BasicTypes.variant) {
            err = false;
        } else if (require === BasicTypes.boolean &&
            token.type !== "boolean") {
            err = true;
        } else if (
            (require === BasicTypes.long || require === BasicTypes.double) &&
            token.type !== "number") {
            err = true;
        } else if (
            require === BasicTypes.string && token.type !== "string"
        ) {
            err = true;
        } else if (
            require === BasicTypes.categorical && token.type !== "categorical"
        ) {
            err = true;
        } else if (require.defType === "enum") {
            err = true;
            const find = searchEnumerator(require.label);
            if (find) {
                for (const item of find.elements) {
                    if (item.label.toLowerCase() === token.value.toLowerCase()) {
                        err = false;
                        break;
                    }
                }
            }
        }

        if (err) {
            this.raise(
                token.start,
                token.end,
                ErrorMessages["UnmatchedVarType"],
                token.type,
                require.label);
        }

        return err;
    }

    push(element: AxisElement) {
        if (!this.exist(element.name)) {
            this.elements.push(element);
        } else {
            this.raiseError(
                element.start,
                element.end,
                ErrorMessages["AxisElementRedeclared"],
                element.name);
        }
    }

    nextChar() {
        if (this.pos < this.input.length) {
            return this.input.codePointAt(++this.pos);
        }
        return undefined;
    }

    lookaheadCharCode() {
        return this.input.codePointAt(this.pos + 1);
    }

    lookahead() {
        const curPos = this.pos;
        const cur = this.current;
        const curLast = this.last;
        const next = this.nextToken();
        this.pos = curPos;
        this.current = cur;
        this.last = curLast;
        return next;
    }

    skipSpace() {
        let chr: number | undefined = this.input.charCodeAt(this.pos);
        if (!isWhitespace(chr)) {
            return;
        }
        while ((chr = this.nextChar())) {
            if (!isWhitespace(chr)) {
                break;
            }
        }
    }

    parsePunctuation(type: AxisTokenType) {
        const start = this.pos;
        this.pos++;
        this.last = this.current;
        this.current = {
            start: start,
            end: this.pos,
            type: type,
            value: this.input.slice(start, this.pos)
        };
    }

    isIdentifierEnd(char: number) {
        return !isIdentifierChar(char);
    }

    parseLabel(): AxisToken {
        const start = this.pos + 1;
        let chr;
        while ((chr = this.nextChar())) {
            if (chr === charCodes.apostrophe) {
                this.pos++;
                break;
            }
            if (this.pos >= this.length) {
                this.raiseError(
                    start,
                    this.pos,
                    ErrorMessages["UnterminatedString"]
                );
                break;
            }
        }
        const value = this.input.slice(start, this.pos - 1);
        return {
            start: start,
            end: this.pos - 1,
            type: "string",
            value: value
        };
    }

    parseInteger(): AxisToken {
        const start = this.pos;
        let chr;
        while ((chr = this.nextChar())) {
            if (!charCodes.isDigit(chr)) {
                break;
            }
        }
        const val = this.input.slice(start, this.pos);
        return {
            start: start,
            end: this.pos,
            type: "number",
            value: val
        };
    }

    parseNumber(): AxisToken {
        const start = this.pos;
        let ahead = this.lookaheadCharCode();
        if (this.input.charCodeAt(this.pos) === charCodes.dot &&
            ahead && charCodes.isDigit(ahead)) {
            this.pos++;
            this.parseInteger();
        } else {
            this.parseInteger();
            if (this.input.charCodeAt(this.pos) === charCodes.dot) {
                ahead = this.lookaheadCharCode();
                if (ahead && charCodes.isDigit(ahead)) {
                    this.pos++;
                    this.parseInteger();
                } else {
                    this.raise(
                        start,
                        this.pos,
                        ErrorMessages["InvalidNumber"]
                    );
                }
            }
        }
        const val = this.input.slice(start, this.pos);
        return {
            start: start,
            end: this.pos,
            type: "number",
            value: val
        };
    }

    parseIdentifier(): AxisToken {
        const start = this.pos;
        let chr;
        while ((chr = this.nextChar())) {
            if (this.isIdentifierEnd(chr)) {
                break;
            }
        }
        const id = this.input.slice(start, this.pos);
        if (!isIdentifierName(id)) {
            this.raise(
                start,
                this.pos,
                ErrorMessages["AxisInvalidCharactor"],
                id,
            );
        }
        return {
            start: start,
            end: this.pos,
            type: isBoolean(id) ? "boolean" : "id",
            value: id
        };
    }

    checkNewlineCharactor() {
        const last = this.input.charCodeAt(this.pos - 1);
        if (last !== charCodes.underscore && last !== charCodes.backslash) {
            this.raiseError(
                this.pos - 1,
                this.pos,
                ErrorMessages["StringLineFeedNeedNewlineChar"]
            );
        }
    }

    nextToken(): AxisToken {
        if (this.pos >= this.length) {
            this.current = {
                start: 0,
                end: 0,
                type: "eof",
                value: ""
            };
            return this.current;
        }
        this.skipSpace();
        const cur = this.input.charCodeAt(this.pos);
        const start = this.pos;
        let ahead;
        switch (cur) {
            case charCodes.apostrophe:
                this.last = this.current;
                this.current = this.parseLabel();
                break;

            case charCodes.leftParenthesis:     this.parsePunctuation("leftparen");    break;
            case charCodes.rightParenthesis:    this.parsePunctuation("rightparen");   break;
            case charCodes.leftCurlyBrace:      this.parsePunctuation("leftcurly");    break;
            case charCodes.rightCurlyBrace:     this.parsePunctuation("rightcurly");   break;
            case charCodes.leftSquareBracket:   this.parsePunctuation("leftbracket");  break;
            case charCodes.rightSquareBracket:  this.parsePunctuation("rightbracket"); break;
            case charCodes.equalsTo:            this.parsePunctuation("equal");        break;
            case charCodes.slash:               this.parsePunctuation("slash");        break;
            case charCodes.comma:               this.parsePunctuation("comma");        break;
            case charCodes.dash:                this.parsePunctuation("plusmin");      break;
            case charCodes.asterisk:            this.parsePunctuation("asterisk");     break;
            case charCodes.plusSign:            this.parsePunctuation("plusmin");      break;
            case charCodes.backslash:           this.parsePunctuation("backslash");    break;
            case charCodes.underscore:          this.parsePunctuation("undercore");    break;

            case charCodes.greaterThan:
                if (this.input.charCodeAt(this.pos + 1) === charCodes.equalsTo) {
                    this.pos++;
                }
                this.last = this.current;
                this.current = {
                    start: start,
                    end: this.pos,
                    type: "binary",
                    value: this.input.slice(start, this.pos)
                };
                break;
            case charCodes.lessThan:
                ahead = this.input.charCodeAt(this.pos + 1);
                if (ahead === charCodes.greaterThan || ahead === charCodes.equalsTo) {
                    this.pos++;
                }
                this.last = this.current;
                this.current = {
                    start: start,
                    end: this.pos,
                    type: "binary",
                    value: this.input.slice(start, this.pos)
                };
                break;

            case charCodes.carriageReturn:
                this.checkNewlineCharactor();
                ahead = this.lookaheadCharCode();
                if (ahead === charCodes.lineFeed) {
                    this.pos += 2;
                } else {
                    this.pos++;
                }
                this.last = this.current;
                this.current = {
                    start: start,
                    end: this.pos,
                    type: "newline",
                    value: this.input.slice(start, this.pos)
                };
                break;
            case charCodes.lineFeed:
                this.checkNewlineCharactor();
                this.pos++;
                this.last = this.current;
                this.current = {
                    start: start,
                    end: this.pos,
                    type: "newline",
                    value: this.input.slice(start, this.pos)
                };
                break;

            default:
                this.last = this.current;
                if (cur === charCodes.dot) {
                    const ahead = this.lookaheadCharCode();
                    if (cur === charCodes.dot && ahead && charCodes.isDigit(ahead)) {
                        this.current = this.parseNumber();
                    } else if (this.input.charCodeAt(this.pos + 1)) {
                        this.pos += 2;
                        this.current = {
                            start: start,
                            end: this.pos,
                            type: "all",
                            value: this.input.slice(start, this.pos)
                        };
                    } else {
                        this.pos++;
                        this.current = {
                            start: start,
                            end: this.pos,
                            type: "dot",
                            value: this.input.slice(start, this.pos)
                        };
                        this.raiseError(
                            this.start,
                            this.pos,
                            ErrorMessages["AxisInvalidCharactor"]
                        );
                    }
                    break;
                }
                if (charCodes.isDigit(cur)) {
                    this.current = this.parseNumber();
                    break;
                }
                this.current = this.parseIdentifier();
                break;
        }
        return this.current;
    }

    match(type: AxisTokenType) {
        return this.current.type === type;
    }

    expect(type: AxisTokenType) {
        this.skipSpace();
        const start = this.pos;
        const token = this.nextToken();
        if (token.type !== type) {
            this.raise(
                start,
                this.pos,
                ErrorMessages["ExpectToken"],
                token.value
            );
        }
    }

    unexpect(token: AxisToken) {
        this.raise(
            token.start,
            token.end,
            ErrorMessages["UnexpectedToken"],
            token.value
        );
    }

    parseSingleProperty() {
        const start = this.pos;
        const prop = this.current;
        const propType = axisPropertyTypes[prop.value.toLowerCase()];
        if (!propType) {
            this.raise(
                start,
                this.pos,
                ErrorMessages["AxisUnknownProperty"],
                prop);
        }
        this.expect("equal");
        const value = this.nextToken();
        if (value.type === "number" ||
            value.type === "id"     ||
            value.type === "boolean") {
            this.matchType(value, propType.type);
        } else {
            this.unexpect(value);
        }
        return new AxisProperty(propType, value.value);
    }

    parseProperty(): AxisProperty[] {
        const props: AxisProperty[] = [];
        this.nextToken();
        let comma: AxisToken | undefined = undefined;
        let first = true;
        while (!this.match("rightbracket")) {
            if (!first && !comma) {
                this.raiseError(
                    this.pos - 1,
                    this.pos,
                    ErrorMessages["ExpectToken"],
                    ","
                );
            }
            comma = undefined;
            props.push(this.parseSingleProperty());
            first = false;
            this.nextToken();
            if (this.match("comma")) {
                comma = this.current;
                this.nextToken();
            }
            if (this.match("rightbracket") && comma) {
                this.raiseError(
                    comma.start,
                    comma.end,
                    ErrorMessages["UnexpectedToken"],
                    ","
                );
            }
        }
        this.nextToken();
        return props;
    }

    parseCategorical(): AxisToken {
        const start = this.pos;
        let first = true;
        let comma: AxisToken | undefined;
        this.nextToken();
        while (!this.match("rightcurly")) {
            if (!first && !comma) {
                this.raiseError(
                    this.pos - 1,
                    this.pos,
                    ErrorMessages["ExpectToken"],
                    ","
                );
            }
            this.skipNewlineChar();
            this.parseAxisElement();
            first = false;
            if (this.match("comma")) {
                comma = this.current;
                this.nextToken();
            }
            this.skipNewlineChar();
        }
        return {
            start: start,
            end: this.pos + 1,
            type: "categorical",
            value: this.input.slice(start, this.pos)
        };
    }

    checkIfElementEnd() {
        return this.match("comma")      ||
               this.match("rightparen") ||
               this.match("rightcurly");
    }

    parseAxisElement() {
        const start = this.pos;
        if (this.match("all")) {
            const all = new AxisElement("..", axisElementTypes["all"], start, this.pos, "..");
            this.nextToken();
            return all;
        }
        const id = this.current;
        this.skipNewlineChar();
        this.nextToken();
        let label = undefined;
        if (this.match("string")) {
            label = this.current;
        }
        this.skipNewlineChar();
        if (this.checkIfElementEnd()) {
            return new AxisElement(id.value, undefined, start, this.pos, label?.value);
        }
        this.skipNewlineChar();
        if (label) {
            this.nextToken();
            if (this.checkIfElementEnd()) {
                return new AxisElement(id.value, undefined, start, this.pos, label?.value);
            }
        }
        let type: AxisElementType | undefined = undefined;
        if (this.match("id")) {
            type = this.parseAxisElementType();
            this.skipNewlineChar();
            this.nextToken();
        }
        let props: AxisProperty[] | undefined = undefined;
        if (this.match("leftbracket")) {
            props = this.parseProperty();
        }
        const element = new AxisElement(id.value, type, start, this.pos, label?.value);
        if (props) {
            element.properties = props;
        }
        return element;
    }

    parseAxisElementType() {
        const start = this.pos;
        const id = this.current;
        const elementType = axisElementTypes[id.value.toLowerCase()];
        if (!elementType) {
            while (!this.match("rightparen")) {
                this.nextToken();
            }
            this.nextToken();
            this.raiseError(
                start,
                this.pos,
                ErrorMessages["AxisUnknownElement"],
                id.value
            );
        } else {
            this.expect("leftparen");
            this.skipNewlineChar();
            this.nextToken();
            const params: AxisToken[] = [];
            let comma: AxisToken | undefined;
            let first = true;
            while (!this.match("rightparen")) {
                if (!first && !comma) {
                    this.raiseError(
                        this.pos - 1,
                        this.pos,
                        ErrorMessages["ExpectToken"],
                        ","
                    );
                }
                comma = undefined;
                this.skipNewlineChar();
                if (this.match("leftcurly")) {
                    params.push(this.parseCategorical());
                } else {
                    params.push(this.current);
                }
                first = false;
                this.nextToken();
                if (this.match("comma")) {
                    comma = this.current;
                    this.nextToken();
                }
                this.skipNewlineChar();
                if (this.match("rightparen") && comma) {
                    this.raiseError(
                        comma.start,
                        comma.end,
                        ErrorMessages["UnexpectedToken"],
                        ","
                    );
                }
            }
            this.checkParams(params, elementType);
        }
        return elementType;
    }

    checkParams(params: AxisToken[], elementType: AxisElementType) {
        if (!elementType.arguments) {
            if (params.length > 0) {
                this.raiseError(
                    params[0].start,
                    params[params.length - 1].end,
                    ErrorMessages["IncorrectFunctionArgumentNumber"],
                    elementType.label,
                    0,
                    params.length
                );
            }
            return;
        }
        const start = params.length > 0 ? params[0].start : this.pos - 1;
        const end = params.length > 0 ? params[params.length - 1].end : this.pos;
        let needParamNum = 0;
        let paramNumErr = false;
        elementType.arguments.forEach((value, i) => {
            if (!value.option) {
                needParamNum++;
            }
            if (i >= params.length) {
                if (!value.option) {
                    paramNumErr = true;
                }
            } else {
                this.matchType(params[i], value.type);
            }
        });
        if (paramNumErr) {
            this.raiseError(
                start,
                end,
                ErrorMessages["IncorrectFunctionArgumentNumber"],
                needParamNum,
                params.length
            );
        }
    }

    skipNewlineChar() {
        while (this.match("undercore") ||
               this.match("backslash") ||
               this.match("newline")) {
            this.nextToken();
        }
    }

    parse() {
        this.nextToken();
        if (this.current.value.toLowerCase() === "axis") {
            this.useFunction = true;
        }
        while (!this.match("leftcurly")) {
            this.nextToken();
        }
        this.nextToken();
        let comma: AxisToken | undefined;
        let first = true;
        while (!this.match("rightcurly") && !this.match("eof")) {
            if (!first && !comma) {
                this.raiseError(
                    this.pos - 1,
                    this.pos,
                    ErrorMessages["ExpectToken"],
                    ","
                );
            }
            first = false;
            comma = undefined;
            this.skipNewlineChar();
            this.push(this.parseAxisElement());
            this.skipNewlineChar();
            if (this.match("comma")) {
                comma = this.current;
                this.nextToken();
            }
            this.skipNewlineChar();
            if (this.match("rightcurly") && comma) {
                this.raiseError(
                    comma.start,
                    comma.end,
                    ErrorMessages["UnexpectedToken"],
                    ","
                );
            }
        }
        if (this.useFunction) {
            this.expect("rightparen");
        }
    }

}

const maybeAxisRegex = /(\{[\s\S]*\})|(axis\(\{[\s\S]*\}\))/i;
const maybeAxisFunctionRegex = /axis\(\{[\S\s]*\}\)/i;

export function maybeAxisExpression(input: string) {
    return maybeAxisRegex.test(input);
}

export function maybeUseAxisFunction(input: string) {
    return maybeAxisFunctionRegex.test(input);
}


