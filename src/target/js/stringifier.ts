import { transformByType } from '&/utils/nodes';
import { code } from '&/utils/system/stringification';
import * as js from './nodes';

export const identifier = (node: js.Identifier): string => node.name;

/* eslint-disable indent */
export const object = (node: js.Object): string => code`
  {
    ${Object.entries(node.fields).map(([name, value]) =>
      `${name}: ${stringify(value)},`
    )}
  }
`;
/* eslint-enable indent */

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
  js.Object |
  js.Symbol |
  js.Boolean |
  js.Number |
  js.String
);
export const stringify = (node: Stringifyable): string => transformByType(node, {
  identifier,
  object,
  symbol,
  boolean,
  number,
  string
});
