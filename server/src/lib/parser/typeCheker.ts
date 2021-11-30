import { Parser } from ".";
import {
    ArrayDeclarator,
    BindingDeclarator,
    BlockStatement,
    ConstDeclaration,
    DeclarationBase,
    DoWhileStatement,
    EventSection,
    Expression,
    ExpressionStatement,
    File,
    ForEachStatement,
    ForStatement,
    FunctionDeclaration,
    Identifier,
    IfStatement,
    PreDefineStatement,
    PreIfStatement,
    PreIncludeStatement,
    PreUndefStatement,
    SelectStatement,
    SetStatement,
    SingleVarDeclarator,
    Statement,
    VariableDeclaration,
    WhileStatement,
    WithStatement
} from "../types";
import { BindTypes, getLineInfo, Position, Scope, ScopeFlags } from "../util";
import { ErrorMessages } from "./error-messages";
import { ParsingError } from "./errors";
import { StatementParser } from "./statement";
import { TypeRaiseFunction } from "./typeUtil";


/**
 * 对于当前Program节点进行静态类型检查，不包含函数声明，函数声明在解析节点时完成，
 * 类型检查时，进行本地变量声明、类型绑定、类型操作检查。
 *
 * 总体顺序为：函数声明 -> 函数体类型检查 -> 更新函数返回类型 -> 程序整体类型检查
 */
export class StaticTypeChecker extends StatementParser {

    createBindingTypeFromDeclarator(dec: DeclarationBase) {
        if (dec instanceof BindingDeclarator) {
            return dec;
        }
        if (dec instanceof SingleVarDeclarator) {
            return this.createBindingTypeFromSingleDeclarator(dec);
        }
        if (dec instanceof ArrayDeclarator) {
            return this.createBindingTypeFromArrayDeclarator(dec);
        }
        const binding = this.startNodeAtNode(dec, BindingDeclarator);
        binding.name = dec.name;
        return this.finishNodeAt(binding, "BindingDeclarator", dec.end, dec.loc.end);
    }

    createBindingTypeFromSingleDeclarator(dec: SingleVarDeclarator): BindingDeclarator {
        if (dec.bindingType) {
            if (dec.bindingType instanceof ArrayDeclarator) {
                return this.createBindingTypeFromArrayDeclarator(dec.bindingType);
            }
            if (dec.bindingType instanceof SingleVarDeclarator) {
                return this.createBindingTypeFromSingleDeclarator(dec.bindingType);
            }
        }
        const binding = this.startNodeAtNode(dec, BindingDeclarator);
        const id = new Identifier(this, 0, new Position(0, 0));
        id.name = typeof dec.binding === "string" ? dec.binding : dec.binding.name.name;
        binding.name = id;
        return this.finishNodeAt(binding, "", binding.end, binding.loc.end);
    }

    createBindingTypeFromArrayDeclarator(arr: ArrayDeclarator): BindingDeclarator {
        const arrBinding = this.startNodeAtNode(arr, BindingDeclarator);
        const id = new Identifier(this, 0, new Position(0, 0));
        id.name = "Array";
        arrBinding.name = id;
        arrBinding.generics = typeof arr.binding === "string" ?
            arr.binding : arr.binding.name.name;
        return this.finishNodeAt(arrBinding, "BindingDeclarator", arr.end, arr.loc.end);
    }

    checkIncludeFiles() {
        this.state.includes.forEach(file => {
            if (file.scope &&
                file.treeParent instanceof PreIncludeStatement) {

                this.enterIncludeRaiseFunction(this.createTypeRaiseFunction(file, file.parser));
                this.checkFuncInScope(file.scope);
                this.exitIncludeRaiseFunction();
            }
        });
    }

    checkFuncInScope(scope: Scope) {
        if (!this.searchParserNode) {
            if (!this.options.inGraph) {
                for (const func of scope.functions.values()) {
                    const lowerName = func.name.name.toLowerCase();
                    if (this.updatedReturnTypeFunction.has(lowerName)) {
                        continue;
                    }
                    this.checkFunctionBody(func);
                    this.updatedReturnTypeFunction.add(lowerName);
                }
            }
            return;
        }

        for (const func of scope.functions.values()) {

            let search = this.searchParserNode(func.loc.fileName);
            if (!search || !search.parser || !search.file) {
                continue;
            }

            if (this.updatedReturnTypeFunction.has(func.name.name.toLowerCase())) {
                continue;
            }

            this.enterIncludeRaiseFunction(this.createTypeRaiseFunction(search.file, search.parser));
            this.checkFunctionBody(func);
            this.exitIncludeRaiseFunction();
        }

    }

