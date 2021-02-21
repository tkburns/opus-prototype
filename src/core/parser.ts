import { createRDParser, LexerHandle, ParseTree, repeated, oneOf, optional } from '&/utils/system/parser';
import { FilteredToken } from './lexer';

type RDParser = (handle: LexerHandle<FilteredToken>) => ParseTree;

const program: RDParser = (handle) => {
  const children = repeated(handle, () =>
    oneOf(handle, [
      declaration,
      expression
    ])
  );

  if (!handle.atEOI()) {
    const token = handle.peek();
    throw new Error(`failed to parse 'program'; expected EOI but recieved token ${token.type} (at ${token.location.line}:${token.location.column})`);
  }

  return {
    type: 'program',
    children
  };
};

const declaration: RDParser = (handle) => {
  const vrb = name(handle);
  handle.consume('=');
  const expr = expression(handle);

  return {
    type: 'declaration',
    name: vrb,
    expression: expr,
    children: [vrb, expr]
  };
};

const expression: RDParser = (handle) => {
  const expr = oneOf(handle, [
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
    target,
    method,
    children: [target, method]
  };
};

const func: RDParser = (handle) => {
  const arg = name(handle);
  handle.consume('=>');
  const expr = expression(handle);

  return {
    type: 'func',
    arg,
    body: expr,
    children: [arg, expr]
  };
};

const tuple: RDParser = (handle) => {
  handle.consume('(');

  const members = repeated(handle, () => {
    const member = expression(handle);
    optional(handle, () => {
      handle.consume(',');
    });

    return member;
  });

  handle.consume(')');

  return {
    type: 'tuple',
    members,
    children: members
  };
};

const name: RDParser = (handle) => {
  const token = handle.consume('name');

  return {
    type: 'name',
    value: token.value,
    token
  };
};

const number: RDParser = (handle) => {
  const token = handle.consume('number');

  return {
    type: 'number',
    value: token.value,
    token
  };
};

export const parser = createRDParser(program);
