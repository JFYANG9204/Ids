import {
    readFileSync
} from "fs";
import {
    AliasVariable,
    Axis,
    Categories,
    Category,
    Connection,
    DataSources,
    DeleteCollection,
    HelperFields,
    Label,
    Labels,
    LabelStyles,
    Element as MDMElement,
    Notes,
    Properties,
    Property,
    Reference,
    Styles,
    SubAlias,
    Variable,
    OtherVariable,
    FieldDefinitionBase,
    Routing,
    RoutingItem,
    Script,
    ScriptType,
    Scripts,
    Routings,
    References,
    BlockField,
    System,
    VarInstance,
    LoopField,
    LoopSubFields,
    BlockSubFields,
    MDMXmlDesign,
    Language,
    Languages,
    Alternative,
    Context,
    Contexts,
    UserSaveLog,
    SaveLog,
    Metadata,
    EMPTY_DATASOURCES,
    EMPTY_PROPERTIES,
    EMPTY_LABELS,
    EMPTY_SYSTEM,
    EMPTY_ROUTINGS,
    EMPTY_LANGUAGES,
    EMPTY_CONTEXTS
} from "./types";
import { DOMParser } from "xmldom";


export class MDMDocument {

    private xmlParser: DOMParser;
    private xmlDoc: Document;
    private xmlInstruction: { version: string, encoding: string };
    private xmlStyleSheet: { type: string, href: string };
    private metadata: Metadata | undefined;

    raiseErrorFunction?: (text: string) => void;

    constructor (filePath: string) {
        this.xmlParser = new DOMParser();
        let content = "";
        try {
            content = readFileSync(filePath).toString();
        } catch (error) {
            throw error;
        }
        this.xmlDoc = this.xmlParser.parseFromString(content);
        this.xmlInstruction = { version: "1.0", encoding: "UTF-8" };
        this.xmlStyleSheet = { type: "text/xsl", href: "mdd.xslt" };
    }

    private unknownTagName(tagName: string, parentName: string) {
        if (this.raiseErrorFunction) {
            this.raiseErrorFunction(`Unkown TagName '${tagName}' in '${parentName}'`);
        }
    }

    private getAttr(element: Element, attrName: string) {
        return element.getAttribute(attrName) ?? undefined;
    }

    private getAttrNotEmpty(elememt: Element, attrName: string) {
        return elememt.getAttribute(attrName) ?? "";
    }

    private iterateChildren(element: ChildNode, callback: (ele: Element) => void) {
        if (element.hasChildNodes()) {
            for (let i = 0; i < element.childNodes.length; ++i) {
                const child = element.childNodes[i];
                if (!(child instanceof Element)) {
                    continue;
                }
                callback(child);
            }
        }
    }

    // <property name="SerialFullName" value="Respondent.Serial" type="8" context="CARDCOL" ds="3099" />
    private readPropertyLike(ele: Element): Property {
        let styles: Styles | undefined;
        if (ele.hasChildNodes()) {
            this.iterateChildren(ele, child => {
                if (child.tagName === "styles") {
                    styles = this.readStyles(child);
                } else {
                    this.unknownTagName(child.tagName, ele.tagName);
                }
            });
        }
        return {
            name: this.getAttrNotEmpty(ele, "name"),
            value: this.getAttrNotEmpty(ele, "value"),
            type: this.getAttrNotEmpty(ele, "type"),
            context: this.getAttrNotEmpty(ele, "context"),
            ds: this.getAttr(ele, "ds"),
            styles
        };
    }

    // <styles>
    //     <property name="Control" type="9" context="Question">
    //         <styles>
    //             <property name="Type" value="2" type="3" context="Question" />
    //         </styles>
    //     </property>
    // </styles>
    private readStyles(styles: Element): Styles {
        return this.readDeleteCollection(styles, this.readPropertyLike, child => {
            if (child.tagName === "property") {
                return true;
            }
            this.unknownTagName(child.tagName, styles.tagName);
            return false;
        });
    }

