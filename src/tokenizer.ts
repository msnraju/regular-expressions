import { IToken, TokenType } from "./models";

export class Tokenizer {
    static tokenize(text: string): Array<IToken> {
        const tokens: Array<IToken> = [];
        let preserve: string = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char == '\\' && preserve == '') {
                preserve = char;
                continue;
            }
        
            if (preserve == '\\') {
                preserve = '';
        
                if (['t', 'n', 'v', 'f', 'r', '0'].indexOf(char) != -1) {
                    // Escape characters
                    switch (char) {
                        case 't':
                            tokens.push({ type: TokenType.Character, value: '\t' });
                            break;
                        case 'n':
                            tokens.push({ type: TokenType.Character, value: '\n' });
                            break;
                        case 'v':
                            tokens.push({ type: TokenType.Character, value: '\v' });
                            break;
                        case 'f':
                            tokens.push({ type: TokenType.Character, value: '\f' });
                            break;
                        case 'r':
                            tokens.push({ type: TokenType.Character, value: '\r' });
                            break;
                        case '0':
                            tokens.push({ type: TokenType.Character, value: '\0' });
                            break;
                    }
        
                } else if (['w', 'W', 'd', 'D', 's', 'S'].indexOf(char) != -1) {
                    switch (char) {
                        case 'w':
                            tokens.push({ type: TokenType.Word, value: '\w' });
                            break;
                        case 'W':
                            tokens.push({ type: TokenType.NotWord, value: '\W' });
                            break;
                        case 'd':
                            tokens.push({ type: TokenType.Digit, value: '\d' });
                            break;
                        case 'D':
                            tokens.push({ type: TokenType.NotDigit, value: '\D' });
                            break;
                        case 's':
                            tokens.push({ type: TokenType.Whitespace, value: '\s' });
                            break;
                        case 'S':
                            tokens.push({ type: TokenType.NotWhitespace, value: '\S' });
                            break;
                    }
                } else {
                    tokens.push({ type: TokenType.Character, value: char });
                }
        
                continue;
            }
        
            if (['.', '?', '^', '*', '+', '|', '-', ','].indexOf(char) != -1) {
                switch (char) {
                    case '.':
                        tokens.push({ type: TokenType.Dot, value: '.' });
                        break;
                    case '?':
                        tokens.push({ type: TokenType.Question, value: '?' });
                        break;
                    case '^':
                        tokens.push({ type: TokenType.Caret, value: '^' });
                        break;
                    case '*':
                        tokens.push({ type: TokenType.Star, value: '*' });
                        break;
                    case '+':
                        tokens.push({ type: TokenType.Plus, value: '+' });
                        break;
                    case '|':
                        tokens.push({ type: TokenType.Pipe, value: '|' });
                        break;
                    case '-':
                        tokens.push({ type: TokenType.Minus, value: '-' });
                        break;
                    case ',':
                        tokens.push({ type: TokenType.Comma, value: ',' });
                        break;
                }
        
                continue;
            }
        
            if (['(', ')', '[', ']', '{', '}'].indexOf(char) != -1) {
                switch (char) {
                    case '(':
                        tokens.push({ type: TokenType.LeftParen, value: '(' });
                        break;
                    case ')':
                        tokens.push({ type: TokenType.RightParen, value: ')' });
                        break;
                    case '[':
                        tokens.push({ type: TokenType.LeftBracket, value: '[' });
                        break;
                    case ']':
                        tokens.push({ type: TokenType.RightBracket, value: ']' });
                        break;
                    case '{':
                        tokens.push({ type: TokenType.LeftBrace, value: '{' });
                        break;
                    case '}':
                        tokens.push({ type: TokenType.RightBrace, value: '}' });
                        break;
                }
        
                continue;
            }
        
        
            tokens.push({ type: TokenType.Character, value: char });
        }
        
        return tokens;
    }
}