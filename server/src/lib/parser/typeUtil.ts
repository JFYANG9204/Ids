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
    ArgumentDeclarator,
    AssignmentExpression,
    BinaryExpression,
    CallExpression,
    ClassOrInterfaceDeclaration,
    DeclarationBase,
    Expression,
    FunctionDeclaration,
    Identifier,
    LineMark,
    LogicalExpression,
    MacroDeclaration,
    MemberExpression,
    NodeBase,
    PreDefineStatement,
    PropertyDeclaration,
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

    matchType(base: string, check: string, node: NodeBase) {
        let checkString = check.toLowerCase();
        let baseString = base.toLowerCase();
        let checkResult: boolean;
        if (checkString === "variant" ||
            baseString  === "variant" || (
            baseString === "enum"   && checkString === "long") || (
            baseString === "double" && checkString === "long")) {
            checkResult = true;
        } else {
            checkResult = checkString === baseString;
        }
        if (!checkResult) {
            this.raiseAtNode(
                node,
                ErrorMessages["UnmatchedVarType"],
                false,
                checkString,
                baseString);
        }
        return checkResult;
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

    raiseIndexError(node: NodeBase, type: string) {
        this.raiseAtNode(
            node,
            ErrorMessages["UnmatchedIndexType"],
            false,
            type
        );
    }

    getExprType(expr: Expression) {
        let type;
        switch (expr.type) {
            case "Identifier":
                type = this.getIdentifierType(expr as Identifier)?.name.name;
                break;
            case "MemberExpression":
                type = this.getMemberType(expr as MemberExpression)?.name.name;
                break;
            case "CallExpression":
                type = this.getCallExprType(expr as CallExpression)?.name.name;
                break;

            default:
                break;
        }
        return type ?? "Variant";
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
                return this.getMemberType(obj as MemberExpression);
            case "CallExpression":
                return this.getCallExprType(obj as CallExpression);
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
        if ((obj.type !== "ClassOrInterfaceDeclaration") &&
            (obj.type !== "PropertyDeclaration")) {
            if (!this.scope.inFunction &&
                this.options.raiseTypeError) {
                this.raiseAtNode(
                    member.object,
                    ErrorMessages["MissingParenObject"],
                    true,
                );
            }
            return this.getVariant();
        }
        let prop = member.property;
        // Object.Member
        if (prop.type === "Identifier") {
            let child: DeclarationBase | undefined;
            if (obj.type === "PropertyDeclaration") {
                const objReturn = (obj as PropertyDeclaration).returnType.name.name;
                child = this.scope.get(objReturn, obj.namespace)?.result;
            } else {
                child = this.getPropertyOrMethod(
                    (prop as Identifier).name,
                    (obj as ClassOrInterfaceDeclaration));
            }
            if (!child) {
                this.raiseAtNode(
                    prop,
                    ErrorMessages["MissingProperty"],
                    false,
                    (prop as Identifier).name
                );
                return this.getVariant();
            }
            return child;
        }
        // Object.Member[Index]
        let memberDec;
        let needParam;
        let exprType = this.getExprType(member.property);
        if (obj.type === "PropertyDeclaration") {
            memberDec = obj as PropertyDeclaration;
            if (memberDec.params.length === 0) {
                let search = this.scope.get(
                    memberDec.returnType.name.name,
                    obj.namespace)?.result;
                if (!search ||
                    search.type !== "ClassOrInterfaceDeclaration") {
                    if (this.options.raiseTypeError &&
                        !this.scope.inFunction) {
                        this.raiseIndexError(member.property, exprType);
                    }
                    return this.getVariant();
                }
                memberDec = this.getFinalType(
                    search as ClassOrInterfaceDeclaration,
                    true);
            }
        } else {
            memberDec = this.getFinalType(
                obj as ClassOrInterfaceDeclaration, true);
            if (memberDec.type === "ClassOrInterfaceDeclaration" &&
                !this.isCollection(memberDec as ClassOrInterfaceDeclaration)) {
                if (this.options.raiseTypeError) {
                    this.raiseIndexError(member.property, exprType);
                }
                return this.getVariant();
            }
        }
        if (memberDec instanceof PropertyDeclaration &&
            memberDec.params.length === 0) {
            this.raiseIndexError(member.property, "");
        } else if (memberDec instanceof PropertyDeclaration) {
            needParam = memberDec.params[0].declarator.name.name;
        } else {
            if (this.isCollection(memberDec as ClassOrInterfaceDeclaration)) {
                if (memberDec.name.name === "Array") {
                    needParam = "Long";
                } else {
                    needParam = (memberDec as ClassOrInterfaceDeclaration).default?.name.name;
                }
            } else {
                needParam = memberDec.name.name;
            }
        }
        if (needParam) {
            this.matchType(needParam, exprType, member.property);
        }
        return memberDec;
    }

    getMemberType(member: MemberExpression): DeclarationBase | undefined {
        const obj = this.getMemberObjectType(member);
        const type = this.getMemberPropertyType(member, obj);
        this.addExtra(member.property, "declaration", type);
        return type;
    }

    getPropertyOrMethod(name: string, node: ClassOrInterfaceDeclaration) {
        for (const prop of node.properties) {
            if (prop.name.name.toLowerCase() === name.toLowerCase()) {
                return prop;
            }
        }
        for (const method of node.methods) {
            if (method.name.name.toLowerCase() === name.toLowerCase()) {
                return method;
            }
        }
        return undefined;
    }

    getCallExprType(callExpr: CallExpression) {
        const callee = callExpr.callee;
        let objType: DeclarationBase | undefined;
        if (callee.type === "Identifier") {
            objType = this.getIdentifierType(callee as Identifier);
        } else {
            objType = this.getMemberType(callee as MemberExpression);
        }

        let funcName;
        if (callee.type === "Identifier") {
            funcName = (callee as Identifier).name;
        } else {
            funcName = ((callee as MemberExpression).property as Identifier).name;
        }

        if (!objType) {
            if (this.options.raiseTypeError) {
                this.raiseAtNode(
                    callee.type === "Identifier" ?
                    callee : (callee as MemberExpression).property,
                    ErrorMessages["UnknownFunction"],
                    false,
                    funcName);
            }
            return this.getVariant();
        } else if (objType.type !== "FunctionDeclaration") {
            this.raiseAtNode(
                callee.type === "Identifier" ?
                callee : (callee as MemberExpression).property,
                ErrorMessages["IdentifierIsNotFunction"],
                false,
                funcName);
            return this.getVariant();
        }

        this.checkFunctionParams(callExpr, objType as FunctionDeclaration);

        const func = objType as FunctionDeclaration;
        if (func.returnType) {
            return this.scope.get(func.returnType)?.result;
        } else {
            return undefined;
        }
    }

    checkFunctionParams(callExpr: CallExpression, func: FunctionDeclaration) {
        let cur: ArgumentDeclarator | undefined;
        let index = 0;
        const params = callExpr.arguments;
        const args = func.params;
        for (const param of params) {
            const paramType = this.getExprType(param);
            if (index < params.length) {
                const arg = args[index];
                if (arg.paramArray) {
                    cur = arg;
                }
                this.matchType(arg.declarator.valueType, paramType, param);
            } else if (cur) {
                this.matchType(cur.declarator.valueType, paramType, param);
            }
            index++;
        }
        if (args.length < params.length && !cur) {
            this.raiseAtNode(callExpr,
                ErrorMessages["IncorrectFunctionArgumentNumber"],
                false,
                params.length.toString(),
                args.length.toString());
        }
    }

    checkIfCollection(node: Expression) {

    }

    getFinalType(
        node: ClassOrInterfaceDeclaration,
        untilCollection?: boolean,
        otherType?: (node: DeclarationBase) => boolean): DeclarationBase {
        if (!node.default || (
            untilCollection && this.isCollection(node)) || (
            otherType && otherType(node))) {
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

