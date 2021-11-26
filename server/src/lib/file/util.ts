import * as path from "path";
import * as fs from "fs";
import * as jschardet from "jschardet";
import * as iconv from "iconv-lite";
import { lineBreak } from "../util/whitespace";
import {
    File,
    FunctionDeclaration,
    Identifier,
    NodeBase,
    SingleVarDeclarator,
    WithStatement
} from "../types";
import { createBasicOptions, SourceType } from "../options";
import { pathToFileURL } from "url";
import { Parser } from "../parser";
import { Position } from "../util";

export function readFileAndConvertToUtf8(filePath: string): string {
    const file = fs.readFileSync(filePath);
    if (file.length > 0) {
        const info = jschardet.detect(file);
        return iconv.decode(file, info.encoding);
    }
    return "";
}

export interface FileContent {
    uri: string,
    content: string
}

/**
 * 遍历文件夹下所有扩展名为.ini,.inc,.dms,.mrs,.bat的文件，并读取其中内容,
 * 并保存在一个Map中。
 * @param folder 文件夹路径
 * @returns _key_ - 小写完整文件路径  _value_ - 文件内容
 */
export function getAllUsefulFile(folder: string): Map<string, FileContent> {
    const list = new Map<string, FileContent>();
    const fileNames = fs.readdirSync(path.resolve(folder), { withFileTypes: true });
    fileNames.forEach(file => {
        if (file.isDirectory()) {
            mergeMap(list, getAllUsefulFile(path.join(folder, file.name)));
        } else if (file.isFile()) {
            const exten = path.extname(file.name).toLowerCase();
            if (exten === ".ini" ||
                exten === ".inc" ||
                exten === ".dms" ||
                exten === ".mrs" ||
                exten === ".bat") {
                const fullPath = path.join(folder, file.name);
                const content = readFileAndConvertToUtf8(fullPath);
                const uri = pathToFileURL(fullPath).toString();
                list.set(fullPath.toLowerCase(), { uri, content});
            }
        }
    });
    return list;
}

/**
 * 将`target`的内容合并进`base`中
 * @param base
 * @param target
 */
export function mergeMap<T1, T2>(base: Map<T1, T2>, target: Map<T1, T2>) {
    target.forEach((value, key) => {
        if (!base.has(key)) {
            base.set(key, value);
        }
    });
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
    let match;
    if ((match = regex.exec(content))) {
        const firstLine = content.slice(0, match.index);
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
    const reg = /^[^']*?\s*#\s*include\s*"(.*?)"\s*/g;
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

/**
 * 计算指定位置距离对应Node的距离，在Node后为负数，在Node前为正数，在Node内为0
 * @param node
 * @param pos
 * @returns
 */
export function distanceTo<T extends NodeBase>(node: T, pos: number) {
    if (pos >= node.start && pos <= node.end) {
        return 0;
    } else if (pos > node.end) {
        return node.end - pos;
    } else {
        return node.start - pos;
    }
}

export function positionAt<T extends NodeBase>(
    node: T, pos: number, untilId?: boolean, maxDistance?: number): NodeBase {
    if ((node.type === "CallExpression"   ||
        node.type === "MemberExpression" ||
        node.type === "Identifier") && !untilId) {
        return node;
    }
    if (untilId && node.type === "Identifier") {
        return node;
    }
    if (node.positionMap.length > 0 &&
        distanceTo(node, pos) === 0) {
        let cur;
        let nearest = Infinity;
        for (const sub of node.positionMap) {
            let dist = distanceTo(sub, pos);
            if (maxDistance !== undefined &&
                maxDistance >= 0) {
                if (dist <= 0 && Math.abs(dist) <= maxDistance) {
                    cur = sub;
                    break;
                } else {
                    continue;
                }
            } else {
                if (dist <= 0 && Math.abs(dist) < nearest) {
                    nearest = dist;
                    cur = sub;
                } else {
                    continue;
                }
            }
        }
        if (cur) {
            return positionAt(cur, pos, untilId, maxDistance);
        }
    }
    return node;
}

export function positionIn<T extends NodeBase>(
    node: T,
    pos: number,
    callback: (node: NodeBase) => void) {
    if (distanceTo(node, pos) === 0) {
        callback(node);
        let hasFind = false;
        for (const sub of node.positionMap) {
            if (distanceTo(sub, pos) === 0) {
                callback(sub);
                positionIn(sub, pos, callback);
                hasFind = true;
            } else {
                if (!hasFind) {
                    continue;
                } else {
                    break;
                }
            }
        }
    }
}

export function positionInWith(node: NodeBase, pos: number) {
    let withStatement: WithStatement | undefined;
    positionIn(node, pos, sub => {
        if (sub.type === "WithStatement") {
            withStatement = sub as WithStatement;
        }
    });
    return withStatement;
}

export function positionInFunction(node: NodeBase, pos: number) {
    let func: FunctionDeclaration | undefined;
    positionIn(node, pos, sub => {
        if (sub.type === "FunctionDeclaration") {
            func = sub as FunctionDeclaration;
        }
    });
    return func;
}

export function getCurrentParser(file: File, path: string): File | undefined {
    if (file.loc.fileName?.toLowerCase() === path.toLowerCase()) {
        return file;
    }
    const inc = file.includes.get(path.toLowerCase());
    if (inc) {
        return inc;
    }
    for (const sub of file.includes.values()) {
        const find = getCurrentParser(sub, path);
        if (find) {
            return find;
        }
    }
    return undefined;
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

export function createDeclarationFromBatMacro(bat: BatMacro) {
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


