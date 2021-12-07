import { Connection } from "vscode-languageserver";
import { DocumentService } from "./documentService";
import { ErrorService } from "./errorService";
import { ProjectService } from "./projectSevice";


export class IdsService {

    private connection: Connection;
    private documentService: DocumentService;
    private errorService: ErrorService;
    private project: Map<string, ProjectService> = new Map();

    constructor(connection: Connection) {
        this.connection = connection;
        this.documentService = new DocumentService(connection);
        this.errorService = new ErrorService(connection);
    }

}


