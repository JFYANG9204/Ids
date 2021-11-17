import { extname } from "path";
import { Options, ScriptFileType, SourceType } from "../options";
import { StatementParser } from "./statement";
import { DeclarationBase, File } from "../types";
import { Scope, ScopeFlags, ScopeHandler } from "../util/scope";
import { ErrorMessages } from "./error-messages";
import { getFileTypeMark } from "../file/util";


export class Parser extends StatementParser {

    constructor(options: Options, input: string) {
        super(options, input);
        this.fileName = this.options.sourceFileName ?? "";
        this.scope = new ScopeHandler(
            this,
            (node, template, warning,...params) => this.raiseAtLocation(node.start, node.end, template, warning, ...params),
            this.options.globalDeclarations,
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

    parse(preDef?: Scope, header?: DeclarationBase): File {
        const file = this.startNode(File);
        if (preDef) {
            this.scope.joinScope(preDef);
        }
        if (this.length > 0) {
            this.nextToken();
            try {
                this.scope.enter(ScopeFlags.program);
                if (header) {
                    this.scope.enterHeader(header);
                }
                file.program = this.parseProgram();
                this.scope.exit();
            // eslint-disable-next-line no-empty
            } catch (error) {
            }
        }
        this.checkLineMarkError();
        file.comments = this.state.comments;
        file.errors = this.state.errors;
        file.warnings = this.state.warnings;
        file.includes = this.state.includes;
        file.scope = this.scope.store;
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
