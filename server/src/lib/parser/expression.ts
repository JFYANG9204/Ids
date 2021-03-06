import * as charCodes from "../util/charcodes";
import {
    BooleanLiteral,
    DecimalLiteral,
    NullLiteral,
    NumericLiteral,
    StringLiteral,
    Identifier,
    NodeBase,
    MemberExpression,
    Expression,
    UnaryExpression,
    BinaryBase,
    CallExpression,
    CategoricalLiteral,
    CategoryRange,
    BinaryExpression,
    CollectionIteration,
    LevelExpression,
    AggregateExpression,
    AssignmentExpression,
    LogicalExpression,
} from "../types";
import { NodeUtils } from "./node";
import { BinopType, TokenType, types as tt } from "../tokenizer/type";
import { canBeReservedWord } from "../util/identifier";
import { ErrorMessages } from "./error-messages";
import { Position } from "../util/location";
import { ParserBase } from "../base";
import { isNewLine } from "../util/whitespace";
import { isAggregateFunction } from "../util/match";

export class ExpressionParser extends NodeUtils {


    createPlaceHolder(): Expression {
        const node = new Expression(this, this.state.pos, this.state.curPostion());
        node.type = "PlaceHolder";
        return node;
    }

    createMissingCategorical(): Identifier {
        const node = new Identifier(this, this.state.pos, this.state.curPostion());
        node.type = "MissingCategorical";
        return node;
    }

    createEmptyExpression(): Expression {
        let expr = this.startNode(Expression);
        return this.finishNode(expr, "Expression");
    }

    parseLiteralAtNode<T extends NodeBase>(value: string, type: string, node: T) {
        this.addExtra(node, "rawValue", value);
        this.addExtra(node, "raw", this.input.slice(node.start, this.state.end));
        this.next();
        return this.finishNode(node, type);
    }

    parseLiteral<T extends NodeBase>(value: string, type: string, n: new (parser: ParserBase, pos: number, loc: Position) => T) {
        const node = this.startNode(n);
        return this.parseLiteralAtNode(value, type, node);
    }

    parseStringLiteral(value: string) {
        const node = this.parseLiteral(value, "StringLiteral", StringLiteral);
        const strPos = this.state.start;
        for (let i = 0; i < value.length; i++) {
            const chr = value.charCodeAt(i);
            const lastChr = value.charCodeAt(i - 1);
            if (isNewLine(chr) && !isNewLine(lastChr) &&
                lastChr !== charCodes.backslash && lastChr !== charCodes.underscore) {
                this.raise(
                    strPos + i,
                    ErrorMessages["StringLineFeedNeedNewlineChar"]
                );
            }
        }
        return node;
    }

    parseNumericLiteral(value: string) {
        const node = this.parseLiteral(value, "NumericLiteral", NumericLiteral);
        return node;
    }

    parseDecimalLiteral(value: string) {
        const node = this.parseLiteral(value, "DecimalLiteral", DecimalLiteral);
        return node;
    }

    parseBooleanLiteral(value: string) {
        const node = this.startNode(BooleanLiteral);
        this.next();
        return this.finishNode(node, "BooleanLiteral");
    }

    parseNullLiteral() {
        const node = this.startNode(NullLiteral);
        this.next();
        return this.finishNode(node, "NullLiteral");
    }

    parseIdentifier(allowKeyword?: boolean) {
        const node = this.startNode(Identifier);
        const name = this.parseIdentifierName(allowKeyword);
        return this.createIdentifier(node, name);
    }

    parseIdentifierName(allowKeyword?: boolean) {
        let name: string;
        const { type } = this.state;
        if (type === tt.identifier) {
            name = this.state.value;
        } else if (type.keyword) {
            name = type.keyword;
        } else {
            throw this.unexpected();
        }
        if (!allowKeyword) {
            this.checkReserveWord(name, this.state.pos);
        }
        this.next();
        return name;
    }

    checkReserveWord(word: string, startLoc: number) {
        if (!canBeReservedWord(word.toLowerCase())) {
            return;
        }
        this.raise(startLoc, ErrorMessages["UnexpectedKeyword"], word);
    }

    createIdentifier(node: Identifier, name: string): Identifier {
        node.name = name;
        node.loc.identifierName = name;
        const id = this.finishNode(node, "Identifier");
        return id;
    }

    parseMember(
        base: Expression,
        computed: boolean
    ): MemberExpression {
        const node = this.startNodeAt(base.start, base.loc.start, MemberExpression);
        node.object = base;
        node.computed = computed;
        const property = computed ?
            this.parseBracket() :
            this.parseIdentifier(true);
        node.property = property;
        node.push(node.property, node.object);
        return this.finishNodeAt(node, "MemberExpression", this.state.lastTokenEnd, this.state.lastTokenEndLoc);
    }

