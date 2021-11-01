import { createArrayDefinition } from "../built-in/basic";
import {
    BasicTypeDefinitions,
    IDocumentDefinition,
    IQuestionDefinition,
    VbsDictionaryDefinition,
    VbsFsoDefinition,
} from "../built-in/built-ins";
import {
    AssignmentExpression,
    BinaryExpression,
    CallExpression,
    Expression,
    Identifier,
    LineMark,
    MemberExpression,
    NodeBase,
    PreDefineStatement,
} from "../types";
import {
    ArrayDefinition,
    DefinitionBase,
    FunctionDefinition,
    InterfaceDefinition,
    MacroDefinition,
    PropertyDefinition,
    ValueType,
    VariantDefinition,
} from "../util/definition";
import { Position } from "../util/location";
import { matchOneOfDefinitions } from "../util/match";
import { ErrorMessages, WarningMessages } from "./error-messages";
import { ErrorTemplate } from "./errors";
import { UtilParser } from "./util";

export class TypeUtil extends UtilParser {

    emptyExpression: Expression = new Expression(this, 0, new Position(0, 0));
    needCheckLineMark: Identifier[] = [];

    declareLocalVar(
        name: string,
        node: NodeBase,
        array?: ArrayDefinition,
        def?: DefinitionBase,
        isConst?: boolean) {
        let value: DefinitionBase;
        if (def) {
            value = def;
        } else if (array) {
            value = createArrayDefinition(
                name,
                false,
                isConst ?? false,
                array);
        } else {
            value = BasicTypeDefinitions.variant;
        }
        this.scope.currentScope().insert(name, node, value);
        if (this.scope.currentScope().isUndefine(name)) {
            this.scope.currentScope().unDefined.delete(name.toLowerCase());
        }
    }

    declareMacroVar(
        name: string,
        node: PreDefineStatement) {
        const def = new MacroDefinition({
            name: name,
            isReadonly: true,
            isConst: true,
            isCollection: false,
            section: this.scope.currentSection(),
            preMacroValue: node.init
        });
        this.addExtra(node, "definition", def);
        this.scope.currentScope().insert(name, node, def);
        if (this.scope.currentScope().isUndefine(name)) {
            this.scope.currentScope().unDefined.delete(name.toLowerCase());
        }
    }

