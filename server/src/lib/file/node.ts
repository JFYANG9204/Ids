import { ParserBase } from "../base";
import { FileReferenceMark } from "./util";
import { SourceType } from "../options";

export type ParserFileNode = {

    filePath: string;
    content: string;
    include: ParserFileNode[];
    referenced: ParserFileNode[];
    fileReferenceMark?: FileReferenceMark;
    fileTypeMark?: SourceType;
    parser?: ParserBase;

};

export function createParserFileNode(
    path: string,
    content: string,
    refMark?: FileReferenceMark,
    fileTypeMark?: SourceType): ParserFileNode {
    return {
        filePath: path,
        content: content,
        include: [],
        referenced: [],
        fileReferenceMark: refMark,
        fileTypeMark: fileTypeMark,
    };
}


