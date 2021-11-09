import { createArrayDefinition } from "../built-in/basic";
import {
    BasicTypeDefinitions,
    IDocumentDefinition,
    IQuestionDefinition,
    MrScriptConstantsDefinition,
    MsApplicationDefinition,
    searchBuiltIn,
    VbsDictionaryDefinition,
    VbsFsoDefinition,
} from "../built-in/built-ins";
import {
    AssignmentExpression,
    BinaryExpression,
    CallExpression,
    DeclarationBase,
    Expression,
    Identifier,
    LineMark,
    LogicalExpression,
    MacroDeclaration,
    MemberExpression,
    NodeBase,
    PreDefineStatement,
    UnaryExpression,
} from "../types";
import {
    DefinitionBase,
    FunctionDefinition,
    InterfaceDefinition,
    ObjectDefinition,
    PropertyDefinition,
    ValueType,
    VariantDefinition,
} from "../util/definition";
import { matchOneOfDefinitions } from "../util/match";
import { BindTypes } from "../util/scope";
import { ErrorMessages, WarningMessages } from "./error-messages";
import { ErrorTemplate } from "./errors";
import { UtilParser } from "./util";

export class TypeUtil extends UtilParser {

    needCheckLineMark: Identifier[] = [];

    declareLocalVar(
        name: string,
        node: NodeBase) {
        this.scope.declareName(
            name,
            BindTypes.var,
            node
        );
    }

    declareMacroVar(
        name: string,
        node: MacroDeclaration) {
        this.scope.declareName(
            name,
            BindTypes.const,
            node
        );
    }

    checkNewLineMark(line: LineMark) {
        if (this.state.getLineMark(line.id.name) &&
            this.options.raiseTypeError &&
            !this.scope.inFunction) {
            this.raiseAtNode(
                line.id,
                ErrorMessages["LineMarkRedeclaration"],
                false,
                line.id.name
            );
        } else {
            this.state.lineMarks.push(line);
        }
    }

    checkExistLineMark(id: Identifier) {
        const line = this.state.getLineMark(id.name);
        if (!line) {
            this.needCheckLineMark.push(id);
        }
        return line;
    }

    checkAheadLineMark(id: Identifier) {
        this.needCheckLineMark.forEach(
            (line, index) => {
                if (line.name.toLowerCase() === id.name.toLowerCase()) {
                    this.needCheckLineMark.splice(index, 1);
                }
            }
        );
    }

    checkVarDeclared(name: string, node: NodeBase) {
        let find = this.scope.get(name)?.result;
        if (!find &&
            !this.scope.inFunction) {
            this.raiseAtNode(
                node,
                ErrorMessages["VarIsNotDeclared"],
                false,
                name
            );
        }
    }

}

