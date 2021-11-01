import * as path from "path";
import * as fs from "fs";
import * as jschardet from "jschardet";
import * as iconv from "iconv-lite";
import { lineBreak } from "../util/whitespace";
import {
    File,
    NodeBase
} from "../types";
import { SourceType } from "../options";

export function readFileAndConvertToUtf8(filePath: string): string {
    const file = fs.readFileSync(filePath);
    if (file.length > 0) {
        const info = jschardet.detect(file);
        return iconv.decode(file, info.encoding);
    }
    return "";
}

/**
 * 遍历文件夹下所有扩展名为.ini,.inc,.dms,.mrs的文件，并读取其中内容,
 * 并保存在一个Map中。
 * @param folder 文件夹路径
 * @returns _key_ - 小写完整文件路径  _value_ - 文件内容
 */
export function getAllUsefulFile(folder: string): Map<string, string> {
    const list = new Map<string, string>();
    const fileNames = fs.readdirSync(path.resolve(folder), { withFileTypes: true });
    fileNames.forEach(file => {
        if (file.isDirectory()) {
            mergeMap(list, getAllUsefulFile(path.join(folder, file.name)));
        } else if (file.isFile()) {
            const exten = path.extname(file.name).toLowerCase();
            if (exten === ".ini" ||
                exten === ".inc" ||
                exten === ".dms" ||
                exten === ".mrs") {
                const fullPath = path.join(folder, file.name).toLowerCase();
                const content = readFileAndConvertToUtf8(fullPath);
                list.set(fullPath.toLowerCase(), content);
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
function mergeMap<T1, T2>(base: Map<T1, T2>, target: Map<T1, T2>) {
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
        const markReg = /\s*[']+\s*"((?:[a-zA-Z]:(?:\/|\\.*?))|(?:\.|\.\.|.*?)(?:\\|\/).*?)"\s*[@]\s*([a-zA-Z_][a-zA-Z0-9_]*)/;
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

export function positionAt<T extends NodeBase>(node: T, pos: number, untilId?: boolean): NodeBase {
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
        for (const sub of node.positionMap) {
            if (distanceTo(sub, pos) <= 0) {
                cur = sub;
            } else {
                break;
            }
        }
        if (cur) {
            return positionAt(cur, pos);
        }
    }
    return node;
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


