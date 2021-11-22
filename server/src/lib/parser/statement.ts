import * as charCodes from "../util/charcodes";
import * as path from "path";
import * as fs from "fs";
import { Parser } from ".";
import { createBasicOptions, ScriptFileType, SourceType } from "../options";
import { TokenType, types as tt } from "../tokenizer/type";
import {
    ArgumentDeclarator,
    ArrayDeclarator,
    BindingDeclarator,
    BlockStatement,
    BooleanLiteral,
    ClassOrInterfaceDeclaration,
    ConstDeclaration,
    ConstDeclarator,
    DecimalLiteral,
    DeclarationBase,
    DoWhileStatement,
    EnumDeclaration,
    EnumItemDeclarator,
    EventSection,
    ExitStatement,
    Expression,
    ExpressionStatement,
    File,
    ForEachStatement,
    ForLike,
    ForStatement,
    FunctionDeclaration,
    GlobalSQLVariablesSection,
    GotoStatement,
    Identifier,
    IfStatement,
    InputDataSourceSection,
    JobSection,
    LineMark,
    Literal,
    LoggingSection,
    MacroDeclaration,
    MetadataAreaName,
    MetadataAxisExpression,
    MetadataBase,
    MetadataBlockVariable,
    MetadataBooleanVariable,
    MetadataCategoricalLoopVariable,
    MetadataCategoricalVariable,
    MetadataCategory,
    MetadataCategoryElementType,
    MetadataCategoryElementTypeValues,
    MetadataCategoryList,
    MetadataCategoryOtherOrMultiplier,
    MetadataCategoryUseList,
    MetadataCellStyle,
    MetadataCompoundVariable,
    MetadataControlStyle,
    MetadataDataBaseLoopQuestion,
    MetadataDataBaseNonLoopQuestion,
    MetadataDateVariable,
    MetadataDbColumnsDefinition,
    MetadataDbDefinition,
    MetadataDoubleVariable,
    MetadataEnumText,
    MetadataExpression,
    MetadataFieldHeadDefinition,
    MetadataFieldTailDefinition,
    MetadataFieldTypeDefinition,
    MetadataFieldValueType,
    MetadataFontStyle,
    MetadataGridVariable,
    MetadataHelpFields,
    MetadataInfoVariable,
    MetadataLabel,
    MetadataLabelTypes,
    MetadataLanguageCodes,
    MetadataLongVariable,
    MetadataLoopVariableBase,
    MetadataNumericLoopVariable,
    MetadataPageVariable,
    MetadataProperty,
    MetadataRange,
    MetadataRangeAllowedType,
    MetadataSection,
    MetadataSingleHead,
    MetadataStyle,
    MetadataSubList,
    MetadataSublistSuffix,
    MetadataTemplates,
    MetadataTextVariable,
    MetadataUsageType,
    MetadataUsageTypeValues,
    MetadataUserContexts,
    MetadataValidation,
    NamespaceDeclaration,
    NodeBase,
    NumericLiteral,
    OnErrorStatement,
    OutputDataSourceSection,
    PreDefineStatement,
    PreErrorStatement,
    PreIfStatement,
    PreIncludeStatement,
    PreLineStatement,
    PreUndefStatement,
    Program,
    PropertyDeclaration,
    PropertyGet,
    PropertySet,
    ResumeNextStatement,
    SectionStatement,
    SelectCaseRange,
    SelectCaseStatement,
    SelectStatement,
    SetStatement,
    SingleVarDeclarator,
    Statement,
    StringLiteral,
    VariableDeclaration,
    WhileStatement,
    WithStatement
} from "../types";
import { ErrorMessages } from "./error-messages";
import { ExpressionParser } from "./expression";
import { ParserBase } from "../base";
import { Position } from "../util/location";
import { ParserFileNode } from "../file/node";
import { ErrorTemplate } from "./errors";
import { BindTypes, ScopeFlags } from "../util/scope";
import { isEventName } from "../util/match";

export class StatementParser extends ExpressionParser {

    eventNames: string[] = [];

    convertVarToArrayDeclarator(varDec: SingleVarDeclarator, type: string) {
        const node = this.startNodeAtNode(varDec, ArrayDeclarator);
        node.name = varDec.name;
        node.dimensions = 1;
        node.binding = type;
        return node;
    }

    checkIfDeclareFile(kw?: string) {
        if (this.options.sourceType !== SourceType.declare) {
            if (kw) {
                this.raise(
                    this.state.pos,
                    ErrorMessages["KeywordCanOnlyBeUsedInDeclareFile"],
                    kw
                );
            } else {
                this.raise(
                    this.state.pos,
                    ErrorMessages["TypeReferenceCanOnlyBeUsedInDeclareFile"]
                );
            }
        }
    }

    join(file: File) {
        if (file.scope) {
            this.scope.joinScope(file.scope);
        }
    }

    expectAndParseLiteral<T extends Literal>(
        type: TokenType | TokenType[],
        typeStr: string,
        errStr: string,
        n: new(parser: ParserBase, pos: number, loc: Position) => T,
        ) {
        if (this.matchOne(type)) {
            return this.parseLiteral(this.state.value, typeStr, n);
        } else {
            this.raise(
                this.state.pos,
                ErrorMessages["ExpectToken"],
                errStr
            );
            this.next();
            return;
        }
    }

    expectAndParseStringLiteral() {
        return this.expectAndParseLiteral(
            tt.string,
            "StringLiteral",
            "字符串",
            StringLiteral
        );
    }

    expectAndParseBooleanLiteral() {
        return this.expectAndParseLiteral(
            [ tt._true, tt._false ],
            "BooleanLiteral",
            "True或False",
            BooleanLiteral
        );
    }

    expectAndParseNumericLiteral(integerOnly?: boolean) {
        if (this.match(tt.number)) {
            return this.expectAndParseLiteral(
                tt.number,
                "NumericLiteral",
                "整数",
                NumericLiteral
            );
        }
        if (this.match(tt.decimal)) {
            if (integerOnly) {
                this.next();
                this.raise(
                    this.state.pos,
                    ErrorMessages["ExpectToken"],
                    "整数"
                );
                return;
            }
            return this.expectAndParseLiteral(
                tt.decimal,
                "DecimalLiteral",
                "实数",
                DecimalLiteral
            );
        }
        const next = this.lookahead();
        if (this.match(tt.plusMin) && (
            next.type === tt.decimal || next.type === tt.number
        )) {
            const node = this.startNode(NumericLiteral);
            const start = this.state.pos;
            this.next();
            if (next.type === tt.decimal && integerOnly) {
                this.raise(
                    this.state.pos,
                    ErrorMessages["ExpectToken"],
                    "整数"
                );
                return;
            }
            return this.parseLiteralAtNode(
                this.input.slice(start, this.state.pos),
                next.type === tt.number ?
                "NumericLiteral" : "DecimalLiteral",
                node
            );
        }
    }

    //skipNewline() {
    //    while (this.match(tt.newLine)) {
    //        this.next();
    //    }
    //}

    //skipUntilNewLine() {
    //    this.skipSpace();
    //    if (!this.match(tt.eof)) {
    //        this.expect(tt.newLine);
    //    }
    //}

    //skipSpaceAndNewLine() {
    //    this.skipSpace();
    //    this.skipNewline();
    //}

    parseProgram(
        end: TokenType = tt.eof,
        sourceType: SourceType = this.options.sourceType
    ): Program {
        const node = this.startNode(Program);
        node.sourceType = sourceType;
        if (this.options.sourceType !== SourceType.metadata) {
            node.body = this.parseBlock(end);
            node.push(node.body);
        } else {
            node.metadata = this.parseMetadata();
            node.pushArr(node.metadata);
        }
        return this.finishNode(node, "Program");
    }


    parseStatementContent(): Statement {
        let next;
        switch (this.state.type) {
            case tt.string:
            case tt.number:
            case tt.decimal:
            case tt._null:
            case tt._true:
            case tt._false:
            case tt.identifier:
                next = this.lookahead();
                if (next.type === tt.colon) {
                    const line = this.startNode(LineMark);
                    const id = this.parseIdentifier();
                    line.id = id;
                    this.next();
                    line.positionMap.push(line.id);
                    this.finishNode(line, "LineMark");
                    this.checkNewLineMark(line);
                    this.checkAheadLineMark(id);
                    return line;
                } else if (next.type === tt.braceL) {
                    const text = this.state.value.toLowerCase();
                    switch (text) {
                        case "event":
                            return this.parseEventSection();
                        case "logging":
                            return this.parseLoggingSection();
                        case "job":
                            return this.parseJobSection();
                        case "inputdatasource":
                            return this.parseInputDataSourceSection();
                        case "outputdatasource":
                            return this.parseOutputDataSourceSection();
                        case "globalsqlvariables":
                            return this.parseGlobalSQLVariablesSection();
                        case "metadata":
                            return this.parseMetadataSection();
                        default:
                            break;
                    }
                }
                return this.parseExpressionStatement();
            case tt.dot:
                return this.parseExpressionStatement();

            case tt._if:
                return this.parseIfStatement();
            case tt._for:
                return this.parseForStatement();
            case tt._while:
                return this.parseWhileStatement();
            case tt._do:
                return this.parseDoStatement();
            case tt._with:
                return this.parseWithStatement();
            case tt._select:
                return this.parseSelectStatement();
            // Declaration
            case tt._const:
                return this.parseConstDeclaration();
            case tt._dim:
                return this.parseDeclaration();
            case tt._sub:
            case tt._function:
                const func = this.parseFunctionDeclaration();
                return func;
            // Jump Statement
            case tt._exit:
                return this.parseExit();
            case tt._goto:
                return this.parseGoto();
            case tt._on:
                return this.parseOnError();
            case tt._resume:
                return this.parseResumeNext();
            //
            case tt._section:
                return this.parseSectionStatement();
            case tt._set:
                return this.parseSetStatement();

            // Pre-Processor
            case tt.pre_define:
                return this.parsePreDefineStatement();
            case tt.pre_undef:
                return this.parsePreUndefStatement();
            case tt.pre_include:
                return this.parsePreIncludeStatement();
            case tt.pre_if:
                return this.parsePreIfStatement();
            case tt.pre_line:
                return this.parsePreLineStatement();
            case tt.pre_error:
                return this.parsePreErrorStatement();

            // declaration
            case tt._class:
            case tt._interface:
                return this.parseClassOrInterface();

            case tt._nameSpace:
                return this.parseNamespaceDeclaration();

            case tt._enum:
                return this.parseEnumDeclaration();

            default:
                throw this.unexpected();
        }
    }

    parseBindingDeclarator(): BindingDeclarator | string {
        const node = this.startNode(BindingDeclarator);
        this.checkIfDeclareFile();
        if (this.lookahead().type === tt.dot) {
            node.namespace = this.parseIdentifier().name;
            this.eat(tt.dot);
        }
        node.name = this.parseIdentifier();
        if (this.match(tt.braceL)) {
            this.checkIfDeclareFile("泛型定义");
            this.eat(tt.braceL);
            this.expect(tt._of);
            node.generics = this.parseIdentifier().name;
            this.expect(tt.braceR);
            node.enumerable = true;
        }
        node.push(node.name);
        this.finishNode(node, "BindingDeclarator");
        if (node.namespace || node.enumerable) {
            return node;
        } else {
            return node.name.name;
        }
    }

    parseSingleVarDeclarator(): SingleVarDeclarator | ArrayDeclarator {
        const node = this.startNode(SingleVarDeclarator);
        node.name = this.parseIdentifier();
        node.push(node.name);
        if (this.eat(tt._as)) {
            node.binding = this.parseBindingDeclarator();
            node.bindingType =
                this.scope.get(this.getBindingTypeName(node.binding))?.result;
        } else {
            node.binding = "Variant";
            node.bindingType = this.scope.get("Variant")?.result;
        }
        return this.finishNode(node, "SingleVarDeclarator");
    }

    parseConstDeclarator(): ConstDeclarator {
        const node = this.startNode(ConstDeclarator);
        node.declarator = this.parseSingleVarDeclarator();
        this.expect(tt.equal);
        node.init = this.parseExpression(true);
        node.push(node.declarator, node.init);
        let right: { type: DeclarationBase | undefined } = { type: undefined };
        node.declarator.binding = this.getExprType(node.init, right);
        node.declarator.bindingType = right.type;
        return this.finishNode(node, "ConstDeclarator");
    }

    parseConstDeclaration(): ConstDeclaration {
        const node = this.startNode(ConstDeclaration);
        this.next();
        while (!this.hasPrecedingLineBreak()) {
            node.declarators.push(this.parseConstDeclarator());
            if (!this.hasPrecedingLineBreak()) {
                this.expect(tt.comma);
            }
        }
        node.pushArr(node.declarators);
        return this.finishNode(node, "ConstDeclaration");
    }

    parseArrayDeclarator(): ArrayDeclarator {
        const node = this.startNode(ArrayDeclarator);
        const id = this.parseIdentifier();
        node.push(id);
        node.name = id;
        const boundaries: number[] = [];
        let dimensions = 0;
        let last = false;
        while(!this.hasPrecedingLineBreak() &&
              !this.match(tt.comma)         &&
              !this.match(tt.braceR)        &&
              !this.match(tt._as)) {
            if (this.match(tt.bracketL)) {
                this.next();
                if (this.match(tt.number)) {
                    boundaries.push(Number(this.state.value));
                    dimensions++;
                    this.next();
                } else if (this.match(tt.bracketR)) {
                    if (last) {
                        this.raise(this.state.pos,
                            ErrorMessages["InvalidArrayDefinition"]);
                    }
                    dimensions++;
                    last = true;
                } else {
                    throw this.unexpected();
                }
            }
            this.next();
        }
        if (this.eat(tt._as)) {
            node.binding = this.parseBindingDeclarator();
            this.next();
        } else {
            node.binding = "Variant";
        }
        node.boundaries = boundaries;
        node.dimensions = dimensions;
        return this.finishNode(node, "ArrayDeclarator");
    }

