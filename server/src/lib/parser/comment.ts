/* eslint-disable curly */
import { ParserBase } from "../base";
import { Comment, NodeBase } from "../types";

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

export class CommentParser extends ParserBase {

    addComment(comment: Comment) {
        if (this.fileName) comment.loc.fileName = this.fileName;
        this.state.comments.push(comment);
    }

}

