import {
    DefinitionBase,
    DefinitionType,
    EnumElement
} from "../util/definition";

export interface BuiltInDefinition {
    name: string,
    label?: string,
    insertText?: string,
    definitionType: DefinitionType,
    hasReturn?: boolean,
    returnType?: DefinitionBase,
    readonly?: boolean,
    isCollection?: boolean,
    defaultProperty?: string,
    defaultMethod?: string,
    defaultValue?: string | number | boolean,
    note?: string,
    methods?: BuiltInDefinition[],
    properties?: BuiltInDefinition[],
    arguments?: ArgumentDefinition[],
    index?: ArgumentDefinition,
    enumerators?: EnumElement[],
    constants?: Array<{ name: string, value: number | string, note: string }>,
}

export interface ArgumentDefinition {
    name: string,
    type: DefinitionBase | DefinitionBase[],
    isCollection?: boolean,
    optional?: boolean,
    defaultValue?: string | number | boolean,
    note?: string,
    ellipsis?: boolean,
    index?: ArgumentDefinition,
}

