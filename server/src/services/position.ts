import {
    CallExpression,
    EventSection,
    FunctionDeclaration,
    Identifier,
    MemberExpression,
    NodeBase,
    PreIncludeStatement,
    WithStatement
} from "../lib/types";



/**
 * 计算指定位置距离对应Node的距离，在Node后为负数，在Node前为正数，在Node内为0
 * @param node
 * @param pos
 * @returns
 */
 export function distanceTo<T extends NodeBase>(node: T, pos: number) {
    if (pos >= node.start && pos <= node.end) {
        return 0;
    } else if (pos > node.end) {
        return node.end - pos;
    } else {
        return node.start - pos;
    }
}

/**
 * 从最外围节点向对应位置遍历，并执行回调函数
 * @param node 节点
 * @param pos 搜索位置
 * @param callback 节点操作
 */
export function positionIn<T extends NodeBase>(
    node: T,
    pos: number,
    callback: (node: NodeBase) => void) {
    if (distanceTo(node, pos) === 0) {
        callback(node);
        let hasFind = false;
        for (const sub of node.positionMap) {
            if (distanceTo(sub, pos) === 0) {
                callback(sub);
                positionIn(sub, pos, callback);
                hasFind = true;
            } else {
                if (hasFind) {
                    break;
                }
            }
        }
    }
}


/**
 * 查找某一位置前的子节点，直到`CallExpression`、`MemberExpression`或`Identifier`
 * @param node 最外围节点
 * @param pos 目标位置
 * @param untilId 是否一直查找到`Identifier`
 * @param maxDistance 允许的最大距离
 * @returns
 */
export function positionAtForCompletion<T extends NodeBase>(
    node: T, pos: number, untilId?: boolean, maxDistance?: number): NodeBase {
    if ((node.type === "CallExpression"   ||
        node.type === "MemberExpression" ||
        node.type === "Identifier") && !untilId) {
        return node;
    }
    if (untilId && node.type === "Identifier") {
        return node;
    }
    if (node.positionMap.length > 0 &&
        distanceTo(node, pos) === 0) {
        let cur;
        let nearest = Infinity;
        for (const sub of node.positionMap) {
            let dist = distanceTo(sub, pos);
            if (maxDistance !== undefined &&
                maxDistance >= 0) {
                if (dist <= 0 && Math.abs(dist) <= maxDistance) {
                    cur = sub;
                    break;
                } else {
                    continue;
                }
            } else {
                if (dist <= 0 && Math.abs(dist) < nearest) {
                    nearest = dist;
                    cur = sub;
                } else {
                    continue;
                }
            }
        }
        if (cur) {
            return positionAtForCompletion(cur, pos, untilId, maxDistance);
        }
    }
    return node;
}


export interface NodePostionInfo {
    eventNode?: EventSection;
    funcNode?: FunctionDeclaration;
    withNode?: WithStatement;
    eventName?: string;
    caller?: CallExpression | MemberExpression;
    id?: Identifier;
    preInclude?: PreIncludeStatement;
    rejectCompletion?: true;
}

export function positionAtInfo<T extends NodeBase>(node: T,
    pos: number): NodePostionInfo {
    let info: NodePostionInfo = {};
    positionIn(node, pos, node => {
        switch (node.type) {
            case "Identifier":            info.id = node as Identifier;                  break;
            case "WithStatement":         info.withNode = node as WithStatement;         break;
            case "CallExpression":        info.caller = node as CallExpression;          break;
            case "MemberExpression":      info.caller = node as MemberExpression;        break;
            case "FunctionDeclaration":   info.funcNode = node as FunctionDeclaration;   break;
            case "PreIncludeStatement":   info.preInclude = node as PreIncludeStatement; break;
            case "StringLiteral":
            case "NullLiteral":
            case "BooleanLiteral":
            case "NumericLiteral":
            case "DecimalLiteral":
            case "CategoricalLiteral":
                info.rejectCompletion = true;
                break;
            default: break;
        }
        if (node instanceof EventSection) {
            info.eventNode = node;
            info.eventName = node.name.name;
        }
    });
    return info;
}
