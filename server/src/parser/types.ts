
namespace ds {

    export enum ScriptKind {
        dms,
        mrs
    }

    export enum FileKind {
        declare,
        script,
        metadata
    }

    export interface Position {
        /**
         * 0开始的行号
         */
        line: number;
        /**
         * 0开始的列号
         */
        character: number;
    }

    export const INVALID_POSITION: Position = { line: -1, character: -1 };

    export interface Range {
        start: Position;
        end: Position;
    }

    export interface ReadonlyRange {
        readonly start: Position;
        readonly end: Position;
    }

    export const INVALID_RANGE: ReadonlyRange = { start: INVALID_POSITION, end: INVALID_POSITION };

    export const enum SyntaxKind {
        endOfFileToken = 0,
        singleLineComment,
        multiLineComment,
        newLine,
        whitespace,
        numericLiteral,
        stringLiteral,
        categoricalElementLiteral,
        categoricalElementRangeLiteral,
        categoricalLiteral,
        openBraceToken,
        closeBraceToken,
        openParenToken,
        closeParenToken,
        openBracketToken,
        closeBracketToken,
        dotToken,
        dotDotToken,
        semicolonToken,
        commaToken,
        caretToken,
        colonToken,
        lessThanToken,
        greaterThanToken,
        lessThanEqualsToken,
        greaterThanEqualsToken,
        plusToken,
        minusToken,
        asteriskToken,
        slashToken,
        backSlashToken,
        equalsToken,
        underscoreToken,
        hashToken,
        // `||` `&&` 仅在预处理#if中使用
        barBarToken,
        ampersandAmpersandToken,
        identifier,
        // 关键字
        andKeyword,
        caseKeyword,
        constKeyword,
        dimKeyword,
        doKeyword,
        eachKeyword,
        elseKeyword,
        elseIfKeyword,
        endKeyword,
        enumKeyword,
        errorKeyword,
        exitKeyword,
        exlplicitKeyword,
        falseKeyword,
        forKeyword,
        functionKeyword,
        globalVariablesKeyword,
        gotoKeywords,
        ifKeyword,
        implementsKeyword,
        implicitKeyword,
        inKeyword,
        isKeyword,
        likeKeyword,
        loopKeyword,
        modKeyword,
        nextKeyword,
        notKeyword,
        nullKeyword,
        onKeyword,
        optionKeyword,
        optionalKeyword,
        orKeyword,
        paperKeyword,
        resumeKeyword,
        sectionKeyword,
        selectKeyword,
        stepKeyword,
        subKeyword,
        thenKeyword,
        toKeyword,
        trueKeyword,
        untilKeyword,
        whileKeyword,
        withKeyword,
        xorKeyword,
        // Declare关键字
        defaultKeyword,
        namespaceKeyword,
        interfaceKeyword,
        classKeyword,
        readonlyKeyword,
        writeonlyKeyword,
        propertyKeyword,
        paramArrayKeyword,
        getKeyword,
        setKeyword,
        asKeyword,
        ofKeyword,
        //
        parameter,
        propertySignature,
        methodSignature,
        getAccessor,
        setAccessor,
        bindingElement,
        objectBindingPattern,
        arrayBindingPattern,
        arrayLiteralExpression,
        computedPropertyName,
        propertyAccessExpression,
        callExpression,
        parenthesizedExpression,
        prefixUnaryExpression,
        binaryExpression,
        variableDeclaration,
        functionDeclaration,
        classDeclaration,
        interfaceDeclaration,
        heritageClause,
        namespaceDeclaration,
        enumDeclaration,
        enumMember,
        variableDeclarationList,
        // Elements
        block,
        emptyStatement,
        expressionStatement,
        ifStatement,
        doStatement,
        whileStatement,
        forStatement,
        forEachStatement,
        exitStatement,
        gotoStatement,
        withStatement,
        selectStatement,
        caseBlock,
        caseClause,
        defaultClause,
        sectionStatement,
    }

    export type TriviaSyntaxKind =
        | SyntaxKind.singleLineComment
        | SyntaxKind.multiLineComment
        | SyntaxKind.whitespace
        | SyntaxKind.newLine
        ;

