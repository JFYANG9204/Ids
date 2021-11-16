import {
    ArgumentDeclarator,
    AssignmentExpression,
    BinaryExpression,
    BindingDeclarator,
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
    PropertyDeclaration,
    SingleVarDeclarator,
} from "../types";
import { isBasicType, isConversionFunction } from "../util/match";
import { BindTypes } from "../util/scope";
import { ErrorMessages, WarningMessages } from "./error-messages";
import { UtilParser } from "./util";

export class TypeUtil extends UtilParser {

    needCheckLineMark: Identifier[] = [];

    getVariant() {
        return this.scope.get("Variant")?.result;
    }

    getBindingTypeName(binding: BindingDeclarator | string) {
        return typeof binding === "string" ? binding :
            binding.name.name;
    }

    getPropertyBindingType(prop: PropertyDeclaration) {
        return this.getBindingTypeName(prop.binding);
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
                check,
                base);
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
        if (!find) {
            if (!this.scope.inFunction) {
                this.raiseAtNode(
                    node,
                    ErrorMessages["VarIsNotDeclared"],
                    false,
                    name);
            }
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
                if (this.options.raiseTypeError) {
                    this.raiseAtNode(
                        node,
                        ErrorMessages["ConstVarCannotBeAssigned"],
                        false);
                }
                break;
            case "ClassOrInterfaceDeclaration":

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

    undefined(node: NodeBase, name: string, isFunction?: boolean) {
        if (this.options.raiseTypeError &&
            !this.scope.inFunction) {
            this.raiseAtNode(
                node,
                isFunction ? ErrorMessages["UnknownFunction"] :
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
            case "CategoricalLiteral":
                find = this.scope.get("Categorical")?.result;
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
        type = this.getDeclareBaseType(expr, find);
        return type ?? "Variant";
    }

    getDeclareBaseType(node: NodeBase, dec?: DeclarationBase) {
        if (!dec) {
            return undefined;
        }
        switch (dec.type) {
            case "MacroDeclaration":
                const macro = dec as MacroDeclaration;
                if (!macro.init) {
                    this.raiseAtNode(
                        node,
                        ErrorMessages["MacroHasNoInitValue"],
                        false);
                    return "Variant";
                }
                if (typeof macro.initValue === "string") {
                    return "String";
                } else if (typeof macro.initValue === "number") {
                    return "Long";
                } else if (typeof macro.initValue === "boolean") {
                    return "Boolean";
                } else {
                    return "Variant";
                }

            case "SingleVarDeclarator":
                const single = dec as SingleVarDeclarator;
                if (single.binding) {
                    return typeof single.binding === "string" ?
                        single.binding : single.binding.name.name;
                } else {
                    return "Variant";
                }

            case "ArrayDeclarator":
                return "Array";

            case "PropertyDeclaration":
                return this.getPropertyBindingType(dec as PropertyDeclaration);

            default:
                return dec.name.name;
        }
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
        let leftReturn: { type: DeclarationBase | undefined } = { type: undefined };
        let rightReturn: { type: DeclarationBase | undefined } = { type: undefined };
        let left = this.getExprType(expr.left, leftReturn);
        let right = this.getExprType(expr.right, rightReturn);
        if (!leftReturn.type || !rightReturn.type) {
            if (!leftReturn.type) {
                this.needReturn(expr.left);
            }
            if (!rightReturn.type) {
                this.needReturn(expr.right);
            }
            return this.getVariant();
        }
        //
        let final;
        if (leftReturn.type instanceof ClassOrInterfaceDeclaration ||
            leftReturn.type instanceof PropertyDeclaration) {
            final = this.getFinalType(leftReturn.type);
            if (final instanceof PropertyDeclaration) {
                left = this.getPropertyBindingType(final);
            } else {
                left = final.name.name;
            }
        }
        if (rightReturn.type instanceof ClassOrInterfaceDeclaration ||
            rightReturn.type instanceof PropertyDeclaration) {
            final = this.getFinalType(rightReturn.type);
            if (final instanceof PropertyDeclaration) {
                right = this.getPropertyBindingType(final);
            } else {
                right = final.name.name;
            }
        }
        //
        if (this.matchType(left, right, expr.right)) {
            return left.toLowerCase() === "variant" ? rightReturn.type : leftReturn.type;
        } else {
            return this.getVariant();
        }
    }

    getAssignExprType(expr: AssignmentExpression) {
        let left;
        let rightType: { type: DeclarationBase | undefined } = { type: undefined };
        this.getExprType(expr.right, rightType);
        if (!rightType.type) {
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
                    rightType.type,
                    expr);
                if (expr.treeParent &&
                    expr.treeParent.type !== "SetStatement") {
                    let finalType = rightType.type;
                    if (finalType instanceof ClassOrInterfaceDeclaration) {
                        finalType = this.getFinalType(finalType);
                    }
                    if (!isBasicType(finalType.name.name)) {
                        this.raiseAtNode(
                            expr,
                            WarningMessages["AssignmentMaybeObject"],
                            true);
                    }
                }
            } else {
                this.undefined(expr.left, expr.left.name);
                this.scope.declareUndefined(
                    expr.left,
                    rightType.type);
            }
            if (left) {
                this.addExtra(expr.left, "declaration", left);
            }
        } else {
            let leftType: { type: DeclarationBase | undefined } = { type: undefined };
            left = this.getExprType(expr.right, leftType);
            if (leftType.type) {
                this.checkAssignmentLeft(leftType.type, expr.left);
            }
        }
        return rightType.type;
    }

    getIdentifierType(id: Identifier) {
        const name = id.name;
        let find = this.scope.get(name)?.result;
        if (find) {
            this.addExtra(id, "declaration", find);
            return find;
        } else {
            let isFunction = false;
            if (id.treeParent instanceof CallExpression &&
                id.treeParent.callee === id) {
                isFunction = true;
            }
            let undef = this.scope.getUndefined(name);
            if (undef) {
                this.undefined(id, id.name, isFunction);
                return undef;
            }
            if (this.options.treatUnkownAsQuesion &&
                !isFunction) {
                let question = this.scope.get("IQuestion")?.result;
                this.scope.declareUndefined(id);
                this.addExtra(id, "declaration", question);
                return question;
            } else {
                this.undefined(id, id.name, isFunction);
            }
        }
        return find;
    }

    getMemberObjectType(member: MemberExpression): DeclarationBase | undefined {
        const obj = member.object;
        switch (obj.type) {
            case "Identifier":
                const type = this.getIdentifierType(obj as Identifier);
                if (type?.type === "SingleVarDeclarator") {
                    const single = type as SingleVarDeclarator;
                    return single.bindingType ??
                        this.scope.get(this.getBindingTypeName(single.binding))?.result;
                } else if (type?.type === "ArrayDeclarator") {
                    return this.scope.get("Array")?.result;
                }
                return type;
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
            let parent: DeclarationBase | undefined = obj;
            let child: DeclarationBase | undefined;
            if (obj.type === "PropertyDeclaration") {
                const objReturn = this.getPropertyBindingType(obj as PropertyDeclaration);
                const objProp = obj as PropertyDeclaration;
                parent = this.scope.get(objReturn,
                    typeof objProp.class.namespace === "string" ? objProp.namespace :
                    objProp.class.namespace?.name.name)?.result;
            }
            if (parent && parent.type === "ClassOrInterfaceDeclaration") {
                child = this.getPropertyOrMethod(
                    (prop as Identifier).name,
                    (parent as ClassOrInterfaceDeclaration));
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
                    this.getPropertyBindingType(memberDec),
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
        } else if (obj.type === "ClassOrInterfaceDeclaration" &&
            obj.name.name === "IQuestion") {
                memberDec = this.scope.get("IQuestion")?.result;
                if (!memberDec) {
                    return this.getVariant();
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
            needParam = this.getBindingTypeName(memberDec.params[0].declarator.binding);
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
                this.addExtra(callExpr.callee, "declaration", objType);
                return object;
            } else {
                this.checkConversion(callExpr);
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
                this.matchType(this.getBindingTypeName(arg.declarator.binding),
                    paramType, param);
            } else if (cur) {
                this.matchType(this.getBindingTypeName(cur.declarator.binding),
                    paramType, param);
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

    checkIfCollection(node: Expression, element?: Identifier) {

        // 判定Expression返回类型
        let resultType: { type: DeclarationBase | undefined } = { type: undefined };
        this.getExprType(node, resultType);
        if (!resultType.type) {
            this.needCollection(node);
            return false;
        }

        // 判断final是否是属性声明，如果是属性则返回属性的返回类型
        let final: DeclarationBase | undefined = resultType.type;
        if (resultType.type.type === "PropertyDeclaration") {
            const prop = resultType.type as PropertyDeclaration;
            final = this.scope.get(
                this.getPropertyBindingType(prop))?.result;
            if (!final) {
                this.needCollection(node);
                return false;
            }
        }

        // SingleVarDeclarator 和 Array 两个本地声明类型，单独检查，返回绑定类型
        if (resultType.type.type === "ArrayDeclarator") {
            final = this.scope.get("Array")?.result;
        } else if (resultType.type.type === "SingleVarDeclarator") {
            final = (resultType.type as SingleVarDeclarator).bindingType;
        }

        // 如果没有final类型，或者final不是类或接口，则不是集合，报错并返回false
        if (!final || final.type !== "ClassOrInterfaceDeclaration") {
            this.needCollection(node);
            return false;
        }

        // 当前结果视为接口或类
        final = final as ClassOrInterfaceDeclaration;
        if (!this.isCollection(final as ClassOrInterfaceDeclaration)) {
            final = this.getFinalType(
                final as ClassOrInterfaceDeclaration,
                true);
            if (!this.isCollection(final as ClassOrInterfaceDeclaration)) {
                this.needCollection(node);
                return false;
            }
        }
        const variant = this.getVariant();
        if (!(final as ClassOrInterfaceDeclaration).default) {
            if (element) {
                this.addExtra(element, "declaration", variant);
            }
            return variant;
        } else {
            const def = final as ClassOrInterfaceDeclaration;
            const name: string | undefined =
                def.default ?
                this.getPropertyBindingType(def.default) : undefined;
            if (name) {
                let find = this.scope.get(name)?.result;
                if (element && find) {
                    if (this.scope.get(element.name)) {
                        this.scope.update(element.name, BindTypes.var, find, element);
                    } else {
                        find = this.scope.declareUndefined(element, find);
                    }
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
        node: ClassOrInterfaceDeclaration | PropertyDeclaration,
        untilCollection?: boolean,
        otherType?: (node: DeclarationBase) => boolean): DeclarationBase {

        let dec;
        if (node instanceof PropertyDeclaration) {
            dec = this.scope.get(
                this.getPropertyBindingType(node))?.result;
        } else {
            dec = node;
        }

        if (!dec) {
            return node;
        }

        if (isBasicType(dec.name.name)) {
            return dec;
        }

        if (dec instanceof ClassOrInterfaceDeclaration &&
            untilCollection && this.isCollection(dec)) {
            if (dec.default) {
                return dec.default;
            } else {
                return dec;
            }
        }

        if (otherType && otherType(dec)) {
            return dec;
        }

        if (dec instanceof ClassOrInterfaceDeclaration &&
            dec.default) {
            return this.getFinalType(dec.default, untilCollection, otherType);
        }

        return node;
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
                case "excel.application":
                    return this.scope.get("Application", "Excel")?.result;
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

    checkConversion(func: CallExpression) {
        if (!(func.callee instanceof Identifier &&
            isConversionFunction(func.callee.name))) {
            return;
        }
        if (func.arguments.length !== 1) {
            return;
        }
        const argType = this.getExprType(func.arguments[0]);
        const funcDeclare = this.scope.get(func.callee.name)?.result;
        if (!funcDeclare ||
            !(funcDeclare instanceof FunctionDeclaration) ||
            !funcDeclare.returnType) {
            return;
        }
        if (argType === funcDeclare.returnType) {
            this.raiseAtNode(func, WarningMessages["RedundantTypeConvertion"], true);
        }
    }

    createSingleDeclaratorFromDeclaration(
        base: SingleVarDeclarator,
        valueType: string): SingleVarDeclarator {
        const node = new SingleVarDeclarator(this, base.start, base.loc.start);
        node.loc = base.loc;
        node.end = base.end;
        node.type = base.type;
        node.name = base.name;
        node.namespace = base.namespace;
        node.enumerable = base.enumerable;
        return node;
    }
}

