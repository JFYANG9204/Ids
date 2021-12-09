import { createConnection } from "vscode-languageserver/node";
import { IdsLanguageService } from "./services/idsLanguageService";


const connection = process.argv.length <= 2 ? createConnection(process.stdin, process.stdout) : createConnection();

const idsService = new IdsLanguageService(connection);
connection.onInitialize(
    async (params) => {
        await idsService.init(params);
        return { capabilities: idsService.capabilities };
    }
);

idsService.listen();

