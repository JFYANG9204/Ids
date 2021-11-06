import { extname } from "path";
import { Options, ScriptFileType, SourceType } from "../options";
import { StatementParser } from "./statement";
import { File } from "../types";
import { ScopeHandler } from "../util/scope";
import { ErrorMessages } from "./error-messages";
import { DefinitionBase } from "../util/definition";
import { getFileTypeMark } from "../file/util";


export class Parser extends StatementParser {

    constructor(options: Options, input: string) {
        super(options, input);
        this.fileName = this.options.sourceFileName ?? "";
        this.scope = new ScopeHandler(
            (node, template, ...params) => this.raiseAtLocation(node.start, node.end, template, false, ...params),
            this.state.localDefinitions);
        if (extname(this.fileName).toLowerCase() === ".dms") {
            this.options.scriptFileType = ScriptFileType.dms;
        } else {
            this.options.scriptFileType = ScriptFileType.mrs;
        }
        if (this.fileName.toLowerCase().endsWith(".d.mrs")) {
            this.options.sourceType = SourceType.declare;
        }
        const typeMark = getFileTypeMark(input);
        if (typeMark !== undefined) {
            this.options.sourceType = typeMark;
        }
    }

    parse(preDef?: Map<string, DefinitionBase>, header?: DefinitionBase): File {
        const file = this.startNode(File);
        this.scope.enter(file, true);
        if (preDef) {
            this.scope.currentScope().joinMap(preDef);
        }
        if (header) {
            this.scope.currentScope().enterHeader(header);
        }
        if (this.length > 0) {
            this.nextToken();
            try {
                file.program = this.parseProgram();
            // eslint-disable-next-line no-empty
            } catch (error) {
            }
        }
        this.checkLineMarkError();
        file.comments = this.state.comments;
        file.errors = this.state.errors;
        file.warnings = this.state.warnings;
        file.includes = this.state.includes;
        file.definitions = this.scope.currentScope().storeMap;
        this.scope.exit();
        return this.finishNode(file, "File");
    }

    checkLineMarkError() {
        if (this.needCheckLineMark.length > 0) {
            this.needCheckLineMark.forEach(
                line => this.raiseAtNode(
                    line,
                    ErrorMessages["LineMarkIsNotExist"],
                    false,
                    line.name)
            );
        }
    }

}
