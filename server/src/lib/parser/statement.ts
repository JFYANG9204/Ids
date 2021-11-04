import * as charCodes from "../util/charcodes";
import * as path from "path";
import * as fs from "fs";
import { Parser } from ".";
import { createBasicOptions, ScriptFileType, SourceType } from "../options";
import { TokenType, types as tt } from "../tokenizer/type";
import {
    ArrayDeclarator,
    BlockStatement,
    BooleanLiteral,
    ConstDeclaration,
    ConstDeclarator,
    DecimalLiteral,
    DoWhileStatement,
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
    SectionStatement,
    SelectCaseRange,
    SelectCaseStatement,
    SelectStatement,
    SetStatement,
    Statement,
    StringLiteral,
    VariableDeclaration,
    WhileStatement,
    WithStatement
} from "../types";
import { ErrorMessages } from "./error-messages";
import { ExpressionParser } from "./expression";
import {
    BasicTypeDefinitions,
    isEventName
} from "../built-in/built-ins";
import { ParserBase } from "../base";
import { Position } from "../util/location";
import {
    Argument,
    DefinitionOptions,
    FunctionDefinition,
    VariantDefinition
} from "../util/definition";
import { createDefinition } from "../built-in/basic";
import { ParserFileNode } from "../file/node";
import { ErrorTemplate } from "./errors";

export class StatementParser extends ExpressionParser {

    eventNames: string[] = [];

    join(file: File) {
        file.definitions?.forEach((value, key) => {
            if (!this.scope.currentScope().get(key)) {
                this.scope.currentScope().insert(key, file, value);
            }
        });
    }

