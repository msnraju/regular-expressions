# regular-expression
Custom implementation of regular expressions

# Installation

```sh
npm install @msnraju/regular-expressions
```

# Usage

```javascript
import { RegExpression } from '@msnraju/reg-expressions';

const expr = new RegExpression('OBJECT (\\w*) ([\\d]*) (.*)');
const match = expr.match('OBJECT Table 18 Customer');
console.log(JSON.stringify(match, null, 2));

```
## Output
```
{
  "0": "OBJECT Table 18 Customer",
  "1": "Table",
  "2": "18",
  "3": "Customer",
  "length": 40
}
```