    parseMacroDeclaration(): MacroDeclaration {
        const node = this.startNode(MacroDeclaration);
        node.name = this.parseIdentifier();
        if (!this.hasPrecedingLineBreak()) {
            node.init = this.parseExpression();
            if (node.init.extra["raw"]) {
                node.initValue = node.init.extra["raw"];
            }
        }
        return this.finishNode(node, "MacroDeclaration");
    }

    parseDeclaration(): VariableDeclaration {
        // 跳过dim
        this.next();
        const node = this.startNode(VariableDeclaration);
        const declarators: Array<SingleVarDeclarator | ArrayDeclarator> = [];
        let hasComma = false;
        while (!this.hasPrecedingLineBreak()) {
            if (this.lookahead().type === tt.bracketL) {
                const arr = this.parseArrayDeclarator();
                declarators.push(arr);
                hasComma = false;
            } else {
                const id = this.parseSingleVarDeclarator();
                declarators.push(id);
                hasComma = false;
            }
            if (this.match(tt.comma)) {
                if (hasComma) {
                    this.raise(
                        this.state.pos,
                        ErrorMessages["UnexpectedToken"],
                        ","
                    );
                }
                hasComma = true;
                this.next();
            }
        }
        if (hasComma) {
            this.raise(
                this.state.lastTokenStart,
                ErrorMessages["UnexpectedToken"],
                ","
            );
        }
        node.declarations = declarators;
        node.pushArr(declarators);
        return this.finishNodeAt(node,
            "VariableDeclaration",
            this.state.lastTokenEnd,
            this.state.lastTokenEndLoc);
    }

    parseExpressionStatement(): ExpressionStatement {
        const node = this.startNode(ExpressionStatement);
        node.expression = this.parseExpression(true);
        node.push(node.expression);
        return this.finishNodeAt(node,
            "ExpressionStatement",
            this.state.lastTokenEnd,
            this.state.lastTokenEndLoc);
    }

    parseSetStatement(): SetStatement {
        const node = this.startNode(SetStatement);
        this.next();
        node.id = this.parseCallOrMember();
        this.expect(tt.equal);
        node.assignment = this.parseExpression(true);
        node.push(node.id, node.assignment);
        return this.finishNode(node, "SetStatement");
    }

    parseBlock(close: TokenType | Array<TokenType>): BlockStatement {
        const node = this.startNode(BlockStatement);
        const body: Statement[] = [];
        while (!this.matchOne(close)) {
            body.push(this.parseStatementContent());
        }
        node.body = body;
        node.pushArr(node.body);
        return this.finishNodeAt(node,
            "BlockStatement",
            this.state.lastTokenEnd,
            this.state.lastTokenEndLoc);
    }

    parseIfStatement(): IfStatement {
        const node = this.startNode(IfStatement);
        this.next();
        node.test = this.parseExpression();
        this.expect(tt._then);
        if (this.hasPrecedingLineBreak()) {
            node.consequent = this.parseBlock([ tt._end, tt._else, tt._elseif ]);
            if (this.match(tt._else)) {
                this.next();
                node.alternate = this.parseBlock(tt._end);
                node.push(node.alternate);
                this.expect(tt._end);
                this.expect(tt._if);
            } else if (this.match(tt._elseif)) {
                node.alternate = this.parseIfStatement();
                node.push(node.alternate);
            } else {
                this.expect(tt._end);
                this.expect(tt._if);
            }
        } else {
            if (this.match(tt._goto)) {
                node.consequent = this.parseGoto();
            } else if (this.match(tt._exit)) {
                node.consequent = this.parseExit();
            } else {
                node.consequent = this.parseExpression(true);
            }
            if (this.match(tt._else) && !this.hasPrecedingLineBreak()) {
                this.next();
                node.alternate = this.parseExpression();
                node.push(node.alternate);
            }
        }
        node.push(node.test, node.consequent);
        this.finishNode(node, "IfStatement");
        return node;
    }

    parseForStatement(): ForLike {
        const next = this.lookahead();
        if (next.type === tt._each) {
            return this.parseForEach();
        }
        return this.parseBaseFor();
    }

    parseForBoundary(): NumericLiteral | Expression {
        if (this.match(tt.number)) {
            return this.parseNumericLiteral(this.state.value);
        } else {
            return this.parseExpression();
        }
    }

    parseBaseFor(): ForStatement {
        const node = this.startNode(ForStatement);
        this.next();
        node.variable = this.parseIdentifier();
        node.push(node.variable);
        this.expect(tt.equal);
        const lbound = this.parseForBoundary();
        this.expect(tt._to);
        const ubound = this.parseForBoundary();
        node.range = { lbound, ubound };
        node.push(lbound, ubound);
        if (this.eat(tt._step)) {
            const stepExpr = this.parseExpression();
            node.push(stepExpr);
            if (stepExpr instanceof NumericLiteral) {
                node.range.step = Number(stepExpr.extra["raw"]);
            } else {
                this.raiseAtNode(
                    stepExpr,
                    ErrorMessages["ExpectToken"],
                    false,
                    "数字"
                );
            }
        }
        node.body = this.parseBlock(tt._next);
        node.push(node.body);
        this.expect(tt._next);
        return this.finishNode(node, "ForStatement");
    }

    parseForEach(): ForEachStatement {
        const node = this.startNode(ForEachStatement);
        this.next();
        this.expect(tt._each);
        const variable = this.parseIdentifier();
        node.variable = variable;
        this.expect(tt._in);
        const collection = this.parseExpression();
        node.collection = collection;
        node.body = this.parseBlock(tt._next);
        this.expect(tt._next);
        node.push(variable, collection, node.body);
        return this.finishNode(node, "ForEachStatement");
    }

    /**
     * __语法__:
     * While  expression
     *   [statements]
     * End While
     *
     * @returns WhileStatement
     */
    parseWhileStatement(): WhileStatement {
        const node = this.startNode(WhileStatement);
        this.next();
        node.test = this.parseExpression();
        node.body = this.parseBlock(tt._end);
        node.push(node.test, node.body);
        this.expect(tt._end);
        this.expect(tt._while);
        return this.finishNode(node, "WhileStatement");
    }

    // 语法:
    // Do [{While | Until} expression]
    //   [statements]
    //   [Exit Do]
    //   [statements]
    // Loop
    //
    // Do
    //   [statements]
    //   [Exit Do]
    //   [statements]
    // Loop [{While | Until} expression]
    //
    parseDoStatement(): DoWhileStatement {
        const node = this.startNode(DoWhileStatement);
        this.next();
        const testAhead = this.match(tt._while) || this.match(tt._until);
        if (testAhead) {
            this.next();
            node.test = this.parseExpression();
        }
        node.body = this.parseBlock(tt._loop);
        this.expect(tt._loop);
        if (!testAhead) {
            if (this.match(tt._while) || this.match(tt._until)) {
                this.next();
            } else {
                this.unexpected();
            }
            node.test = this.parseExpression();
        }
        node.push(node.test, node.body);
        return this.finishNode(node, "DoWhileStatement");
    }

    //
    // With objectexpression
    //     statements
    //
    // End With
    //
    parseWithStatement(): WithStatement {
        const node = this.startNode(WithStatement);
        this.next();
        this.scope.enter(ScopeFlags.with);
        node.object = this.parseExpression();
        node.body = this.parseBlock(tt._end);
        this.expect(tt._end);
        this.expect(tt._with);
        this.scope.exit();
        node.push(node.object, node.body);
        return this.finishNode(node, "WithStatement");
    }

    //
    //Section label
    //  statements
    //End Section
    //
    parseSectionStatement(): SectionStatement {
        const node = this.startNode(SectionStatement);
        this.next();
        node.label = this.parseIdentifier();
        node.body = this.parseBlock(tt._end);
        this.eat(tt._end);
        this.expect(tt._section);
        node.push(node.label, node.body);
        return this.finishNode(node, "SectionStatement");
    }

    //
    // Select Case  testexpression
    //   [Case  expression-n
    //     [statements-n]] ...
    //   [Case Else
    //     [elsestatements]]
    // End Select
    //
    parseSelectStatement(): SelectStatement {
        const node = this.startNode(SelectStatement);
        this.next();
        this.expect(tt._case);
        node.discriminant = this.parseExpression();
        node.cases = this.parseSelectBody();
        this.expect(tt._end);
        this.expect(tt._select);
        node.pushArr(node.cases);
        node.push(node.discriminant);
        return this.finishNode(node, "SelectStatement");
    }

    parseSelectBody(): Array<SelectCaseStatement> {
        const body: Array<SelectCaseStatement> = [];
        if (!this.match(tt._case)) {
            throw this.unexpected();
        }
        const state: { else: boolean } = { else: false };
        while (!this.match(tt._end)) {
            if (!this.match(tt._case)) {
                throw this.unexpected();
            }
            body.push(this.parseSelectCaseBranch(state));
        }
        return body;
    }

    parseSelectCaseBranch(state: { else: boolean }): SelectCaseStatement {
        const node = this.startNode(SelectCaseStatement);
        this.next();
        if (!this.match(tt._else)) {
            if (state.else) {
                this.raise(
                    this.state.pos,
                    ErrorMessages["CaseShouldBeforeCaseElse"]
                );
            }
            const ranges: Array<SelectCaseRange> = [];
            while (!this.hasPrecedingLineBreak()) {
                this.eat(tt.comma);
                ranges.push(this.parseSelectCaseRange());
            }
            node.test = ranges;
        } else {
            this.expect(tt._else);
            state.else = true;
        }
        node.consequent = this.parseBlock([ tt._case, tt._end ]);
        node.pushArr(node.test);
        node.push(node.consequent);
        return this.finishNode(node, "SelectCaseStatement");
    }

    parseSelectCaseRange(): SelectCaseRange {
        const node = this.startNode(SelectCaseRange);
        // 1 To 5, 21 To visits.Validation.MaxValue
        if (this.lookahead().type === tt._to) {
            const lbound = this.parseExpression();
            this.eat(tt._to);
            const ubound = this.parseExpression();
            node.range = { lbound, ubound, relational: "to" };
            node.push(lbound, ubound);
        // > 70
        } else if (this.match(tt.relational)) {
            const op = this.state.value;
            let up = false;
            if (op === "<=" || op === "<") {
                up = true;
            }
            this.next();
            const bound = this.parseExpression();
            node.push(bound);
            node.range = up ?
                { lbound: bound, relational: op } :
                { ubound: bound, relational: op };
        } else {
            node.test = this.parseExpression();
            node.push(node.test);
        }
        return this.finishNode(node, "SelectCaseRange");
    }

    parseExit(): ExitStatement {
        const node = this.startNode(ExitStatement);
        this.next();
        switch (this.state.type) {
            case tt._sub:
                node.scope = "sub";
                this.next();
                break;
            case tt._do:
                node.scope = "do";
                this.next();
                break;
            case tt._for:
                node.scope = "for";
                this.next();
                break;
            case tt._while:
                node.scope = "while";
                this.next();
                break;
            case tt._function:
                node.scope = "function";
                this.next();
                break;

            default:
                break;
        }
        return this.finishNode(node, "ExitStatement");
    }

    parseGoto(): GotoStatement {
        const node = this.startNode(GotoStatement);
        this.next();
        if (this.state.value !== "0") {
            const id = this.parseIdentifier();
            const line = this.checkExistLineMark(id);
            if (line) {
                node.line = line;
                node.push(line);
            }
            node.push(id);
        } else {
            node.line = 0;
        }
        return this.finishNode(node, "GotoStatement");
    }

    parseResumeNext(): ResumeNextStatement {
        const node = this.startNode(ResumeNextStatement);
        this.next();
        this.expect(tt._next);
        return this.finishNode(node, "ResumeNextStatement");
    }

    //
    // On Error Goto location
    // On Error Resume Next
    // On Error Goto 0
    //
    parseOnError(): OnErrorStatement {
        const node = this.startNode(OnErrorStatement);
        this.next();
        this.expect(tt._error);
        if (this.match(tt._resume)) {
            node.resume = true;
            this.next();
            this.expect(tt._next);
        } else if (this.match(tt._goto)) {
            node.goto = this.parseGoto();
        } else {
            throw this.unexpected();
        }
        return this.finishNode(node, "OnErrorStatement");
    }

    // Function name([<arglist>])
    //   [statements]
    //   [name = expression]
    //   [Exit Function]
    //   [statements]
    //   [name = expression]
    // End Function
    //
    // <arglist> ::= varname[[]]
    //
    parseFunctionDeclaration(): FunctionDeclaration {
        const node = this.startNode(FunctionDeclaration);
        let isFunction = false;
        if (this.match(tt._function)) {
            node.needReturn = true;
            isFunction = true;
        }
        this.scope.enter(ScopeFlags.function);
        this.next();
        node.name = this.parseIdentifier();
        this.expect(tt.braceL);
        node.params = this.parseFunctionDeclarationParam();
        if (this.eat(tt._as)) {
            this.checkIfDeclareFile();
            node.binding = this.parseBindingDeclarator();
        }
        node.body = this.parseBlock(tt._end);
        this.expect(tt._end);
        isFunction ? this.expect(tt._function) : this.expect(tt._sub);
        if (isFunction && !node.binding) {
            node.binding = "Variant";
        }
        node.push(node.body);
        node.pushArr(node.params);
        this.scope.exit();
        this.scope.declareName(node.name.name, BindTypes.function, node);
        return this.finishNode(node, "FunctionDeclaration");
    }

    parseArgumentDeclarator(): ArgumentDeclarator {
        const node = this.startNode(ArgumentDeclarator);
        if (this.eat(tt._optional)) {
            node.optional = true;
        }
        if (this.eat(tt._paramarray)) {
            node.paramArray = true;
        }
        if (this.lookahead().type === tt.bracketL) {
            node.declarator = this.parseArrayDeclarator();
        } else {
            node.declarator = this.parseSingleVarDeclarator();
        }
        node.push(node.declarator);
        if (this.eat(tt.equal)) {
            node.defaultValue = this.parseExpression();
            node.push(node.defaultValue);
        }
        return this.finishNode(node, "ArgumentDeclarator");
    }

