import type * as AST from '&/core/ast.types';
import { last } from '&/utils/list';
import { mapByType, Typed } from '&/utils/nodes';
import * as js from './nodes';


export const declaration = (node: AST.Declaration): js.Statement =>
  js.declaration(name(node.name), expression(node.expression));


const expression = (node: AST.Expression) =>
  translateAll(node) as js.Expression;


export const blockExpression = (node: AST.BlockExpression): js.IIFE => {
  const [body, ret] = blockBody(node);
  return js.iife(body, ret);
};

const blockBody = (node: AST.BlockExpression): [js.Statement[], js.Expression | undefined] => {
  const lastEntry = last(node.entries);

  let body = node.entries;
  let ret = undefined;

  if (lastEntry && lastEntry.type !== 'declaration') {
    body = body.slice(0, -1);
    ret = expression(lastEntry);
  }

  return [body.map(translateAll), ret];
};


export const func = (node: AST.Func): js.Func => {
  if (node.body.type === 'block-expression') {
    const [body, ret] = blockBody(node.body);
    return js.func([name(node.arg)], body, ret);
  } else {
    return js.func([name(node.arg)], [], expression(node.body));
  }
};

export const thunk = (node: AST.Thunk): js.Func => {
  if (node.body.type === 'block-expression') {
    const [body, ret] = blockBody(node.body);
    return js.func([], body, ret);
  } else {
    return js.func([], [], expression(node.body));
  }
};


export const funcApplication = (node: AST.FuncApplication): js.FuncCall =>
  js.funcCall(expression(node.func), [expression(node.arg)]);

export const thunkForce = (node: AST.ThunkForce): js.FuncCall =>
  js.funcCall(expression(node.thunk), []);


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


/* using a generic here unfortunately breaks the return type inference of translate */
const translateAll = <N extends AST.Declaration | AST.Expression>(node: N) => {
  if (node.type === 'match') {
    throw new Error(`${node.type} is not fully implemented yet: \n${JSON.stringify(node, null, 2)}`);
  } else {
    return translate(node);
  }
};


const translators = {
  declaration,
  'block-expression': blockExpression,
  'function': func,
  'function-application': funcApplication,
  thunk,
  'thunk-force': thunkForce,
  name,
  tuple,
  atom,
  bool,
  number,
  text
};
export type Translatable = Extract<AST.Node, Typed<keyof typeof translators>>;
export const translate = mapByType(translators);