    parseMaybeUnary(): Expression {
        if (this.state.type.prefix) {
            const node = this.startNode(UnaryExpression);
            node.operator = this.state.value;
            node.prefix = true;
            this.next();
            node.argument = this.parseMaybeUnary();
            node.push(node.argument);
            return this.finishNode(node, "UnaryExpression");
        }
        return this.parseExprAtom();
    }

    skipExprLineFeed() {
        while (this.match(tt.underscore)) {
            this.next();
        }
    }

    parseMaybeAssign(allowAssign = true, allowPre = false): Expression {
        const startPos = this.state.start;
        const startLoc = this.state.startLoc;
        const left = this.parseExprOps(allowAssign, allowPre);
        this.skipExprLineFeed();
        if (this.state.type.binop === BinopType.assign && allowAssign) {
            const node = this.startNodeAt(startPos, startLoc, AssignmentExpression);
            node.operator = this.state.type;
            this.next();
            node.left = left;
            this.skipExprLineFeed();
            node.right = this.parseMaybeAssign(false, allowPre);
            node.push(left, node.right);
            return this.finishNodeAt(node, "AssignmentExpression", this.state.lastTokenEnd, this.state.lastTokenEndLoc);
        }
        return left;
    }

    parseLevelExpr(prefix?: Expression): LevelExpression {
        const node = this.startNode(LevelExpression);
        let uplvl = false;
        if (prefix) {
            node.prefix = prefix;
        }
        if (this.match(tt.caret)) {
            const op = this.startNode(Expression);
            this.expect(tt.dot);
            this.finishNode(op, "LevelOperator");
            node.operator = op;
            // ^.^.Region = {South}
            if (this.match(tt.caret)) {
                return this.parseLevelExpr(op);
            }
            const id = this.state.value;
            // ^.Sum(Vehicle.(VehicleType = {Motorbike}))
            if (isAggregateFunction(id)) {
                const startPos = this.state.pos;
                const startLoc = this.state.curPostion();
                node.suffix = this.parseAggregate(
                    this.parseIdentifier(),
                    startPos,
                    startLoc
                );
            } else {
                node.suffix = this.parseCallOrMember();
            }
        } else {
            this.expect(tt.braceL);
            uplvl = true;
            node.suffix = this.parseMaybeAssign(false);
            this.expect(tt.braceR);
        }
        node.upLevel = uplvl;
        node.push(node.suffix);
        return this.finishNode(node, "LevelExpression");
    }

    // Aggegate(ChildLevel.(Expression))
    parseAggregate(
        func: Identifier,
        startPos: number,
        startLoc: Position
    ): AggregateExpression {
        const node = this.startNodeAt(startPos, startLoc, AggregateExpression);
        node.func = func;
        this.expect(tt.braceL);
        const childLvl = this.parseIdentifier();
        node.expr = this.parseLevelExpr(childLvl);
        this.expect(tt.braceR);
        node.push(node.func, node.expr);
        return this.finishNode(node, "AggregateExpression");
    }

    parseExprOps(allowAssign?: boolean, allowPre?: boolean): Expression {
        this.skipExprLineFeed();
        const startPos = this.state.start;
        const startLoc = this.state.startLoc;
        const expr = this.parseMaybeUnary();
        return this.parseExprOp(expr, startPos, startLoc, 0, allowAssign, allowPre);
    }

