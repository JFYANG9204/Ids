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
    ClassOrInterfaceDeclaration,
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

    getVariant() {
        return this.scope.get("Variant")?.result;
    }

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

    getIdentifierType(id: Identifier) {
        const name = id.name;
        let find = this.scope.get(name)?.result;
        if (find) {
            return find;
        }
        return this.scope.getUndefined(name);
    }

    getMemberObjectType(member: MemberExpression): DeclarationBase | undefined {
        const obj = member.object;
        switch (obj.type) {
            case "Identifier":
                return this.getIdentifierType(obj as Identifier);
            case "MemberExpression":
                return this.getMemberType(member);
            case "Expression":
                return this.scope.currentScope().currentHeader;
            default:
                return this.getVariant();
        }
    }

    getMemberPropertyType(
        member: MemberExpression,
        obj?: DeclarationBase): DeclarationBase | undefined {
        if (!obj) {
            return this.getVariant();
        }
        if (!(obj instanceof ClassOrInterfaceDeclaration)) {
            if (!this.scope.inFunction && this.options.raiseTypeError) {
                this.raiseAtNode(
                    member.object,
                    ErrorMessages["MissingParenObject"],
                    true,
                );
            }
            return this.getVariant();
        }
        const prop = member.property;
        if (prop instanceof Identifier) {
            const child = this.getPropertyOrMethod(prop.name, obj);
            if (!child) {
                this.raiseAtNode(
                    prop,
                    ErrorMessages["MissingProperty"],
                    false,
                    prop.name
                );
                return this.getVariant();
            }
            return child;
        }
        // Object.Member[Index]
        const collection = this.getFinalType(obj, true);
        if (collection) {
            return collection;
        }
    }

    getMemberType(member: MemberExpression): DeclarationBase | undefined {
        const obj = this.getMemberObjectType(member);
        const type = this.getMemberPropertyType(member, obj);
        this.addExtra(member.property, "declaration", type);
        return type;
    }

    getPropertyOrMethod(name: string, node: ClassOrInterfaceDeclaration) {
        for (const prop of node.properties) {
            if (prop.memberName.name.toLowerCase() === name.toLowerCase()) {
                return prop;
            }
        }
        for (const method of node.methods) {
            if (method.id.name.toLowerCase() === name.toLowerCase()) {
                return method;
            }
        }
        return undefined;
    }

    getFinalType(
        node: ClassOrInterfaceDeclaration,
        untilCollection?: boolean): DeclarationBase | undefined {
        if (!node.default || (
            untilCollection && this.isCollection(node)
        )) {
            return node;
        }
        let type;
        let final: DeclarationBase | undefined;
        if (node.default && (
            type = node.default.returnType
        )) {
            if (typeof type === "string") {
                final = this.scope.get(type)?.result;
            } else {
                final = this.scope.get(type.name.name)?.result;
            }
        }
        if (!final ||
            !(final instanceof ClassOrInterfaceDeclaration)) {
            return node;
        } else {
            return this.getFinalType(final, untilCollection);
        }
    }

    isCollection(node: ClassOrInterfaceDeclaration) {
        const parent = node.implements;
        if (!parent || parent.length === 0) {
            return false;
        }
        for (const p of parent) {
            if (p.toLowerCase() === "ienumerable") {
                return true;
            }
        }
        return false;
    }

}

