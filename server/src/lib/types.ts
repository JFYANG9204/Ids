import { ParserBase } from "./base";
import { SourceType } from "./options";
import { Parser } from "./parser";
import { ParsingError } from "./parser/errors";
import { Token, TokenType, types } from "./tokenizer/type";
import { Position, SourceLocation } from "./util/location";
import { Scope } from "./util/scope";

const emptyLoc = new Position(0, 0);

export class NodeBase {
    type: string;
    start: number;
    end: number;
    loc: SourceLocation;
    comments: Array<Comment> = [];
    leadingComments: Array<Comment> = [];
    innerComments: Array<Comment> = [];
    trailingComments: Array<Comment> = [];
    extra: { [key: string]: any } = {};
    positionMap: NodeBase[] = [];
    treeParent?: NodeBase;

    constructor(parser: ParserBase, pos: number, loc: Position) {
        this.type = "",
        this.start = pos;
        this.end = 0;
        this.loc = new SourceLocation(loc);
        this.loc.fileName = parser.fileName;
    }

    push(...nodes: NodeBase[]) {
        for (const node of nodes) {
            node.treeParent = this;
            this.positionMap.push(node);
        }
    }

    pushArr(nodes: NodeBase[]) {
        for (const node of nodes) {
            node.treeParent = this;
            this.positionMap.push(node);
        }
    }
}

export type Comment = {
    type: "CommentLine" | "CommentBlock",
    value: string,
    start: number,
    end: number,
    loc: SourceLocation,
};

//

export type CommentWhitespace = {
    start: number;
    end: number;
    comments: Array<Comment>;
    leadingNode?: NodeBase;
    trailingNode?: NodeBase;
    containerNode?: NodeBase;
};

// Node

export class Expression extends NodeBase {
    leftParen?: Identifier;
    rightParen?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "Expression";
    }
}

export class Statement extends NodeBase {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "Statement";
    }
}
//

export class DeclarationBase extends NodeBase {
    declare?: true;
    enumerable: boolean = false;
    name: Identifier;
    namespace?: NamespaceDeclaration | string;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.declare = true;
        this.name = new Identifier(parser, pos, loc);
    }
}

//

export class Identifier extends NodeBase {
    name = "";
    opional?: boolean;

    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "Identifier";
    }
}

export class LineMark extends NodeBase {
    id: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "LineMark";
        this.id = new Identifier(parser, pos, loc);
    }
}

export class PrivateName extends NodeBase {
    id: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.id = new Identifier(parser, pos, loc);
    }
}

// Literal

export class NullLiteral extends NodeBase {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "NullLiteral";
    }
}

export class StringLiteral extends NodeBase {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "StringLiteral";
    }
}

export class BooleanLiteral extends NodeBase {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "BooleanLiteral";
    }
}

export class NumericLiteral extends NodeBase {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "NumericLiteral";
    }
}

export class DecimalLiteral extends NodeBase {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "DecimalLiteral";
    }
}

export class CategoricalLiteral extends NodeBase {
    categories: Array<NumericLiteral | Identifier | CategoryRange> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "CategoricalLiteral";
    }
}

export type Literal =
    | NullLiteral
    | StringLiteral
    | BooleanLiteral
    | NumericLiteral
    | DecimalLiteral
    | CategoricalLiteral;

export class CategoryRange extends NodeBase {
    startId?: Identifier | NumericLiteral;
    endId?: Identifier | NumericLiteral;
    entire?: boolean;
    exclude = false;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "CategoryRange";
    }
}

export class CollectionIteration extends NodeBase {
    in?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "CollectionIteration";
    }
}

export class LevelExpression extends NodeBase {
    prefix?: Expression;
    suffix: Expression;
    operator: Expression;
    upLevel = false;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "LevelExpression";
        this.operator = this.suffix = new Expression(parser, pos, loc);
    }
}

export class AggregateExpression extends NodeBase {
    prefix?: Expression;
    expr?: LevelExpression;
    func?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "AggregateExpression";
    }
}

//

export enum PreprocessorType {
    include,
    define,
    undef,
    if,
    elif,
    else,
    endif,
    error,
    line
}

export class PreprocessorBase extends NodeBase {
    preType: PreprocessorType;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "Preprocessor";
        this.preType = PreprocessorType.define;
    }
}

export class PreDefineStatement extends PreprocessorBase {
    declaration: MacroDeclaration;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "PreDefineStatement";
        this.declaration = new MacroDeclaration(parser, pos, loc);
    }
}

export class PreUndefStatement extends PreprocessorBase {
    id: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "PreUndefStatement";
        this.id = new Identifier(parser, pos, loc);
    }
}

