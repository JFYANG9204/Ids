import {
    readFileSync
} from "fs";
import {
    AliasVariable,
    Categories,
    Category,
    Connection,
    DataSources,
    DeleteCollection,
    HelperFields,
    Label,
    Labels,
    LabelStyles,
    Notes,
    Properties,
    Property,
    Reference,
    Styles,
    SubAlias,
    Variable
} from "./types";
import { DOMParser } from "xmldom";

export class MDMDocument {

    private xmlParser: DOMParser;
    private xmlDoc: Document;
    private xmlInstruction: { version: string, encoding: string };
    private xmlStyleSheet: { type: string, href: string };

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
        if (!(ele instanceof Element)) {
            return {
                fullName: "",
                value: ""
            };
        }
        return {
            fullName: this.getAttrNotEmpty(ele, "fullname"),
            value: this.getAttrNotEmpty(ele, "value")
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
    private readLables(labels: Element): Labels {
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
                case "labels":        labels = this.readLables(child);               break;
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

    private readCategories(cats: Element): Categories {
        let properties: Properties | undefined;
        let categories: Categories | undefined;
        let templates: Properties | undefined;
        let labels: Labels | undefined;
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
                        case "labels":        labels = this.readLables(child);             break;
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
            properties,
            categories,
            templates
        };
    }

    private readDefinitionVariable(variable: Element): Variable {
        let notes: Notes | undefined;
        let labels: Labels | undefined;
        let categories: Categories | undefined;
        let helperFields: HelperFields | undefined;
        this.iterateChildren(variable, child => {
            switch (child.tagName) {
                case "notes":           notes = this.readNotes(child);                break;
                case "labels":          labels = this.readLables(child);              break;
                case "categories":      categories = this.readCategories(child);      break;
                case "helperfields":    helperFields = this.readHelperFields(child);  break;
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
            notes,
            categories,
            helperFields
        };
    }

}