    // <properties>
    //     <unversioned>
    //         <property />
    //     </unversioned>
    //     <property />
    // </properties>
    private readPropertiesLike(ele: Element): Properties {
        let unversioned: Property[] = [];
        let values: Property[] = [];
        for (let i = 0; i < ele.childNodes.length; ++i) {
            const child = ele.childNodes[i];
            if (!(child instanceof Element) || child instanceof Text) {
                continue;
            }
            if (child.tagName === "unversioned") {
                unversioned = this.readPropertiesLike(child).values;
            } else {
                values.push(this.readPropertyLike(child));
            }
        }
        return {
            unversioned: unversioned.length > 0 ? unversioned : undefined,
            values
        };
    }

    //  <connection name="mrSavDsc" dblocation="77406817.Sav" cdscname="mrSavDsc" project="" id="2">
    //      <var fullname="record" aliasname="record" />
    //          <var fullname="s0a" aliasname="S0a">
    //              <nativevalues>
    //                  <nativevalue fullname="安徽省" value="1" />
    //              </nativevalues>
    //          </var>
    //  </connection>
    private readConnection(ele: Element): Connection {
        let aliasVar: AliasVariable[] = [];
        this.iterateChildren(ele, child => {
            if (child.tagName === "var") {
                aliasVar.push(this.readAliasVar(child));
            } else {
                this.unknownTagName(child.tagName, ele.tagName);
            }
        });
        return {
            name: this.getAttrNotEmpty(ele, "name"),
            dbLocation: this.getAttrNotEmpty(ele, "dblocation"),
            cdscName: this.getAttrNotEmpty(ele, "cdscname"),
            project: this.getAttrNotEmpty(ele, "project"),
            id: this.getAttrNotEmpty(ele, "id"),
            aliasVariables: aliasVar.length > 0 ? aliasVar : undefined,
        };
    }

    // <nativevalue fullname="安徽省" value="1" />
    private readNativeValue(ele: ChildNode): { fullName: string, value: string } {
        if (Object.prototype.toString.call(ele) !== Object.prototype.toString.call(Element)) {
            return {
                fullName: "",
                value: ""
            };
        }
        return {
            fullName: this.getAttrNotEmpty(ele as Element, "fullname"),
            value: this.getAttrNotEmpty(ele as Element, "value")
        };
    }

    private readAliasVar(ele: Element): AliasVariable {
        let fullName = this.getAttrNotEmpty(ele, "fullname");
        let aliasName = this.getAttrNotEmpty(ele, "aliasname");
        let nativeValues: { fullName: string, value: string }[] = [];
        let subAlias: SubAlias[] = [];
        this.iterateChildren(ele, child => {
            if (child.tagName === "nativevalues") {
                child.childNodes.forEach(native => nativeValues.push(this.readNativeValue(native)));
            } else if (child.tagName === "subalias") {
                subAlias.push({
                    index: this.getAttrNotEmpty(child, "index"),
                    name: this.getAttrNotEmpty(child, "name")
                });
            } else {
                this.unknownTagName(child.tagName, ele.tagName);
            }
        });
        return {
            fullName,
            aliasName,
            nativeValues: nativeValues.length > 0 ? nativeValues : undefined,
            subAlias: subAlias.length > 0 ? subAlias : undefined
        };
    }

    // <datasources default="mrDatafileDsc">
    //     <connection name="mrRdbDsc2" dblocation="Provider=MSOLEDBSQL.1;Data Source=KOAW2-AW2W.GRPITSRV.COM;User ID=;Password=;Initial Catalog=RaGR21Mar;Integrated Security=SSPI;Persist Security Info=False" cdscname="mrRdbDsc2" project="RAGR21MAR" id="1" />
    //     <connection name="mrDatafileDsc" dblocation="RAGR21Mar.ddf" cdscname="mrDatafileDsc" project="" id="1047" />
    // </datasources>
    private readDataSources(ele: Element): DataSources {
        let connections: Connection[] = [];
        this.iterateChildren(ele, child => {
            if (ele.tagName === "connection") {
                connections.push(this.readConnection(child));
            } else {
                this.unknownTagName(ele.tagName, ele.tagName);
            }
        });
        return {
            default: this.getAttrNotEmpty(ele, "default"),
            connections
        };
    }

