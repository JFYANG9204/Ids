import { resolve } from "path";
import { readFileSync } from "fs";
import { Builder, parseString } from "xml2js";

const xmlPath = resolve("./server/src/lib/mdm/test/fixture/77403614_R1.xml");

let xmlJs: any | undefined;
let text: string | undefined;
parseString(readFileSync(xmlPath).toString(), (err, result) => {
    if (err) {
        throw err;
    }
    xmlJs = result;
    const builder = new Builder();
    text = builder.buildObject(result);
});

console.log("end");

