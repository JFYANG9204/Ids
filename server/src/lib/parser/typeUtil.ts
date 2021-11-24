import { BinopType } from "../tokenizer/type";
import {
    ArgumentDeclarator,
    ArrayDeclarator,
    AssignmentExpression,
    BinaryExpression,
    BindingDeclarator,
    CallExpression,
    ClassOrInterfaceDeclaration,
    ConstDeclarator,
    DeclarationBase,
    Expression,
    FunctionDeclaration,
    Identifier,
    LineMark,
    LogicalExpression,
    MacroDeclaration,
    MemberExpression,
    NamespaceDeclaration,
    NodeBase,
    PropertyDeclaration,
    SingleVarDeclarator,
    UnaryExpression,
} from "../types";
import { Position } from "../util";
import { isBasicType, isConversionFunction } from "../util/match";
import { BindTypes } from "../util/scope";
import { ErrorMessages, WarningMessages } from "./error-messages";
import { ErrorTemplate, ParsingError } from "./errors";
import { UtilParser } from "./util";

export interface TypeRaiseFunction {
    (node: NodeBase, template: ErrorTemplate, warning: boolean, ...params: any): ParsingError
}

export class TypeUtil extends UtilParser {

    needCheckLineMark: Identifier[] = [];

    includeRaiseFunctionStack: TypeRaiseFunction[] = [];
    updateFuncType?: (func: FunctionDeclaration) => void;
    updatedReturnTypeFunction = new Set<string>();

    enterIncludeRaiseFunction(func: TypeRaiseFunction) {
        this.includeRaiseFunctionStack.push(func);
    }

    exitIncludeRaiseFunction() {
        if (this.includeRaiseFunctionStack.length > 0) {
            this.includeRaiseFunctionStack.pop();
        }
    }

    get currentIncludeRaiseFunction() {
        if (this.includeRaiseFunctionStack.length === 0) {
            return undefined;
        }
        return this.includeRaiseFunctionStack[this.includeRaiseFunctionStack.length - 1];
    }

    raiseTypeError(node: NodeBase,
        template: ErrorTemplate,
        warning: boolean,
        ...params: any) {
        if (this.currentIncludeRaiseFunction) {
            this.currentIncludeRaiseFunction(node,
                template, warning, params);
        } else {
            this.raiseAtNode(node,
                template, warning, params);
        }
    }

    getVariant() {
        return this.scope.get("Variant")?.result;
    }

    maybeCopyType(dec: DeclarationBase) {
        if (dec instanceof SingleVarDeclarator) {
            return Object.assign({}, dec);
        }
        return dec;
    }

    /**
     * 对于可能是SingleDeclarator、ArrayDeclarator或ArgumentDeclarator的声明，
     * 返回其绑定类型，否则不做处理
     * @param dec
     * @returns
     */
    maybeDeclaratorBinding(dec: DeclarationBase) : DeclarationBase | undefined {
        if (dec instanceof SingleVarDeclarator ||
            dec instanceof ArrayDeclarator) {
            if (dec.bindingType) {
                return dec.bindingType;
            }
            if (typeof dec.binding === "string") {
                return this.scope.get(
                    dec.binding, dec.namespace)?.result;
            } else if (dec.binding) {
                return dec.binding;
            }
        } else if (dec instanceof ArgumentDeclarator) {
            return this.maybeDeclaratorBinding(dec.declarator);
        }
        return dec;
    }

    getMaybeDecaratorBindingName(dec: DeclarationBase) : string {
        if (dec instanceof ArgumentDeclarator) {
            return this.getMaybeDecaratorBindingName(dec.declarator);
        } else if (dec instanceof SingleVarDeclarator ||
            dec instanceof ArrayDeclarator) {
            let binding = this.maybeDeclaratorBinding(dec);
            if (!binding) {
                return "Variant";
            }
            return binding.name.name;
        }
        return dec.name.name;
    }

    getBindingTypeNameString(binding: BindingDeclarator | string) {
        return typeof binding === "string" ? binding :
            binding.name.name;
    }