    // <text context="QUESTION" xml:lang="en-GB">Completion Indicator</text>
    private readText(textNode: Element): Label {
        return {
            context: this.getAttrNotEmpty(textNode, "context"),
            language: this.getAttrNotEmpty(textNode, "xml:lang"),
            text: textNode.firstChild?.nodeValue ?? ""
        };
    }

    //  <labels context="LABEL">
    //  	<text context="QUESTION" xml:lang="en-GB">Completion Indicator</text>
    //  	<text context="QUESTION" xml:lang="de-DE">Completion Indicator</text>
    //  </labels>
    private readLabels(labels: Element): Labels {
        let texts: Label[] = [];
        this.iterateChildren(labels, label => texts.push(this.readText(label)));
        return {
            context: this.getAttrNotEmpty(labels, "context"),
            texts
        };
    }

    // <notes>
    //     <property name="5@note1" value="=========================================" type="8" context="Question" />
    // </notes>
    private readNotes(notes: Element): Notes {
        return { values: this.readPropertiesLike(notes) };
    }

    private readDeleteCollection<T>(
        node: Element,
        callback: (child: Element) => T,
        test?: (child: Element, inDeleted?: boolean) => boolean): DeleteCollection<T> {

        let deleted: T[] = [];
        let values: T[] = [];
        this.iterateChildren(node, child => {
            if (child.tagName === "deleted" && child.hasChildNodes()) {
                this.iterateChildren(child, sub => {
                    if (!test || test(child, true)) {
                        deleted.push(callback(sub));
                    }
                });
            } else {
                if (!test || test(child)) {
                    values.push(callback(child));
                }
            }
        });
        return {
            deleted: deleted.length > 0 ? deleted : undefined,
            values
        };
    }

    // <othervariable id="_6beb0af1-ceaf-4808-9190-ad1f76e6744e" name="_0317" ref="6beb0af1-ceaf-4808-9190-ad1f76e6744e" />
    private readReference(ref: Element): Reference {
        return {
            id: this.getAttrNotEmpty(ref, "id"),
            name: this.getAttrNotEmpty(ref, "name"),
            ref: this.getAttrNotEmpty(ref, "ref")
        };
    }

    private readReferences(refs: Element): References {
        let collection = this.readDeleteCollection(refs, this.readReference.bind(this));
        return {
            name: this.getAttrNotEmpty(refs, "name"),
            globalNamespace: this.getAttrNotEmpty(refs, "global-name-space"),
            deleted: collection.deleted,
            values: collection.values
        };
    }

    private readCategory(category: Element): Category {
        let properties: Properties | undefined;
        let templates: Properties | undefined;
        let labels: Labels | undefined;
        let notes: Notes | undefined;
        let otherVariable: Reference | undefined;
        let labelStyles: LabelStyles | undefined;
        this.iterateChildren(category, child => {
            switch (child.tagName) {
                case "properties":    properties = this.readPropertiesLike(child);   break;
                case "templates":     templates = this.readPropertiesLike(child);    break;
                case "labels":        labels = this.readLabels(child);               break;
                case "notes":         notes = this.readNotes(child);                 break;
                case "othervariable": otherVariable = this.readReference(child);     break;
                case "labelstyles":   labelStyles = this.readPropertiesLike(child);  break;
                default:    this.unknownTagName(child.tagName, child.tagName);       break;
            }
        });
        return {
            id: this.getAttrNotEmpty(category, "id"),
            name: this.getAttrNotEmpty(category, "name"),
            fixed: this.getAttr(category, "fixed"),
            nofilter: this.getAttr(category, "nofilter"),
            missing: this.getAttr(category, "missing"),
            exclusive: this.getAttr(category, "exclusive"),
            otherLocal: this.getAttr(category, "other-local"),
            otherVariable,
            properties,
            templates,
            labelStyles,
            labels,
            notes
        };
    }

