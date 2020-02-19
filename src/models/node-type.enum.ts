export enum NodeType {
    // GROUPS
    ROOT = 1,
    GROUP = 2,
    CHARACTER_SET = 3,
    RANGE = 4,
    ALTERNATE_SET = 5,

    // CONDITION
    ALTERNATION = 6,

    // SPECIAL SYMBOLS
    WORD = 7,
    NOT_WORD = 8,
    DIGIT = 9,
    NOT_DIGIT = 10,
    WHITESPACE = 11,
    NOT_WHITESPACE = 12,
    DOT = 13,

    // SIMPLE CHARACTERS
    CHARACTER = 14,
}