    getPropertyBindingTypeString(prop: PropertyDeclaration) {
        return this.getBindingTypeNameString(prop.binding);
    }

    /**
     * 对于所有可能包含绑定类型的声明类型，返回其绑定的结果类型，
     * 支持在指定的命名空间中搜索
     * @param dec
     * @param namespace
     * @returns
     */
    getMaybeBindingType(dec?: DeclarationBase,
        namespace?: string | NamespaceDeclaration) {
        if (dec instanceof SingleVarDeclarator ||
            dec instanceof ArrayDeclarator) {
            return dec.bindingType ?? this.scope.get(
                this.getBindingTypeNameString(dec.binding),
                namespace)?.result;
        } else if (dec instanceof ConstDeclarator) {
            return dec.declarator.binding instanceof DeclarationBase ?
                dec.declarator.binding : this.scope.get(dec.declarator.binding)?.result;
        } else if (dec instanceof PropertyDeclaration) {
            let binding = this.getPropertyBindingTypeString(dec);
            if (isBasicType(binding)) {
                return this.scope.get(binding)?.result;
            }
            return this.scope.get(
                this.getPropertyBindingTypeString(dec),
                this.getDeclareNamespace(dec))?.result;
        }
        return dec;
    }

    getDeclareNamespace(dec: DeclarationBase): string | NamespaceDeclaration | undefined {
        if (dec instanceof PropertyDeclaration) {
            if (dec.binding instanceof BindingDeclarator &&
                dec.binding.namespace) {
                return dec.binding.namespace;
            }
            return dec.class.namespace;
        } else if (dec instanceof FunctionDeclaration && dec.class) {
            return dec.class.namespace;
        } else if (dec instanceof SingleVarDeclarator) {
            return typeof dec.binding !== "string" ?
                this.getDeclareNamespace(dec.binding) :
                (dec.bindingType ?
                    this.getDeclareNamespace(dec.bindingType) :
                    undefined);
        }
        return dec.namespace;
    }

    createBindingTypeFromDeclaration(dec: DeclarationBase): BindingDeclarator {
        const binding = new BindingDeclarator(this, 0, new Position(0, 0));
        if (dec instanceof ArrayDeclarator) {
            let id = new Identifier(this, 0, new Position(0, 0));
            id.name = "Array";
            binding.name = id;
            binding.generics = typeof dec.binding === "string" ?
                dec.binding : dec.binding.name.name;
        } else if (dec instanceof SingleVarDeclarator) {
            if (dec.bindingType) {
                binding.name = dec.bindingType.name;
            } else {
                if (typeof dec.binding === "string") {
                    let id = new Identifier(this, 0, new Position(0, 0));
                    id.name = dec.binding;
                    binding.name = id;
                } else {
                    return dec.binding;
                }
            }
        } else {
            binding.name = dec.name;
        }
        return binding;
    }

    /**
     * 判断是否是将派生类赋值给基类
     * @param base 被赋值参数或者左值类型
     * @param check 赋值类型
     * @param namespace 命名空间名
     */
    matchIfBaseClass(
        base: string,
        check: string,
        namespace?: string | NamespaceDeclaration) : boolean {

        if (base.toLowerCase() === check.toLowerCase()) {
            return true;
        }

        let derived = this.scope.get(check, namespace)?.result;
        if (!derived ||
            !(derived instanceof ClassOrInterfaceDeclaration)) {
            return false;
        }

        if (derived.implements.length === 0 &&
            base.toLowerCase() !== check.toLowerCase()) {
            return false;
        }

        for (const d of derived.implements) {
            if (d.toLowerCase() === check.toLowerCase()) {
                return true;
            }
            if (this.matchIfBaseClass(base, d, namespace)) {
                return true;
            }
        }

        return false;
    }

    matchType(
        base: string,
        check: string,
        node: NodeBase,
        isAssign: boolean = false,
        namespace?: string | NamespaceDeclaration) {

        let checkString = check.toLowerCase();
        let baseString = base.toLowerCase();
        let checkResult: boolean;

