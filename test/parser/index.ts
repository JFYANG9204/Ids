import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { getFileReferenceMark } from "../../server/src/fileHandler/load";

const path = resolve("d:\\Project\\77404181---8次方\\DPGM\\data\\Beast\\Output\\tab.mrs");
const content = readFileSync(path).toString();
const mark = getFileReferenceMark(content);
console.log("end");