    expectAndParseLiteral<T extends Literal>(
        type: TokenType | TokenType[],
        typeStr: string,
        errStr: string,
        n: new(parser: ParserBase, pos: number, loc: Position) => T,
        ) {
        if (this.matchOne(type)) {
            return this.parseLiteral(this.state.value.text, typeStr, n);
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

    skipNewline() {
        while (this.match(tt.newLine)) {
            this.next();
        }
    }

    skipUntilNewLine() {
        this.skipSpace();
        if (!this.match(tt.eof)) {
            this.expect(tt.newLine);
        }
    }

    skipSpaceAndNewLine() {
        this.skipSpace();
        this.skipNewline();
    }

    parseProgram(
        end: TokenType = tt.eof,
        sourceType: SourceType = this.options.sourceType
    ): Program {
        const node = this.startNode(Program);
        node.sourceType = sourceType;
        this.skipNewline();
        if (this.options.sourceType === SourceType.script) {
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
                    this.skipUntilNewLine();
                    this.checkAheadLineMark(id);
                    return line;
                } else if (next.type === tt.braceL) {
                    const text = this.state.value.text.toLowerCase();
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
                return this.parseFunctionDeclaration();
            // Jump Statement
            case tt._exit:
                return this.parseExit();
            case tt._goto:
                return this.parseGoto();
            case tt._on:
                return this.parseOnError();
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

            default:
                throw this.unexpected();
        }
    }

    parseConstDeclarator(): ConstDeclarator {
        const node = this.startNode(ConstDeclarator);
        node.id = this.parseIdentifier();
        this.expect(tt.equal);
        node.init = this.parseExpression(true);
        node.push(node.id, node.init);
        this.declareLocalVar(
            node.id.name,
            node,
            undefined,
            BasicTypeDefinitions.variant,
            true);
        return this.finishNode(node, "ConstDeclarator");
    }

    parseConstDeclaration(): ConstDeclaration {
        const node = this.startNode(ConstDeclaration);
        this.next();
        while (!this.match(tt.newLine)) {
            node.declarators.push(this.parseConstDeclarator());
            if (!this.match(tt.newLine)) {
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
        while(!this.match(tt.newLine) &&
              !this.match(tt.comma)   &&
              !this.match(tt.braceR)) {
            if (this.match(tt.bracketL)) {
                this.next();
                if (this.match(tt.number)) {
                    boundaries.push(Number(this.state.value.text));
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
        node.boundaries = boundaries;
        node.dimensions = dimensions;
        this.declareLocalVar(
            id.name,
            node,
            { dimensions, boundaries },
            BasicTypeDefinitions.array);
        return this.finishNode(node, "ArrayDeclarator");
    }

    parseDeclaration(): VariableDeclaration {
        // 跳过dim
        this.next();
        const node = this.startNode(VariableDeclaration);
        const declarators: Array<Identifier | ArrayDeclarator> = [];
        let hasComma = false;
        while (!this.match(tt.newLine)) {
            if (this.lookahead().type === tt.bracketL) {
                declarators.push(this.parseArrayDeclarator());
                hasComma = false;
            } else {
                const id = this.parseIdentifier();
                this.declareLocalVar(id.name, id, undefined, BasicTypeDefinitions.variant);
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
        this.eat(tt.newLine);
        node.declarations = declarators;
        node.pushArr(declarators);
        return this.finishNode(node, "VariableDeclaration");
    }

    parseExpressionStatement(): ExpressionStatement {
        const node = this.startNode(ExpressionStatement);
        node.expression = this.parseExpression(true);
        node.push(node.expression);
        this.skipUntilNewLine();
        this.checkExprTypeError(node.expression);
        return this.finishNode(node, "ExpressionStatement");
    }

    parseSetStatement(): SetStatement {
        const node = this.startNode(SetStatement);
        this.next();
        node.id = this.parseCallOrMember();
        this.expect(tt.equal);
        node.assignment = this.parseExpression(true);
        if (node.id instanceof Identifier) {
            const declared = this.checkVarDeclared(node.id.name, node.id, true);
            const type = this.getExprType(node.assignment);
            if (type && declared) {
                this.scope.currentScope().updateType(
                    node.id.name,
                    type
                );
                this.addExtra(node.id, "definition", type);
            }
        }
        this.skipUntilNewLine();
        node.push(node.id, node.assignment);
        return this.finishNode(node, "SetStatement");
    }

    parseBlock(close: TokenType | Array<TokenType>): BlockStatement {
        const node = this.startNode(BlockStatement);
        const body: Statement[] = [];
        this.skipNewline();
        while (!this.matchOne(close)) {
            this.skipNewline();
            body.push(this.parseStatementContent());
            this.skipNewline();
        }
        node.body = body;
        node.pushArr(node.body);
        return this.finishNode(node, "BlockStatement");
    }

    parseIfStatement(): IfStatement {
        const node = this.startNode(IfStatement);
        this.next();
        node.test = this.parseExpression();
        this.checkExprTypeError(node.test);
        this.expect(tt._then);
        if (this.match(tt.newLine)) {
            this.skipNewline();
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
                this.checkExprTypeError(node.consequent);
            }
            if (this.match(tt._else)) {
                this.next();
                node.alternate = this.parseExpression();
                this.checkExprTypeError(node.alternate);
                node.push(node.alternate);
            }
        }
        node.push(node.test, node.consequent);
        this.finishNode(node, "IfStatement");
        this.skipNewline();
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
            return this.parseNumericLiteral(this.state.value.text);
        } else {
            return this.parseExpression();
        }
    }

    parseBaseFor(): ForStatement {
        const node = this.startNode(ForStatement);
        this.next();
        node.variable = this.parseIdentifier();
        node.push(node.variable);
        this.checkVarDeclared((node.variable as Identifier).name, node, true);
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
                node.range.step = Number(stepExpr.value?.label);
            } else {
                this.raiseAtNode(
                    stepExpr,
                    ErrorMessages["ExpectToken"],
                    false,
                    "数字"
                );
            }
        }
        this.skipUntilNewLine();
        node.body = this.parseBlock(tt._next);
        node.push(node.body);
        this.expect(tt._next);
        this.skipUntilNewLine();
        return this.finishNode(node, "ForStatement");
    }

    parseForEach(): ForEachStatement {
        const node = this.startNode(ForEachStatement);
        this.next();
        this.expect(tt._each);
        const variable = this.parseIdentifier();
        this.checkVarDeclared(variable.name, variable, true);
        this.expect(tt._in);
        const collection = this.parseExpression();
        this.checkIfCollection(collection, variable);
        node.collection = collection;
        this.skipUntilNewLine();
        node.body = this.parseBlock(tt._next);
        this.expect(tt._next);
        this.skipUntilNewLine();
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
        this.skipUntilNewLine();
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
        this.skipUntilNewLine();
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
        node.object = this.parseExpression();
        const header = this.getExprType(node.object);
        this.addExtra(node, "definition", header);
        this.scope.currentScope().enterHeader(header);
        node.body = this.parseBlock(tt._end);
        this.expect(tt._end);
        this.expect(tt._with);
        this.scope.currentScope().exitHeader();
        this.skipUntilNewLine();
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
        this.skipUntilNewLine();
        node.body = this.parseBlock(tt._end);
        this.eat(tt._end);
        this.expect(tt._section);
        this.skipUntilNewLine();
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
        this.skipUntilNewLine();
        node.cases = this.parseSelectBody();
        this.expect(tt._end);
        this.expect(tt._select);
        this.skipUntilNewLine();
        node.pushArr(node.cases);
        node.push(node.discriminant);
        return this.finishNode(node, "SelectStatement");
    }

    parseSelectBody(): Array<SelectCaseStatement> {
        const body: Array<SelectCaseStatement> = [];
        this.skipNewline();
        if (!this.match(tt._case)) {
            throw this.unexpected();
        }
        const state: { else: boolean } = { else: false };
        while (!this.match(tt._end)) {
            this.skipNewline();
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
            while (!this.eat(tt.newLine)) {
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
            const op = this.state.value.text;
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
        this.skipUntilNewLine();
        return this.finishNode(node, "ExitStatement");
    }

    parseGoto(): GotoStatement {
        const node = this.startNode(GotoStatement);
        this.next();
        if (this.state.value.text !== "0") {
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
        this.skipUntilNewLine();
        return this.finishNode(node, "GotoStatement");
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
            this.skipUntilNewLine();
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
        this.scope.enter(node, false);
        let isFunction = false;
        if (this.match(tt._function)) {
            node.needReturn = true;
            isFunction = true;
        }
        this.next();
        node.id = this.parseIdentifier();
        this.expect(tt.braceL);
        node.params = this.parseFunctionDeclarationParam();
        this.expect(tt.newLine);
        node.body = this.parseBlock(tt._end);
        this.expect(tt._end);
        isFunction ? this.expect(tt._function) : this.expect(tt._sub);
        this.scope.exit();
        const args: Array<Argument> = [];
        node.params.forEach(arg => {
            args.push(this.getArgumentDefFromNode(arg));
        });
        node.pushArr(node.params);
        node.push(node.id, node.body);
        const option: DefinitionOptions = {
            name: node.id.name,
            defType: "function",
            isReadonly: false,
            isConst: false,
            isCollection: false,
            section: this.scope.currentSection()
        };
        const def = createDefinition(option, FunctionDefinition);
        def.arguments = args;
        this.declareLocalVar(
            node.id.name,
            node,
            undefined,
            def,
            false);
        return this.finishNode(node, "FunctionDeclaration");
    }

    parseFunctionDeclarationParam(): Array<Identifier | ArrayDeclarator> {
        const params: Array<Identifier | ArrayDeclarator> = [];
        let comma = false;
        while (!this.eat(tt.braceR)) {
            if (this.match(tt.identifier)) {
                if (this.lookahead().type === tt.bracketL) {
                    params.push(this.parseArrayDeclarator());
                    comma = false;
                } else {
                    params.push(this.parseIdentifier());
                    comma = false;
                }
            } else if (this.match(tt.comma)) {
                if (comma || this.lookahead().type === tt.braceR) {
                    this.unexpected();
                }
                comma = true;
                this.next();
            } else {
                throw this.unexpected();
            }
        }
        params.forEach(param => {
            if (param instanceof Identifier) {
                this.scope.currentScope().insert(
                    param.name,
                    param,
                    BasicTypeDefinitions.variant
                );
            }
        });
        return params;
    }

    getArgumentDefFromNode(node: Identifier | ArrayDeclarator): Argument {
        if (node instanceof Identifier) {
            return new Argument(
                node.name,
                BasicTypeDefinitions.variant,
                false,
                false);
        } else {
            if (node.dimensions === 1) {
                return new Argument(
                    node.name.name,
                    BasicTypeDefinitions.array,
                    true,
                    false
                );
            }
            const arr = createDefinition({
                name: node.name.name,
                defType: "array",
                isCollection: true,
                isReadonly: false,
                isConst: false,
                insertText: node.name.name,
                section: this.scope.currentSection(),
            }, VariantDefinition);
            arr.isArray = true;
            arr.boundaries = node.boundaries;
            arr.dimensions = node.dimensions;
            return new Argument(
                node.name.name,
                arr,
                true,
                false);
        }
    }

    // Pre-Processor
    // #define identifier [ ["] value ["] ]
    parsePreDefineStatement(): PreDefineStatement {
        const node = this.startNode(PreDefineStatement);
        this.next();
        node.id = this.parseIdentifier();
        node.init = this.parseExpression();
        node.push(node.id, node.init);
        this.finishNode(node, "PreDefineStatement");
        this.declareMacroVar(node.id.name, node);
        this.skipUntilNewLine();
        return node;
    }

    // #undef identifier
    parsePreUndefStatement(): PreUndefStatement {
        const node = this.startNode(PreUndefStatement);
        this.next();
        node.id = this.parseIdentifier();
        node.push(node.id);
        this.scope.currentScope().remove(node.id.name);
        this.skipUntilNewLine();
        return this.finishNode(node, "PreUndefStatement");
    }

    // #include "filename"
    parsePreIncludeStatement(metadata?: boolean): PreIncludeStatement {
        const node = this.startNode(PreIncludeStatement);
        this.next();
        const includeFilePath = this.parseExpression();
        this.finishNode(node, "PreIncludeStatement");
        if (includeFilePath instanceof StringLiteral) {
            node.inc = includeFilePath;
            try {
                node.path = this.options.sourceFileName ?
                path.join(path.dirname(this.options.sourceFileName), includeFilePath.extra["rawValue"]) :
                includeFilePath.extra["rawValue"];
            } catch (error) {
                return node;
            }
            let search;
            if (this.searchParserNode &&
                (search = this.searchParserNode(node.path))) {
                node.parser = new Parser(
                    createBasicOptions(node.path, this.options.raiseTypeError),
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
                        createBasicOptions(node.path, this.options.raiseTypeError),
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
                        createBasicOptions(node.path, this.options.raiseTypeError),
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
            let headerDef = this.scope.currentScope().currentHeader();
            node.file = node.parser.parse(this.scope.currentScope().storeMap, headerDef);
            this.state.includes.set(node.path.toLowerCase(), node.file);
            this.scope.currentScope().join(node.file);
            if (node.file.errors.length > 0) {
                this.raiseAtNode(
                    node.inc,
                    ErrorMessages["IncludeFileExistError"],
                    false
                );
            }
        }
        this.skipNewline();
        return node;
    }

    // #error text
    parsePreErrorStatement(): PreErrorStatement {
        const node = this.startNode(PreErrorStatement);
        this.next();
        const text = this.startNode(Expression);
        while (this.match(tt.newLine)) {
            this.next();
        }
        this.finishNode(text, "Expression");
        this.addExtra(text, "raw", this.input.slice(node.start, this.state.pos));
        node.text = text;
        return this.finishNode(node, "PreErrorStatement");
    }

    // #line sequence ["location"]
    parsePreLineStatement(): PreLineStatement {
        const node = this.startNode(PreLineStatement);
        this.next();
        node.sequence = this.parseNumericLiteral(this.state.value.text);
        if (this.match(tt.string)) {
            node.location = this.parseStringLiteral(this.state.value.text);
        }
        this.skipUntilNewLine();
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
        this.skipNewline();
        node.consequent = this.parseBlock([ tt.pre_endif, tt.pre_elif, tt.pre_else ]);
        if (this.match(tt.pre_elif)) {
            node.alternate = this.parsePreIfStatement();
        } else if (this.match(tt._else)) {
            node.alternate = this.parseBlock(tt.pre_endif);
        }
        this.expect(tt.pre_endif);
        this.skipUntilNewLine();
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
        this.scope.enter(node, false);
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
        this.skipUntilNewLine();
        this.skipNewline();
        callback(node);
        this.skipNewline();
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
                    this.skipNewline();
                    const text = this.state.value.text.toLowerCase();
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
                                const val = this.parseStringLiteral(this.state.value.text);
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
                                node.fileSize = this.parseNumericLiteral(this.state.value.text);
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
                    this.skipUntilNewLine();
                    this.skipNewline();
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
                    const text = this.state.value.text;
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
                    const text = this.state.value.text.toLowerCase();
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
                            value = this.state.value.text.toLowerCase();
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
                    this.skipUntilNewLine();
                    this.skipNewline();
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
                    const text = this.state.value.text.toLowerCase();
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
                            order = this.state.value.text.toUpperCase();
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
                    this.skipUntilNewLine();
                    this.skipNewline();
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
                    const text = this.state.value.text.toLowerCase();
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
                    this.skipUntilNewLine();
                    this.skipNewline();
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
        const text = this.state.value.text.toLowerCase();
        if (check.includes(text)) {
            return this.match(tt.identifier) ? this.parseIdentifier() :
                this.parseStringLiteral(this.state.value.text);
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
        this.skipSpaceAndNewLine();
        node.body = this.parseMetadata(tt._end);
        this.skipSpaceAndNewLine();
        this.expect(tt._end);
        this.expectString("metadata");
        this.next();
        return this.finishNode(node, "MetadataSection");
    }


    raiseErrorAndSkipLine(node: NodeBase, template: ErrorTemplate, ...params: any) {
        this.raiseAtNode(node, template, false, params);
        while (!this.eat(tt.newLine)) {
            this.next();
        }
    }

    parsePropertyList<T extends NodeBase>(
        close: TokenType = tt.braceR,
        node: T,
        callback: (node: T) => void) {
        let comma = false;
        while (this.eat(close)) {
            this.skipNewline();
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
            this.skipNewline();
        }
    }

    // <property> ::= Name = Value
    parseMetaCustomProperty(): MetadataProperty {
        const node = this.startNode(MetadataProperty);
        node.name = this.parseIdentifier();
        this.skipNewline();
        if (this.match(tt.colon)) {
            this.next();
            this.expect(tt.bracketL);
            this.skipNewline();
            node.propValue = this.parseMetaCustomProperties();
        } else if (this.match(tt.braceL)) {
            this.next();
            this.skipNewline();
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
            this.skipNewline();
            if (this.match(tt.comma)) {
                this.next();
            }
            this.skipNewline();
            if (!this.match(close)) {
                props.push(this.parseMetaCustomProperty());
                this.skipNewline();
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
        this.skipNewline();
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
            this.skipNewline();
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
            this.skipNewline();
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
            this.skipNewline();
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
        this.skipNewline();
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
            this.skipNewline();
            this.parseMetadataFieldHeaderAtom(node);
            this.skipNewline();
        }
        return this.finishNode(node, "MetadataFieldHeaderDefinition");
    }

    parseMetadataFieldHeaderAtom(
        node: MetadataFieldHeadDefinition) {
        let propId, propName;
        switch (this.state.type) {
            case tt.string:
                node.label = this.parseStringLiteral(this.state.value.text);
                this.skipNewline();
                return;
            case tt.bracketL:
                node.properties = this.parseMetaCustomProperties();
                this.skipNewline();
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
                    while (!this.eat(tt.newLine)) {
                        this.next();
                    }
                }
                this.skipNewline();
                return;

            default:
                this.unexpected();
                while (!this.eat(tt.newLine)) {
                    this.next();
                }
                return;
        }
    }

    checkIfHeaderEnd() {
        const text = this.state.value.text.toLowerCase();
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
            node.label = this.parseStringLiteral(this.state.value.text);
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
        this.skipNewline();
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
            const str = this.state.value.text.toLowerCase();
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
                    node.label = this.parseStringLiteral(this.state.value.text);
                    break;

                case tt.identifier:
                    if (this.checkIfHeaderEnd()) {
                        node.typeDef = this.parseMetadataFieldTypeDefinition();
                    } else if (this.state.value.text.toLowerCase() === "usagetype") {
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
            this.skipNewline();
            this.parseMetadataFieldTailAtom(node, type);
            this.skipNewline();
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
                const kw = this.state.value.text.toLowerCase();
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
                this.parseStringLiteral(this.state.value.text);
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
            node.label = this.parseStringLiteral(this.state.value.text);
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
                        node.keycode = this.parseStringLiteral(this.state.value.text);
                    } else if (this.match(tt.number)) {
                        node.keycode = this.parseNumericLiteral(this.state.value.text);
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
        if (this.state.value.text.toLowerCase() === "use" || (
            ahead.type === tt.identifier && ahead.value.text.toLowerCase() === "use")) {
            node.useList = this.parseMetadataCategoryUseList();
            return this.finishNode(node, "MetadataCategory");
        }
        if (this.state.value.text === "-") {
            node.name = "-";
            this.next();
        } else {
            node.name = this.parseIdentifier();
        }
        while (!this.matchOne([ tt.comma, tt.curlyR ])) {
            this.skipSpace();
            this.skipNewline();
            this.parseMetadataCategorySuffixAtom(node);
            this.skipSpace();
            this.skipNewline();
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
        const cur = this.state.value.text.toLowerCase();
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
            this.state.value.text.toLowerCase() === "sublist") {
            node.subList = this.parseMetadataSublist();
        }
        if (this.match(tt.string)) {
            node.listLabel = this.parseStringLiteral(this.state.value.text);
        }
        if (this.match(tt.identifier) &&
            this.state.value.text.toLowerCase() === "fix") {
            node.fix = this.parseIdentifier();
        }
        return this.finishNode(node, "MetadataCategoryUseList");
    }

    parseMetadataSublist(): MetadataSubList {
        const node = this.startNode(MetadataSubList);
        this.next();
        const text = this.state.value.text.toLowerCase();
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
            this.skipSpaceAndNewLine();
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
            this.skipSpaceAndNewLine();
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
        let cur = this.state.value.text.toLowerCase();
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
        this.skipSpaceAndNewLine();
        callback(node);
        this.skipSpaceAndNewLine();
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
                this.state.value.text.toLowerCase() === "precision") {
                this.next();
                this.skipSpaceAndNewLine();
                this.expect(tt.braceL);
                this.skipSpaceAndNewLine();
                node["precision"] = this.expectAndParseNumericLiteral();
                this.skipSpaceAndNewLine();
                this.expect(tt.braceR);
                this.skipSpaceAndNewLine();
            }
            if ((node instanceof MetadataDoubleVariable) &&
                this.state.value.text.toLowerCase() === "scale") {
                this.skipSpaceAndNewLine();
                this.next();
                this.skipSpaceAndNewLine();
                this.expect(tt.braceL);
                this.skipSpaceAndNewLine();
                (node as MetadataDoubleVariable).scale = this.expectAndParseNumericLiteral();
                this.skipSpaceAndNewLine();
                this.expect(tt.braceR);
                this.skipSpaceAndNewLine();
            }
            if (this.match(tt.curlyL)) {
                node["categories"] = this.parseMetadataCategories();
                this.skipSpaceAndNewLine();
            }
            if (this.state.value.text.toLowerCase() === "codes") {
                this.next();
                this.skipSpaceAndNewLine();
                this.expect(tt.braceL);
                this.skipSpaceAndNewLine();
                node["codes"] = this.parseMetadataCategories();
                this.skipSpaceAndNewLine();
                this.expect(tt.braceR);
                this.skipSpaceAndNewLine();
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
        this.skipSpaceAndNewLine();
        node.categories = this.parseMetadataCategoryList();
        this.skipSpaceAndNewLine();
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
        this.skipSpaceAndNewLine();
        node.typeDef = this.parseMetadataFieldTypeDefinition();
        this.skipSpaceAndNewLine();
        return this.finishNode(node, "MetadataInfoVariable");
    }


    parseMetadataLoopVariableTail(node: MetadataLoopVariableBase) {
        this.skipSpaceAndNewLine();
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
            this.skipSpaceAndNewLine();
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
            this.skipSpaceAndNewLine();
            callback(node);
        }
        this.skipSpaceAndNewLine();
        this.expectString("fields");
        this.next();
        if (this.state.value.text === "-") {
            node.iterationLabel = "-";
            this.next();
        }
        this.skipSpaceAndNewLine();
        if (this.match(tt.string)) {
            node.iterationLabel = this.parseStringLiteral(this.state.value.text);
        }
        this.skipSpaceAndNewLine();
        this.expect(tt.braceL);
        node.fields = this.parseMetadataFields();
        this.expect(tt.braceR);
        this.skipSpaceAndNewLine();
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
        if (this.lookahead().value.text.toLowerCase() === "db") {
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
        if (this.state.value.text.toLowerCase() === "block") {
            this.next();
        }
        this.expectString("fields");
        this.next();
        if (this.state.value.text === "-") {
            this.next();
        }
        this.skipSpaceAndNewLine();
        this.expect(tt.braceL);
        this.skipSpaceAndNewLine();
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
        this.skipSpaceAndNewLine();
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
            this.skipSpaceAndNewLine();
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
        this.skipSpaceAndNewLine();
        this.expect(tt.braceL);
        this.skipSpaceAndNewLine();
        let existId = false, existLabel = false;
        while (!this.eat(tt.braceR)) {
            const kw = this.state.value.text.toLowerCase();
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
                    while (!this.eat(tt.newLine)) {
                        this.next();
                    }
                    break;
            }
            this.skipSpaceAndNewLine();
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
        this.skipSpaceAndNewLine();
        this.expect(tt.braceL);
        this.skipSpaceAndNewLine();
        let hasConnstr = false, hasTable = false, hasColumn = false;
        while (!this.eat(tt.braceR)) {
            const kw = this.state.value.text.toLowerCase();
            if (!this.match(tt.identifier)) {
                throw this.unexpected();
            }
            const id = this.parseIdentifier();
            this.expect(tt.equal);
            let type;
            switch (kw) {
                case "connectionstring":
                    node.connectionString = this.parseStringLiteral(this.state.value.text);
                    hasConnstr = true;
                    break;
                case "table":
                    node.table = this.parseStringLiteral(this.state.value.text);
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
                    type = this.state.value.text.toLowerCase();
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
        this.skipSpaceAndNewLine();
        this.expectString("db");
        node.definition = this.parseMetadataDataBaseDbProperties();
        this.skipSpaceAndNewLine();
        if (this.match(tt.bracketL)) {
            node.range = this.parseMetadataRanges(true, true, true);
            this.skipSpaceAndNewLine();
        }
        if (this.state.value.text.toLowerCase() === "codes") {
            this.next();
            this.expect(tt.braceL);
            node.codes = this.parseMetadataCategories();
            this.expect(tt.braceR);
            this.skipSpaceAndNewLine();
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
        this.skipSpaceAndNewLine();
        this.expectString("db");
        node.definition = this.parseMetadataDataBaseDbProperties();
        this.skipSpaceAndNewLine();
        this.expectString("fields");
        this.next();
        if (this.state.value.text === "-") {
            node.iterationLabel = "-";
            this.next();
        } else if (this.match(tt.string)) {
            node.iterationLabel = this.expectAndParseStringLiteral();
        }
        this.skipSpaceAndNewLine();
        this.expect(tt.braceL);
        this.skipSpaceAndNewLine();
        node.fields = this.parseMetadataFields();
        this.expect(tt.braceR);
        this.skipSpaceAndNewLine();
        let rowOrColumn: string | undefined;
        while (!this.match(tt.semi)) {
            const text = this.state.value.text.toLowerCase();
            let kw;
            switch (text) {
                case "row":
                case "column":
                    if (!rowOrColumn) {
                        this.raise(
                            this.state.pos,
                            ErrorMessages["MetadataKeyCantExistMeanwhile"],
                            this.state.value.text,
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
                    rowOrColumn = this.state.value.text;
                    break;

                case "noexpand":
                    node.noExpand = this.parseIdentifier();
                    break;

                default:
                    this.unexpected(undefined, undefined, undefined, false);
                    this.next();
                    break;
            }
            this.skipSpaceAndNewLine();
        }
        return this.finishNode(node, "MetadataDataBaseLoopQuestion");
    }

    parseMaybeDbField(
        header: MetadataFieldHeadDefinition,
        typeDef: MetadataFieldTypeDefinition
    ) {
        this.skipSpaceAndNewLine();
        if (this.state.value.text.toLowerCase() === "db") {
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
        this.skipSpaceAndNewLine();
        const kw = this.state.value.text.toLowerCase();
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
        this.skipSpaceAndNewLine();
        while (!this.match(tt.braceR)) {
            this.skipSpaceAndNewLine();
            fields.push(this.parseMetadataField());
            this.skipSpaceAndNewLine();
            if (!this.eat(tt.semi) && this.lookahead().type !== tt.braceR) {
                this.unexpected(undefined, undefined, tt.semi, false);
                this.next();
            }
            this.skipSpaceAndNewLine();
        }
        return fields;
    }

    parseMetadata(close: TokenType = tt.eof) {
        const metadata: NodeBase[] = [];
        while (!this.match(close)) {
            this.skipSpaceAndNewLine();
            if (this.match(tt.pre_include)) {
                metadata.push(this.parsePreIncludeStatement(true));
                this.skipSpaceAndNewLine();
            } else {
                metadata.push(this.parseMetadataField());
                this.expect(tt.semi);
            }
            this.skipSpaceAndNewLine();
        }
        return metadata;
    }

}


