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
    MetadataBase,
    MetadataLoopVariableBase,
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
import { ErrorTemplate } from "./errors";
import { UtilParser } from "./util";

export interface TypeRaiseFunction {
    (node: NodeBase, template: ErrorTemplate, warning: boolean, ...params: any) : void
}

export function createTypeRaiseFunction(parser: TypeUtil) : TypeRaiseFunction {
    return (node, template, warning, ...params) => {
        if (node.loc.fileName.toLowerCase().endsWith(".d.mrs")) {
            return;
        }

        if (parser.currentIncludeRaiseFunction) {
            parser.currentIncludeRaiseFunction(node,
                template, warning, ...params);
        } else {
            parser.raiseAtLocation(node.start,
                node.end,
                template, warning, ...params);
        }
    };
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

    isArgumentDeclarator(dec: DeclarationBase) {
        if (dec.treeParent?.type === "ArgumentDeclarator") {
            return true;
        }
        return false;
    }

    checkLeadingCommentOption(node: NodeBase, text: string) {
        let reg = new RegExp(text, "i");
        for (let i = 0; i < node.leadingComments.length; ++i) {
            if (reg.test(node.leadingComments[i].value)) {
                return true;
            }
        }
        return false;
    }

    raiseTypeError(node: NodeBase,
        template: ErrorTemplate,
        warning: boolean,
        ...params: any) {

        if (node.loc.fileName.toLowerCase().endsWith(".d.mrs")) {
            return;
        }

        if (!this.options.raiseTypeError) {
            return;
        }

        if (this.checkLeadingCommentOption(node, "ignore-type-error")) {
            return;
        }

        let parent = node.treeParent;
        while (parent) {
            if (this.checkLeadingCommentOption(parent, "ignore-type-error")) {
                return;
            }
            parent = parent.treeParent;
        }

        if (this.currentIncludeRaiseFunction) {
           this.currentIncludeRaiseFunction(node,
                template, warning, ...params);
        } else {
            this.raiseAtLocation(node.start,
                node.end,
                template, warning, ...params);
        }
    }

    getVariant() {
        return this.scope.get("Variant")?.result;
    }

    maybeCopyType(dec: DeclarationBase) {
        if (dec instanceof SingleVarDeclarator &&
            !this.isArgumentDeclarator(dec)) {
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
            if (dec.name.name === "Categorical") {
                binding.generics = "Variant";
            }
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
        namespace?: string | NamespaceDeclaration,
        raiseError = true) {

        let checkString = check.toLowerCase();
        let baseString = base.toLowerCase();
        let checkResult: boolean;

        if (checkString === "variant" || baseString === "variant" || checkString === "null") {
            return true;
        }

        if (checkString === "imdmfield" ||
            baseString  === "imdmfield" || (
            baseString  === "enum"    && checkString === "long") || (
            baseString  === "double"  && checkString === "long") || (
            baseString  === "date"    && checkString === "long") || (
            baseString  === "boolean" && checkString === "long" ) || (
            !isAssign && baseString === "long" && checkString === "double"
            )) {
            checkResult = true;
        } else if (this.matchIfBaseClass(base, check, namespace)) {
            return true;
        } else {
            checkResult = checkString === baseString;
        }
        if (!checkResult && raiseError) {
            this.raiseTypeError(
                node,
                ErrorMessages["UnmatchedVarType"],
                false,
                check,
                base);
        }
        return checkResult;
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

    isUndefined(node: NodeBase, name: string, isFunction?: boolean) {
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
            case "LogicalExpression":
                find = this.getLogicalExprType(expr as LogicalExpression);
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

        this.guessMaybeArgumentTypeByBinaryExpr(expr, left, right);
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
        if (this.matchType(left, right, expr.right, false, nsName, false)) {
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
                left?.referenced.push(expr.left);
            } else if (left) {
                left.referenced.push(expr.left);
                // 考虑到可能的可迭代Collection赋值，
                // 右值如果为Identifier，直接将右值类型更新给左值，
                // 否则，将绑定类型更新给左值。
                let update;
                if (expr.right instanceof Identifier) {
                    update = rightType.type;
                } else {
                    update = this.getMaybeBindingType(rightType.type) ?? rightType.type;
                }
                // 检查是否为null，如果为null，不更新类型
                if (update.name.name.toLowerCase() !== "null") {
                    this.scope.update(
                        expr.left.name,
                        BindTypes.var,
                        this.createBindingTypeFromDeclaration(update),
                        expr);
                }
            } else {
                if (raiseError) {
                    this.isUndefined(expr.left, expr.left.name);
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
            find.referenced.push(id);
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
                    this.isUndefined(id, id.name, isFunction);
                }
                return undef;
            }
            if (this.options.treatUnkownAsQuesion &&
                !isFunction &&
                this.scope.inSpecialEvent("OnNextCase")) {
                let declared = this.scope.declareUndefined(id);
                this.addExtra(id, "declaration", declared);
                return declared;
            } else {
                if (raiseError) {
                    this.isUndefined(id, id.name, isFunction);
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
                        this.scope.get(
                            this.getBindingTypeNameString(single.binding),
                            this.getDeclareNamespace(single))?.result;
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
        raiseError = true,
        checkCallByDot?: { isCallByDot: boolean }): DeclarationBase | undefined {
        if (!obj) {
            return this.getVariant();
        }

        let objType = obj;
        let originMetadata: MetadataBase | undefined;

        if (obj instanceof MetadataBase) {
            let mdmField = this.scope.get("IMDMField", "MDMLib")?.result;
            if (mdmField) {
                objType = mdmField;
            }
            originMetadata = obj;
        }

        //if (obj.name.name === "Variant" && member.property instanceof Identifier) {
        //    let guess = this.guessMemberObjectTypeByPropName(member.property.name);
        //    if (guess?.class) {
        //        objType = guess.class;
        //        this.addExtra(member.object, "declaration", objType);
        //        if (member.object instanceof Identifier) {
        //            let curObj = this.scope.get(member.object.name)?.result;
        //            if (curObj && this.isArgumentDeclarator(curObj) &&
        //                curObj instanceof SingleVarDeclarator) {
        //                curObj.binding = objType.name.name;
        //                curObj.bindingType = objType;
        //            }
        //        }
        //    }
        //}

        if ((objType.type !== "ClassOrInterfaceDeclaration") &&
            (objType.type !== "PropertyDeclaration")         &&
            (objType.type !== "ArrayDeclarator")) {
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
            let maybeBinding = this.getMaybeBindingType(objType);
            if (maybeBinding) {
                objType = maybeBinding;
            }
            let parent: DeclarationBase | undefined = objType;
            let child: DeclarationBase | undefined;
            if (objType.type === "PropertyDeclaration") {
                const objReturn = this.getPropertyBindingTypeString(objType as PropertyDeclaration);
                const objProp = objType as PropertyDeclaration;
                parent = this.scope.get(objReturn,
                    typeof objProp.class.namespace === "string" ? objProp.namespace :
                    objProp.class.namespace?.name.name)?.result;
            } else if (objType.type === "ArrayDeclarator") {
                parent = this.scope.get("Array")?.result;
            }
            if (parent && parent.type === "ClassOrInterfaceDeclaration") {
                child = this.getPropertyOrMethod(
                    (prop as Identifier).name,
                    (parent as ClassOrInterfaceDeclaration));
            }
            if (!child) {

                // 判断是否为'.'调用的函数，需要父级对象为callee或者CallExpression
                if (prop.treeParent?.type === "CallExpression" ||
                    prop.treeParent?.treeParent?.type === "CallExpression") {
                    let maybeFunc = this.scope.get((prop as Identifier).name, undefined, true);
                    if (maybeFunc?.result) {
                        if (checkCallByDot) {
                            checkCallByDot.isCallByDot = true;
                        }
                        return maybeFunc.result;
                    }
                }

                // 判断是否为MDMField
                if (parent && parent.name.name === "IMDMField") {
                    if (originMetadata) {
                        if (originMetadata instanceof MetadataLoopVariableBase) {
                            let column = originMetadata.fields.get((prop as Identifier).name.toLowerCase());
                            if (!column) {
                                this.raiseTypeError(prop,
                                    WarningMessages["MissingMetadataField"],
                                    true,
                                    (prop as Identifier).name);
                            }
                        }
                    } else {
                        let existUndefined = this.scope.getUndefined((prop as Identifier).name);
                        if (!existUndefined) {
                            existUndefined = this.scope.declareUndefined(
                                (prop as Identifier),
                                this.scope.get("IMDMField", "MDMLib")?.result);
                        }
                        return existUndefined;
                    }
                    return this.scope.get("IMDMField", "MDMLib")?.result;
                }

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
        if (objType.type === "PropertyDeclaration") {
            memberDec = objType as PropertyDeclaration;
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
        } else if (objType.type === "ClassOrInterfaceDeclaration" &&
            objType.name.name === "IMDMField") {
            memberDec = this.scope.get("IMDMField", "MDMLib")?.result;
            if (!memberDec) {
                return this.getVariant();
            }
        } else if (objType.type === "ClassOrInterfaceDeclaration" &&
            objType.name.name === "Categorical") {
            memberDec = objType;
            isCategorical = true;
        } else if (objType.type === "ArrayDeclarator") {
            memberDec = this.scope.get("Array")?.result;
            if (!memberDec) {
                return this.getVariant();
            }
        } else {
            memberDec = this.getFinalType(
                objType as ClassOrInterfaceDeclaration, true);
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
            const arr = objType as ArrayDeclarator;
            return arr.bindingType ?? this.scope.get(this.getBindingTypeNameString(arr.binding))?.result;
        }
        if (isCategorical) {
            return this.getVariant();
        }
        return memberDec;
    }

    getMemberType(member: MemberExpression, raiseError = true, callByDot?: { isCallByDot: boolean }): DeclarationBase | undefined {
        const obj = this.getMemberObjectType(member, raiseError);
        const type = this.getMemberPropertyType(member, obj, raiseError, callByDot);
        this.addExtra(member, "declaration", this.getMaybeBindingType(type));
        if (callByDot?.isCallByDot) {
            this.addExtra(member, "callByDot", true);
        }
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
        let callByDot: { isCallByDot: boolean } = { isCallByDot: false };
        if (callee.type === "Identifier") {
            objType = this.getIdentifierType(
                callee as Identifier,
                raiseError,
                true);
        } else {
            objType = this.getMemberType(callee as MemberExpression, raiseError, callByDot);
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

        this.checkFunctionParams(callExpr, objType as FunctionDeclaration, callByDot.isCallByDot);

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
            this.addExtra(callExpr, "declaration", returnType);
            return returnType;
        } else {
            return undefined;
        }
    }

    checkFunctionParams(callExpr: CallExpression, func: FunctionDeclaration, callByDot?: boolean) {
        let cur: ArgumentDeclarator | undefined;
        let index = 0;
        let nece = "";
        let params = callExpr.arguments;
        let args = func.params;
        if (callByDot && func.params.length > 0) {
            args = func.params.slice(1);
        }
        let ns;
        for (const param of params) {
            let paramType = this.getExprType(param);
            if (index < args.length) {
                const arg = args[index];
                ns = arg.declarator.namespace ?? func.class?.namespace;
                if (arg.paramArray) {
                    cur = arg;
                }
                let typeName = this.getBindingTypeNameString(arg.declarator.binding);
                this.guessMaybeArgumentTypeByCaller(typeName, param);
                if (this.scope.get(typeName,
                    this.getDeclareNamespace(func))?.result?.type === "EnumDeclaration") {
                    typeName = "Enum";
                }
                this.matchType(typeName,
                    paramType, param, true, ns);
            } else if (cur) {
                ns = cur.declarator.namespace ?? func.class?.namespace;
                let typeName = this.getBindingTypeNameString(cur.declarator.binding);
                this.guessMaybeArgumentTypeByCaller(typeName, param);
                this.matchType(typeName,
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
        const def = final as ClassOrInterfaceDeclaration;
        let name: string | undefined =
            def.default ?
            this.getPropertyBindingTypeString(def.default) : undefined;

        let namespace = def.namespace;
        if (!name) {
            name = "Variant";
            namespace = undefined;
        }

        let find = this.scope.get(name, namespace)?.result;
        if (element) {
            if (find) {
                if (this.scope.get(element.name)) {
                    this.scope.update(
                        element.name,
                        BindTypes.var,
                        find, element);
                } else {
                    find = this.scope.declareUndefined(element, find);
                }
            }
            this.addExtra(element,
                "declaration",
                this.scope.get(element.name)?.result);
        }
        return find;
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
                    return this.scope.get("Dictionary", "Scripting")?.result;
                case "scripting.filesystemobject":
                    return this.scope.get("FileSystemObject", "Scripting")?.result;
                case "excel.application":
                    return this.scope.get("Application", "Excel")?.result;
                case "wscript.shell":
                    return this.scope.get("WshShell", "WScript")?.result;
                case "vbscript.regexp":
                    return this.scope.get("RegExp", "VBScript")?.result;
                case "mroledb.datalinkhelper":
                    return this.scope.get("IDataLinkHelper", "MROLEDBLib")?.result;
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

    guessMaybeArgumentTypeByBinaryExpr(expr: BinaryExpression,
        left: string,
        right: string) {

        let find;
        let guess;

        let isArray = false;
        let arrDec;

        if (expr.left instanceof Identifier) {
            find = this.scope.get(expr.left.name)?.result;
            guess = right;
        } else if (expr.right instanceof Identifier) {
            find = this.scope.get(expr.right.name)?.result;
            guess = left;
        } else if (expr.left instanceof MemberExpression &&
            expr.left.object instanceof Identifier &&
            expr.left.computed) {
            isArray = true;
            arrDec = this.scope.get(expr.left.object.name)?.result;
        } else if (expr.right instanceof MemberExpression &&
            expr.right.object instanceof Identifier &&
            expr.right.computed) {
            isArray = true;
            arrDec = this.scope.get(expr.right.object.name)?.result;
        }

        if (guess && find &&
            this.isArgumentDeclarator(find)) {

            if (find instanceof SingleVarDeclarator &&
                guess.toLowerCase() !== "null") {
                find.binding = guess;
                find.bindingType = this.scope.get(guess)?.result;
            }

        }

        if (isArray && arrDec instanceof ArrayDeclarator &&
            guess && guess.toLowerCase() !== "null") {
            arrDec.binding = guess;
            arrDec.bindingType = this.scope.get(guess)?.result;
        }
    }

    guessMaybeArgumentTypeByCaller(needType: string, param: Expression) {

        if (!(param instanceof Identifier) ||
            needType.toLowerCase() === "null") {
            return;
        }

        let find = this.scope.get(param.name)?.result;

        if (!find || !this.isArgumentDeclarator(find)) {
            return;
        }

        if (find instanceof SingleVarDeclarator) {
            find.binding = needType;
            find.bindingType = this.scope.get(needType)?.result;
        }
    }

    searchPropertyOrMethodInNamespace(name: string, source: NamespaceDeclaration) {
        let find = source.body.get(name.toLowerCase());

        if (find) {
            return find;
        }

        for (const child of source.body.values()) {
            if (child instanceof ClassOrInterfaceDeclaration) {
                find = child.properties.get(name.toLowerCase()) ||
                    child.methods.get(name.toLowerCase());
                if (find) {
                    return find;
                }
            }
        }

        return undefined;
    }

    searchPropertyOrMethod(name: string,
        source: Map<string, ClassOrInterfaceDeclaration> | Map<string, NamespaceDeclaration>) {

        let find;
        for (const obj of source.values()) {
            if (obj instanceof NamespaceDeclaration) {
                find = this.searchPropertyOrMethodInNamespace(name, obj);
                if (find) {
                    return find;
                }
            }

            if (obj instanceof ClassOrInterfaceDeclaration) {
                find = obj.properties.get(name.toLowerCase()) ||
                    obj.methods.get(name.toLowerCase());
                if (find) {
                    return find;
                }
            }
        }

        return undefined;

    }

    guessMemberObjectTypeByPropName(propName: string) {
        let search = this.searchPropertyOrMethod(propName, this.scope.global.namespaces) ||
            this.searchPropertyOrMethod(propName, this.scope.global.classes);
        if (search) {
            let objClass;
            if (search instanceof PropertyDeclaration ||
                search instanceof FunctionDeclaration) {
                objClass = search.class;
            }
            return {
                class: objClass,
                child: search
            };
        }
        return undefined;
    }

    guessFunctionParamType(declarator: SingleVarDeclarator) {
        let name = declarator.name.name.toLowerCase();
        let definition = this.scope.get(name)?.result;
        if (definition) {
            if (definition instanceof SingleVarDeclarator) {
                declarator.binding = definition.binding;
                declarator.bindingType = definition.bindingType;
            }
        }
    }

}

