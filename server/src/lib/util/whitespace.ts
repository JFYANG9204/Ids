import * as charCodes from "./charcodes";

// Matches a whole line break. Used to count lines.
export const lineBreak = /\r\n?|[\n\u2028\u2029]/;
export const lineBreakG = new RegExp(lineBreak.source, "g");

export function isNewLine(code: number): boolean {
    switch (code) {
        case charCodes.lineFeed:
        case charCodes.carriageReturn:
        case charCodes.lineSeparator:
        case charCodes.paragraphSeparator:
            return true;

        default:
            return false;
    }
}

export const skipWhiteSpace = /(?:\s|'![\s\S]*!'|'.*)*/g;

export function isWhitespace(code: number): boolean {
    switch (code) {
        case 0x0009: // CHARACTER TABULATION
        case 0x000b: // LINE TABULATION
        case 0x000c: // FORM FEED
        case charCodes.space:
        case charCodes.nonBreakingSpace:
        case charCodes.oghamSpaceMark:
        case 0x2000: // EN QUAD
        case 0x2001: // EM QUAD
        case 0x2002: // EN SPACE
        case 0x2003: // EM SPACE
        case 0x2004: // THREE-PER-EM SPACE
        case 0x2005: // FOUR-PER-EM SPACE
        case 0x2006: // SIX-PER-EM SPACE
        case 0x2007: // FIGURE SPACE
        case 0x2008: // PUNCTUATION SPACE
        case 0x2009: // THIN SPACE
        case 0x200a: // HAIR SPACE
        case 0x202f: // NARROW NO-BREAK SPACE
        case 0x205f: // MEDIUM MATHEMATICAL SPACE
        case 0x3000: // IDEOGRAPHIC SPACE
        case 0xfeff: // ZERO WIDTH NO-BREAK SPACE
          return true;

        default:
          return false;
    }
}