    private readHelperFields(helpFields: Element): HelperFields {
        let collection = this.readDeleteCollection(helpFields,
            this.readReference.bind(this),
            (child) => {
                if (child.tagName === "variable") {
                    return true;
                }
                this.unknownTagName(child.tagName, helpFields.tagName);
                return false;
            });
        return {
            id: this.getAttrNotEmpty(helpFields, "id"),
            name: this.getAttrNotEmpty(helpFields, "name"),
            globalNamespace: this.getAttr(helpFields, "global-name-space"),
            values: collection.values,
            deleted: collection.deleted
        };
    }

    private readElement(ele: Element): MDMElement {
        let labels: Labels | undefined;
        this.iterateChildren(ele, child => {
            switch (child.tagName) {
                case "labels":  labels = this.readLabels(child);          break;
                default: this.unknownTagName(child.tagName, ele.tagName); break;
            }
        });
        return {
            id: this.getAttrNotEmpty(ele, "id"),
            name: this.getAttrNotEmpty(ele, "name"),
            type: this.getAttrNotEmpty(ele, "type"),
            labels
        };
    }

    private readCategories(cats: Element): Categories {
        let properties: Properties | undefined;
        let categories: Categories | undefined;
        let templates: Properties | undefined;
        let labels: Labels | undefined;
        let elements: MDMElement[] | undefined;
        let collection = this.readDeleteCollection(cats,
            this.readCategory.bind(this),
            (child, inDeleted) => {
                if (child.tagName === "category") {
                    return true;
                } else if (!inDeleted) {
                    switch (child.tagName) {
                        case "properties":    properties = this.readPropertiesLike(child); break;
                        case "categories":    categories = this.readCategories(child);     break;
                        case "templates":     templates = this.readPropertiesLike(child);  break;
                        case "labels":        labels = this.readLabels(child);             break;
                        case "element":
                            elements ?
                            elements.push(this.readElement(child)) :
                            elements = [ this.readElement(child) ];
                            break;
                        default:      this.unknownTagName(child.tagName, cats.tagName);    break;
                    }
                } else {
                    this.unknownTagName(child.tagName, cats.tagName);
                }
                return false;
            }
        );
        return {
            name: this.getAttr(cats, "name"),
            id: this.getAttr(cats, "id"),
            globalNamespace: this.getAttr(cats, "global-name-space"),
            labels,
            values: collection.values,
            deleted: collection.deleted,
            elements,
            properties,
            categories,
            templates
        };
    }

    private readAxis(axis: Element): Axis {
        return { expression: this.getAttrNotEmpty(axis, "expression") };
    }

    private readDefinitionVariable(variable: Element): Variable {
        let notes: Notes | undefined;
        let labels: Labels | undefined;
        let categories: Categories | undefined;
        let helperFields: HelperFields | undefined;
        let axis: Axis | undefined;
        this.iterateChildren(variable, child => {
            switch (child.tagName) {
                case "notes":           notes = this.readNotes(child);                break;
                case "labels":          labels = this.readLabels(child);              break;
                case "categories":      categories = this.readCategories(child);      break;
                case "helperfields":    helperFields = this.readHelperFields(child);  break;
                case "axis":            axis = this.readAxis(child);                  break;
                default:
                    this.unknownTagName(child.tagName, variable.tagName);
                    break;
            }
        });
        return {
            name: this.getAttrNotEmpty(variable, "name"),
            id: this.getAttrNotEmpty(variable, "id"),
            type: this.getAttrNotEmpty(variable, "type"),
            expression: this.getAttr(variable, "expression"),
            sourceType: this.getAttr(variable, "sourcetype"),
            minValue: this.getAttr(variable, "min"),
            minType: this.getAttr(variable, "mintype"),
            maxValue: this.getAttr(variable, "max"),
            maxType: this.getAttr(variable, "maxtype"),
            effectiveMaxValue: this.getAttr(variable, "effectivemax"),
            effectiveMinValue: this.getAttr(variable, "effectivemin"),
            axis,
            labels,
            notes,
            categories,
            helperFields
        };
    }

