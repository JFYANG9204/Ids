import { dirname, resolve } from "path";

function getRootPath(uri: string) {
    let fsPath = uri;
    while (!(fsPath = dirname(fsPath)).toLowerCase().endsWith("dpgm")) {
        if (fsPath.endsWith("\\")) {
            return undefined;
        }
    }
    return fsPath;
}


const path = resolve("./fixture/data/sbOnNextCase.mrs");
console.log(getRootPath(path));

console.log("end");