    export type DeclareKeywordsSyntaxKind =
        | SyntaxKind.namespaceKeyword
        | SyntaxKind.classKeyword
        | SyntaxKind.interfaceKeyword
        | SyntaxKind.implementsKeyword
        | SyntaxKind.propertyKeyword
        | SyntaxKind.getKeyword
        | SyntaxKind.setKeyword
        | SyntaxKind.enumKeyword
        | SyntaxKind.optionalKeyword
        | SyntaxKind.paramArrayKeyword
        | SyntaxKind.defaultKeyword
        | SyntaxKind.ofKeyword
        | SyntaxKind.asKeyword
        | SyntaxKind.readonlyKeyword
        | SyntaxKind.writeonlyKeyword
        | SyntaxKind.subKeyword
        | SyntaxKind.functionKeyword
        | SyntaxKind.endKeyword
        ;

    export type ScriptKeywordsSyntaxKind =
        | SyntaxKind.andKeyword
        | SyntaxKind.caseKeyword
        | SyntaxKind.constKeyword
        | SyntaxKind.dimKeyword
        | SyntaxKind.doKeyword
        | SyntaxKind.eachKeyword
        | SyntaxKind.elseKeyword
        | SyntaxKind.elseIfKeyword
        | SyntaxKind.endKeyword
        | SyntaxKind.errorKeyword
        | SyntaxKind.exitKeyword
        | SyntaxKind.exlplicitKeyword
        | SyntaxKind.falseKeyword
        | SyntaxKind.forKeyword
        | SyntaxKind.functionKeyword
        | SyntaxKind.globalVariablesKeyword
        | SyntaxKind.gotoKeywords
        | SyntaxKind.ifKeyword
        | SyntaxKind.implicitKeyword
        | SyntaxKind.inKeyword
        | SyntaxKind.isKeyword
        | SyntaxKind.likeKeyword
        | SyntaxKind.loopKeyword
        | SyntaxKind.modKeyword
        | SyntaxKind.nextKeyword
        | SyntaxKind.notKeyword
        | SyntaxKind.nullKeyword
        | SyntaxKind.ofKeyword
        | SyntaxKind.onKeyword
        | SyntaxKind.optionKeyword
        | SyntaxKind.orKeyword
        | SyntaxKind.paperKeyword
        | SyntaxKind.resumeKeyword
        | SyntaxKind.sectionKeyword
        | SyntaxKind.selectKeyword
        | SyntaxKind.setKeyword
        | SyntaxKind.stepKeyword
        | SyntaxKind.subKeyword
        | SyntaxKind.thenKeyword
        | SyntaxKind.toKeyword
        | SyntaxKind.trueKeyword
        | SyntaxKind.untilKeyword
        | SyntaxKind.whileKeyword
        | SyntaxKind.withKeyword
        | SyntaxKind.xorKeyword
        ;

    export type KeywordsSyntaxKind = DeclareKeywordsSyntaxKind | ScriptKeywordsSyntaxKind;

    export type PunctuationSyntaxKind =
        | SyntaxKind.plusToken
        | SyntaxKind.minusToken
        | SyntaxKind.lessThanToken
        | SyntaxKind.lessThanEqualsToken
        | SyntaxKind.greaterThanToken
        | SyntaxKind.greaterThanEqualsToken
        | SyntaxKind.equalsToken
        | SyntaxKind.asteriskToken
        | SyntaxKind.barBarToken
        | SyntaxKind.ampersandAmpersandToken
        | SyntaxKind.semicolonToken
        | SyntaxKind.colonToken
        | SyntaxKind.commaToken
        | SyntaxKind.caretToken
        | SyntaxKind.slashToken
        | SyntaxKind.backSlashToken
        | SyntaxKind.dotToken
        | SyntaxKind.dotDotToken
        | SyntaxKind.hashToken
        | SyntaxKind.underscoreToken
        ;

    export type ModifierSyntaxKind =
        | SyntaxKind.readonlyKeyword
        | SyntaxKind.writeonlyKeyword
        | SyntaxKind.defaultKeyword
        ;

