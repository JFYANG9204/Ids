import { dirname } from "path";
import { Connection } from "vscode-languageserver";
import { builtInModule } from "../declaration";
import { Parser } from "../lib";
import { createBasicOptions } from "../lib/options";
import { File, Identifier, SingleVarDeclarator } from "../lib/types";
import { Position, Scope, ScopeFlags } from "../lib/util";
import { FileNode } from "./fileNode";
import {
    BatMacro,
    getAllIncludeInFile,
    getFileReferenceMark,
    getFileTypeMark,
    getMacroFromBatFile,
    readAllUsefulFileInFolder
} from "./load";
import { getFileFsPath, getFsPathToUri, getPathDepth, isFileUri, normalizeFileNameResolve } from "./path";



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
    /**
     * 保存文档当前的结果
     */
    private currentMap: Map<string, File> = new Map();
    /**
     * 保存文档上一次没有抛出错误的结果
     */
    private storedMap: Map<string, File> = new Map();

    private connection?: Connection;

    constructor(folder: string, connection?: Connection) {
        this.folderPath = folder;
        this.uri = getFsPathToUri(folder);
        this.global.join(builtInModule.scope);
        this.connection = connection;
    }

    async init() {
        let batMacro = new Map<string, BatMacro>();
        await readAllUsefulFileInFolder(this.folderPath)
        .then(map => {
            this.connection?.console.log("file paths loading complete.");
            map.forEach(node => {
                let path = node.fsPath.toLowerCase();
                this.connection?.console.log(`start loading ${node.fsPath}`);
                if (path.endsWith(".d.mrs")) {
                    this.declares.set(path, node);
                } else if (path.endsWith(".bat")) {
                    getMacroFromBatFile(node.fsPath, node.content, batMacro);
                } else {
                    node.referenceMark = getFileReferenceMark(node.content);
                    this.fileNodes.set(path, node);
                }
            });
            this.connection?.console.log("file mark and macro loading complete.");
            let declare = this.loadDeclareFiles(this.declares);
            this.global.join(declare.scope);
            this.declareBatMacros(batMacro, this.global);
            // 构建有向图
            this.connection?.console.log("start building graph.");
            this.fileNodes.forEach((node, path) => {
                const refs = getAllIncludeInFile(node.content);
                refs.forEach(ref => updateFileNodeMap(path, node, ref, this.fileNodes));
                if (node.referenceMark) {
                    updateFileNodeMap(path, node, node.referenceMark.path, this.fileNodes, true);
                }
            });
            this.connection?.console.log("file handler initialized.");
        });

        function updateFileNodeMap(nodePath: string,
            node: FileNode,
            incPath: string,
            globalMap: Map<string, FileNode>,
            isMark: boolean = false) {

            const fullPath = normalizeFileNameResolve(dirname(node.fsPath), incPath).toLowerCase();
            const existNode = globalMap.get(fullPath);
            if (existNode) {
                if (isMark) {
                    node.references.set(fullPath, existNode);
                    node.isVertex = false;
                    if (existNode.references.size === 0) {
                        existNode.isVertex = true;
                    }
                    return;
                }
                existNode.references.set(nodePath, node);
                node.includes.set(fullPath, existNode);
                if (node.references.size === 0) {
                    node.isVertex = true;
                }
                existNode.isVertex = false;
            }

        }
    }

    update(pathLike: string, content: string) {
        let path = isFileUri(pathLike) ? getFileFsPath(pathLike) : pathLike;
        let exist = this.fileNodes.get(path.toLowerCase());
        if (!exist) {
            return;
        }
        exist.content = content;

        let refMark = getFileReferenceMark(content);
        if (refMark === undefined) {
            if (exist.referenceMark) {
                let existRefPath = normalizeFileNameResolve(dirname(exist.fsPath), exist.referenceMark.path).toLowerCase();
                let refNode = exist.references.get(existRefPath);
                refNode?.includes.delete(path);
                exist.references.delete(existRefPath);
                this.connection?.console.log(`delete reference: ${existRefPath}`);
            }
            if (exist.references.size === 0) {
                exist.isVertex = true;
                exist.startNode = undefined;
            }
            return;
        }

        const refPath = normalizeFileNameResolve(dirname(exist.fsPath), refMark.path).toLowerCase();
        const find = this.fileNodes.get(refPath);
        if (find) {
            find.includes.set(path.toLowerCase(), exist);
            exist.references.set(refPath, find);
            this.connection?.console.log(`set new reference: ${refPath}`);
        }

        exist.isVertex = false;

        if (!exist.referenceMark) {
            exist.referenceMark = refMark;
            this.connection?.console.log(`set reference: ${JSON.stringify(refMark)}, full path: ${refPath}`);
            return;
        }

        const oldPath = normalizeFileNameResolve(dirname(path), exist.referenceMark.path).toLowerCase();
        if (oldPath === refPath) {
            return;
        }

        // 删除旧的引用
        exist.references.get(oldPath)?.includes.delete(path.toLowerCase());
        exist.references.delete(oldPath);
        exist.referenceMark = refMark;
        this.connection?.console.log(`delete old reference: ${JSON.stringify(refMark)}, full path: ${oldPath}`);
    }

    get(pathLike: string) {
        let path = isFileUri(pathLike) ? getFileFsPath(pathLike) : pathLike;
        return this.fileNodes.get(path.toLowerCase());
    }

    setStart(pathLike: string) {
        this.startNode = undefined;
        let find = this.get(pathLike);
        if (!find) {
            return;
        }

        if (find.isVertex) {
            this.startNode = find;
            return;
        }

        if (find.startNode) {
            this.startNode = find.startNode;
            return;
        }

        function getAllVertex(node: FileNode): FileNode[] {
            let vetexs: FileNode[] = [];
            let refs = Array.from(node.references.values());
            vetexs.push(...refs.filter(ref => ref.isVertex));
            for (const ref of refs) {
                vetexs.push(...getAllVertex(ref));
            }
            return vetexs;
        }

        let allVertex = getAllVertex(find).sort((a, b) => getPathDepth(a.fsPath, "\\") - getPathDepth(b.fsPath, "\\"));
        this.startNode = allVertex.length > 0 ? allVertex[0] : undefined;
        this.connection?.console.log(`filehandler setstart at path = '${this.startNode?.fsPath}'`);
    }

    parse() {

        function iterateIncludeFile(node: File, callback: (n: File) => void) {
            for (const inc of Array.from(node.includes.values())) {
                callback(inc);
                iterateIncludeFile(inc, callback);
            }
        }

        if (this.startNode) {
            const parser = new Parser(createBasicOptions(this.startNode.fsPath, true, this.startNode.uri, this.global), this.startNode.content);
            parser.catchFileTypeMarkFunction = getFileTypeMark;
            parser.searchParserNode = this.get.bind(this);
            let file = parser.parse();
            this.connection?.console.log(`parser finished, file at ${file.loc.fileName}`);
            this.startNode.file = file;
            this.startNode.parser = parser;
            iterateIncludeFile(file, inc => {
                let fileNode = this.get(inc.loc.fileName)?.startNode;
                if (fileNode) {
                    fileNode.startNode = this.startNode;
                }
                let fileName = inc.loc.fileName.toLowerCase();
                if (!inc.esc) {
                    this.storedMap.set(fileName, inc);
                }
                this.currentMap.set(fileName, inc);
            });
            let lowerPath = this.startNode.fsPath.toLowerCase();
            if (!file.esc) {
                this.storedMap.set(lowerPath, file);
            }
            this.currentMap.set(lowerPath, file);
            return file;
        }
    }

    getCurrent(pathLike: string, getStore = true) {
        let path = isFileUri(pathLike) ? getFileFsPath(pathLike) : pathLike;
        let cur = this.currentMap.get(path.toLowerCase());
        if (cur?.esc && getStore) {
            return this.storedMap.get(path.toLowerCase());
        }
        // this.connection?.console.log(cur ? `get file at ${path}` : `lost file at ${path}`);
        if (!cur) {
            let node = this.get(pathLike);
            let content;
            if (!node) {
                return undefined;
            }
            content = node.content;
            let parser = new Parser(createBasicOptions(path, false, undefined, this.global), content);
            parser.catchFileTypeMarkFunction = getFileTypeMark;
            parser.searchParserNode = this.get.bind(this);
            let file = parser.parse();
            this.currentMap.set(path.toLowerCase(), file);
            if (!file.esc) {
                this.storedMap.set(path.toLowerCase(), file);
            }
            node.file = file;
            node.parser = parser;
            return file;
        }
        return cur;
    }

    getStartNode() {
        return this.startNode;
    }

    dispose() {
        this.fileNodes.clear();
        this.declares.clear();
        this.currentMap.clear();
    }

    private loadDeclareFiles(fileNodes: Map<string, FileNode>) {
        let scope: Scope = new Scope(ScopeFlags.program);
        fileNodes.forEach(file => {
            const parser = new Parser(createBasicOptions(file.fsPath, false, file.uri), file.content);
            const f = parser.parse(scope);
            file.parser = parser;
            file.file = f;
            scope.join(f.scope);
        });
        return { scope, nodes: fileNodes };
    }


    private declareBatMacros(macros: Map<string, BatMacro>, scope: Scope) {

        function createDeclarationFromBatMacro(bat: BatMacro) {
            let parser = new Parser(createBasicOptions(bat.path, false), "");
            let macro = new SingleVarDeclarator(parser, bat.start, new Position(0, 0));
            macro.end = bat.end;
            let id = new Identifier(parser, bat.start, new Position(0, 0));
            id.name = bat.id;
            macro.name = id;
            if (bat.type === "boolean") {
                macro.binding = "Boolean";
            } else if (bat.type === "number") {
                macro.binding = "Long";
            } else if (bat.type === "string") {
                macro.binding = "String";
            } else {
                macro.binding = "Variant";
            }
            return macro;
        }

        macros.forEach((macro, name) => {
            scope.consts.set(name, createDeclarationFromBatMacro(macro));
        });
    }

}