    parseFunctionDeclarationParam(): Array<ArgumentDeclarator> {
        const params: Array<ArgumentDeclarator> = [];
        let comma = false;
        while (!this.eat(tt.braceR)) {
            if (this.match(tt.comma)) {
                if (comma || this.lookahead().type === tt.braceR) {
                    this.unexpected();
                }
                comma = true;
                this.next();
            } else {
                let arg = this.parseArgumentDeclarator();
                params.push(arg);
                comma = false;
            }
        }
        return params;
    }

    // Declaration File   仅用于built in定义初始定义

    parsePropertyGet(): PropertyGet {
        const node = this.startNode(PropertyGet);
        this.next();
        node.body = this.parseBlock(tt._end);
        this.next();
        this.expect(tt._get);
        return this.finishNode(node, "PropertyGet");
    }

    parsePropertySet(): PropertySet {
        const node = this.startNode(PropertySet);
        this.next();
        this.expect(tt.braceL);
        node.params = this.parseFunctionDeclarationParam();
        node.body = this.parseBlock(tt._end);
        this.next();
        this.expect(tt._set);
        return this.finishNode(node, "PropertySet");
    }

    // [Readonly] Property name([Param As Type]) [As Type]
    //     [Get]
    //     [Set]
    // [End Property]
    parsePropertyDeclaration(
        object: ClassOrInterfaceDeclaration
    ): PropertyDeclaration {
        const node = this.startNode(PropertyDeclaration);
        node.class = object;
        if (this.match(tt._default)) {
            node.default = true;
            object.default = node;
            this.next();
        }
        if (this.match(tt._readonly)) {
            this.next();
            node.readonly = true;
        } else if (this.match(tt._writeonly)) {
            this.next();
            node.writeonly = true;
        }
        this.checkIfDeclareFile();
        this.expect(tt._property);
        node.name = this.parseIdentifier(true);
        node.push(node.name);
        this.resetPreviousNodeTrailingComments(node.name);
        this.expect(tt.braceL);
        node.params = this.parseFunctionDeclarationParam();
        node.pushArr(node.params);
        this.expect(tt._as);
        node.binding = this.parseBindingDeclarator();
        if (typeof node.binding !== "string") {
            node.push(node.binding);
        }
        if (this.match(tt.equal)) {
            this.next();
            node.init = this.parseExpression();
        } else if (this.matchOne([ tt._get, tt._set ])) {
            while (!this.eat(tt._end)) {
                if (this.match(tt._get)) {
                    if (node.get) {
                        this.raise(
                            this.state.pos,
                            ErrorMessages["PropertyAutoImplementAlreadyExist"],
                            "Get"
                        );
                    }
                    node.get = this.parsePropertyGet();
                } else if (this.match(tt._set)) {
                    if (node.set) {
                        this.raise(
                            this.state.pos,
                            ErrorMessages["PropertyAutoImplementAlreadyExist"],
                            "Set"
                        );
                    }
                    node.set = this.parsePropertySet();
                }
            }
            this.expect(tt._property);
        }
        return this.finishNodeAt(node,
            "PropertyDeclaration",
            this.state.lastTokenEnd,
            this.state.lastTokenEndLoc);
    }

    parseClassOrInterface(): ClassOrInterfaceDeclaration {
        const node = this.startNode(ClassOrInterfaceDeclaration);
        node.defType = this.match(tt._interface) ? "interface" : "class";
        this.checkIfDeclareFile(this.state.value);
        this.next();
        this.scope.enter(ScopeFlags.classOrInterface);
        node.name = this.parseIdentifier();
        if (this.eat(tt.braceL)) {
            this.expect(tt._of);
            node.generic = this.state.value;
            this.next();
            this.expect(tt.braceR);
        }
        if (this.eat(tt._implements)) {
            for (;;) {
                node.implements.push(this.state.value);
                this.next();
                if (this.hasPrecedingLineBreak()) {
                    break;
                }
                this.expect(tt.comma);
            }
        }
        while (!this.eat(tt._end)) {
            switch(this.state.type) {
                case tt._default:
                case tt._readonly:
                case tt._writeonly:
                case tt._property:
                    const prop = this.parsePropertyDeclaration(node);
                    node.properties.set(prop.name.name.toLowerCase(), prop);
                    node.push(prop);
                    break;
                case tt._sub:
                case tt._function:
                    const method = this.parseFunctionDeclaration();
                    method.class = node;
                    node.methods.set(method.name.name.toLowerCase(), method);
                    node.push(method);
                    break;

                case tt._const:
                    const constants = this.parseConstDeclaration();
                    constants.declarators.forEach(constant => {
                        node.constants.set(constant.declarator.name.name.toLowerCase(), constant);
                        node.push(constant);
                    });
                    break;

                default:
                    throw this.unexpected();
            }
        }
        if (node.defType === "class") {
            this.expect(tt._class);
        } else {
            this.expect(tt._interface);
        }
        this.scope.exit();
        this.scope.declareName(node.name.name, BindTypes.classOrInterface, node);
        return this.finishNode(node, "ClassOrInterfaceDeclaration");
    }

    parseEnumItemDeclarator(): EnumItemDeclarator {
        const node = this.startNode(EnumItemDeclarator);
        node.name = this.parseIdentifier();
        if (this.eat(tt.equal)) {
            if (this.match(tt.number)) {
                const num = this.parseNumericLiteral(this.state.value);
                node.enumValue = Number(num.extra["rawValue"]);
            } else {
                this.unexpected(undefined, undefined, undefined, false);
                this.next();
            }
        }
        return this.finishNode(node, "EnumItemDeclarator");
    }

    parseEnumDeclaration(): EnumDeclaration {
        const node = this.startNode(EnumDeclaration);
        this.next();
        node.name = this.parseIdentifier();
        this.scope.enter(ScopeFlags.enumerator);
        while (!this.eat(tt._end)) {
            const item = this.parseEnumItemDeclarator();
            node.enumItems.push(item);
        }
        this.scope.exit();
        node.pushArr(node.enumItems);
        this.expect(tt._enum);
        this.scope.declareName(node.name.name, BindTypes.const, node);
        return this.finishNode(node, "EnumDeclaration");
    }

    parseNamespaceDeclaration(): NamespaceDeclaration {
        const node = this.startNode(NamespaceDeclaration);
        this.checkIfDeclareFile("NameSpace");
        this.scope.enter(ScopeFlags.namespace);
        this.next();
        while (this.lookahead().type === tt.dot) {
            node.level.push(this.parseIdentifier().name);
            this.eat(tt.dot);
        }
        node.name = this.parseIdentifier();
        while (!this.eat(tt._end)) {
            switch (this.state.type) {
                case tt._class:
                case tt._interface:
                    const classOrInterface = this.parseClassOrInterface();
                    classOrInterface.namespace = node;
                    node.body.push(classOrInterface);
                    break;
                case tt._function:
                case tt._sub:
                    const func = this.parseFunctionDeclaration();
                    func.namespace = node;
                    node.body.push(func);
                    break;

                case tt._enum:
                    node.body.push(this.parseEnumDeclaration());
                    break;

                default:
                    this.unexpected();
            }
        }
        this.expect(tt._nameSpace);
        this.scope.exit();
        this.scope.declareName(node.name.name, BindTypes.namespace, node);
        return this.finishNode(node, "NamespaceDeclaration");
    }

    // Pre-Processor
    // #define identifier [ ["] value ["] ]
    parsePreDefineStatement(): PreDefineStatement {
        const node = this.startNode(PreDefineStatement);
        this.next();
        node.declaration = this.parseMacroDeclaration();
        node.push(node.declaration);
        this.finishNode(node, "PreDefineStatement");
        return node;
    }

    // #undef identifier
    parsePreUndefStatement(): PreUndefStatement {
        const node = this.startNode(PreUndefStatement);
        this.next();
        node.id = this.parseIdentifier();
        node.push(node.id);
        return this.finishNode(node, "PreUndefStatement");
    }

    // #include "filename"
    parsePreIncludeStatement(metadata?: boolean): PreIncludeStatement {
        const node = this.startNode(PreIncludeStatement);
        this.next();
        const includeFilePath = this.parseExpression();
        this.finishNode(node, "PreIncludeStatement");
        let search;
        if (includeFilePath instanceof StringLiteral) {
            node.inc = includeFilePath;
            try {
                node.path = this.options.sourceFileName ?
                path.join(path.dirname(this.options.sourceFileName), includeFilePath.extra["rawValue"]) :
                includeFilePath.extra["rawValue"];
            } catch (error) {
                return node;
            }
            if (this.searchParserNode &&
                (search = this.searchParserNode(node.path))) {
                node.parser = new Parser(
                    createBasicOptions(node.path,
                        this.options.raiseTypeError,
                        this.options.uri,
                        this.options.globalDeclarations),
                    search.content);
            } else {
                let content = "";
                try {
                    content = fs.readFileSync(node.path).toString();
                } catch (error) {
                    this.raiseAtNode(
                        node.inc,
                        ErrorMessages["PreIncludeFileDontExist"],
                        false,
                        node.path
                    );
                }
                if (content) {
                    node.parser = new Parser(
                        createBasicOptions(node.path,
                            this.options.raiseTypeError,
                            this.options.uri,
                            this.options.globalDeclarations),
                        content);
                }
            }
        } else if (includeFilePath instanceof Identifier &&
            this.searchParserNode && this.options.sourceFileName) {
            node.inc = includeFilePath;
            const thisNode = this.searchParserNode(this.options.sourceFileName);
            if (thisNode) {
                let incNode: ParserFileNode | undefined;
                thisNode.include.forEach(fileNode => {
                    if (fileNode.fileReferenceMark &&
                        fileNode.fileReferenceMark.mark.toLowerCase() ===
                        (includeFilePath as Identifier).name.toLowerCase()) {
                        incNode = fileNode;
                    }
                });
                if (incNode) {
                    node.parser = new Parser(
                        createBasicOptions(node.path,
                            this.options.raiseTypeError,
                            this.options.uri,
                            this.options.globalDeclarations),
                        incNode.content);
                    node.path = incNode.filePath;
                }
            }
        }
        if (node.parser) {
            if (metadata) {
                node.parser.options.sourceType = SourceType.metadata;
            }
            node.parser.fileName = node.parser.options.sourceFileName = node.path;
            node.file = node.parser.parse(this.scope.store, true);
            if (search) {
                search.file = node.file;
            }
            this.state.includes.set(node.path.toLowerCase(), node.file);
            this.scope.joinScope(node.file.scope);
            if (node.file.errors.length > 0) {
                this.raiseAtNode(
                    node.inc,
                    ErrorMessages["IncludeFileExistError"],
                    false
                );
            }
        }
        return node;
    }

    // #error text
    parsePreErrorStatement(): PreErrorStatement {
        const node = this.startNode(PreErrorStatement);
        this.next();
        const text = this.startNode(Expression);
        this.finishNode(text, "Expression");
        this.addExtra(text, "raw", this.input.slice(node.start, this.state.pos));
        node.text = text;
        return this.finishNode(node, "PreErrorStatement");
    }

    // #line sequence ["location"]
    parsePreLineStatement(): PreLineStatement {
        const node = this.startNode(PreLineStatement);
        this.next();
        node.sequence = this.parseNumericLiteral(this.state.value);
        if (this.match(tt.string)) {
            node.location = this.parseStringLiteral(this.state.value);
        }
        return this.finishNode(node, "PreLineStatement");
    }

    // #if expression
    //   [statements]
    // [#elif expression-n
    //   [elifstatements-n]] ...
    // [#else
    //   [elsestatements]]
    // #endif
    //
    parsePreIfStatement(): PreIfStatement {
        const node = this.startNode(PreIfStatement);
        this.next();
        node.test = this.parseExpression(undefined, true);
        node.consequent = this.parseBlock([ tt.pre_endif, tt.pre_elif, tt.pre_else ]);
        if (this.match(tt.pre_elif)) {
            node.alternate = this.parsePreIfStatement();
        } else if (this.match(tt._else)) {
            node.alternate = this.parseBlock(tt.pre_endif);
        }
        this.expect(tt.pre_endif);
        return this.finishNode(node, "PreIfStatement");
    }


    // Section
    checkEventSectionError(node: NodeBase): void {
        if (this.options.scriptFileType !== ScriptFileType.dms) {
            this.raiseAtNode(
                node,
                ErrorMessages["EventSectionCanOnlyUseInDms"],
                false,
            );
        }
    }

    parseEventBase<T extends EventSection>(
        callback: (node: T) => void,
        n: new (parser: ParserBase, pos: number, loc: Position) => T,
        eventName: string,
        checkEventName: boolean,
        allowDiscription: boolean
    ): T {
        const node = this.startNode(n);
        this.scope.enter(ScopeFlags.event);
        this.next();
        this.expect(tt.braceL);
        const name = this.parseIdentifier(true);
        if (checkEventName && !isEventName(name.name)) {
            this.raiseAtNode(
                name,
                ErrorMessages["InvalidEventName"],
                false
            );
        }
        if (this.eventNames.includes(name.name.toLowerCase())) {
            this.raiseAtNode(
                name,
                ErrorMessages["EventSectionNameRedeclared"],
                true);
        } else {
            this.eventNames.push(name.name.toLowerCase());
        }
        node.name = name;
        node.push(node.name);
        if (allowDiscription && this.match(tt.comma)) {
            this.next();
            if (!this.match(tt.string)) {
                this.raise(
                    this.state.pos,
                    ErrorMessages["ExpectToken"],
                    "字符串"
                );
                this.next();
            } else {
                node.description = this.expectAndParseStringLiteral();
                if (node.description) {
                    node.push(node.description);
                }
            }
        }
        this.expect(tt.braceR);
        callback(node);
        this.expect(tt._end);
        this.expectString(eventName);
        this.next();
        this.checkEventSectionError(node);
        this.scope.exit();
        return this.finishNode(node, `${eventName}Section`);
    }