    export type LiteralSyntaxKind =
        | SyntaxKind.stringLiteral
        | SyntaxKind.numericLiteral
        | SyntaxKind.categoricalLiteral
        | SyntaxKind.categoricalElementLiteral
        | SyntaxKind.categoricalElementRangeLiteral
        ;

    export const enum NodeFlags {
        none       = 0,
        dim        = 1,
        const      = 2,
        namespace  = 3,
    }

    export const enum ModifierFlags {
        none      = 0,
        default   = 1,
        readonly  = 2,
        writeonly = 3
    }

    export const enum RelationalComparisionResult {
        succeed,
        failed,
    }

    export interface Comment extends ReadonlyRange {
        readonly kind: SyntaxKind.singleLineComment | SyntaxKind.multiLineComment;
        readonly value: string;
    }

    export interface CommentWhitespace extends ReadonlyRange {
        readonly comments: Array<Comment>;
        readonly leadingNode?: Node;
        readonly trailingNode?: Node;
        readonly containerNode?: Node;
        _commentWhitespace: any;
    }

    export interface Node extends ReadonlyRange {
        readonly kind: SyntaxKind;
        readonly flags: NodeFlags;
        readonly modifiers?: Array<Modifier>;// 针对声明文件，保存类成员的修饰符
        readonly parent: Node;               // 父节点
        symbol: Symbol;                      // 此节点的符号
        localSymbol?: Symbol;                // 对于引用声明变量的节点，此属性为声明符号对象
        locals?: SymbolTable;                // 此节点相关联的符号表
        original?: Node;                     // 如果此节点更新过，保存原始节点
        fsPath: string;                      // 文件系统路径
        leadingComment?: CommentWhitespace;  // `Node`前注释
        trailingComment?: CommentWhitespace; // `Node`后注释
        innerComment?: CommentWhitespace;    // `Node`内注释
    }

    export interface TypeBindingNode extends Node {
        _typeBindingNode: any;
    }

    export interface NodeArray<T extends Node> extends Range {
        readonly nodes: Array<T>;
    }

    export interface Token<TKind extends SyntaxKind> extends Node {
        readonly kind: TKind;
    }

    // types
    export type EndOfFileToken = Token<SyntaxKind.endOfFileToken>;

    // 符号
    export interface PunctuationToken<TKind extends PunctuationSyntaxKind> extends Node {
        readonly kind: TKind;
    }

    export type DotToken = PunctuationToken<SyntaxKind.dotToken>;
    export type CommaToken = PunctuationToken<SyntaxKind.commaToken>;
    export type SemicolonToken = PunctuationToken<SyntaxKind.semicolonToken>;
    export type ColonToken = PunctuationToken<SyntaxKind.colonToken>;
    export type AsteriskToken = PunctuationToken<SyntaxKind.asteriskToken>;
    export type SlashToken = PunctuationToken<SyntaxKind.slashToken>;
    export type UnderscoreToken = PunctuationToken<SyntaxKind.underscoreToken>;
    export type CaretToken = PunctuationToken<SyntaxKind.caretToken>;
    export type DotDotToken = PunctuationToken<SyntaxKind.dotDotToken>;

    // 关键字
    export interface KeywordToken<TKind extends KeywordsSyntaxKind> extends Node {
        readonly kind: TKind;
    }

    export type ReadonlyKeyword = KeywordToken<SyntaxKind.readonlyKeyword>;
    export type WriteonlyKeyword = KeywordToken<SyntaxKind.writeonlyKeyword>;
    export type DefaultKeyword = KeywordToken<SyntaxKind.defaultKeyword>;
    export type OptionalKeyword = KeywordToken<SyntaxKind.optionalKeyword>;
    export type ConstKeyword = KeywordToken<SyntaxKind.constKeyword>;
    export type ParamArrayKeyword = KeywordToken<SyntaxKind.paramArrayKeyword>;
    export type ImplementsKeyword = KeywordToken<SyntaxKind.implementsKeyword>;

    export type Modifier = ReadonlyKeyword | WriteonlyKeyword | DefaultKeyword | ConstKeyword | OptionalKeyword;
    export type PropertyModifier = ReadonlyKeyword | WriteonlyKeyword | DefaultKeyword;
    export type ParameterModifier = OptionalKeyword | ParamArrayKeyword;

