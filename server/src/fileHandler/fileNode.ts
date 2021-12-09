import { Parser } from "../lib";
import { File } from "../lib/types";


export interface FileReferenceMark {
    path: string,
    mark: string
};

export interface FileNode {
    /**
     * 文件路径对应的VScode URI
     */
    uri: string;
    /**
     * 文件系统路径
     */
    fsPath: string;
    /**
     * 文件对应内容
     */
    content: string;
    /**
     * 文件解析结果
     */
    file?: File;
    /**
     * 文件对应解析器
     */
    parser?: Parser;
    /**
     * 文件内容所包含的文件
     */
    includes: Map<string, FileNode>;
    /**
     * 包含该文件的文件
     */
    references: Map<string, FileNode>;
    /**
     * 引用标记
     */
    referenceMark?: FileReferenceMark;
    /**
     * 是否为入口文件
     */
    isVertex: boolean;
    /**
     * 对应的入口文件
     */
    startNode?: FileNode;
}

export function createFileNode(uri: string, fsPath: string, content: string): FileNode {
    return {
        uri,
        fsPath,
        content,
        includes: new Map(),
        references: new Map(),
        isVertex: false
    };
}
