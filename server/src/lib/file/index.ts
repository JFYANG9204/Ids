import * as path from "path";
import { createBasicOptions } from "../options";
import { Parser } from "../parser";
import {
    createParserFileNode,
    ParserFileNode
} from "./node";
import {
    getAllIncludeInFile,
    getAllUsefulFile,
    getFileReferenceMark,
    getFileTypeMark
} from "./util";


export class ParserFileDigraph {

    folder: string;

    vertex: ParserFileNode[] = [];
    data: Map<string, string> = new Map();
    start: ParserFileNode | undefined;
    current: ParserFileNode | undefined;

    constructor(folder: string) {
        this.folder = folder;
    }

    init() {
        const fileMap = getAllUsefulFile(this.folder);
        this.data = fileMap;
        const nodes: Map<string, ParserFileNode> = new Map();
        fileMap.forEach((value, key) => {
            const refMark = getFileReferenceMark(value);
            const typeMark = getFileTypeMark(value);
            const node = createParserFileNode(key, value, refMark, typeMark);
            nodes.set(key.toLowerCase(), node);
        });
        nodes.forEach((value, key) => {
            const refs = getAllIncludeInFile(value.content);
            refs.forEach(p => {
                const fullPath = path.join(path.dirname(key), p).toLowerCase();
                const existNode = nodes.get(fullPath);
                if (existNode) {
                    existNode.referenced.push(value);
                    value.include.push(existNode);
                }
            });
            const mark = value.fileReferenceMark;
            if (mark) {
                const refPath = path.join(path.dirname(value.filePath), mark.path).toLowerCase();
                const refNode = nodes.get(refPath.toLowerCase());
                if (refNode) {
                    refNode.include.push(value);
                    value.referenced.push(refNode);
                }
            }
        });
        nodes.forEach((value) => {
            if (value.referenced.length === 0 &&
                value.include.length > 0) {
                this.vertex.push(value);
            }
        });
    }

    updateData(filePath: string, content: string) {
        this.data.set(filePath.toLowerCase(), content);
    }

    search(filePath: string) {
        return this._dfs(this.vertex, undefined, false, node => {
            return node.filePath.toLowerCase() === filePath.toLowerCase();
        });
    }

    getData(filePath: string) {
        return this.data.get(filePath.toLowerCase());
    }

    setStart(filePath: string) {
        const head: { head?: ParserFileNode } = { head: this.start };
        this.current = this._dfs(this.vertex, head, true, node => {
            return node.filePath.toLowerCase() === filePath.toLowerCase();
        });
        this.start = head.head;
    }

    clearStart() {
        this.start = undefined;
    }

    startParse(filePath?: string, content?: string) {
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
            return parser.parse();
        } else if (filePath) {
            let fileText = content;
            if (!fileText) {
                const node = this.search(filePath);
                if (node) {
                    fileText = node.content;
                }
            }
            if (fileText) {
                const parser = new Parser(
                    createBasicOptions(filePath, false),
                    fileText
                );
                parser.searchParserNode = (filePath: string) => {
                    return this._dfs(this.vertex, undefined, false, node => {
                        return node.filePath.toLowerCase() === filePath.toLowerCase();
                    });
                };
                return parser.parse();
            }
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
