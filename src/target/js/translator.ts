import type * as AST from '&/core/ast.types';
import { transformByType } from '&/utils/nodes';
import * as js from './nodes';

export const name = (node: AST.Name): js.Identifier => js.identifier(node.value);

export const atom = (node: AST.Atom): js.Symbol => js.symbol(node.value);
export const bool = (node: AST.Bool): js.Boolean => js.boolean(node.value);
export const number = (node: AST.Numeral): js.Number => js.number(node.token.source);
export const text = (node: AST.Text): js.String => js.string(node.value);


export type Translatable = (
  AST.Name |
  AST.Atom |
  AST.Bool |
  AST.Numeral |
  AST.Text
);

export const translate = (node: Translatable): js.Node => transformByType(node, {
  name,
  atom,
  bool,
  number,
  text
});
