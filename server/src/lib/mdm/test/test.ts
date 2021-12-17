import { readFileSync } from "fs";
import { resolve } from "path";
import { DOMParser } from "xmldom";


const xmlPath = resolve("./server/src/lib/mdm/test/fixture/ger_21marw2.mdd");
const xmlContent = readFileSync(xmlPath).toString();
const xmlParser = new DOMParser();
const doc = xmlParser.parseFromString(xmlContent);
const fstChld = doc.firstChild;
console.log("end");

