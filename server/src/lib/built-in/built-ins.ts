import {
    Argument,
    DefinitionBase,
    DefinitionOptions,
    EnumDefinition,
    FunctionDefinition,
    InterfaceDefinition,
    MethodDefinition,
    ObjectDefinition,
    PropertyDefinition,
    ScriptConstantDefinition,
} from "../util/definition";
import {
    builtInCallByDotCategoricalFunctions,
    builtInCallByDotTextFunctions,
    builtInFunctions
} from "./built-in-functions";
import {
    builtInObjects,
    builtInVBSDictionary,
    builtInVBSDriveObject,
    builtInVBSFileObject,
    builtinVBSFileSystemObject,
    builtInVBSFolderObject,
    builtInVBSTextStreamObject
} from "./built-in-objects";
import {
    builtInIDocumentInterface,
    builtInInterfaces,
    builtInQuesionInterface
} from "./built-in-interfaces";
import {
    ArgumentDefinition,
    BuiltInDefinition
} from "./types";
import { builtInEnums } from "./built-in-enums";
import { builtInAggregate } from "./built-in-aggregate";
import {
    BasicTypeDefinitions,
    BasicTypes,
    createDefinition
} from "./basic";
import { builtInScriptConstants } from "./built-in-script-constant";

function loadArugment(definition: ArgumentDefinition): Argument {
    const argument: Argument = new Argument(
        definition.name,
        definition.type);
    argument.name = definition.name;
    argument.type = definition.type;
    argument.isCollection = definition.isCollection ? definition.isCollection : false;
    argument.isOptional = definition.optional ? definition.optional : false;
    argument.ellipsis = definition.ellipsis ? definition.ellipsis : false;
    argument.defaultValue = definition.defaultValue;
    argument.note = definition.note;
    if (definition.index) {
        argument.index = new Argument(
            definition.index.name,
            definition.index.type,
            definition.index.isCollection,
            definition.index.optional);
    }
    return argument;
}

function loadDefinitonBase<T extends DefinitionBase>(
    definition: BuiltInDefinition,
    n: new (options: DefinitionOptions) => T): T {
    const options: DefinitionOptions = {
        name: definition.name,
        insertText: definition.insertText,
        isReadonly: definition.readonly ?? false,
        isCollection: definition.isCollection ?? false,
        isConst: false,
        section: { name: "global", type: "global" },
        note: definition.note
    };
    return createDefinition(options, n);
}

function loadInterfaceOrObject<T extends InterfaceDefinition>(
        definition: BuiltInDefinition,
        n: new (options: DefinitionOptions) => T
    ): T {
    const def = loadDefinitonBase(definition, n);
    if (definition.methods) {
        definition.methods.forEach(
            method => {
                def.methods.set(
                    method.name.toLowerCase(),
                    loadFunctionBase(method, MethodDefinition, def)
                );
            }
        );
    }
    if (definition.properties) {
        definition.properties.forEach(
            prop => {
                def.properties.set(
                    prop.name.toLowerCase(),
                    loadProperty(prop, def)
                );
            }
        );
    }
    if (definition.defaultProperty) {
        def.default = def.getProperty(definition.defaultProperty);
    } else if (definition.defaultMethod) {
        def.default = def.getMethod(definition.defaultMethod);
    }
    return def;
}

function loadFunctionBase<T extends FunctionDefinition>(
        definition: BuiltInDefinition,
        n: new (options: DefinitionOptions) => T,
        obj?: InterfaceDefinition | ObjectDefinition
    ): T {
    const def = loadDefinitonBase(definition, n);
    if (obj && def.defType === "method") {
        (def as MethodDefinition).object = obj;
    }
    if (definition.arguments) {
        definition.arguments.forEach(
            arg => {
                def.arguments.push(loadArugment(arg));
            }
        );
    }
    def.return = definition.returnType;
    return def;
}

function loadProperty(
    definition: BuiltInDefinition,
    obj: InterfaceDefinition | ObjectDefinition): PropertyDefinition {
    const def = loadDefinitonBase(definition, PropertyDefinition);
    def.object = obj;
    def.return = definition.returnType ?? BasicTypeDefinitions.variant;
    if (definition.index) {
        def.index = loadArugment(definition.index);
    }
    return def;
}

