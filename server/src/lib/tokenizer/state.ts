import { Options } from "../options";
import { ParsingError } from "../parser/errors";
import {
    Comment,
    CommentWhitespace,
    LineMark,
    File,
    DeclarationBase
} from "../types";
import { Position, Scope, ScopeFlags } from "../util";
import { TokenType, types } from "./type";



export class State {

    constructor(options: Options) {
        this.options = options;
        if (options.treatUnkownAsQuesion) {
            this.strict = true;
        }
        this.curLine = options.startLine;
        this.startLoc = this.endLoc = this.curPostion();
        this.globalType = options.globalType;
        this.globalVarName = options.globalVarName;
        this.raiseTypeError = options.raiseTypeError;
    }

    raiseTypeError: boolean;

    options: Options;
    /**
     * 全局类型定义，用于With语句块内的文件内容
     */
    globalType?: DeclarationBase;
    /**
     * 全局定义的变量名
     */
    globalVarName?: string;

    localDefinitions: Scope = new Scope(ScopeFlags.program);
    /**
     * __严格模式__:
     * - *true*: script中未知变量抛出错误
     * - *false*: script中未知变量视为IQuestion
     */
    strict = false;

    // 错误集合
    errors: Array<ParsingError> = [];
    // 警告集合
    warnings: Array<ParsingError> = [];

    // 注释集合
    comments: Array<Comment> = [];
    commentStack: Array<CommentWhitespace> = [];

    includes: Map<string, File> = new Map();

    // 行标记集合
    lineMarks: Map<string, LineMark> = new Map();

    // 当前Token的类型
    type: TokenType = types.eof;

    // 当前行号
    curLine: number;

    // 当前字符位置
    pos = 0;
    // 当前行开头的字符位置
    lineStart = 0;

    // Token对应值，默认为defaultValue
    value: string = "";

    // 当前Token的开始和结束位置
    start = 0;
    end = 0;

    // 当前Token的开始和结束对应的Location
    startLoc: Position;
    endLoc: Position;

    // 上一个Token的对应位置
    lastTokenStart = 0;
    lastTokenStartLoc: Position = new Position(1, 1);
    lastTokenEnd = 0;
    lastTokenEndLoc: Position = new Position(1, 1);

    /**
     * 当前Token的数量
     */
    tokensLength = 0;

    /**
     * 获得当前State对应位置的Position
     * @returns 当前位置对应Position
     */
    curPostion(): Position {
        return new Position(this.curLine, this.pos - this.lineStart);
    }

    getLineMark(name: string) {
        return this.lineMarks.get(name.toLowerCase()) ?? false;
    }

    copy(): State {
        const clone = new State(this.options) as any;
        for (const k in this) {
            clone[k] = this[k];
        }
        return clone as State;
    }

}

export type LookaheadState = {
    pos: number,
    value: string,
    type: TokenType,
    start: number,
    end: number,
};

