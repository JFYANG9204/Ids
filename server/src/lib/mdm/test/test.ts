import { readFileSync } from "fs";
import { resolve } from "path";
import { Parser } from "../..";
import { builtInModule } from "../../../declaration";
import { createBasicOptions } from "../../options";

const xmlPath = resolve("./server/src/lib/mdm/test/fixture/assign_test.dms");
// const xmlContent = readFileSync(xmlPath).toString();
// const xmlParser = new DOMParser();
// const doc = xmlParser.parseFromString(xmlContent);
// const fstChld = doc.firstChild!;
let options = createBasicOptions(xmlPath, true);
options.treatUnkownAsQuesion = true;
let parser = new Parser(options, readFileSync(xmlPath).toString());
parser.parse(builtInModule.scope);

console.log("end");

