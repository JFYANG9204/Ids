import { BuiltInDefinition } from "./types";



export const builtInAggregate = new Set<BuiltInDefinition>([
    {
        name: "AVG",
        label: "AVG(expr)",
        insertText: "AVG",
        definitionType: "function",
        note: [
            "(function) AVG(expr)",
            "------------------------",
            "Returns the average of the values defined in the expression. This function can be used with numeric data only.",
        ].join("\n"),
    },
    {
        name: "BASE",
        label: "BASE(expr)",
        definitionType: "function",
        note: [
            "(function) BASE(expr)",
            "------------------------",
            "Returns the total number of cases included in the expression. Generally, the base includes every case for which the value is not `NULL`.",
        ].join("\n"),
    },
    {
        name: "COUNT",
        label: "COUNT(expr)",
        definitionType: "function",
        note: [
            "(function) COUNT(expr)",
            "------------------------",
            "Returns a count of the cases selected by the expression.",
        ].join("\n"),
    },
    {
        name: "SUM",
        label: "SUM(expr)",
        definitionType: "function",
        note: [
            "(function) SUM(expr)",
            "------------------------",
            "When used with numeric data, returns the sum of the values. When used with categorical data, it returns the union of the categorical values.",
        ].join("\n"),
    },
    {
        name: "MIN",
        label: "MIN(expr)",
        definitionType: "function",
        note: [
            "(function) MIN(expr)",
            "------------------------",
            "Returns the lowest value defined in the expression.",
        ].join("\n"),
    },
    {
        name: "MAX",
        label: "MAX(expr)",
        definitionType: "function",
        note: [
            "(function) MAX(expr)",
            "------------------------",
            "Returns the highest value defined in the expression.",
        ].join("\n"),
    },
    {
        name: "STDEV",
        label: "STDEV(expr)",
        definitionType: "function",
        note: [
            "(function) STDEV(expr)",
            "------------------------",
            "Returns the standard deviation of the values defined in the expression. This function can be used with numeric data only. The standard deviation is a measure of dispersion around the mean. In a normal distribution, 68% of cases fall within one standard deviation of the mean and 95% of cases fall within 2 standard deviations. For example, if the mean age is 45 with a standard deviation of 10, then 95% of the cases would be between 25 and 65 in a normal distribution.",
        ].join("\n"),
    },
]);


