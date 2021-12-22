import { resolve } from "path";
import { readFileSync } from "fs";
import { Builder, parseString } from "xml2js";
import { Parser } from "../..";
import { createBasicOptions } from "../../options";
import { builtInModule } from "../../../declaration";

const xmlPath = resolve("./server/src/lib/mdm/test/fixture/assign_test.dms");
const options = createBasicOptions(xmlPath, true);
options.treatUnkownAsQuesion = true;
const parser = new Parser(options, readFileSync(xmlPath).toString());
parser.parse(builtInModule.scope);
console.log("end");