    checkFunctionBody(func: FunctionDeclaration) {
        this.addExtra(func.name, "declaration", func);
        this.scope.enter(ScopeFlags.function);
        if (func.needReturn && func.binding) {
            let binding;
            if (typeof func.binding === "string") {
                binding = this.scope.get(func.binding)?.result;
            } else if (func.binding) {
                binding = this.scope.get(func.binding.name.name,
                    func.binding.namespace)?.result;
            }
            let declarator = this.startNodeAtNode(func.name, SingleVarDeclarator);
            this.finishNodeAt(declarator, "SingleVarDeclarator", func.name.end, func.name.loc.end);
            declarator.name = func.name;
            declarator.binding = binding ?? "Variant";
            this.scope.declareName(func.name.name,
                BindTypes.var, declarator);
        }
        func.params.forEach(param => {
            this.scope.declareName(param.declarator.name.name,
                BindTypes.var, param.declarator);
        });
        this.checkBlock(func.body);
        if (func.needReturn) {
            let update = this.scope.get(func.name.name, undefined)?.result;
            if (update) {
                func.binding = this.createBindingTypeFromDeclarator(update);
            }
        }
        func.scope = this.scope.currentScope();
        if (func.needReturn && !func.binding) {
            this.raiseTypeError(func.name,
                ErrorMessages["FunctionNeedReturn"],
                false);
        }
        this.scope.exit();
    }

    checkFile(file: File) {
        if (file.program.globalWith) {
            this.addExtra(
                file.program.globalWith,
                "declaration",
                this.scope.currentScope().currentHeader);
        }
        this.checkBlock(file.program.body);
    }

    checkBlock(block: BlockStatement | WithStatement | EventSection) {
        if (block instanceof BlockStatement) {
            for (let i = 0; i < block.body.length; ++i) {
                this.checkBlockContent(block.body[i]);
            }
        } else if (block instanceof EventSection) {
            if (block.body) {
                this.checkBlock(block.body);
            }
        } else {
            this.checkBlockContent(block.body);
        }
    }

    checkBlockContent(stat: Statement) {
        switch (stat.type) {

            case "ExpressionStatement":
                this.checkExprStatement(stat as ExpressionStatement);
                break;
            case "BlockStatement":
                this.checkBlock(stat as BlockStatement);
                break;
            case "VariableDeclaration":
                this.checkVarDeclaration(stat as VariableDeclaration);
                break;
            case "ConstDeclaration":
                this.checkConstDeclaration(stat as ConstDeclaration);
                break;
            case "IfStatement":
                this.checkIfStatement(stat as IfStatement);
                break;
            case "ForStatement":
                this.checkBaseForStatement(stat as ForStatement);
                break;
            case "ForEachStatement":
                this.checkForeachStatement(stat as ForEachStatement);
                break;
            case "DoWhileStatement":
                this.checkWhileStatement(stat as DoWhileStatement);
                break;
            case "WhileStatement":
                this.checkWhileStatement(stat as WhileStatement);
                break;
            case "SelectStatement":
                this.checkSelectStatement(stat as SelectStatement);
                break;
            case "WithStatement":
                this.checkWithStatement(stat as WithStatement);
                break;
            case "SetStatement":
                this.checkSetStatement(stat as SetStatement);
                break;

            case "EventSection":
                this.checkEvent(stat as EventSection);
                break;

            // Pre
            case "PreDefineStatement":
                this.checkPreDefineStatement(stat as PreDefineStatement);
                break;
            case "PreUndefStatement":
                this.checkPreUndefStatement(stat as PreUndefStatement);
                break;
            case "PreIfStatement":
                this.checkPreIfStatement(stat as PreIfStatement);
                break;
            case "PreIncludeStatement":
                this.checkPreIncludeStatement(stat as PreIncludeStatement);
                break;

            case "File":
                this.checkFile(stat as File);
                break;

            default:
                break;
        }
    }

    checkExprStatement(expr: ExpressionStatement) {
        if (expr.expression) {
            this.checkExprError(expr.expression);
        }
    }

    checkVarDeclaration(dec: VariableDeclaration) {
        dec.declarations.forEach(declarator => {
            this.scope.declareName(declarator.name.name, BindTypes.var, declarator);
        });
    }

    checkConstDeclaration(dec: ConstDeclaration) {
        dec.declarators.forEach(declarator => {
            let type: { type: DeclarationBase | undefined } = { type: undefined };
            this.getExprType(declarator.init, type);
            this.scope.declareName(
                declarator.declarator.name.name,
                BindTypes.const,
                declarator.declarator,
                type.type);
        });
    }

    checkSetStatement(setStat: SetStatement) {
        let rightType: { type: DeclarationBase | undefined } = { type: undefined };
        this.getExprType(setStat.assignment, rightType);
        if (rightType.type && setStat.id instanceof Identifier) {
            let declared = this.scope.get(setStat.id.name);
            if (declared?.result) {
                if (declared.type === BindTypes.const) {
                    this.raiseTypeError(setStat.id,
                        ErrorMessages["ConstVarCannotBeAssigned"],
                        false);
                } else {
                    this.scope.update(setStat.id.name,
                        BindTypes.var,
                        this.getMaybeBindingType(rightType.type) ?? rightType.type,
                        setStat.assignment);
                    let search;
                    this.addExtra(setStat.id,
                        "declaration",
                        (search = this.scope.get(setStat.id.name)?.result) ?
                        this.maybeCopyType(search) : search);
                }
            } else {
                this.checkVarDeclared(setStat.id.name, setStat.id);
            }
        }
    }

