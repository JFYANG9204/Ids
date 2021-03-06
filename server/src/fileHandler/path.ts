import { platform } from "os";
import { isAbsolute, resolve } from "path";
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

export function isFileUri(pathLike: string) {
    return pathLike.startsWith("file");
}

export function normalizeFileNameToFsPath(fileName: string) {
    return URI.file(fileName).fsPath;
}

export function normalizeFileNameResolve(...paths: string[]) {
    return normalizeFileNameToFsPath(resolve(...paths));
}

export function normalizeAbsolutePath(fsPath: string, root: string) {
    return isAbsolute(fsPath) ? normalizeFileNameToFsPath(fsPath) : normalizeFileNameResolve(root, fsPath);
}

export function getPathDepth(filePath: string, separater: string) {
    return filePath.split(separater).length;
}

