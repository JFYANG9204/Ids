import { join, resolve } from "path";
import { FileHandler } from "../../server/src/fileHandler";

const path = resolve("./test/parser/fixture/dpgm");
const handler = new FileHandler(path);
handler.init().then(() => {
    const runPath = join(handler.folderPath, "Run.mrs");
    handler.setStart(runPath);
    handler.parse();
    let file = handler.getCurrent(runPath);
});
console.log("end");