    private readOtherVariable(other: Element): OtherVariable {
        let labels: Labels | undefined;
        this.iterateChildren(other, child => {
            switch (child.tagName) {
                case "labels":     labels = this.readLabels(child);   break;
                default:
                    this.unknownTagName(child.tagName, other.tagName);
                    break;
            }
        });
        return {
            id: this.getAttrNotEmpty(other, "id"),
            name: this.getAttrNotEmpty(other, "name"),
            type: this.getAttrNotEmpty(other, "type"),
            usageType: this.getAttr(other, "usagetype"),
            labels
        };
    }

    private readDefinitions(definition: Element) {
        let definitions: (FieldDefinitionBase | Categories)[] = [];
        this.iterateChildren(definition, def => {
            switch (def.tagName) {
                case "variable":
                    definitions.push(this.readDefinitionVariable(def));
                    break;
                case "othervariable":
                    definitions.push(this.readOtherVariable(def));
                    break;
                case "categories":
                    definitions.push(this.readCategories(def));
                    break;
                default:
                    this.unknownTagName(def.tagName, definition.tagName);
                    break;
            }
        });
        return definitions;
    }

    private readRoutingItem(ritem: Element): RoutingItem {
        return {
            name: this.getAttrNotEmpty(ritem, "name"),
            item: this.getAttrNotEmpty(ritem, "item")
        };
    }

    private readRouting(routing: Element): Routing {
        let ritem: RoutingItem[] = [];
        this.iterateChildren(routing, item => {
            switch (item.tagName) {
                case "ritem":    ritem.push(this.readRoutingItem(item)); break;
                default:
                    this.unknownTagName(item.tagName, routing.tagName);
            }
        });
        return {
            context: this.getAttrNotEmpty(routing, "context"),
            interviewModes: this.getAttrNotEmpty(routing, "interviewmodes"),
            useKeyCodes: this.getAttrNotEmpty(routing, "usekeycodes"),
            ritem: ritem.length > 0 ? ritem : undefined
        };
    }

    private readScript(script: Element): Script {
        return {
            name: this.getAttrNotEmpty(script, "name"),
            default: this.getAttrNotEmpty(script, "default"),
            text: script.firstChild?.nodeValue ?? ""
        };
    }

    private readScriptType(scriptType: Element): ScriptType {
        let collection = this.readDeleteCollection(scriptType, this.readScript);
        return {
            type: this.getAttrNotEmpty(scriptType, "type"),
            context: this.getAttrNotEmpty(scriptType, "context"),
            interviewModes: this.getAttrNotEmpty(scriptType, "interviewmodes"),
            useKeycodes: this.getAttrNotEmpty(scriptType, "usekeycodes"),
            deleted: collection.deleted,
            values: collection.values
        };
    }

    private readScripts(scripts: Element): Scripts {
        return this.readDeleteCollection(scripts, this.readScriptType);
    }

    private readRoutings(routings: Element): Routings {
        let scripts: Scripts | undefined;
        let ritems: Routing[] = [];
        this.iterateChildren(routings, child => {
            switch (child.tagName) {
                case "scripts": scripts = this.readScripts(child);    break;
                case "routing": ritems.push(this.readRouting(child)); break;
                default:
                    this.unknownTagName(child.tagName, routings.tagName);
                    break;
            }
        });
        return {
            name: this.getAttr(routings, "name"),
            scripts,
            ritems
        };
    }

    private readBlockSubFields(fields: Element): BlockSubFields {
        let collection = this.readDeleteCollection(fields, child => {
            if (child.tagName === "variable") {
                return this.readReference(child);
            } else if (child.tagName === "loop") {
                return this.readLoopFieldDesign(child);
            } else {
                return this.readBlockField(child);
            }
        });
        return {
            name: this.getAttrNotEmpty(fields, "name"),
            globalNamespace: this.getAttrNotEmpty(fields, "global-name-space"),
            deleted: collection.deleted,
            values: collection.values
        };
    }

