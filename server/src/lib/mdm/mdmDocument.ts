import { readFileSync } from "fs";
import { DOMParser } from "xmldom";
import {
    MdmAlternative,
    MdmAlternatives,
    MdmAtoms,
    MdmBlockVarDefinition,
    MdmCategories,
    MdmCategory,
    MdmCategoryMap,
    MdmCollection,
    MdmConnection,
    MdmContext,
    MdmContexts,
    MdmDataSources,
    MdmDefinition,
    MdmElement,
    MdmHelperFields,
    MdmLabeled,
    MdmLabels,
    MdmLabelStyles,
    MdmLanguage,
    MdmLanguages,
    MdmLoopDesign,
    MdmLoopRanges,
    MdmLoopSubFieldsDesign,
    MdmMappings,
    MdmNotes,
    MdmOtherVarDefinition,
    MdmPages,
    MdmProperties,
    MdmProperty,
    MdmRange,
    MdmReference,
    MdmRouting,
    MdmRoutingItem,
    MdmRoutings,
    MdmSaveLog,
    MdmSaveLogs,
    MdmScript,
    MdmScripts,
    MdmScriptType,
    MdmSettings,
    MdmStyles,
    MdmSubFields,
    MdmTemplates,
    MdmText,
    MdmTypes,
    MdmUser,
    MdmVarDefinition
} from "./mdmTypes";

export class MdmDocument {

    private xml: string = "";
    private path: string;
    private xmlDocument: Document;

    raiseError?: (text: string) => string;

    constructor(path: string) {
        this.path = path;
        try {
            this.xml = readFileSync(path).toString();
        } catch (err) {
            throw err;
        }
        let parser = new DOMParser();
        this.xmlDocument = parser.parseFromString(this.xml);
    }

    load() {
    }

    private unknownNode(child: any, base: any) {
        if (this.raiseError) {
            this.raiseError(`Unknown tag '${this.getTagName(child)}' in '${this.getTagName(base)}'`);
        }
    }

    private getTagName(node: any): string {
        return node["tagName"] ? node["tagName"] : "";
    }

    private getAttribute(node: any, name: string): string | undefined {
        if (node["getAttribute"]) {
            return node["getAttribute"](name);
        }
        return undefined;
    }

    private getAttributeNotEmpty(node: any, name: string): string {
        return this.getAttribute(node, name) ?? "";
    }

    private getInnerText(node: any): string {
        let firstChild = node["firstChild"];
        if (firstChild && this.isTextNode(firstChild)) {
            return firstChild["data"];
        }
        return "";
    }

    private isTextNode(node: any): boolean {
        return node["nodeType"] && node["nodeType"] === 3;
    }

    private isElementNode(node: any): boolean {
        return node["nodeType"] && node["nodeType"] === 1;
    }

    private iterateChild(node: any, callback: (node: any) => void) {
        if (!node["firstChild"]) {
            return;
        }
        let child = node["firstChild"];
        while (child) {
            if (this.isElementNode(child)) {
                callback(child);
            }
            child = child["nextSibling"];
        }
    }

    private readConnection(node: any): MdmConnection {
        return {
            name: this.getAttributeNotEmpty(node, "name"),
            dbLocation: this.getAttributeNotEmpty(node, "dblocation"),
            cdscName: this.getAttributeNotEmpty(node, "cdscname"),
            project: this.getAttributeNotEmpty(node, "project"),
            id: this.getAttributeNotEmpty(node, "id")
        };
    }

