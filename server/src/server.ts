import { createConnection, InitializeResult } from "vscode-languageserver/node";
import { IdsLanguageService } from "./services/idsLanguageService";


const connection = process.argv.length <= 2 ? createConnection(process.stdin, process.stdout) : createConnection();

const idsService = new IdsLanguageService(connection);
connection.onInitialize(
    async (params): Promise<InitializeResult> => {
        await idsService.init(params);
        connection.console.log("Ids language service initialized");
        return { capabilities: idsService.capabilities };
    }
);

idsService.listen();

