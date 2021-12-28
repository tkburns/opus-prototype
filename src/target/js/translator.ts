import type * as AST from '&/core/ast.types';
import { transformByType } from '&/utils/nodes';
import * as js from './nodes';

const expression = (node: AST.Expression) => {
  if (node.type === 'name' || node.type === 'tuple' || node.type === 'atom' || node.type === 'bool' || node.type === 'number' || node.type === 'text') {
    return translate(node);
  } else {
    throw new Error(`${node.type} is not fully implemented yet`);
  }
};


export const name = (node: AST.Name): js.Identifier => js.identifier(node.value);

export const tuple = (node: AST.Tuple): js.Object => {
  const memberFields = node.members.reduce((obj, member, index) => ({
    ...obj,
    [`_${index}`]: expression(member)
  }), {});

  return js.object({
    '__opus_kind__': js.string('tuple'),
    size: js.number(node.members.length.toString()),
    ...memberFields
  });
};

export const atom = (node: AST.Atom): js.Symbol => js.symbol(node.value);
export const bool = (node: AST.Bool): js.Boolean => js.boolean(node.value);
export const number = (node: AST.Numeral): js.Number => js.number(node.token.source);
export const text = (node: AST.Text): js.String => js.string(node.value);


export type Translatable = (
  AST.Name |
  AST.Tuple |
  AST.Atom |
  AST.Bool |
  AST.Numeral |
  AST.Text
);

export const translate = (node: Translatable): js.Node => transformByType(node, {
  name,
  tuple,
  atom,
  bool,
  number,
  text
});
