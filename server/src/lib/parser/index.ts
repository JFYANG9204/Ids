import { extname } from "path";
import { types as tt } from "../tokenizer/type";
import { Options, ScriptFileType, SourceType } from "../options";
import { EventSection, File } from "../types";
import { Scope, ScopeFlags, ScopeHandler } from "../util/scope";
import { ErrorMessages } from "./error-messages";
import { StaticTypeChecker } from "./typeCheker";
import { createTypeRaiseFunction } from "./typeUtil";


export class Parser extends StaticTypeChecker {

    catchFileTypeMarkFunction?: (content: string) => SourceType | undefined;

    constructor(options: Options, input: string) {
        super(options, input);
        this.fileName = this.options.sourceFileName ?? "";
        this.scope = new ScopeHandler(
            this,
            createTypeRaiseFunction(this),
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

    parse(preDef?: Scope, isInclude?: boolean, inWith?: boolean, event?: EventSection): File {
        const file = this.startNode(File);
        if (preDef) {
            this.scope.joinScope(preDef);
        }
        if (this.length > 0) {
            this.nextToken();
            this.checkHeaderCommentOption();
            this.scope.enter(ScopeFlags.program);
            try {
                file.program = this.parseProgram(tt.eof,
                    this.options.sourceType, inWith, event);
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

    checkHeaderCommentOption() {

        let declared = this.options.sourceType === SourceType.declare;

        let comments = this.state.comments;
        for (let i = 0; i < comments.length; ++i) {
            if (/\s*metadata\s*/i.test(comments[i].value) && !declared) {
                this.options.sourceType = SourceType.metadata;
            }
            if (/\s*ignore-type-error\s*/i.test(comments[i].value)) {
                this.options.raiseTypeError = false;
            }
            if (/\s*ignore-path-error\s*/i.test(comments[i].value)) {
                this.options.raisePathError = false;
            }
        }
    }

}
