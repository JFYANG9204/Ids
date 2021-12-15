import { readFileSync } from "fs";
import { resolve } from "path";
import { builtInModule } from "../../server/src/declaration";
import { Parser } from "../../server/src/lib";
import { createBasicOptions } from "../../server/src/lib/options";

const path = resolve("./test/parser/fixture/dpgm/data/sav/CreateSAV.dms");
let parser = new Parser(createBasicOptions(path, true, undefined, builtInModule.scope), readFileSync(path).toString());
let file = parser.parse();

console.log("end");