    //
    // Event(name [, "description"])
    //    ...
    // End Event
    //
    //
    parseEventSection(): EventSection {
        return this.parseEventBase(
            node => {
                node.body = this.parseBlock(tt._end),
                node.push(node.body);
            },
            EventSection,
            "Event",
            true,
            true
        );
    }

    //
    // Logging(name [, "description"])
    //    Group = "Group"
    //    Path = "Path"
    //    Alias = "Alias"
    //    [FileSize = FileSize
    // End Logging
    //
    parseLoggingSection(): LoggingSection {
        return this.parseEventBase(
            node => {
                while (!this.match(tt._end)) {
                    const text = this.state.value.toLowerCase();
                    this.next();
                    this.expect(tt.equal);
                    switch (text) {
                        case "path":
                        case "group":
                        case "alias":
                            if (!this.match(tt.string)) {
                                this.raise(
                                    this.state.pos,
                                    ErrorMessages["ExpectToken"],
                                    "字符串"
                                );
                                this.next();
                            } else {
                                const val = this.parseStringLiteral(this.state.value);
                                node.push(val);
                                if (text === "path") {
                                    node.path = val;
                                } else if (text === "alias") {
                                    node.alias = val;
                                } else if (text === "group") {
                                    node.group = val;
                                }
                            }
                            break;
                        case "filesize":
                            if (!this.match(tt.number)) {
                                this.raise(
                                    this.state.pos,
                                    ErrorMessages["ExpectToken"],
                                    "数字"
                                );
                                this.next();
                            } else {
                                node.fileSize = this.parseNumericLiteral(this.state.value);
                                node.push(node.fileSize);
                            }
                            break;
                        default:
                            this.raise(
                                this.state.pos,
                                ErrorMessages["InvalidLoggingParameter"]
                            );
                            this.next();
                            break;
                    }
                }
            },
            LoggingSection,
            "Logging",
            false,
            true
        );
    }

    //
    //
    // Job(name [, "description"])
    //      [TempDirectory = "<Temp Directory>"]
    // End Job
    //
    parseJobSection(): JobSection {
        return this.parseEventBase(
            node => {
                if (this.match(tt.identifier)) {
                    const text = this.state.value;
                    if (text.toLowerCase() === "tempdirectory") {
                        this.next();
                        this.expect(tt.equal);
                        node.tempDirectory = this.expectAndParseStringLiteral();
                        if (node.tempDirectory) {
                            node.push(node.tempDirectory);
                        }
                    }
                }
            },
            JobSection,
            "Job",
            false,
            true
        );
    }

    //
    // InputDataSource(name [", description"])
    //    ConnectionString = "<connection_string>"
    //    [SelectQuery = "<select_query>"]
    //    [UpdateQuery = "<update_query>"]
    //    [UseInputAsOutput = True | False"]
    //    [JoinKey = "<variable_name>"]
    //    [JoinType = "Full" | "Inner" | "Left"]
    //    [JoinKeySorted = True | False"]
    // End InputDataSource
    //
    parseInputDataSourceSection(): InputDataSourceSection {
        return this.parseEventBase(
            node => {
                let hasConnStr = false;
                while (!this.match(tt._end)) {
                    const text = this.state.value.toLowerCase();
                    this.next();
                    this.expect(tt.equal);
                    let value;
                    switch (text) {
                        case "connectionstring":
                        case "selectquery":
                        case "updatequery":
                        case "joinkey":
                            value = this.parseExpression();
                            if (text === "connectionstring") {
                                hasConnStr = true;
                                node.connectionString = value;
                            } else if (text === "joinkey") {
                                node.joinKey = value;
                            } else if (text === "selectquery") {
                                node.selectQuery = value;
                            } else {
                                node.updateQuery = value;
                            }
                            break;

                        case "useinputasoutput":
                        case "joinkeysorted":
                            if (!this.match(tt._true) && !this.match(tt._false)) {
                                this.raise(
                                    this.state.pos,
                                    ErrorMessages["ExpectToken"],
                                    " 'True' 或 'False'"
                                );
                                this.next();
                                break;
                            }
                            value = this.parseExpression();
                            if (text === "joinkeysorted") {
                                node.joinKeySorted = value;
                            } else {
                                node.useInputAsOutput = value;
                            }
                            break;

                        case "jointype":
                            value = this.state.value.toLowerCase();
                            if (value !== "full" && value !== "inner" && value !== "left") {
                                this.raise(
                                    this.state.pos,
                                    ErrorMessages["ExpectToken"],
                                    "'Full' 或 'Inner' 或 'Left'"
                                );
                                this.next();
                                break;
                            }
                            node.joinType = this.expectAndParseStringLiteral();
                            break;

                        default:
                            this.raise(
                                this.state.pos,
                                ErrorMessages["InvalidEventParam"]
                            );
                            this.next();
                            break;
                    }
                }
                if (!hasConnStr) {
                    this.raiseAtNode(
                        node,
                        ErrorMessages["EventNeedParam"],
                        false,
                        "ConnectionString"
                    );
                }
            },
            InputDataSourceSection,
            "InputDataSource",
            false,
            true
        );
    }

    // OutputDataSource(name [, "description"])
    //    [ConnectionString = "<connection_string> | UseInputAsOutput = True|False"]
    //    [MetaDataOutputName = "<metadata_location>"]
    //    [UpdateQuery = "<update_query>"]
    //    [TableOutputName = "<table_output_name>"]
    //    [VariableOrder = "SELECTORDER"]
    // End OutputDataSource
    //
    //
    //
    parseOutputDataSourceSection(): OutputDataSourceSection {
        return this.parseEventBase(
            node => {
                let hasConnStr = false;
                const hasinputAsOutput = false;
                let order;
                while (!this.match(tt._end)) {
                    const text = this.state.value.toLowerCase();
                    this.next();
                    this.expect(tt.equal);
                    switch (text) {
                        case "connectionstring":
                        case "metadataoutputname":
                        case "updatequery":
                        case "tableoutputname":
                            if (text === "connectionstring") {
                                if (hasinputAsOutput) {
                                    this.raise(
                                        this.state.pos,
                                        ErrorMessages["EventParamCantSetMeanwhile"],
                                        "ConnectionString 和 UseInputAsOutput"
                                    );
                                    this.next();
                                } else {
                                    node.connStrOrUseInputAsOutput = this.parseExpression();
                                    hasConnStr = true;
                                }
                            } else if (text === "metadataoutputname") {
                                node.metaDataOutputName = this.parseExpression();
                            } else if (text === "tableoutputname") {
                                node.tableOutputName = this.parseExpression();
                            } else {
                                node.updateQuery = this.parseExpression();
                            }
                            break;

                        case "variableorder":
                            order = this.state.value.toUpperCase();
                            if (order === "SELECTORDER" && this.match(tt.string)) {
                                node.variableOrder = "SELECTORDER";
                            } else {
                                this.raise(
                                    this.state.pos,
                                    ErrorMessages["ExpectToken"],
                                    "SELECTORDER"
                                );
                            }
                            this.next();
                            break;

                        case "useinputasoutput":
                            if (hasConnStr) {
                                this.raise(
                                    this.state.pos,
                                    ErrorMessages["EventParamCantSetMeanwhile"],
                                    "ConnectionString 和 UseInputAsOutput"
                                );
                                this.next();
                            } else {
                                if (!this.match(tt._true) && !this.match(tt._false)) {
                                    this.raise(
                                        this.state.pos,
                                        ErrorMessages["ExpectToken"],
                                        " 'True' 或 'False'"
                                    );
                                    this.next();
                                    break;
                                }
                                node.connStrOrUseInputAsOutput = this.parseExpression();
                            }
                            break;

                        default:
                            this.raise(
                                this.state.pos,
                                ErrorMessages["InvalidEventParam"]
                            );
                            this.next();
                            break;
                    }
                }
            },
            OutputDataSourceSection,
            "OutputDataSource",
            false,
            true
        );
    }

    //
    // GlobalSQLVariables(name [, "description"])
    //    ConnectionString = "<connection_string>"
    //    SelectQuery = "<select_query>"
    // End GlobalSQLVariables
    //
    parseGlobalSQLVariablesSection(): GlobalSQLVariablesSection {
        return this.parseEventBase(
            node => {
                while (!this.match(tt._end)) {
                    const text = this.state.value.toLowerCase();
                    this.next();
                    this.expect(tt.equal);
                    let val;
                    switch (text) {
                        case "connectionstring":
                        case "selectquery":
                            val = this.parseExpression();
                            if (text === "connectionstring") {
                                node.connectionString = val;
                            } else {
                                node.selectQuery = val;
                            }
                            break;

                        default:
                            this.raise(
                                this.state.pos,
                                ErrorMessages["InvalidEventParam"]
                            );
                            this.next();
                            break;
                    }
                }
            },
            GlobalSQLVariablesSection,
            "GlobalSQLVariables",
            false,
            true
        );
    }

    //
    // MetaData
    //

    checkAndParseIdentifierOrString(check: string[]) {
        const text = this.state.value.toLowerCase();
        if (check.includes(text)) {
            return this.match(tt.identifier) ? this.parseIdentifier() :
                this.parseStringLiteral(this.state.value);
        } else {
            if (this.match(tt.identifier)) {
                return this.parseIdentifier();
            } else {
                this.raise(
                    this.state.pos,
                    ErrorMessages["MetadataInvalidLanguage"]
                );
                this.next();
            }
        }
    }

    parseMetadataSection() {
        const node = this.startNode(MetadataSection);
        this.next();
        if (this.eat(tt.braceL)) {
            if (this.matchOne([ tt.identifier, tt.string ])) {
                const ahead = this.lookahead();
                if (ahead.type === tt.comma || ahead.type === tt.braceR) {
                    node.language = this.checkAndParseIdentifierOrString(MetadataLanguageCodes);
                } else {
                    const start = this.state.pos;
                    const startPos = this.state.curPostion();
                    while (!this.matchOne([ tt.comma, tt.braceR ])) {
                        this.next();
                    }
                    const lang = this.input.slice(start, this.state.pos);
                    const langId = new Identifier(this, this.state.pos, this.state.curPostion());
                    langId.start = start;
                    langId.loc.start = startPos;
                    this.addExtra(langId, "raw", lang);
                    node.language = langId;
                }
            }
            if (this.eat(tt.comma) && this.matchOne([ tt.identifier, tt.string ])) {
                node.context = this.checkAndParseIdentifierOrString(MetadataUserContexts);
            }
            if (this.eat(tt.comma) && this.matchOne([ tt.identifier, tt.string ])) {
                node.labelType = this.checkAndParseIdentifierOrString(MetadataLabelTypes);
            }
            if (this.eat(tt.comma) && this.match(tt.identifier)) {
                node.dataSource = this.parseIdentifier();
                if (!this.eventNames.includes(node.dataSource.name.toLowerCase())) {
                    this.raiseAtNode(
                        node.dataSource,
                        ErrorMessages["EventSectionNotDeclared"],
                        false,
                        node.dataSource.name
                    );
                }
            }
            this.expect(tt.braceR);
        }
        node.body = this.parseMetadata(tt._end);
        this.expect(tt._end);
        this.expectString("metadata");
        this.next();
        return this.finishNode(node, "MetadataSection");
    }


    raiseErrorAndSkipLine(node: NodeBase, template: ErrorTemplate, ...params: any) {
        this.raiseAtNode(node, template, false, params);
        while (!this.hasPrecedingLineBreak()) {
            this.next();
        }
    }

    parsePropertyList<T extends NodeBase>(
        close: TokenType = tt.braceR,
        node: T,
        callback: (node: T) => void) {
        let comma = false;
        while (this.eat(close)) {
            if (this.match(tt.comma)) {
                if (comma) {
                    this.raise(
                        this.state.pos,
                        ErrorMessages["UnexpectedToken"],
                        ","
                    );
                }
                comma = true;
                this.next();
            } else {
                callback(node);
            }
        }
    }

    // <property> ::= Name = Value
    parseMetaCustomProperty(): MetadataProperty {
        const node = this.startNode(MetadataProperty);
        node.name = this.parseIdentifier();
        if (this.match(tt.colon)) {
            this.next();
            this.expect(tt.bracketL);
            node.propValue = this.parseMetaCustomProperties();
        } else if (this.match(tt.braceL)) {
            this.next();
            node.propValue = this.parseMetaCustomProperties(tt.braceR);
        } else {
            this.expect(tt.equal);
            node.propValue = this.parseExpression();
        }
        return this.finishNode(node, "MetadataProperty");
    }

    // <Properties> ::= ( [ AreaName: ] [ <property> (, <property> )* ] )*
    parseMetaCustomProperties(close: TokenType = tt.bracketR): MetadataProperty[] {
        const props: MetadataProperty[] = [];
        this.next();
        while (!this.eat(close)) {
            if (this.match(tt.comma)) {
                this.next();
            }
            if (!this.match(close)) {
                props.push(this.parseMetaCustomProperty());
            }
        }
        return props;
    }

    //
    // Style ( Color = "Blue", ElementAlign = Right, Hidden = False )
    //
    parseStyle(): MetadataStyle {
        const node = this.startNode(MetadataStyle);
        this.next();
        this.expect(tt.braceL);
        this.parsePropertyList(
            tt.braceR,
            node,
            node => {
                const id = this.parseIdentifier();
                const value = this.parseStyleAtom(id);
                this.setNodePropValue(node, id.name, value);
            }
        );
        return this.finishNode(node, "MetadataStyle");
    }

