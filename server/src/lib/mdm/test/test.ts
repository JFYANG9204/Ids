import { readFileSync } from "fs";
import { resolve } from "path";
import { DOMParser } from "xmldom";
import { MDMDocument } from "..";


const xmlPath = resolve("./server/src/lib/mdm/test/fixture/ger_21marw2.mdd");
// const xmlContent = readFileSync(xmlPath).toString();
// const xmlParser = new DOMParser();
// const doc = xmlParser.parseFromString(xmlContent);
// const fstChld = doc.firstChild!;

let doc = new MDMDocument(xmlPath);
doc.load();

console.log("end");

