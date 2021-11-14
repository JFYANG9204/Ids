import { ParserBase } from "../base";
import { FileReferenceMark } from "./util";
import { SourceType } from "../options";
import { File } from "../types";

export type ParserFileNode = {

    filePath: string;
    content: string;
    include: Map<string, ParserFileNode>;
    referenced: Map<string, ParserFileNode>;
    fileReferenceMark?: FileReferenceMark;
    fileTypeMark?: SourceType;
    parser?: ParserBase;
    file?: File;
    isVertex?: true;

};

export function createParserFileNode(
    path: string,
    content: string,
    refMark?: FileReferenceMark,
    fileTypeMark?: SourceType): ParserFileNode {
    return {
        filePath: path,
        content: content,
        include: new Map(),
        referenced: new Map(),
        fileReferenceMark: refMark,
        fileTypeMark: fileTypeMark,
    };
}


