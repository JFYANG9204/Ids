import { resolve } from "path";
import { readFileSync } from "fs";
import { Builder, parseString } from "xml2js";
import { Parser } from "../..";
import { createBasicOptions } from "../../options";
import { builtInModule } from "../../../declaration";
import { DOMParser, XMLSerializer } from "xmldom";
import { MdmDocument } from "../mdmDocument";

const xmlPath = resolve("./server/src/lib/mdm/test/fixture/77403614_R1.MDD");
// let fileStr = readFileSync(xmlPath).toString();
// let parser = new DOMParser();
// let result = parser.parseFromString(fileStr);
// for (let i = 0; i < result.childNodes.length; ++i) {
//     const element = result.childNodes[i];
//     console.log(element.nodeType);
//     if (element.firstChild) {
//         let child = element.firstChild;
//         console.log(child["getAttribute"]("mdm_createversion"));
//     }
// }
let mdm = new MdmDocument(xmlPath);

console.log("end");

