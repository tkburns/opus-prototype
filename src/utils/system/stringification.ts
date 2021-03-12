import type { TokenBase } from './lexer';
import util from 'util';

/* tokens */

export const stringifyToken = (token: TokenBase): string => {
  if ('value' in token) {
    return `${token.type}(${util.inspect(token.value)})`;
  } else {
    return token.type;
  }
};


/* tree-based structures */

export const indentChild = (str: string, lastChild: boolean): string =>
  lastChild
    ? indent(str, ' └─', '   ')
    : indent(str, ' ├─', ' │ ');

export const indent = (str: string, prefix: string, indentation: string): string =>
  prefix + str.replace(/\r?\n/g, (match) => match + indentation);

export const lines = (...strs: string[]): string =>
  strs.join('\n');
