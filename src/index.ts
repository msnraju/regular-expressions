import { RegExpression } from './reg-expression';
import { IMatch } from './models';

export { RegExpression, IMatch };

// const expr = new RegExpression('OBJECT (\\w*) ([\\d]*) (.*)');
// const match = expr.match('OBJECT Table 18 Customer');
// console.log(JSON.stringify(match, null, 2));