    private readBlockField(block: Element): BlockField {
        let labels: Labels | undefined;
        let routings: Routings | undefined;
        let pages: References | undefined;
        let properties: Properties | undefined;
        let templates: Properties | undefined;
        let fields: BlockSubFields | undefined;
        this.iterateChildren(block, child => {
            switch (child.tagName) {
                case "labels":
                    labels = this.readLabels(child);
                    break;
                case "routings":
                    routings = this.readRoutings(child);
                    break;
                case "properties":
                    properties = this.readPropertiesLike(child);
                    break;
                case "templates":
                    templates = this.readPropertiesLike(child);
                    break;
                case "fields":
                    fields = this.readBlockSubFields(child);
                    break;
                case "pages":
                    pages = this.readReferences(child);
                    break;
                default:
                    this.unknownTagName(child.tagName, block.tagName);
                    break;
            }
        });
        return {
            id: this.getAttrNotEmpty(block, "id"),
            name: this.getAttrNotEmpty(block, "name"),
            globalNamespace: this.getAttrNotEmpty(block, "global-name-space"),
            labels,
            properties,
            templates,
            fields,
            pages,
            routings
        };
    }

    private readSystem(sys: Element): System {
        let collection = this.readDeleteCollection(sys, this.readBlockField);
        return {
            name: this.getAttrNotEmpty(sys, "name"),
            globalNamespace: this.getAttrNotEmpty(sys, "global-name-space"),
            deleted: collection.deleted,
            values: collection.values
        };
    }

    private readVarInstance(varInstance: Element): VarInstance {
        return {
            name: this.getAttrNotEmpty(varInstance, "name"),
            sourceType: this.getAttrNotEmpty(varInstance, "sourcetype"),
            variable: this.getAttrNotEmpty(varInstance, "variable"),
            fullName: this.getAttrNotEmpty(varInstance, "fullname")
        };
    }

    private readMappings(mappings: Element): VarInstance[] {
        let map: VarInstance[] = [];
        this.iterateChildren(mappings, child => map.push(this.readVarInstance(child)));
        return map;
    }

    private readSubClasses (sub: Element): LoopSubFields {
        let types: References | undefined;
        let fields: References | undefined;
        let pages: References | undefined;
        this.iterateChildren(sub, field => {
            switch (field.tagName) {
                case "types":     types = this.readReferences(field);   break;
                case "fields":    fields = this.readReferences(field);  break;
                case "pages":     pages = this.readReferences(field);   break;
                default:
                    this.unknownTagName(field.tagName, sub.tagName);
                    break;
            }
        });
        return { types, fields, pages };
    }

    private readLoopFieldDesign(loop: Element): LoopField {
        let properties: Properties | undefined;
        let labels: Labels | undefined;
        let templates: Properties | undefined;
        let categories: Categories | undefined;
        let classes: LoopSubFields | undefined;
        this.iterateChildren(loop, child => {
            switch (child.tagName) {
                case "properties":      properties = this.readPropertiesLike(child);  break;
                case "templates":       templates = this.readPropertiesLike(child);   break;
                case "labels":          labels = this.readLabels(child);              break;
                case "categories":      categories = this.readCategories(child);      break;
                case "class":           classes = this.readSubClasses(child);         break;
            }
        });
        return {
            id: this.getAttrNotEmpty(loop, "id"),
            name: this.getAttrNotEmpty(loop, "name"),
            type: this.getAttrNotEmpty(loop, "type"),
            isGrid: this.getAttr(loop, "isgrid"),
            iteratorType: this.getAttrNotEmpty(loop, "iteratortype"),
            properties,
            templates,
            labels,
            categories,
            classes
        };
    }

    private readDesign(design: Element): MDMXmlDesign {
        let fields: BlockSubFields | undefined;
        let properties: Properties | undefined;
        let types: References | undefined;
        let pages: References | undefined;
        let routings: Routings | undefined;
        this.iterateChildren(design, child => {
            switch (child.tagName) {
                case "fields":     fields = this.readBlockSubFields(child);     break;
                case "types":      types = this.readReferences(child);          break;
                case "pages":      pages = this.readReferences(child);          break;
                case "routings":   routings = this.readRoutings(child);         break;
                case "properties": properties = this.readPropertiesLike(child); break;
                default:
                    this.unknownTagName(child.tagName, design.tagName);
                    break;
            }
        });
        return { fields, properties, types, pages, routings };
    }

