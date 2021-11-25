import * as path from "path";
import { DeclarationLoadResult, loadDecarationFiles } from "../../declaration";
import { createBasicOptions, SourceType } from "../options";
import { Parser } from "../parser";
import { mergeScope, Scope } from "../util/scope";
import {
    createParserFileNode,
    ParserFileNode
} from "./node";
import {
    BatMacro,
    createDeclarationFromBatMacro,
    FileContent,
    getAllIncludeInFile,
    getAllUsefulFile,
    getFileReferenceMark,
    getFileTypeMark,
    getMacroFromBatFile,
    mergeMap,
} from "./util";


export class ParserFileDigraph {

    folder: string;
    // 保存当前文件夹下内的入口文件(有引用但没有被引用)
    vertex: ParserFileNode[] = [];
    // 保存当前文件夹下所有文件的内容和引用关系
    nodeMap: Map<string, ParserFileNode> = new Map();
    start: ParserFileNode | undefined;
    current: ParserFileNode | undefined;
    // 保存使用过的入口文件，key为对应非入口文件的小写路径
    parseMap: Map<string, ParserFileNode> = new Map();

    global?: Scope;

    startPath?: string;

    constructor(folder: string, global?: DeclarationLoadResult) {
        this.folder = folder;
        this.global = global?.scope;
        if (global) {
            global.contents.forEach((v, k) => {
                let fileNode = createParserFileNode(v.uri, k, v.content);
                fileNode.file = global.files.get(k);
                this.nodeMap.set(k, fileNode);
            });
            global.files.forEach((f, p) => {
                const fNode = createParserFileNode(f.uri,
                    f.path,
                    f.parser.input,
                    undefined,
                    undefined);
                fNode.file = f;
                fNode.parser = f.parser;
                this.nodeMap.set(p, fNode);
            });
        }
    }

    init() {
        const fileMap = getAllUsefulFile(this.folder);
        const nodes: Map<string, ParserFileNode> = new Map();
        const declares: Map<string, FileContent> = new Map();
        const macros: Map<string, BatMacro> = new Map();

        // 读取文件夹内所有文件的内容
        fileMap.forEach((value, key) => {
            // 区分是否为声明文件(.d.mrs)
            if (key.endsWith(".d.mrs")) {
                declares.set(key, value);
            } else if (key.endsWith(".bat")) {
                getMacroFromBatFile(key, value.content, macros);
            } else {
                const refMark = getFileReferenceMark(value.content);
                const typeMark = getFileTypeMark(value.content);
                const node = createParserFileNode(value.uri, key, value.content, refMark, typeMark);
                nodes.set(key, node);
            }
        });

        // 读取本地声明文件内容
        const load = loadDecarationFiles(declares);

        const local = load.scope;
        if (!this.global && local) {
            this.global = local;
        } else if (this.global && local) {
            mergeScope(local, this.global);
        }

        if (macros.size > 0) {
            macros.forEach((m, n) => {
                this.global?.consts.set(n, createDeclarationFromBatMacro(m));
            });
        }

        mergeMap(this.nodeMap, nodes);
        this.buildGraph(nodes);
    }

    buildGraph(nodes: Map<string, ParserFileNode>) {
        this.vertex = [];
        nodes.forEach((value, key) => {
            const refs = getAllIncludeInFile(value.content);
            refs.forEach(p => {
                const fullPath = path.join(path.dirname(key), p).toLowerCase();
                const existNode = nodes.get(fullPath);
                if (existNode) {
                    existNode.referenced.set(key.toLowerCase(), value);
                    value.include.set(fullPath.toLowerCase(), existNode);
                }
            });
            const mark = value.fileReferenceMark;
            if (mark) {
                const refPath = path.join(path.dirname(value.filePath), mark.path).toLowerCase();
                const refNode = nodes.get(refPath);
                if (refNode) {
                    refNode.include.set(key.toLowerCase(), value);
                    value.referenced.set(refPath.toLowerCase(), refNode);
                }
            }
        });
        nodes.forEach((value) => {
            if (value.referenced.size === 0 &&
                value.include.size > 0) {
                value.isVertex = true;
                this.vertex.push(value);
            }
        });
    }

    updateData(filePath: string, content: string) {
        const find = this.nodeMap.get(filePath.toLowerCase());

        if (!find) {
            return;
        }

        const refMark = getFileReferenceMark(content);
        const typeMark = getFileTypeMark(content);
        find.content = content;
        find.fileTypeMark = typeMark !== undefined ? typeMark : SourceType.script;

        if (refMark === undefined) {
            return;
        }

        // 添加新的引用标记
        const refPath = path.join(path.dirname(filePath), refMark.path).toLowerCase();
        const exist = this.nodeMap.get(refPath);
        if (exist && !exist.include.has(filePath.toLowerCase())) {
            exist.include.set(filePath.toLowerCase(), find);
            find.referenced.set(refPath, exist);
        }

        if (!find.fileReferenceMark) {
            find.fileReferenceMark = refMark;
            return;
        }

        const oldPath = path.join(path.dirname(filePath), find.fileReferenceMark.path).toLowerCase();

        if (oldPath === refPath) {
            return;
        }

        // 删除旧的引用标记
        let oldRef;
        if ((oldRef = find.referenced.get(oldPath))) {
            oldRef.include.delete(filePath.toLowerCase());
        }
        find.referenced.delete(oldPath);

        find.fileReferenceMark = refMark;
    }

    getData(filePath: string) {
        return this.nodeMap.get(filePath.toLowerCase());
    }

    /**
     * 设定文件夹内文件对应的入口文件，如果有多个，设定为第一个
     * @param filePath 文件路径
     * @returns
     */
    setStart(filePath: string) {
        if (filePath.toLowerCase() === this.startPath?.toLowerCase()) {
            return;
        }
        this.clearStart();
        this.startPath = filePath;

        // 如果是使用过的入口文件，不继续查找
        if ((this.start = this.parseMap.get(filePath.toLowerCase()))) {
            return;
        }

        // 查找对应入口文件
        this.current = this.getData(filePath);
        if (!this.current) {
            return;
        }

        this.start = this.getVertexNode(this.current);
        if (this.start) {
            this.parseMap.set(filePath.toLowerCase(), this.start);
        }
    }

    clearStart() {
        this.start = undefined;
        this.startPath = undefined;
    }

    startParse() {
        if (this.start) {
            const parser = new Parser(
                createBasicOptions(this.start.filePath, true, this.start.uri, this.global, true),
                this.start.content
            );
            parser.searchParserNode = (filePath: string) => {
                return this.nodeMap.get(filePath.toLowerCase());
            };
            if (this.start.fileTypeMark) {
                parser.options.sourceType = this.start.fileTypeMark;
            }
            parser.catchFileTypeMarkFunction = getFileTypeMark;
            return parser.parse();
        }
    }

    /**
     * 对于任一节点，向上搜索，直到第一个入口文件，未找到返回undefined
     * @param node
     * @returns
     */
    getVertexNode(node: ParserFileNode): ParserFileNode | undefined {
        if (node.isVertex) {
            return node;
        }
        if (node.referenced.size === 0) {
            return undefined;
        }
        let sub;
        for (const n of node.referenced.values()) {
            if ((sub = this.getVertexNode(n))) {
                return sub;
            }
        }
        return undefined;
    }

}


export {
    getAllIncludeInFile,
    getAllUsefulFile,
    getFileTypeMark,
    getFileReferenceMark,
    ParserFileNode,
};

export {
    distanceTo,
    positionAt,
    positionIn,
    positionInWith,
    readFileAndConvertToUtf8,
    getCurrentParser
} from "./util";
