import { DeclarationBase } from "./types";
import { Scope } from "./util/scope";

export enum SourceType {
    metadata,
    script,
    declare
}

export enum ScriptFileType {
    dms,
    mrs
}

export interface Options {
    /**
     * `Parser`所对应文件的Vscode URI
     */
    uri: string;
    /**
     * 是否提示类型错误，此配置并不会跳过类型检查步骤，只是会抑制类型错误的生成
     */
    raiseTypeError: boolean;
    /**
     * 是否提示路径错误，仅指`#include`语句对应的路径问题
     */
    raisePathError: boolean;
    /**
     * 源文件脚本类型
     * + `script`: 执行脚本文件
     * + `declare`: 类型声明文件
     * + `metadata`: 元数据文件
     */
    sourceType: SourceType;
    /**
     * 配置文件原始路径
     */
    sourceFileName: string;
    /**
     * 文件脚本类型
     * + `mrs`: 此类型文件中，脚本不限制在`EventSection`模块中书写
     * + `dms`: 此类型文件中，脚本需要处于`EventSection`中，不在其中会抛出错误
     */
    scriptFileType: ScriptFileType;
    /**
     * 解析开始位置，一般为0
     */
    startLine: number;
    /**
     * 是否将未知变量视为一般元数据类型，一般应用于`OnNextCase`中
     */
    treatUnkownAsQuesion?: boolean;
    /**
     * 是否保存词法分析时的`Token`对象
     */
    tokens: boolean;
    /**
     * 文件遇到一般错误时，是否直接跳出，如果此选项为True，不会直接跳出
     */
    errorRecovery: boolean;
    /**
     * 全局变量名称，用于在文件外的`WithStatement`定义
     */
    globalVarName?: string;
    /**
     * 全局变量定义，用于存储在文件外的`WithStatement`具体声明
     */
    globalType?: DeclarationBase;
    /**
     * 全局定义，用于存储在文件外的`EventSection`对应的本地定义
     */
    globalDeclarations?: Scope;
    inGraph?: boolean;
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
        globalDeclarations: global,
        inGraph: graph
    };
}



