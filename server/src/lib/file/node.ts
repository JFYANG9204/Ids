import { FileReferenceMark } from "./util";
import { SourceType } from "../options";
import { File } from "../types";
import { Parser } from "../parser";

export type ParserFileNode = {

    uri: string,
    filePath: string;
    content: string;
    include: Map<string, ParserFileNode>;
    referenced: Map<string, ParserFileNode>;
    fileReferenceMark?: FileReferenceMark;
    fileTypeMark?: SourceType;
    parser?: Parser;
    file?: File;
    isVertex?: true;

};

export function createParserFileNode(
    uri: string,
    path: string,
    content: string,
    refMark?: FileReferenceMark,
    fileTypeMark?: SourceType): ParserFileNode {
    return {
        uri,
        filePath: path,
        content: content,
        include: new Map(),
        referenced: new Map(),
        fileReferenceMark: refMark,
        fileTypeMark: fileTypeMark,
    };
}


