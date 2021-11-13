import { readFileSync } from "fs";
import {
    resolve,
} from "path";
import {
    ParserFileDigraph
} from "../../server/src/lib/file";
import { getCurrentParser, getFileTypeMark, positionAt, positionInWith, readFileAndConvertToUtf8 } from "../../server/src/lib/file/util";
import { createBasicOptions } from "../../server/src/lib/options";
import { Parser } from "../../server/src/lib/parser";
import { builtInModule, loadBuiltInModule } from "../../server/src/util";

const folderPath = resolve("./test/parser/fixture/dpgm");
const startPath = resolve("./test/parser/fixture/dpgm/Run.mrs");
const graph = new ParserFileDigraph(folderPath, builtInModule);
graph.init();
graph.setStart(startPath);
const file = graph.startParse();
let mdd;
if (file) {
    mdd = getCurrentParser(file, startPath);
}
// const builtIn = loadBuiltInModule();
// const testpath = resolve("./test/parser/fixture/test.mrs");
// const content = readFileAndConvertToUtf8(testpath);
// const parser = new Parser(createBasicOptions(testpath, true), content);
// const file = parser.parse(builtIn);
console.log("end");