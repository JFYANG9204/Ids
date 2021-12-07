import {
    resolve,
} from "path";
import { FileHandler } from "../../server/src/fileHandler";

const folderPath = resolve("./test/parser/fixture/DPGM");
const handler = new FileHandler(folderPath);
handler.init();

console.log("end");