    private readDataSources(node: any): MdmDataSources {
        let connections: MdmConnection[] = [];
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "connection") {
                connections.push(this.readConnection(child));
            } else {
                this.unknownNode(child, node);
            }
        });
        return {
            default: this.getAttribute(node, "default"),
            connections
        };
    }

    private readProperty(node: any): MdmProperty {
        let properties: MdmProperties | undefined;
        let styles: MdmStyles | undefined;
        this.iterateChild(node, child => {
            let tagName = this.getTagName(child);
            if (tagName === "properties") {
                properties = this.readProperties(child);
            } else if (tagName === "styles") {
                styles = this.readProperties(child);
            } else {
                this.unknownNode(child, node);
            }
        });
        return {
            name: this.getAttributeNotEmpty(node, "name"),
            value: this.getAttributeNotEmpty(node, "value"),
            type: this.getAttributeNotEmpty(node, "type"),
            context: this.getAttributeNotEmpty(node, "context"),
            properties,
            styles
        };
    }

    private readProperties(node: any): MdmProperties {
        let props: MdmProperties = [];
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "property") {
                props.push(this.readProperty(child));
            } else {
                this.unknownNode(child, node);
            }
        });
        return props;
    }

    private readText(node: any): MdmText {
        return {
            context: this.getAttributeNotEmpty(node, "context"),
            language: this.getAttributeNotEmpty(node, "xml:lang"),
            text: this.getInnerText(node)
        };
    }

    private readLabels(node: any): MdmLabels {
        let texts: MdmText[] = [];
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "text") {
                texts.push(this.readText(child));
            } else {
                this.unknownNode(child, node);
            }
        });
        return {
            context: this.getAttributeNotEmpty(node, "context"),
            texts
        };
    }

    private readSettingAndLabel(node: any, callback: (node: any) => void): MdmSettings & MdmLabeled {
        let properties: MdmProperties | undefined;
        let templates: MdmTemplates | undefined;
        let labels: MdmLabels | undefined;
        let labelStyles: MdmLabelStyles | undefined;
        let notes: MdmNotes | undefined;
        let styles: MdmStyles | undefined;
        this.iterateChild(node, child => {
            let tagName = this.getTagName(child);
            if (tagName === "properties") {
                properties = this.readProperties(child);
            } else if (tagName === "templates") {
                templates = this.readProperties(child);
            } else if (tagName === "styles") {
                styles = this.readProperties(child);
            } else if (tagName === "labels") {
                labels = this.readLabels(child);
            } else if (tagName === "labelstyles") {
                labelStyles = this.readProperties(child);
            } else if (tagName === "notes") {
                notes = this.readProperties(child);
            } else {
                callback(node);
            }
        });
        return {
            properties,
            templates,
            styles,
            labels,
            labelStyles,
            notes
        };
    }

    private readReference(node: any): MdmReference {
        return {
            id: this.getAttributeNotEmpty(node, "id"),
            name: this.getAttributeNotEmpty(node, "name"),
            ref: this.getAttributeNotEmpty(node, "ref")
        };
    }

    private readMdmCollection<T>(node: any,
        cbs: {read: (node: any) => T, test: (node: any) => boolean}[],
        raiseError = true): MdmCollection<T> {
        let deleted: T[] = [];
        let values: T[] | undefined;
        this.iterateChild(node, child => {
            let checked = false;
            for (let i = 0; i < cbs.length; i++) {
                if (cbs[i].test(child)) {
                    checked = true;
                    if (!values) {
                        values = [];
                    }
                    values.push(cbs[i].read(child));
                    break;
                }
            }

            if (this.getTagName(child) === "deleted") {
                this.iterateChild(child, del => {
                    let checkDel = false;
                    for (let i = 0; i < cbs.length; i++) {
                        if (cbs[i].test(del)) {
                            checkDel = true;
                            deleted.push(cbs[i].read(del));
                            break;
                        }
                    }
                    if (!checkDel && raiseError) {
                        this.unknownNode(del, child);
                    }
                });
            } else if (!checked && raiseError) {
                this.unknownNode(child, node);
            }
        });
        return { deleted, values };
    }

    private readCategory(node: any): MdmCategory {
        let otherVariable: MdmReference | undefined;
        let multiplierVariable: MdmReference | undefined;
        let base = this.readSettingAndLabel(node, child => {
            let tagName = this.getTagName(child);
            if (tagName === "othervariable") {
                otherVariable = this.readReference(child);
            }else if (tagName === "multiplier-variable") {
                multiplierVariable = this.readReference(child);
            }
        });
        return Object.assign({
            id: this.getAttributeNotEmpty(node, "id"),
            name: this.getAttributeNotEmpty(node, "name"),
            fixed: this.getAttribute(node, "fixed"),
            noFilter: this.getAttribute(node, "nofilter"),
            otherLocal: this.getAttribute(node, "other-local"),
            missing: this.getAttribute(node, "missing"),
            exclusive: this.getAttribute(node, "exclusive"),
            factorValue: this.getAttribute(node, "factor-value"),
            factorType: this.getAttribute(node, "factor-type"),
            keycode: this.getAttribute(node, "keycode"),
            expression: this.getAttribute(node, "expression"),
            otherVariable,
            multiplierVariable
        }, base);
    }

    private readElement(node: any): MdmElement {
        return Object.assign(this.readCategory(node), {
            type: this.getAttributeNotEmpty(node, "type")
        });
    }

    private readCategories(node: any): MdmCategories {
        let settings = this.readSettingAndLabel(node, () => {});
        let collection = this.readMdmCollection<MdmCategory | MdmElement | MdmCategories>(node, [
            {
                read: this.readCategory.bind(this),
                test: node => this.getTagName(node) === "category"
            },
            {
                read: this.readElement.bind(this),
                test: node => this.getTagName(node) === "element"
            },
            {
                read: this.readCategories.bind(this),
                test: node => this.getTagName(node) === "categories"
            }
        ], true);
        return Object.assign({
            globalNamespace: this.getAttributeNotEmpty(node, "global-name-space"),
            id: this.getAttribute(node, "id"),
            name: this.getAttribute(node, "name"),
            categoriesRef: this.getAttribute(node, "categoriesref"),
            inline: this.getAttribute(node, "inline"),
            refName: this.getAttribute(node, "ref_name"),
            fixed: this.getAttribute(node, "fixed"),
            noFilter: this.getAttribute(node, "nofilter")
        }, settings, collection);
    }

    private readPages(node: any): MdmPages {
        let collection = this.readMdmCollection(node, [
            {
                read: this.readReference,
                test: node => this.getTagName(node) === "page"
            }
        ], true);
        return Object.assign({
            name: this.getAttributeNotEmpty(node, "name"),
            globalNamespace: this.getAttributeNotEmpty(node, "global-name-space")
        }, collection);
    }

    private readRoutingItem(node: any): MdmRoutingItem {
        return {
            name: this.getAttributeNotEmpty(node, "name"),
            item: this.getAttributeNotEmpty(node, "item")
        };
    }

    private readRouting(node: any): MdmRouting {
        let ritems: MdmRoutingItem[] | undefined;
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "ritem") {
                if (!ritems) {
                    ritems = [];
                }
                ritems.push(this.readRoutingItem(child));
            } else {
                this.unknownNode(child, node);
            }
        });
        return {
            context: this.getAttributeNotEmpty(node, "context"),
            interviewModes: this.getAttributeNotEmpty(node, "interviewmodes"),
            useKeycodes: this.getAttributeNotEmpty(node, "usekeycodes"),
            ritems
        };
    }

    private readRoutings(node: any): MdmRoutings {
        let scripts: MdmScripts | undefined;
        let routing: MdmRouting[] | undefined;
        this.iterateChild(node, child => {
            let tagName = this.getTagName(child);
            if (tagName === "scripts") {
                scripts = this.readScripts(child);
            } else if (tagName === "routing") {
                if (!routing) {
                    routing = [];
                }
                routing.push(this.readRouting(child));
            } else {
                this.unknownNode(child, node);
            }
        });
        return {
            name: this.getAttributeNotEmpty(node, "name"),
            scripts,
            routing
        };
    }

    private readScript(node: any): MdmScript {
        return {
            name: this.getAttributeNotEmpty(node, "name"),
            default: this.getAttributeNotEmpty(node, "default"),
            text: this.getInnerText(node)
        };
    }

    private readScriptType(node: any): MdmScriptType {
        let collection = this.readMdmCollection(node, [
            {
                read: this.readScript,
                test: node => this.getTagName(node) === "script"
            }
        ], true);
        return Object.assign({
            type: this.getAttributeNotEmpty(node, "type"),
            context: this.getAttributeNotEmpty(node, "context"),
            interviewModes: this.getAttributeNotEmpty(node, "interviewmodes"),
            useKeycodes: this.getAttributeNotEmpty(node, "usekeycodes")
        }, collection);
    }

    private readScripts(node: any): MdmScripts {
        return this.readMdmCollection(node, [
            {
                read: this.readScriptType,
                test: node => this.getTagName(node) === "scripttype"
            }
        ], true);
    }

    private readSubFields(node: any): MdmSubFields {
        let collection = this.readMdmCollection<MdmReference | MdmBlockVarDefinition | MdmLoopDesign>(node, [
            {
                test: node => this.getTagName(node) === "variable",
                read: this.readReference
            },
            {
                test: node => this.getTagName(node) === "class",
                read: this.readBlock
            },
            {
                test: node => this.getTagName(node) === "loop" || this.getTagName(node) === "grid",
                read: this.readLoop
            }
        ], true);
        return Object.assign({
            name: this.getAttributeNotEmpty(node, "name"),
            globalNamespace: this.getAttributeNotEmpty(node, "global-name-space")
        }, collection);
    }

    private readLoopSubFields(node: any): MdmLoopSubFieldsDesign {
        let fields: MdmSubFields | undefined;
        let pages: MdmPages | undefined;
        let types: MdmTypes | undefined;
        let settings = this.readSettingAndLabel(node, child => {
            let tagName = this.getTagName(child);
            switch (tagName) {
                case "types":    types = this.readPages(child);     break;
                case "pages":    pages = this.readPages(child);     break;
                case "fields":   fields = this.readSubFields(child);break;
                default:
                    this.unknownNode(child, node);
                    break;
            }
        });
        return Object.assign({
            name: this.getAttributeNotEmpty(node, "name"),
            globalNamespace: this.getAttributeNotEmpty(node, "global-name-space"),
            fields,
            pages,
            types
        }, settings);
    }

    private readBlock(node: any): MdmBlockVarDefinition {
        let fields: MdmSubFields | undefined;
        let pages: MdmPages | undefined;
        let types: MdmTypes | undefined;
        let routings: MdmRoutings | undefined;
        let settings = this.readSettingAndLabel(node, child => {
            let tagName = this.getTagName(child);
            switch (tagName) {
                case "fields":   fields = this.readSubFields(child);    break;
                case "pages":    pages = this.readPages(child);         break;
                case "types":    types = this.readPages(child);         break;
                case "routings": routings = this.readRoutings(child);   break;
                default:         this.unknownNode(child, node);         break;
            }
        });
        return Object.assign({
            id: this.getAttributeNotEmpty(node, "id"),
            name: this.getAttributeNotEmpty(node, "name"),
            globalNamespace: this.getAttributeNotEmpty(node, "global-name-space"),
            fields,
            pages,
            types,
            routings
        }, settings);
    }

    private readLoopRanges(node: any): MdmLoopRanges {
        let ranges: MdmLoopRanges = [];
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "range") {
                ranges.push({
                    lowerbound: this.getAttribute(node, "lowerbound"),
                    upperbound: this.getAttribute(node, "upperbound")
                });
            } else {
                this.unknownNode(child, node);
            }
        });
        return ranges;
    }

    private readLoop(node: any): MdmLoopDesign {
        let categories: MdmCategories | undefined;
        let ranges: MdmLoopRanges | undefined;
        let types: MdmTypes | undefined;
        let pages: MdmPages | undefined;
        let fields: MdmLoopSubFieldsDesign | undefined;
        let settings = this.readSettingAndLabel(node, child => {
            let tagName = this.getTagName(child);
            switch (tagName) {
                case "types":      types = this.readPages(child);           break;
                case "ranges":     ranges = this.readLoopRanges(child);     break;
                case "pages":      pages = this.readPages(child);           break;
                case "class":      fields = this.readLoopSubFields(child);  break;
                case "categories": categories = this.readCategories(child); break;
                default:           this.unknownNode(child, node);           break;
            }
        });
        return Object.assign({
            id: this.getAttributeNotEmpty(node, "id"),
            name: this.getAttributeNotEmpty(node, "name"),
            globalNamespace: this.getAttribute(node, "global-name-space"),
            isGrid: this.getAttribute(node, "isgrid"),
            iteratorType: this.getAttributeNotEmpty(node, "iteratortype"),
            type: this.getAttributeNotEmpty(node, "type"),
            fields,
            categories,
            ranges,
            pages,
            types
        }, settings);
    }

    private readHelperFields(node: any): MdmHelperFields {
        let collection = this.readMdmCollection<MdmBlockVarDefinition | MdmReference>(node, [
            {
                read: this.readReference,
                test: node => this.getTagName(node) === "variable"
            },
            {
                read: this.readBlock,
                test: node => this.getTagName(node) === "class"
            }
        ], true);
        return Object.assign({
            id: this.getAttributeNotEmpty(node, "id"),
            name: this.getAttributeNotEmpty(node, "name"),
            globalNamespace: this.getAttributeNotEmpty(node, "global-name-space"),
        }, collection);
    }

    private readDefinitionRange(node: any): MdmRange {
        return {
            min: this.getAttribute(node, "min"),
            max: this.getAttribute(node, "max"),
            minType: this.getAttribute(node, "mintype"),
            maxType: this.getAttribute(node, "maxtype"),
            rangeExp: this.getAttribute(node, "rangeexp")
        };
    }

    private readVarDefinition(node: any): MdmVarDefinition {
        let categories: MdmCategories | undefined;
        let helperFields: MdmHelperFields | undefined;
        let settings = this.readSettingAndLabel(node, child => {
            let tagName = this.getTagName(child);
            switch (tagName) {
                case "categories":   categories = this.readCategories(child);      break;
                case "helperfields": helperFields = this.readHelperFields(child);  break;
                default:             this.unknownNode(child, node);                break;
            }
        });
        let range = this.readDefinitionRange(node);
        return Object.assign({
            id: this.getAttributeNotEmpty(node, "id"),
            name: this.getAttributeNotEmpty(node, "name"),
            type: this.getAttributeNotEmpty(node, "type"),
            categories,
            helperFields
        }, settings, range);
    }

    private readOtherVarDefinition(node: any, type: "other" | "multi"): MdmOtherVarDefinition {
        let settings = this.readSettingAndLabel(node, () => {});
        return Object.assign({
            id: this.getAttributeNotEmpty(node, "id"),
            name: this.getAttributeNotEmpty(node, "name"),
            type: this.getAttributeNotEmpty(node, "type"),
            usageType: this.getAttributeNotEmpty(node, "usagetype"),
            isOtherOrMulti: type
        }, settings);
    }

    private readDefinitions(node: any): MdmDefinition[] {
        let definitions: MdmDefinition[] = [];
        this.iterateChild(node, child => {
            let tageName = this.getTagName(child);
            switch (tageName) {
                case "othervariable":       definitions.push(this.readOtherVarDefinition(child, "other")); break;
                case "multiplier-variable": definitions.push(this.readOtherVarDefinition(child, "multi")); break;
                case "variable":            definitions.push(this.readVarDefinition(child));               break;
                case "categories":          definitions.push(this.readCategories(child));                  break;
                default:                    this.unknownNode(child, node);                                 break;
            }
        });
        return definitions;
    }

    private readMappings(node: any): MdmMappings {
        let mappings: MdmMappings = [];
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "varinstance") {
                mappings.push({
                    name: this.getAttributeNotEmpty(child, "name"),
                    sourceType: this.getAttributeNotEmpty(child, "sourcetype"),
                    variable: this.getAttributeNotEmpty(child, "variable"),
                    fullName: this.getAttributeNotEmpty(child, "fullname")
                });
            } else {
                this.unknownNode(child, node);
            }
        });
        return mappings;
    }

    private readLanguage(node: any): MdmLanguage {
        let properties: MdmProperties | undefined;
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "properties") {
                properties = this.readProperties(child);
            } else {
                this.unknownNode(child, node);
            }
        });
        return {
            name: this.getAttributeNotEmpty(node, "name"),
            id: this.getAttributeNotEmpty(node, "id"),
            properties
        };
    }

    private readLanguages(node: any): MdmLanguages {
        let collection = this.readMdmCollection(node, [
            {
                read: this.readLanguage,
                test: node => this.getTagName(node) === "language"
            }
        ], true);
        return Object.assign({
            base: this.getAttributeNotEmpty(node, "base")
        }, collection);
    }

    private readAlternatives(node: any): MdmAlternatives {
        return this.readMdmCollection<MdmAlternative>(node, [
            {
                read: node => { return { name: this.getAttributeNotEmpty(node, "name") }; },
                test: node => this.getTagName(node) === "alternative"
            }
        ], true);
    }

    private readContext(node: any): MdmContext {
        let alternatives: MdmAlternatives | undefined;
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "alternatives") {
                alternatives = this.readAlternatives(child);
            } else {
                this.unknownNode(child, node);
            }
        });
        return {
            name: this.getAttributeNotEmpty(node, "name"),
            alternatives
        };
    }

    private readContexts(node: any): MdmContexts {
        let collection = this.readMdmCollection(node, [
            {
                read: this.readContext,
                test: node => this.getTagName(node) === "context"
            }
        ], true);
        return Object.assign({
            base: this.getAttributeNotEmpty(node, "base")
        }, collection);
    }

    private readAtoms(node: any): MdmAtoms {
        let atoms: MdmAtoms = [];
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "atom") {
                atoms.push({
                    name: this.getAttributeNotEmpty(child, "name")
                });
            } else {
                this.unknownNode(child, node);
            }
        });
        return atoms;
    }

    private readUser(node: any): MdmUser {
        return {
            name: this.getAttributeNotEmpty(node, "name"),
            fileVersion: this.getAttributeNotEmpty(node, "fileversion"),
            comment: this.getAttributeNotEmpty(node, "comment")
        };
    }

    private readSaveLog(node: any): MdmSaveLog {
        let user: MdmUser | undefined;
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "user") {
                user = this.readUser(child);
            } else {
                this.unknownNode(child, node);
            }
        });
        return {
            fileVersion: this.getAttributeNotEmpty(node, "fileversion"),
            versionSet: this.getAttributeNotEmpty(node, "versionset"),
            userName: this.getAttributeNotEmpty(node, "username"),
            date: this.getAttributeNotEmpty(node, "date"),
            count: this.getAttributeNotEmpty(node, "count"),
            user
        };
    }

    private readSaveLogs(node: any): MdmSaveLogs {
        let logs: MdmSaveLogs = [];
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "savelog") {
                logs.push(this.readSaveLog(child));
            } else {
                this.unknownNode(child, node);
            }
        });
        return logs;
    }

    private readCategoryMap(node: any): MdmCategoryMap {
        let map: MdmCategoryMap = [];
        this.iterateChild(node, child => {
            if (this.getTagName(child) === "categoryid") {
                map.push({
                    name: this.getAttributeNotEmpty(child, "name"),
                    value: this.getAttributeNotEmpty(child, "value")
                });
            } else {
                this.unknownNode(child, node);
            }
        });
        return map;
    }

}



