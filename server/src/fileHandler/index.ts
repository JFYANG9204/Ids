import { URI } from "vscode-uri";
import { FileNode } from "./fileNode";
import { BatMacro, getFileReferenceMark, getMacroFromBatFile, readAllUsefulFileInFolder } from "./load";



export class FileHandler {

    /**
     * 文件夹系统路径
     */
    folderPath: string;
    /**
     * 文件夹uri
     */
    uri: string;

    vertex: FileNode[] = [];
    // 非声明文件
    fileNodes: Map<string, FileNode> = new Map();
    // 声明文件(.d.mrs)
    declares: Map<string, FileNode> = new Map();

    constructor(folder: string) {
        this.folderPath = folder;
        this.uri = URI.file(folder).toString();
    }

    async init() {
        this.fileNodes = await readAllUsefulFileInFolder(this.folderPath);
        this.fileNodes.forEach(node => {
            let path = node.fsPath.toLowerCase();
            let batMacro = new Map<string, BatMacro>();
            if (path.endsWith(".d.mrs")) {
                this.declares.set(path, node);
            } else if (path.endsWith(".bat")) {
                getMacroFromBatFile(node.fsPath, node.content, batMacro);
            } else {
                node.referenceMark = getFileReferenceMark(node.content);
                this.fileNodes.set(path, node);
            }
        });
    }

}


