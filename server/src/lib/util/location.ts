import { lineBreakG } from "./whitespace";



export class Position {

    line: number;
    column: number;

    constructor(line: number, column: number) {
        this.line = line;
        this.column = column;
    }

}

export class SourceLocation {

    start: Position;
    end: Position;

    fileName: string = "";
    identifierName?: string;

    constructor(start: Position, end?: Position) {
        this.start = start;
        if (end) {
            this.end = end;
        } else {
            this.end = start;
        }
    }
}


export function getLineInfo(input: string, offset: number): Position {
    let line = 1;
    let lineStart = 0;
    let match;
    lineBreakG.lastIndex = 0;
    while ((match = lineBreakG.exec(input)) && match.index < offset) {
        line ++;
        lineStart = lineBreakG.lastIndex;
    }
    return new Position(line, offset - lineStart + 1);
}