export class PreIncludeStatement extends PreprocessorBase {
    path: string = "";
    inc: StringLiteral | Identifier;
    declare parser: Parser;
    file: File;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "PreIncludeStatement";
        this.inc = new Identifier(parser, pos, loc);
        this.file = new File(parser, pos, loc);
    }
}

export class PreIfStatement extends PreprocessorBase {
    test?: Expression;
    consequent?: Expression;
    alternate?: PreIfStatement | BlockStatement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "PreIfStatement";
    }
}

export class PreLineStatement extends PreprocessorBase {
    sequence: Expression;
    location: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "PreLineStatement";
        this.sequence = this.location = new Expression(parser, pos, loc);
    }
}

export class PreErrorStatement extends PreprocessorBase {
    text: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "PreErrorStatement";
        this.text = new Expression(parser, pos, loc);
    }
}

//

export type ParserOutput = {
    comments: Array<Comment>;
    errors: Array<ParsingError>;
    tokens?: Array<Token>;
};

//

export class File extends NodeBase {
    uri: string;
    path: string;
    program: Program;
    comments: Array<Comment> = [];
    errors: Array<ParsingError> = [];
    warnings: Array<ParsingError> = [];
    tokens?: Array<Token>;
    includes: Map<string, File> = new Map();
    declare scope: Scope;
    declare parser: Parser;

    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "File";
        this.program = new Program(parser, 0, emptyLoc);
        this.path = parser.fileName;
        this.uri = parser.options.uri ?? parser.fileName;
    }
}

export class Program extends Statement {
    type: "Program";
    sourceType: SourceType = SourceType.script;
    body: BlockStatement | WithStatement;
    metadata?: NodeBase[];
    globalWith?: WithStatement;

    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "Program";
        this.body = new BlockStatement(parser, pos, loc);
    }
}

// Statements

export class ExpressionStatement extends Statement {
    expression?: Expression;

    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ExpressionStatement";
    }
}

export class SetStatement extends Statement {
    id: Identifier | Expression;
    assignment: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.id = new Identifier(parser, pos, loc);
        this.assignment = new Expression(parser, pos, loc);
    }
}

export class ConstStatement extends Statement {
    init?: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ConstStatement";
    }
}

export class BlockStatement extends Statement {
    body: Array<Statement> = [];

    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "BlockStatement";
    }
}

export class EmptyStatement extends Statement {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "EmptyStatement";
    }
}

export class WithStatement extends Statement {
    object: Expression;
    body: Statement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "WithStatement";
        this.object = new Expression(parser, 0, emptyLoc);
        this.body = new Statement(parser, 0, emptyLoc);
    }
}

export class SectionStatement extends Statement {
    label: Identifier;
    body: Statement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.label = new Identifier(parser, pos, loc);
        this.body = new Statement(parser, pos, loc);
    }
}

export class GotoStatement extends Statement {
    type: "GotoStatement";
    line: LineMark | 0;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "GotoStatement";
        this.line = new LineMark(parser, 0, emptyLoc);
    }
}

export class OnErrorStatement extends Statement {
    resume?: boolean;
    goto?: GotoStatement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "OnErrorStatement";
    }
}

export class ExitStatement extends Statement {
    scope?: "sub" | "for" | "do" | "while" | "function";
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ExitStatement";
    }
}

// event

export class EventSection extends Statement {
    name: Identifier;
    description?: StringLiteral;
    body?: BlockStatement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.name = new Identifier(parser, pos, loc);
        this.type = "EventSection";
    }
}

export class LoggingSection extends EventSection {
    group: StringLiteral;
    path: StringLiteral;
    alias: StringLiteral;
    fileSize?: NumericLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "LoggingSection";
        this.group = this.path = this.alias = new StringLiteral(parser, pos, loc);
    }
}

export class JobSection extends EventSection {
    tempDirectory?: StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "JobSection";
    }
}

export class InputDataSourceSection extends EventSection {
    connectionString: Expression;
    selectQuery?: Expression;
    updateQuery?: Expression;
    useInputAsOutput?: BooleanLiteral;
    joinKey?: Expression;
    joinType?: StringLiteral;
    joinKeySorted?: BooleanLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "InputDataSourceSection";
        this.connectionString = new Expression(parser, pos, loc);
    }
}

export class OutputDataSourceSection extends EventSection {
    connStrOrUseInputAsOutput?: Expression | BooleanLiteral;
    metaDataOutputName?: StringLiteral;
    updateQuery?: StringLiteral;
    tableOutputName?: StringLiteral;
    variableOrder?: "SELECTORDER";
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "OutputDataSourceSection";
    }
}

export class GlobalSQLVariablesSection extends EventSection {
    connectionString: Expression;
    selectQuery: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "GlobalSQLVariableSection";
        this.connectionString = this.selectQuery = new Expression(parser, pos, loc);
    }
}

