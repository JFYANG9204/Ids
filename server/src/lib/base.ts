import { ParserFileNode } from "./file/node";
import { Options } from "./options";
import { State } from "./tokenizer/state";
import { ScopeHandler } from "./util/scope";



export class ParserBase {
    declare options: Options;
    declare fileName: string;
    declare input: string;
    declare state: State;
    declare length: number;
    declare scope: ScopeHandler;
    declare searchParserNode?: (filePath: string) => ParserFileNode | undefined;
}

