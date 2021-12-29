
namespace ds {

    /**
     * 创建符号表，符号表为`Map<string, Symbol>`，由于脚本语言大小写不敏感，`key`为符号名小写，
     * `value`为对应符号。
     *
     * @param symbols 可选，添加到符号表中的初始符号
     * @returns
     */
    export function createSymbolTable(symbols?: readonly Symbol[]): SymbolTable {
        let table = new Map<string, Symbol>();
        if (symbols) {
            symbols.forEach(symbol => table.set(symbol.name.toLowerCase(), symbol));
        }
        return table;
    }

    /**
     * 二分法查找文本指针位置对应的行号
     *
     * @param lineStarts 行起始位置数组
     * @param pos 查找位置
     * @returns
     */
    export function binarySearchLine(lineStarts: number[], pos: number): { line: number, lineStart: number } {
        if (pos < lineStarts[0]) {
            return { line: -1, lineStart: -1 };
        }
        let low = 0;
        let high = lineStarts.length - 1;
        let mid: number;
        while (low <= high) {
            mid = Math.round((low + high) / 2);
            if (lineStarts[mid] <= pos && pos < lineStarts[mid + 1]) {
                return { line: mid, lineStart: lineStarts[mid] };
            }
            if (lineStarts[mid] < pos) {
                low = mid;
            } else {
                high = mid;
            }
        }
        return { line: -1, lineStart: -1 };
    }



}