    parseExprOp(
        left: Expression,
        leftStartPos: number,
        leftStartLoc: Position,
        minPrec: number,
        allowAssign?: boolean,
        allowPre?: boolean,
    ): Expression {
        const prec = this.state.type.precedence;
        if (prec && prec > minPrec && !(allowAssign && this.state.type.binop === BinopType.assign)) {
            const op = this.state.type;
            let node: BinaryBase;
            if (!allowPre && op.isPreprocessor) {
                this.raise(
                    this.state.pos,
                    ErrorMessages["OperatorCanOnlyBeUsedInPreprocessor"],
                    this.state.value);
            }
            if (op.binop === BinopType.logical) {
                node = this.startNodeAt(leftStartPos, leftStartLoc, LogicalExpression);
            } else {
                node = this.startNodeAt(leftStartPos, leftStartLoc, BinaryExpression);
            }
            node.left = left;
            node.operator = this.state.type;
            this.next();
            node.right = this.parseExprOpRightExpr(prec);
            node.push(node.left, node.right);
            this.finishNode(node, node.type);
            return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec);
        }
        return left;
    }

    parseExprOpRightExpr(prec: number): Expression {
        this.skipExprLineFeed();
        const startPos = this.state.start;
        const startLoc = this.state.startLoc;
        return this.parseExprOp(
            this.parseMaybeUnary(),
            startPos,
            startLoc,
            prec
        );
    }

    parseExprAtom(): Expression {

        let next;
        switch (this.state.type) {

            case tt.identifier: return this.parseCallOrMember();
            case tt.number:     return this.parseNumericLiteral(this.state.value);
            case tt.decimal:    return this.parseDecimalLiteral(this.state.value);
            case tt.string:     return this.parseStringLiteral(this.state.value);
            case tt._null:      return this.parseNullLiteral();

            case tt._true:
            case tt._false:
                return this.parseBooleanLiteral(this.state.value);

            case tt.braceL:
                return this.parseParen();
            case tt.curlyL:
                return this.parseCategoricalLiteral();
            case tt.dot:
                return this.parseCallOrMember();

            case tt.plusMin:
                next = this.lookahead();
                if (next.type === tt.number || next.type === tt.decimal) {
                    const isDecimal = next.type === tt.decimal;
                    const node = this.startNode(
                        isDecimal ?
                        DecimalLiteral:
                        NumericLiteral
                    );
                    let val = this.state.value;
                    this.next();
                    val += this.state.value;
                    this.addExtra(node, "raw", val);
                    this.addExtra(node, "rawValue", val);
                    this.finishNode(node,
                        isDecimal ?
                        "DecimalLiteral" : "NumericLiteral");
                    this.next();
                    return node;
                }

            default:
                this.unexpected(undefined, undefined, undefined, false);
                return this.createEmptyExpression();

        }

    }

    parseExpression(
        allowAssign = false,
        allowPre = false,
    ): Expression {
        return this.parseMaybeAssign(allowAssign, allowPre);
    }

    parseBracket(): Expression {
        this.next();
        if (this.match(tt.dot) && this.lookahead().type === tt.dot) {
            const node = this.startNode(CollectionIteration);
            this.eat(tt.dot);
            this.expect(tt.dot);
            if (this.match(tt._in)) {
                node.in = this.parseIdentifier();
                node.push(node.in);
            }
            this.expect(tt.bracketR);
            return this.finishNode(node, "CollectionIteration");
        } else if (this.match(tt.curlyL)) {
            const cat = this.parseCategoricalLiteral();
            this.expect(tt.bracketR);
            return cat;
        } else {
            const node = this.parseMaybeAssign(false);
            this.expect(tt.bracketR);
            return node;
        }
    }

    parseParen(): Expression {
        const lParen = this.startNode(Identifier);
        this.next();
        this.finishNode(lParen, "LeftParen");
        const node = this.parseMaybeAssign(false);
        node.leftParen = lParen;
        if (this.match(tt.braceR)) {
            const rParen = this.startNode(Identifier);
            this.next();
            this.finishNode(rParen, "RightParen");
            node.rightParen = rParen;
        } else {
            this.raise(this.state.pos, ErrorMessages["MissingRightParen"]);
        }
        return this.finishNode(node, node.type);
    }

    parseCallOrAggegateExpression(
        callee: MemberExpression | Identifier | Expression,
    ): CallExpression | AggregateExpression {
        const startPos = callee.start;
        const startLoc = callee.loc.start;
        if (callee instanceof Identifier) {
            const name = callee.name;
            if (isAggregateFunction(name)) {
                return this.parseAggregate(callee, startPos, startLoc);
            }
        }
        const node = this.startNodeAt(startPos, startLoc, CallExpression);
        node.callee = callee;
        this.next();
        node.arguments = this.parseCallExpressionArguments(tt.braceR);
        node.pushArr(node.arguments);
        node.push(node.callee);
        return this.finishNode(node, "CallExpression");
    }

    parseCallExpressionArguments(
        close: TokenType,
    ): Array<Expression> {
        const args: Array<Expression> = [];
        let comma = false;
        while (!this.eat(close)) {
            if (comma) {
                this.expect(tt.comma);
                comma = false;
            } else {
                let arg;
                if (this.match(tt.comma)) {
                    arg = this.createPlaceHolder();
                } else {
                    arg = this.parseExpression();
                }
                args.push(arg);
                comma = true;
            }
        }
        return args;
    }

    parseCallOrMember(prefix?: Expression, hasUnderscore?: boolean): Expression {

        if (prefix && this.hasPrecedingLineBreak() && !hasUnderscore) {
            return prefix;
        }

        let expr = this.createEmptyExpression();
        if (prefix) {
            expr = prefix;
        } else if (this.match(tt.identifier)) {
            expr = this.parseIdentifier();
            if (this.hasPrecedingLineBreak()) {
                return expr;
            }
        }

        if (this.match(tt.bracketL)) {
            expr = this.parseMember(expr, true);
            return this.parseCallOrMember(expr);
        }

        if (this.match(tt.dot)) {
            this.next();
            if (this.hasPrecedingLineBreak()) {
                throw this.raise(this.state.pos, ErrorMessages["MemberOrMethodHasLineBreak"]);
            }
            expr = this.parseMember(expr, false);
            return this.parseCallOrMember(expr);
        }

        if (this.match(tt.braceL)) {
            expr = this.parseCallOrAggegateExpression(expr);
            return this.parseCallOrMember(expr);
        }

        return expr;
    }

    /**
     * ??????'{}'?????????Categorical???????????????????????????Identifier?????????????????????????????????
     * - ??????????????????: `{ x1 .. y1, x2 .. y2, ... }`
     * - ??????: `{ }`
     * - ??????(??????)??????: `{ ^x1, }`, `{ ^x1 .. y1 }`, `{ x1 .. y1, ^x2 .. y2 }`
     * - ????????????: `{ x1 .. }`????????????x1???????????????????????????????????????.
     * - ????????????: `{ .. y1 }`?????????????????????????????????????????????????????????y1
     * - ???????????????: `{ .. }`
     *
     * @returns Categorical???????????????
     */
    parseCategoricalLiteral(): CategoricalLiteral {
        // ??????'{'
        const node = this.startNode(CategoricalLiteral);
        this.next();
        let comma = false;
        while (!this.eat(tt.curlyR)) {
            if (this.match(tt.comma)) {
                if (comma) {
                    node.categories.push(this.createMissingCategorical());
                    this.next();
                } else {
                    comma = true;
                }
            } else {
                node.categories.push(this.parseCategoryOrRange());
                comma = false;
            }
        }
        node.pushArr(node.categories);
        this.addExtra(node, "declaration", this.scope.get("Categorical")?.result);
        return this.finishNode(node, "CategoricalLiteral");
    }

    parseCategoryOrRange(): CategoryRange | Identifier | NumericLiteral {
        const next = this.lookahead();
        if (
            this.match(tt.caret) ||
            ((this.match(tt.identifier) || this.match(tt.number)) && next.type === tt.dot) ||
            this.match(tt.dot)
        ) {
            return this.parseCategoryRange();
        } else if (this.match(tt.number)) {
            return this.parseNumericLiteral(this.state.value);
        } else {
            return this.parseIdentifier(true);
        }
    }

    parseCategoryRange(): CategoryRange {
        const node = this.startNode(CategoryRange);
        let exclude = false;
        let ubound: Identifier | NumericLiteral | undefined = undefined;
        let lbound: Identifier | NumericLiteral | undefined = undefined;

        if (this.match(tt.caret)) {
            exclude = true;
            this.next();
        }

        if (this.match(tt.identifier) || this.state.type.keyword) {
            lbound = this.parseIdentifier(true);
            node.push(lbound);
        } else if (this.match(tt.number)) {
            lbound = this.parseNumericLiteral(this.state.value);
            node.push(lbound);
        } else if (this.match(tt.dot)) {
            if (exclude) {
                this.raise(
                    this.state.pos,
                    ErrorMessages["CategoryExcludeRangeLostBoundary"]
                );
            }
        } else {
            this.unexpected();
        }

        // ??????'..'
        if (this.match(tt.dot)) {
            if(lbound) {
                this.expect(tt.dot);
            }
            this.expect(tt.dot);
        }

        if (this.match(tt.identifier) || this.state.type.keyword) {
            ubound = this.parseIdentifier(true);
            node.push(ubound);
            if (lbound && !(lbound instanceof Identifier)) {
                this.raiseAtNode(
                    ubound,
                    ErrorMessages["CategoryExcludeRangeTypeError"],
                    false,
                );
            }
        } else if (this.match(tt.number)) {
            ubound = this.parseNumericLiteral(this.state.value);
            node.push(ubound);
            if (lbound && !(lbound instanceof NumericLiteral)) {
                this.raiseAtNode(
                    ubound,
                    ErrorMessages["CategoryExcludeRangeTypeError"],
                    false
                );
            }
        }

        node.entire = !lbound && !ubound;
        node.exclude = exclude;
        node.startId = lbound;
        node.endId = ubound;

        return this.finishNode(node, "CategoryRange");
    }

}


