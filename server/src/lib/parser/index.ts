import { extname } from "path";
import { Options, ScriptFileType, SourceType } from "../options";
import { File } from "../types";
import { Scope, ScopeFlags, ScopeHandler } from "../util/scope";
import { ErrorMessages } from "./error-messages";
import { StaticTypeChecker } from "./typeCheker";


export class Parser extends StaticTypeChecker {

    catchFileTypeMarkFunction?: (content: string) => SourceType | undefined;

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
        if (this.catchFileTypeMarkFunction) {
            const typeMark = this.catchFileTypeMarkFunction(input);
            if (typeMark !== undefined) {
                this.options.sourceType = typeMark;
            }
        }
    }

    parse(preDef?: Scope, isInclude?: boolean): File {
        const file = this.startNode(File);
        if (preDef) {
            this.scope.joinScope(preDef);
        }
        if (this.length > 0) {
            this.nextToken();
            try {
                this.scope.enter(ScopeFlags.program);
                file.program = this.parseProgram();
                if (!isInclude) {
                    this.checkIncludeFiles();
                    this.checkFuncInScope(this.scope.currentScope());
                    this.checkBlock(file.program.body);
                }
                this.scope.exit();
            // eslint-disable-next-line no-empty
            } catch (error) {
                //const err = error;
            }
        }
        this.checkLineMarkError();
        file.comments = this.state.comments;
        file.errors = this.state.errors;
        file.warnings = this.state.warnings;
        file.includes = this.state.includes;
        file.scope = this.scope.store;
        file.parser = this;
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
