import { BasicTypeDefinitions, IQuestionDefinition } from "../built-in/built-ins";
import { DefinitionBase, VariantDefinition } from "./definition";

function matchBaseDefinition(
    t1: DefinitionBase,
    t2: DefinitionBase) {
    if (((t1.defType === "enum") && t2 === BasicTypeDefinitions.long) ||
        ((t2.defType === "enum") && t1 === BasicTypeDefinitions.long)) {
        return true;
    }
    if (t1.defType === "constant" || t2.defType === "constant") {
        return true;
    }
    if (t1 === IQuestionDefinition || t2 === IQuestionDefinition) {
        return true;
    }
    return t1 === t2 ||
        t1 === BasicTypeDefinitions.variant ||
        t2 === BasicTypeDefinitions.variant;
}

function matchArrayDefinition(
    t1: VariantDefinition,
    t2: VariantDefinition) {
    return t1.defType === t2.defType &&
        t1.dimensions === t2.dimensions;
}

export function matchDefinition(
    t1: DefinitionBase,
    t2: DefinitionBase) {
    if ((t1 instanceof VariantDefinition) &&
        (t2 instanceof VariantDefinition)) {
        if (t1.isArray && t2.isArray) {
            return matchArrayDefinition(t1, t2);
        }
        if (t1.isArray !== t2.isArray) {
            return false;
        } else {
            return true;
        }
    }
    return matchBaseDefinition(t1, t2);
}

export function matchOneOfDefinitions(
    t1?: DefinitionBase,
    t2?: DefinitionBase | DefinitionBase[]) {
    if (!t1 || !t2) {
        return true;
    }
    if (t2 instanceof Array) {
        for (let i = 0; i < t2.length; i++) {
            if (matchDefinition(t1, t2[i])) {
                return true;
            }
        }
        return false;
    } else {
        return matchDefinition(t1 ,t2);
    }
}
