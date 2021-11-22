import {
    BlockStatement,
    ConstDeclaration,
    DeclarationBase,
    DoWhileStatement,
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
    Statement,
    VariableDeclaration,
    WhileStatement,
    WithStatement
} from "../types";
import { BindTypes, Scope, ScopeFlags } from "../util";
import { ErrorMessages } from "./error-messages";
import { StatementParser } from "./statement";


/**
 * 对于当前Program节点进行静态类型检查，不包含函数声明，函数声明在解析节点时完成，
 * 类型检查时，进行本地变量声明、类型绑定、类型操作检查。
 *
 * 总体顺序为：函数声明 -> 函数体类型检查 -> 更新函数返回类型 -> 程序整体类型检查
 */
export class StaticTypeChecker extends StatementParser {

    checkIncludeFiles() {
        this.state.includes.forEach(file => {
            if (file.scope) {
                this.checkFuncInScope(file.scope);
            }
        });
    }

    checkFuncInScope(scope: Scope) {
        scope.functions.forEach(func => {
            this.checkFunctionBody(func);
        });
    }

    checkFunctionBody(func: FunctionDeclaration) {
        this.addExtra(func.name, "declaration", func);
        this.scope.enter(ScopeFlags.function, func);
        func.params.forEach(param => {
            this.scope.declareName(param.declarator.name.name,
                BindTypes.var, param.declarator);
        });
        this.checkBlock(func.body);
        this.scope.exit();
    }

    checkFile(file: File) {
        this.checkBlock(file.program.body);
    }

    checkBlock(block: BlockStatement) {
        for (let i = 0; i < block.body.length; ++i) {
            this.checkBlockContent(block.body[i]);
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
                    this.addExtra(setStat.id,
                        "declaration",
                        this.scope.get(setStat.id.name)?.result);
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
        } else {
            this.checkBlock(ifStat.consequent as BlockStatement);
        }
        if (ifStat.alternate instanceof Expression) {
            this.checkExprError(ifStat.alternate as Expression);
        } else if (ifStat.alternate instanceof Statement) {
            this.checkBlock(ifStat.alternate as BlockStatement);
        }
    }

    checkForeachStatement(forEach: ForEachStatement) {
        if (forEach.variable) {
            this.checkVarDeclared(forEach.variable.name, forEach.variable);
        }
        if (forEach.collection) {
            this.checkIfCollection(forEach.collection);
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
        let type = this.getExprType(selectStat.discriminant);
        if (type === "Void") {
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
        this.scope.enter(ScopeFlags.with);
        if (header.type) {
            this.scope.enterHeader(this.getMaybeBindingType(header.type,
                this.getDeclareNamespace(header.type)));
            this.addExtra(withStat, "declaration", header.type);
        }
        this.checkBlockContent(withStat.body);
        this.scope.exitHeader();
        this.scope.exit();
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
        this.includeRaiseFunction = pre.parser.raiseAtNode;
        this.checkFile(pre.file);
        this.includeRaiseFunction = undefined;
    }

    needType(type: string, node: Expression) {
        let returnType = this.getExprType(node);
        if (type.toLowerCase() !== returnType.toLowerCase()) {
            this.raiseTypeError(node, ErrorMessages["NeedType"], false, type);
        }
    }

}
