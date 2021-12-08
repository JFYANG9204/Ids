import { dirname, join } from "path";
import { Parser } from "../lib";
import { getFileTypeMark } from "../lib/file";
import { createBasicOptions } from "../lib/options";
import { File } from "../lib/types";
import { Scope, ScopeFlags } from "../lib/util";
import { getFileFsPath } from "../util";
import { FileNode } from "./fileNode";
import {
    BatMacro,
    declareBatMacros,
    getAllIncludeInFile,
    getFileReferenceMark,
    getMacroFromBatFile,
    loadDeclareFiles,
    readAllUsefulFileInFolder
} from "./load";
import { getFsPathToUri, isUri } from "./path";



export class FileHandler {

    /**
     * 文件夹系统路径
     */
    folderPath: string;
    /**
     * 文件夹uri
     */
    uri: string;
    // 非声明文件
    private fileNodes: Map<string, FileNode> = new Map();
    // 声明文件(.d.mrs)
    private declares: Map<string, FileNode> = new Map();
    // 全局定义
    global: Scope = new Scope(ScopeFlags.program);
    /**
     * 当前入口文件Node
     */
    private startNode?: FileNode;

    private currentMap: Map<string, File> = new Map();

    constructor(folder: string) {
        this.folderPath = folder;
        this.uri = getFsPathToUri(folder);
    }

    async init() {
        let batMacro = new Map<string, BatMacro>();
        this.fileNodes = await readAllUsefulFileInFolder(this.folderPath);
        this.fileNodes.forEach(node => {
            let path = node.fsPath.toLowerCase();
            if (path.endsWith(".d.mrs")) {
                this.declares.set(path, node);
            } else if (path.endsWith(".bat")) {
                getMacroFromBatFile(node.fsPath, node.content, batMacro);
            } else {
                node.referenceMark = getFileReferenceMark(node.content);
                this.fileNodes.set(path, node);
            }
        });
        this.global.join((await loadDeclareFiles(this.declares)).scope);
        declareBatMacros(batMacro, this.global);
        // 构建有向图

        function updateFileNodeMap(nodePath: string,
            node: FileNode,
            incPath: string,
            globalMap: Map<string, FileNode>) {

            const fullPath = join(dirname(node.fsPath), incPath).toLowerCase();
            const existNode = globalMap.get(fullPath);
            if (existNode) {
                existNode.references.set(nodePath, node);
                node.includes.set(fullPath, existNode);
                if (node.references.size === 0) {
                    node.isVertex = true;
                }
                existNode.isVertex = false;
            }

        }

        this.fileNodes.forEach((node, path) => {
            const refs = getAllIncludeInFile(node.content);
            refs.forEach(ref => updateFileNodeMap(path, node, ref, this.fileNodes));
            if (node.referenceMark) {
                updateFileNodeMap(path, node, node.referenceMark.path, this.fileNodes);
            }
        });
    }

    update(pathLike: string, content: string) {
        let path = pathLike;
        if (isUri(pathLike)) {
            path = getFileFsPath(pathLike);
        }
        let exist = this.fileNodes.get(path.toLowerCase());
        if (!exist) {
            return;
        }
        exist.content = content;

        let refMark = getFileReferenceMark(content);
        if (refMark === undefined) {
            if (exist.references.size === 0) {
                exist.isVertex = true;
                exist.startNode = undefined;
            }
            return;
        }

        const refPath = join(dirname(exist.fsPath), refMark.path).toLowerCase();
        const find = this.fileNodes.get(refPath);
        if (find && !find.includes.has(path.toLowerCase())) {
            find.includes.set(path.toLowerCase(), exist);
            exist.references.set(refPath, find);
        }

        if (!exist.referenceMark) {
            exist.referenceMark = refMark;
            return;
        }

        const oldPath = join(dirname(path), exist.referenceMark.path).toLowerCase();
        if (oldPath === refPath) {
            return;
        }

        // 删除旧的引用
        exist.references.get(oldPath)?.includes.delete(path.toLowerCase());
        exist.references.delete(oldPath);
        exist.referenceMark = refMark;
    }

    get(pathLike: string) {
        let path = pathLike;
        if (isUri(path)) {
            path = getFileFsPath(path);
        }
        return this.fileNodes.get(path.toLowerCase());
    }

    setStart(pathLike: string) {
        this.startNode = undefined;
        let path = pathLike;
        if (isUri(path)) {
            path = getFileFsPath(path);
        }
        let find = this.get(path);
        if (!find) {
            return;
        }

        if (find.isVertex) {
            this.startNode = find;
            return;
        }

        function getVertex(node: FileNode): FileNode | undefined {
            for (const ref of node.references.values()) {
                if (ref.isVertex) {
                    return ref;
                }
                let cur = getVertex(node);
                if (cur) {
                    return cur;
                }
            }
        }

        this.startNode = getVertex(find);
    }

    parse() {

        function iterateIncludeFile(node: File, callback: (n: File) => void) {
            for (const inc of node.includes.values()) {
                callback(inc);
                iterateIncludeFile(inc, callback);
            }
        }

        if (this.startNode) {
            const parser = new Parser(createBasicOptions(this.startNode.fsPath, true, this.startNode.uri, this.global), this.startNode.content);
            parser.catchFileTypeMarkFunction = getFileTypeMark;
            let file = parser.parse();
            this.startNode.file = file;
            this.startNode.parser = parser;
            iterateIncludeFile(file, inc => {
                let fileNode = this.get(inc.loc.fileName);
                if (fileNode) {
                    fileNode.file = inc;
                    fileNode.parser = inc.parser;
                    fileNode.startNode = this.startNode;
                }
            });
            let lowerPath = this.startNode.fsPath.toLowerCase();
            if (!file.esc) {
                this.currentMap.set(lowerPath, file);
            }
        }
    }

    getCurrent(pathLike: string) {
        let path = pathLike;
        if(isUri(path)) {
            path = getFileFsPath(pathLike);
        }
        return this.currentMap.get(path.toLowerCase());
    }

    dispose() {
        this.fileNodes.clear();
        this.declares.clear();
        this.currentMap.clear();
    }

}


