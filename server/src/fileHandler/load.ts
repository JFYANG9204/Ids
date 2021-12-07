import { readdir, readFile } from "fs";
import { decode } from "iconv-lite";
import { detect } from "jschardet";
import { createFileNode, FileNode } from "./fileNode";
import { URI } from "vscode-uri";
import { join } from "path";
import { extname } from "path";
import { SourceType } from "../lib/options";
import { lineBreak } from "../lib/util";


const usefulExten = new Set([
    ".ini",
    ".inc",
    ".dms",
    ".mrs",
    ".bat"
]);

function readUsefulFsPath(folder: string): string[] {
    let fsPaths: string[] = [];
    readdir(folder, { withFileTypes: true }, (err, files) => {
        if (!err) {
            files.forEach(f => {
                if (f.isDirectory()) {
                    fsPaths = fsPaths.concat(readUsefulFsPath(join(folder, f.name)));
                } else {
                    if (usefulExten.has(extname(f.name))) {
                        fsPaths.push(join(folder, f.name));
                    }
                }
            });
        }
    });
    return fsPaths;
}

async function readUsefulFiles(paths: string[]) {

    async function getFileNode(fsPath: string) {
        let uri = URI.file(fsPath).toString();
        let buffer: Buffer | undefined;
        let content = "";
        readFile(fsPath, (err, data) => {
            if (!err) {
                buffer = data;
            }
        });
        if (buffer) {
            let info = detect(buffer);
            content = decode(buffer, info.encoding);
        }
        return createFileNode(uri, fsPath, content);
    }

    const content = await Promise.all(paths.map(path => getFileNode(path)));
    return content;
}

export async function readAllUsefulFileInFolder(folder: string) {
    const paths = readUsefulFsPath(folder);
    const nodes = await readUsefulFiles(paths);
    const nodeMap = new Map<string, FileNode>();
    nodes.forEach(node => {
        nodeMap.set(node.fsPath.toLowerCase(), node);
    });
    return nodeMap;
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
