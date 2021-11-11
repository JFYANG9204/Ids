/* eslint-disable @typescript-eslint/naming-convention */
import { SourceLocation } from "../util/location";
import { State } from "./state";

const beforeExpr = true;
const isLoop = true;
const isPreprocessor = true;
const prefix = true;

export class TokenType {
    label: string;
    keyword?: string;
    beforeExpr?: boolean;
    isLoop?: boolean;
    binop?: BinopType;
    isPreprocessor?: boolean;
    prefix?: boolean;
    precedence?: number;

    constructor(label: string, options?: TokenTypeOption) {
        this.label = label;
        this.keyword = options ? options.keyword : undefined;
        this.beforeExpr = options ? options.beforeExpr : undefined;
        this.isLoop = options ? options.isLoop : undefined;
        this.binop = options ? options.binop : undefined;
        this.isPreprocessor = options ? options.isPreprocessor : undefined;
        this.precedence = options ? options.precedence : undefined;
        this.prefix = options ? options.prefix : undefined;
    }
}

export type TokenTypeOption = {
    keyword?: string;
    beforeExpr?: boolean;
    isLoop?: boolean;
    binop?: BinopType;
    isPreprocessor?: boolean;
    prefix?: boolean;
    precedence?: number;
};

export const keywords = new Map<string, TokenType>();
export const preKeywords = new Map<string, TokenType>();

function createKeyword(name: string, options?: TokenTypeOption): TokenType {
    const tokenType: TokenType = new TokenType(name, {
        keyword: name,
        beforeExpr: options?.beforeExpr,
        isLoop: options?.isLoop,
        binop: options?.binop,
        isPreprocessor: options?.isPreprocessor,
        prefix: options?.prefix,
        precedence: options?.precedence
    });
    keywords.set(name.toLowerCase(), tokenType);
    return tokenType;
}

export enum BinopType {
    assign,
    realational,
    logical,
    operator,
}

function createBinop(name: string, binop: BinopType, precedence: number): TokenType {
    return new TokenType(name, {
        beforeExpr: true,
        binop: binop,
        precedence: precedence
    });
}

