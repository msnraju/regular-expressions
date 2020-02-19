import { TokenType } from "./token-type.enum";

export interface IToken { 
    type: TokenType; 
    value: string 
}