import { readdir, readdirSync, readFile, readFileSync } from "fs";
import { decode } from "iconv-lite";
import { detect } from "jschardet";
import { createFileNode, FileNode } from "./fileNode";
import { URI } from "vscode-uri";
import { extname, join } from "path";
import { lineBreak, Position, Scope, ScopeFlags } from "../lib/util";
import { Parser } from "../lib";
import { createBasicOptions, SourceType } from "../lib/options";
import { Identifier, SingleVarDeclarator } from "../lib/types";
import { promisify } from "util";

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

const usefulExten = new Set([
    ".ini",
    ".inc",
    ".dms",
    ".mrs",
    ".bat"
]);

async function readUsefulFsPath(folder: string) {
    return await readdirAsync(folder, { withFileTypes: true })
    .then(files => {
        let paths: string[] = [];
        files.forEach(f => {
            if (f.isDirectory()) {
                paths.push(...readUsefulFsPathSync(join(folder, f.name)));
            } else if (usefulExten.has(extname(f.name).toLowerCase())) {
                paths.push(join(folder, f.name));
            }
        });
        return paths;
    });
}

function readUsefulFsPathSync(folder: string): string[] {
    let fsPaths: string[] = [];
    readdirSync(folder, { withFileTypes: true }).forEach(file => {
        if (file.isDirectory()) {
            fsPaths.push(...readUsefulFsPathSync(join(folder, file.name)));
        } else if (usefulExten.has(extname(file.name).toLowerCase())) {
            fsPaths.push(join(folder, file.name));
        }
    });
    return fsPaths;
}

async function readUsefulFiles(paths: string[]) {

    async function getFileNode(fsPath: string) {
        let content = "";
        let uri = URI.file(fsPath).toString();
        await readFileAsync(fsPath).then(buffer => {
            if (buffer.length > 0) {
                let info = detect(buffer);
                content = decode(buffer, info.encoding);
            }
        });
        return createFileNode(uri, fsPath, content);
    }

    const content = await Promise.all(paths.map(async path => await getFileNode(path)));
    return content;
}

/**
 * 遍历文件夹下所有扩展名为.ini,.inc,.dms,.mrs,.bat的文件，并读取其中内容,
 * 并保存在一个Map中。
 * @param folder 文件夹路径
 * @returns _key_ - 小写完整文件路径  _value_ - 文件内容
 */
 export async function readAllUsefulFileInFolder(folder: string) {
    let paths = await readUsefulFsPath(folder);
    return await readUsefulFiles(paths)
    .then(nodes => {
        const nodeMap = new Map<string, FileNode>();
        nodes.forEach(node => {
            nodeMap.set(node.fsPath.toLowerCase(), node);
        });
        return nodeMap;
    });
}


/**
 * 遍历文件夹下所有扩展名为.ini,.inc,.dms,.mrs,.bat的文件，并读取其中内容,
 * 并保存在一个Map中。
 * @param folder 文件夹路径
 * @returns _key_ - 小写完整文件路径  _value_ - 文件内容
 */
export function readAllUsefulFileInFolderSync(folder: string): Map<string, FileNode> {
    const list = new Map<string, FileNode>();
    const fileNames = readUsefulFsPathSync(folder);

    function getFileNode(fsPath: string) {
        let uri = URI.file(fsPath).toString();
        let buffer: Buffer | undefined = readFileSync(fsPath);
        let content = "";
        if (buffer.length > 0) {
            let info = detect(buffer);
            content = decode(buffer, info.encoding);
        }
        return createFileNode(uri, fsPath, content);
    }

    fileNames.forEach(file => { list.set(file.toLowerCase(), getFileNode(file)); });
    return list;
}

export type FileReferenceMark = {
    path: string,
    mark: string,
};

