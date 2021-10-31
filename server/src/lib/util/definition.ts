import { NodeBase } from "../types";

export type DefinitionType =
    | "object"
    | "property"
    | "method"
    | "array"
    | "function"
    | "variant"
    | "argument"
    | "interface"
    | "enum"
    | "literal"
    | "metadata"
    | "macro"
    | "constant"
    | "default";

export type ArrayDefinition = {
    dimensions: number,
    boundaries?: number[],
};

export type ValueType = {
    label: string,
    defType: DefinitionType,
    isBasic?: boolean,
    isBuiltIn?: boolean,
    isConst?: boolean,
    isLocal?: boolean,
    array?: ArrayDefinition,
    definition?: DefinitionBase,
};

export function isEqualValueType(type1: ValueType, type2: ValueType): boolean {
    if (type1.defType !== type2.defType ||
        type1.definition !== type2.definition) {
        return false;
    }
    if (type1.array && type2.array) {
        if (type1.array.dimensions !== type2.array.dimensions) {
            return false;
        }
        if (type1.array.boundaries && type2.array.boundaries) {
            for (let i = 0; i < type1.array.boundaries.length; i++) {
                const num = type1.array.boundaries[i];
                if (type2.array.boundaries[i] !== num) {
                    return false;
                }
            }
        }
    } else if (!type1.array && !type2.array) {
        return true;
    } else {
        return false;
    }
    return true;
}

export function isCorrectType(
    check: ValueType | undefined,
    source: ValueType | ValueTypes | undefined): boolean {
    if (!source || !check) {
        return false;
    }
    if (source instanceof Array) {
        for (const type of source) {
            if (isEqualValueType(check, type)) {
                return true;
            }
        }
        return false;
    } else {
        return isEqualValueType(check, source);
    }
}

export type ValueTypes = Array<ValueType>;

export class Argument {
    name: string;
    type: DefinitionBase | DefinitionBase[];
    isCollection: boolean;
    isOptional: boolean;
    defaultValue?: string | number | boolean;
    ellipsis?: boolean;
    note?: string;
    function?: FunctionDefinition;
    index?: Argument;

    constructor(
        name: string,
        type: DefinitionBase | DefinitionBase[],
        isCollection = false,
        isOptional = false) {
        this.name = name;
        this.type = type;
        this.isCollection = isCollection;
        this.isOptional = isOptional;
    }

}

export type EnumElement = {
    label: string,
    value: number,
    note?: string,
};

export type DefSection = {
    name: string,
    type: "function" | "event" | "global",
};

export interface DefinitionOptions {
    name: string;
    insertText?: string;
    isReadonly: boolean;
    isCollection: boolean;
    isConst: boolean;
    note?: string;
    node?: NodeBase;
    section: DefSection;
    return?: DefinitionBase;
    preMacroValue?: NodeBase;
}

export class DefinitionBase {
    name: string;
    insertText?: string;
    defType: DefinitionType;
    isReadonly: boolean;
    isCollection: boolean;
    isConst: boolean;
    isBuiltIn?: boolean;
    note?: string;
    node?: NodeBase;
    return?: DefinitionBase;
    section: DefSection;
    constructor(options: DefinitionOptions) {
        this.name = options.name;
        this.insertText = options.insertText;
        this.defType = "variant";
        this.isReadonly = options.isReadonly;
        this.isCollection = options.isCollection;
        this.isConst = options.isConst;
        this.section = options.section;
        this.note = options.note;
        this.node = options.node;
    }
    getInsertText(): string {
        if (this.insertText) {
            return this.insertText;
        }
        return this.name;
    }

    getNote(): string {
        if (this.note) {
            return this.note;
        }
        return "```ds\n" + this.getLable() + "\n```";
    }

    getLable(): string {
        return `(${this.defType}) ${this.name}`;
    }

}