export class MetadataSection extends NodeBase {
    language?: Identifier | StringLiteral;
    context?: Identifier | StringLiteral;
    labelType?: Identifier | StringLiteral;
    dataSource?: Identifier;
    body?: NodeBase[];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataSection";
    }
}


// choice

export class IfStatement extends Statement {
    test: Expression;
    consequent: Statement | Expression;
    alternate?: Statement | Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "IfStatement";
        this.test = new Expression(parser, 0, emptyLoc);
        this.consequent = new Statement(parser, 0, emptyLoc);
    }
}

export class SelectStatement extends Statement {
    discriminant: Expression;
    cases: Array<SelectCaseStatement> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "SelectStatement";
        this.discriminant = new Expression(parser, 0, emptyLoc);
    }
}

export class SelectCaseStatement extends Statement {
    test: Array<SelectCaseRange> = [];
    consequent?: BlockStatement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "SelectCaseStatement";
    }
}

export class SelectCaseRange extends Statement {
    range?: {
        lbound?: NumericLiteral | Expression,
        ubound?: NumericLiteral | Expression,
        relational?: string;
    };
    test?: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "SelectCaseRange";
    }
}

// loops

export class WhileStatement extends Statement {
    test: Expression;
    body: Statement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "WhileStatement";
        this.test = new Expression(parser, 0, emptyLoc);
        this.body = new Statement(parser, 0, emptyLoc);
    }
}

export class DoWhileStatement extends Statement {
    body: Statement;
    test: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "DoWhileStatement";
        this.body = new Statement(parser, 0, emptyLoc);
        this.test = new Expression(parser, 0, emptyLoc);
    }
}

export class ForEachStatement extends Statement {
    variable?: Identifier;
    collection?: Expression;
    body: BlockStatement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ForEachStatement";
        this.body = new BlockStatement(parser, 0, emptyLoc);
    }
}

export class ForStatement extends Statement {
    variable: Identifier;
    range: {
        lbound: Expression | NumericLiteral,
        ubound: Expression | NumericLiteral,
        step?: number
    };
    body: BlockStatement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ForStatement";
        this.variable = new Identifier(parser, 0, emptyLoc);
        this.body = new BlockStatement(parser, 0, emptyLoc);
        this.range = {
            lbound: new Expression(parser, 0, emptyLoc),
            ubound: new Expression(parser, 0, emptyLoc)
        };
    }
}

export type ForLike = ForStatement | ForEachStatement;

// declaration

export class BindingDeclarator extends DeclarationBase {
    name: Identifier;
    generics?: string;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.name = new Identifier(parser, pos, loc);
        this.type = "BindingDeclarator";
    }
}

export class SingleVarDeclarator extends DeclarationBase {
    name: Identifier;
    binding: BindingDeclarator | string = "Variant";
    bindingType?: DeclarationBase;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.name = new Identifier(parser, pos, loc);
        this.type = "SingleVarDeclarator";
    }
}

export class ArrayDeclarator extends DeclarationBase {
    name: Identifier;
    binding: BindingDeclarator | string = "Variant";
    dimensions: number;
    boundaries?: number[];
    bindingType?: DeclarationBase;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.name = new Identifier(parser, pos, loc);
        this.type = "ArrayDeclarator";
        this.dimensions = 0;
        this.enumerable = true;
    }
}

export class VariableDeclaration extends NodeBase {
    declarations: Array<SingleVarDeclarator | ArrayDeclarator> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "VariableDeclaration";
    }
}

export class ConstDeclarator extends DeclarationBase {
    declarator: SingleVarDeclarator;
    init: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.declarator = new SingleVarDeclarator(parser, pos, loc);
        this.init = new Expression(parser, pos, loc);
        this.type = "ConstDeclarator";
    }
}

export class ConstDeclaration extends NodeBase {
    declarators: ConstDeclarator[] = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ConstDeclaration";
    }
}

export class ArgumentDeclarator extends NodeBase {
    optional: boolean = false;
    paramArray: boolean = false;
    declarator: ArrayDeclarator | SingleVarDeclarator;
    defaultValue?: any;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ArgumentDeclarator";
        this.declarator = new SingleVarDeclarator(parser, pos, loc);
    }
}

export class FunctionDeclaration extends DeclarationBase {
    name: Identifier;
    params: Array<ArgumentDeclarator> = [];
    body: BlockStatement;
    needReturn = false;
    binding?: string | BindingDeclarator;
    class?: ClassOrInterfaceDeclaration;
    declare scope: Scope;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "FunctionDeclaration",
        this.name = new Identifier(parser, 0, emptyLoc);
        this.body = new BlockStatement(parser, 0, emptyLoc);
    }
}


// Unary

