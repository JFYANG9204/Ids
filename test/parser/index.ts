import { readFileSync } from "fs";
import { join, resolve } from "path";
import { FileHandler } from "../../server/src/fileHandler";
import { getFileReferenceMark } from "../../server/src/fileHandler/load";
import { Parser } from "../../server/src/lib";
import { createBasicOptions, SourceType } from "../../server/src/lib/options";

const path = resolve("./test/parser/fixture/dpgm/tab.mrs");
const content = readFileSync(path).toString();
const mark = getFileReferenceMark(content);

console.log("end");

