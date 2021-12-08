import { platform } from "os";
import { URI } from "vscode-uri";



export function getFilePath(documentUri: string) {
    if (platform() === "win32") {
        return URI.parse(documentUri).path.replace(/^\/[a-zA-Z]/, (s: string) => s.slice(1).toLowerCase());
    } else {
        return URI.parse(documentUri).path;
    }
}

export function getFileFsPath(documentUri: string): string {
    return URI.parse(documentUri).fsPath;
}

export function getFsPathToUri(fsPath: string) {
    return URI.file(fsPath).toString();
}

export function isUri(pathLike: string) {
    return URI.isUri(pathLike);
}
