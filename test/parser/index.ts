import {
    resolve,
} from "path";
import {
    ParserFileDigraph
} from "../../server/src/lib/file";
import { getCurrentParser } from "../../server/src/lib/file/util";

const folderPath = resolve("./test/fixture/dpgm");
const startPath = resolve("./test/fixture/dpgm/MDD_Manipulation.mrs");

const graph = new ParserFileDigraph(folderPath);
graph.init();
graph.setStart(startPath);
const file = graph.startParse();
let mdd;
if (file) {
    mdd = getCurrentParser(file, startPath);
}
console.log("end");