export const types = {

    identifier                   :     new TokenType("identifier"),

    braceL                       :     new TokenType("(", { beforeExpr: true }),
    braceR                       :     new TokenType(")"),
    bracketL                     :     new TokenType("[", { beforeExpr: true }),
    bracketR                     :     new TokenType("]"),
    curlyL                       :     new TokenType("{"),
    curlyR                       :     new TokenType("}"),

    caret                        :     new TokenType("^"),
    numberSign                   :     new TokenType("#"),
    comma                        :     new TokenType(","),
    colon                        :     new TokenType(":"),
    dot                          :     new TokenType("."),
    semi                         :     new TokenType(";"),
    backSlash                    :     new TokenType("\\"),
    underscore                   :     new TokenType("_"),

    slash                        :     createBinop("/",            BinopType.operator,    4),
    star                         :     createBinop("*",            BinopType.operator,    4),
    relational                   :     createBinop("</>/<=/>=/<>", BinopType.realational, 2),
    equal                        :     createBinop("=",            BinopType.assign,      2),
    plusMin                      :     createBinop("+/-",          BinopType.operator,    3),

    string                       :     new TokenType("string"),
    number                       :     new TokenType("number"),
    decimal                      :     new TokenType("decimal"),

    // 预处理器关键字
    pre_include                  :     createKeyword("include", { isPreprocessor }),
    pre_define                   :     createKeyword("define",  { beforeExpr, isPreprocessor }),
    pre_undef                    :     createKeyword("undef",   { beforeExpr, isPreprocessor }),
    pre_if                       :     createKeyword("if",      { beforeExpr, isPreprocessor }),
    pre_elif                     :     createKeyword("elif",    { beforeExpr, isPreprocessor }),
    pre_else                     :     createKeyword("else",    { isPreprocessor }),
    pre_endif                    :     createKeyword("endif",   { isPreprocessor }),
    pre_error                    :     createKeyword("error",   { beforeExpr, isPreprocessor }),
    pre_line                     :     createKeyword("line",    { beforeExpr, isPreprocessor }),

    pre_logical                  :     new TokenType("&&/||/==", { binop: BinopType.logical, precedence: 1, isPreprocessor }),

    // 脚本关键字
    _and                         :     createKeyword("and", { binop: BinopType.logical, precedence: 1 }),
    _as                          :     createKeyword("as"),
    _case                        :     createKeyword("case",    { beforeExpr }),
    _class                       :     createKeyword("class"),
    _const                       :     createKeyword("const"),
    _dim                         :     createKeyword("dim"),
    _do                          :     createKeyword("do", { isLoop }),
    _default                     :     createKeyword("default"),
    _each                        :     createKeyword("each"),
    _else                        :     createKeyword("else",  { beforeExpr }),
    _elseif                      :     createKeyword("elseif"),
    _end                         :     createKeyword("end"),
    _enum                        :     createKeyword("enum"),
    _error                       :     createKeyword("error"),
    _exit                        :     createKeyword("exit"),
    _explicit                    :     createKeyword("explicit"),
    _false                       :     createKeyword("false"),
    _for                         :     createKeyword("for",  { isLoop }),
    _function                    :     createKeyword("function"),
    _get                         :     createKeyword("get"),
    _globalVariables             :     createKeyword("globalvariables"),
    _goto                        :     createKeyword("goto"),
    _if                          :     createKeyword("if"),
    _implements                  :     createKeyword("implements"),
    _implicit                    :     createKeyword("implicit"),
    _in                          :     createKeyword("in"),
    _interface                   :     createKeyword("interface"),
    _is                          :     createKeyword("is", { binop: BinopType.realational, precedence: 5 }),
    _like                        :     createKeyword("like", { binop: BinopType.realational, precedence: 3}),
    _loop                        :     createKeyword("loop"),
    _mod                         :     createKeyword("mod",{ binop: BinopType.operator, precedence: 4 }),
    _nameSpace                   :     createKeyword("namespace"),
    _next                        :     createKeyword("next"),
    _not                         :     createKeyword("not",  { prefix }),
    _null                        :     createKeyword("null"),
    _of                          :     createKeyword("of"),
    _on                          :     createKeyword("on"),
    _option                      :     createKeyword("option"),
    _optional                    :     createKeyword("optional"),
    _or                          :     createKeyword("or",  { binop: BinopType.logical, precedence: 1 }),
    _paper                       :     createKeyword("paper"),
    _paramarray                  :     createKeyword("paramarray"),
    _property                    :     createKeyword("property"),
    _resume                      :     createKeyword("resume"),
    _readonly                    :     createKeyword("readonly"),
    _section                     :     createKeyword("section"),
    _select                      :     createKeyword("select"),
    _set                         :     createKeyword("set"),
    _step                        :     createKeyword("step"),
    _sub                         :     createKeyword("sub"),
    _then                        :     createKeyword("then"),
    _to                          :     createKeyword("to"),
    _true                        :     createKeyword("true"),
    _until                       :     createKeyword("until"),
    _while                       :     createKeyword("while", { isLoop }),
    _with                        :     createKeyword("with"),
    _xor                         :     createKeyword("xor", { binop: BinopType.logical, precedence: 1 }),
    //
    //newLine                      :     new TokenType("newline"),
    eof                          :     new TokenType("eof"),
};


export class Token {

    type: TokenType;
    value: string;
    start: number;
    end: number;
    loc: SourceLocation;

    constructor(state: State) {
        this.type = state.type;
        this.value = state.value;
        this.start = state.start;
        this.end = state.end;
        this.loc = new SourceLocation(state.startLoc, state.endLoc);
    }

}