export class UnaryExpression extends Expression {
    operator = "not";
    prefix = true;
    argument: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "UnaryExpression";
        this.argument = new Expression(parser, 0, emptyLoc);
    }
}

// Binary

export class BinaryBase extends Expression {
    operator: TokenType = types.equal;
    left: Expression;
    right: Expression;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "BinaryExpression";
        this.left = new Expression(parser, 0, emptyLoc);
        this.right = new Expression(parser, 0, emptyLoc);
    }
}

export class BinaryExpression extends BinaryBase {
    operator: TokenType;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "BinaryExpression";
        this.operator = types.equal;
    }
}

export class AssignmentExpression extends BinaryBase {
    operator: TokenType;
    left: Expression | Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "AssignmentExpression";
        this.operator = types.equal;
        this.left = new Expression(parser, 0, emptyLoc);
    }
}

export class LogicalExpression extends BinaryBase {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "LogicalExpression";
        this.operator = types._and;
    }
}

export class ArrayExpression extends Expression {
    elements: Array<Expression> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ArrayExpression";
    }
}

// object

export class ObjectMemberBase extends Expression {
    key?: Expression;
    computed?: boolean;
    method?: boolean;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ObjectMember";
    }
}

export class MemberExpression extends Expression {
    object: Identifier | MemberExpression | CallExpression | Expression;
    property: Expression;
    computed?: boolean;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MemberExpression";
        this.object = this.property = new Expression(parser, pos, loc);
    }
}

export class CallExpression extends Expression {
    callee: Expression;
    arguments: Array<Expression> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.callee = new Expression(parser, 0, emptyLoc);
        this.type = "CallExpression";
    }
}

export class ResumeNextStatement extends Statement {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ResumeNextStatement";
    }
}

// metadata

export enum MetadataFieldType {
    long,
    double,
    text,
    date,
    boolean,
    categorical,
    define,
    info,
    categoricalLoop,
    numericLoop,
    grid,
    compound,
    block,
    page,
    databaseQuestions,
}

// <label> ::= ( [ AreaName: ] ( "Label-text" | - ) )*
export class MetadataLabel extends NodeBase {
    areaName?: Identifier;
    label?: StringLiteral | Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataLabel";
    }
}

export class MetadataAreaName extends NodeBase {
    areaName?: Identifier;
    language?: Identifier;
    context?: Identifier;
    labelType?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataAreaName";
    }
}

export class MetadataFieldTypeDefinition extends NodeBase {
    typeKw: Identifier;
    range?: MetadataRange;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataFieldTypeDefinition";
        this.typeKw = new Identifier(parser, pos, loc);
    }
}

export class MetadataHelpFields extends NodeBase {
    fields: Array<MetadataSingleHead> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataHelpFields";
    }
}

export class MetadataSingleHead extends NodeBase {
    name: Identifier;
    label?: StringLiteral;
    typeDef?: MetadataFieldTypeDefinition;
    usageType?: MetadataUsageType;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataSingleHead";
        this.name = new Identifier(parser, pos, loc);
    }
}

export class MetadataFieldHeadDefinition extends NodeBase {
    name: Identifier;
    label?: StringLiteral;
    properties?: Array<MetadataProperty>;
    style?: MetadataStyle;
    labelStyle?: MetadataStyle;
    templates?: MetadataTemplates;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataFieldHeadDefinition";
        this.name = new Identifier(parser, pos, loc);
    }
}

export class MetadataFieldTailDefinition extends NodeBase {
    validation?: MetadataValidation;
    expression?: MetadataExpression;
    initialanswer?: CategoricalLiteral | NumericLiteral | BooleanLiteral | StringLiteral;
    defaultanswer?: CategoricalLiteral | NumericLiteral | BooleanLiteral | StringLiteral;
    axis?: MetadataAxisExpression;
    usagetype?: MetadataUsageType;
    helperfields?: MetadataHelpFields;
    nocasedata?: Identifier;
    unversioned?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataFieldTailDefinition";
    }
}

export class MetadataUsageType extends NodeBase {
    usageTypeValue?: MetadataUsageTypeValue;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataUsageType";
    }
}

// axis

export class MetadataAxisExpression extends NodeBase {
    expression?: StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataAxisExpression";
    }
}

// categorical

export class MetadataBase extends NodeBase {
    header: MetadataFieldHeadDefinition;
    tail?: MetadataFieldTailDefinition;
    typeDef?: MetadataFieldTypeDefinition;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataDefinition";
        this.header = new MetadataFieldHeadDefinition(parser, pos ,loc);
    }
}

export class MetadataProperty extends NodeBase {
    name?: Identifier;
    areaName?: Identifier;
    propValue: MetadataProperty[] | Expression = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataProperty";
    }
}

