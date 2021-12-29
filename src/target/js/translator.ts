import type * as AST from '&/core/ast.types';
import { last } from '&/utils/list';
import { transformByType } from '&/utils/nodes';
import * as js from './nodes';


const expression = (node: AST.Expression) => {
  if (
    node.type === 'name' ||
    node.type === 'function' ||
    node.type === 'function-application' ||
    node.type === 'thunk' ||
    node.type === 'thunk-force' ||
    node.type === 'tuple' ||
    node.type === 'atom' ||
    node.type === 'bool' ||
    node.type === 'number' ||
    node.type === 'text'
  ) {
    return translate(node);
  } else {
    throw new Error(`${node.type} is not fully implemented yet: \n${JSON.stringify(node, null, 2)}`);
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
    throw new Error(`${node.type} is not fully implemented yet: \n${JSON.stringify(node, null, 2)}`);
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


export const funcApplication = (node: AST.FuncApplication): js.FuncCall =>
  js.funcCall(expression(node.func), [expression(node.arg)]);

export const thunkForce = (node: AST.ThunkForce): js.FuncCall =>
  js.funcCall(expression(node.thunk), []);


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
  AST.FuncApplication |
  AST.Thunk |
  AST.ThunkForce |
  AST.Tuple |
  AST.Atom |
  AST.Bool |
  AST.Numeral |
  AST.Text
);

export const translate = (node: Translatable): js.Node => transformByType(node, {
  name,
  'function': func,
  'function-application': funcApplication,
  thunk,
  'thunk-force': thunkForce,
  tuple,
  atom,
  bool,
  number,
  text
});
