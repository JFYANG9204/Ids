import { resolve } from "path";
import { readFileSync } from "fs";
import { Builder, parseString } from "xml2js";
import { Parser } from "../..";
import { createBasicOptions } from "../../options";
import { builtInModule } from "../../../declaration";
import { DOMParser, XMLSerializer } from "xmldom";

// const xmlPath = resolve("./server/src/lib/mdm/test/fixture/77403614_R1.MDD");
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

let a = { a: "a", b: "b" };
let b = { c: "d", e: "e", a: "b" };
let c = Object.assign(a, b);

console.log("end");