        if (checkString === "variant"   ||
            baseString  === "variant"   ||
            checkString === "iquestion" ||
            baseString  === "iquestion" || (
            baseString  === "enum"   && checkString === "long") || (
            baseString  === "double" && checkString === "long") || (
            baseString  === "date"   && checkString === "long") || (
            !isAssign && baseString === "long" && checkString === "double"
            )) {
            checkResult = true;
        } else if (this.matchIfBaseClass(base, check, namespace)) {
            return true;
        } else {
            checkResult = checkString === baseString;
        }
        if (!checkResult) {
            this.raiseTypeError(
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
        node: DeclarationBase) {
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
            this.raiseTypeError(
                line.id,
                ErrorMessages["LineMarkRedeclaration"],
                false,
                line.id.name
            );
        } else {
            this.state.lineMarks.set(line.id.name.toLowerCase(), line);
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
        if (this.needCheckLineMark.length === 0) {
            return;
        }
        for (let i = this.needCheckLineMark.length - 1;
            i >= 0; i--) {
            if (id.name.toLowerCase() ===
                this.needCheckLineMark[i].name.toLowerCase()) {
                this.needCheckLineMark.splice(i, 1);
            }
        }
    }

    checkVarDeclared(name: string, node: NodeBase) {
        let find = this.scope.get(name)?.result;
        if (!find) {
            if (!this.scope.inFunction) {
                this.raiseTypeError(
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
                    this.raiseTypeError(
                        node,
                        ErrorMessages["ReadonlyPropertCannotBeLeft"],
                        false,
                        prop.name.name);
                }
                break;
            case "FunctionDeclaration":
                if (this.options.raiseTypeError) {
                    this.raiseTypeError(
                        node,
                        ErrorMessages["FunctionCannotBeLeft"],
                        false);
                }
                break;
            case "MacroDeclaration":
                if (this.options.raiseTypeError) {
                    this.raiseTypeError(
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
                if (!func.binding) {
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
                this.raiseTypeError(
                    node,
                    ErrorMessages["UnmatchedIndexType"],
                    false,
                    type);
        }
    }

    needReturn(expr: Expression) {
        if (this.options.raiseTypeError &&
            !this.scope.inFunction) {
            this.raiseTypeError(
                expr,
                ErrorMessages["ExpressionNeedReturn"],
                false);
        }
    }

    needCollection(expr: Expression) {
        if (this.options.raiseTypeError &&
            !this.scope.inFunction) {
            this.raiseTypeError(
                expr,
                ErrorMessages["PropertyOrObjectIsNotCollection"],
                false);
        }
    }

    undefined(node: NodeBase, name: string, isFunction?: boolean) {
        if (this.options.raiseTypeError &&
            !this.scope.inFunction) {
            this.raiseTypeError(
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
        findType?: { type: DeclarationBase | undefined },
        raiseError: boolean = true) {
        let type: string | undefined;
        let find: DeclarationBase | undefined;
        switch (expr.type) {

            case "StringLiteral":
                find = this.scope.get("String")?.result;
                type = "String";
                break;
            case "NumericLiteral":
                find = this.scope.get("Long")?.result;
                type = "Long";
                break;
            case "DecimalLiteral":
                find = this.scope.get("Double")?.result;
                type = "Double";
                break;
            case "BooleanLiteral":
                find = this.scope.get("Boolean")?.result;
                type = "Boolean";
                break;
            case "CategoricalLiteral":
                find = this.scope.get("Categorical")?.result;
                type = "Categorical";
                break;
            case "NullLiteral":
                find = this.scope.get("Null")?.result;
                type = "Null";
                break;

            case "Identifier":
                find = this.getIdentifierType(expr as Identifier, raiseError);
                break;
            case "MemberExpression":
                find = this.getMemberType(expr as MemberExpression, raiseError);
                break;
            case "CallExpression":
                find = this.getCallExprType(expr as CallExpression, raiseError);
                break;
            case "UnaryExpression":
                this.checkExprError((expr as UnaryExpression).argument);
                find = this.scope.get("Boolean")?.result;
                break;
            case "BinaryExpression":
                find = this.getBinaryExprType(expr as BinaryExpression, raiseError);
                break;
            case "AssignmentExpression":
                find = this.getAssignExprType(expr as AssignmentExpression, raiseError);
                break;

            default:
                break;
        }
        if (findType) {
            findType.type = find;
        }
        if (!type) {
            type = this.getDeclareBaseType(expr, find);
        }
        return type ?? "Variant";
    }

    getDeclareBaseType(node: NodeBase, dec?: DeclarationBase): string | undefined {
        if (!dec) {
            return undefined;
        }
        switch (dec.type) {
            case "MacroDeclaration":
                const macro = dec as MacroDeclaration;
                if (!macro.init) {
                    this.raiseTypeError(
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

            case "ConstDeclarator":
                return this.getDeclareBaseType((dec as ConstDeclarator).declarator);

            case "ArrayDeclarator":
                return "Array";

            case "PropertyDeclaration":
                return this.getPropertyBindingTypeString(dec as PropertyDeclaration);

            case "EnumDeclaration":
                return "Enum";

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

    getBinaryExprType(expr: BinaryExpression, raiseError = true): DeclarationBase | undefined {
        let leftReturn: { type: DeclarationBase | undefined } = { type: undefined };
        let rightReturn: { type: DeclarationBase | undefined } = { type: undefined };
        let left = this.getExprType(expr.left, leftReturn, raiseError);
        let right = this.getExprType(expr.right, rightReturn, raiseError);
        //
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
        if (expr.operator.binop === BinopType.logical     ||
            expr.operator.binop === BinopType.realational ||
            expr.operator.label === "=") {
            return this.scope.get("Boolean")?.result;
        }
        //
        let final;
        if (leftReturn.type instanceof ClassOrInterfaceDeclaration ||
            leftReturn.type instanceof PropertyDeclaration) {
            final = this.getFinalType(leftReturn.type);
            if (final instanceof PropertyDeclaration) {
                left = this.getPropertyBindingTypeString(final);
            } else {
                left = final.name.name;
            }
        }
        //
        let nsName: string | NamespaceDeclaration | undefined;
        if (rightReturn.type instanceof ClassOrInterfaceDeclaration ||
            rightReturn.type instanceof PropertyDeclaration) {
            final = this.getFinalType(rightReturn.type);
            if (final instanceof PropertyDeclaration) {
                right = this.getPropertyBindingTypeString(final);
                nsName = final.class.namespace;
            } else {
                right = final.name.name;
                nsName = final.namespace;
            }
        }
        //
        if (this.matchType(left, right, expr.right, false, nsName)) {
            let namespace = this.getDeclareNamespace(rightReturn.type);
            return left.toLowerCase() === "variant" ?
                this.maybeDeclaratorBinding(rightReturn.type) :
                this.getMaybeBindingType(
                    leftReturn.type, namespace);
        } else {
            return this.getVariant();
        }
    }

    getAssignExprType(expr: AssignmentExpression, raiseError = true) {
        let left;
        let rightType: { type: DeclarationBase | undefined } = { type: undefined };
        let right = this.getExprType(expr.right, rightType, raiseError);
        if (!rightType.type) {
            if (raiseError) {
                this.needReturn(expr.right);
            }
            return this.getVariant();
        }
        if (expr.left instanceof Identifier) {
            const leftResult = this.scope.get(expr.left.name, undefined);
            left = leftResult?.result;
            if (leftResult?.type === BindTypes.const) {
                if (raiseError) {
                    this.raiseTypeError(
                        expr.left,
                        ErrorMessages["ConstVarCannotBeAssigned"],
                        false);
                }
            } else if (left) {
                // 考虑到可能的可迭代Collection赋值，
                // 右值如果为Identifier，直接将右值类型更新给左值，
                // 否则，将绑定类型更新给左值。
                let update;
                if (expr.right instanceof Identifier) {
                    update = rightType.type;
                } else {
                    update = this.maybeDeclaratorBinding(rightType.type) ?? rightType.type;
                }
                this.scope.update(
                    expr.left.name,
                    BindTypes.var,
                    this.createBindingTypeFromDeclaration(update),
                    expr);
            } else {
                if (raiseError) {
                    this.undefined(expr.left, expr.left.name);
                }
                this.scope.declareUndefined(
                    expr.left,
                    rightType.type);
            }
            if (left) {
                this.addExtra(expr.left, "declaration", left);
            }
        } else {
            let leftType: { type: DeclarationBase | undefined } = { type: undefined };
            left = this.getExprType(expr.left, leftType, raiseError);
            if (leftType.type) {
                this.checkAssignmentLeft(leftType.type, expr.left);
            }
            if (expr.left instanceof MemberExpression &&
                expr.left.object.type === "Identifier" &&
                expr.left.property.type !== "Identifier") {
                this.scope.updateGeneric((expr.left.object as Identifier).name, right);
            }
        }

        return rightType.type;
    }

    getIdentifierType(
        id: Identifier,
        raiseError = true,
        isFunction: boolean = false) {

        const name = id.name;
        let find = this.scope.get(name, undefined, isFunction)?.result;
        if (find) {
            if (find instanceof FunctionDeclaration &&
                !find.declare &&
                !this.updatedReturnTypeFunction.has(find.name.name.toLowerCase()) &&
                this.updateFuncType) {
                this.updateFuncType(find);
            }
            this.addExtra(id, "declaration", this.maybeCopyType(find));
            return find;
        } else {
            let isFunction = false;
            if (id.treeParent instanceof CallExpression &&
                id.treeParent.callee === id) {
                isFunction = true;
            }
            let undef = this.scope.getUndefined(name);
            if (undef) {
                if (raiseError) {
                    this.undefined(id, id.name, isFunction);
                }
                return undef;
            }
            if (this.options.treatUnkownAsQuesion &&
                !isFunction) {
                let question = this.scope.get("IQuestion")?.result;
                this.scope.declareUndefined(id);
                this.addExtra(id, "declaration", question);
                return question;
            } else {
                if (raiseError) {
                    this.undefined(id, id.name, isFunction);
                }
            }
        }
        return find;
    }

    getMemberObjectType(member: MemberExpression, raiseError = true): DeclarationBase | undefined {
        const obj = member.object;
        switch (obj.type) {
            case "Identifier":
                const type = this.getIdentifierType(obj as Identifier, raiseError);
                if (type?.type === "SingleVarDeclarator") {
                    const single = type as SingleVarDeclarator;
                    return single.bindingType ??
                        this.scope.get(this.getBindingTypeNameString(single.binding))?.result;
                }
                return type;
            case "MemberExpression":
                return this.getMemberType(obj as MemberExpression, raiseError);
            case "CallExpression":
                return this.getCallExprType(obj as CallExpression, raiseError);
            case "Expression":
                return this.scope.currentScope().currentHeader;
            default:
                return this.getVariant();
        }
    }

    getMemberPropertyType(
        member: MemberExpression,
        obj?: DeclarationBase,
        raiseError = true): DeclarationBase | undefined {
        if (!obj) {
            return this.getVariant();
        }
        if ((obj.type !== "ClassOrInterfaceDeclaration") &&
            (obj.type !== "PropertyDeclaration")         &&
            (obj.type !== "ArrayDeclarator")) {
            if (!this.scope.inFunction &&
                this.options.raiseTypeError &&
                raiseError) {
                this.raiseTypeError(
                    member.object,
                    ErrorMessages["MissingParenObject"],
                    true,
                );
            }
            return this.getVariant();
        }
        let prop = member.property;
        // Object.Member
        if (prop.type === "Identifier" && !member.computed) {
            let parent: DeclarationBase | undefined = obj;
            let child: DeclarationBase | undefined;
            if (obj.type === "PropertyDeclaration") {
                const objReturn = this.getPropertyBindingTypeString(obj as PropertyDeclaration);
                const objProp = obj as PropertyDeclaration;
                parent = this.scope.get(objReturn,
                    typeof objProp.class.namespace === "string" ? objProp.namespace :
                    objProp.class.namespace?.name.name)?.result;
            } else if (obj.type === "ArrayDeclarator") {
                parent = this.scope.get("Array")?.result;
            }
            if (parent && parent.type === "ClassOrInterfaceDeclaration") {
                child = this.getPropertyOrMethod(
                    (prop as Identifier).name,
                    (parent as ClassOrInterfaceDeclaration));
            }
            if (!child) {
                if (!this.scope.inFunction &&
                    this.options.raiseTypeError &&
                    raiseError) {
                    this.raiseTypeError(
                        prop,
                        ErrorMessages["MissingProperty"],
                        false,
                        (prop as Identifier).name
                    );
                }
                return this.getVariant();
            }
            return child;
        }
        // Object.Member[Index]
        let memberDec;
        let needParam;
        let isCategorical = false;
        let exprType = this.getExprType(member.property, undefined, raiseError);
        if (obj.type === "PropertyDeclaration") {
            memberDec = obj as PropertyDeclaration;
            if (memberDec.params.length === 0) {
                let search = this.scope.get(
                    this.getPropertyBindingTypeString(memberDec),
                    memberDec.class.namespace)?.result;
                if ((!search ||
                    search.type !== "ClassOrInterfaceDeclaration") &&
                    raiseError) {
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
        } else if (obj.type === "ClassOrInterfaceDeclaration" &&
            obj.name.name === "Categorical") {
            memberDec = obj;
            isCategorical = true;
        } else if (obj.type === "ArrayDeclarator") {
            memberDec = this.scope.get("Array")?.result;
            if (!memberDec) {
                return this.getVariant();
            }
        } else {
            memberDec = this.getFinalType(
                obj as ClassOrInterfaceDeclaration, true);
            if (memberDec.type === "ClassOrInterfaceDeclaration" &&
                !this.isCollection(memberDec as ClassOrInterfaceDeclaration) &&
                raiseError) {
                this.raiseIndexError(member.property, exprType);
                return this.getVariant();
            }
        }
        if (memberDec instanceof PropertyDeclaration &&
            memberDec.params.length === 0) {
            if (raiseError) {
                this.raiseIndexError(member.property, exprType);
            }
        } else if (memberDec instanceof PropertyDeclaration) {
            needParam = this.getBindingTypeNameString(memberDec.params[0].declarator.binding);
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
        if (memberDec.name.name === "Array") {
            const arr = obj as ArrayDeclarator;
            return arr.bindingType ?? this.scope.get(this.getBindingTypeNameString(arr.binding))?.result;
        }
        if (isCategorical) {
            return this.getVariant();
        }
        return memberDec;
    }

    getMemberType(member: MemberExpression, raiseError = true): DeclarationBase | undefined {
        const obj = this.getMemberObjectType(member, raiseError);
        const type = this.getMemberPropertyType(member, obj, raiseError);
        this.addExtra(member, "declaration", this.getMaybeBindingType(type));
        if (!member.property.extra["declaration"]) {
            this.addExtra(member.property, "declaration", type);
        }
        return type;
    }

    getPropertyOrMethod(name: string, node: ClassOrInterfaceDeclaration) {
        const lowerName = name.toLowerCase();
        return node.properties.get(lowerName) ||
            node.methods.get(lowerName) || node.constants.get(lowerName);
    }

    getCallExprType(callExpr: CallExpression, raiseError = true) {
        const callee = callExpr.callee;
        let objType: DeclarationBase | undefined;
        if (callee.type === "Identifier") {
            objType = this.getIdentifierType(
                callee as Identifier,
                raiseError,
                true);
        } else {
            objType = this.getMemberType(callee as MemberExpression, raiseError);
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
            if (!this.scope.inFunction && this.options.raiseTypeError &&
                        raiseError) {
                this.raiseTypeError(
                    callee.type === "Identifier" ?
                    callee : (callee as MemberExpression).property,
                    ErrorMessages["UnknownFunction"],
                    false,
                    funcName);
            }
            return this.getVariant();
        } else if (objType.type !== "FunctionDeclaration") {
            if (!this.scope.inFunction && this.options.raiseTypeError &&
                raiseError) {
                this.raiseTypeError(
                    callee.type === "Identifier" ?
                    callee : (callee as MemberExpression).property,
                    ErrorMessages["IdentifierIsNotFunction"],
                    false,
                    funcName);
            }
            return this.getVariant();
        }

        this.checkFunctionParams(callExpr, objType as FunctionDeclaration);

        const func = objType as FunctionDeclaration;
        if (func.binding) {
            let returnType = this.scope.get(
                typeof func.binding === "string" ?
                func.binding :
                func.binding.name.name,
                (typeof func.binding === "string" ?
                undefined :
                func.binding.namespace) ??
                func.class?.namespace)?.result;
            this.addExtra(func, "declaration", returnType);
            return returnType;
        } else {
            return undefined;
        }
    }

    checkFunctionParams(callExpr: CallExpression, func: FunctionDeclaration) {
        let cur: ArgumentDeclarator | undefined;
        let index = 0;
        let nece = "";
        const params = callExpr.arguments;
        const args = func.params;
        let ns;
        for (const param of params) {
            const paramType = this.getExprType(param);
            if (index < args.length) {
                const arg = args[index];
                ns = arg.declarator.namespace ?? func.class?.namespace;
                if (arg.paramArray) {
                    cur = arg;
                }
                let typeName = this.getBindingTypeNameString(arg.declarator.binding);
                if (this.scope.get(typeName,
                    this.getDeclareNamespace(func))?.result?.type === "EnumDeclaration") {
                    typeName = "Enum";
                }
                this.matchType(typeName,
                    paramType, param, true, ns);
            } else if (cur) {
                ns = cur.declarator.namespace ?? func.class?.namespace;
                this.matchType(this.getBindingTypeNameString(cur.declarator.binding),
                    paramType, param, true, ns);
            }
            index++;
        }
        if (index < args.length - 1) {
            for (let i = index + 1; i < args.length; ++i) {
                const arg = args[i];
                if (!arg.optional) {
                    if (nece === "") {
                        nece = arg.declarator.name.name;
                    } else {
                        nece += "," + arg.declarator.name.name;
                    }
                }
            }
        }
        if (args.length < params.length && !cur &&
            !this.scope.inFunction && this.options.raiseTypeError) {
            this.raiseTypeError(callExpr,
                ErrorMessages["IncorrectFunctionArgumentNumber"],
                false,
                func.name.name,
                args.length.toString(),
                params.length.toString());
        }
        if (nece !== "" &&
            !this.scope.inFunction &&
            this.options.raiseTypeError) {
            this.raiseTypeError(callExpr,
                ErrorMessages["ArgumentIsNotOptional"],
                false,
                nece);
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
                this.getPropertyBindingTypeString(prop),
                this.getDeclareNamespace(prop))?.result;
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
                this.getPropertyBindingTypeString(def.default) : undefined;
            if (name) {
                let find = this.scope.get(name, def.namespace)?.result;
                if (element && find) {
                    if (this.scope.get(element.name)) {
                        this.scope.update(
                            element.name,
                            BindTypes.var,
                            find, element);
                    } else {
                        find = this.scope.declareUndefined(element, find);
                    }
                    this.addExtra(element,
                        "declaration",
                        this.scope.get(element.name)?.result);
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
                this.getPropertyBindingTypeString(node))?.result;
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
                case "mdm.document":
                    return this.scope.get("IDocument", "MDMLib")?.result;
                case "scripting.dictionary":
                    return this.scope.get("Dictionary")?.result;
                case "scripting.filesystemobject":
                    return this.scope.get("FileSystemObject")?.result;
                case "excel.application":
                    return this.scope.get("Application", "Excel")?.result;
                default:
                    if (this.options.raiseTypeError && !this.scope.inFunction) {
                        this.raiseTypeError(
                            func.arguments[0],
                            ErrorMessages["InvalidObjectScripting"],
                            false);
                    }
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
            !funcDeclare.binding) {
            return;
        }
        if (argType === funcDeclare.binding && !this.options.raiseTypeError &&
            !this.scope.inFunction) {
            this.raiseTypeError(func, WarningMessages["RedundantTypeConvertion"], true);
        }
    }

}