    private readLanguage(lang: Element): Language {
        let properties: Properties | undefined;
        this.iterateChildren(lang, child => {
            if (child.tagName === "properties") {
                properties = this.readPropertiesLike(child);
            } else {
                this.unknownTagName(child.tagName, lang.tagName);
            }
        });
        return {
            name: this.getAttrNotEmpty(lang, "name"),
            id: this.getAttrNotEmpty(lang, "id"),
            properties
        };
    }

    private readLanguages(langs: Element): Languages {
        let collection = this.readDeleteCollection(langs, this.readLanguage.bind(this));
        return {
            base: this.getAttrNotEmpty(langs, "base"),
            values: collection.values,
            deleted: collection.deleted
        };
    }

    private readAlternative(alt: Element): Alternative {
        return { name: this.getAttrNotEmpty(alt, "name") };
    }

    private readContext(context: Element): Context {
        let alts: DeleteCollection<Alternative> | undefined;
        this.iterateChildren(context, child => {
            if (child.tagName === "alternatives") {
                alts = this.readDeleteCollection(child, this.readAlternative.bind(this));
            } else {
                this.unknownTagName(child.tagName, context.tagName);
            }
        });
        return {
            name: this.getAttrNotEmpty(context, "name"),
            alternatives: alts
        };
    }

    private readContexts(contexts: Element): Contexts {
        let collection = this.readDeleteCollection(contexts, this.readContext.bind(this));
        return {
            base: this.getAttrNotEmpty(contexts, "base"),
            values: collection.values,
            deleted: collection.deleted
        };
    }

    private readUserSaveLog(user: Element): UserSaveLog {
        return {
            name: this.getAttrNotEmpty(user, "name"),
            fileVersion: this.getAttrNotEmpty(user, "fileversion"),
            comment: this.getAttrNotEmpty(user, "comment")
        };
    }

    private readSaveLog(saveLog: Element): SaveLog {
        let users: UserSaveLog[] = [];
        this.iterateChildren(saveLog, user => {
            if (user.tagName === "user") {
                users.push(this.readUserSaveLog(user));
            } else {
                this.unknownTagName(user.tagName, saveLog.tagName);
            }
        });
        return {
            fileVersion: this.getAttrNotEmpty(saveLog, "fileversion"),
            userName: this.getAttrNotEmpty(saveLog, "username"),
            versionSet: this.getAttrNotEmpty(saveLog, "versionset"),
            date: this.getAttrNotEmpty(saveLog, "date"),
            count: this.getAttrNotEmpty(saveLog, "count"),
            users
        };
    }

    private readUserSaveLogs(saveLogs: Element): SaveLog[] {
        let logs: SaveLog[] = [];
        this.iterateChildren(saveLogs, log => {
            if (log.tagName === "savelog") {
                logs.push(this.readSaveLog(log));
            } else {
                this.unknownTagName(log.tagName, saveLogs.tagName);
            }
        });
        return logs;
    }

    private readAtoms(atoms: Element): { name: string }[] {
        let items: { name: string }[] = [];
        this.iterateChildren(atoms, atom => {
            if (atom.tagName === "atom") {
                items.push({ name: this.getAttrNotEmpty(atom, "name") });
            } else {
                this.unknownTagName(atom.tagName, atoms.tagName);
            }
        });
        return items;
    }

    private readCategoryMap(categoryMap: Element): { name: string, value: string }[] {
        let map: { name: string, value: string }[] = [];
        this.iterateChildren(categoryMap, cat => {
            if (cat.tagName === "categoryid") {
                map.push({ name: this.getAttrNotEmpty(cat, "name"), value: this.getAttrNotEmpty(cat, "id") });
            } else {
                this.unknownTagName(cat.tagName, categoryMap.tagName);
            }
        });
        return map;
    }

