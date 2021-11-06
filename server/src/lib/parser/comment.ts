/* eslint-disable curly */
import * as charCodes from "../util/charcodes";
import { ParserBase } from "../base";
import { CallExpression, Comment, CommentWhitespace, FunctionDeclaration, NodeBase } from "../types";

export function setInnderComments(node: NodeBase, comments: Array<Comment>) {
    if (!node.innerComments) {
        node.innerComments = comments;
    } else {
        node.innerComments.unshift(...comments);
    }
}

export function setLeadingComments(node: NodeBase, comments: Array<Comment>) {
    if (!node.leadingComments) {
        node.leadingComments = comments;
    } else {
        node.leadingComments.unshift(...comments);
    }
}

export function setTrailingComments(node: NodeBase, comments: Array<Comment>) {
    if (!node.trailingComments) {
        node.trailingComments = comments;
    } else {
        node.trailingComments.unshift(...comments);
    }
}

export function adjustInnerComments(node: NodeBase, elements: Array<NodeBase>, commentWS: CommentWhitespace) {
    let lastElement = null;
    let i = elements.length;
    while (lastElement === null && i > 0) {
        lastElement = elements[--i];
    }
    if (lastElement === null || lastElement.start > commentWS.start) {
        setInnderComments(node, commentWS.comments);
    } else {
        setTrailingComments(lastElement, commentWS.comments);
    }
}

export class CommentParser extends ParserBase {

    addComment(comment: Comment) {
        if (this.fileName) comment.loc.fileName = this.fileName;
        this.state.comments.push(comment);
    }

    processComment(node: NodeBase) {
        const { commentStack } = this.state;
        const commentStackLength = commentStack.length;
        if (commentStackLength === 0) {
            return;
        }
        let i = commentStackLength - 1;
        const lastCommentWS = commentStack[i];
        if (lastCommentWS.start === node.end) {
            lastCommentWS.leadingNode = node;
            i--;
        }

        const { start: nodeStart } = node;
        for (; i >= 0; i--) {
            const commentWS = commentStack[i];
            const commentEnd = commentWS.end;
            if (commentEnd > nodeStart) {
                commentWS.containerNode = node;
                this.finalizeComment(commentWS);
                commentStack.splice(i, 1);
            } else {
                if (commentEnd === nodeStart) {
                    commentWS.trailingNode = node;
                }
                break;
            }
        }
    }

    finalizeComment(commentWS: CommentWhitespace) {
        const { comments } = commentWS;
        if (commentWS.leadingNode || commentWS.trailingNode) {
            if (commentWS.leadingNode) {
                setTrailingComments(commentWS.leadingNode, comments);
            }
            if (commentWS.trailingNode) {
                commentWS.trailingNode.leadingComments = comments;
            }
        } else {
            const { containerNode: node, start: commentStart } = commentWS;
            if (!node) {
                return;
            }
            if (this.input.charCodeAt(commentStart - 1) === charCodes.comma) {
                switch (node.type) {
                    case "CallExpression":
                        adjustInnerComments(
                            node,
                            (node as CallExpression).arguments,
                            commentWS);
                        break;
                    case "FunctionDeclaration":
                        adjustInnerComments(
                            node,
                            (node as FunctionDeclaration).params,
                            commentWS);
                        break;
                    default:
                        setInnderComments(node, comments);
                        break;
                }
            } else {
                setInnderComments(node, comments);
            }
        }
    }

    finalizeRemainingComments() {
        const { commentStack } = this.state;
        for (let i = commentStack.length - 1; i >= 0; i--) {
            this.finalizeComment(commentStack[i]);
        }
        this.state.commentStack = [];
    }

    resetPreviousNodeTrailingComments(node: NodeBase) {
        const { commentStack } = this.state;
        const { length } = commentStack;
        if (length === 0) {
            return;
        }
        const commentWS = commentStack[length - 1];
        if (commentWS.leadingNode === node) {
            commentWS.leadingNode = undefined;
        }
    }

}

