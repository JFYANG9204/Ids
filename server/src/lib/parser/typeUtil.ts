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
} from "../types";
import { BindTypes } from "../util/scope";
import { ErrorMessages, WarningMessages } from "./error-messages";
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
        if (checkString === "variant"   ||
            baseString  === "variant"   ||
            checkString === "iquestion" ||
            baseString  === "iquestion" || (
            baseString  === "enum"   && checkString === "long") || (
            baseString  === "double" && checkString === "long")) {
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
            return false;
        }
        return true;
    }

    checkAssignmentLeft(type: DeclarationBase, node: NodeBase) {
        switch (type.type) {
            case "PropertyDeclaration":
                const prop = type as PropertyDeclaration;
                if (prop.readonly &&
                    this.options.raiseTypeError) {
                    this.raiseAtNode(
                        node,
                        ErrorMessages["ReadonlyPropertCannotBeLeft"],
                        false,
                        prop.name.name);
                }
                break;
            case "FunctionDeclaration":
                if (this.options.raiseTypeError) {
                    this.raiseAtNode(
                        node,
                        ErrorMessages["FunctionCannotBeLeft"],
                        false);
                }
                break;
            case "MacroDeclaration":
            case "ClassOrInterfaceDeclaration":
                if (this.options.raiseTypeError) {
                    this.raiseAtNode(
                        node,
                        ErrorMessages["ConstVarCannotBeAssigned"],
                        false);
                }
                break;

            default:
                break;
        }
    }

    checkLogicalLeftRight(type: DeclarationBase, node: NodeBase) {
        switch (type.type) {
            case "FunctionDeclaration":
                const func = type as FunctionDeclaration;
                if (!func.returnType) {
                    this.needReturn(node);
                }
                break;

            default:
                break;
        }
    }

    raiseIndexError(node: NodeBase, type: string) {
        if (this.options.raiseTypeError &&
            !this.scope.inFunction) {
                this.raiseAtNode(
                    node,
                    ErrorMessages["UnmatchedIndexType"],
                    false,
                    type);
        }
    }

    needReturn(expr: Expression) {
        if (this.options.raiseTypeError &&
            !this.scope.inFunction) {
            this.raiseAtNode(
                expr,
                ErrorMessages["ExpressionNeedReturn"],
                false);
        }
    }

    needCollection(expr: Expression) {
        if (this.options.raiseTypeError &&
            !this.scope.inFunction) {
            this.raiseAtNode(
                expr,
                ErrorMessages["PropertyOrObjectIsNotCollection"],
                false);
        }
    }

    undefined(node: NodeBase, name: string) {
        if (this.options.raiseTypeError &&
            !this.scope.inFunction) {
            this.raiseAtNode(
                node,
                ErrorMessages["VarIsNotDeclared"],
                false,
                name);
        }
    }

    checkExprError(expr: Expression) {
        this.getExprType(expr);
    }

    getExprType(expr: Expression,
        findType?: { type: DeclarationBase | undefined }) {
        let type;
        let find: DeclarationBase | undefined;
        switch (expr.type) {

            case "StringLiteral":
                find = this.scope.get("String")?.result;
                break;
            case "NumericLiteral":
                find = this.scope.get("Long")?.result;
                break;
            case "DecimalLiteral":
                find = this.scope.get("Double")?.result;
                break;
            case "BooleanLiteral":
                find = this.scope.get("Boolean")?.result;
                break;
            case "NullLiteral":
                find = this.scope.get("Null")?.result;
                break;

            case "Identifier":
                find = this.getIdentifierType(expr as Identifier);
                break;
            case "MemberExpression":
                find = this.getMemberType(expr as MemberExpression);
                break;
            case "CallExpression":
                find = this.getCallExprType(expr as CallExpression);
                break;
            case "UnaryExpression":
                find = this.scope.get("Boolean")?.result;
                break;
            case "BinaryExpression":
                find = this.getBinaryExprType(expr as BinaryExpression);
                break;
            case "AssignmentExpression":
                find = this.getAssignExprType(expr as AssignmentExpression);
                break;

            default:
                break;
        }
        if (findType) {
            findType.type = find;
        }
        this.addExtra(expr, "declaration", find);
        type = find?.name.name;
        return type ?? "Variant";
    }

    getLogicalExprType(expr: LogicalExpression): DeclarationBase | undefined {
        let leftReturn: DeclarationBase | undefined;
        let rightReturn: DeclarationBase | undefined;
        this.getExprType(expr.left, { type: leftReturn });
        this.getExprType(expr.right, { type: rightReturn });
        if (leftReturn) {
            this.checkLogicalLeftRight(leftReturn, expr.left);
        }
        if (rightReturn) {
            this.checkLogicalLeftRight(rightReturn, expr.right);
        }
        return this.scope.get("Boolean")?.result;
    }

    getBinaryExprType(expr: BinaryExpression): DeclarationBase | undefined {
        let leftReturn: DeclarationBase | undefined;
        let rightReturn: DeclarationBase | undefined;
        const left = this.getExprType(expr.left, { type: leftReturn });
        const right = this.getExprType(expr.right, { type: rightReturn });
        if (!leftReturn || !rightReturn) {
            if (!leftReturn) {
                this.needReturn(expr.left);
            }
            if (!rightReturn) {
                this.needReturn(expr.right);
            }
            return this.getVariant();
        }
        if (this.matchType(left, right, expr.right)) {
            return left.toLowerCase() === "variant" ? rightReturn : leftReturn;
        } else {
            return this.getVariant();
        }
    }

    getAssignExprType(expr: AssignmentExpression) {
        let left;
        let rightType: DeclarationBase | undefined;
        this.getExprType(expr.right, { type: rightType });
        if (!rightType) {
            this.needReturn(expr.right);
            return this.getVariant();
        }
        if (expr.left instanceof Identifier) {
            const leftResult = this.scope.get(expr.left.name);
            left = leftResult?.result;
            if (leftResult?.type === BindTypes.const) {
                this.raiseAtNode(
                    expr.left,
                    ErrorMessages["ConstVarCannotBeAssigned"],
                    false);
            } else if (left) {
                this.scope.update(
                    expr.left.name,
                    BindTypes.var,
                    rightType,
                    expr);
            } else {
                this.undefined(expr.left, expr.left.name);
                this.scope.declareUndefined(
                    expr.left.name,
                    rightType);
            }
        } else {
            let leftType: DeclarationBase | undefined;
            left = this.getExprType(expr.right, { type: leftType });
            if (leftType) {
                this.checkAssignmentLeft(leftType, expr.left);
            }
        }
        return rightType;
    }

    getIdentifierType(id: Identifier) {
        const name = id.name;
        let find = this.scope.get(name)?.result;
        if (find) {
            this.addExtra(id, "declaration", find);
            return find;
        } else {
            if (this.options.treatUnkownAsQuesion) {
                let question = this.scope.get("IQuestion")?.result;
                this.scope.declareUndefined(id.name);
                this.addExtra(id, "declaration", question);
                return question;
            } else {
                this.undefined(id, id.name);
            }
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
                    this.raiseIndexError(member.property, exprType);
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
                this.raiseIndexError(member.property, exprType);
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
            const object = this.getCreateObjectType(callExpr);
            if (object) {
                this.addExtra(callExpr.callee, "declaration", object);
                return object;
            }
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

    checkIfCollection(node: Expression, element?: NodeBase) {
        let type: DeclarationBase | undefined;
        this.getExprType(node, { type: type });
        if (!type) {
            this.needCollection(node);
            return false;
        }
        let final: DeclarationBase | undefined = type;
        if (type.type === "PropertyDeclaration") {
            const prop = type as PropertyDeclaration;
            final = this.scope.get(prop.returnType.name.name)?.result;
            if (!final) {
                this.needCollection(node);
                return false;
            }
        }
        if (type.type !== "ClassOrInterfaceDeclaration") {
            this.needCollection(node);
            return false;
        }
        final = type as ClassOrInterfaceDeclaration;
        if (!this.isCollection(final as ClassOrInterfaceDeclaration)) {
            final = this.getFinalType(
                final as ClassOrInterfaceDeclaration,
                true);
        }
        if (!this.isCollection(final as ClassOrInterfaceDeclaration)) {
            this.needCollection(node);
            return false;
        }
        const variant = this.getVariant();
        if (!(final as ClassOrInterfaceDeclaration).default) {
            if (element) {
                this.addExtra(element, "declaration", variant);
            }
            return variant;
        } else {
            const name = (final as ClassOrInterfaceDeclaration).default?.name.name;
            if (name) {
                const find = this.scope.get(name)?.result;
                if (element) {
                    this.addExtra(element, "declaration", find);
                }
                return find;
            } else {
                if (element) {
                    this.addExtra(element, "declaration", variant);
                }
                return variant;
            }
        }
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

    getCreateObjectType(func: CallExpression) {
        if (func.callee instanceof Identifier &&
            func.callee.name.toLowerCase() === "createobject") {
            const text = func.arguments[0].extra["rawValue"].toLowerCase();
            switch (text) {
                case "tom.document":
                    return this.scope.get("IDocument", "TOMLib")?.result;
                case "scripting.dictionary":
                    return this.scope.get("Dictionary")?.result;
                case "scripting.filesystemobject":
                    return this.scope.get("FileSystemObject")?.result;
                default:
                    this.raiseAtNode(
                        func.arguments[0],
                        ErrorMessages["InvalidObjectScripting"],
                        false);
                    break;
            }
        }
        return undefined;
    }

}