function loadEnumerator(definition: BuiltInDefinition): EnumDefinition {
    const def = loadDefinitonBase(definition, EnumDefinition);
    if (definition.enumerators) {
        def.elements = definition.enumerators;
    }
    return def;
}

function loadScriptConstant(definition: BuiltInDefinition): ScriptConstantDefinition {
    const def = loadDefinitonBase(definition, ScriptConstantDefinition);
    if (definition.constants) {
        def.constants = definition.constants;
    }
    return def;
}

const builtInInterfaceDefinitions: Map<string, InterfaceDefinition> = new Map<string, InterfaceDefinition>();
const builtInObjectDefinitions: Map<string, ObjectDefinition> = new Map<string, ObjectDefinition>();
const builtInFunctionDefinitions: Map<string, FunctionDefinition> = new Map<string, FunctionDefinition>();
const builtInEnumeratorDefinitions: Map<string, EnumDefinition> = new Map<string, EnumDefinition>();
const builtInAggregateDefinitions: Map<string, FunctionDefinition> = new Map<string, FunctionDefinition>();

(function loadBuiltIns() {
    builtInInterfaces.forEach(
        def => builtInInterfaceDefinitions.set(def.name.toLowerCase(), loadInterfaceOrObject(def, InterfaceDefinition))
    );
    builtInObjects.forEach(
        obj => builtInObjectDefinitions.set(obj.name.toLowerCase(), loadInterfaceOrObject(obj, ObjectDefinition))
    );
    builtInFunctions.forEach(
        func => builtInFunctionDefinitions.set(func.name.toLowerCase(), loadFunctionBase(func, FunctionDefinition))
    );
    builtInAggregate.forEach(
        func => builtInAggregateDefinitions.set(func.name.toLowerCase(), loadFunctionBase(func, FunctionDefinition))
    );
    builtInEnums.forEach(
        def => builtInEnumeratorDefinitions.set(def.name.toLowerCase(), loadEnumerator(def))
    );
})();

export const IDocumentDefinition: ObjectDefinition = loadInterfaceOrObject(builtInIDocumentInterface, ObjectDefinition);
export const IQuestionDefinition: InterfaceDefinition = loadInterfaceOrObject(builtInQuesionInterface, InterfaceDefinition);
export const VbsDictionaryDefinition: ObjectDefinition = loadInterfaceOrObject(builtInVBSDictionary, ObjectDefinition);
export const VbsFsoDefinition: ObjectDefinition = loadInterfaceOrObject(builtinVBSFileSystemObject, ObjectDefinition);
export const VbsTextStreamDefinition: ObjectDefinition = loadInterfaceOrObject(builtInVBSTextStreamObject, ObjectDefinition);
export const VbsFileDefinition: ObjectDefinition = loadInterfaceOrObject(builtInVBSFileObject, ObjectDefinition);
export const VbsFolderDefinition: ObjectDefinition = loadInterfaceOrObject(builtInVBSFolderObject, ObjectDefinition);
export const VbsDriveDefinition: ObjectDefinition = loadInterfaceOrObject(builtInVBSDriveObject, ObjectDefinition);
export const MrScriptConstantsDefinition: ScriptConstantDefinition = loadScriptConstant(builtInScriptConstants);

//

export function searchAggregate(name: string): FunctionDefinition | undefined {
    return builtInAggregateDefinitions.get(name.toLowerCase());
}

export function searchInterface(name: string): InterfaceDefinition | undefined {
    return builtInInterfaceDefinitions.get(name.toLowerCase());
}

export function searchObject(name: string): ObjectDefinition | undefined {
    return builtInObjectDefinitions.get(name.toLowerCase());
}

export function searchFunction(name: string): FunctionDefinition | undefined {
    return builtInFunctionDefinitions.get(name.toLowerCase());
}

export function searchEnumerator(name: string): EnumDefinition | undefined {
    return builtInEnumeratorDefinitions.get(name.toLowerCase());
}

