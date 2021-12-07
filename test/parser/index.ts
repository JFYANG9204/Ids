import { resolve } from "path";
import { isUri } from "../../server/src/fileHandler/path";


const path = resolve("./fixture/DPGM");
console.log(isUri(path));

console.log("end");