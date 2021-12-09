import { resolve } from "path";
import { FileHandler } from "../../server/src/fileHandler";

const path = resolve("./test/parser/fixture/dpgm");
const handler = new FileHandler(path);
handler.init();
console.log("end");

