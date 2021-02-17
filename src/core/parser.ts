import { createRDParser, LexerHandle, ParseTree, ParseNode, parseOneOf } from '&/utils/system/parser';
import { FilteredToken } from './lexer';

type RDParser = (handle: LexerHandle<FilteredToken>) => ParseTree;

const program: RDParser = (handle) => {
  const children = programContents(handle);

  if (!handle.atEOI()) {
    const token = handle.peek();
    throw new Error(`failed to parse 'program'; expected EOI but recieved token ${token.type} (at ${token.location.line}:${token.location.column})`);
  }

  return {
    type: 'program',
    children
  };
};

const programContents = (handle: LexerHandle<FilteredToken>): ParseNode[] => {
  const errors: Error[] = [];

  handle.checkpoint();
  try {
    const node = declaration(handle);
    const following = programContents(handle);
    handle.commit();
    return [node, ...following];
  } catch (e) {
    handle.backtrack();
    errors.push(e);
  }

  try {
    const node = expression(handle);
    const following = programContents(handle);
    handle.commit();
    return [node, ...following];
  } catch (e) {
    handle.backtrack();
    errors.push(e);
  }
  handle.commit();

  return [];
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
  const expr = parseOneOf('expression', handle, [
    parenthesizedExpression,
    fieldAccess,
    func,
    tuple,
    name,
    number,
  ]);

  return {
    type: 'expression',
    children: [expr]
  };
};

const parenthesizedExpression: RDParser = (handle) => {
  handle.consume('(');
  const expr = expression(handle);
  handle.consume(')');

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

const func: RDParser = (handle) => {
  const arg = name(handle);
  handle.consume('=>');
  const expr = expression(handle);

  return {
    type: 'func',
    children: [arg, expr]
  };
};

const tuple: RDParser = (handle) => {
  handle.consume('(');

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
    type: 'tuple',
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
