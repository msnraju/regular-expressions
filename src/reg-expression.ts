import { Parser } from "./parser";
import { Transformer } from "./transformer";
import { INode, INumberRef, NodeType, ASCII, IMatch } from "./models";
import { Labels } from "./labels";

interface IContext {
    index: INumberRef;
    node: INode;
    input: string;
    match: IMatch;
}

export class RegExpression {
    private expression: string;
    private syntaxTree: INode | undefined;
    private groups: number | undefined;

    constructor(expression: string) {
        this.expression = expression;
    }

    private getSyntaxTree() {
        if (!this.syntaxTree) {
            const group: INumberRef = { value: 0 };
            this.syntaxTree = Transformer.transform(Parser.parse(this.expression), group);
            this.groups = group.value;
        }
    }

    test(input: string, index: number = 0): boolean {
        this.getSyntaxTree();

        const context: IContext = {
            index: { value: index },
            node: this.syntaxTree as INode,
            input: input,
            match: { length: 0 }
        };

        return this.walk(context);
    }

    match(input: string, index: number = 0): IMatch {
        this.getSyntaxTree();
        const match: IMatch = { length: 0 };
        for (let i = 0; this.groups && i <= this.groups; i++) {
            match[i] = '';
        }

        const context: IContext = {
            index: { value: index },
            node: this.syntaxTree as INode,
            input: input,
            match: match
        };

        if (this.walk(context))
            return match;

        return { length: 0 };
    }

    private walk(context: IContext): boolean {
        const { index, node, input } = context;
        const startIndex = index.value;
        if (index.value < input.length) {
            switch (node.type) {
                case NodeType.ROOT:
                    if (this.checkQuantifier(context, this.matchNodes)) {
                        context.match[0] = input.substring(startIndex, index.value);
                        context.match.length = index.value - startIndex;
                        return true;
                    } else
                        return false;
                case NodeType.GROUP:
                    if (this.checkQuantifier(context, this.matchNodes)) {
                        context.match[node.group] = input.substring(startIndex, index.value);
                        return true;
                    } else
                        return false;
                case NodeType.ALTERNATE_SET:
                    return this.checkQuantifier(context, this.matchNodes);
                case NodeType.RANGE:
                    return this.checkQuantifier(context, this.matchRange);
                case NodeType.CHARACTER:
                    return this.checkQuantifier(context, this.matchCharacter);
                case NodeType.CHARACTER_SET:
                    return this.checkQuantifier(context, this.matchCharacterSet);
                case NodeType.DOT:
                    return this.checkQuantifier(context, this.matchDot);
                case NodeType.WHITESPACE:
                    return this.checkQuantifier(context, (context) => this.matchWhitespace(context, true));
                case NodeType.NOT_WHITESPACE:
                    return this.checkQuantifier(context, (context) => this.matchWhitespace(context, false));
                case NodeType.DIGIT:
                    return this.checkQuantifier(context, (context) => this.matchDigit(context, true));
                case NodeType.NOT_DIGIT:
                    return this.checkQuantifier(context, (context) => this.matchDigit(context, false));
                case NodeType.WORD:
                    return this.checkQuantifier(context, (context) => this.matchWord(context, true));
                case NodeType.NOT_WORD:
                    return this.checkQuantifier(context, (context) => this.matchWord(context, false));
                default:
                    throw new Error(Labels.NotImplemented);
            }
        }

        return false;
    }

    private checkQuantifier(context: IContext, matchFunction: (context: IContext) => boolean): boolean {
        const { index, node, input } = context;
        const startIndex = index.value;
        let matchCounter = 0;
        let min: number = 1;
        let max: number = input.length;

        if (!node.quantifier) {
            max = 1;
        } else {
            min = node.quantifier.min;
            max = node.quantifier.max || input.length;
        }

        while (matchCounter < max && matchFunction.bind(this)(context))
            matchCounter++;

        if (matchCounter == 0 && node.alternate)
            if (this.walk({ ...context, node: node.alternate }))
                return true;

        if (matchCounter >= min && matchCounter <= max)
            return true;

        index.value = startIndex;
        return false;
    }

    private matchCharacterSet(context: IContext): boolean {
        const { index, node, input } = context;
        const startIndex = index.value;

        if (!node.nodes)
            return false;

        let i = 0
        if (!node.negated) {
            for (; i < node.nodes.length; i++) {
                if (this.walk({ ...context, node: node.nodes[i] }))
                    break;
            }

            if (i != node.nodes.length)
                return true;
        } else {
            for (; i < node.nodes.length; i++) {
                if (this.walk({ ...context, node: node.nodes[i] }))
                    break;
            }

            if (startIndex == index.value) {
                index.value++;
                return true;
            }
        }

        index.value = startIndex;
        return false;
    }

    private matchWhitespace(context: IContext, isTrue: boolean): boolean {
        const { index, node, input } = context;
        const charCode: number = input.charCodeAt(index.value);

        if ((charCode == ASCII.TAB || charCode == ASCII.LF || charCode == ASCII.SPACE) == isTrue) {
            index.value++;
            return true;
        }

        return false;
    }

    private matchDigit(context: IContext, isTrue: boolean): boolean {
        const { index, input } = context;
        const charCode: number = input.charCodeAt(index.value);

        if ((charCode >= ASCII.ZERO && charCode <= ASCII.NINE) == isTrue) {
            index.value++;
            return true;
        }

        return false;
    }

    private matchWord(context: IContext, isTrue: boolean): boolean {
        const { index, input } = context;
        const charCode: number = input.charCodeAt(index.value);

        if (((charCode >= ASCII.ZERO && charCode <= ASCII.NINE) ||
            (charCode >= ASCII.A && charCode <= ASCII.Z) ||
            (charCode >= ASCII.a && charCode <= ASCII.z) ||
            (charCode == ASCII._)) == isTrue) {
            index.value++;
            return true;
        }

        return false;
    }

    private matchDot(context: IContext): boolean {
        const { index, node, input } = context;
        const charCode: number = input.charCodeAt(index.value);
        if (charCode != ASCII.LF && charCode != ASCII.CR) {
            index.value++;
            return true;
        }

        return false;
    }

    private matchRange(context: IContext): boolean {
        const { index, node, input } = context;

        const fromCode = node.from.charCodeAt(0);
        const toCode = node.to.charCodeAt(0);
        const code = input.charCodeAt(index.value);

        if (code >= fromCode && code <= toCode) {
            index.value++;
            return true;
        }

        return false;
    }

    private matchCharacter(context: IContext): boolean {
        const { index, node, input } = context;
        if (input[index.value] == node.value) {
            index.value++;
            return true;
        }

        return false;
    }

    private matchNodes(context: IContext): boolean {
        const { index, node } = context;
        const startIndex = index.value;
        let i = 0;

        for (i = 0; node.nodes && i < node.nodes.length; i++) {
            if (!this.walk({ ...context, node: node.nodes[i] }))
                break;
        }

        if (node.nodes && i == node.nodes.length)
            return true;

        return false;
    }
}