    parseStyleAtom(id: Identifier) {
        const name = id.name.toLowerCase();
        this.expect(tt.equal);
        let enumVal;
        switch (name) {

            case "cell":    return this.parseCellStyle();
            case "control": return this.parseControlStyle();
            case "font":    return this.parseFontStyle();

            case "align":
            case "cursor":
            case "elementalign":
            case "imageposition":
            case "orientation":
            case "verticalalign":
                enumVal = this.parseIdentifier();
                if (this.checkMetaEnumValue(enumVal, MetadataEnumText[name])) {
                    return enumVal;
                }
                return;

            case "bgcolor":
            case "color":
            case "height":
            case "image":
            case "width":
                return this.expectAndParseStringLiteral();

            case "columns":
            case "indent":
            case "rows":
            case "zindex":
                return this.expectAndParseNumericLiteral();

            case "hidden":
                return this.expectAndParseBooleanLiteral();

            default:
                this.next();
                this.raiseAtNode(
                    id,
                    ErrorMessages["UnknownMetadataProperty"],
                    false,
                    id.name
                );
                return;
        }
    }

    //
    // Cell = Double (默认属性是BorderStyle)
    // Cell ( BorderColor = "Blue", BorderStyle = Double )
    //
    parseCellStyle(): MetadataCellStyle {
        const node = this.startNode(MetadataCellStyle);
        this.next();
        if (this.eat(tt.equal)) {
            const enumVal = this.parseIdentifier();
            if (this.checkMetaEnumValue(enumVal, MetadataEnumText["borderstyle"])) {
                node.borderStyle = enumVal;
            }
        } else {
            this.expect(tt.braceL);
            this.parsePropertyList(
                tt.braceR,
                node,
                node => {
                    const id = this.parseIdentifier();
                    const val = this.parseCellStyleAtom(id);
                    this.setNodePropValue(node, id.name, val);
                }
            );
        }
        return this.finishNode(node, "MetadataCellStyle");
    }

    parseCellStyleAtom(id: Identifier) {
        const name = id.name.toLowerCase();
        this.expect(tt.equal);
        let enumVal;
        switch (name) {
            case "bgcolor":
            case "borderbottomcolor":
            case "bordercolor":
            case "borderleftcolor":
            case "borderrightcolor":
            case "bordertopcolor":
            case "height":
            case "width":
                return this.expectAndParseStringLiteral();

            case "borderbottomwidth":
            case "borderleftwidth":
            case "borderrightwidth":
            case "bordertopwidth":
            case "borderwidth":
            case "colspan":
            case "padding":
            case "paddingbottom":
            case "paddingleft":
            case "paddingright":
            case "paddingtop":
            case "repeatheader":
            case "rowspan":
                return this.expectAndParseNumericLiteral();

            case "borderbottomstyle":
            case "borderleftstyle":
            case "borderrightstyle":
            case "borderstyle":
            case "bordertopstyle":
                enumVal = this.parseIdentifier();
                if (!this.checkMetaEnumValue(enumVal, MetadataEnumText[name])) {
                    return;
                }
                return enumVal;

            case "wrap":
                return this.expectAndParseBooleanLiteral();

            default:
                this.next();
                this.raiseAtNode(
                    id,
                    ErrorMessages["UnknownMetadataProperty"],
                    false,
                    id.name
                );
                return;
        }
    }

    //
    // Control = ListBox (默认属性是Type)
    // Control ( Accelerator = "R", Type = ListBox )
    //
    parseControlStyle(): MetadataControlStyle {
        const node = this.startNode(MetadataControlStyle);
        this.next();
        if (this.eat(tt.equal)) {
            const type = this.parseIdentifier();
            if (this.checkMetaEnumValue(type, MetadataEnumText["type"])) {
                node.controlType = type;
            }
        } else {
            this.expect(tt.braceL);
            this.parsePropertyList(
                tt.braceR,
                node,
                node => {
                    const id = this.parseIdentifier();
                    const value = this.parseControlStyleAtom(id);
                    if (id.name.toLowerCase() === "type") {
                        node.controlType = value as Identifier;
                    } else {
                        this.setNodePropValue(node, id.name, value);
                    }
                }
            );
        }
        return this.finishNode(node, "MetadataControlStyle");
    }

    parseControlStyleAtom(id: Identifier) {
        const name = id.name.toLowerCase();
        this.expect(tt.equal);
        let enumValue;
        switch (name) {
            case "accelerator":
                return this.expectAndParseStringLiteral();
            case "readonly":
                return this.expectAndParseBooleanLiteral();
            case "type":
                enumValue = this.parseIdentifier();
                if (!this.checkMetaEnumValue(enumValue, MetadataEnumText["type"])) {
                    return;
                }
                return enumValue;
            default:
                this.next();
                this.raiseAtNode(
                    id,
                    ErrorMessages["UnknownMetadataProperty"],
                    false,
                    id.name
                );
                return;
        }
    }

    //
    // Font = "Arial" (默认是Family)
    // Font ( Family = "Arial", IsBold = True, Size = 12 )
    //
    parseFontStyle(): MetadataFontStyle {
        const node = this.startNode(MetadataFontStyle);
        this.next();
        if (this.eat(tt.equal)) {
            node.family = this.expectAndParseStringLiteral();
        } else {
            this.expect(tt.braceL);
            this.parsePropertyList(
                tt.braceR,
                node,
                node => {
                    const id = this.parseIdentifier();
                    const atom = this.parseFontStyleAtom(id);
                    this.setNodePropValue(node, id.name, atom);
                }
            );
        }
        return this.finishNode(node, "MetadataFontStyle");
    }

    parseFontStyleAtom(id: Identifier) {
        const name = id.name.toLowerCase();
        this.expect(tt.equal);
        switch (name) {
            case "family":
                return this.expectAndParseStringLiteral();
            case "isblink":
            case "isbold":
            case "isitalic":
            case "isoverline":
            case "isstrikethrough":
            case "issubscript":
            case "issuperscript":
            case "isunderline":
                return this.expectAndParseBooleanLiteral();
            case "size":
                return this.expectAndParseNumericLiteral();
            default:
                this.next();
                this.raiseAtNode(
                    id,
                    ErrorMessages["UnknownMetadataProperty"],
                    false,
                    id.name
                );
                return;
        }
    }

    checkMetaEnumValue(id: Identifier, enumDefs: string[]) {
        const text = id.name.toLowerCase();
        if (enumDefs.includes(text)) {
            return true;
        }
        this.raiseAtNode(
            id,
            ErrorMessages["InvalidEnumIdentifier"],
            false
        );
        return false;
    }

    parseTemplateAtom(id: Identifier) {
        const name = id.name.toLowerCase();
        this.expect(tt.equal);
        switch (name) {
            case "banner":
            case "error":
            case "layout":
            case "navbar":
            case "question":
                return this.expectAndParseStringLiteral();

            default:
                this.next();
                this.raiseAtNode(
                    id,
                    ErrorMessages["UnknownMetadataProperty"],
                    false,
                    id.name
                );
                return;
        }
    }

