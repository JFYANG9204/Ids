import { readFileSync } from "fs";
import { join, resolve } from "path";
import { FileHandler } from "../../server/src/fileHandler";
import { Parser } from "../../server/src/lib";
import { createBasicOptions, SourceType } from "../../server/src/lib/options";

const path = resolve("./test/parser/fixture/dpgm/data/sbMetadata_dms.mrs");
const parser = new Parser(createBasicOptions(path, false), readFileSync(path).toString());
parser.options.sourceType = SourceType.metadata;
let file = parser.parse();

console.log("end");