    private readMDMMetadata(metadata: Element): Metadata {
        let dataSources: DataSources = EMPTY_DATASOURCES,
            properties: Properties = EMPTY_PROPERTIES,
            templates: Properties = EMPTY_PROPERTIES,
            labels: Labels = EMPTY_LABELS,
            definition: (FieldDefinitionBase | Categories)[] = [],
            system: System = EMPTY_SYSTEM,
            systemRouting: Routings = EMPTY_ROUTINGS,
            mappings: VarInstance[] = [],
            design: MDMXmlDesign = {},
            languages: Languages = EMPTY_LANGUAGES,
            contexts: Contexts = EMPTY_CONTEXTS,
            labelTypes: Contexts = EMPTY_CONTEXTS,
            routingContexts: Contexts = EMPTY_CONTEXTS,
            scriptTypes: Contexts = EMPTY_CONTEXTS,
            saveLogs: SaveLog[] = [],
            atoms: { name: string }[] = [],
            categoryMap: { name: string, value: string }[] = [];

        this.iterateChildren(metadata, child => {
            switch (child.tagName) {
                case "datasources":     dataSources = this.readDataSources(child);   break;
                case "properties":      properties = this.readPropertiesLike(child); break;
                case "templates":       templates = this.readPropertiesLike(child);  break;
                case "labels":          labels = this.readLabels(child);             break;
                case "definition":      definition = this.readDefinitions(child);    break;
                case "system":          system = this.readSystem(child);             break;
                case "systemrouting":   systemRouting = this.readRoutings(child);    break;
                case "mappings":        mappings = this.readMappings(child);         break;
                case "design":          design = this.readDesign(child);             break;
                case "languages":       languages = this.readLanguages(child);       break;
                case "contexts":        contexts = this.readContexts(child);         break;
                case "labeltypes":      labelTypes = this.readContexts(child);       break;
                case "routingcontexts": routingContexts = this.readContexts(child);  break;
                case "scripttypes":     scriptTypes = this.readContexts(child);      break;
                case "savelogs":        saveLogs = this.readUserSaveLogs(child);     break;
                case "atoms":           atoms = this.readAtoms(child);               break;
                case "categorymap":     categoryMap = this.readCategoryMap(child);   break;
                case "versionlist":     break;
                default:
                    this.unknownTagName(child.tagName, metadata.tagName);
                    break;
            }
        });

        return {
            mdmCreateVersion: this.getAttrNotEmpty(metadata, "mdm_createversion"),
            mdmLastVersion: this.getAttrNotEmpty(metadata, "mdm_lastversion"),
            id: this.getAttrNotEmpty(metadata, "id"),
            dataVersion: this.getAttrNotEmpty(metadata, "data_version"),
            dataSubVersion: this.getAttrNotEmpty(metadata, "data_sub_version"),
            systemVariable: this.getAttrNotEmpty(metadata, "systemvariable"),
            dbFilterValidataion: this.getAttrNotEmpty(metadata, "dbfiltervalidation"),
            xmlns: this.getAttrNotEmpty(metadata, "xmlns:mdm"),
            dataSources,
            properties,
            templates,
            labels,
            definition,
            system,
            systemRouting,
            mappings,
            design,
            languages,
            contexts,
            labelTypes,
            routingContexts,
            scriptTypes,
            saveLogs,
            atoms,
            categoryMap,
            versionList: undefined
        };
    }

    load() {
        for (let i = 0; i < this.xmlDoc.childNodes.length; ++i) {
            const cur = this.xmlDoc.childNodes[i] as Element;
            if (cur instanceof ProcessingInstruction) {
                if (cur.tagName === "xml") {
                    this.xmlInstruction = {
                        version: this.getAttrNotEmpty(cur, "version"),
                        encoding: this.getAttrNotEmpty(cur, "encoding")
                    };
                } else if (cur.tagName === "xml-stylesheet") {
                    this.xmlStyleSheet = {
                        type: this.getAttrNotEmpty(cur, "type"),
                        href: this.getAttrNotEmpty(cur, "href")
                    };
                }
            } else {
                if (cur.tagName === "xml") {
                    this.metadata = this.readMDMMetadata(cur);
                } else {
                    this.unknownTagName(cur.tagName, "xml");
                }
            }
        }
    }

}




