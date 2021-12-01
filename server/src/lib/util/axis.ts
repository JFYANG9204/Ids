

const axisSpecialElementText = "base|unweightedbase|mean|stddev|stderr|sampvar|total|subtotal|text|min|max|net|combine|expression|numeric|ppt|derived|sum|effectivebase|median|percentile|mode|ntd";
const axisSpecialElementRegex = new RegExp("(" + axisSpecialElementText + ")\(.*?\)", "i");

const axisNameBaseText = "[a-zA-Z_]\w*";
const axisExprBaseText = `${axisNameBaseText}\s*(\[\{${axisNameBaseText}\}\]\.${axisNameBaseText})*`;