export class MetadataCategoricalVariable extends MetadataBase {
    categories?: MetadataCategoryList;
    expression?: MetadataExpression;
    initialAnswer?: MetadataCategory[];
    defaultAnswer?: MetadataCategory[];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataCategoricalVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataLongVariable extends MetadataBase {
    precision?: NumericLiteral;
    expression?: StringLiteral;
    categories?: MetadataCategoryList;
    codes?: MetadataCategoryList;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataLongVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataDoubleVariable extends MetadataLongVariable {
    scale?: NumericLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataDoubleVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataTextVariable extends MetadataBase {
    categories?: MetadataCategoryList;
    codes?: MetadataCategoryList;
    validation?: StringLiteral;
    expression?: StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataTextVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataDateVariable extends MetadataBase {
    categories?: MetadataCategoryList;
    codes?: MetadataCategoryList;
    expression?: StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataDateVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataBooleanVariable extends MetadataBase {
    categories?: MetadataCategoryList;
    codes?: MetadataCategoryList;
    expression?: StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataBooleanVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataInfoVariable extends MetadataBase {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataInfoVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataLoopVariableBase extends MetadataBase {
    row?: Identifier;
    column?: Identifier;
    expand?: Identifier;
    grid?: Identifier;
    iterationLabel?: StringLiteral | "-";
    fields: Array<MetadataBase> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataLoopVariableBase";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataCategoricalLoopVariable extends MetadataLoopVariableBase {
    categories: MetadataCategoryList;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataCategoricalLoopVariable";
        this.categories = new MetadataCategoryList(parser, pos, loc);
    }
}

export class MetadataNumericLoopVariable extends MetadataLoopVariableBase {
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataNumericLoopVariable";
    }
}

export class MetadataGridVariable extends MetadataLoopVariableBase {
    categories: MetadataCategoryList;
    noExpand?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataGridVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
        this.categories = new MetadataCategoryList(parser, pos, loc);
    }
}

export class MetadataBlockVariable extends MetadataBase {
    fields: Array<MetadataBase> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataBlockVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataPageVariable extends MetadataBase {
    questions?: Array<Identifier> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataPageVariable";
        this.header = new MetadataFieldHeadDefinition(parser, pos, loc);
    }
}

export class MetadataCompoundVariable extends MetadataLoopVariableBase {
    categories: MetadataCategoryList;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataCompoundVariable";
        this.categories = new MetadataCategoryList(parser, pos, loc);
    }
}

// db variable

export type MetadataDataBaseQuestions = MetadataDataBaseNonLoopQuestion | MetadataDataBaseLoopQuestion;

export class MetadataDataBaseNonLoopQuestion extends MetadataBase {
    range?: MetadataRange;
    definition?: MetadataDbDefinition;
    codes?: MetadataCategoryList;
    expand?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataDataBaseNonLoopQuestion";
    }
}

export class MetadataDataBaseLoopQuestion extends MetadataBase {
    definition?: MetadataDbDefinition;
    fields: Array<MetadataBase> = [];
    iterationLabel?: StringLiteral | "-";
    row?: Identifier;
    column?: Identifier;
    noExpand?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataDataBaseLoopQuestion";
    }
}

export class MetadataDbDefinition extends NodeBase {
    connectionString: StringLiteral;
    table: StringLiteral;
    minAnswers?: NumericLiteral;
    maxAnswers?: NumericLiteral;
    sqlFilter?: StringLiteral;
    cacheTimeout?: NumericLiteral;
    columns?: MetadataDbColumnsDefinition;
    iterationIdType?: StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataDbDefinition";
        this.connectionString = this.table = new StringLiteral(parser, pos, loc);
    }
}

export class MetadataDbColumnsDefinition extends NodeBase {
    id?: StringLiteral;
    label?: StringLiteral;
    keycode?: StringLiteral;
    file?: StringLiteral;
    analysisValue?: StringLiteral;
    fixed?: StringLiteral;
    exclusive?: StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataDbColumnsDefinition";
    }
}

// util

export class MetadataRange extends NodeBase {
    min?: NumericLiteral;
    max?: NumericLiteral;
    step?: NumericLiteral;
    single = false;
    exclude = false;
    sub?: MetadataRange[];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataRange";
    }
}

export class MetadataCategoryList extends MetadataBase {
    name?: Identifier;
    categories: Array<MetadataCategory> = [];
    sublist?: Array<MetadataSubList>;
    defined?: Identifier;
    rotate?: Identifier;
    randomize?: Identifier;
    reverse?: Identifier;
    ascending?: Identifier;
    descending?: Identifier;
    fix?: Identifier;
    namespace?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataCategoryList";
    }
}

