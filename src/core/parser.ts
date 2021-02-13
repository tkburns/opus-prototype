import { createRDParser, LexerHandle, ParseTree, ParseNode } from '&/utils/system/parser';
import { FilteredToken } from './lexer';

type RDParser = (handle: LexerHandle<FilteredToken>) => ParseTree;

const program: RDParser = (handle) => {
  try {
    const dec = declaration(handle);
    return {
      type: 'program',
      children: [dec]
    };
  } catch {}

  try {
    const expr = expression(handle);
    return {
      type: 'program',
      children: [expr]
    };
  } catch {}

  const token = handle.peek();
  throw new Error(`token ${token.type} did not match any rules for 'program'`);
};

const declaration: RDParser = (handle) => {
  const vrb = name(handle);
  handle.consume('=');
  const expr = expression(handle);

  return {
    type: 'declaration',
    children: [vrb, expr]
  };
};

const expression: RDParser = (handle) => {
  let child: ParseNode | undefined;

  try {
    child = parenthesizedExpression(handle);
  } catch {}

  try {
    child = fieldAccess(handle);
  } catch {}

  try {
    child = func(handle);
  } catch {}

  try {
    child = tuple(handle);
  } catch {}

  try {
    child = name(handle);
  } catch {}

  try {
    child = number(handle);
  } catch {}

  if (child == null) {
    const token = handle.peek();
    throw new Error(`token ${token.type} did not match any rules for 'expression'`);
  }

  return {
    type: 'expression',
    children: [child]
  };
};

const parenthesizedExpression: RDParser = (handle) => {
  handle.consume('(');
  const expr = expression(handle);
  handle.consume('(');

  return expr;
};

const fieldAccess: RDParser = (handle) => {
  const target = name(handle);
  handle.consume('.');
  const method = name(handle);

  return {
    type: 'field-access',
    children: [target, method]
  };
};

const func: RDParser = () => {
  throw new Error('func parser not implemented yet');
};

const tuple: RDParser = (handle) => {
  let members: ParseNode[] = [];

  while (handle.peek().type !== ')') {
    const member = expression(handle);
    members = [...members, member];

    const next = handle.peek();
    if (next.type === ',') {
      handle.consume(',');
    }
  }

  handle.consume(')');

  return {
    type: 'program',
    children: members
  };
};

const name: RDParser = (handle) => {
  const token = handle.consume('name');

  return {
    type: 'name',
    token
  };
};

const number: RDParser = (handle) => {
  const token = handle.consume('number');

  return {
    type: 'number',
    token
  };
};

export const parser = createRDParser(program);
