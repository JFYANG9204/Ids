import { Connection, TextDocuments } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";


export class DocumentService {

    private documents: TextDocuments<TextDocument>;

    constructor(connection: Connection) {
        this.documents = new TextDocuments(TextDocument);
        this.documents.listen(connection);
    }

    getDocument(uri: string) {
        return this.documents.get(uri);
    }

    getAllDocuments() {
        return this.documents.all();
    }

    get onDidChangeContent() {
        return this.documents.onDidChangeContent;
    }

    get onDidClose() {
        return this.documents.onDidClose;
    }

    get onDidOpen() {
        return this.documents.onDidOpen;
    }

}

