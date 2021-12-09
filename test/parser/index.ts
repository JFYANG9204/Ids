import { resolve } from "path";
import { FileHandler } from "../../server/src/fileHandler";


const path = resolve("./fixture/dpgm");
const handler = new FileHandler(path);
handler.init().then(
    () => console.log("end")
);