export class MetadataCategory extends NodeBase {
    name?: Identifier | "-";
    property?: MetadataProperty[];
    label?: StringLiteral;
    expression?: MetadataExpression;
    keycode?: StringLiteral | NumericLiteral | BooleanLiteral;
    elementType?: MetadataCategoryElementType;
    other?: MetadataCategoryOtherOrMultiplier;
    multiplier?: MetadataCategoryOtherOrMultiplier;
    dk?: Identifier;
    ref?: Identifier;
    na?: Identifier;
    exclusive?: Identifier;
    factor?: NumericLiteral;
    fix?: Identifier;
    nofilter?: Identifier;
    useList?: MetadataCategoryUseList;
    group?: MetadataCategoryList;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataCategory";
    }
}

export class MetadataCategoryElementType extends NodeBase {
    elementType?: Identifier | StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataCategoryElementType";
    }
}

export class MetadataCategoryOtherOrMultiplier extends NodeBase {
    specify?: StringLiteral | MetadataSingleHead;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataCategoryOther";
    }
}

export class MetadataExpression extends NodeBase {
    script?: StringLiteral;
    deriveelements?: Identifier;
    noderiveelements?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataExpression";
    }
}

export class MetadataValidation extends NodeBase {
    regex?: StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataValidation";
    }
}

export class MetadataSubList extends NodeBase {
    name = "";
    rotate?: Identifier;
    randomize?: Identifier;
    reverse?: Identifier;
    ascending?: Identifier;
    descending?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataSubList";
    }
}

//
// <category> ::= [ list_name ]
//                use define_list
//                [ sublist [ rot[ate] | ran[domize] | rev[erse] |
//                    asc[ending] | desc[ending] ] ]
//                [ "list_label" ]
//                [ fix ]
//
export class MetadataCategoryUseList extends NodeBase {
    listName?: Identifier | "-";
    useList?: Identifier;
    subList?: MetadataSubList;
    listLabel?: StringLiteral;
    fix?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MetadataCategoryUseList";
    }
}

// metadata style

export class MetadataStyle extends NodeBase {
    align?: Identifier;
    bgColor?: StringLiteral;
    cell?: MetadataCellStyle;
    color?: StringLiteral;
    columns?: NumericLiteral;
    control?: MetadataControlStyle;
    cursor?: Identifier;
    elementAlign?: Identifier;
    font?: MetadataFontStyle;
    height?: StringLiteral;
    hidden?: BooleanLiteral;
    image?: StringLiteral;
    imagePosition?: Identifier;
    indent?: NumericLiteral;
    orientation?: Identifier;
    rows?: NumericLiteral;
    verticalAlign?: Identifier;
    width?: StringLiteral;
    zIndex?: NumericLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "Style";
    }
}

export class MetadataCellStyle extends NodeBase {
    bgColor?: StringLiteral;
    borderBottomColor?: StringLiteral;
    borderBottomStyle?: Identifier;
    borderBottomWidth?: NumericLiteral;
    borderColor?: StringLiteral;
    borderLeftColor?: StringLiteral;
    borderLeftStyle?: Identifier;
    borderLeftWidth?: NumericLiteral;
    borderRightColor?: StringLiteral;
    borderRightStyle?: Identifier;
    borderRightWidth?: NumericLiteral;
    borderStyle?: Identifier;
    borderTopColor?: StringLiteral;
    borderTopStyle?: Identifier;
    borderTopWidth?: NumericLiteral;
    borderWidth?: NumericLiteral;
    colspan?: NumericLiteral;
    height?: StringLiteral;
    padding?: NumericLiteral;
    paddingBottom?: NumericLiteral;
    paddingLeft?: NumericLiteral;
    paddingRight?: NumericLiteral;
    paddingTop?: NumericLiteral;
    repeatHeader?: NumericLiteral;
    rowSpan?: NumericLiteral;
    width?: StringLiteral;
    wrap?: BooleanLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "CellStyle";
    }
}

export class MetadataControlStyle extends NodeBase {
    accelerator?: StringLiteral;
    readonly?: BooleanLiteral;
    controlType?: Identifier;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ControlStyle";
    }
}

export class MetadataFontStyle extends NodeBase {
    family?: StringLiteral;
    isBlink?: BooleanLiteral;
    isBold?: BooleanLiteral;
    isItalic?: BooleanLiteral;
    isOverline?: BooleanLiteral;
    isStrikeThrough?: BooleanLiteral;
    isSubscript?: BooleanLiteral;
    isSuperscript?: BooleanLiteral;
    isUnderline?: BooleanLiteral;
    size?: NumericLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "FontStyle";
    }
}

// template

export class MetadataTemplates extends NodeBase {
    banner?: StringLiteral;
    error?: StringLiteral;
    layout?: StringLiteral;
    navBar?: StringLiteral;
    question?: StringLiteral;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "Template";
    }
}