    //

    export const enum SymbolFlags {
        none                    = 0,
        functionScopedVariable  = 1 << 0,
        property                = 1 << 1,
        enumMember              = 1 << 2,
        function                = 1 << 3,
        class                   = 1 << 4,
        interface               = 1 << 5,
        namespace               = 1 << 6,
        method                  = 1 << 7,
        getAccessor             = 1 << 8,
        setAccessor             = 1 << 9,
        signature = SymbolFlags.property | SymbolFlags.function | SymbolFlags.method,
        classMember = SymbolFlags.property | SymbolFlags.function,
    }

    export interface Symbol {
        flags: SymbolFlags;     // 符号类型标记
        name: string;           // 符号名
        declarations?: Declaration[];
        members?: SymbolTable;
    }

    export type SymbolTable = Map<string, Symbol>;

    export const enum TypeFlags {
        variant         = 0,
        unknown         = 1 << 0,
        string          = 1 << 1,
        number          = 1 << 2,
        boolean         = 1 << 3,
        enumerator      = 1 << 4,
        stringLiteral   = 1 << 5,
        numberLiteral   = 1 << 6,
        booleanLiteral  = 1 << 7,
        null            = 1 << 8,
        literal = stringLiteral | numberLiteral | booleanLiteral,
        stringOrNumberLiteral = stringLiteral | numberLiteral,
        numberLike = number | numberLiteral | enumerator,
        stringLike = string | stringLiteral,
        booleanLike = boolean | booleanLiteral,
    }

    export interface Type {
        flags: TypeFlags;
        symbol: Symbol;
    }

    export interface LiteralType extends Type {
        value: string | number | boolean;
    }

    export interface StringLiteralType extends LiteralType {
        value: string;
    }

    export interface NumberLiteralType extends LiteralType {
        value: number;
    }

    export interface BooleanLiteralType extends LiteralType {
        value: boolean;
    }

    export const enum ObjectFlags {
        class,
        interface
    }

    // 加入'_'开头属性是为了区分不同的类型，例如`Expression`，如果不加`_expression`这个属性，
    // 那么`Expression`和`Node`就没有任何区别，如果把任何`Node`的派生类赋值给`Expression`都不会
    // 报错。


    /////////////////
    // Declaration //
    /////////////////

    export interface Declaration extends Node {
        readonly name: BindName;
        _declaration: any;
    }

    export interface VariableDeclaration extends Declaration {
        readonly kind: SyntaxKind.variableDeclaration;
        readonly parent: VariableDeclarationList;
        readonly initializer?: Expression;
    }

    export interface VariableDeclarationList extends Node {
        readonly kind: SyntaxKind.variableDeclarationList;
        readonly parent: ForStatement;
    }

    export interface ParameterDeclaration extends Declaration {
        readonly kind: SyntaxKind.parameter;
        readonly parent: SignatureDeclaration;
        readonly optional?: OptionalKeyword;
        readonly paramArray?: ParamArrayKeyword;
        readonly initializer?: Expression;
    }

    export interface SignatureDeclaration extends Declaration {
    }

    export interface InterfaceDeclaration extends Declaration {
        readonly kind: SyntaxKind.interfaceDeclaration;
        readonly heritageClauses?: NodeArray<HeritageClause>;
    }

    export interface HeritageClause extends Node {
        readonly kind: SyntaxKind.heritageClause;
        readonly parent: InterfaceDeclaration;
        readonly keyword: ImplementsKeyword;
    }

    export interface BindingElement extends Declaration {
        readonly kind: SyntaxKind.bindingElement;
        readonly parent: VariableDeclaration | ParameterDeclaration;
    }

    export interface EnumMember extends Declaration {
        readonly kind: SyntaxKind.enumMember;
        readonly name: Identifier;
        readonly parent: EnumDelcaration;
        readonly initializer?: Expression;
    }

    export interface EnumDelcaration extends Declaration {
        readonly kind: SyntaxKind.enumDeclaration;
        readonly name: Identifier;
        readonly members: NodeArray<EnumMember>;
    }

    ////////////////////////
    /////  Expression   ////
    ////////////////////////

    export interface Expression extends Node {
        _expression: any;
    }