    checkNewLineMark(line: LineMark) {
        if (this.state.getLineMark(line.id.name) &&
            this.options.raiseTypeError &&
            !this.scope.currentScope().isFunction) {
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

    getPropertyOrMethod(base: InterfaceDefinition, name: string): DefinitionBase | undefined {
        const method = base.getProperty(name);
        if (method) {
            return method;
        }
        return base.getMethod(name);
    }

    checkVarDeclared(
        name: string,
        node: NodeBase,
        raiseError?: boolean): boolean {
        let find;
        if ((find = this.scope.currentScope().get(name))) {
            if (!node.extra["definition"]) {
                this.addExtra(node, "definition", find);
            }
            return true;
        }
        if (raiseError &&
            this.options.raiseTypeError &&
            !this.scope.currentScope().isFunction) {
            this.raiseAtNode(
                node,
                ErrorMessages["VarIsNotDeclared"],
                false,
                name
            );
        }
        this.scope.currentScope().setUndef(name);
        return false;
    }

    getExprType(expr: Expression): DefinitionBase | undefined {
        switch (expr.type) {

            case "StringLiteral":
                this.addExtra(expr, "definition", BasicTypeDefinitions.string);
                return BasicTypeDefinitions.string;
            case "CategoricalLiteral":
                this.addExtra(expr, "definition", BasicTypeDefinitions.long);
                return BasicTypeDefinitions.categorical;
            case "NumericLiteral":
                this.addExtra(expr, "definition", BasicTypeDefinitions.long);
                return BasicTypeDefinitions.long;
            case "DecimalLiteral":
                this.addExtra(expr, "definition", BasicTypeDefinitions.double);
                return BasicTypeDefinitions.double;
            case "BooleanLiteral":
                this.addExtra(expr, "definition", BasicTypeDefinitions.boolean);
                return BasicTypeDefinitions.boolean;
            case "NullLiteral":
                this.addExtra(expr, "definition", BasicTypeDefinitions.null);
                return BasicTypeDefinitions.null;
            case "Identifier":
                return this.getIdentifierType(expr as Identifier);
            case "MemberExpression":
                return this.getMemberExprType(expr as MemberExpression);
            case "CallExpression":
                return this.getCallExprType(expr as CallExpression);
            case "BinaryExpression":
                return this.getBinaryExprType(expr as BinaryExpression);
            default:
                break;
        }
        return BasicTypeDefinitions.variant;
    }

    getIdentifierType(node: Identifier): DefinitionBase | undefined {
        let def = this.scope.currentScope().get(node.name);
        if (!def && this.options.treatUnkownAsQuesion) {
            def = IQuestionDefinition;
        } else if (!def && this.options.raiseTypeError &&
            !this.scope.currentScope().isFunction) {
            this.raiseAtNode(
                node,
                ErrorMessages["VarIsNotDeclared"],
                false,
                node.name
            );
        }
        this.addExtra(node, "definition", def);
        return def;
    }

    getMemberExprType(node: MemberExpression): DefinitionBase | undefined {
        const type = this.getMemberType(node);
        if (type instanceof PropertyDefinition) {
            this.addExtra(node, "definition", type?.return);
        } else {
            this.addExtra(node, "definition", type);
        }
        return type;
    }

    getCallExprType(node: CallExpression): DefinitionBase | undefined {
        let type;
        const funcName = this.getCalleeFuncionName(node);
        // [.]Object[[..].Sub].Method(Args..)
        if (node.callee instanceof MemberExpression) {
            const obj = this.getMemberObjectType(node.callee.object);
            if (!obj) {
                if (this.options.raiseTypeError && !this.scope.currentScope().isFunction) {
                    this.raiseAtNode(
                        node.callee,
                        ErrorMessages["MissingParenObject"],
                        false,
                    );
                }
                return;
            }
            if (obj instanceof InterfaceDefinition) {
                type = obj.getMethod(funcName);
                if (!type && obj === IQuestionDefinition) {
                    type = BasicTypeDefinitions.categorical.getMethod(funcName);
                }
            }
            if (obj instanceof PropertyDefinition &&
                obj.return instanceof InterfaceDefinition) {
                type = obj.return.getMethod(funcName);
            }
        // Function(Args...)
        } else if (node.callee instanceof Identifier) {
            if (node.callee.name.toLowerCase() === "createobject") {
                return this.getCreateObjectType(node);
            }
            type = this.scope.currentScope().get(node.callee.name);
        // .Method(Args...)
        } else {
            type = this.scope.currentScope().headerType;
        }
        if (!this.checkCalleeFunctionError(
            node.callee,
            funcName,
            type
        )) {
            return;
        }
        if (!type) {
            return;
        }
        if (!this.checkIfFunction(node.callee, type, this.getCalleeFuncionName(node))) {
            return;
        }
        const func = type as FunctionDefinition;
        this.checkCallExprArguments(node, func);
        this.checkConversion(node);
        this.addExtra(node.callee, "definition", func);
        this.addExtra(node, "definition", func.return);
        return func.return;
    }

    checkCallExprArguments(expr: CallExpression, base: FunctionDefinition) {
        const args = base.arguments;
        if (args.length > 0 && expr.arguments.length === 0) {
            let notOptional = "";
            args.forEach(arg => {
                if (!arg.isOptional) {
                    if (!notOptional) {
                        notOptional = arg.name;
                    } else {
                        notOptional += "," + arg.name;
                    }
                }
            });
            if (notOptional) {
                this.raiseAtLocation(
                    expr.end - 2,
                    expr.end,
                    ErrorMessages["ArgumentIsNotOptional"],
                    false,
                    notOptional
                );
            }
            return;
        }
        expr.arguments.forEach((arg, index) => {
            let argType = this.getExprType(arg) ?? BasicTypeDefinitions.variant;
            argType = argType.return && argType.return.name !== "PlaceHolder" ? argType.return : argType;
            if (index >= args.length && this.options.raiseTypeError &&
                !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    arg,
                    ErrorMessages["IncorrectFunctionArgumentNumber"],
                    false,
                    base.name,
                    args.length,
                    expr.arguments.length
                );
            } else if (arg.type === "PlaceHolder" &&
                !args[index].isOptional && this.options.raiseTypeError &&
                !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    arg,
                    ErrorMessages["ArgumentIsNotOptional"],
                    false,
                    args[index].name
                );
            } else if (!matchOneOfDefinitions(argType, args[index].type) &&
                this.options.raiseTypeError &&
                !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    arg,
                    ErrorMessages["UnmatchedVarType"],
                    false,
                    this.getDefinitionsText(argType),
                    this.getDefinitionsText(args[index].type)
                );
            }
        });
    }

    getCalleeFuncionName(expr: CallExpression) {
        const callee = expr.callee;
        if (callee instanceof MemberExpression) {
            return (callee.property as Identifier).name;
        } else {
            return (callee as Identifier).name;
        }
    }

    checkCalleeFunctionError(
        node: NodeBase,
        funcName: string,
        def?: DefinitionBase) {
        if (!def) {
            if (this.options.raiseTypeError && !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    node,
                    ErrorMessages["UnknownFunction"],
                    false,
                    funcName
                );
            }
            return false;
        }
        if (!(def instanceof FunctionDefinition)) {
            if (this.options.raiseTypeError && !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    node,
                    ErrorMessages["IdentifierIsNotFunction"],
                    false,
                    funcName
                );
            }
            return false;
        }
        return true;
    }

    getBinaryExprType(expr: BinaryExpression) {
        const left = this.getExprType(expr.left);
        if (left === IQuestionDefinition) {
            return BasicTypeDefinitions.variant;
        }
        const right = this.getExprType(expr.right);
        if (!matchOneOfDefinitions(left, right)) {
            return BasicTypeDefinitions.variant;
        }
        return left === BasicTypeDefinitions.variant ?
                right : left;
    }

    checkAssignmentType(expr: AssignmentExpression) {
        const left = this.getExprType(expr.left);
        const right = this.getExprType(expr.right);
        if (left === IQuestionDefinition) {
            return;
        }
        if (left?.isConst) {
            if (this.options.raiseTypeError &&
                !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    expr.left,
                    ErrorMessages["ConstVarCannotBeAssigned"],
                    false,
                );
            }
            return;
        }
        if (left?.isReadonly) {
            if (this.options.raiseTypeError &&
                !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    expr.left,
                    ErrorMessages["VarIsReadonly"],
                    false
                );
            }
            return;
        }
        if ((right?.defType === "interface" || right?.defType === "object") &&
            right !== BasicTypeDefinitions.string && right !== BasicTypeDefinitions.categorical) {
            if (this.options.raiseTypeError && !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    expr,
                    WarningMessages["AssignmentMaybeObject"],
                    true
                );
            }
        }
        if (right && expr.left instanceof Identifier) {
            this.scope.currentScope().updateType(expr.left.name, right);
        }
    }

    checkExprTypeError(expr: Expression) {
        switch (expr.type) {
            case "AssignmentExpression":
                this.checkAssignmentType(expr as AssignmentExpression);
                break;
            case "CallExpression":
                this.getCallExprType(expr as CallExpression);
                break;
            case "Identifier":
                this.getIdentifierType(expr as Identifier);
                break;
            case "MemberExpression":
                this.getMemberExprType(expr as MemberExpression);
                break;

            default:
                break;
        }
    }

    getMemberType(node: MemberExpression) {
        const type = this.getMemberObjectType(node.object);
        if (!type) {
            if (this.options.raiseTypeError && !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    node,
                    ErrorMessages["MissingParenObject"],
                    false
                );
            }
            return;
        }
        return this.getPropertyType(node, type);
    }

    getMemberObjectType(node: Expression) {
        let type;
        if (node instanceof Identifier) {
            const name = node.name;
            type = this.scope.currentScope().get(name);
            if (!type) {
                type = this.scope.currentScope().isUndefine(name);
                if (type && this.options.raiseTypeError && !this.scope.currentScope().isFunction) {
                    this.raiseAtNode(
                        node,
                        ErrorMessages["VarIsNotDeclared"],
                        false,
                        name);
                }
                if (!type &&
                    this.options.treatUnkownAsQuesion) {
                    type = IQuestionDefinition;
                }
            }
            this.addExtra(node, "definition", type);
        } else if (node instanceof MemberExpression) {
            type = this.getMemberExprType(node);
        } else if (node instanceof CallExpression) {
            type = this.getCallExprType(node);
        } else {
            type = this.scope.currentScope().headerType;
            this.addExtra(node, "definition", type);
        }
        return type;
    }

    getPropertyType(
        node: MemberExpression,
        base: DefinitionBase) {
        const prop = node.property;
        if (node.computed) {
            const collection = this.checkCollectionDefinition(node, base);
            if (collection) {
                return this.checkCollectionIndex(
                    node,
                    collection,
                    {
                        isQues: base === IQuestionDefinition ? true : false
                    });
            }
        } else {
            let propDef;
            if ((base instanceof PropertyDefinition) &&
                (base.return instanceof InterfaceDefinition)) {
                propDef = base.return.getProperty((prop as Identifier).name)?.return;
            } else if (!this.checkIfObjectOrInterface(prop as Identifier, base)) {
                return;
            } else {
                propDef = (base as InterfaceDefinition).getProperty((prop as Identifier).name);
            }
            if (!propDef) {
                if (base === IQuestionDefinition) {
                    return IQuestionDefinition;
                }
                if (this.options.raiseTypeError &&
                    !this.scope.currentScope().isFunction) {
                    this.raiseAtNode(
                        prop,
                        ErrorMessages["InterfaceOrObjectHasNoCorrectPropertyOrMethod"],
                        false,
                        base.name,
                        (prop as Identifier).name
                    );
                }
                return;
            }
            return propDef;
        }
    }

    checkIfObjectOrInterface(node: Identifier, base: DefinitionBase) {
        if (!(base instanceof InterfaceDefinition)) {
            if (this.options.raiseTypeError &&
                !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    node,
                    ErrorMessages["MissingProperty"],
                    false,
                    node.name);
            }
            return false;
        }
        return true;
    }

    checkIfFunction(node: Expression, base: DefinitionBase, funcName: string) {
        if (!(base instanceof FunctionDefinition)) {
            if (this.options.raiseTypeError &&
                !this.scope.currentScope().isFunction) {
                this.raiseAtNode(
                    node,
                    ErrorMessages["IdentifierIsNotFunction"],
                    false,
                    funcName
                );
            }
            return false;
        }
        return true;
    }

    checkCollectionIndex(
        node: MemberExpression,
        def: DefinitionBase,
        check: { isQues: boolean }) {
        const indexType = this.getExprType(node.property);
        if (check.isQues) {
            return IQuestionDefinition;
        }
        if (def.defType === "array" &&
            indexType !== BasicTypeDefinitions.long &&
            this.options.raiseTypeError &&
            !this.scope.currentScope().isFunction) {
            this.raiseAtNode(
                node.property,
                ErrorMessages["ArrayIndexTypeMustBeInteger"],
                false
            );
        }
        if (!(def instanceof VariantDefinition ||
            def instanceof PropertyDefinition)) {
            return undefined;
        }
        return def.return;
    }

    checkCollectionDefinition(
        node: NodeBase,
        base: DefinitionBase): DefinitionBase | undefined {
        const def = base;
        if (!def.isCollection) {
            if (!(def instanceof InterfaceDefinition && def.default)) {
                if (this.options.raiseTypeError &&
                    !this.scope.currentScope().isFunction) {
                    this.raiseAtNode(
                        node,
                        ErrorMessages["PropertyOrObjectIsNotCollection"],
                        false
                    );
                }
                return undefined;
            }
            if (def.default instanceof FunctionDefinition) {
                if (this.options.raiseTypeError &&
                    !this.scope.currentScope().isFunction) {
                    this.raiseAtNode(
                        node,
                        ErrorMessages["PropertyOrObjectIsNotCollection"],
                        false
                    );
                }
                return undefined;
            }
            if (def.default.isCollection) {
                return def.default;
            } else {
                return this.checkCollectionDefinition(node, def.default);
            }
        }
        return def;
    }

    createQuestionType(name: string): ValueType {
        return {
            label: name,
            defType: "object",
            definition: IQuestionDefinition,
        };
    }

    checkDefinition(
        node: NodeBase,
        def: DefinitionBase | undefined,
        type: DefinitionBase | DefinitionBase[] | undefined,
        template: ErrorTemplate
        ) {
        if (!matchOneOfDefinitions(def, type) &&
            this.options.raiseTypeError) {
            this.raiseAtNode(
                node,
                template,
                false,
                def?.name
            );
        }
    }

    getDefinitionsText(
        defs: DefinitionBase | DefinitionBase[]): string {
        if (defs instanceof Array) {
            const arr: string[] = [];
            defs.forEach(def => arr.push(this.getDefinitionsText(def)));
            return arr.join(" | ");
        } else {
            switch (defs) {
                case BasicTypeDefinitions.variant:
                    if (defs.defType === "array") {
                        let arrBound = "";
                        let bound = (defs as VariantDefinition).dimensions;
                        while (bound > 0) {
                            arrBound += "[]";
                            bound--;
                        }
                        return defs.name + arrBound;
                    }
                    return "Variant";

                default:
                    return defs.name;
            }
        }
    }

    getCreateObjectType(expr: CallExpression) {
        const arg = expr.arguments[0];
        if (arg.type === "StringLiteral") {
            const script = arg.extra["rawValue"] as string;
            switch (script.toLowerCase()) {
                case "scripting.dictionary":
                    return VbsDictionaryDefinition;
                case "scripting.filesystemobject":
                    return VbsFsoDefinition;
                case "tom.document":
                    return IDocumentDefinition;
                default:
                    this.raiseAtNode(
                        arg,
                        ErrorMessages["InvalidObjectScripting"],
                        false
                    );
                    break;
            }
        }
    }

    checkIfConversionFunction(node: CallExpression) {
        if (node.callee.type !== "Identifier") {
            return;
        }
        const func = (node.callee as Identifier).name.toLowerCase();
        switch (func) {
            case "ctext":
            case "cdate":
                return BasicTypeDefinitions.string;
            case "ccategorical":
                return BasicTypeDefinitions.categorical;
            case "clong":
                return BasicTypeDefinitions.long;
            case "cdouble":
                return BasicTypeDefinitions.double;
            case "cboolean":
                return BasicTypeDefinitions.boolean;

            default:
                return undefined;
        }
    }

    checkConversion(node: CallExpression) {
        const type = this.checkIfConversionFunction(node);
        if (!type) {
            return;
        }
        const argType = this.getExprType(node.arguments[0]);
        if (type === argType) {
            this.raiseAtNode(
                node,
                WarningMessages["RedundantTypeConvertion"],
                true
            );
        }
    }

    //
    getFinalDefinition(
        def: DefinitionBase,
        name?: string,
        collection?: boolean): DefinitionBase {
        let defaultItem;
        let find;
        if (def.defType === "interface" || def.defType === "object") {
            if (name) {
                if (name.toLowerCase() === def.name.toLowerCase()) {
                    return def;
                }
                find = (def as InterfaceDefinition).getProperty(name) ||
                       (def as InterfaceDefinition).getMethod(name);
                if (find) {
                    return find;
                }
            }
            if (collection && def.isCollection) {
                return def;
            }
            if ((defaultItem = (def as InterfaceDefinition).default)) {
                return this.getFinalDefinition(defaultItem, name, collection);
            }
        } else if (def.defType === "property") {
            const prop = def as PropertyDefinition;
            if (name &&
                prop.name.toLowerCase() === name.toLowerCase()) {
                return prop;
            }
            if (collection && prop.isCollection) {
                return prop;
            }
            if (prop.return.defType === "interface" ||
                prop.return.defType === "object") {
                return this.getFinalDefinition(prop.return, name, collection);
            }
        } else if (def.defType === "function") {
            const func = def as FunctionDefinition;
            if (name &&
                name.toLowerCase() === func.name.toLowerCase()) {
                return func;
            }
            if (func.return &&
                (func.return.defType === "interface" || func.return.defType === "object")) {
                return this.getFinalDefinition(func.return, name, collection);
            }
        } else if (def.defType === "array") {
            if (collection) {
                return def;
            }
            return BasicTypeDefinitions.variant;
        }
        return def;
    }

    checkIfCollection(node: NodeBase, element?: Identifier) {
        const type = this.getExprType(node);
        let final: DefinitionBase;
        if (!type ||
            ((final = this.getFinalDefinition(type, undefined, true)) && !final.isCollection)) {
            this.raiseAtNode(
                node,
                ErrorMessages["PropertyOrObjectIsNotCollection"],
                false
            );
            return;
        }
        if (element && final.return) {
            const id = element.name;
            if (this.scope.currentScope().get(id)) {
                this.scope.currentScope().updateType(id, final.return);
            } else if (this.scope.currentScope().isUndefine(id)) {
                this.scope.currentScope().updateUndef(id, final.return);
            }
            this.addExtra(element, "definition", type.return);
        }
    }

}