/**
 * 判断并读取字符串文件引用标记
 *
 * 文件引用标记格式 - _'  "path"@ IncudeName_
 * @param content
 * @returns
 */
 export function getFileReferenceMark(content: string): FileReferenceMark | undefined {
    const regex = new RegExp(lineBreak.source, "g");
    regex.lastIndex = 0;
    let index = 0;
    let match;
    while ((match = regex.exec(content))) {
        const firstLine = content.slice(index, match.index);
        if (!(/\s*[']+/.test(firstLine))) {
            break;
        }
        index = match.index;
        const markReg = /\s*[']+\s*"([.]{0,2}(?:(?:\\|\/)*.*?)*(?:[.].*?)?)"\s*[@]\s*([a-zA-Z_][a-zA-Z0-9_]*)/;
        if (markReg.test(firstLine)) {
            const check = markReg.exec(firstLine);
            if (check && check.length === 3) {
                return {
                    path: check[1],
                    mark: check[2]
                };
            }
        }
    }
    return undefined;
}

/**
 * 判断并读取文件类型标注，标注在第一行
 * - script - 'script
 * - metadata - 'metadata
 * @param content
 * @returns
 */
 export function getFileTypeMark(content: string): SourceType | undefined {
    const regex = new RegExp(lineBreak.source, "g");
    let match;
    if ((match = regex.exec(content))) {
        const firstLine = content.slice(0, match.index);
        const metadataReg = /\s*[']+\s*metadata/i;
        const scriptReg = /\s*[']+\s*script/i;
        if (metadataReg.test(firstLine)) {
            return SourceType.metadata;
        } else if (scriptReg.test(firstLine)) {
            return SourceType.script;
        }
    }
    return undefined;
}

/**
 * 获取字符串中包含的所有非注释中的`#include`预处理路径
 * @param content
 * @returns
 */
export function getAllIncludeInFile(content: string) {
    const reg = /^(?<!['])\s*#include\s*"(.*?)"/gm;
    const regexp = new RegExp(reg.source, "gm");
    const incs: string[] = [];
    if (!regexp.test(content)) {
        return [];
    }
    let match;
    while ((match = regexp.exec(content))) {
        incs.push(match[1]);
    }
    return incs;
}


export const batMrScriptRegex = /\s*(?:mrscriptcl)\s*(?:\".*\"|[a-zA-Z_0-9]*\.mrs)(?:\s*\/d\:([a-zA-Z_0-9]*=(?:(?:\"\\\".*?\\\"\")|(?:[0-9]*)|true|false)))*\s*(?:>>\s*[a-zA-Z_0-9]*\.[a-zA-Z_0-9]*)?/ig;
export const batMrScriptItemRegex = /(?:\s*\/d\:([a-zA-Z_0-9]*=(?:(?:\"\\\".*?\\\"\")|(?:[0-9]*)|true|false)))/i;

export const batRunDmsScriptRegex = /\s*(?:dmsrun)\s*(?:(?:\"[a-zA-Z_0-9]*\")|(?:[a-zA-Z_0-9]*\.dms))(\s+\/d\s*\"[a-zA-Z_]\w*\s+(?:(?:\\\".*\\\")|(?:[0-9]+)|(?:[a-zA-Z_][\w\.]*))\")*/igm;
export const batRunDmsScriptItemRegex = /(?:\s+\/d\s*\"([a-zA-Z_]\w*)\s+((?:\\\".*\\\")|(?:[0-9]+)|(?:[a-zA-Z_][\w\.]*))\")/i;

export interface BatMacro {
    path: string,
    id: string,
    type: "string" | "boolean" | "number" | "other",
    start: number,
    end: number
}

export function getMacroFromBatFile(path: string, content: string, macros: Map<string, BatMacro>) {
    let match;
    if (batMrScriptRegex.test(content)) {
        let itemRegex = new RegExp(batMrScriptItemRegex.source, "igm");
        while (match = itemRegex.exec(content)) {
            let reg = /(?:\s*\/d\:(?:([a-zA-Z_0-9]*)=((?:\"\\\".*?\\\"\")|(?:[0-9]*)|true|false)))/i;
            let itemMath = reg.exec(match[0]);
            if (!itemMath) {
                continue;
            }
            let macroName = itemMath[1];
            let value = itemMath[2];
            if (macros.has(macroName.toLowerCase())) {
                continue;
            }

            let type: "string" | "number" | "boolean" | "other";
            if (/true|false/i.test(value)) {
                type = "boolean";
            } else if (/\"\\\".*?\\\"\"/.test(value)) {
                type = "string";
            } else if (/[0-9]+/.test(value)) {
                type = "number";
            } else {
                type = "other";
            }

            let end = itemRegex.lastIndex;
            let start = end - itemMath[0].length;

            macros.set(macroName.toLowerCase(), { path, id: macroName, type, start, end });
        }
    }

    if (batRunDmsScriptRegex.test(content)) {
        let itemRegex = new RegExp(batRunDmsScriptItemRegex.source, "igm");
        while (match = itemRegex.exec(content)) {
            let macroName = match[1];
            let value = match[2];
            if (macros.has(macroName.toLowerCase())) {
                continue;
            }

            let type: "string" | "number" | "boolean" | "other";
            if (/true|false/i.test(value)) {
                type = "boolean";
            } else if (/\\\".*?\\\"/i.test(value)) {
                type = "string";
            } else if (/[0-9]+/.test(value)) {
                type = "number";
            } else {
                type = "other";
            }

            let end = itemRegex.lastIndex;
            let start = end - match[0].length;

            macros.set(macroName.toLowerCase(), { path, id: macroName, type, start, end });
        }
    }
}

export async function loadDeclareFiles(fileNodes: Map<string, FileNode>) {
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


export function declareBatMacros(macros: Map<string, BatMacro>, scope: Scope) {

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