    export interface UnaryExpression extends Expression {
        _unaryExpression: any;
    }

    export type PrefixUnaryOperator = SyntaxKind.notKeyword | SyntaxKind.plusToken | SyntaxKind.minusToken;

    export interface PrefixUnaryExpression extends UnaryExpression {
        readonly kind: SyntaxKind.prefixUnaryExpression;
        readonly operator: PrefixUnaryOperator;
        readonly expression: Expression;
    }

    export interface LeftHandSideExpression extends UnaryExpression {
        _leftHandSideExpression: any;
    }

    export interface MemberExpression extends LeftHandSideExpression {
        _memberExpression: any;
    }

    export interface PrimaryExpression extends MemberExpression {
        _primaryExpression: any;
    }

    export interface NullLiteral extends PrimaryExpression {
        readonly kind: SyntaxKind.nullKeyword;
    }

    export interface TrueLiteral extends PrimaryExpression {
        readonly kind: SyntaxKind.trueKeyword;
    }

    export interface FalseLiteral extends PrimaryExpression {
        readonly kind: SyntaxKind.falseKeyword;
    }

    export type BooleanLiteral = TrueLiteral | FalseLiteral;

    export interface LiteralLikeNode extends Node {
        text: string;
        isUnterminated?: boolean;
    }

    export interface LiteralExpression extends LiteralLikeNode, PrimaryExpression {
        _literalExpression: any;
    }

    export interface StringLiteral extends LiteralExpression, Declaration {
        readonly kind: SyntaxKind.stringLiteral;
    }

    export interface NumericLiteral extends LiteralExpression, Declaration {
        readonly kind: SyntaxKind.numericLiteral;
    }

    export interface CategoryElement extends LiteralExpression {
        readonly kind: SyntaxKind.categoricalElementLiteral;
        readonly text: string;
        readonly caret?: CaretToken;
    }

    export interface CategoryRange extends LiteralExpression {
        readonly kind: SyntaxKind.categoricalElementRangeLiteral;
        readonly text: string;
        readonly caret?: CaretToken;
        readonly dotDot: DotDotToken;
        readonly startElement?: CategoryElement;
        readonly endElement?: CategoryElement;
    }

    export type CategoricalElement = CategoryElement | CategoryRange | CommaToken;

    export interface CategoricalLiteral extends LiteralExpression, Declaration {
        readonly kind: SyntaxKind.categoricalLiteral;
        readonly elements: NodeArray<CategoricalElement>;
    }

    export interface ArrayLiteralExpression extends PrimaryExpression {
        readonly kind: SyntaxKind.arrayLiteralExpression;
        readonly elements: NodeArray<Expression>;
    }

    export interface ParenthesizedExpression extends PrimaryExpression {
        readonly kind: SyntaxKind.parenthesizedExpression;
        readonly expression: Expression;
    }

    export type MultiplicativeOperator = SyntaxKind.asteriskToken | SyntaxKind.slashToken | SyntaxKind.modKeyword;
    export type AdditiveOperator = SyntaxKind.plusToken | SyntaxKind.minusToken;
    export type AdditiveOperatorOrHigher = MultiplicativeOperator | AdditiveOperator;
    export type RelationalOperator = SyntaxKind.lessThanToken | SyntaxKind.greaterThanToken | SyntaxKind.lessThanEqualsToken | SyntaxKind.greaterThanEqualsToken;
    export type RelationalOperatorOrHigher = AdditiveOperatorOrHigher | RelationalOperator;
    export type EqualityOperator = SyntaxKind.equalsToken;
    export type EqualityOperatorOrHigher = EqualityOperator | RelationalOperatorOrHigher;
    export type LogicalOperator = SyntaxKind.andKeyword | SyntaxKind.orKeyword | SyntaxKind.xorKeyword | SyntaxKind.ampersandAmpersandToken | SyntaxKind.barBarToken;
    export type LogicalOperatorOrHigher = LogicalOperator | EqualityOperatorOrHigher;
    export type AssignmentOperator = SyntaxKind.equalsToken;
    export type AssignmentOperatorOrHigher = AssignmentOperator | LogicalOperatorOrHigher;
    export type BinaryOperator = AssignmentOperatorOrHigher | SyntaxKind.commaToken;
    export type PreprocessorLogicalOperator = SyntaxKind.ampersandAmpersandToken | SyntaxKind.barBarToken;
    export type BinaryOperatorToken = Token<BinaryOperator>;

