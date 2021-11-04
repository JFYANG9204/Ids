import {
    ArrayDefinition,
    DefinitionBase,
    DefinitionOptions,
    definitionPlaceHolder,
    DefinitionType,
    EnumDefinition,
    InterfaceDefinition,
    ObjectDefinition,
    ValueType,
    ValueTypes,
    VariantDefinition
} from "../util/definition";

export function createBasicValueType(
    val: string,
    arr?: boolean,
    def?: DefinitionBase): ValueType {
    return {
        label: val,
        defType: "literal",
        isBasic: true,
        array: arr ? { dimensions: 1 }: undefined,
        definition: def ?? definitionPlaceHolder
    };
}

export function createInterfaceType(
    name: string,
    def: InterfaceDefinition): ValueType {
    return {
        label: name,
        defType: "interface",
        isBasic: false,
        isBuiltIn: true,
        definition: def,
    };
}

export function createEnumType(
    name: string,
    def: EnumDefinition): ValueType {
    return {
        label: name,
        defType: "enum",
        isBuiltIn: true,
        definition: def,
    };
}

export function createValueType(
    name: string,
    defType: DefinitionType,
    builtIn?: boolean,
    def?: DefinitionBase,
    array?: ArrayDefinition): ValueType {
    return {
        label: name,
        defType: defType,
        isBuiltIn: builtIn,
        definition: def ?? definitionPlaceHolder,
        array: array
    };
}

export function isBasicType(type: ValueType) {
    return type.isBasic;
}

export function createDefinition<T>(
    options: DefinitionOptions ,
    n: new (options: DefinitionOptions) => T): T {
    return new n(options);
}

export function createBuiltInDefPlaceHolder(
    name: string,
    defType?: DefinitionType,
    isBuiltIn?: boolean,
    array?: ArrayDefinition) {
    const def = createDefinition({
        name: name,
        defType: "default",
        isReadonly: false,
        isConst: false,
        isCollection: false,
        isBuiltIn: isBuiltIn,
        section: {
            name: "global",
            type: "global"
        }
    }, array ? VariantDefinition : DefinitionBase);
    def.defType = defType ?? "default";
    if (array) {
        (def as VariantDefinition).boundaries = array.boundaries;
        (def as VariantDefinition).dimensions = array.dimensions;
    }
    return def;
}

export function createBasicTypeDefinition(valueType: ValueType) {
    const opt: DefinitionOptions = {
        name: valueType.label,
        defType: "variant",
        isReadonly: false,
        isCollection: true,
        isConst: false,
        isBuiltIn: true,
        return: valueType.definition,
        section: {
            name: "global",
            type: "global"
        }
    };
    const def = createDefinition(opt, VariantDefinition);
    def.isBasic = true;
    def.return = valueType.definition;
    def.defType = valueType.array ? "array" : "variant";
    if (valueType.array) {
        def.dimensions = 1;
    }
    return def;
}

export function createArrayDefinition(
    name: string,
    readonly: boolean,
    isConst: boolean,
    array: ArrayDefinition,
) {
    const opt: DefinitionOptions = {
        name: name,
        defType: "array",
        isCollection: true,
        isConst: isConst,
        isReadonly: readonly,
        isBuiltIn: false,
        section: {
            name: "global",
            type: "global"
        },
    };
    const def = createDefinition(opt, VariantDefinition);
    def.defType = "array";
    def.dimensions = array.dimensions;
    def.boundaries = array.boundaries;
    return def;
}

//
const categoricalOptions: DefinitionOptions = {
    name: "categorical",
    defType: "variant",
    isReadonly: false,
    isCollection: true,
    isConst: false,
    isBuiltIn: true,
    section: {
        name: "global",
        type: "global"
    },
};

const stringOptions: DefinitionOptions = {
    name: "string",
    defType: "variant",
    isReadonly: false,
    isCollection: false,
    isConst: false,
    isBuiltIn: true,
    section: {
        name: "global",
        type: "global"
    }
};

export const basicTypes = {
    long         : createBasicValueType("Long"),
    double       : createBasicValueType("Double"),
    string       : createBasicValueType("String"),
    variant      : createBasicValueType("Variant"),
    boolean      : createBasicValueType("Boolean"),
    categorical  : createBasicValueType("Categorical"),
    date         : createBasicValueType("Date"),
    object       : createBasicValueType("Object"),
    array        : createBasicValueType("Array", true),
    null         : createBasicValueType("Null"),
};

export const basicTypeDefinitions = {
    long         : createBasicTypeDefinition(basicTypes.long),
    double       : createBasicTypeDefinition(basicTypes.double),
    string       : createDefinition(stringOptions, ObjectDefinition),
    variant      : createBasicTypeDefinition(basicTypes.variant),
    boolean      : createBasicTypeDefinition(basicTypes.boolean),
    categorical  : createDefinition(categoricalOptions, ObjectDefinition),
    date         : createBasicTypeDefinition(basicTypes.date),
    object       : createBasicTypeDefinition(basicTypes.object),
    array        : createArrayDefinition("Array", false, false, { dimensions: 1 }),
    null         : createBasicTypeDefinition(basicTypes.null),
};

export function isCorrectDefinition(
    check?: DefinitionBase,
    source?: ValueType | ValueTypes | DefinitionBase | undefined,
    isArray?: boolean
) {
    if (!check || !source) {
        return false;
    }
    if (!source) {
        return false;
    }
    if (source instanceof Array) {
        for (const type of source) {
            if (((isArray && type.array) || (!isArray && !type.array)) &&
                (check === type.definition ||
                 check === basicTypeDefinitions.variant ||
                 type.definition === basicTypeDefinitions.variant)
            ) {
                return true;
            }
        }
        return false;
    } else if (source instanceof DefinitionBase) {
        return check === basicTypeDefinitions.variant  ||
               source === basicTypeDefinitions.variant ||
               check === source;
    } else {
        return check === source.definition ||
            check === basicTypeDefinitions.variant ||
            source.definition === basicTypeDefinitions.variant;
    }
}

export function getValueTypeString(source: ValueType): string {
    let text = "";
    if (source.definition) {
        text = source.definition.name;
        if (source.array) {
            if (source.array.boundaries) {
                source.array.boundaries.forEach(d => {
                    text += `[${d}]`;
                });
            }
            text += "[]";
        }
    }
    return text;
}

export function getAllValueTypeString(source: ValueType | ValueTypes): string {
    let text = "";
    if (source instanceof Array) {
        const arr: string[] = [];
        source.forEach(val => {
            const item = getValueTypeString(val);
            if (item !== "") {
                arr.push(item);
            }
        });
        text = arr.join(" | ");
    } else {
        text = getValueTypeString(source);
    }
    return text;
}
