import { DeclarationBase } from "./types";
import { Scope } from "./util/scope";

export enum SourceType {
    metadata,
    script,
    declare
}

export enum MarkDownCommentType {
    inner,
    leading,
}

export enum ScriptFileType {
    dms,
    mrs
}

export interface Options {
    uri: string;
    raiseTypeError: boolean;
    raisePathError: boolean;
    sourceType: SourceType;
    sourceFileName?: string;
    scriptFileType: ScriptFileType;
    startLine: number;
    treatUnkownAsQuesion?: boolean;
    tokens: boolean;
    errorRecovery: boolean;
    commentType: MarkDownCommentType;
    globalVarName?: string;
    globalType?: DeclarationBase;
    globalDeclarations?: Scope;
    inGraph?: boolean;
};


export const defaultOptions: Options = {

    uri: "",

    raiseTypeError: true,
    raisePathError: true,
    // metadata定义文件或script脚本文件
    sourceType: SourceType.script,
    // dms/mrs 文件
    scriptFileType: ScriptFileType.mrs,
    // 起始行号
    startLine: 1,
    // 保存读取后的Token
    tokens: false,
    // 遇到错误不会立即结束，并会尝试返回恢复策略
    errorRecovery: true,
    // script脚本中将未定义的标识符视为IQuestion
    treatUnkownAsQuesion: true,
    // 加入代码提示的注释未知
    commentType: MarkDownCommentType.inner,
};

export function createBasicOptions(
    path: string,
    raiseTypeError: boolean,
    uri?: string,
    global?: Scope,
    graph?: boolean): Options {
    return {
        uri: uri ?? "",
        sourceType: SourceType.script,
        sourceFileName: path,
        raiseTypeError: raiseTypeError,
        raisePathError: true,
        scriptFileType: ScriptFileType.mrs,
        startLine: 1,
        tokens: false,
        errorRecovery: true,
        treatUnkownAsQuesion: true,
        commentType: MarkDownCommentType.inner,
        globalDeclarations: global,
        inGraph: graph
    };
}