    export interface BinaryExpression extends Expression, Declaration {
        readonly kind: SyntaxKind.binaryExpression;
        readonly left: Expression;
        readonly operator: BinaryOperatorToken;
        readonly right: Expression;
    }

    export type AssignmentOperatorToken = Token<AssignmentOperator>;
    export interface AssignmentExpression extends Expression {
    }

    export interface Identifier extends Node {
        readonly kind: SyntaxKind.identifier;
        readonly text: string;
    }

    export interface ComputedPropertyName extends Node {
        readonly kind: SyntaxKind.computedPropertyName;
        readonly parent: Declaration;
        readonly expression: Expression;
    }

    export type PropertyName = Identifier | StringLiteral | NumericLiteral | ComputedPropertyName;

    export interface ObjectBindingPattern extends Node {
        readonly kind: SyntaxKind.objectBindingPattern;
        readonly parent: VariableDeclaration | ParameterDeclaration | BindingElement;
        readonly elements: NodeArray<BindingElement>;
    }

    export interface ArrayBindingPattern extends Node {
        readonly kind: SyntaxKind.arrayBindingPattern;
        readonly parent: VariableDeclaration | ParameterDeclaration | BindingElement;
    }

    export type BindName = Identifier;

    //////////////////////
    ////  Statement   ////
    //////////////////////

    export interface Statement extends Node {
        _statement: any;
    }

    export interface EmptyStatement extends Statement {
        readonly kind: SyntaxKind.emptyStatement;
    }

    export interface Block extends Statement {
        readonly kind: SyntaxKind.block;
        readonly statements: NodeArray<Statement>;
    }

    export interface ExpressionStatement extends Statement {
        readonly kind: SyntaxKind.expressionStatement;
        readonly expression: Expression;
    }

    export interface IfStatement extends Statement {
        readonly kind: SyntaxKind.ifStatement;
        readonly test: Expression;
        readonly thenStatement: Statement;
        readonly elseStatement?: Statement;
    }

    export interface IterationStatement extends Statement {
        readonly statement: Statement;
    }

    export interface DoStatement extends IterationStatement {
        readonly kind: SyntaxKind.doStatement;
        readonly test: Expression;
    }

    export interface WhileStatement extends IterationStatement {
        readonly kind: SyntaxKind.whileStatement;
        readonly test: Expression;
    }

    export type ForLikeStatement = ForStatement | ForEachStatement;

    export interface ForStatement extends IterationStatement {
        readonly kind: SyntaxKind.forStatement;
        readonly variable: Identifier;
        readonly lowerBound: NumericLiteral | Expression;
        readonly upperBound: NumericLiteral | Expression;
    }

    export interface ForEachStatement extends IterationStatement {
        readonly kind: SyntaxKind.forEachStatement;
        readonly variable: Identifier;
        readonly collection: Expression;
    }

    export interface WithStatement extends Statement {
        readonly kind: SyntaxKind.withStatement;
        readonly expression: Expression;
        readonly statement: Statement;
    }

    export interface SelectStatement extends Statement {
        readonly kind: SyntaxKind.selectStatement;
        readonly expression: Expression;
        readonly caseBlock: CaseBlock;
    }

    export interface CaseBlock extends Node {
        readonly kind: SyntaxKind.caseBlock;
        readonly parent: SelectStatement;
        readonly cases: NodeArray<CaseOrDefaultClause>;
    }

    export interface CaseClause extends Node {
        readonly kind: SyntaxKind.caseClause;
        readonly parent: CaseBlock;
        readonly expression: NodeArray<Expression>;
        readonly statements: NodeArray<Statement>;
    }

    export interface DefaultClause extends Node {
        readonly kind: SyntaxKind.defaultClause;
        readonly parent: CaseBlock;
        readonly statements: NodeArray<Statement>;
    }

    export type CaseOrDefaultClause = CaseClause | DefaultClause;




}
