import { resolve } from "path";
import { FileHandler } from "../../server/src/fileHandler";
import { readAllUsefulFileInFolderSync } from "../../server/src/fileHandler/load";

const path = resolve("./test/parser/fixture/dpgm");
const paths = readAllUsefulFileInFolderSync(path);
console.log("end");

