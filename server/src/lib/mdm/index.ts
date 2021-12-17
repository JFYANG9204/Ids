import {
    readFileSync
} from "fs";
import {
    AliasVariable,
    Properties,
    Property,
    SubAlias
} from "./types";

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
        this.xmlDoc = this.xmlParser.parseFromString(content, "text/xml");
        this.xmlInstruction = { version: "1.0", encoding: "UTF-8" };
        this.xmlStyleSheet = { type: "text/xsl", href: "mdd.xslt" };
    }

    raiseError(text: string) {
        if (this.raiseErrorFunction) {
            this.raiseErrorFunction(text);
        }
    }

    // <property name="SerialFullName" value="Respondent.Serial" type="8" context="CARDCOL" ds="3099" />
    private readPropertyLike(ele: Element): Property {
        return {
            name: ele.getAttribute("name") ?? "",
            value: ele.getAttribute("value") ?? "",
            type: ele.getAttribute("type") ?? "",
            context: ele.getAttribute("context") ?? "",
            ds: ele.getAttribute("ds") ?? undefined
        };
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
            if (!(child instanceof Element)) {
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
    private readConnection(ele: Element) {
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
            fullName: ele.getAttribute("fullname") ?? "",
            value: ele.getAttribute("value") ?? ""
        };
    }

    private readAliasVar(ele: Element): AliasVariable {
        let fullName = ele.getAttribute("fullname") ?? "";
        let aliasName = ele.getAttribute("aliasname") ?? "";
        let nativeValues: { fullName: string, value: string }[] = [];
        let subAlias: SubAlias[] = [];
        if (ele.hasChildNodes()) {
            for (let i = 0; i < ele.childNodes.length; ++i) {
                const child = ele.childNodes[i];
                if (!(child instanceof Element)) {
                    continue;
                }
                if (child.tagName === "nativevalues") {
                    child.childNodes.forEach(native => nativeValues.push(this.readNativeValue(native)));
                } else if (child.tagName === "subalias") {
                    subAlias.push({
                        index: child.getAttribute("index") ?? "",
                        name: child.getAttribute("name") ?? ""
                    });
                }
            }
        }
        return {
            fullName,
            aliasName,
            nativeValues: nativeValues.length > 0 ? nativeValues : undefined,
            subAlias: subAlias.length > 0 ? subAlias : undefined
        };
    }

}