    checkIfStatement(ifStat: IfStatement) {
        this.checkExprError(ifStat.test);
        if (ifStat.consequent instanceof Expression) {
            this.checkExprError(ifStat.consequent as Expression);
        } else if (ifStat.consequent instanceof BlockStatement) {
            this.checkBlock(ifStat.consequent as BlockStatement);
        }
        if (ifStat.alternate instanceof Expression) {
            this.checkExprError(ifStat.alternate as Expression);
        } else if (ifStat.alternate instanceof BlockStatement) {
            this.checkBlock(ifStat.alternate as BlockStatement);
        } else if (ifStat.alternate instanceof IfStatement) {
            this.checkIfStatement(ifStat.alternate as IfStatement);
        }
    }

    checkForeachStatement(forEach: ForEachStatement) {
        if (forEach.variable) {
            this.checkVarDeclared(forEach.variable.name, forEach.variable);
        }
        if (forEach.collection) {
            this.checkIfCollection(forEach.collection, forEach.variable);
        }
        this.checkBlockContent(forEach.body);
    }

    checkBaseForStatement(forStat: ForStatement) {
        let declared = this.checkVarDeclared(forStat.variable.name, forStat.variable);
        let longType = this.scope.get("Long")?.result;
        if (declared && longType) {
            this.scope.update(forStat.variable.name, BindTypes.var, longType, forStat.variable);
        }
        const range = forStat.range;
        if (range.lbound instanceof Expression) {
            this.needType("Long", range.lbound);
        }
        if (range.ubound instanceof Expression) {
            this.needType("Long", range.ubound);
        }
        this.checkBlock(forStat.body);
    }

    checkWhileStatement(whileStat: WhileStatement | DoWhileStatement) {
        this.checkExprError(whileStat.test);
        this.checkBlockContent(whileStat.body);
    }

    checkSelectStatement(selectStat: SelectStatement) {
        let search: { type: DeclarationBase | undefined } = { type: undefined };
        this.getExprType(selectStat.discriminant, search);
        if (!search.type) {
            this.raiseTypeError(selectStat.discriminant,
                ErrorMessages["ExpressionNeedReturn"], false);
        }
        for (let i = 0; i < selectStat.cases.length; ++i) {
            const sub = selectStat.cases[i];
            if (sub.consequent) {
                this.checkBlock(sub.consequent);
            }
        }
    }

    checkWithStatement(withStat: WithStatement) {
        let header: { type: DeclarationBase | undefined } = { type: undefined };
        this.getExprType(withStat.object, header);
        if (header.type) {
            this.scope.enterHeader(this.getMaybeBindingType(header.type,
                this.getDeclareNamespace(header.type)));
            this.addExtra(withStat, "declaration", header.type);
        }
        this.checkBlockContent(withStat.body);
        if (header.type) {
            this.scope.exitHeader();
        }
    }

    checkEvent(event: EventSection) {
        this.scope.enter(ScopeFlags.event, event.name.name);
        if (event.body) {
            this.checkBlock(event.body);
        }
        event.scope = this.scope.currentScope();
        this.scope.exit(true);
    }

    checkPreDefineStatement(pre: PreDefineStatement) {
        this.scope.declareName(pre.declaration.name.name, BindTypes.const, pre.declaration);
    }

    checkPreUndefStatement(undef: PreUndefStatement) {
        this.scope.delete(undef.id.name);
    }

    checkPreIfStatement(pre: PreIfStatement) {
        if (pre.test) {
            this.checkExprError(pre.test);
        }
        if (pre.alternate) {
            this.checkBlockContent(pre.alternate);
        }
    }

    checkPreIncludeStatement(pre: PreIncludeStatement) {
        if (!pre.exist) {
            return;
        }
        this.enterIncludeRaiseFunction(this.createTypeRaiseFunction(pre.file, pre.parser));
        this.checkFile(pre.file);
        this.exitIncludeRaiseFunction();
    }

    needType(type: string, node: Expression) {
        let returnType = this.getExprType(node);
        if (type.toLowerCase() !== returnType.toLowerCase()) {
            this.raiseTypeError(node, ErrorMessages["NeedType"], false, type);
        }
    }

    createTypeRaiseFunction(file: File, parser: Parser): TypeRaiseFunction {
        return (node, template, warning, ...param) => {
            const loc = getLineInfo(parser.input, node.start);
            const message =
                template.template.replace(/%(\d+)/g, (_, i: number) => param[i]);
            const err: ParsingError = {
                uri: parser.options.uri,
                name: template.code,
                start: node.start,
                pos: node.end,
                loc: loc,
                message: message,
                path: parser.fileName,
                fileName: parser.fileName,
            };
            if (warning) {
                file.warnings.push(err);
            } else {
                file.errors.push(err);
            }
        };
    }

}

