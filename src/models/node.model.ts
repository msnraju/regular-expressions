import { IQuantifier } from "./quantifier.model";
import { NodeType } from "./node-type.enum";
import { TokenType } from "./token-type.enum";

export interface INode {
    type: NodeType;
    nodes?: Array<INode>;
    quantifier?: IQuantifier;
    tokenType?: TokenType;
    alternate?: INode;
    [key: string]: any;
}
