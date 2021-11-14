import * as path from "path";
import { loadDecarationFiles } from "../../util";
import { createBasicOptions, SourceType } from "../options";
import { Parser } from "../parser";
import { mergeScope, Scope } from "../util/scope";
import {
    createParserFileNode,
    ParserFileNode
} from "./node";
import {
    getAllIncludeInFile,
    getAllUsefulFile,
    getFileReferenceMark,
    getFileTypeMark,
} from "./util";


export class ParserFileDigraph {

    folder: string;

    vertex: ParserFileNode[] = [];
    nodeMap: Map<string, ParserFileNode> = new Map();
    start: ParserFileNode | undefined;
    current: ParserFileNode | undefined;
    parseMap: Map<string, ParserFileNode> = new Map();

    global?: Scope;

    startPath?: string;

    constructor(folder: string, global?: Scope) {
        this.folder = folder;
        this.global = global;
    }

    init() {
        const fileMap = getAllUsefulFile(this.folder);
        const nodes: Map<string, ParserFileNode> = new Map();
        const declares: Map<string, string> = new Map();
        fileMap.forEach((value, key) => {
            if (key.endsWith(".d.mrs")) {
                declares.set(key, value);
            } else {
                const refMark = getFileReferenceMark(value);
                const typeMark = getFileTypeMark(value);
                const node = createParserFileNode(key, value, refMark, typeMark);
                nodes.set(key, node);
            }
        });
        const local = loadDecarationFiles(declares);
        if (!this.global && local) {
            this.global = local;
        } else if (this.global && local) {
            mergeScope(local, this.global);
        }
        this.nodeMap = nodes;
        this.buildGraph();
    }

    buildGraph() {
        this.vertex = [];
        this.nodeMap.forEach((value, key) => {
            const refs = getAllIncludeInFile(value.content);
            refs.forEach(p => {
                const fullPath = path.join(path.dirname(key), p).toLowerCase();
                const existNode = this.nodeMap.get(fullPath);
                if (existNode) {
                    existNode.referenced.push(value);
                    value.include.push(existNode);
                }
            });
            const mark = value.fileReferenceMark;
            if (mark) {
                const refPath = path.join(path.dirname(value.filePath), mark.path).toLowerCase();
                const refNode = this.nodeMap.get(refPath);
                if (refNode) {
                    refNode.include.push(value);
                    value.referenced.push(refNode);
                }
            }
        });
        this.nodeMap.forEach((value) => {
            if (value.referenced.length === 0 &&
                value.include.length > 0) {
                this.vertex.push(value);
            }
        });
    }

    updateData(filePath: string, content: string) {
        const find = this.nodeMap.get(filePath.toLowerCase());
        if (find) {
            const refMark = getFileReferenceMark(content);
            const typeMark = getFileTypeMark(content);
            find.content = content;
            find.fileTypeMark = typeMark !== undefined ? typeMark : SourceType.script;
            if (refMark !== undefined) {
                const refPath = path.join(path.dirname(filePath), refMark.path).toLowerCase();
                const exist = this.nodeMap.get(refPath);
                if (exist && !exist.include.includes(find)) {
                    exist.include.push(find);
                    find.referenced.push(exist);
                }
                if (find.fileReferenceMark) {
                    const oldPath = path.join(path.dirname(filePath), find.fileReferenceMark.path).toLowerCase();
                    if (oldPath !== refPath) {
                        find.referenced.forEach((val, ndx) => {
                            if (val.filePath.toLowerCase() === oldPath) {
                                val.include.forEach((inc, index) => {
                                    if (inc.filePath.toLowerCase() === find.filePath.toLowerCase()) {
                                        val.include.splice(index, 1);
                                    }
                                });
                                find.referenced.splice(ndx, 1);
                            }
                        });
                    }
                }
                find.fileReferenceMark = refMark;
            }
        }
    }

    search(filePath: string) {
        return this._dfs(this.vertex, undefined, false, node => {
            return node.filePath.toLowerCase() === filePath.toLowerCase();
        });
    }

    getData(filePath: string) {
        return this.nodeMap.get(filePath.toLowerCase());
    }

    setStart(filePath: string) {
        if (filePath.toLowerCase() === this.startPath?.toLowerCase()) {
            return;
        }
        this.clearStart();
        this.startPath = filePath;
        if (this.parseMap.get(filePath.toLowerCase())) {
            this.start = this.parseMap.get(filePath.toLowerCase());
            return;
        }
        const head: { head?: ParserFileNode } = { head: this.start };
        this.current = this._dfs(this.vertex, head, true, node => {
            return node.filePath.toLowerCase() === filePath.toLowerCase();
        });
        this.start = head.head ?? this.getData(filePath);
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
                createBasicOptions(this.start.filePath, true),
                this.start.content
            );
            parser.searchParserNode = (filePath: string) => {
                return this._dfs(this.vertex, undefined, false, node => {
                    return node.filePath.toLowerCase() === filePath.toLowerCase();
                });
            };
            if (this.start.fileTypeMark) {
                parser.options.sourceType = this.start.fileTypeMark;
            }
            return parser.parse(this.global);
        }
    }

    _dfs(stack: ParserFileNode[],
        headNode: { head?: ParserFileNode } | undefined, ishead: boolean,
        callback: (node: ParserFileNode) => boolean): ParserFileNode | undefined {
        for (let i = 0; i < stack.length; i++) {
            const item = stack[i];
            if (ishead && headNode) {
                headNode.head = item;
            }
            if (callback(item)) {
                return item;
            }
            const inc = this._dfs(item.include, headNode, false, callback);
            if (inc) {
                return inc;
            }
        }
        return undefined;
    }

}
