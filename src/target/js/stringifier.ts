import { transformByType } from '&/utils/nodes';
import * as js from './nodes';

export const identifier = (node: js.Identifier): string => node.name;

export const symbol = (node: js.Symbol): string => {
  if (node.name != null) {
    return `Symbol.for('${node.name}')`;
  } else {
    return 'Symbol()';
  }
};

export const boolean = (node: js.Boolean): string => node.value.toString();
export const number = (node: js.Number): string => node.value;
export const string = (node: js.String): string => `'${node.value}'`;


export type Stringifyable = (
  js.Identifier |
  js.Symbol |
  js.Boolean |
  js.Number |
  js.String
);
export const stringify = (node: Stringifyable): string => transformByType(node, {
  identifier,
  symbol,
  boolean,
  number,
  string
});
