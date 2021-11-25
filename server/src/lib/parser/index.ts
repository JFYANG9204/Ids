import { extname } from "path";
import { types as tt } from "../tokenizer/type";
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
            this.raiseTypeError,
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
        this.updateFuncType = this.checkFunctionBody;
    }

    parse(preDef?: Scope, isInclude?: boolean, inWith?: boolean): File {
        const file = this.startNode(File);
        if (preDef) {
            this.scope.joinScope(preDef);
        }
        if (this.length > 0) {
            this.scope.enter(ScopeFlags.program);
            this.nextToken();
            try {
                file.program = this.parseProgram(tt.eof,
                    this.options.sourceType, inWith);
                file.push(file.program);
                if (!isInclude &&
                    this.options.sourceType !== SourceType.declare) {
                    this.checkFuncInScope(this.scope.store);
                    this.checkBlock(file.program.body);
                }
            } catch (error) {
                file.esc = true;
                file.escError = error;
            } finally {
                this.scope.exit();
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
