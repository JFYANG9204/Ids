import { ParserBase } from "../base";
import { NodeBase } from "../types";
import { Position } from "../util/location";
import { TypeUtil } from "./typeUtil";

export class NodeUtils extends TypeUtil {

    startNode<T extends NodeBase>(n: new (parser: ParserBase, pos: number, start: Position) => T): T {
        return new n(this, this.state.start, this.state.startLoc);
    }

    startNodeAt<T extends NodeBase>(pos: number, loc: Position, n: new (parser: ParserBase, pos: number, start: Position) => T): T {
        return new n(this, pos, loc);
    }

    startNodeAtNode<T extends NodeBase>(node: NodeBase, n: new (parser: ParserBase, pos: number, loc: Position) => T): T {
        return this.startNodeAt<T>(node.start, node.loc.start, n);
    }

    finishNodeAt<T extends NodeBase>(node: T, type: string, pos: number, loc: Position) {
        node.type = type;
        node.end = pos;
        node.loc.end = loc;
        this.processComment(node);
        return node;
    }

    finishNode<T extends NodeBase>(node: T, type: string) {
        return this.finishNodeAt(
            node,
            type,
            this.state.lastTokenEnd,
            this.state.lastTokenEndLoc
        );
    }

    resetStartLocation(node: NodeBase, start: number, startLoc: Position) {
        node.start = start;
        node.loc.start = startLoc;
        return node;
    }

    resetEndLocation(node: NodeBase, end: number, endLoc: Position) {
        node.end = end;
        node.loc.end = endLoc;
        return node;
    }

    resetStartLocationFromNode(node: NodeBase, locationNode: NodeBase) {
        this.resetStartLocation(node, locationNode.start, locationNode.loc.start);
    }

}

