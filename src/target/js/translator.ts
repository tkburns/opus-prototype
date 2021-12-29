import type * as AST from '&/core/ast.types';
import { last } from '&/utils/list';
import { transformByType } from '&/utils/nodes';
import * as js from './nodes';


const expression = (node: AST.Expression) => {
  if (
    node.type === 'name' ||
    node.type === 'function' ||
    node.type === 'thunk' ||
    node.type === 'tuple' ||
    node.type === 'atom' ||
    node.type === 'bool' ||
    node.type === 'number' ||
    node.type === 'text'
  ) {
    return translate(node);
  } else {
    throw new Error(`${node.type} is not fully implemented yet`);
  }
};


export const name = (node: AST.Name): js.Identifier => js.identifier(node.value);


export const func = (node: AST.Func): js.Func => {
  if (node.body.type === 'block-expression') {
    const [body, ret] = funcBody(node.body);
    return js.func([name(node.arg)], body, ret);
  } else {
    return js.func([name(node.arg)], [], expression(node.body));
  }
};

const funcBody = (node: AST.BlockExpression): [js.Expression[], js.Expression | undefined] => {
  const lastEntry = last(node.entries);

  let body = node.entries;
  let ret = undefined;

  if (lastEntry && lastEntry.type !== 'declaration') {
    body = body.slice(0, -1);
    ret = expression(lastEntry);
  }

  return [body.map(blockLine), ret];
};

const blockLine = (node: AST.Declaration | AST.Expression) => {
  if (node.type === 'declaration') {
    throw new Error(`${node.type} is not fully implemented yet`);
  } else {
    return expression(node);
  }
};


export const thunk = (node: AST.Thunk): js.Func => {
  if (node.body.type === 'block-expression') {
    const [body, ret] = funcBody(node.body);
    return js.func([], body, ret);
  } else {
    return js.func([], [], expression(node.body));
  }
};


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
  AST.Func |
  AST.Thunk |
  AST.Tuple |
  AST.Atom |
  AST.Bool |
  AST.Numeral |
  AST.Text
);

export const translate = (node: Translatable): js.Node => transformByType(node, {
  name,
  function: func,
  thunk,
  tuple,
  atom,
  bool,
  number,
  text
});