export const definitionPlaceHolder = new DefinitionBase({
    name: "PlaceHolder",
    isReadonly: false,
    isConst: false,
    isCollection: false,
    section: {
        name: "global",
        type: "global"
    }
});

export class VariantDefinition extends DefinitionBase {
    constructor(options: DefinitionOptions) {
        super(options);
        this.defType = "variant";
        this.return = options.return;
        this.isArray = false;
        this.dimensions = 0;
    }
    return?: DefinitionBase;
    isArray: boolean;
    dimensions: number;
    boundaries?: number[];
    override getLable(): string {
        return `(${this.defType === "macro" ? "macro" : "variable"}) ${this.name}`;
    }
}

export class EnumDefinition extends DefinitionBase {

    elements: Array<EnumElement> = [];

    constructor(options: DefinitionOptions) {
        super(options);
        this.defType = "enum";
    }

    append(label: string, value: number, note?: string) {
        if (!this.exist(label)) {
            this.elements.push({
                    label,
                    value,
                    note
                });
        }
    }

    exist(label: string) {
        for (let i = 0; i < this.elements.length; ++i) {
            if (this.elements[i].label.toLowerCase() === label.toLowerCase()) {
                return true;
            }
        }
        return false;
    }

    override getLable(): string {
        return `(enum) ${this.name}`;
    }
}

export class FunctionDefinition extends DefinitionBase {
    constructor(options: DefinitionOptions) {
        super(options);
        this.defType = "function";
        this.return = options.return;
    }

    return?: DefinitionBase;
    arguments: Array<Argument> = [];

    override getLable(): string {
        let args = "";
        let first = true;
        this.arguments.forEach(arg => {
            let argText = "";
            if (arg.type instanceof Array) {
                let argTypes: string[] = [];
                arg.type.forEach(t => {
                    argTypes.push(t.name);
                });
                argText = arg.name + ": " + argTypes.join(" | ");
            } else {
                argText = arg.name + ": " + arg.type.name;
            }
            if (arg.isOptional) {
                argText = "[" + argText + "]";
            }
            if (first) {
                args = argText;
            } else {
                args += ", " + argText;
            }
            first = false;
        });
        return `(function) ${this.name}(${args}): ${this.return ? this.return.name : "Void"}`;
    }
}

export class MethodDefinition extends FunctionDefinition {
    constructor(options: DefinitionOptions) {
        super(options);
        this.defType = "method";
    }
    object?: InterfaceDefinition | ObjectDefinition;
}

export class PropertyDefinition extends DefinitionBase {
    constructor(options: DefinitionOptions) {
        super(options);
        this.defType = "property";
        this.return = options.return ?? definitionPlaceHolder;
    }
    object?: InterfaceDefinition | ObjectDefinition;
    index?: Argument;
    return: DefinitionBase;
}

export class InterfaceDefinition extends DefinitionBase {
    constructor(options: DefinitionOptions) {
        super(options);
        this.defType = "interface";
    }

    default?: PropertyDefinition | FunctionDefinition;
    properties: Map<string, PropertyDefinition> = new Map();
    methods: Map<string, FunctionDefinition> = new Map();
    object?: InterfaceDefinition | ObjectDefinition;

    getProperty(name: string) {
        return this.properties.get(name.toLowerCase());
    }

    getMethod(name: string) {
        return this.methods.get(name.toLowerCase());
    }

}

export class ObjectDefinition extends InterfaceDefinition {
    constructor(options: DefinitionOptions) {
        super(options);
        this.defType = "object";
    }
}

export class MacroDefinition extends DefinitionBase {
    preMacroValue?: NodeBase;
    constructor(options: DefinitionOptions) {
        super(options);
        this.defType = "macro";
        this.preMacroValue = options.preMacroValue;
    }
}

export class ScriptConstantDefinition extends DefinitionBase {
    constants: Array<{ name: string, value: string | number, note: string }> = [];
    constructor(options: DefinitionOptions) {
        super(options);
        this.defType = "constant";
    }
}
