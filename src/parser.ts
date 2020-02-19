import { Tokenizer } from "./tokenizer";
import { IToken, TokenType, IQuantifier, INumberRef, INode, NodeType } from "./models";
import { Labels } from "./labels";


interface IParseContext {
    tokens: Array<IToken>;
    parent: INode;
    index: INumberRef; // parent should get the updated index.
}

export class Parser {
    static parse(expression: string): INode {
        const tokens = Tokenizer.tokenize(expression);
        const root: INode = { type: NodeType.ROOT, nodes: [] };

        const context: IParseContext = {
            tokens: tokens,
            parent: root,
            index: { value: 0 }
        };

        this.walk(context);        
        return root;
    }

    private static walk(context: IParseContext) {
        const { tokens, index } = context;
        const nodes: Array<INode> = [];

        while (index.value < tokens.length) {
            let token = tokens[index.value];

            if ((context.parent.type == NodeType.RANGE && token.type == TokenType.RightBrace) ||
                (context.parent.type == NodeType.GROUP && token.type == TokenType.RightParen) ||
                (context.parent.type == NodeType.ALTERNATE_SET && token.type == TokenType.RightParen) ||
                (context.parent.type == NodeType.CHARACTER_SET && token.type == TokenType.RightBracket))
                break; // return to parent

            if (token.type == TokenType.LeftParen) {
                token = tokens[++index.value];
                const newNode: INode = { type: NodeType.GROUP, nodes: [] };
                this.walk({ ...context, parent: newNode });

                nodes.push(newNode);
                token = tokens[index.value];
                if (!token || token.type != TokenType.RightParen)
                    throw new Error(Labels.InvalidExpression);

                token = tokens[++index.value];
                this.setQuantifier(context, newNode);
                this.setAlternate(context, context.parent);
                continue;
            }

            if (token.type == TokenType.LeftBracket) {
                token = tokens[++index.value];
                const newNode: INode = { type: NodeType.CHARACTER_SET, nodes: [] };
                this.walk({ ...context, parent: newNode });
                nodes.push(newNode);

                token = tokens[index.value];
                if (token.type != TokenType.RightBracket)
                    throw new Error(Labels.InvalidExpression);

                token = tokens[++index.value];
                this.setQuantifier(context, newNode);
                this.setAlternate(context, context.parent);
                continue;
            }

            if (context.parent.type == NodeType.CHARACTER_SET &&
                index.value + 2 < tokens.length &&
                tokens[index.value + 1].type == TokenType.Minus) {
                const newNode: INode = {
                    type: NodeType.RANGE, nodes: [
                        this.tokenToNode(token), this.tokenToNode(tokens[index.value + 2])
                    ]
                };
                nodes.push(newNode);
                index.value += 3;
                continue;
            }

            const tokenNode: INode = this.tokenToNode(token);
            nodes.push(tokenNode);
            index.value++;

            if (context.parent.type != NodeType.CHARACTER_SET) {
                this.setQuantifier(context, tokenNode);
                this.setAlternate(context, context.parent);
            }
        }

        context.parent.nodes = nodes;
    }

    private static setAlternate(context: IParseContext, node: INode) {
        const { tokens, index } = context;
        if (index.value >= tokens.length)
            return;

        const token = tokens[index.value];
        if (token.type == TokenType.Pipe) {
            index.value++;

            const newNode: INode = { type: NodeType.ALTERNATE_SET, nodes: [] };
            this.walk({ ...context, parent: newNode });
            node.alternate = newNode;
        }
    }

    private static setQuantifier(context: IParseContext, node: INode) {
        const { tokens, index } = context;
        if (index.value >= tokens.length)
            return;

        let token = tokens[index.value];
        switch (token.type) {
            case TokenType.Star:
                index.value++;
                node.quantifier = { min: 0, max: null };
                break;
            case TokenType.Plus:
                index.value++;
                node.quantifier = { min: 1, max: null };
                break;
            case TokenType.Question:
                index.value++;
                node.quantifier = { min: 0, max: 1 };
                break;
            case TokenType.LeftBrace:
                node.quantifier = this.getRangeQuantifier(context);
                break;
            default:
                node.quantifier = { min: 1, max: 1 };
                break;
        }
    }

    private static getRangeQuantifier(context: IParseContext): IQuantifier {
        const { tokens, index } = context;

        const startIndex = index.value;
        let token = tokens[index.value];
        if (token.type != TokenType.LeftBrace)
            throw new Error(Labels.InvalidExpression);

        token = tokens[++index.value];
        const newNode: INode = { type: NodeType.RANGE, nodes: [] };
        this.walk({ ...context, parent: newNode });
        token = tokens[index.value];
        if (token.type != TokenType.RightBrace)
            throw new Error(Labels.InvalidExpression);

        index.value++;

        let min: number;
        let max: number;
        const nodes: Array<INode> = newNode.nodes as Array<INode> || [];

        if (nodes.length == 3) {
            const [first, second, third] = nodes;

            if (second && second.tokenType != TokenType.Comma)
                throw new Error(Labels.InvalidExpression);

            min = first ? Number(first.value) : 0;
            max = third ? Number(third.value) : 0;
            if (min > max)
                throw new Error(Labels.InvalidExpression);
        }
        else if (nodes.length == 1) {
            const [first] = nodes;

            min = first ? Number(first.value) : 0;
            max = min;
        } else {
            min = 1;
            max = 1;
            index.value = startIndex;
        }

        return { min, max };
    }

    private static tokenToNode(token: IToken): INode {
        return { type: NodeType.CHARACTER, tokenType: token.type, value: token.value };
    }
}