// usage type

export type MetadataUsageTypeValue = {
    name: string;
    appliesFieldType: MetadataFieldType | "any";
    description?: string;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataUsageTypeValues:
    { [key: string]: MetadataUsageTypeValue } = {
    filter: {
        name: "Filter",
        appliesFieldType: MetadataFieldType.boolean,
        description: "Filter variables define an expression to be used as a filter, typically for use during analysis."
    },
    weight: {
        name: "Weight",
        appliesFieldType: MetadataFieldType.long | MetadataFieldType.double,
        description: "Weighting variables are used to weight the data during analysis. If the weighting is to be defined using the IBM® SPSS® Data Collection Base Professional Weight component, the field must be of type double."
    },
    multiplier: {
        name: "Multiplier",
        appliesFieldType: MetadataFieldType.long | MetadataFieldType.double,
        description: "A multiplier variable is a special type of helper variable that is used to store numeric data that is associated with a category. By default, Survey Tabulation and the Base Professional Tables option will increment the cell count for a category by one for each respondent. However, if a multiplier variable has been defined, the value of that variable will be used as the increment. A multiplier variable is created automatically when you use the multiplier keyword on a category. This means that you do not need to set this usage type explicitly."
    },
    coding: {
        name: "Coding",
        appliesFieldType: MetadataFieldType.categorical,
        description: "Coding variables store the responses to open-ended questions after they have been sorted into categories. They are also used to define special responses for questions. Coding variables are created automatically when you use the codes keyword and you do not need to set this usage type explicitly."
    },
    sourceFile: {
        name: "SourceFile",
        appliesFieldType: MetadataFieldType.text,
        description: "Source file variables are used to store the name of a file that contains an image or a recording of a question response (such as a .TIFF file containing a scanned image of a hand-written response, or a sound file that contains a recording of an open-ended response in a IBM® SPSS® Quancept CATI™ interview)."
    },
    otherSpecify: {
        name: "OtherSpecify",
        appliesFieldType: MetadataFieldType.text,
        description: "Other Specify variables store the open-ended responses to Other Specify categories. An Other Specify variable is created automatically when you use the other keyword on a category. This means that you do not need to set this usage type explicitly."
    },
    helperField: {
        name: "HelperField",
        appliesFieldType: "any",
        description: "Helper field variables store additional information for a question, such as the responses to an Other Specify category. Helper fields are sometimes referred to as helper variables. Generally, you do not need to set this usage type, because it is set automatically when you use the `helperfields` syntax."
    }
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataEnumText:
    { [key: string]: Array<string> } = {
    align:             [ "center", "default", "justify", "left", "right" ],
    cursor:            [ "auto", "crosshair", "default", "pointer", "move", "eresize", "neresize", "nresize", "nwresize", "wresize", "swresize", "sresize", "seresize", "text", "wait", "help" ],
    elementalign:      [ "default", "newline", "right" ],
    imageposition:     [ "bottom", "imageonly", "left", "none", "right", "top" ],
    orientation:       [ "column", "default", "row" ],
    verticalalign:     [ "baseline", "bottom", "default", "middle", "sub", "super", "textbottom", "texttop", "top" ],
    borderbottomstyle: [ "double", "grove", "inset", "none", "outset", "ridge", "solid" ],
    borderleftstyle:   [ "double", "grove", "inset", "none", "outset", "ridge", "solid" ],
    borderrightstyle:  [ "double", "grove", "inset", "none", "outset", "ridge", "solid" ],
    borderstyle:       [ "double", "grove", "inset", "none", "outset", "ridge", "solid" ],
    bordertopstyle:    [ "double", "grove", "inset", "none", "outset", "ridge", "solid" ],
    type:/**Control Style */
        [ "button", "checkbutton", "combolist", "date", "datetime", "droplist", "edit", "listbox", "listcontrol", "multilineedit", "password", "radiobutton", "singlelineedit", "static", "time" ],
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataFieldValueType = [
    "long",
    "double",
    "text",
    "date",
    "boolean",
    "categorical",
    "info",
    "loop",
    "grid",
    "compound",
    "block",
    "page",
    "define"
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataCategoryElementTypeValues = [
    "analysisbase",
    "analysiscategory",
    "analysismaximum",
    "analysismean",
    "analysisminimum",
    "analysissamplevariance",
    "analysisstddev",
    "analysisstderr",
    "analysissubheading",
    "analysissubtotal",
    "analysissummarydata",
    "analysistotal"
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataLanguageCodes = [
    "AFK",
    "SQI",
    "ARG",
    "ARH",
    "ARE",
    "ARI",
    "ARJ",
    "ARK",
    "ARB",
    "ARL",
    "ARM",
    "ARO",
    "ARQ",
    "ARA",
    "ARS",
    "ART",
    "ARU",
    "ARY",
    "HYE",
    "EUQ",
    "BEL",
    "BGR",
    "CAT",
    "CHS",
    "ZHH",
    "ZHI",
    "CHT",
    "HRV",
    "CSY",
    "DAN",
    "NLB",
    "NLD",
    "ENA",
    "ENL",
    "ENC",
    "ENB",
    "ENI",
    "ENJ",
    "ENZ",
    "ENS",
    "ENT",
    "ENG",
    "ENU",
    "ETI",
    "FOS",
    "FAR",
    "FIN",
    "FRB",
    "FRC",
    "FRA",
    "FRL",
    "FRS",
    "DEA",
    "DEU",
    "DEC",
    "DEL",
    "DES",
    "ELL",
    "HEB",
    "HIN",
    "HUN",
    "ISL",
    "IND",
    "ITA",
    "ITS",
    "JPN",
    "KOR",
    "LVI",
    "LTH",
    "MSL",
    "NOR",
    "NON",
    "PLK",
    "PTB",
    "PTG",
    "ROM",
    "RUS",
    "SRB",
    "SRL",
    "SKY",
    "SLV",
    "ESS",
    "ESB",
    "ESL",
    "ESO",
    "ESC",
    "ESD",
    "ESF",
    "ESE",
    "ESG",
    "ESH",
    "ESM",
    "ESI",
    "ESA",
    "ESZ",
    "ESR",
    "ESU",
    "ESY",
    "ESV",
    "SVF",
    "SVE",
    "THA",
    "TRK",
    "URK",
    "URD",
    "VIT"
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataUserContexts = [
    "analysis",
    "question",
    "qc",
    "paper",
    "cardcol",
    "sav",
    "webapp"
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataRoutingContexts = [
    "web",
    "cati",
    "paper",
    "wc",
    "mobile",
    "papi",
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataLabelTypes = [
    "label",
    "instruction",
    "shortname"
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataSublistSuffix = [
    "rot",
    "rotate",
    "ran",
    "randomize",
    "rev",
    "reverse",
    "asc",
    "ascending",
    "desc",
    "descending"
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const MetadataRangeAllowedType = [
    "long",
    "double",
    "categorical",
    "text",
    "date",
];


// class & interface delcaration

export class PropertyGet extends NodeBase {
    body?: BlockStatement;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "PropertyGet";
    }
}

export class PropertySet extends NodeBase {
    body?: BlockStatement;
    params: Array<ArgumentDeclarator> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "PropertySet";
    }
}

export class PropertyDeclaration extends DeclarationBase {
    readonly?: boolean;
    writeonly?: boolean;
    default?: boolean;
    binding: BindingDeclarator | string = "Variant";
    init?: any;
    name: Identifier;
    params: Array<ArgumentDeclarator> = [];
    get?: PropertyGet;
    set?: PropertySet;
    class: ClassOrInterfaceDeclaration;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "PropertyDeclaration";
        this.name = new Identifier(parser, pos, loc);
        this.class = new ClassOrInterfaceDeclaration(parser, pos, loc);
    }
}

export class ClassOrInterfaceDeclaration extends DeclarationBase {
    name: Identifier;
    defType: "interface" | "class" = "interface";
    properties: Map<string, PropertyDeclaration> = new Map();
    methods: Map<string, FunctionDeclaration> = new Map();
    constants: Map<string, ConstDeclarator> = new Map();
    default?: PropertyDeclaration;
    implements: string[] = [];
    generic?: string;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "ClassOrInterfaceDeclaration";
        this.name = new Identifier(parser, pos, loc);
    }
}

export class NamespaceDeclaration extends DeclarationBase {
    name: Identifier;
    body: Map<string, DeclarationBase> = new Map();
    level: Array<string> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "NamespaceDeclaration";
        this.name = new Identifier(parser, pos, loc);
    }
}

export class MacroDeclaration extends DeclarationBase {
    name: Identifier;
    init?: Expression;
    initValue?: string | boolean | number;
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "MacroDeclaration";
        this.name = new Identifier(parser, pos, loc);
    }
}

export class EnumItemDeclarator extends DeclarationBase {
    enumValue?: number;
    constructor (parser: ParserBase, pos: number, loc: Position) {
        super (parser, pos, loc);
        this.type = "EnumItemDeclarator";
    }
}

export class EnumDeclaration extends DeclarationBase {
    enumItems: Array<EnumItemDeclarator> = [];
    constructor(parser: ParserBase, pos: number, loc: Position) {
        super(parser, pos, loc);
        this.type = "EnumDeclaration";
    }
}

