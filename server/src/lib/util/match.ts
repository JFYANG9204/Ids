

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

const aggregateFunctionName = new Set([
    "AVG",
    "BASE",
    "COUNT",
    "SUM",
    "MIN",
    "MAX",
    "STDEV",
]);

export function isAggregateFunction(name: string) {
    return aggregateFunctionName.has(name.toUpperCase());
}

const conversionFunctions = new Set([
    "ccategorical",
    "ctext",
    "cdate",
    "cboolean",
    "clong",
    "cdouble"
]);

export function isConversionFunction(name: string) {
    return conversionFunctions.has(name.toLowerCase());
}