export function searchBuiltIn(name: string): DefinitionBase | undefined {
    return searchInterface(name) ||
           searchObject(name)    ||
           searchFunction(name)  ||
           searchEnumerator(name)||
           searchAggregate(name) ||
           (name.toLowerCase() === "mr" ? MrScriptConstantsDefinition : undefined);
}

builtInCallByDotCategoricalFunctions.forEach(
    func => BasicTypeDefinitions.categorical.methods.set(
        func.name.toLowerCase(),
        loadFunctionBase(
            func,
            FunctionDefinition,
            BasicTypeDefinitions.categorical))
);
builtInCallByDotTextFunctions.forEach(
    func => BasicTypeDefinitions.string.methods.set(
        func.name.toLowerCase(),
        loadFunctionBase(
            func,
            FunctionDefinition,
            BasicTypeDefinitions.string)
    )
);

BasicTypeDefinitions.categorical.isCollection = true;

export const eventNames: string[] =[
    "OnBeforeJobStart",
    "OnAfterMetaDataTransformation",
    "OnJobStart",
    "OnNextCase",
    "OnBadCase",
    "OnJobEnd",
    "OnAfterJobEnd",
];

export function isEventName(name: string): boolean {
    for (const n of eventNames) {
        if (n.toLowerCase() === name.toLowerCase()) {
            return true;
        }
    }
    return false;
}

function setBuiltInDefinition(defs: Map<string, PropertyDefinition | FunctionDefinition>) {
    defs.forEach(def => {
        if (def.return &&
            def.return.defType === "default") {
            def.return = searchBuiltIn(def.return.name);
        }
    });
}

builtInInterfaceDefinitions.forEach(
    value => {
        setBuiltInDefinition(value.properties);
        setBuiltInDefinition(value.methods);
    }
);

setBuiltInDefinition(IDocumentDefinition.properties);
setBuiltInDefinition(IDocumentDefinition.methods);
setBuiltInDefinition(IQuestionDefinition.properties);
setBuiltInDefinition(IQuestionDefinition.methods);

function setVbsBuiltInDefinition(defs: Map<string, PropertyDefinition | FunctionDefinition>) {
    defs.forEach(def => {
        if (def.return &&
            def.return.defType === "default") {
            switch (def.return.name) {
                case "TextStream":
                    def.return = VbsTextStreamDefinition;
                    break;
                case "Drive":
                    def.return = VbsDriveDefinition;
                    break;
                case "File":
                    def.return = VbsFileDefinition;
                    break;
                case "Folder":
                    def.return = VbsFolderDefinition;
                    break;
                default:
                    break;
            }
        }
    });
}

setVbsBuiltInDefinition(VbsFsoDefinition.properties);
setVbsBuiltInDefinition(VbsFsoDefinition.methods);
setVbsBuiltInDefinition(VbsTextStreamDefinition.properties);
setVbsBuiltInDefinition(VbsTextStreamDefinition.methods);
setVbsBuiltInDefinition(VbsDriveDefinition.properties);
setVbsBuiltInDefinition(VbsDriveDefinition.methods);
setVbsBuiltInDefinition(VbsFolderDefinition.properties);
setVbsBuiltInDefinition(VbsFolderDefinition.methods);
setVbsBuiltInDefinition(VbsFileDefinition.properties);
setVbsBuiltInDefinition(VbsFileDefinition.methods);

BasicTypes.string.definition = BasicTypeDefinitions.string;
BasicTypes.categorical.definition = BasicTypeDefinitions.categorical;

BasicTypes.long.definition = BasicTypeDefinitions.long;
BasicTypes.double.definition = BasicTypeDefinitions.double;
BasicTypes.variant.definition = BasicTypeDefinitions.variant;
BasicTypes.boolean.definition = BasicTypeDefinitions.boolean;
BasicTypes.date.definition = BasicTypeDefinitions.date;
BasicTypes.object.definition = BasicTypeDefinitions.object;
BasicTypes.array.definition = BasicTypeDefinitions.array;
BasicTypes.null.definition = BasicTypeDefinitions.null;

BasicTypeDefinitions.array.return = BasicTypeDefinitions.variant;

export { BasicTypes };
export { BasicTypeDefinitions };