    parseTemplate(): MetadataTemplates {
        const node = this.startNode(MetadataTemplates);
        this.expect(tt.braceL);
        this.parsePropertyList(
            tt.braceR,
            node,
            node => {
                const id = this.parseIdentifier();
                const atom = this.parseTemplateAtom(id);
                this.setNodePropValue(node, id.name, atom);
            }
        );
        return this.finishNode(node, "MetadataTemplate");
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    //
    parseMetadataFieldHeader(): MetadataFieldHeadDefinition {
        const node = this.startNode(MetadataFieldHeadDefinition);
        node.name = this.parseIdentifier();
        while (!this.checkIfHeaderEnd()) {
            this.parseMetadataFieldHeaderAtom(node);
        }
        return this.finishNode(node, "MetadataFieldHeaderDefinition");
    }

    parseMetadataFieldHeaderAtom(
        node: MetadataFieldHeadDefinition) {
        let propId, propName;
        switch (this.state.type) {
            case tt.string:
                node.label = this.parseStringLiteral(this.state.value);
                return;
            case tt.bracketL:
                node.properties = this.parseMetaCustomProperties();
                return;
            case tt.identifier:
                propId = this.parseIdentifier();
                propName = propId.name.toLowerCase();
                if (propName === "style") {
                    node.style = this.parseStyle();
                } else if (propName === "labelstyle") {
                    node.labelStyle = this.parseStyle();
                } else if (propName === "templates") {
                    node.templates = this.parseTemplate();
                } else {
                    this.unexpected();
                    while (!this.hasPrecedingLineBreak()) {
                        this.next();
                    }
                }
                return;

            default:
                this.unexpected();
                while (!this.hasPrecedingLineBreak()) {
                    this.next();
                }
                return;
        }
    }

    checkIfHeaderEnd() {
        const text = this.state.value.toLowerCase();
        return MetadataFieldValueType.includes(text);
    }

    // <label> ::= ( [ AreaName: ] ( "Label-text" | - ) )*
    parseMetadataLabel(): MetadataLabel {
        const node = this.startNode(MetadataLabel);
        const next = this.lookaheadCharCode();
        if (this.match(tt.identifier) && next === charCodes.colon) {
            node.areaName = this.parseIdentifier();
            this.next();
        }
        if (this.match(tt.string)) {
            node.label = this.parseStringLiteral(this.state.value);
        } else if (next === charCodes.dash) {
            node.label = this.parseIdentifier();
        } else {
            this.unexpected();
        }
        return this.finishNode(node, "MetadataLabel");
    }

    // AreaName lcl ( [language] [, [user-context] [, [label-type] ]] )
    parseMetadataAreaName(): MetadataAreaName {
        const node = this.startNode(MetadataAreaName);
        node.areaName = this.parseIdentifier();
        this.expect(tt.identifier);
        this.expect(tt.braceL);
        let param = 1;
        while (!this.match(tt.braceR)) {
            if (this.match(tt.identifier)) {
                const id = this.parseIdentifier();
                switch (param) {
                    case 1:
                        if (MetadataLanguageCodes.includes(id.name.toUpperCase())) {
                            node.language = id;
                        } else {
                            this.raiseAtNode(
                                id,
                                ErrorMessages["MetadataInvalidLanguage"],
                                false);
                        }
                        break;
                    case 2:
                        if (MetadataUserContexts.includes(id.name.toLowerCase())) {
                            node.context = id;
                        } else {
                            this.raiseAtNode(
                                id,
                                ErrorMessages["MetadataInvalidUserContext"],
                                false
                            );
                        }
                        break;
                    case 3:
                        if (MetadataLabelTypes.includes(id.name.toLowerCase())) {
                            node.labelType = id;
                        } else {
                            this.raiseAtNode(
                                id,
                                ErrorMessages["MetadataInvalidLabelType"],
                                false
                            );
                        }
                        break;
                    default:
                        this.raiseAtNode(
                            id,
                            ErrorMessages["IncorrectFunctionArgumentNumber"],
                            false,
                            "AreaName",
                            3,
                            param
                        );
                        this.next();
                        break;
                }
            } else if (this.match(tt.comma)) {
                this.next();
                param++;
            } else {
                this.unexpected();
                this.next();
            }
        }
        this.expect(tt.braceR);
        return this.finishNode(node, "MetadataAreaName");
    }

    parseMetadataRangeBase(
        close: TokenType[] = [ tt.bracketR ],
        allowExclude?: boolean,
        allowStep?: boolean,
        allowSingle?: boolean) {
        const node = this.startNode(MetadataRange);
        let hasEllipse = false;
        const single = true;
        while (!this.matchOne(close)) {
            if (this.match(tt.caret)) {
                if (allowExclude) {
                    node.exclude = true;
                } else {
                    this.raise(
                        this.state.pos,
                        ErrorMessages["MetadataRangeDontAllowExclude"]
                    );
                }
                this.next();
            } else if (this.match(tt.dot)) {
                hasEllipse = true;
                this.next();
                this.expect(tt.dot);
            } else if (this.match(tt._step)) {
                this.next();
                const step = this.expectAndParseNumericLiteral(true);
                if (allowStep) {
                    node.step = step;
                } else {
                    this.raise(
                        this.state.pos,
                        ErrorMessages["MetadataRangeDontAllowStep"]
                    );
                }
            } else {
                const val = this.expectAndParseNumericLiteral();
                if (hasEllipse) {
                    node.max = val;
                } else {
                    node.min = val;
                }
            }
        }
        if (allowSingle && single) {
            node.single = true;
        }
        if (!allowSingle && single) {
            this.raiseAtNode(
                node,
                ErrorMessages["MetadataRangeDontAllowSingle"],
                false);
        }
        return this.finishNode(node, "MetadataRange");
    }

    parseMetadataRanges(
        allowExclude?: boolean,
        allowStep?: boolean,
        allowSingle?: boolean
    ): MetadataRange {
        const node = this.startNode(MetadataRange);
        // 跳过'['
        this.next();
        while (!this.eat(tt.bracketR)) {
            const sub = this.parseMetadataRangeBase(
                [ tt.bracketR, tt.comma ],
                allowExclude, allowStep, allowSingle);
            if (this.match(tt.comma)) {
                node.sub?.push(sub);
                this.next();
            } else {
                node.min = sub.min;
                node.max = sub.max;
                node.single = sub.single;
                node.step = sub.step;
                node.exclude = sub.exclude;
            }
        }
        return this.finishNode(node, "MetadataRange");
    }

    parseMetadataFieldTypeDefinition(
        allowExclude?: boolean, allowStep?: boolean, allowSingle?: boolean
    ): MetadataFieldTypeDefinition {
        const node = this.startNode(MetadataFieldTypeDefinition);
        node.typeKw = this.parseIdentifier(true);
        this.skipSpace();
        if (this.match(tt.bracketL)) {
            node.range = this.parseMetadataRanges(allowExclude, allowStep, allowSingle);
        }
        if (!MetadataRangeAllowedType.includes(node.typeKw.name.toLowerCase()) && node.range) {
            this.raiseAtNode(node.range, ErrorMessages["MetadataDontAllowValueRange"], false);
        }
        return this.finishNode(node, "MetadataFieldTypeDefinition");
    }

    parseMetadataUsageType(): MetadataUsageType {
        const node = this.startNode(MetadataUsageType);
        this.expect(tt.braceL);
        if (this.match(tt.string)) {
            const str = this.state.value.toLowerCase();
            node.usageTypeValue = MetadataUsageTypeValues[str];
            if (!node.usageTypeValue) {
                this.raise(
                    this.state.pos,
                    ErrorMessages["MetadataInvalidUsageType"]
                );
            }
            this.next();
            this.expect(tt.braceR);
        } else {
            this.raise(
                this.state.pos,
                ErrorMessages["ExpectToken"],
                "字符串"
            );
            while (!this.eat(tt.braceR)) {
                this.next();
            }
        }
        return this.finishNode(node, "MetadataUsageType");
    }

    parseMetadataSingleHead(close: TokenType | TokenType[]) {
        const node = this.startNode(MetadataSingleHead);
        node.name = this.parseIdentifier();
        while (!this.matchOne(close)) {
            switch (this.state.type) {

                case tt.string:
                    node.label = this.parseStringLiteral(this.state.value);
                    break;

                case tt.identifier:
                    if (this.checkIfHeaderEnd()) {
                        node.typeDef = this.parseMetadataFieldTypeDefinition();
                    } else if (this.state.value.toLowerCase() === "usagetype") {
                        node.usageType = this.parseMetadataUsageType();
                    } else {
                        this.unexpected();
                        this.next();
                    }
                    break;

                default:
                    this.unexpected();
                    this.next();
                    break;
            }
        }
        return this.finishNode(node, "MetadataSingleHead");
    }

    // helperfields ( <field> (; <field> )* [;] )
    parseMetadataHelperFields(): MetadataHelpFields {
        const node = this.startNode(MetadataHelpFields);
        this.next();
        this.expect(tt.braceL);
        while (!this.eat(tt.braceR)) {
            node.fields.push(this.parseMetadataSingleHead([ tt.braceR, tt.semi ]));
            if (this.match(tt.semi)) {
                this.next();
            }
        }
        return this.finishNode(node, "MetadataHelperFields");
    }

    // axis ( "axis_spec" )
    parseMetadataAxisExpression(): MetadataAxisExpression {
        const node = this.startNode(MetadataAxisExpression);
        this.expect(tt.braceL);
        node.expression = this.expectAndParseStringLiteral();
        this.expect(tt.braceR);
        return this.finishNode(node, "MetadataAxisExpression");
    }

    // expression ("expression_text"[, ( deriveelements | noderiveelements ) ])
    parseMetadataSingleExpression(): MetadataExpression {
        const node = this.startNode(MetadataExpression);
        this.expect(tt.braceL);
        node.script = this.expectAndParseStringLiteral();
        if (this.eat(tt.comma)) {
            const param = this.parseIdentifier();
            const val = param.name.toLowerCase();
            if (val === "deriveelements") {
                node.deriveelements = param;
            } else if (val === "noderiveelements") {
                node.noderiveelements = param;
            } else {
                this.raiseAtNode(
                    param,
                    ErrorMessages["ExpectToken"],
                    false,
                    "deriveelements或noderiveelements"
                );
            }
        }
        this.expect(tt.braceR);
        return this.finishNode(node, "MetadataExpression");
    }

    // validation ("validation_text")
    parseMetadataValidation(): MetadataValidation {
        const node = this.startNode(MetadataValidation);
        this.expect(tt.braceL);
        node.regex = this.expectAndParseStringLiteral();
        this.expect(tt.braceR);
        return this.finishNode(node, "MetadataValidation");
    }

    // [ validation ("validation_text") ]
    // [ expression ("expression_text") ]
    // [ ( initialanswer | defaultanswer ) (integer|text|boolean) ]
    // [ <axis> ]
    // [ <usage-type> ]
    // [ <helperfields> ]
    // [ nocasedata ]
    // [ unversioned ]
    //
    parseMetadataFieldTail(
        type?: "categorical" | "boolean" | "text" | "number"
    ): MetadataFieldTailDefinition {
        const node = this.startNode(MetadataFieldTailDefinition);
        while (!this.matchOne([ tt.semi, tt.braceR ])) {
            this.parseMetadataFieldTailAtom(node, type);
        }
        return this.finishNode(node, "MetadataFieldTailDefinition");
    }

    parseMetadataFieldTailAtom(
        node: MetadataFieldTailDefinition,
        type?: "categorical" | "boolean" | "text" | "number"
    ) {
        if (this.match(tt.identifier)) {
            const id = this.parseIdentifier();
            const kw = id.name.toLowerCase();
            let val;
            switch (kw) {
                case "axis":
                    node.axis = this.parseMetadataAxisExpression();
                    break;
                case "expression":
                    node.expression = this.parseMetadataSingleExpression();
                    break;
                case "helperfields":
                    node.helperfields = this.parseMetadataHelperFields();
                    break;
                case "usagetype":
                    node.usagetype = this.parseMetadataUsageType();
                    break;
                case "validation":
                    node.validation = this.parseMetadataValidation();
                    break;
                case "nocasedata":
                    node.nocasedata = this.parseIdentifier();
                    break;
                case "unversioned":
                    node.unversioned = this.parseIdentifier();
                    break;

                case "initialanswer":
                case "defaultanswer":
                    if (!type) {
                        this.unexpected();
                        this.next();
                        break;
                    }
                    this.next();
                    this.expect(tt.braceL);
                    val;
                    if (type === "number") {
                        val = this.expectAndParseNumericLiteral();
                    } else if (type === "boolean") {
                        val = this.expectAndParseBooleanLiteral();
                    } else if (type === "text") {
                        val = this.expectAndParseStringLiteral();
                    } else {
                        val = this.parseCategoricalLiteral();
                    }
                    if (kw === "defaultanswer") {
                        node.defaultanswer = val;
                    } else {
                        node.initialanswer = val;
                    }
                    this.expect(tt.braceR);
                    break;

                default:
                    this.raise(
                        this.state.pos,
                        ErrorMessages["MetadataUnkownProperty"]
                    );
                    this.next();
                    break;
            }
        } else {
            this.unexpected();
        }
    }

    //
    // <other> ::= other [ ( (use "helper_field_name")
    //                        | (helper_field_name "label" variable_type) ) ]
    // <multiplier> ::= multiplier ( (use "helper_field_name")
    //                                | (helper_field_name "label" variable_type) )
    //
    parseMetadataCategoryOtherOrMultiplier(): MetadataCategoryOtherOrMultiplier {
        const node = this.startNode(MetadataCategoryOtherOrMultiplier);
        if (this.match(tt.braceL)) {
            this.next();
            if (this.match(tt.identifier)) {
                const kw = this.state.value.toLowerCase();
                if (kw === "use") {
                    this.next();
                    node.specify = this.expectAndParseStringLiteral();
                } else {
                    node.specify = this.parseMetadataSingleHead(tt.braceR);
                }
            } else {
                this.unexpected(undefined, undefined, tt.identifier);
            }
            this.expect(tt.braceR);
        }
        return this.finishNode(node, "MetadataCategoryOtherOrMultiplier");
    }

    //
    // elementtype
    // AnalysisBase
    // AnalysisCategory
    // AnalysisMaximum
    // AnalysisMean
    // AnalysisMinimum
    // AnalysisSampleVariance
    // AnalysisStdDev
    // AnalysisStdErr
    // AnalysisSubHeading
    // AnalysisSubTotal
    // AnalysisSummaryData
    // AnalysisTotal
    parseMetadataCategoryElementType(): MetadataCategoryElementType {
        const node = this.startNode(MetadataCategoryElementType);
        this.expect(tt.braceL);
        if (this.matchOne([ tt.identifier, tt.string ])) {
            const typeVal = this.match(tt.identifier) ?
                this.parseIdentifier() :
                this.parseStringLiteral(this.state.value);
            if (!MetadataCategoryElementTypeValues.includes(
                    typeVal instanceof Identifier ?
                    typeVal.name.toLowerCase() : typeVal.extra["raw"].toLowerCase()
                )) {
                this.raiseAtNode(
                    typeVal,
                    ErrorMessages["MetadataInvalidCategoryElementType"],
                    false,
                );
            } else {
                node.elementType = typeVal;
            }
        } else {
            this.unexpected(undefined, undefined, tt.identifier);
        }
        this.expect(tt.braceR);
        return this.finishNode(node, "MetadataCategoryElementType");
    }

    // [ "category_label" ]
    // [ <other> | <multiplier> | DK | REF | NA ]
    // [ exclusive ]
    // [ factor (factor_value) ]
    // [ keycode ("keycode_value") ]
    // [ expression ("exp_text") ]
    // [ elementtype (type_value) ]
    // [ fix ]
    // [ nofilter ]
    //
    parseMetadataCategorySuffixAtom(node: MetadataCategory) {
        if (this.match(tt.string)) {
            node.label = this.parseStringLiteral(this.state.value);
        } else if (this.match(tt.identifier)) {
            const id = this.parseIdentifier();
            const name = id.name.toLowerCase();
            switch (name) {
                case "other":
                    node.other = this.parseMetadataCategoryOtherOrMultiplier();
                    break;
                case "multiplier":
                    node.multiplier = this.parseMetadataCategoryOtherOrMultiplier();
                    break;
                case "elementtype":
                    node.elementType = this.parseMetadataCategoryElementType();
                    break;
                case "expression":
                    node.expression = this.parseMetadataSingleExpression();
                    break;
                case "factor":
                    this.expect(tt.braceL);
                    node.factor = this.expectAndParseNumericLiteral();
                    this.expect(tt.braceR);
                    break;
                case "keycode":
                    this.expect(tt.braceL);
                    if (this.match(tt.string)) {
                        node.keycode = this.parseStringLiteral(this.state.value);
                    } else if (this.match(tt.number)) {
                        node.keycode = this.parseNumericLiteral(this.state.value);
                    } else if (this.match(tt.plusMin)) {
                        node.keycode = this.expectAndParseNumericLiteral();
                    } else if (this.matchOne([ tt._true, tt._false ])) {
                        node.keycode = this.expectAndParseBooleanLiteral();
                    } else {
                        this.unexpected();
                        this.next();
                    }
                    this.expect(tt.braceR);
                    break;

                case "dk":        node.dk = id;        break;
                case "ref":       node.ref = id;       break;
                case "na":        node.na = id;        break;
                case "exclusive": node.exclusive = id; break;
                case "fix":       node.fix = id;       break;
                case "nofilter":  node.nofilter = id;  break;

                default:
                    this.unexpected();
                    break;
            }
        } else if (this.match(tt.bracketL)) {
            node.property = this.parseMetaCustomProperties();
        } else if (this.match(tt.curlyL)) {
            node.group = this.parseMetadataCategories();
        } else {
            this.unexpected();
            this.next();
        }
    }

    //
    // <category> ::= category_name
    //               [ "category_label" ]
    //               [ <other> | <multiplier> | DK | REF | NA ]
    //               [ exclusive ]
    //               [ factor (factor_value) ]
    //               [ keycode ("keycode_value") ]
    //               [ expression ("exp_text") ]
    //               [ elementtype (type_value) ]
    //               [ fix ]
    //               [ nofilter ]
    //
    //
    parseMetadataCategory(): MetadataCategory {
        const node = this.startNode(MetadataCategory);
        const ahead = this.lookahead();
        //
        // <category> ::= [ list_name ]
        //                use define_list
        //                [ sublist [ rot[ate] | ran[domize] | rev[erse] |
        //                    asc[ending] | desc[ending] ] ]
        //                [ "list_label" ]
        //                [ fix ]
        //
        if (this.state.value.toLowerCase() === "use" || (
            ahead.type === tt.identifier && ahead.value.toLowerCase() === "use")) {
            node.useList = this.parseMetadataCategoryUseList();
            return this.finishNode(node, "MetadataCategory");
        }
        if (this.state.value === "-") {
            node.name = "-";
            this.next();
        } else {
            node.name = this.parseIdentifier();
        }
        while (!this.matchOne([ tt.comma, tt.curlyR ])) {
            this.parseMetadataCategorySuffixAtom(node);
        }
        return this.finishNode(node, "MetadataCategory");
    }

    //
    // <category> ::= [ list_name ]
    //                use define_list
    //                [ sublist [ rot[ate] | ran[domize] | rev[erse] |
    //                    asc[ending] | desc[ending] ] ]
    //                [ "list_label" ]
    //                [ fix ]
    //
    parseMetadataCategoryUseList(): MetadataCategoryUseList {
        const node = this.startNode(MetadataCategoryUseList);
        const cur = this.state.value.toLowerCase();
        if ((this.match(tt.identifier) && cur !== "use") || cur === "-") {
            if (cur === "-") {
                node.listName = "-";
                this.next();
            } else {
                node.listName = this.parseIdentifier();
            }
        }
        this.expectString("use");
        this.next();
        if (node.listName) {
            this.expect(tt.backSlash);
            this.expect(tt.backSlash);
            this.expect(tt.dot);
        }
        node.useList = this.parseIdentifier();
        if (this.match(tt.identifier) &&
            this.state.value.toLowerCase() === "sublist") {
            node.subList = this.parseMetadataSublist();
        }
        if (this.match(tt.string)) {
            node.listLabel = this.parseStringLiteral(this.state.value);
        }
        if (this.match(tt.identifier) &&
            this.state.value.toLowerCase() === "fix") {
            node.fix = this.parseIdentifier();
        }
        return this.finishNode(node, "MetadataCategoryUseList");
    }

    parseMetadataSublist(): MetadataSubList {
        const node = this.startNode(MetadataSubList);
        this.next();
        const text = this.state.value.toLowerCase();
        if (this.match(tt.identifier) &&
            MetadataSublistSuffix.includes(text)) {
            const val = this.parseIdentifier();
            switch (text) {
                case "rot":
                case "rotate":
                    node.rotate = val;
                    break;
                case "ran":
                case "randomize":
                    node.randomize = val;
                    break;
                case "rev":
                case "reverse":
                    node.reverse = val;
                    break;
                case "asc":
                case "ascending":
                    node.ascending = val;
                    break;
                case "desc":
                case "descending":
                    node.descending = val;
                    break;
            }
        }
        return this.finishNode(node, "MetadataSubList");
    }

    parseMetadataCategoryList(): MetadataCategory[] {
        const categories: MetadataCategory[] = [];
        let comma = true;
        this.expect(tt.curlyL);
        let existCat: string[] = [];
        while (!this.eat(tt.curlyR)) {
            if (!comma) {
                this.unexpected(undefined, undefined, tt.comma);
            }
            const cat = this.parseMetadataCategory();
            if (cat.name instanceof Identifier) {
                const catName = cat.name.name.toLowerCase();
                if (existCat.includes(catName)) {
                    this.raiseAtNode(
                        cat,
                        ErrorMessages["MetadataCategoricalAlreadyExist"],
                        false,
                        cat.name.name
                    );
                } else {
                    existCat.push(catName);
                }
            }
            categories.push(cat);
            if (this.match(tt.comma)) {
                comma = true;
                if (this.lookahead().type === tt.curlyR) {
                    this.unexpected(undefined, undefined, tt.comma);
                }
                this.next();
            }
        }
        return categories;
    }

    // <categories> ::= { <category> (, <category>)* }
    //                  [ rot[ate] | ran[domize] | rev[erse] |
    //                      asc[ending] | desc[ending] ]
    //                  [ fix ]
    //                  [ namespace ]
    //
    parseMetadataCategories(): MetadataCategoryList {
        const node = this.startNode(MetadataCategoryList);
        node.categories = this.parseMetadataCategoryList();
        let existKw: string | undefined = undefined;
        let cur = this.state.value.toLowerCase();
        if (!MetadataSublistSuffix.includes(cur)) {
            return this.finishNode(node, "MetadataCategoryList");
        }
        while (!this.matchOne([ tt.semi, tt.braceR ])) {
            const kw = this.parseIdentifier();
            const kwVal = kw.name.toLowerCase();
            if (MetadataSublistSuffix.includes(kwVal) && existKw) {
                this.raiseAtNode(
                    kw,
                    ErrorMessages["MetadataKeyCantExistMeanwhile"],
                    false,
                    kwVal,
                    existKw);
                continue;
            }
            switch (kwVal) {
                case "rot":
                case "rotate":
                    node.rotate = kw;
                    existKw = kwVal;
                    break;
                case "ran":
                case "randomize":
                    node.randomize = kw;
                    existKw = kwVal;
                    break;
                case "rev":
                case "reverse":
                    node.reverse = kw;
                    existKw = kwVal;
                    break;
                case "asc":
                case "ascending":
                    node.ascending = kw;
                    existKw = kwVal;
                    break;
                case "desc":
                case "descending":
                    node.descending = kw;
                    existKw = kwVal;
                    break;
                case "fix":
                    node.fix = kw;
                    break;
                case "namespace":
                    node.namespace = kw;
                    break;
                default:
                    this.unexpected();
                    break;
            }
        }
        return this.finishNode(node, "MetadataCategoryList");
    }

    parseMetadataVariableBase<T extends MetadataBase>(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition,
        nodeType: string,
        n: new(parser: ParserBase, pos: number, loc: Position) => T,
        callback: (node: T) => void,
        initialType?: "categorical" | "boolean" | "text" | "number"
    ) {
        const node = this.startNodeAtNode(header, n);
        node.header = header;
        node.typeDef = typeDef;
        callback(node);
        node.tail = this.parseMetadataFieldTail(initialType);
        return this.finishNode(node, nodeType);
    }

    parseMetadataNotCategoryBase<T extends MetadataBase>(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition,
        nodeType: string,
        n: new(parser: ParserBase, pos: number, loc: Position) => T,
        initialType?: "boolean" | "text" | "number") {
        return this.parseMetadataVariableBase(
            header,
            typeDef,
            nodeType,
            n,
            node => {
            if (node instanceof MetadataLongVariable &&
                this.state.value.toLowerCase() === "precision") {
                this.next();
                this.expect(tt.braceL);
                node["precision"] = this.expectAndParseNumericLiteral();
                this.expect(tt.braceR);
            }
            if ((node instanceof MetadataDoubleVariable) &&
                this.state.value.toLowerCase() === "scale") {
                this.next();
                this.expect(tt.braceL);
                (node as MetadataDoubleVariable).scale = this.expectAndParseNumericLiteral();
                this.expect(tt.braceR);
            }
            if (this.match(tt.curlyL)) {
                node["categories"] = this.parseMetadataCategories();
            }
            if (this.state.value.toLowerCase() === "codes") {
                this.next();
                this.expect(tt.braceL);
                node["codes"] = this.parseMetadataCategories();
                this.expect(tt.braceR);
            }
        }, initialType);
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // long
    //     [ [ range_expression ] ]
    //     [ precision (integer) ]
    //     [ <categories> ]
    //     [ <codes> ]
    //     [ expression ("expression_text") ]
    //     [ ( initialanswer | defaultanswer ) (integer) ]
    //     [ <axis> ]
    //     [ <usage-type> ]
    //     [ <helperfields> ]
    //     [ nocasedata ]
    //     [ unversioned ]
    //
    parseMetadataLongVariable(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition) {
        return this.parseMetadataNotCategoryBase(
            header,
            typeDef,
            "MetadataLongVariable",
            MetadataLongVariable,
            "number");
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // double
    //     [ [ range_expression ] ]
    //     [ precision (integer) ]
    //     [ scale (integer) ]
    //     [ <categories> ]
    //     [ <codes> ]
    //     [ expression ("expression_text") ]
    //     [ ( initialanswer | defaultanswer ) (double_value) ]
    //     [ <axis> ]
    //     [ <usage-type> ]
    //     [ <helperfields> ]
    //     [ nocasedata ]
    //     [ unversioned ]
    //
    parseMetadataDoubleVariable(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition) {
        return this.parseMetadataNotCategoryBase(
            header,
            typeDef,
            "MetadataDoubleVariable",
            MetadataDoubleVariable,
            "number"
        );
    }

    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // text
    //     [ [ min_len .. max_len ] ]
    //     [ <categories> ]
    //     [ <codes> ]
    //     [ validation ("validation_text") ]
    //     [ expression ("expression_text") ]
    //     [ ( initialanswer | defaultanswer ) (text) ]
    //     [ <axis> ]
    //     [ <usage-type> ]
    //     [ <helperfields> ]
    //     [ nocasedata ]
    //     [ unversioned ]
    //
    parseMetadataTextVariable(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition) {
        return this.parseMetadataNotCategoryBase(
            header,
            typeDef,
            "MetadataTextVariable",
            MetadataTextVariable,
            "text"
        );
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // date
    //     [ [ range_expression ] ]
    //     [ <categories> ]
    //     [ <codes> ]
    //     [ expression ("expression_text") ]
    //     [ ( initialanswer | defaultanswer ) (date_value) ]
    //     [ <axis> ]
    //     [ <usage-type> ]
    //     [ <helperfields> ]
    //     [ nocasedata ]
    //     [ unversioned ]
    //
    //
    parseMetadataDateVariable(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition) {
        return this.parseMetadataNotCategoryBase(
            header,
            typeDef,
            "MetadataDateVariable",
            MetadataDateVariable,
            "text",
        );
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // boolean
    //     [ <categories> ]
    //     [ <codes> ]
    //     [ expression ("expression_text") ]
    //     [ ( initialanswer | defaultanswer ) ( true | false ) ]
    //     [ <axis> ]
    //     [ <usage-type> ]
    //     [ <helperfields> ]
    //     [ nocasedata ]
    //     [ unversioned ]
    //
    parseMetadataBooleanVariable(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition) {
        return this.parseMetadataNotCategoryBase(
            header,
            typeDef,
            "MetadataBooleanVariable",
            MetadataBooleanVariable,
            "boolean",
        );
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // categorical
    //     [ [ min_categories .. max_categories ] ]
    //     [ <categories> ]
    //     [ expression ("expression_text"
    //         [, ( deriveelements | noderiveelements ) ] ) ]
    //     [ ( initialanswer | defaultanswer ) ({category_name(s)}) ]
    //     [ <axis> ]
    //     [ <usage-type> ]
    //     [ <helperfields> ]
    //     [ nocasedata ]
    //     [ unversioned ]
    //
    parseMetadataCategoricalVariable(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition) {
        return this.parseMetadataVariableBase(
            header,
            typeDef,
            "MetadataCategoricalVariable",
            MetadataCategoricalVariable,
            node => {
                node.categories = this.parseMetadataCategories();
            },
            "categorical"
        );
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // define
    // <categories>
    //
    parseMetadataListDefinition(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition) {
        const node = this.startNodeAtNode(header, MetadataCategoryList);
        node.defined = typeDef.typeKw;
        node.categories = this.parseMetadataCategoryList();
        return this.finishNode(node, "MetadataCategoryList");
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    //     [ info ]
    //
    parseMetadataInfoVariable(header: MetadataFieldHeadDefinition) {
        const node = this.startNodeAtNode(header, MetadataInfoVariable);
        node.header = header;
        node.typeDef = this.parseMetadataFieldTypeDefinition();
        return this.finishNode(node, "MetadataInfoVariable");
    }


    parseMetadataLoopVariableTail(node: MetadataLoopVariableBase) {
        while (!this.matchOne([ tt.semi, tt.braceR ])) {
            if (this.match(tt.identifier)) {
                const kw = this.parseIdentifier();
                const rowOrColumn = undefined;
                if (rowOrColumn) {
                    this.raiseAtNode(
                        kw,
                        ErrorMessages["MetadataKeyCantExistMeanwhile"],
                        false,
                        rowOrColumn,
                        kw.name);
                    this.next();
                }
                switch (kw.name.toLowerCase()) {
                    case "row":
                        node.row = kw;
                        break;
                    case "column":
                        node.column = kw;
                        break;
                    case "expand":
                        node.expand = kw;
                        if (node.grid) {
                            this.raiseAtNode(
                                kw,
                                ErrorMessages["MetadataParamSequenceError"],
                                false,
                                node.grid.name,
                                kw.name
                            );
                        }
                        break;
                    case "grid":
                        if (node instanceof MetadataGridVariable ||
                            node instanceof MetadataCompoundVariable) {
                            this.unexpected(undefined, undefined, undefined, false);
                            this.next();
                            break;
                        }
                        node.grid = kw;
                        break;
                    case "noexpand":
                        if (node instanceof MetadataGridVariable) {
                            node.noExpand = kw;
                        } else {
                            this.unexpected(undefined, undefined, undefined, false);
                            this.next();
                        }
                        break;
                    default:
                        this.unexpected(undefined, undefined, undefined, false);
                        this.next();
                        break;
                }
            } else {
                this.unexpected(undefined, undefined, undefined, false);
                this.next();
            }
        }
    }

    parseMetadataLoopVariableBase<T extends MetadataLoopVariableBase>(
        header: MetadataFieldHeadDefinition,
        n: new(parser: ParserBase, pos: number, loc: Position) => T,
        typeDef?: MetadataFieldTypeDefinition,
        callback?: (node: T) => void
    ) {
        const node = this.startNodeAtNode(header, n);
        if (typeDef) {
            node.typeDef = typeDef;
        } else if (callback) {
            callback(node);
        }
        this.expectString("fields");
        this.next();
        if (this.state.value === "-") {
            node.iterationLabel = "-";
            this.next();
        }
        if (this.match(tt.string)) {
            node.iterationLabel = this.parseStringLiteral(this.state.value);
        }
        this.expect(tt.braceL);
        node.fields = this.parseMetadataFields();
        this.expect(tt.braceR);
        this.parseMetadataLoopVariableTail(node);
        return this.finishNode(node,
            typeDef ?
            "MetadataNumericLoopVariable" :
            "MetadataCategoricalLoopVariable");
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // loop
    // <categories>
    // fields
    //     [ "iteration_label" ]
    // ( <field> (; <field> )* [;] )
    //     [ row | column ]
    //     [ expand ]
    //     [ grid ]
    //
    //
    parseMetadataCategoricalLoopVariable(header: MetadataFieldHeadDefinition) {
        return this.parseMetadataLoopVariableBase(
            header,
            MetadataCategoricalLoopVariable,
            undefined,
            node => node.categories = this.parseMetadataCategories()
        );
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // loop
    // [ range_expression ]
    // fields
    //     [ "iteration_label" ]
    // ( <field> (; <field> )* [;] )
    //     [ row | column ]
    //     [ expand ]
    //     [ grid ]
    //
    parseMetadataNumericLoopVariable(
        header: MetadataFieldHeadDefinition) {
        const typeDef = this.parseMetadataFieldTypeDefinition();
        if (this.lookahead().value.toLowerCase() === "db") {
            return this.parseMetadataDataBaseLoopVariable(header, typeDef);
        }
        return this.parseMetadataLoopVariableBase(
            header,
            MetadataNumericLoopVariable,
            typeDef
        );
    }

    parseMetadataLoopVariable(header: MetadataFieldHeadDefinition) {
        if (this.lookaheadCharCode() === charCodes.leftSquareBracket) {
            return this.parseMetadataNumericLoopVariable(header);
        } else {
            return this.parseMetadataCategoricalLoopVariable(header);
        }
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // grid
    // <categories>
    // fields
    // ( <field> (; <field> )* [;] )
    //     [ row | column ]
    //     [ noexpand ]
    //
    parseMetadataGridVariable(header: MetadataFieldHeadDefinition) {
        return this.parseMetadataLoopVariableBase(
            header,
            MetadataGridVariable,
            undefined,
            node => node.categories = this.parseMetadataCategories()
        );
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // compound
    // <categories>
    // fields
    // ( <field> (; <field> )* [;] )
    //     [ row | column ]
    //
    parseMetadataCompoundVariable(header: MetadataFieldHeadDefinition) {
        return this.parseMetadataLoopVariableBase(
            header,
            MetadataCompoundVariable,
            undefined,
            node => node.categories = this.parseMetadataCategories()
        );
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    //     [ block ]
    // fields
    // ( <field> (; <field> )* [;] )
    //
    parseMetadataBlockVariable(header: MetadataFieldHeadDefinition) {
        const node = this.startNodeAtNode(header, MetadataBlockVariable);
        if (this.state.value.toLowerCase() === "block") {
            this.next();
        }
        this.expectString("fields");
        this.next();
        if (this.state.value === "-") {
            this.next();
        }
        this.expect(tt.braceL);
        node.fields = this.parseMetadataFields();
        return this.finishNode(node, "MetadataBlockVariable");
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // page
    // ( question_name (, question_name)* )
    //
    parseMetadataPageVariable(header: MetadataFieldHeadDefinition) {
        const node = this.startNodeAtNode(header, MetadataPageVariable);
        this.expectString("page");
        this.next();
        const questions: Array<Identifier> = [];
        let comma = true;
        while (!this.eat(tt.braceR)) {
            if (this.match(tt.identifier)) {
                if (!comma) {
                    this.unexpected(undefined, undefined, tt.comma, false);
                    this.next();
                } else {
                    questions.push(this.parseIdentifier());
                }
            }
            if (this.match(tt.comma)) {
                if (comma) {
                    this.unexpected(undefined, undefined, undefined, false);
                }
                this.next();
                comma = true;
            }
        }
        node.questions = questions;
        return this.finishNode(node, "MetadataPageVariable");
    }

    //  Columns
    //  (
    // 	    ID = "id_column_name",
    // 	    Label = "label_column_name"
    // 	    [KeyCode = "keycode_column_name"]
    // 	    [File = "file_column_name"]
    // 	    [AnalysisValue = "analysis_value_column_name"]
    // 	    [Fixed = "fixed_column_name"]
    // 	    [Exclusive = "exclusive_column_name"]
    //  )
    parseMetadataDataBaseColumns(): MetadataDbColumnsDefinition {
        const node = this.startNode(MetadataDbColumnsDefinition);
        this.next();
        this.expect(tt.braceL);
        let existId = false, existLabel = false;
        while (!this.eat(tt.braceR)) {
            const kw = this.state.value.toLowerCase();
            if (!this.match(tt.identifier)) {
                throw this.unexpected();
            }
            const id = this.parseIdentifier();
            this.expect(tt.equal);
            const val = this.expectAndParseStringLiteral();
            switch (kw) {
                case "id":
                    node.id = val;
                    existId = true;
                    break;
                case "label":
                    node.label = val;
                    existLabel = true;
                    break;
                case "keycode":       node.keycode = val;       break;
                case "file":          node.file = val;          break;
                case "analysisvalue": node.analysisValue = val; break;
                case "fixed":         node.fixed = val;         break;
                case "exclusive":     node.exclusive = val;     break;

                default:
                    this.raiseAtNode(
                        id,
                        ErrorMessages["MetadataUnkownProperty"],
                        false);
                    while (!this.hasPrecedingLineBreak()) {
                        this.next();
                    }
                    break;
            }
        }
        if (!existId || !existLabel) {
            this.raiseAtNode(
                node,
                ErrorMessages["MetadataLackNecessaryProperty"],
                false,
                "ID 和 Label"
            );
        }
        return this.finishNode(node, "MetadataDbColumnsDefinition");
    }

    // db
    // (
    //      ConnectionString = "connection_string_value",
    //      Table = "table_value",
    //      [MinAnswers = min_answers_value]
    //      [MaxAnswers = max_answers_value]
    //      [SQLFilter = sqlfilter_string]
    //      [CacheTimeout = cache_timeout_value]
    //      Columns
    //      (
    // 	        ID = "id_column_name",
    // 	        Label = "label_column_name"
    // 	        [KeyCode = "keycode_column_name"]
    // 	        [File = "file_column_name"]
    // 	        [AnalysisValue = "analysis_value_column_name"]
    // 	        [Fixed = "fixed_column_name"]
    // 	        [Exclusive = "exclusive_column_name"]
    //      )
    // )
    parseMetadataDataBaseDbProperties(isLoop?: boolean): MetadataDbDefinition {
        const node = this.startNode(MetadataDbDefinition);
        this.next();
        this.expect(tt.braceL);
        let hasConnstr = false, hasTable = false, hasColumn = false;
        while (!this.eat(tt.braceR)) {
            const kw = this.state.value.toLowerCase();
            if (!this.match(tt.identifier)) {
                throw this.unexpected();
            }
            const id = this.parseIdentifier();
            this.expect(tt.equal);
            let type;
            switch (kw) {
                case "connectionstring":
                    node.connectionString = this.parseStringLiteral(this.state.value);
                    hasConnstr = true;
                    break;
                case "table":
                    node.table = this.parseStringLiteral(this.state.value);
                    hasTable = true;
                    break;
                case "minanswers":
                    if (isLoop) {
                        this.raiseErrorAndSkipLine(
                            id,
                            ErrorMessages["MetadataUnkownProperty"]);
                        break;
                    }
                    node.minAnswers = this.expectAndParseNumericLiteral();
                    break;
                case "maxanswers":
                    if (isLoop) {
                        this.raiseErrorAndSkipLine(
                            id,
                            ErrorMessages["MetadataUnkownProperty"]);
                        break;
                    }
                    node.maxAnswers = this.expectAndParseNumericLiteral();
                    break;
                case "sqlfilter":
                    node.sqlFilter = this.expectAndParseStringLiteral();
                    break;
                case "cachetimeout":
                    node.cacheTimeout = this.expectAndParseNumericLiteral();
                    break;
                case "columns":
                    node.columns = this.parseMetadataDataBaseColumns();
                    hasColumn = true;
                    break;
                case "iteratoridtype":
                    if (!isLoop) {
                        this.raiseErrorAndSkipLine(
                            id,
                            ErrorMessages["MetadataUnkownProperty"]);
                        break;
                    }
                    type = this.state.value.toLowerCase();
                    if (["text", "double", "long", "date"].includes(type)) {
                        node.iterationIdType = this.expectAndParseStringLiteral();
                    } else {
                        this.raise(
                            this.state.pos,
                            ErrorMessages["ExpectToken"],
                            "text 或 double 或 long 或 date"
                        );
                        this.next();
                    }
                    break;
                default:
                    this.raiseErrorAndSkipLine(
                        id,
                        ErrorMessages["MetadataUnkownProperty"]);
                    break;
            }
        }
        if (!hasConnstr || !hasTable || !hasColumn) {
            this.raiseAtNode(
                node,
                ErrorMessages["MetadataLackNecessaryProperty"],
                false,
                "ConnectionString、Table 和 Columns"
            );
        }
        return this.finishNode(node, "MetadataDbDefinition");
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // [text | double | long | date]
    // db
    // (
    //      ConnectionString = "connection_string_value",
    //      Table = "table_value",
    //      [MinAnswers = min_answers_value]
    //      [MaxAnswers = max_answers_value]
    //      [SQLFilter = sqlfilter_string]
    //      [CacheTimeout = cache_timeout_value]
    //      Columns
    //      (
    // 	        ID = "id_column_name",
    // 	        Label = "label_column_name"
    // 	        [KeyCode = "keycode_column_name"]
    // 	        [File = "file_column_name"]
    // 	        [AnalysisValue = "analysis_value_column_name"]
    // 	        [Fixed = "fixed_column_name"]
    // 	        [Exclusive = "exclusive_column_name"]
    //      )
    // )
    // [ [ range_expression ] ]
    // [ <codes> ]
    // [ expression ("expression_text") ]
    // [ ( initialanswer | defaultanswer ) (date_value) ]
    // [ <axis> ]
    // [ <usage-type> ]
    // [ <helperfields> ]
    // [ nocasedata ]
    // [ unversioned ]
    //
    parseMetadataDataBaseNonLoopVariable(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition) {
        const node = this.startNodeAtNode(header, MetadataDataBaseNonLoopQuestion);
        node.typeDef = typeDef;
        this.next();
        this.expectString("db");
        node.definition = this.parseMetadataDataBaseDbProperties();
        if (this.match(tt.bracketL)) {
            node.range = this.parseMetadataRanges(true, true, true);
        }
        if (this.state.value.toLowerCase() === "codes") {
            this.next();
            this.expect(tt.braceL);
            node.codes = this.parseMetadataCategories();
            this.expect(tt.braceR);
        }
        node.tail = this.parseMetadataFieldTail("text");
        return this.finishNode(node, "MetadataDataBaseNonLoopQuestion");
    }

    //
    // field_name
    //     [ "field_label" ]
    //     [ [ <properties> ] ]
    //     [ <styles and templates> ]
    // loop
    //     [ range_expression ]
    // db
    // (
    //         ConnectionString = "connection_string_value",
    //         Table = "table_value",
    //         [SQLFilter = sqlfilter_string]
    //         [CacheTimeout = cache_timeout_value]
    //         [IteratorIDType = [text | double | long | date]]
    //         Columns
    //         (
    // 	    ID = "id_column_name",
    // 	    Label = "label_column_name"
    // 	    [KeyCode = "keycode_column_name"]
    // 	    [File = "file_column_name"]
    // 	    [AnalysisValue = "analysis_value_column_name"]
    // 	    [Fixed = "fixed_column_name"]
    // 	    [Exclusive = "exclusive_column_name"]
    //         )
    //     )
    //     fields
    //     ( <field> (; <field> )* [;] )
    //         [ row | column ]
    //         [ noexpand ]
    //
    parseMetadataDataBaseLoopVariable(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition) {
        const node = this.startNodeAtNode(header, MetadataDataBaseLoopQuestion);
        node.header = header;
        node.typeDef = typeDef;
        this.expectString("db");
        node.definition = this.parseMetadataDataBaseDbProperties();
        this.expectString("fields");
        this.next();
        if (this.state.value === "-") {
            node.iterationLabel = "-";
            this.next();
        } else if (this.match(tt.string)) {
            node.iterationLabel = this.expectAndParseStringLiteral();
        }
        this.expect(tt.braceL);
        node.fields = this.parseMetadataFields();
        this.expect(tt.braceR);
        let rowOrColumn: string | undefined;
        while (!this.match(tt.semi)) {
            const text = this.state.value.toLowerCase();
            let kw;
            switch (text) {
                case "row":
                case "column":
                    if (!rowOrColumn) {
                        this.raise(
                            this.state.pos,
                            ErrorMessages["MetadataKeyCantExistMeanwhile"],
                            this.state.value,
                            rowOrColumn
                        );
                        this.next();
                        break;
                    }
                    kw = this.parseIdentifier();
                    if (text === "row") {
                        node.row = kw;
                    } else {
                        node.column = kw;
                    }
                    rowOrColumn = this.state.value;
                    break;

                case "noexpand":
                    node.noExpand = this.parseIdentifier();
                    break;

                default:
                    this.unexpected(undefined, undefined, undefined, false);
                    this.next();
                    break;
            }
        }
        return this.finishNode(node, "MetadataDataBaseLoopQuestion");
    }

    parseMaybeDbField(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition
    ) {
        if (this.state.value.toLowerCase() === "db") {
            return this.parseMetadataDataBaseNonLoopVariable(
                header, typeDef);
        }
        const typeKw = typeDef.typeKw.name.toLowerCase();
        switch (typeKw) {
            case "text":   return this.parseMetadataTextVariable(header, typeDef);
            case "double": return this.parseMetadataDoubleVariable(header, typeDef);
            case "long":   return this.parseMetadataLongVariable(header, typeDef);
            case "date":   return this.parseMetadataDateVariable(header, typeDef);
            default:       throw this.unexpected();
        }
    }

    parseMetadataField(): MetadataBase {
        const header = this.parseMetadataFieldHeader();
        const kw = this.state.value.toLowerCase();
        const allowExclude = kw !== "categorical" && kw !== "text";
        const allowStep = kw === "long";
        const allowSingle = kw !== "text";
        const typeDef = this.parseMetadataFieldTypeDefinition(allowExclude, allowStep, allowSingle);
        switch (kw) {
            case "define":         return this.parseMetadataListDefinition(header, typeDef);

            case "long":
            case "double":
            case "text":
            case "date":
                return this.parseMaybeDbField(header, typeDef);

            case "categorical":    return this.parseMetadataCategoricalVariable(header, typeDef);
            case "boolean":        return this.parseMetadataBooleanVariable(header, typeDef);
            case "loop":           return this.parseMetadataLoopVariable(header);
            case "info":           return this.parseMetadataInfoVariable(header);
            case "grid":           return this.parseMetadataGridVariable(header);
            case "compound":       return this.parseMetadataCompoundVariable(header);
            case "block":
            case "fields":
                return this.parseMetadataBlockVariable(header);
            case "page":           return this.parseMetadataPageVariable(header);
            default:
                throw this.unexpected();
        }
    }

    parseMetadataFields() {
        const fields: MetadataBase[] = [];
        while (!this.match(tt.braceR)) {
            fields.push(this.parseMetadataField());
            if (!this.eat(tt.semi) && this.lookahead().type !== tt.braceR) {
                this.unexpected(undefined, undefined, tt.semi, false);
                this.next();
            }
        }
        return fields;
    }

    parseMetadata(close: TokenType = tt.eof) {
        const metadata: NodeBase[] = [];
        while (!this.match(close)) {
            if (this.match(tt.pre_include)) {
                metadata.push(this.parsePreIncludeStatement(true));
            } else {
                metadata.push(this.parseMetadataField());
                this.expect(tt.semi);
            }
        }
        return metadata;
    }

}


