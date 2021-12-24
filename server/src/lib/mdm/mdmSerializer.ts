import {
    MdmCategories,
    MdmCategory,
    MdmElement,
    MdmLabeled,
    MdmLabels,
    MdmLabelStyles,
    MdmMetadata,
    MdmProperties,
    MdmProperty,
    MdmRange,
    MdmSettings,
    MdmStyles,
    MdmTemplates
} from "./mdmTypes";

export interface MdmSerializerOptions {
    tabLength: number;
    showProperties: boolean;
    context: string;
    language: string;
}

export class MdmSerializer {

    private options: MdmSerializerOptions;
    private tabIndentation: string;

    constructor(options: MdmSerializerOptions) {
        this.options = options;
        if (this.options.tabLength > 0) {
            this.tabIndentation = " ".repeat(this.options.tabLength);
        } else {
            this.tabIndentation = "    ";
        }
    }

    serializeFromMetadata(metadata: MdmMetadata) {
    }

    private checkContext(node: any, context: string): boolean {
        if (!node["context"] || node["context"].toLowerCase() !== context.toLowerCase()) {
            return false;
        }
        return true;
    }

    private checkLanguage(node: any, language: string): boolean {
        if (!node["language"] || node["language"].toLowerCase() !== language.toLowerCase()) {
            return false;
        }
        return true;
    }

    private getCorrectValue(org: string, type: string): string {
        switch (type) {
            case "8":    return `"${org}"`;
            case "11":   return org === "0" ? "false" : "true";
            default:     return org;
        }
    }

    private serializeProperty(property: MdmProperty) {
        return `${property.name} = ${this.getCorrectValue(property.value, property.type)}`;
    }

    private serializePropertiesLike(properties: MdmProperties, start: string, end: string, indentation = "") {
        let strProps = "\n" + indentation + start;
        properties.forEach(prop => {
            if (this.checkContext(prop, this.options.context)) {
                strProps += `\n${indentation}${this.tabIndentation}${this.serializeProperty(prop)},`;
            }
        });
        return `${strProps.slice(0, strProps.length - 1)}\n${indentation}${end}`;
    }

    private serializeProperties(properties: MdmProperties, indentation = "") {
        return this.serializePropertiesLike(properties, "[", "]", indentation);
    }

    private serializeTemplates(templates: MdmTemplates, indentation = "") {
        return this.serializePropertiesLike(templates, "templates(", ")", indentation);
    }

    private serializeLabelStyle(labelStyle: MdmLabelStyles, indentation = "") {
        return this.serializePropertiesLike(labelStyle, "labelstyle(", ")", indentation);
    }

    private serializeStyle(style: MdmStyles, indentation = "") {
        return this.serializePropertiesLike(style, "style(", ")", indentation);
    }

    private serializeLabel(label: MdmLabels) {
        if (!this.checkContext(label, this.options.context)) {
            return " -";
        }
        let languageLabel = label.texts.find(text => this.checkContext(text, this.options.context) && this.checkLanguage(text, this.options.language));
        return languageLabel ? ` "${languageLabel.text}"` : " -";
    }

    private serializeSettingAndLabel(settings: MdmSettings & MdmLabeled, head: string, tail: string, indentation = "") {
        let properties = settings.properties ? this.serializeProperties(settings.properties, indentation) : "";
        let templates = settings.templates ? this.serializeTemplates(settings.templates, indentation) : "";
        let labelStyles = settings.labelStyles ? this.serializeLabelStyle(settings.labelStyles, indentation) : "";
        let styles = settings.styles ? this.serializeStyle(settings.styles, indentation) : "";
        let label = settings.labels ? this.serializeLabel(settings.labels) : "";
        return `\n${indentation}${head} ${label}${properties}${templates}${labelStyles}${styles}${tail}`;
    }

    private serializeCategory(category: MdmCategory, isLast = false, indentation = "") {
        let tail = this.serializeCategoryTail(category) + (isLast ? "" : ",");
        return this.serializeSettingAndLabel(category, category.name, tail, indentation);
    }

    private serializeKeycode(category: MdmCategory) {
        return category.keycode ? ` keycode("${category.keycode}")` : "";
    }

    private serializeFactor(category: MdmCategory) {
        return category.factorValue ? ` factor(${category.factorValue})` : "";
    }

    private serializeExpression(category: MdmCategory) {
        return category.expression ? ` expression("${category.expression}")` : "";
    }

    private serializeFixAndNoFilter(node: MdmCategory | MdmCategories) {
        return `${node.fixed === "-1" ? " fix" : ""}${node.noFilter === "-1" ? " nofilter" : ""}`;
    }

    private serializeElementType(node: any) {
        if (!node["type"]) {
            return "";
        }
        let type = "";
        switch (node["type"]) {
            case "2":    type = "AnalysisBase";           break;
            case "14":   type = "AnalysisCategory";       break;
            case "12":   type = "AnalysisMaximum";        break;
            case "7":    type = "AnalysisMean";           break;
            case "11":   type = "AnalysisMinimum";        break;
            case "10":   type = "AnalysisSampleVariance"; break;
            case "8":    type = "AnalysisStdDev";         break;
            case "9":    type = "AnalysisStdErr";         break;
            case "1":    type = "AnalysisSubHeading";     break;
            case "3":    type = "AnalysisSubTotal";       break;
            case "4":    type = "AnalysisSummaryData";    break;
            case "6":    type = "AnalysisTotal";          break;
            default:                                      break;
        }
        return ` elementtype(${type})`;
    }

    private serializeCategoryTail(category: MdmCategory) {
        return `${this.serializeFixAndNoFilter(category)}${this.serializeKeycode(category)}${this.serializeElementType(category)}${this.serializeFactor(category)}${this.serializeExpression(category)}`;
    }

    private serializeTailOrder(node: MdmSettings) {
        if (!node.properties) {
            return "";
        }
        let order = node.properties.find(prop => this.checkContext(prop, this.options.context) && prop.name === "DisplayOrder");
        if (!order) {
            return "";
        }
        switch (order.value) {
            case "Randomized":    return " ran";
            case "Descending":    return " desc";
            case "Rotate":        return " rot";
            case "Reverse":       return " rev";
            case "Ascending":     return " asc";
            default:              return "";
        }
    }

    private serializeFieldType(node: any) {
        if (!node["type"]) {
            return "";
        }
        switch (node["type"]) {
            case "0":    return "info";
            case "1":    return "long";
            case "2":    return "text";
            case "3":    return "categorical";
            case "5":    return "date";
            case "7":    return "boolean";
            default:     return "";
        }
    }

    private serializeFieldRange(range: MdmRange) {
        if (range.rangeExp) {
            return range.rangeExp;
        }
        if (!range.max && !range.min) {
            return "";
        }
        return range.min === range.max ? `[${range.min}]` : `[${range.min ?? ""}..${range.max ?? ""}]`;
    }

}


